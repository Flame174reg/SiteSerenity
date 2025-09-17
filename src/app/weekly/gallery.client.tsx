"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Item = {
  url: string;
  key: string;
  category: string;
  caption?: string | null;
  uploadedAt?: string;
  size?: number;
};

export default function GalleryClient({
  items: initial,
  isAdmin,
}: {
  items: Item[];
  isAdmin: boolean;
}) {
  const [items, setItems] = useState<Item[]>(initial);
  const [openAt, setOpenAt] = useState<number | null>(null); // index активного слайда
  const selected = openAt === null ? null : items[openAt] ?? null;

  // клавиатура: Esc, ←, →
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (openAt === null) return;
      if (e.key === "Escape") setOpenAt(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAt, items.length]);

  const next = useCallback(() => {
    setOpenAt((i) => (i === null ? null : (i + 1) % items.length));
  }, [items.length]);

  const prev = useCallback(() => {
    setOpenAt((i) => (i === null ? null : (i - 1 + items.length) % items.length));
  }, [items.length]);

  async function saveCaption(key: string, caption: string | null) {
    const res = await fetch("/api/weekly/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, caption }),
    });
    const data: unknown = await res.json().catch(() => ({}));
    const ok = typeof data === "object" && data !== null && "ok" in data && (data as { ok?: unknown }).ok === true;
    if (ok) {
      setItems((arr) => arr.map((it) => (it.key === key ? { ...it, caption } : it)));
    }
  }

  async function deleteItem(key: string) {
    if (!confirm("Удалить изображение?")) return;
    const res = await fetch("/api/weekly/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data: unknown = await res.json().catch(() => ({}));
    const ok = typeof data === "object" && data !== null && "ok" in data && (data as { ok?: unknown }).ok === true;
    if (ok) {
      setItems((arr) => arr.filter((it) => it.key !== key));
      setOpenAt(null);
    }
  }

  const grid = useMemo(
    () =>
      items.map((it, idx) => (
        <button
          key={it.key}
          onClick={() => setOpenAt(idx)}
          className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
          title={it.caption || it.key}
        >
          {/* превью */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={it.url}
            alt={it.caption || it.key}
            className="h-48 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
          {/* подпись */}
          <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs px-2 py-1">
            {it.caption || it.key}
          </div>
        </button>
      )),
    [items]
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{grid}</div>

      {/* Лайтбокс */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpenAt(null)}
        >
          <div
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* кнопка закрытия */}
            <button
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-2xl"
              onClick={() => setOpenAt(null)}
              aria-label="Закрыть"
            >
              ×
            </button>

            {/* навигация */}
            {items.length > 1 && (
              <>
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-2 text-white/80 hover:text-white"
                  onClick={prev}
                  aria-label="Назад"
                >
                  ◀
                </button>
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-2 text-white/80 hover:text-white"
                  onClick={next}
                  aria-label="Вперёд"
                >
                  ▶
                </button>
              </>
            )}

            {/* изображение */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.caption || selected.key}
              className="mx-auto max-h-[80vh] w-auto rounded-lg shadow-2xl"
            />

            {/* подпись/управление */}
            <div className="mt-3 text-white">
              {isAdmin ? (
                <CaptionEditor
                  value={selected.caption ?? ""}
                  onSave={(v) => saveCaption(selected.key, v || null)}
                  onDelete={() => deleteItem(selected.key)}
                />
              ) : (
                <div className="text-center text-sm">{selected.caption || selected.key}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CaptionEditor({
  value,
  onSave,
  onDelete,
}: {
  value: string;
  onSave: (v: string) => void;
  onDelete: () => void;
}) {
  const [txt, setTxt] = useState(value);
  useEffect(() => setTxt(value), [value]);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
      <input
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        placeholder="Подпись (отобразится под фото)"
        className="w-full sm:w-2/3 bg-transparent border border-white/30 rounded px-3 py-1 text-sm outline-none"
      />
      <button
        onClick={() => onSave(txt)}
        className="px-3 py-1 rounded bg-white text-black text-sm font-medium"
      >
        Сохранить
      </button>
      <button
        onClick={onDelete}
        className="px-3 py-1 rounded border border-red-400 text-red-300 hover:bg-red-500/10 text-sm"
      >
        Удалить
      </button>
    </div>
  );
}
