// src/app/api/weekly/photo/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { del } from "@vercel/blob";

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

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    if (!(await isAdminOrOwner(me))) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as { key?: string; url?: string } | null;
    const key = (body?.key ?? "").trim();
    const url = (body?.url ?? "").trim();

    if (!key && !url) {
      return NextResponse.json({ ok: false, error: "key or url is required" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN || undefined;

    // Удаляем blob
    await del(url || key, { token });

    // Чистим подпись
    try {
      await sql/* sql */`DELETE FROM weekly_photos WHERE key = ${key || url}`;
    } catch {
      // ок, если таблицы нет
    }

    return NextResponse.json({ ok: true, key: key || url });
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
