// src/app/api/weekly/folders/route.ts
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

type Folder = {
  name: string;          // человеко-читаемое имя (decodeURIComponent)
  safe: string;          // безопасный сегмент (encodeURIComponent(name))
  count: number;         // количество видимых картинок
  coverUrl: string | null;
  updatedAt?: string | null;
};

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "weekly/", limit: 1000 });
    type BlobItem = typeof blobs[number];

    // группируем по префиксу weekly/<safe>/...
    const map = new Map<string, { name: string; items: BlobItem[] }>();

    for (const b of blobs) {
      const parts = b.pathname.split("/");
      if (parts.length < 2) continue;
      const safe = parts[1];
      const name = decodeURIComponent(safe);

      const bucket = map.get(safe);
      if (bucket) bucket.items.push(b);
      else map.set(safe, { name, items: [b] });
    }

    const folders: Folder[] = [];

    for (const [safe, data] of map) {
      // скрытые файлы (.keep и т.п.) не считаем
      const visible = data.items.filter((it) => !it.pathname.split("/").pop()!.startsWith("."));

      // обложка — последний загруженный
      const latest = visible
        .slice()
        .sort((a, b) => {
          const at = (a.uploadedAt as Date | undefined)?.getTime() ?? 0;
          const bt = (b.uploadedAt as Date | undefined)?.getTime() ?? 0;
          return bt - at;
        })[0];

      folders.push({
        name: data.name,
        safe,
        count: visible.length,
        coverUrl: latest?.url ?? null,
        updatedAt: latest?.uploadedAt ? (latest.uploadedAt as Date).toISOString() : null,
      });
    }

    folders.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    return NextResponse.json({ ok: true, folders });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), folders: [] }, { status: 200 });
  }
}
