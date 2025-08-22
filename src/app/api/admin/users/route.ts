import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureTables } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";
import { sql } from "@vercel/postgres";

// то, что отдаём на клиент в /admin
type Row = {
  id: string;
  name?: string;
  avatar?: string;
  lastSeen: string;
  isAdmin: boolean;
  isOwner: boolean;
};

export async function GET() {
  // доступ только владельцу (или расширите логику по желанию)
  const session = await auth();
  const discordId =
    (session as unknown as { discordId?: string } | null)?.discordId;

  if (!discordId || !isSuperAdmin(discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureTables();

  // ВАЖНО: ниже предполагается таблица users(discord_id, name, avatar, last_login_at)
  // Если у вас колонка называется avatar_url — замените u.avatar на u.avatar_url.
  const res = await sql<{
    discord_id: string;
    name: string | null;
    avatar: string | null;
    last_login_at: string | null;
    role: string | null;
  }>`
    SELECT
      u.discord_id,
      u.name,
      u.avatar,
      u.last_login_at,
      up.role
    FROM users u
    LEFT JOIN uploaders up ON up.discord_id = u.discord_id
    ORDER BY u.last_login_at DESC NULLS LAST;
  `;

  const users: Row[] = res.rows.map((r) => ({
    id: r.discord_id,
    name: r.name ?? undefined,
    avatar: r.avatar ?? undefined,
    lastSeen: r.last_login_at ?? new Date(0).toISOString(),
    isAdmin: (r.role ?? "") === "uploader",
    isOwner: isSuperAdmin(r.discord_id),
  }));

  return NextResponse.json({ users });
}
