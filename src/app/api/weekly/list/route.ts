// src/app/api/weekly/list/route.ts
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

type Item = {
  url: string;
  key: string;           // полный blob key: weekly/<safe>/<file>
  category: string;      // человеко-читаемое имя папки
  caption?: string | null;
  uploadedAt?: string;
  size?: number;
};
type Resp = { ok: boolean; items: Item[]; categories: string[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const categoryHuman = url.searchParams.get("category"); // «Апрель 2025»
    const categorySafeParam = url.searchParams.get("safe"); // «%D0%90%D0%BF...»
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // Определяем safe-сегмент
    const safe = categorySafeParam && !categorySafeParam.includes("/")
      ? categorySafeParam
      : categoryHuman
        ? encodeURIComponent(categoryHuman)
        : null;

    // Список всех категорий (для подсказок) — берём папки из blob-листинга
    const all = await list({ prefix: "weekly/", limit: 10_000, token });
    const catsSet = new Set<string>();
    for (const b of all.blobs) {
      const p = b.pathname.split("/");
      if (p.length >= 2 && p[1]) catsSet.add(decodeURIComponent(p[1]));
    }
    const categories = Array.from(catsSet).sort((a, b) => a.localeCompare(b, "ru"));

    // Если запрашиваем конкретную категорию
    if (safe) {
      const { blobs } = await list({ prefix: `weekly/${safe}/`, limit: 10_000, token });
      // отбрасываем скрытые
      const visible = blobs.filter((b) => !b.pathname.split("/").pop()!.startsWith("."));

      const items: Item[] = visible.map((b) => ({
        url: b.url,
        key: b.pathname,
        category: decodeURIComponent(safe),
        uploadedAt: b.uploadedAt ? (b.uploadedAt as Date).toISOString() : undefined,
        size: typeof (b as any).size === "number" ? (b as any).size : undefined,
      }));

      // Пытаемся подмешать подписи из БД, но если что — игнорим ошибку
      try {
        await sql/*sql*/`
          CREATE TABLE IF NOT EXISTS weekly_photos (
            blob_key TEXT PRIMARY KEY,
            caption TEXT
          );
        `;
        if (items.length > 0) {
          // т.к. тэговый sql не умеет массивы, делаем OR через параметры
          const ks = items.map((it) => it.key);
          const cond = ks.map((_, i) => `blob_key = $${i + 1}`).join(" OR ");
          const q = `SELECT blob_key, caption FROM weekly_photos WHERE ${cond}`;
          // @ts-ignore — в runtime у sql есть метод query
          const { rows } = await sql.query(q, ks);
          const caps = new Map<string, string | null>();
          for (const r of rows) caps.set(r.blob_key as string, (r.caption as string) ?? null);
          for (const it of items) it.caption = caps.get(it.key) ?? null;
        }
      } catch {
        // глушим ошибки БД — список картинок важнее
      }

      return NextResponse.json({ ok: true, items, categories } satisfies Resp);
    }

    // Иначе корень — просто список категорий (без картинок)
    return NextResponse.json({ ok: true, items: [], categories } satisfies Resp);
  } catch (e) {
    return NextResponse.json({ ok: false, items: [], categories: [], error: String(e) } as any, { status: 200 });
  }
}
