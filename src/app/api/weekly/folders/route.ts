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
    // соберём папки из Blob
    const { blobs } = await list({ prefix: "weekly/", limit: 1000 });

    const map = new Map<string, Folder>();

    for (const b of blobs) {
      const parts = b.pathname.split("/");
      if (parts.length < 3) continue; // weekly/<safe>/<file>
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

    const folders = Array.from(map.values());

    // подмешаем подписи к альбомам (берём все и маппим по safe — так не мучаемся с ANY())
    try {
      const { rows } = await sql/* sql */`SELECT safe, caption FROM weekly_albums`;
      const bySafe = new Map<string, string | null>();
      for (const r of rows) bySafe.set(String(r.safe), (r.caption as string) ?? null);
      for (const f of folders) f.caption = bySafe.get(f.safe) ?? null;
    } catch {
      // таблицы может не быть — ок
    }

    // сортировка по дате – новые сверху
    folders.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

    return NextResponse.json({ ok: true, folders });
  } catch (e) {
    return NextResponse.json({ ok: false, folders: [], error: String(e) }, { status: 200 });
  }
}

export function HEAD() { return new Response(null, { status: 200 }); }
export function OPTIONS() { return new Response(null, { status: 204 }); }
