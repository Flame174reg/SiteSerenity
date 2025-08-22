// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/access";
import { ensureTables } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const discordId = (session as any)?.discordId;
  if (!discordId || !isSuperAdmin(discordId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await ensureTables();
  const { rows } = await sql/*sql*/`
    SELECT discord_id, name, email, avatar_url, last_login_at
    FROM users
    ORDER BY last_login_at DESC
    LIMIT 200
  `;
  return NextResponse.json({ users: rows });
}
