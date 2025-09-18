// src/app/api/weekly/folder/caption/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

async function ensureSchema() {
  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS weekly_albums (
      safe TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      caption TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );
  `;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    if (!(await isAdminOrOwner(me))) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as { safe?: string; name?: string; caption?: string } | null;
    const safe = (body?.safe ?? "").trim();
    const name = (body?.name ?? decodeURIComponent(safe)).trim();
    const caption = (body?.caption ?? "").trim();

    if (!safe) return NextResponse.json({ ok: false, error: "safe is required" }, { status: 400 });

    await ensureSchema();

    await sql/* sql */`
      INSERT INTO weekly_albums (safe, name, caption, updated_at)
      VALUES (${safe}, ${name}, ${caption || null}, NOW())
      ON CONFLICT (safe) DO UPDATE
      SET name = EXCLUDED.name,
          caption = EXCLUDED.caption,
          updated_at = NOW();
    `;

    return NextResponse.json({ ok: true, safe, name, caption: caption || null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
export function HEAD() {
  return new Response(null, { status: 200 });
}
