// src/app/weekly/folder.client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  url: string;
  key: string;
  category: string;
  uploadedAt: string | null;
  size?: number | null;
  caption?: string | null;
};

type ListResp =
  | { ok: true; items: Item[] }
  | { ok: false; items: Item[]; error: string };

export default function FolderClient(
  { safe: _safe, name }: { safe: string; name: string }
) {
  // Помечаем как «использованный», чтобы ESLint не ругался:
  void _safe;

  const [data, setData] = useState<ListResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  // Можно обойтись и без таймстемпа (cache: "no-store" уже хватает),
  // но оставляю как у тебя.
  const listUrl = useMemo(
    () =>
      `/api/weekly/list?category=${encodeURIComponent(name)}&t=${Date.now()}`,
    [name]
  );

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(listUrl, { cache: "no-store" });
        const j: ListResp = await r.json();
        setData(j);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      try {
        const r = await fetch("/api/photo/can-upload", { cache: "no-store" });
        const j = await r.json();
        setCanManage(Boolean(j?.canUpload ?? j?.ok));
      } catch {
        setCanManage(false);
      }
    })();
  }, [listUrl]);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(listUrl, { cache: "no-store" });
      const j: ListResp = await r.json();
      setData(j);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onDeletePhoto(item: Item) {
    if (!canManage) return;
    if (!confirm("Удалить это изображение?")) return;
    try {
      const r = await fetch("/api/weekly/photo/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: item.key, url: item.url }),
      });
      const j = await r.json().catch(() => ({}));
      if (j?.ok) {
        await refresh();
      } else {
        alert(`Не удалось удалить фото: ${String(j?.error ?? r.statusText)}`);
      }
    } catch (e) {
      alert(String(e));
    }
  }

  async function onEditCaption(item: Item) {
    if (!canManage) return;
    const caption = window.prompt("Подпись к фото", item.caption ?? "") ?? "";
    try {
      const r = await fetch("/api/weekly/caption", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: item.key, caption }),
      });
      const j = await r.json().catch(() => ({}));
      if (j?.ok) {
        await refresh();
      } else {
        alert(`Не удалось сохранить подпись: ${String(j?.error ?? r.statusText)}`);
      }
    } catch (e) {
      alert(String(e));
    }
  }

  // Лайтбокс
  const [preview, setPreview] = useState<Item | null>(null);

  const items: Item[] = (data && "items" in data && data.items) || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{name}</h2>
      {loading && <div className="text-white/70">Загружаем изображения…</div>}
      {!loading && err && <div className="text-red-400">Ошибка: {err}</div>}
      {!loading && !err && items.length === 0 && (
        <div className="text-white/70">В папке пока пусто.</div>
      )}

      {!loading && !err && items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <li key={it.key} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.url}
                alt={it.caption ?? it.key}
                className="h-40 w-full cursor-zoom-in rounded-lg object-cover"
                onClick={() => setPreview(it)}
              />
              <div className="absolute bottom-2 left-2 right-2 text-xs text-white">
                {(it.caption ?? "").trim() && (
                  <span className="rounded bg-black/60 px-1.5 py-1">
                    {it.caption}
                  </span>
                )}
              </div>

              {canManage && (
                <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => onEditCaption(it)}
                    className="rounded-md bg-white/80 px-2 py-1 text-xs text-black hover:bg-white"
                    title="Подпись"
                  >
                    Подпись
                  </button>
                  <button
                    onClick={() => onDeletePhoto(it)}
                    className="rounded-md bg-red-500/80 px-2 py-1 text-xs text-white hover:bg-red-500"
                    title="Удалить"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Лайтбокс */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <div className="w-full max-w-5xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.url}
              alt={preview.caption ?? preview.key}
              className="h-auto w-full rounded-lg"
            />
            {(preview.caption ?? "").trim() && (
              <div className="mt-2 text-sm text-white">{preview.caption}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
