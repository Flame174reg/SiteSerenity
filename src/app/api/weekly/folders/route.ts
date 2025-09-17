// src/app/api/weekly/folders/route.ts
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

type Folder = {
  name: string;          // человеко-читаемое (decodeURIComponent)
  safe: string;          // url-сегмент (encodeURIComponent(name))
  count: number;         // число видимых файлов (без скрытых .*)
  coverUrl: string | null;
  updatedAt?: string | null;
};

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN; // на всякий случай передаём
    const { blobs } = await list({ prefix: "weekly/", limit: 10_000, token });

    type BlobItem = typeof blobs[number];
    const map = new Map<string, { name: string; items: BlobItem[] }>();

    for (const b of blobs) {
      const parts = b.pathname.split("/");
      if (parts.length < 2) continue; // ожидаем weekly/<safe>/...
      const safe = parts[1];
      if (!safe) continue;
      const name = decodeURIComponent(safe);
      const bucket = map.get(safe);
      if (bucket) bucket.items.push(b);
      else map.set(safe, { name, items: [b] });
    }

    const folders: Folder[] = [];
    for (const [safe, data] of map) {
      // видимые — всё, что не начинается с точки
      const visible = data.items.filter((it) => !it.pathname.split("/").pop()!.startsWith("."));
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
