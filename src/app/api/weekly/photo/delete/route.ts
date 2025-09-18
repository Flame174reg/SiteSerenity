// src/app/api/weekly/photo/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { del } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    if (!(await isAdminOrOwner(me))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => null)) as { key?: string; url?: string } | null;
    const key = (body?.key ?? "").trim();
    const url = (body?.url ?? "").trim();

    if (!key || !url) {
      return NextResponse.json({ ok: false, error: "key and url are required" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN || undefined;

    await del(url, { token });

    try {
      await sql/* sql */`
        DELETE FROM weekly_photos WHERE key = ${key}
      `;
    } catch {
      // если нет таблицы — игнор
    }

    return NextResponse.json({ ok: true, key });
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
