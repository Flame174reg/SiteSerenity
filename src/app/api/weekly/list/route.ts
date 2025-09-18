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
function getStr(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  return typeof v === "string" ? v : null;
}
function getNum(o: Record<string, unknown>, k: string): number | null {
  const v = o[k];
  return typeof v === "number" ? v : null;
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

function normalizeItemFromBlob(blobLike: unknown): Item | null {
  if (!isRec(blobLike)) return null;
  const pathname = getStr(blobLike, "pathname") ?? getStr(blobLike, "key");
  const url = getStr(blobLike, "url");
  if (!pathname || !url) return null;

  const uploadedAtStr = getStr(blobLike, "uploadedAt");
  const uploadedAtNum = getNum(blobLike, "uploadedAt");
  const uploadedAt =
    uploadedAtStr ??
    (uploadedAtNum !== null ? new Date(uploadedAtNum).toISOString() : null);

  const size = getNum(blobLike, "size");

  const safe = albumFromPathname(pathname) ?? "";
  if (!safe) return null;

  return {
    url,
    key: pathname, // pathname в Blob уникален и стабилен
    category: safe,
    uploadedAt,
    size: size ?? undefined,
    caption: undefined,
  };
}

async function listAlbumItems(prefix: string, token?: string): Promise<Item[]> {
  const items: Item[] = [];
  let cursor: string | undefined = undefined;

  for (;;) {
    const res: Awaited<ReturnType<typeof list>> = await list({
      prefix,
      limit: 1000,
      cursor,
      token,
    });
    for (const b of res.blobs) {
      const it = normalizeItemFromBlob(b as unknown);
      if (it) items.push(it);
    }
    if (typeof res.cursor === "string" && res.cursor.length > 0) {
      cursor = res.cursor;
    } else {
      break;
    }
  }
  // новые сверху
  items.sort((a, b) => {
    const ta = a.uploadedAt ? Date.parse(a.uploadedAt) : 0;
    const tb = b.uploadedAt ? Date.parse(b.uploadedAt) : 0;
    return tb - ta;
  });
  return items;
}

async function listAlbums(token?: string): Promise<Album[]> {
  const statMap = new Map<string, { count: number; updatedAt: string | null }>();
  let cursor: string | undefined = undefined;

  for (;;) {
    const res: Awaited<ReturnType<typeof list>> = await list({
      prefix: "weekly/",
      limit: 1000,
      cursor,
      token,
    });

    for (const b of res.blobs) {
      const o = b as unknown as Record<string, unknown>;
      const pathname = getStr(o, "pathname") ?? getStr(o, "key");
      if (!pathname) continue;

      const safe = albumFromPathname(pathname);
      if (!safe) continue;

      const uploadedAtStr = getStr(o, "uploadedAt");
      const uploadedAtNum = getNum(o, "uploadedAt");
      const uploadedAt =
        uploadedAtStr ??
        (uploadedAtNum !== null ? new Date(uploadedAtNum).toISOString() : null);

      const prev = statMap.get(safe) || { count: 0, updatedAt: null };
      prev.count += 1;
      if (!prev.updatedAt || (uploadedAt && Date.parse(uploadedAt) > Date.parse(prev.updatedAt))) {
        prev.updatedAt = uploadedAt;
      }
      statMap.set(safe, prev);
    }

    if (typeof res.cursor === "string" && res.cursor.length > 0) {
      cursor = res.cursor;
    } else {
      break;
    }
  }

  // Подмешиваем метаданные (подписи) из _weekly_meta/<safe>.json, если есть
  const out: Album[] = [];
  for (const [safe, stat] of statMap.entries()) {
    let name = decodeURIComponent(safe);
    try {
      const metaRes: Awaited<ReturnType<typeof list>> = await list({
        prefix: `_weekly_meta/${safe}.json`,
        limit: 1,
        token,
      });
      const blob = metaRes.blobs[0];
      if (blob) {
        const url = (blob as unknown as Record<string, unknown>).url;
        if (typeof url === "string") {
          const r = await fetch(url, { cache: "no-store" });
          const j = (await r.json().catch(() => null)) as unknown;
          if (isRec(j) && typeof j.name === "string" && j.name.trim()) {
            name = j.name.trim();
          }
        }
      }
    } catch {
      // метаданные опциональны
    }

    out.push({ safe, name, updatedAt: stat.updatedAt, count: stat.count });
  }

  out.sort((a, b) => {
    const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return tb - ta;
  });

  return out;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = readToken();

    const safeParam = (searchParams.get("safe") || "").trim();
    const categoryParam = (searchParams.get("category") || "").trim();

    // режим элементов одного альбома
    if (safeParam || categoryParam) {
      const safe = safeParam || slugify(categoryParam);
      if (!safe) {
        return NextResponse.json<NotOk>({ ok: false, error: "Empty category" }, { status: 400 });
      }
      const items = await listAlbumItems(`weekly/${safe}/`, token);
      return NextResponse.json<OkItems>({ ok: true, items });
    }

    // режим списка альбомов
    const categories = await listAlbums(token);
    return NextResponse.json<OkCategories>({ ok: true, categories });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return NextResponse.json<NotOk>({ ok: false, error: msg }, { status: 500 });
  }
}
