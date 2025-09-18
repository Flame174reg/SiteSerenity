// src/app/api/admin/roles/route.ts
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OWNER_ID = "1195944713639960601";

type RolesMap = Record<string, { isAdmin: boolean; isSuperAdmin: boolean }>;
type Ok = { ok: true; roles: RolesMap };
type NotOk = { ok: false; error: string };

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function ensureSchema() {
  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT NOT NULL DEFAULT 'admin',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql/* sql */`ALTER TABLE uploaders ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<NotOk>({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as unknown;
    if (!isRec(body) || !Array.isArray((body as any).ids)) {
      return NextResponse.json<NotOk>({ ok: false, error: "ids[] required" }, { status: 400 });
    }
    const ids = (body as { ids: unknown[] }).ids.map(String);

    await ensureSchema();

    const res = await sql/* sql */`
      SELECT discord_id, role FROM uploaders WHERE discord_id = ANY(${ids})
    `;

    const map: RolesMap = {};
    for (const id of ids) {
      const row = res.rows.find((r) => r.discord_id === id) as { discord_id: string; role?: string } | undefined;
      const role = row?.role;
      const isOwner = id === OWNER_ID;
      const isSuperAdmin = isOwner || role === "superadmin";
      const isAdmin = isSuperAdmin || role === "admin";
      map[id] = { isAdmin, isSuperAdmin };
    }

    return NextResponse.json<Ok>({ ok: true, roles: map });
  } catch (e) {
    return NextResponse.json<NotOk>({ ok: false, error: String(e) }, { status: 500 });
  }
}
