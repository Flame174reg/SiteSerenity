// src/app/api/admin/toggle/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

async function ensureSchema() {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS users (
      discord_id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      avatar_url TEXT,
      last_login_at TIMESTAMPTZ
    );
  `;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
      role TEXT NOT NULL
    );
  `;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false }, { status: 401 });

    const OWNER_ID = "1195944713639960601";
    if (me !== OWNER_ID) return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await req.json().catch(() => null)) as
      | { id?: string; admin?: boolean }
      | null;

    if (!body?.id || typeof body.admin !== "boolean") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await ensureSchema();

    if (body.admin) {
      await sql/*sql*/`
        INSERT INTO uploaders (discord_id, role)
        VALUES (${body.id}, 'admin')
        ON CONFLICT (discord_id) DO UPDATE SET role = 'admin';
      `;
    } else {
      await sql/*sql*/`DELETE FROM uploaders WHERE discord_id = ${body.id}`;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "db_error", detail: String(err) },
      { status: 200 }
    );
  }
}
