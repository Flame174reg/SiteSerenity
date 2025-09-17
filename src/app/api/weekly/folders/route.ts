// src/app/api/weekly/folder/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { list, del } from "@vercel/blob";
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

  let safe = "";
  try {
    const body = (await req.json()) as { safe?: string };
    safe = body?.safe ?? "";
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 200 });
  }
  if (!safe) return NextResponse.json({ ok: false, error: "no_safe" }, { status: 200 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: "no_blob_token" }, { status: 200 });

  try {
    await ensureTables();

    // список всех файлов в папке
    const prefix = `weekly/${safe}/`;
    const { blobs } = await list({ prefix, limit: 1000 });

    const keys = blobs
      .filter(b => !b.pathname.endsWith("/"))
      .map(b => b.pathname); // это то же самое, что key, подходит для del()

    if (keys.length > 0) {
      // удалить blobs
      await del(keys, { token });

      // удалить подписи по ключам (простым циклом, чтобы не упираться в sql.array)
      for (const k of keys) {
        // eslint-disable-next-line no-await-in-loop
        await sql/*sql*/`DELETE FROM weekly_photos WHERE blob_key = ${k}`;
      }
    }

    return NextResponse.json({ ok: true, removed: keys.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
