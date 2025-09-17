// src/app/api/weekly/folders/route.ts
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

type Folder = {
  name: string;        // «человеческое» имя (декодированное)
  safe: string;        // зашифрованный сегмент (encodeURIComponent(name))
  count: number;       // число изображений (без скрытых .files)
  coverUrl: string | null; // url последнего изображения
  updatedAt?: string | null;
};

export async function GET() {
  try {
    // читаем всё, что лежит под weekly/
    const { blobs } = await list({ prefix: "weekly/", limit: 1000 });

    // группируем по 2-му сегменту
    const map = new Map<string, { name: string; items: typeof blobs }>();
    for (const b of blobs) {
      const parts = b.pathname.split("/");
      if (parts.length < 2) continue;
      const safe = parts[1]; // зашифрованное имя папки
      const name = decodeURIComponent(safe);
      if (!map.has(safe)) map.set(safe, { name, items: [] as any });
      map.get(safe)!.items.push(b);
    }

    const folders: Folder[] = [];

    for (const [safe, data] of map) {
      // исключаем скрытые файлы из подсчёта (".keep", ".thumb" и т.п.)
      const visible = data.items.filter((b) => !b.pathname.split("/").pop()!.startsWith("."));
      // обложка — самый «свежий» видимый
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

    // сортируем по обновлению
    folders.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

    return NextResponse.json({ ok: true, folders });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), folders: [] }, { status: 200 });
  }
}
