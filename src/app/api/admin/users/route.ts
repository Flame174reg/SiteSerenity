import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsers, getAdmins, OWNER_ID } from "@/lib/adminStore";

type SessionLike = { discordId?: string };

export async function GET() {
  const session = (await auth()) as unknown as SessionLike | null;
  if (!session?.discordId || session.discordId !== OWNER_ID) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const [users, admins] = await Promise.all([getUsers(), getAdmins()]);
  const rows = users.map((u) => ({
    ...u,
    isAdmin: admins.has(u.id),
    isOwner: u.id === OWNER_ID,
  }));

  return NextResponse.json({ users: rows });
}
