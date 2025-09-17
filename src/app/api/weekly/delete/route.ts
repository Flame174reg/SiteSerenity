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
      key TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      caption TEXT,
      uploaded_by TEXT,
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
    );
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

    const { key } = await req.json().catch(() => ({ key: "" as string }));
    if (typeof key !== "string" || !key.startsWith("weekly/")) {
      return NextResponse.json({ ok: false, reason: "bad_key" }, { status: 400 });
    }

    await del(key);
    await sql/*sql*/`DELETE FROM weekly_photos WHERE key = ${key};`;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
