import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { upsertUser } from "@/lib/adminStore";

type SessionLike = { discordId?: string; user?: { name?: string; image?: string } };

export async function POST() {
  const session = (await auth()) as unknown as SessionLike | null;
  const discordId = session?.discordId;
  if (!discordId) return NextResponse.json({ ok: false }, { status: 401 });

  await upsertUser({
    id: discordId,
    name: session?.user?.name,
    avatar: session?.user?.image,
    lastSeen: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
