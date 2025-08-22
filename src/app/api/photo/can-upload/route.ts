// src/app/api/photo/can-upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionShape = { discordId?: string } | null;

export async function GET() {
  // получаем сессию и аккуратно достаём discordId без any
  const session = (await auth()) as SessionShape;
  const discordId = session?.discordId;

  // если не авторизован — запрет
  if (!discordId) {
    return NextResponse.json({ allowed: false }, { status: 401 });
  }

  // убеждаемся, что таблицы есть
  await ensureTables();

  // проверяем наличие в списке аплоадеров или суперадмина
  const res = await sql<{ exists: number }>`
    SELECT 1 as exists
    FROM uploaders
    WHERE discord_id = ${discordId}
    LIMIT 1
  `;
  const allowed = res.rowCount > 0 || isSuperAdmin(discordId);

  return NextResponse.json({ allowed });
}
