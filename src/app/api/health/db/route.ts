// src/app/api/health/db/route.ts
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await sql`select now() as now, current_user as "user";`;
    return NextResponse.json({ ok: true, info: rows[0] });
  } catch (e) {
    console.error("DB health failed", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
