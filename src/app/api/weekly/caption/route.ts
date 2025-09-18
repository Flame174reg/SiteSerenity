// src/app/api/weekly/caption/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Discord ID владельца (как в проекте)
const OWNER_ID = "1195944713639960601";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function isAdminOrOwner(userId: string): Promise<boolean> {
  if (userId === OWNER_ID) return true;
  try {
    const res = await sql/* sql */`
      SELECT role FROM uploaders WHERE discord_id = ${userId} LIMIT 1
    `;
    return res.rows.length > 0 && res.rows[0].role === "admin";
  } catch {
    return false;
  }
}

/** Идемпотентная миграция: создаём таблицу/колонки и снимаем NOT NULL с url при необходимости */
async function ensureSchema() {
  // 1) базовая таблица (если ранее не существовала)
  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      key TEXT PRIMARY KEY
    )
  `;

  // 2) гарантируем наличие нужных колонок
  await sql/* sql */`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS url TEXT`;
  await sql/* sql */`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS caption TEXT`;
  await sql/* sql */`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploader_id TEXT`;
  await sql/* sql */`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW()`;
  await sql/* sql */`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ`;

  // 3) если url существует, но с ограничением NOT NULL — снимем его
  const q = await sql/* sql */`
    SELECT is_nullable
    FROM information_schema.columns
    WHERE table_name = 'weekly_photos' AND column_name = 'url'
    LIMIT 1
  `;
  const row = q.rows[0] as { is_nullable?: string } | undefined;
  if (row && row.is_nullable === "NO") {
    await sql/* sql */`ALTER TABLE weekly_photos ALTER COLUMN url DROP NOT NULL`;
  }
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

    const body = (await req.json().catch(() => null)) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
    }

    const keyRaw = body["key"];
    const captionRaw = body["caption"];
    const urlRaw = body["url"];

    const key = typeof keyRaw === "string" ? keyRaw.trim() : "";
    const caption = typeof captionRaw === "string" ? captionRaw.trim() : "";
    const url = typeof urlRaw === "string" ? urlRaw.trim() : "";

    if (!key) {
      return NextResponse.json({ ok: false, error: "key is required" }, { status: 400 });
    }

    await ensureSchema();

    // Если записи нет — создадим; если есть — обновим.
    await sql/* sql */`
      INSERT INTO weekly_photos (key, url, caption, uploader_id, updated_at)
      VALUES (${key}, ${url || null}, ${caption || null}, ${me}, NOW())
      ON CONFLICT (key) DO UPDATE
      SET url         = COALESCE(EXCLUDED.url, weekly_photos.url),
          caption     = EXCLUDED.caption,
          uploader_id = EXCLUDED.uploader_id,
          updated_at  = NOW()
    `;

    return NextResponse.json({ ok: true, key, caption: caption || null, url: url || null });
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
