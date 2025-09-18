// src/app/api/admin/super/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
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
function getStr(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  return typeof v === "string" ? v : null;
}
function truthy(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true" || v === "on";
}

async function ensureSchema() {
  // базовая таблица для ролей загрузчиков
  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT NOT NULL DEFAULT 'admin',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // на случай старой схемы
  await sql/* sql */`
    ALTER TABLE uploaders
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
  `;
}

async function getMeId(req: NextRequest): Promise<string | null> {
  // 1) пробуем next-auth напрямую
  try {
    const session = await auth();
    const id =
      (session?.user as { id?: string; email?: string; sub?: string } | null | undefined)?.id ??
      (session?.user as { email?: string } | null | undefined)?.email ??
      (session as { sub?: string } | null | undefined)?.sub ??
      null;
    if (id) return id;
  } catch {
    // игнорируем, попробуем дальше
  }

  // 2) через /api/auth/session с куками запроса
  try {
    const r = await fetch(`${req.nextUrl.origin}/api/auth/session`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (r.ok) {
      const j = (await r.json().catch(() => null)) as unknown;
      if (isRec(j)) {
        const user = isRec(j.user) ? (j.user as Record<string, unknown>) : undefined;
        const id =
          getStr(j as Record<string, unknown>, "sub") ??
          getStr(j as Record<string, unknown>, "userId") ??
          (user ? (getStr(user, "id") ?? getStr(user, "email") ?? getStr(user, "sub")) : null);
        if (id) return id;
      }
    }
  } catch {
    // ignore
  }

  // 3) фолбэки из заголовков/коков (если прокидывались с обратного прокси)
  return (
    req.headers.get("x-user-id") ||
    req.cookies.get("uid")?.value ||
    req.cookies.get("userId")?.value ||
    null
  );
}

async function isSuperAdminOrOwner(id: string): Promise<boolean> {
  if (id === OWNER_ID) return true;
  await ensureSchema();
  const { rows } = await sql/* sql */`
    SELECT role FROM uploaders WHERE discord_id = ${id} LIMIT 1
  `;
  return rows[0]?.role === "superadmin";
}

export async function POST(req: NextRequest) {
  try {
    const me = await getMeId(req);
    if (!me) return NextResponse.json<NotOk>({ ok: false, error: "unauthenticated" }, { status: 401 });

    const allowed = await isSuperAdminOrOwner(me);
    if (!allowed) return NextResponse.json<NotOk>({ ok: false, error: "forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => null)) as unknown;
    if (!isRec(body)) return NextResponse.json<NotOk>({ ok: false, error: "invalid json" }, { status: 400 });

    const id = (getStr(body, "id") || "").trim();
    const superFlag = truthy((body as Record<string, unknown>)["super"]);

    if (!id) return NextResponse.json<NotOk>({ ok: false, error: "id required" }, { status: 400 });
    if (id === OWNER_ID) {
      // владелец всегда супер
      return NextResponse.json<Ok>({ ok: true, id, super: true, role: "superadmin" });
    }

    await ensureSchema();

    if (superFlag) {
      // поднимаем до superadmin
      await sql/* sql */`
        INSERT INTO uploaders (discord_id, role, updated_at)
        VALUES (${id}, 'superadmin', NOW())
        ON CONFLICT (discord_id) DO UPDATE
        SET role='superadmin', updated_at=NOW()
      `;
      return NextResponse.json<Ok>({ ok: true, id, super: true, role: "superadmin" });
    } else {
      // понижаем до admin (не лишаем полностью доступа загрузчика)
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

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
