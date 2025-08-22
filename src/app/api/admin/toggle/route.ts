import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { setAdmin, OWNER_ID } from "@/lib/adminStore";

type SessionLike = { discordId?: string };

export async function POST(req: Request) {
  const session = (await auth()) as unknown as SessionLike | null;
  if (!session?.discordId || session.discordId !== OWNER_ID) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id, admin } = (await req.json()) as { id: string; admin: boolean };
  if (!id) return NextResponse.json({ error: "NO_ID" }, { status: 400 });

  await setAdmin(id, admin);
  return NextResponse.json({ ok: true });
}
