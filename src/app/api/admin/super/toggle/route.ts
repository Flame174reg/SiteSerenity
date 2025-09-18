// src/app/api/admin/super/toggle/route.ts
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OWNER_ID = "1195944713639960601";

type Ok = { ok: true; id: string; super: boolean; role: "admin" | "superadmin" };
type NotOk = { ok: false; error: string };

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function str(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  return typeof v === "string" ? v : null;
}
function bool(o: Record<string, unknown>, k: string): boolean | null {
  const v = o[k];
  return typeof v === "boolean" ? v : null;
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
    const me = session?.user?.id;
    if (!me) return NextResponse.json<NotOk>({ ok: false, error: "unauthenticated" }, { status: 401 });

    // менять статусы может только владелец или уже суперадмин
    let allowed = me === OWNER_ID;
    if (!allowed) {
      await ensureSchema();
      const rs = await sql/* sql */`SELECT role FROM uploaders WHERE discord_id=${me} LIMIT 1`;
      allowed = rs.rows[0]?.role === "superadmin";
    }
    if (!allowed) return NextResponse.json<NotOk>({ ok: false, error: "forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => null)) as unknown;
    if (!isRec(body)) return NextResponse.json<NotOk>({ ok: false, error: "invalid json" }, { status: 400 });

    const id = (str(body, "id") || "").trim();
    const superFlag = !!bool(body, "super");

    if (!id) return NextResponse.json<NotOk>({ ok: false, error: "id required" }, { status: 400 });
    if (id === OWNER_ID) {
      // владелец всегда сверхправами
      return NextResponse.json<Ok>({ ok: true, id, super: true, role: "superadmin" });
    }

    await ensureSchema();

    if (superFlag) {
      // апгрейд до superadmin
      await sql/* sql */`
        INSERT INTO uploaders (discord_id, role, updated_at)
        VALUES (${id}, 'superadmin', NOW())
        ON CONFLICT (discord_id) DO UPDATE
        SET role='superadmin', updated_at=NOW()
      `;
      return NextResponse.json<Ok>({ ok: true, id, super: true, role: "superadmin" });
    } else {
      // даунгрейд с superadmin до admin (не снимаем вообще доступ)
      await sql/* sql */`
        INSERT INTO uploaders (discord_id, role, updated_at)
        VALUES (${id}, 'admin', NOW())
        ON CONFLICT (discord_id) DO UPDATE
        SET role='admin', updated_at=NOW()
      `;
      return NextResponse.json<Ok>({ ok: true, id, super: false, role: "admin" });
    }
  } catch (e) {
    return NextResponse.json<NotOk>({ ok: false, error: String(e) }, { status: 500 });
  }
}
