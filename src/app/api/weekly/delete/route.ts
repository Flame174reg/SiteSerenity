// src/app/api/weekly/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { del } from "@vercel/blob";

export const dynamic = "force-dynamic";

const OWNER_ID = "1195944713639960601";

async function isAdmin(discordId: string): Promise<boolean> {
  const { rows } = await sql/*sql*/`
    SELECT 1 FROM uploaders
    WHERE discord_id = ${discordId} AND role = 'admin'
    LIMIT 1;
  `;
  return rows.length > 0 || discordId === OWNER_ID;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
    if (!(await isAdmin(me))) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

    const { key } = await req.json().catch(() => ({ key: "" as string }));
    if (typeof key !== "string" || !key.startsWith("weekly/")) {
      return NextResponse.json({ ok: false, reason: "bad_key" }, { status: 400 });
    }

    await del(key);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
