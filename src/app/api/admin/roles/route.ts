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

    const bodyUnknown = await req.json().catch(() => null) as unknown;
    if (!isRec(bodyUnknown)) {
      return NextResponse.json<NotOk>({ ok: false, error: "invalid json" }, { status: 400 });
    }

    const idsUnknown = (bodyUnknown as { ids?: unknown }).ids;
    if (!Array.isArray(idsUnknown)) {
      return NextResponse.json<NotOk>({ ok: false, error: "ids[] required" }, { status: 400 });
    }

    // Нормализуем в массив строк
    const ids: string[] = idsUnknown.map((v) => String(v)).filter((s) => s.trim().length > 0);
    if (ids.length === 0) {
      return NextResponse.json<Ok>({ ok: true, roles: {} });
    }

    await ensureSchema();

    const res = await sql/* sql */`
      SELECT discord_id, role FROM uploaders WHERE discord_id = ANY(${ids})
    `;

    const roles: RolesMap = {};
    // Сначала заполним дефолты
    for (const id of ids) {
      const isOwner = id === OWNER_ID;
      roles[id] = { isAdmin: isOwner, isSuperAdmin: isOwner };
    }
    // Потом применим то, что есть в БД
    for (const row of res.rows as Array<{ discord_id: string; role: string }>) {
      const id = row.discord_id;
      const role = row.role;
      const isOwner = id === OWNER_ID;
      const isSuperAdmin = isOwner || role === "superadmin";
      const isAdmin = isSuperAdmin || role === "admin";
      roles[id] = { isAdmin, isSuperAdmin };
    }

    return NextResponse.json<Ok>({ ok: true, roles });
  } catch (e) {
    return NextResponse.json<NotOk>({ ok: false, error: String(e) }, { status: 500 });
  }
}
