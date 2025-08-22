// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureTables, listUsersForAdmin } from "@/lib/db";
import { isSuperAdmin, SUPER_ADMIN_ID } from "@/lib/access";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

type RowOut = {
  id: string;
  name?: string | null;
  avatar?: string | null;
  lastSeen: string;
  isAdmin: boolean;
  isOwner: boolean;
};

export async function GET() {
  const session = await auth();
  const requester =
    (session as unknown as { discordId?: string })?.discordId ?? null;

  if (!isSuperAdmin(requester)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await ensureTables();

  const users = await listUsersForAdmin();
  const uploaders = await sql<{ discord_id: string }>`
    SELECT discord_id FROM uploaders
  `;
  const upSet = new Set(uploaders.rows.map((r) => r.discord_id));

  const payload: RowOut[] = users.map((u) => ({
    id: u.discord_id,
    name: u.name,
    avatar: u.avatar ?? undefined,
    lastSeen: u.last_login_at,
    isAdmin: upSet.has(u.discord_id),
    isOwner: u.discord_id === SUPER_ADMIN_ID,
  }));

  return NextResponse.json({ users: payload });
}
