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

  const queryUrl = useMemo(() => {
    const ts = Date.now();
    const sp = new URLSearchParams({ safe: categorySafe, t: String(ts) });
    return `/api/weekly/list?${sp.toString()}`;
  }, [categorySafe]);

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
        setData((prev) => {
          if (!prev || !("ok" in prev) || !prev.ok) return prev;
          return {
            ...prev,
            items: prev.items.filter((it) => it.key !== key),
          };
        });
      } else {
        alert(`Не удалось удалить: ${j?.error ?? j?.reason ?? r.statusText}`);
      }
    } catch (e) {
      alert(String(e));
    }
  }

  const items = (data && "ok" in data && data.ok) ? data.items : [];
  const categories = (data && data.categories) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Недельный актив — {categoryHuman}</h1>
        <Link href="/weekly" className="text-sm underline text-white/80 hover:text-white">
          Все папки
        </Link>
      </div>

      <p className="text-sm text-white/70">
        Тут вы можете увидеть свой актив/явку за неделю. Загрузка идёт строго в папку{" "}
        <span className="font-medium">{categoryHuman}</span>.
      </p>

      <UploadClient
        defaultCategory={categoryHuman}
        categories={[categoryHuman, ...categories.filter((c) => c !== categoryHuman)]}
        forcedCategorySafe={categorySafe}
      />

      {loading && <div className="text-white/70">Загружаем…</div>}
      {!loading && err && <div className="text-red-400">Ошибка загрузки списка: {err}</div>}
      {!loading && !err && data && "ok" in data && !data.ok && (
        <div className="text-red-400">Ошибка загрузки списка: {data.error}</div>
      )}

      {!loading && !err && data && "ok" in data && data.ok && (
        items.length > 0 ? (
          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((it) => (
              <li
                key={it.key}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5"
                title={it.caption ?? ""}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.url}
                  alt={it.caption ?? ""}
                  className="w-full h-64 object-cover"
                  loading="lazy"
                />
                {it.caption ? (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-sm drop-shadow">{it.caption}</p>
                  </div>
                ) : null}

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
    </div>
  );
}
