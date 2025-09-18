// src/app/api/weekly/folders/route.ts
import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Folder = {
  name: string;           // человекочитаемо (decodeURIComponent(safe))
  safe: string;           // сегмент URL (например "Апрель%202025")
  count: number;          // сколько файлов внутри
  coverUrl: string | null; // превью (берём первый файл)
  updatedAt: string | null;
};

export async function GET() {
  try {
    // забираем все блобы под weekly/
    const { blobs } = await list({ prefix: "weekly/", limit: 1000 });

    const map = new Map<string, Folder>();

    for (const b of blobs) {
      // ожидаем путь вида weekly/<safe>/<file>
      const parts = b.pathname.split("/");
      if (parts.length < 3) continue;

      const safe = parts[1];
      const name = decodeURIComponent(safe);

      let f = map.get(safe);
      if (!f) {
        f = { name, safe, count: 0, coverUrl: null, updatedAt: null };
        map.set(safe, f);
      }

      f.count += 1;
      if (!f.coverUrl) f.coverUrl = b.url;

      const u = b.uploadedAt ? new Date(b.uploadedAt).toISOString() : null;
      if (!f.updatedAt || (u && u > f.updatedAt)) f.updatedAt = u;
    }

    // Можно отсортировать по дате обновления (новые сверху)
    const folders = Array.from(map.values()).sort((a, b) => {
      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    });

    return NextResponse.json({ ok: true, folders });
  } catch (e) {
    return NextResponse.json(
      { ok: false, folders: [], error: String(e) },
      { status: 200 }
    );
  }
}

// На всякий случай — чтобы не словить 405 на префлайтах/HEAD
export function HEAD() {
  return new Response(null, { status: 200 });
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
