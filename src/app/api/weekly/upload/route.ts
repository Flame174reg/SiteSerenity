// src/app/api/weekly/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ok = { ok: true; key: string; url: string };
type NotOk = { ok: false; error: string; reason?: string };

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getStr(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  return typeof v === "string" ? v : null;
}

function slugify(human: string): string {
  return human
    .trim()
    .toLowerCase()
    .replace(/[%]/g, "")
    .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
    .replace(/\s+/g, "-");
}

function readToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_TOKEN || undefined;
}

/** Достаём userId из /api/auth/session и проверяем его в /api/admin/users. */
async function canUploadByRequest(req: NextRequest): Promise<boolean> {
  const origin = req.nextUrl.origin;
  const cookie = req.headers.get("cookie") ?? "";

  // 1) session → userId
  let userId: string | null = null;
  try {
    const r = await fetch(`${origin}/api/auth/session`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (r.ok) {
      const j = (await r.json().catch(() => null)) as unknown;
      if (isRec(j)) {
        // next-auth: { user: { id? / email? / sub? } }
        const user = isRec(j.user) ? j.user : null;
        userId =
          getStr(j, "sub") ||
          getStr(j, "userId") ||
          (user && (getStr(user, "id") || getStr(user, "email") || getStr(user, "sub"))) ||
          null;
      }
    }
  } catch {
    // ignore
  }

  // простые фолбэки
  if (!userId) {
    userId =
      req.headers.get("x-user-id") ||
      req.cookies.get("uid")?.value ||
      req.cookies.get("userId")?.value ||
      null;
  }

  if (!userId) return false;

  // 2) проверяем по админке
  try {
    const r = await fetch(`${origin}/api/admin/users`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (r.ok) {
      const j = (await r.json().catch(() => null)) as unknown;
      const arr = isRec(j) && Array.isArray(j["users"]) ? (j["users"] as unknown[]) : [];
      for (const u of arr) {
        if (!isRec(u)) continue;
        const id = getStr(u, "id");
        const isAdmin = typeof u["isAdmin"] === "boolean" ? (u["isAdmin"] as boolean) : false;
        const isOwner = typeof u["isOwner"] === "boolean" ? (u["isOwner"] as boolean) : false;
        if (id && id === userId && (isAdmin || isOwner)) return true;
      }
    }
  } catch {
    // ignore
  }

  // 3) ENV фолбэк (опционально)
  const ownerSet = new Set((process.env.OWNER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean));
  const adminSet = new Set((process.env.ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean));
  if (ownerSet.has(userId) || adminSet.has(userId)) return true;

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Жёсткая серверная авторизация
    const allowed = await canUploadByRequest(req);
    if (!allowed) {
      return NextResponse.json<NotOk>(
        { ok: false, error: "forbidden", reason: "only owner/admin can upload" },
        { status: 403 },
      );
    }

    const token = readToken();
    if (!token) {
      return NextResponse.json<NotOk>(
        { ok: false, error: "Blob token is required" },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json<NotOk>({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const safeRaw = (form.get("safe") as string | null)?.trim();
    const categoryHuman = (form.get("category") as string | null)?.trim();

    let safeFolder = safeRaw && safeRaw.length ? safeRaw : "";
    if (!safeFolder && categoryHuman) {
      safeFolder = slugify(categoryHuman);
    }
    if (!safeFolder) {
      return NextResponse.json<NotOk>(
        { ok: false, error: "Category (safe or human) is required" },
        { status: 400 },
      );
    }
    if (safeFolder.includes("/") || safeFolder.length > 200) {
      return NextResponse.json<NotOk>({ ok: false, error: "Invalid safe segment" }, { status: 400 });
    }

    const cleanName = file.name.replace(/\s+/g, "_");
    const key = `weekly/${safeFolder}/${Date.now()}_${cleanName}`;

    const res = await put(key, file.stream(), {
      access: "public",
      token,
      contentType: file.type || "application/octet-stream",
      addRandomSuffix: false,
    });

    return NextResponse.json<Ok>({ ok: true, key: res.pathname, url: res.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return NextResponse.json<NotOk>({ ok: false, error: msg }, { status: 500 });
  }
}
