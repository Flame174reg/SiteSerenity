// src/app/api/weekly/caption/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

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

    const body = (await req.json().catch(() => null)) as { key?: string; caption?: string | null } | null;
    const key = (body?.key ?? "").trim();
    const caption = body?.caption ?? null;
    if (!key) return NextResponse.json({ ok: false, error: "key is required" }, { status: 400 });

    await sql/* sql */`
      CREATE TABLE IF NOT EXISTS weekly_photos (
        key TEXT PRIMARY KEY,
        caption TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql/* sql */`
      INSERT INTO weekly_photos (key, caption, updated_at)
      VALUES (${key}, ${caption}, NOW())
      ON CONFLICT (key) DO UPDATE
      SET caption = EXCLUDED.caption,
          updated_at = NOW();
    `;

    return NextResponse.json({ ok: true, key, caption });
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
