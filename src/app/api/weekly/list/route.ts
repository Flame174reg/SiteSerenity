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

// Тип для объекта из list(), без any/ban-types
type BlobItem = {
  pathname: string;
  url: string;
  uploadedAt?: Date | string;
  [extra: string]: unknown; // допускаем доп. поля SDK
};

function hasNumberSize(x: unknown): x is { size: number } {
  return typeof x === "object" && x !== null && typeof (x as { size?: unknown }).size === "number";
}

function toIso(d?: Date | string): string | undefined {
  if (!d) return undefined;
  if (d instanceof Date) return d.toISOString();
  const t = Date.parse(d);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const categoryHuman = url.searchParams.get("category"); // «Апрель 2025»
    const categorySafeParam = url.searchParams.get("safe"); // «%D0%90%D0%BF...»
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // Определяем safe-сегмент из safe или из human
    const safe =
      categorySafeParam && !categorySafeParam.includes("/")
        ? categorySafeParam
        : categoryHuman
        ? encodeURIComponent(categoryHuman)
        : null;

    // Список всех категорий (для подсказок и корневой страницы)
    const all = await list({ prefix: "weekly/", limit: 10_000, token });
    const catsSet = new Set<string>();
    for (const b of (all.blobs as unknown as BlobItem[])) {
      const p = b.pathname.split("/");
      if (p.length >= 2 && p[1]) catsSet.add(decodeURIComponent(p[1]));
    }
    const categories = Array.from(catsSet).sort((a, b) => a.localeCompare(b, "ru"));

    // Если запрошена конкретная папка — отдадим её содержимое
    if (safe) {
      const listed = await list({ prefix: `weekly/${safe}/`, limit: 10_000, token });
      const blobs = listed.blobs as unknown as BlobItem[];

      // прячем скрытые файлы (начинаются с точки)
      const visible = blobs.filter((b) => !b.pathname.split("/").pop()!.startsWith("."));

      const items: Item[] = visible.map((b) => ({
        url: b.url,
        key: b.pathname,
        category: decodeURIComponent(safe),
        uploadedAt: toIso(b.uploadedAt),
        size: hasNumberSize(b) ? b.size : undefined,
      }));

      // Подмешиваем подписи из БД (если таблицы ещё нет — создаём)
      try {
        await sql/*sql*/`
          CREATE TABLE IF NOT EXISTS weekly_photos (
            blob_key TEXT PRIMARY KEY,
            caption  TEXT
          );
        `;
        const like = `weekly/${safe}/%`;
        const { rows } = await sql/*sql*/`
          SELECT blob_key, caption
          FROM weekly_photos
          WHERE blob_key LIKE ${like};
        `;
        const caps = new Map<string, string | null>();
        for (const r of rows) {
          caps.set(String(r.blob_key), r.caption == null ? null : String(r.caption));
        }
        for (const it of items) {
          it.caption = caps.get(it.key) ?? null;
        }
      } catch {
        // ошибки БД не должны ломать выдачу картинок
      }

      return NextResponse.json({ ok: true, items, categories } satisfies Resp);
    }

    // Корневая страница — только список папок
    return NextResponse.json({ ok: true, items: [], categories } satisfies Resp);
  } catch (e) {
    // Диагностический ответ без падения статуса
    return NextResponse.json(
      { ok: false, items: [], categories: [], error: String(e) } as Resp & { error: string },
      { status: 200 },
    );
  }
}
