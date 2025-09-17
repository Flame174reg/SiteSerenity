// src/app/api/weekly/list/route.ts
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

type WeeklyItem = {
  url: string;
  key: string;
  category: string;
  uploadedAt?: string;
  size?: number;
  caption?: string | null;
};

async function ensureWeeklyTable() {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      url TEXT,
      category TEXT,
      caption TEXT,
      uploaded_by TEXT,
      uploaded_at TIMESTAMPTZ
    );
  `;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS key TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS url TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS category TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS caption TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploaded_by TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();`;
  await sql/*sql*/`
    CREATE UNIQUE INDEX IF NOT EXISTS weekly_photos_key_unique ON weekly_photos(key);
  `;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "").trim().toLowerCase();
    const prefix = category ? `weekly/${category}/` : `weekly/`;

    const { blobs } = await list({ prefix, limit: 1000 });
    const items: WeeklyItem[] = blobs
      .filter((b) => !b.pathname.endsWith("/"))
      .map((b) => {
        const parts = b.pathname.split("/");
        const cat = parts.length > 2 ? parts[1] : "unknown";
        return {
          url: b.url,
          key: b.pathname,
          category: cat,
          uploadedAt: (b.uploadedAt as Date | undefined)?.toISOString(),
          size: b.size,
        };
      });

    await ensureWeeklyTable();

    // берём подписи по префиксу (совместимо с любой версией клиента)
    const likePrefix = `${prefix}%`;
    const { rows } = await sql/*sql*/`
      SELECT key, caption
      FROM weekly_photos
      WHERE key LIKE ${likePrefix}
    `;
    const captions = new Map<string, string | null>();
    for (const r of rows) captions.set(r.key as string, (r.caption as string) ?? null);
    for (const it of items) it.caption = captions.get(it.key) ?? null;

    const categories = Array.from(new Set(items.map((i) => i.category))).sort();
    return NextResponse.json({ ok: true, items, categories });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), items: [], categories: [] }, { status: 200 });
  }
}
