// src/app/weekly/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";

type Album = {
  safe: string;                // safe-сегмент (из URL)
  name: string;                // человекочитаемое имя
  updatedAt: string | null;    // дата обновления
  count: number;               // кол-во фото
};

type ListResp =
  | { ok: true; categories: Album[] }
  | { ok: true; albums: Album[] } // на случай другого поля в ответе
  | { ok: false; error: string; categories?: Album[]; albums?: Album[] };

const COVER_URL = "https://i.ibb.co/TBZ5CXFW/logo.png";

export default function WeeklyPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Загружаем список альбомов и право управления
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/weekly/list", { cache: "no-store" });
        const j: ListResp = await r.json();

        const xs = (j as any).categories ?? (j as any).albums ?? [];
        const norm: Album[] = (xs as any[]).map((a) => ({
          safe: String(a.safe ?? a.categorySafe ?? a.id ?? ""),
          name:
            String(
              a.name ??
                a.categoryHuman ??
                decodeURIComponent(String(a.safe ?? a.categorySafe ?? ""))
            ) || "Без названия",
          updatedAt: a.updatedAt ?? a.lastModified ?? null,
          count: Number(a.count ?? a.items ?? a.total ?? 0),
        }));

        setAlbums(norm);
      } catch (e) {
        setErr("Не удалось загрузить список альбомов");
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
  }, []);

  // Обновление подписи альбома (отображаемого имени)
  const onEditAlbumCaption = useCallback(
    async (album: Album) => {
      if (!canManage) return;
      const name = window.prompt("Подпись альбома", album.name) ?? "";
      const newName = name.trim();
      if (!newName) return;

      try {
        setBusyKey(album.safe);
        const r = await fetch("/api/weekly/folder/caption", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ safe: album.safe, name: newName }),
        });
        const j = await r.json().catch(() => ({}));
        if (!j?.ok) {
          alert(`Не удалось сохранить подпись: ${String(j?.error ?? r.statusText)}`);
          return;
        }
        setAlbums((xs) =>
          xs.map((x) => (x.safe === album.safe ? { ...x, name: newName } : x))
        );
      } catch (e) {
        alert(String(e));
      } finally {
        setBusyKey(null);
      }
    },
    [canManage]
  );

  // Удаление альбома (папки) целиком
  const onDeleteAlbum = useCallback(
    async (album: Album) => {
      if (!canManage) return;
      if (!confirm(`Удалить альбом «${album.name}» и все его фото?`)) return;
      try {
        setBusyKey(album.safe);
        // Префикс: weekly/<safe>/
        const prefix = `weekly/${album.safe}/`;
        const r = await fetch("/api/weekly/folder/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prefix }),
        });
        const j = await r.json().catch(() => ({}));
        if (!j?.ok) {
          alert(`Не удалось удалить альбом: ${String(j?.error ?? r.statusText)}`);
          return;
        }
        setAlbums((xs) => xs.filter((x) => x.safe !== album.safe));
      } catch (e) {
        alert(String(e));
      } finally {
        setBusyKey(null);
      }
    },
    [canManage]
  );

  const formatDate = useCallback((s: string | null) => {
    if (!s) return "—";
    try {
      const d = new Date(s);
      return d.toLocaleString("ru-RU");
    } catch {
      return s;
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Недельный актив</h1>
        <Link href="/weekly/all" className="text-white/70 hover:text-white underline">
          Показать все фото
        </Link>
      </div>

      <p className="mb-4 text-white/70">
        Тут вы можете увидеть свой актив/явку за неделю. Выберите папку или создайте новую.
        Также можно загрузить фото сразу, указав название новой папки — она будет создана автоматически.
      </p>

      {/* Форма загрузки (как и раньше) */}
      {/* Если у вас уже вставлен UploadClient в этом файле — оставьте только один экземпляр */}
      {/* @ts-expect-error Server/Client mixing ok if component exists in проекте */}
      {/* <UploadClient categories={albums.map(a => a.name)} /> */}

      {loading && <div className="text-white/70">Загружаем альбомы…</div>}
      {!loading && err && <div className="text-red-400">{err}</div>}
      {!loading && !err && albums.length === 0 && (
        <div className="text-white/70">Альбомов пока нет.</div>
      )}

      {!loading && !err && albums.length > 0 && (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <li
              key={a.safe}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-0 overflow-hidden"
            >
              <Link href={`/weekly/${encodeURIComponent(a.safe)}`}>
                <div className="relative h-40 w-full">
                  <Image
                    src={COVER_URL}
                    alt={a.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </Link>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/weekly/${encodeURIComponent(a.safe)}`}
                    className="truncate font-semibold hover:underline"
                  >
                    {a.name}
                  </Link>
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                    {a.count}
                  </span>
                </div>

                <div className="mt-2 text-xs text-white/60">
                  обновлено: {formatDate(a.updatedAt)}
                </div>
              </div>

              {canManage && (
                <div className="pointer-events-auto absolute right-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    disabled={busyKey === a.safe}
                    onClick={() => onEditAlbumCaption(a)}
                    className="rounded-md bg-white/90 px-2 py-1 text-xs text-black hover:bg-white disabled:opacity-60"
                    title="Изменить подпись"
                  >
                    Подпись
                  </button>
                  <button
                    disabled={busyKey === a.safe}
                    onClick={() => onDeleteAlbum(a)}
                    className="rounded-md bg-red-500/90 px-2 py-1 text-xs text-white hover:bg-red-500 disabled:opacity-60"
                    title="Удалить альбом"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
