// src/app/api/weekly/delete/route.ts
import { NextResponse } from "next/server";
import { del, list } from "@vercel/blob";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

async function canManage() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return { ok: false as const, reason: "unauthenticated" };

  const OWNER_ID = "1195944713639960601";
  if (id === OWNER_ID) return { ok: true as const };

  try {
    await sql/*sql*/`
      CREATE TABLE IF NOT EXISTS uploaders (
        discord_id TEXT PRIMARY KEY,
        role TEXT NOT NULL
      );
    `;
    const { rows } = await sql/*sql*/`
      SELECT role FROM uploaders WHERE discord_id = ${id}
    `;
    if (rows[0]?.role === "admin") return { ok: true as const };
  } catch {
    // если БД не отвечает — лучше запретить, чем разрешить
  }
  return { ok: false as const, reason: "forbidden" };
}

export async function POST(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "no_token" }, { status: 200 });
  }

  const perm = await canManage();
  if (!perm.ok) {
    return NextResponse.json({ ok: false, reason: perm.reason }, { status: 200 });
  }

  type Body = { key?: unknown; safe?: unknown; all?: unknown };
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    // ignore
  }

  const key = typeof body.key === "string" ? body.key : null;
  const safe = typeof body.safe === "string" ? body.safe : null;
  const all = body.all === true;

  try {
    if (key) {
      await del(key, { token });
      await sql/*sql*/`DELETE FROM weekly_photos WHERE blob_key = ${key}`;
      return NextResponse.json({ ok: true, deleted: 1 });
    }

    if (safe && all) {
      const { blobs } = await list({ prefix: `weekly/${safe}/`, limit: 10_000, token });
      const keys = blobs.map((b) => b.pathname);
      if (keys.length > 0) {
        await del(keys, { token });
      }
      await sql/*sql*/`DELETE FROM weekly_photos WHERE blob_key LIKE ${`weekly/${safe}/%`}`;
      return NextResponse.json({ ok: true, deleted: keys.length });
    }

    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
