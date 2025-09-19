// src/app/api/admin/toggle/route.ts
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OWNER_ID = "1195944713639960601";

type Ok = { ok: true; id: string; admin: boolean };
type NotOk = { ok: false; error: string };

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getStr(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  return typeof v === "string" ? v : null;
}
function truthy(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true" || v === "on";
}

async function ensureSchema() {
  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT NOT NULL DEFAULT 'admin',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql/* sql */`
    ALTER TABLE uploaders
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
  `;
  await sql/* sql */`
    ALTER TABLE uploaders
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `;
}

async function isSuperAdmin(me: string): Promise<boolean> {
  if (me === OWNER_ID) return true;
  await ensureSchema();
  const { rows } = await sql/* sql */`
    SELECT role FROM uploaders WHERE discord_id = ${me} LIMIT 1
  `;
  return rows[0]?.role === "superadmin";
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = (session?.user as { id?: string; email?: string } | null | undefined)?.id
      ?? (session?.user as { email?: string } | null | undefined)?.email
      ?? null;

    if (!me) return NextResponse.json<NotOk>({ ok: false, error: "unauthenticated" }, { status: 401 });

    // Разрешаем владельцу и суперадминам
    if (!(await isSuperAdmin(me))) {
      return NextResponse.json<NotOk>({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as unknown;
    if (!isRec(body)) return NextResponse.json<NotOk>({ ok: false, error: "invalid json" }, { status: 400 });

    const id = (getStr(body, "id") || "").trim();
    const adminFlag = truthy((body as Record<string, unknown>)["admin"]);
    if (!id) return NextResponse.json<NotOk>({ ok: false, error: "id required" }, { status: 400 });

    if (id === OWNER_ID) {
      // владелец всегда админ
      return NextResponse.json<Ok>({ ok: true, id, admin: true });
    }

    await ensureSchema();

    if (adminFlag) {
      // делаем админом, но не трогаем суперадминов (если вдруг уже супер)
      await sql/* sql */`
        INSERT INTO uploaders (discord_id, role, updated_at)
        VALUES (${id}, 'admin', NOW())
        ON CONFLICT (discord_id) DO UPDATE
        SET role = CASE
          WHEN uploaders.role = 'superadmin' THEN 'superadmin'
          ELSE 'admin'
        END,
        updated_at = NOW()
      `;
      return NextResponse.json<Ok>({ ok: true, id, admin: true });
    } else {
      // снимаем "админа" только если это не суперадмин
      await sql/* sql */`
        DELETE FROM uploaders
        WHERE discord_id = ${id} AND role = 'admin'
      `;
      // если был супер — запись не удалится, и он останется админом по роли супер
      const { rows } = await sql/* sql */`
        SELECT role FROM uploaders WHERE discord_id = ${id} LIMIT 1
      `;
      const stillAdmin = rows[0]?.role === "superadmin";
      return NextResponse.json<Ok>({ ok: true, id, admin: stillAdmin });
    }
  } catch (e) {
    return NextResponse.json<NotOk>({ ok: false, error: String(e) }, { status: 500 });
  }
}
