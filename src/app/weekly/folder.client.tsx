// src/app/weekly/folder.client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import UploadClient from "./upload.client";

type WeeklyItem = {
  url: string;
  key: string;
  category: string;
  caption?: string | null;
  uploadedAt?: string;
  size?: number;
};

type WeeklyListResp =
  | { ok: true; items: WeeklyItem[]; categories: string[] }
  | { ok: false; items: WeeklyItem[]; categories: string[]; error: string };

export default function WeeklyFolderClient({
  categorySafe,
  categoryHuman,
}: {
  categorySafe: string;
  categoryHuman: string;
}) {
  const [data, setData] = useState<WeeklyListResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const retriesLeft = useRef(5);

  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const [capDraft, setCapDraft] = useState("");

  const queryUrl = useMemo(() => {
    const ts = Date.now();
    const sp = new URLSearchParams({ safe: categorySafe, t: String(ts) });
    return `/api/weekly/list?${sp.toString()}`;
  }, [categorySafe]);

  function currentItem(): WeeklyItem | null {
    if (!data || !("ok" in data) || !data.ok) return null;
    if (lbIndex == null) return null;
    return data.items[lbIndex] ?? null;
  }

  function setItems(mutator: (prev: WeeklyItem[]) => WeeklyItem[]) {
    setData((prev) => {
      if (!prev || !("ok" in prev) || !prev.ok) return prev;
      return { ...prev, items: mutator(prev.items) };
    });
  }

  async function loadOnce() {
    try {
      setErr(null);
      const r = await fetch(queryUrl, { cache: "no-store" });
      const j: WeeklyListResp = await r.json();
      setData(j);
      setLoading(false);

      if (j.ok && j.items.length === 0 && retriesLeft.current > 0) {
        retriesLeft.current -= 1;
        setLoading(true);
        setTimeout(loadOnce, 350);
      }
    } catch (e) {
      setErr(String(e));
      setLoading(false);
    }
  }

  useEffect(() => {
    retriesLeft.current = 5;
    setLoading(true);
    loadOnce();
    (async () => {
      try {
        const r = await fetch("/api/photo/can-upload", { cache: "no-store" });
        const j = await r.json();
        setCanManage(Boolean(j?.canUpload ?? j?.ok));
      } catch {
        setCanManage(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySafe]);

  // ----- удаление -----
  async function onDelete(key: string) {
    if (!canManage) return;
    if (!confirm("Удалить изображение безвозвратно?")) return;
    try {
      const r = await fetch("/api/weekly/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const j = await r.json();
      if (j?.ok) {
        setItems((prev) => prev.filter((it) => it.key !== key));
        // если удаляли из модалки — корректно закрыть/перелистнуть
        setLbIndex((idx) => {
          if (idx == null) return idx;
          const newLen = (data && "ok" in data && data.ok ? data.items.length - 1 : 0);
          if (newLen <= 0) return null;
          return Math.min(idx, newLen - 1);
        });
      } else {
        alert(`Не удалось удалить: ${j?.error ?? j?.reason ?? r.statusText}`);
      }
    } catch (e) {
      alert(String(e));
    }
  }

  // ----- модалка -----
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lbIndex == null) return;
      if (e.key === "Escape") setLbIndex(null);
      if (e.key === "ArrowLeft") setLbIndex((i) => (i == null ? i : Math.max(0, i - 1)));
      if (e.key === "ArrowRight") {
        setLbIndex((i) => {
          if (i == null) return i;
          const items = (data && "ok" in data && data.ok ? data.items : []);
          return Math.min(items.length - 1, i + 1);
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lbIndex, data]);

  useEffect(() => {
    const it = currentItem();
    setCapDraft(it?.caption ?? "");
  }, [lbIndex]); // смена кадра — обновить драфт

  async function saveCaption() {
    const it = currentItem();
    if (!it) return;
    try {
      const r = await fetch("/api/weekly/caption", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: it.key, caption: capDraft }),
      });
      const j = await r.json();
      if (j?.ok) {
        setItems((prev) =>
          prev.map((x) => (x.key === it.key ? { ...x, caption: capDraft } : x)),
        );
      } else {
        alert(`Не удалось сохранить подпись: ${j?.error ?? j?.reason ?? r.statusText}`);
      }
    } catch (e) {
      alert(String(e));
    }
  }

  const items = (data && "ok" in data && data.ok) ? data.items : [];
  const foldersList = (data && data.categories) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Недельный актив — {categoryHuman}</h1>
        <Link href="/weekly" className="text-sm underline text-white/80 hover:text-white">
          Все папки
        </Link>
      </div>

      <p className="text-sm text-white/70">
        Тут вы можете увидеть свой актив/явку за неделю. Загрузка идёт в папку{" "}
        <span className="font-medium">{categoryHuman}</span>.
      </p>

      <UploadClient
        defaultCategory={categoryHuman}
        categories={[categoryHuman, ...foldersList.filter((c) => c !== categoryHuman)]}
        forcedCategorySafe={categorySafe}
        onUploaded={loadOnce}
      />

      {loading && <div className="text-white/70">Загружаем…</div>}
      {!loading && err && <div className="text-red-400">Ошибка загрузки списка: {err}</div>}
      {!loading && !err && data && "ok" in data && !data.ok && (
        <div className="text-red-400">Ошибка загрузки списка: {data.error}</div>
      )}

      {!loading && !err && data && "ok" in data && data.ok && (
        items.length > 0 ? (
          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((it, idx) => (
              <li
                key={it.key}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5"
                title={it.caption ?? ""}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.url}
                  alt={it.caption ?? ""}
                  className="w-full h-64 object-cover cursor-zoom-in"
                  loading="lazy"
                  onClick={() => setLbIndex(idx)}
                />

                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  {it.caption ? (
                    <p className="text-white text-sm drop-shadow">{it.caption}</p>
                  ) : (
                    <p className="text-white/60 text-xs">Без подписи</p>
                  )}
                </div>

                {canManage && (
                  <button
                    onClick={() => onDelete(it.key)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition
                               rounded-md bg-red-500/80 hover:bg-red-500 text-white text-xs px-2 py-1"
                    title="Удалить изображение"
                  >
                    Удалить
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-white/70">В этой папке пока нет изображений.</div>
        )
      )}

      {/* --- Модальный просмотрщик --- */}
      {lbIndex != null && currentItem() && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLbIndex(null)}
        >
          <div className="relative max-w-[92vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentItem()!.url}
              alt={currentItem()!.caption ?? ""}
              className="max-w-[92vw] max-h-[80vh] object-contain rounded-lg"
            />

            {/* навигация */}
            <div className="absolute inset-x-0 -bottom-14 flex items-center justify-between">
              <button
                onClick={() => setLbIndex((i) => (i == null ? i : Math.max(0, i - 1)))}
                className="rounded-md bg-white/10 px-3 py-1 border border-white/20 hover:bg-white/15"
              >
                ← Предыдущее
              </button>
              <button
                onClick={() =>
                  setLbIndex((i) => {
                    if (i == null) return i;
                    return Math.min(items.length - 1, i + 1);
                  })
                }
                className="rounded-md bg-white/10 px-3 py-1 border border-white/20 hover:bg-white/15"
              >
                Следующее →
              </button>
            </div>

            {/* подпись + удалить */}
            <div className="mt-4 flex items-center gap-2">
              {canManage ? (
                <>
                  <input
                    className="min-w-[40vw] rounded-md bg-white/10 border border-white/20 px-3 py-2 outline-none"
                    placeholder="Подпись к изображению…"
                    value={capDraft}
                    onChange={(e) => setCapDraft(e.target.value)}
                  />
                  <button
                    onClick={saveCaption}
                    className="rounded-md bg-white/10 px-3 py-2 border border-white/20 hover:bg-white/15"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => onDelete(currentItem()!.key)}
                    className="rounded-md bg-red-500/80 hover:bg-red-500 px-3 py-2 text-white"
                  >
                    Удалить
                  </button>
                </>
              ) : (
                <div className="text-white/80">{currentItem()!.caption ?? "Без подписи"}</div>
              )}
              <button
                onClick={() => setLbIndex(null)}
                className="ml-auto rounded-md bg-white/10 px-3 py-2 border border-white/20 hover:bg-white/15"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
