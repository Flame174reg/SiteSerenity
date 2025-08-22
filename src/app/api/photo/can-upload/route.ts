import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionShape = { discordId?: string } | null;

export async function GET() {
  const session = (await auth()) as SessionShape;
  const discordId = session?.discordId;

  if (!discordId) {
    return NextResponse.json({ allowed: false }, { status: 401 });
  }

  await ensureTables();

  // Проверяем доступ через наличие записи или суперадмина
  const { rows } = await sql<{ exists: number }>`
    SELECT 1 AS exists
    FROM uploaders
    WHERE discord_id = ${discordId}
    LIMIT 1
  `;
  const allowed = rows.length > 0 || isSuperAdmin(discordId);

  return NextResponse.json({ allowed });
}
