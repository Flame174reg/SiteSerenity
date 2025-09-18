// src/app/api/photo/can-upload/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OkResp = { ok: true; canUpload: boolean };
type ErrResp = { ok: false; error: string };

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getStr(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  return typeof v === "string" ? v : null;
}
function parseCsvEnv(name: string): Set<string> {
  const raw = (process.env[name] || "").trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

// вытаскиваем userId из разных возможных форм сессии next-auth
function extractUserIdFromSession(j: unknown): string | null {
  if (!isRec(j)) return null;

  // next-auth стандартно: { user: { id?, email?, name?, image? }, expires, ... }
  const user = isRec(j.user) ? j.user : null;
  const direct = getStr(j, "sub") || getStr(j, "userId") || null;
  const fromUser =
    (user && (getStr(user, "id") || getStr(user, "email") || getStr(user, "sub"))) || null;

  return direct || fromUser;
}

type AdminRow = {
  id: string;
  isAdmin: boolean;
  isOwner: boolean;
};

function normalizeAdminRow(u: unknown): AdminRow | null {
  if (!isRec(u)) return null;
  const id = getStr(u, "id");
  const isAdmin = typeof u["isAdmin"] === "boolean" ? (u["isAdmin"] as boolean) : false;
  const isOwner = typeof u["isOwner"] === "boolean" ? (u["isOwner"] as boolean) : false;
  if (!id) return null;
  return { id, isAdmin, isOwner };
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin;
    const cookie = req.headers.get("cookie") ?? "";

    // 1) пытаемся получить сессию пользователя
    let userId: string | null = null;
    try {
      const r = await fetch(`${origin}/api/auth/session`, {
        headers: { cookie },
        cache: "no-store",
      });
      if (r.ok) {
        const j = (await r.json().catch(() => null)) as unknown;
        userId = extractUserIdFromSession(j);
      }
    } catch {
      // ок, попробуем без сессии
    }

    // 2) если сессии нет, попробуем эвристики по заголовкам/cookie (опционально)
    if (!userId) {
      userId =
        req.headers.get("x-user-id") ||
        req.cookies.get("uid")?.value ||
        req.cookies.get("userId")?.value ||
        null;
    }

    // 3) если до сих пор нет ID — фолбэк на ENV
    if (!userId) {
      const ownerSet = parseCsvEnv("OWNER_IDS");
      const adminSet = parseCsvEnv("ADMIN_IDS");
      const canUpload = ownerSet.size > 0 || adminSet.size > 0; // если явно задано — разрешим
      return NextResponse.json<OkResp>({ ok: true, canUpload });
    }

    // 4) тянем список пользователей из твоей админки и ищем текущего
    let canUpload = false;
    try {
      const r = await fetch(`${origin}/api/admin/users`, {
        headers: { cookie },
        cache: "no-store",
      });
      if (r.ok) {
        const j = (await r.json().catch(() => null)) as unknown;
        const arr = isRec(j) && Array.isArray(j["users"]) ? (j["users"] as unknown[]) : [];
        for (const u of arr) {
          const row = normalizeAdminRow(u);
          if (row && row.id === userId) {
            canUpload = row.isOwner || row.isAdmin;
            break;
          }
        }
      }
    } catch {
      // проглатываем — попробуем ENV
    }

    // 5) если по админке не нашли — последний шанс: ENV
    if (!canUpload) {
      const ownerSet = parseCsvEnv("OWNER_IDS");
      const adminSet = parseCsvEnv("ADMIN_IDS");
      if (ownerSet.has(userId) || adminSet.has(userId)) {
        canUpload = true;
      }
    }

    return NextResponse.json<OkResp>({ ok: true, canUpload });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return NextResponse.json<ErrResp>({ ok: false, error: msg }, { status: 500 });
  }
}
