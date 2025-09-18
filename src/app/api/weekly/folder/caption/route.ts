// src/app/api/weekly/folder/caption/route.ts
import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

function resolveToken(reqToken?: string): string | undefined {
  if (reqToken && reqToken.trim()) return reqToken.trim();
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  return undefined;
}

const META_PREFIX = "_weekly_meta/"; // файлы метаданных лежат тут

// GET /api/weekly/folder/caption?safe=<safe>
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const safe = searchParams.get("safe")?.trim();
    if (!safe) {
      return NextResponse.json({ ok: false, error: 'Query param "safe" is required' }, { status: 400 });
    }

    const token = resolveToken();
    // Ищем файл метаданных
    const ls = await list({ prefix: `${META_PREFIX}${safe}.json`, limit: 1, token });
    const meta = ls.blobs[0];
    if (!meta) {
      // нет метаданных — это не ошибка
      return NextResponse.json({ ok: true, name: null });
    }

    const r = await fetch(meta.url, { cache: "no-store" });
    const j = await r.json().catch(() => null);
    const name = (j && typeof j.name === "string" && j.name.trim()) || null;

    return NextResponse.json({ ok: true, name });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}

// POST { safe: string, name: string, token?: string }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      safe?: string;
      name?: string;
      token?: string;
    };

    const safe = (body.safe ?? "").trim();
    const name = (body.name ?? "").trim();
    if (!safe || !name) {
      return NextResponse.json(
        { ok: false, error: 'Body params "safe" and "name" are required' },
        { status: 400 }
      );
    }

    // Лёгкая валидация safe
    if (!/^[a-zA-Z0-9\-_]+$/.test(safe)) {
      return NextResponse.json(
        { ok: false, error: "Invalid 'safe' segment" },
        { status: 400 }
      );
    }

    const token = resolveToken(body.token);
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Blob token is required (body.token or ENV)" },
        { status: 400 }
      );
    }

    // Сохраняем JSON с подписью. Делаем публичным, чтобы GET мог прочитать.
    await put(
      `${META_PREFIX}${safe}.json`,
      JSON.stringify({ name }),
      { access: "public", token, contentType: "application/json" }
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
