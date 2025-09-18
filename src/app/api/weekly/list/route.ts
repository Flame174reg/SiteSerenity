// src/app/api/weekly/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Item = {
  url: string;
  key: string;
  category: string;
  uploadedAt: string | null;
  size?: number | null;
  caption?: string | null;
};

type Album = {
  safe: string;
  name: string;
  updatedAt: string | null;
  count: number;
};

type OkItems = { ok: true; items: Item[] };
type OkCategories = { ok: true; categories: Album[] };
type NotOk = { ok: false; error: string };

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

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

function albumFromPathname(pathname: string): string | null {
  // ожидаем weekly/<safe>/filename
  const m = /^weekly\/([^/]+)\//.exec(pathname);
  return m ? m[1] : null;
}

function normalizeItem(b: unknown): Item | null {
  const r = isRec(b) ? b : {};
  const url = typeof r.url === "string" ? r.url : "";
  const pathname = typeof r.pathname === "string" ? r.pathname : (typeof r.key === "string" ? r.key : "");
  const uploadedAt =
    typeof r.uploadedAt === "string"
      ? r.uploadedAt
      : typeof r.uploadedAt === "number"
      ? new Date(r.uploadedAt).toISOString()
      : null;
  const size =
    typeof r.size === "number" ? r.size : r.size === null ? null : undefined;

  if (!url || !pathname) return null;

  const safe = albumFromPathname(pathname) ?? "";
  if (!safe) return null;

  return {
    url,
    key: pathname, // используем pathname как уникальный ключ в Blob
    category: safe,
    uploadedAt,
    size,
    caption: undefined,
  };
}

async function listAlbumItems(prefix: string, token?: string): Promise<Item[]> {
  const items: Item[] = [];
  let cursor: string | undefined = undefined;

  for (;;) {
    const res = await list({ prefix, limit: 1000, cursor, token });
    for (const b of res.blobs) {
      const it = normalizeItem(b);
      if (it) items.push(it);
    }
    if (typeof res.cursor === "string" && res.cursor.length > 0) {
      cursor = res.cursor;
    } else {
      break;
    }
  }
  // сортируем по дате, новые сверху
  items.sort((a, b) => {
    const ta = a.uploadedAt ? Date.parse(a.uploadedAt) : 0;
    const tb = b.uploadedAt ? Date.parse(b.uploadedAt) : 0;
    return tb - ta;
  });
  return items;
}

async function listAlbums(token?: string): Promise<Album[]> {
  const map = new Map<string, { count: number; updatedAt: string | null }>();
  let cursor: string | undefined = undefined;

  for (;;) {
    const res = await list({ prefix: "weekly/", limit: 1000, cursor, token });
    for (const b of res.blobs) {
      const pathname = typeof (b as any).pathname === "string" ? (b as any).pathname : (b as any).key;
      if (!pathname || typeof pathname !== "string") continue;
      const safe = albumFromPathname(pathname);
      if (!safe) continue;

      const uploadedAt =
        typeof (b as any).uploadedAt === "string"
          ? (b as any).uploadedAt
          : typeof (b as any).uploadedAt === "number"
          ? new Date((b as any).uploadedAt).toISOString()
          : null;

      const stat = map.get(safe) || { count: 0, updatedAt: null };
      stat.count += 1;
      if (!stat.updatedAt || (uploadedAt && Date.parse(uploadedAt) > Date.parse(stat.updatedAt))) {
        stat.updatedAt = uploadedAt;
      }
      map.set(safe, stat);
    }
    if (typeof res.cursor === "string" && res.cursor.length > 0) {
      cursor = res.cursor;
    } else {
      break;
    }
  }

  // Пробуем подхватить «человекочитаемые» подписи из meta-хранилища
  // _weekly_meta/<safe>.json => { name: string }
  const albums: Album[] = [];
  for (const [safe, stat] of map.entries()) {
    let name = decodeURIComponent(safe);
    try {
      const metaPrefix = `_weekly_meta/${safe}.json`;
      const meta = await list({ prefix: metaPrefix, limit: 1, token });
      const blob = meta.blobs[0];
      if (blob?.url) {
        const r = await fetch(blob.url, { cache: "no-store" });
        const j = (await r.json().catch(() => null)) as unknown;
        if (isRec(j) && typeof j.name === "string" && j.name.trim()) {
          name = j.name.trim();
        }
      }
    } catch {
      // meta опционален — проглатываем
    }

    albums.push({
      safe,
      name,
      updatedAt: stat.updatedAt,
      count: stat.count,
    });
  }

  // Сортируем новые альбомы вверх
  albums.sort((a, b) => {
    const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return tb - ta;
  });

  return albums;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = readToken();

    const safeParam = searchParams.get("safe")?.trim() || "";
    const categoryParam = searchParams.get("category")?.trim() || "";

    // Режим элементов одного альбома:
    if (safeParam || categoryParam) {
      const safe = safeParam || slugify(categoryParam);
      if (!safe) {
        return NextResponse.json<NotOk>({ ok: false, error: "Empty category" }, { status: 400 });
      }
      const items = await listAlbumItems(`weekly/${safe}/`, token);
      return NextResponse.json<OkItems>({ ok: true, items });
    }

    // Режим списка альбомов:
    const categories = await listAlbums(token);
    return NextResponse.json<OkCategories>({ ok: true, categories });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return NextResponse.json<NotOk>({ ok: false, error: msg }, { status: 500 });
  }
}
