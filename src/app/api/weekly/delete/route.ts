// src/app/api/weekly/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { del } from "@vercel/blob";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

async function ensureTables() {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      blob_key TEXT PRIMARY KEY,
      caption  TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT NOT NULL
    );
  `;
}

async function canManage() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return false;

  const OWNER_ID = "1195944713639960601";
  if (id === OWNER_ID) return true;

  try {
    const { rows } = await sql/*sql*/`SELECT role FROM uploaders WHERE discord_id = ${id}`;
    return rows[0]?.role === "admin";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await canManage())) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 200 });
  }

  let key = "";
  try {
    const body = (await req.json()) as { key?: string };
    key = body?.key ?? "";
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 200 });
  }
  if (!key) return NextResponse.json({ ok: false, error: "no_key" }, { status: 200 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: "no_blob_token" }, { status: 200 });

  try {
    await ensureTables();

    // 1) удаляем сам blob
    await del(key, { token }); // key вида "weekly/<safe>/<filename>"

    // 2) чистим подпись
    await sql/*sql*/`DELETE FROM weekly_photos WHERE blob_key = ${key}`;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
