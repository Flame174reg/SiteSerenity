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

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export default function FolderClient(
  { safe, name }: { safe: string; name: string }
) {
  const [data, setData] = useState<ListResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  // 1) основной путь: спрашиваем БЭК по safe
  const listUrlSafe = useMemo(
    () => `/api/weekly/list?safe=${encodeURIComponent(safe)}&t=${Date.now()}`,
    [safe]
  );

  // 2) запасной: попробовать по человекочитаемому имени (если вдруг API ждёт его)
  const listUrlByName = useMemo(
    () => `/api/weekly/list?category=${encodeURIComponent(name)}&t=${Date.now()}`,
    [name]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // сначала пытаемся по safe
        let r = await fetch(listUrlSafe, { cache: "no-store" });
        let j: unknown = await r.json();
        let items: Item[] =
          isRec(j) && Array.isArray((j as any).items) ? (j as any).items : [];

        // если пусто — пробуем фолбэк по name
        if (items.length === 0 && name && name !== safe) {
          r = await fetch(listUrlByName, { cache: "no-store" });
          j = await r.json();
          items =
            isRec(j) && Array.isArray((j as any).items) ? (j as any).items : [];
        }

        setData({ ok: true, items });
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();

    (async () => {
      try {
        const r = await fetch("/api/photo/can-upload", { cache: "no-store" });
        const j: unknown = await r.json();
        const jr = isRec(j) ? j : {};
        setCanManage(Boolean(jr.canUpload ?? jr.ok));
      } catch {
        setCanManage(false);
      }
    })();
  }, [listUrlSafe, listUrlByName, name, safe]);

  async function refresh() {
    // просто триггерим эффект заново изменением t в url — useMemo уже включает Date.now()
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(listUrlSafe, { cache: "no-store" });
      const j: unknown = await r.json();
      const items: Item[] =
        isRec(j) && Array.isArray((j as any).items) ? (j as any).items : [];
      setData({ ok: true, items });
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

  const [preview, setPreview] = useState<Item | null>(null);
  const items: Item[] = (data && "items" in data && data.items) || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{name}</h2>
      {loading && <div className="text-white/70">Загружаем изображения…</div>}
      {!loading && err && <div className="text-red-400">Ошибка: {err}</div>}
      {!loading && !err && items.length === 0 && <div className="text-white/70">В папке пока пусто.</div>}

      {!loading && !err && items.length > 0 && (
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it) => (
            <li key={it.key} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.url}
                alt={it.caption ?? it.key}
                className="w-full h-40 object-cover rounded-lg cursor-zoom-in"
                onClick={() => setPreview(it)}
              />
              <div className="absolute bottom-2 left-2 right-2 text-xs text-white">
                {(it.caption ?? "").trim() && (
                  <span className="px-1.5 py-1 bg-black/60 rounded">{it.caption}</span>
                )}
              </div>

              {canManage && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onEditCaption(it)}
                    className="rounded-md bg-white/80 hover:bg-white text-black text-xs px-2 py-1"
                    title="Подпись"
                  >
                    Подпись
                  </button>
                  <button
                    onClick={() => onDeletePhoto(it)}
                    className="rounded-md bg-red-500/80 hover:bg-red-500 text-white text-xs px-2 py-1"
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

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="max-w-5xl w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt={preview.caption ?? preview.key} className="w-full h-auto rounded-lg" />
            {(preview.caption ?? "").trim() && (
              <div className="mt-2 text-white text-sm">{preview.caption}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
