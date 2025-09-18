// src/app/api/weekly/list/route.ts
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { sql } from "@vercel/postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WeeklyItem = {
  url: string;
  key: string;
  category: string;      // safe
  uploadedAt: string;    // ISO
  size?: number;
  caption: string | null;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || undefined; // safe
    const prefix = category ? `weekly/${category}/` : "weekly/";

    const res = await list({ prefix, limit: 1000 });
    const items: WeeklyItem[] = [];

    for (const b of res.blobs) {
      const parts = b.pathname.split("/");
      if (parts.length < 3) continue; // защита
      const safe = parts[1];

      items.push({
        url: b.url,
        key: b.pathname,
        category: safe,
        uploadedAt: b.uploadedAt ? new Date(b.uploadedAt).toISOString() : new Date().toISOString(),
        size: typeof b.size === "number" ? b.size : undefined,
        caption: null,
      });
    }

    // подмешиваем подписи к фото
    try {
      await sql/* sql */`
        CREATE TABLE IF NOT EXISTS weekly_photos (
          key TEXT PRIMARY KEY,
          caption TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      if (category) {
        const like = `weekly/${category}/%`;
        const { rows } = await sql/* sql */`
          SELECT key, caption
          FROM weekly_photos
          WHERE key LIKE ${like}
        `;
        const m = new Map<string, string | null>();
        for (const r of rows) m.set(String(r.key), (r.caption as string) ?? null);
        for (const it of items) {
          if (m.has(it.key)) it.caption = m.get(it.key) ?? null;
        }
      } else {
        const { rows } = await sql/* sql */`SELECT key, caption FROM weekly_photos`;
        const m = new Map<string, string | null>();
        for (const r of rows) m.set(String(r.key), (r.caption as string) ?? null);
        for (const it of items) {
          if (m.has(it.key)) it.caption = m.get(it.key) ?? null;
        }
      }
    } catch {
      // нет БД — ок, без подписей
    }

    // подпись альбома (если конкретная категория)
    let albumCaption: string | null = null;
    if (category) {
      try {
        await sql/* sql */`
          CREATE TABLE IF NOT EXISTS weekly_albums (
            safe TEXT PRIMARY KEY,
            name TEXT,
            caption TEXT,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;
        const { rows } = await sql/* sql */`
          SELECT caption FROM weekly_albums WHERE safe = ${category} LIMIT 1
        `;
        albumCaption = rows.length ? ((rows[0].caption as string) ?? null) : null;
      } catch {
        // нет таблицы — ок
      }
    }

    return NextResponse.json({ ok: true, items, albumCaption });
  } catch (e) {
    return NextResponse.json({ ok: false, items: [], error: String(e) }, { status: 200 });
  }
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
export function OPTIONS() {
  return new Response(null, { status: 204 });
}
