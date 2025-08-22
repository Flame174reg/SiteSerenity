// src/app/api/admin/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureTables, setUploader } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";

export const dynamic = "force-dynamic";

type Body = { id?: string; admin?: boolean };

export async function POST(req: NextRequest) {
  const session = await auth();
  const requester =
    (session as unknown as { discordId?: string })?.discordId ?? null;

  if (!isSuperAdmin(requester)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  const id = body.id?.trim();
  const admin = Boolean(body.admin);
  if (!id) return new NextResponse("Missing id", { status: 400 });

  await ensureTables();
  await setUploader(id, admin);

  return NextResponse.json({ ok: true });
}
