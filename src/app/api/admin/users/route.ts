// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureTables } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  // Разрешим только залогиненному владельцу / админу видеть список
  const me = (session as any)?.discordId as string | undefined;
  if (!me) return NextResponse.json({ users: [] });

  await ensureTables();

  // Определяем, владелец ли (ваш Discord ID)
  const OWNER_ID = "1195944713639960601";

  const { rows } = await sql/*sql*/`
    SELECT
      u.discord_id AS id,
      COALESCE(u.name, '') AS name,
      u.avatar_url AS avatar,
      COALESCE(u.last_login_at, NOW()) AS last_seen,
      CASE WHEN up.role = 'admin' THEN TRUE ELSE FALSE END AS is_admin
    FROM users u
    LEFT JOIN uploaders up ON up.discord_id = u.discord_id
    ORDER BY u.last_login_at DESC NULLS LAST
    LIMIT 500;
  `;

  const users = rows.map((r) => ({
    id: r.id as string,
    name: (r.name as string) || "Без имени",
    avatar: (r.avatar as string) || null,
    lastSeen: (r.last_seen as Date).toISOString(),
    isAdmin: Boolean(r.is_admin),
    isOwner: r.id === OWNER_ID,
  }));

  return NextResponse.json({ users });
}
