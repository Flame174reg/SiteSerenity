// src/app/api/weekly/caption/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Discord ID владельца (как у тебя в проекте)
const OWNER_ID = "1195944713639960601";

async function isAdminOrOwner(userId: string): Promise<boolean> {
  if (userId === OWNER_ID) return true;
  try {
    const { rows } = await sql/* sql */`
      SELECT role FROM uploaders WHERE discord_id = ${userId} LIMIT 1
    `;
    return rows.length > 0 && rows[0].role === "admin";
  } catch {
    return false;
  }
}

/**
 * Идемпотентная миграция: создаём таблицу при отсутствии
 * и добавляем недостающие колонки, если таблица уже была старая.
 */
async function ensureSchema() {
  // создаём «скелет», если таблицы нет
  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      key TEXT PRIMARY KEY
    )
  `;

  // добиваем недостающие колонки (важно для уже созданной ранее таблицы)
  await sql/* sql */`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS caption TEXT`;
  await sql/* sql */`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploader_id TEXT`;
  await sql/* sql */`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW()`;
  await sql/* sql */`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }
    if (!(await isAdminOrOwner(me))) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as { key?: string; caption?: string } | null;
    const key = (body?.key ?? "").trim();
    const caption = (body?.caption ?? "").trim();
    if (!key) {
      return NextResponse.json({ ok: false, error: "key is required" }, { status: 400 });
    }

    await ensureSchema();

    await sql/* sql */`
      INSERT INTO weekly_photos (key, caption, uploader_id, updated_at)
      VALUES (${key}, ${caption || null}, ${me}, NOW())
      ON CONFLICT (key) DO UPDATE
      SET caption = EXCLUDED.caption,
          uploader_id = EXCLUDED.uploader_id,
          updated_at = NOW()
    `;

    return NextResponse.json({ ok: true, key, caption: caption || null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
