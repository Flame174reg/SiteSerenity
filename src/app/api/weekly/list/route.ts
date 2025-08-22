// src/app/api/weekly/list/route.ts
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "").trim().toLowerCase();
    const prefix = category
      ? `weekly/${category}/`
      : `weekly/`;

    const { blobs } = await list({ prefix, limit: 1000 });
    const items = blobs
      .filter((b) => !b.pathname.endsWith("/")) // на всякий
      .map((b) => ({
        url: b.url,
        key: b.pathname,
        uploadedAt: b.uploadedAt,
        size: b.size,
      }));

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), items: [] }, { status: 200 });
  }
}
