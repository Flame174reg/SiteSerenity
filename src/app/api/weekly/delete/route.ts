// src/app/api/weekly/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { del } from "@vercel/blob";

export const dynamic = "force-dynamic";

const OWNER_ID = "1195944713639960601";

async function ensureTables() {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT NOT NULL
    );
  `;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      url TEXT,
      category TEXT,
      caption TEXT,
      uploaded_by TEXT,
      uploaded_at TIMESTAMPTZ
    );
  `;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS key TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS url TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS category TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS caption TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploaded_by TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();`;
  await sql/*sql*/`
    CREATE UNIQUE INDEX IF NOT EXISTS weekly_photos_key_unique ON weekly_photos(key);
  `;
}

async function isAdmin(discordId: string): Promise<boolean> {
  await ensureTables();
  const { rows } = await sql/*sql*/`
    SELECT 1 FROM uploaders WHERE discord_id = ${discordId} AND role = 'admin' LIMIT 1;
  `;
  return rows.length > 0 || discordId === OWNER_ID;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
    if (!(await isAdmin(me))) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

    const body: unknown = await req.json().catch(() => null);
    const key = typeof (body as { key?: unknown })?.key === "string" ? (body as { key: string }).key : "";
    if (!key.startsWith("weekly/")) {
      return NextResponse.json({ ok: false, reason: "bad_key" }, { status: 400 });
    }

    await ensureTables();
    await del(key);
    await sql/*sql*/`DELETE FROM weekly_photos WHERE key = ${key};`;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
