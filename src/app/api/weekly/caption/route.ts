// src/app/api/weekly/caption/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

async function ensureTable() {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      blob_key TEXT PRIMARY KEY,
      caption  TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}

async function canManage(): Promise<{ ok: true } | { ok: false; reason: string }> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return { ok: false, reason: "unauthenticated" };

  const OWNER_ID = "1195944713639960601";
  if (id === OWNER_ID) return { ok: true };

  try {
    await sql/*sql*/`
      CREATE TABLE IF NOT EXISTS uploaders (
        discord_id TEXT PRIMARY KEY,
        role TEXT NOT NULL
      );
    `;
    const { rows } = await sql/*sql*/`SELECT role FROM uploaders WHERE discord_id = ${id}`;
    if (rows[0]?.role === "admin") return { ok: true };
  } catch {
    // если БД не отвечает — лучше запретить
  }
  return { ok: false, reason: "forbidden" };
}

export async function POST(req: Request) {
  const perm = await canManage();
  if (!perm.ok) {
    return NextResponse.json({ ok: false, reason: perm.reason }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 200 });
  }

  const key = typeof (body as Record<string, unknown>).key === "string"
    ? (body as Record<string, string>).key
    : "";
  const caption = typeof (body as Record<string, unknown>).caption === "string"
    ? (body as Record<string, string>).caption.trim()
    : "";

  if (!key) return NextResponse.json({ ok: false, error: "no_key" }, { status: 200 });

  try {
    await ensureTable();
    await sql/*sql*/`
      INSERT INTO weekly_photos (blob_key, caption)
      VALUES (${key}, ${caption})
      ON CONFLICT (blob_key) DO UPDATE SET caption = EXCLUDED.caption
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
