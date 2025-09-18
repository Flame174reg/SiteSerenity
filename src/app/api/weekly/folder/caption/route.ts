// src/app/api/weekly/folder/caption/route.ts
import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ok = { ok: true; safe: string; name: string };
type NotOk = { ok: false; error: string };

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getStr(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  return typeof v === "string" ? v : null;
}

function readToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_TOKEN || undefined;
}

/** Разрешаем буквы/цифры/дефис/подчёркивание/процент (на случай проц. кодирования); слеши запрещены. */
function isValidSafe(safe: string): boolean {
  if (!safe) return false;
  if (safe.length > 200) return false;
  if (safe.includes("/")) return false;
  return /^[\p{L}\p{N}\-_%]+$/u.test(safe);
}

/** Минимальная проверка, что альбом существует (есть хотя бы один blob в weekly/<safe>/) */
async function albumExists(safe: string, token?: string): Promise<boolean> {
  const res = await list({ prefix: `weekly/${safe}/`, limit: 1, token });
  return res.blobs.length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const token = readToken();
    if (!token) {
      return NextResponse.json<NotOk>({ ok: false, error: "Blob token is required" }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as unknown;
    if (!isRec(body)) {
      return NextResponse.json<NotOk>({ ok: false, error: "invalid json" }, { status: 400 });
    }
    const safe = (getStr(body, "safe") || "").trim();
    const name = (getStr(body, "name") || "").trim();

    if (!isValidSafe(safe)) {
      return NextResponse.json<NotOk>({ ok: false, error: "Invalid 'safe' segment" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json<NotOk>({ ok: false, error: "Name is required" }, { status: 400 });
    }

    // По-тихому проверим, что альбом вообще есть (не обязательно, но полезно)
    const exists = await albumExists(safe, token);
    if (!exists) {
      // позволяем создавать подпись заранее, но можно и вернуть 404 — выбрал мягкий режим
      // return NextResponse.json<NotOk>({ ok: false, error: "Album not found" }, { status: 404 });
    }

    const key = `_weekly_meta/${safe}.json`;
    const content = JSON.stringify({ name }, null, 2);

    await put(key, content, {
      access: "public",
      contentType: "application/json; charset=utf-8",
      addRandomSuffix: false,
      token,
    });

    return NextResponse.json<Ok>({ ok: true, safe, name });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return NextResponse.json<NotOk>({ ok: false, error: msg }, { status: 500 });
  }
}
