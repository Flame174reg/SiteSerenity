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

function normalizeItem(v: unknown): Item {
  const r = isRec(v) ? v : {};
  const url = typeof r.url === "string" ? r.url : "";
  const key = typeof r.key === "string" ? r.key : "";
  const category = typeof r.category === "string" ? r.category : "";
  const uploadedAt =
    typeof r.uploadedAt === "string" ? r.uploadedAt : null;
  const size =
    typeof r.size === "number" ? r.size : r.size === null ? null : undefined;
  const caption =
    typeof r.caption === "string" ? r.caption : r.caption === null ? null : undefined;

  return { url, key, category, uploadedAt, size, caption };
}

function parseItems(resp: unknown): Item[] {
  if (!isRec(resp)) return [];
  const val = resp.items;
  if (!Array.isArray(val)) return [];
  // Нормализуем и отбрасываем заведомо битые записи без ключевых полей
  return val.map(normalizeItem).filter((it) => it.url !== "" && it.key !== "");
}

export default function FolderClient(
  { safe, name }: { safe: string; name: string }
) {
  const [data, setData] = useState<ListResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  // основной запрос по safe
  const listUrlSafe = useMemo(
    () => `/api/weekly/list?safe=${encodeURIComponent(safe)}&t=${Date.now()}`,
    [safe]
  );
  // фолбэк по человекочитаемому имени
  const listUrlByName = useMemo(
    () => `/api/weekly/list?category=${encodeURIComponent(name)}&t=${Date.now()}`,
    [name]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) пробуем по safe
        let r = await fetch(listUrlSafe, { cache: "no-store" });
        let j: unknown = await r.json();
        let items = parseItems(j);

        // 2) если пусто — пробуем по name (на случай иной реализации бэка)
        if (items.length === 0 && name && name !== safe) {
          r = await fetch(listUrlByName, { cache: "no-store" });
          j = await r.json();
          items = parseItems(j);
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
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(listUrlSafe, { cache: "no-store" });
      const j: unknown = await r.json();
      const items = parseItems(j);
      setData({ ok: true, items });
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  function isOkResp(u: unknown): u is { ok: boolean; error?: string } {
    return isRec(u) && typeof u.ok === "boolean";
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
      const j: unknown = await r.json().catch(() => ({}));
      if (isOkResp(j) && j.ok) {
        await refresh();
      } else {
        const msg = isRec(j) && typeof j.error === "string" ? j.error : r.statusText;
        alert(`Не удалось удалить фото: ${msg}`);
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
      const j: unknown = await r.json().catch(() => ({}));
      if (isOkResp(j) && j.ok) {
        await refresh();
      } else {
        const msg = isRec(j) && typeof j.error === "string" ? j.error : r.statusText;
        alert(`Не удалось сохранить подпись: ${msg}`);
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

      {/* Лайтбокс */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="max-w-5xl w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.url}
              alt={preview.caption ?? preview.key}
              className="w-full h-auto rounded-lg"
            />
            {(preview.caption ?? "").trim() && (
              <div className="mt-2 text-white text-sm">{preview.caption}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
