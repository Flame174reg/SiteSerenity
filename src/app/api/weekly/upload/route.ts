// src/app/api/weekly/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ok = { ok: true; key: string; url: string };
type NotOk = { ok: false; error: string; reason?: string };

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

export async function POST(req: NextRequest) {
  try {
    const token = readToken();
    if (!token) {
      return NextResponse.json<NotOk>(
        { ok: false, error: "Blob token is required" },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json<NotOk>({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const safe = (form.get("safe") as string | null)?.trim();
    const categoryHuman = (form.get("category") as string | null)?.trim();

    let safeFolder = safe && safe.length ? safe : "";
    if (!safeFolder && categoryHuman) {
      safeFolder = slugify(categoryHuman);
    }
    if (!safeFolder) {
      return NextResponse.json<NotOk>(
        { ok: false, error: "Category (safe or human) is required" },
        { status: 400 }
      );
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
    const msg =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return NextResponse.json<NotOk>({ ok: false, error: msg }, { status: 500 });
  }
}
