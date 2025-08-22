// src/app/api/admin/toggle/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureTables } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false }, { status: 401 });

    const OWNER_ID = "1195944713639960601";
    if (me !== OWNER_ID) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as
      | { id?: string; admin?: boolean }
      | null;

    if (!body?.id || typeof body.admin !== "boolean") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await ensureTables();

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
    console.error("POST /api/admin/toggle failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
