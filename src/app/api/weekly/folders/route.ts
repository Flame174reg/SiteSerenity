// src/app/api/weekly/folders/route.ts
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { sql } from "@vercel/postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Folder = {
  name: string;
  safe: string;
  count: number;
  coverUrl: string | null;
  updatedAt: string | null;
  caption: string | null;
};

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "weekly/", limit: 1000 });
    const map = new Map<string, Folder>();

    for (const b of blobs) {
      const parts = b.pathname.split("/");
      if (parts.length < 3) continue;
      const safe = parts[1];
      const name = decodeURIComponent(safe);

      let f = map.get(safe);
      if (!f) {
        f = { name, safe, count: 0, coverUrl: null, updatedAt: null, caption: null };
        map.set(safe, f);
      }
      f.count += 1;
      if (!f.coverUrl) f.coverUrl = b.url;

      const u = b.uploadedAt ? new Date(b.uploadedAt).toISOString() : null;
      if (!f.updatedAt || (u && u > f.updatedAt)) f.updatedAt = u;
    }

    // подмешиваем подписи альбомов из БД
    try {
      await sql/* sql */`
        CREATE TABLE IF NOT EXISTS weekly_albums (
          safe TEXT PRIMARY KEY,
          name TEXT,
          caption TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      const { rows } = await sql/* sql */`SELECT safe, caption FROM weekly_albums`;
      for (const r of rows) {
        const s = String(r.safe);
        const f = map.get(s);
        if (f) f.caption = (r.caption as string) ?? null;
      }
    } catch {
      // без БД — просто без caption
    }

    const folders = Array.from(map.values()).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    return NextResponse.json({ ok: true, folders });
  } catch (e) {
    return NextResponse.json({ ok: false, folders: [], error: String(e) }, { status: 200 });
  }
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
export function OPTIONS() {
  return new Response(null, { status: 204 });
}
