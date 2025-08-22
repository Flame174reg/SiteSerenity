// src/app/api/health/session/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  return NextResponse.json({
    ok: Boolean(session),
    user: session?.user ?? null,
    discordId: session?.user?.id ?? null,
  });
}
