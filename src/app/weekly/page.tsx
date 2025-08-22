/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

type WeeklyPhoto = { url: string; author: string; createdAt: string };

export default function WeeklyPage() {
  const [photos, setPhotos] = useState<WeeklyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/photo/list", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();

        const list: WeeklyPhoto[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.photos)
          ? data.photos
          : [];

        setPhotos(list.filter(p => typeof p?.url === "string"));
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Недельный актив</h1>

        {loading && <div className="opacity-70">Загрузка…</div>}

        {error && (
          <div className="text-red-400">
            Не удалось загрузить список фото: {error}
          </div>
        )}

        {!loading && !error && photos.length === 0 && (
          <div className="opacity-70">Пока нет фотографий.</div>
        )}

        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p, i) => (
            <li
              key={`${p.url}-${i}`}
              className="rounded-xl overflow-hidden border border-white/10 bg-white/5"
            >
              <div className="aspect-[4/3] bg-black/30">
                <img
                  src={p.url}
                  alt={p.author ? `Фото от ${p.author}` : "Фото отчёта"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-3 text-sm flex items-center justify-between">
                <span className="opacity-80">{p.author || "Неизвестный автор"}</span>
                <time className="opacity-60">
                  {p.createdAt ? new Date(p.createdAt).toLocaleString("ru-RU") : ""}
                </time>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
