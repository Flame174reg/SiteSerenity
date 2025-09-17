// src/app/api/weekly/folder/create/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // гарантируем Node runtime

const OWNER_ID = "1195944713639960601";

async function isAdmin(id: string) {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT NOT NULL
    );
  `;
  const { rows } = await sql/*sql*/`
    SELECT 1 FROM uploaders WHERE discord_id = ${id} AND role='admin' LIMIT 1;
  `;
  return rows.length > 0 || id === OWNER_ID;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
    if (!(await isAdmin(me))) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

    const bodyRaw: unknown = await req.json().catch(() => null);
    if (typeof bodyRaw !== "object" || bodyRaw === null) {
      return NextResponse.json({ ok: false, reason: "bad_body" }, { status: 400 });
    }

    const name = String((bodyRaw as { name?: unknown }).name ?? "").trim();
    if (!name || name.includes("/") || name.length > 64) {
      return NextResponse.json({ ok: false, reason: "bad_name" }, { status: 400 });
    }

    const safe = encodeURIComponent(name);
    const key = `weekly/${safe}/.keep`;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ ok: false, reason: "blob_token_missing" }, { status: 500 });
    }

    // Кладём небольшой Blob — SDK сам выставит content-length
    const blob = new Blob(["keep"], { type: "text/plain; charset=utf-8" });

    await put(key, blob, {
      access: "public",
      token,
      contentType: blob.type,
    });

    return NextResponse.json({ ok: true, name, safe });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
