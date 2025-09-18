// src/app/weekly/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import UploadClient from "./upload.client";

type Album = {
  safe: string;             // safe-сегмент (из URL)
  name: string;             // человекочитаемое имя
  updatedAt: string | null; // дата последнего изменения
  count: number;            // количество фото
};

const COVER_URL = "https://i.ibb.co/TBZ5CXFW/logo.png";

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function normalizeAlbum(a: unknown): Album {
  const r = isRec(a) ? a : {};
  const rawSafe =
    (typeof r.safe === "string" && r.safe) ||
    (typeof r.categorySafe === "string" && r.categorySafe) ||
    (typeof r.id === "string" && r.id) ||
    "";
  const safe = String(rawSafe);
  const rawName =
    (typeof r.name === "string" && r.name) ||
    (typeof r.categoryHuman === "string" && r.categoryHuman) ||
    decodeURIComponent(safe);
  const updatedAt =
    (typeof r.updatedAt === "string" && r.updatedAt) ||
    (typeof r.lastModified === "string" && r.lastModified) ||
    null;
  const rawCount =
    (typeof r.count === "number" && r.count) ||
    (typeof r.items === "number" && r.items) ||
    (typeof r.total === "number" && r.total) ||
    0;

  return {
    safe,
    name: rawName || "Без названия",
    updatedAt,
    count: Number(rawCount),
  };
}
function extractAlbumsFromResp(j: unknown): unknown[] {
  if (!isRec(j)) return [];
  const fromCategories = asArray(j.categories);
  if (fromCategories.length) return fromCategories;
  const fromAlbums = asArray(j.albums);
  if (fromAlbums.length) return fromAlbums;
  return [];
}

export default function WeeklyPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // основной эндпоинт
      let r = await fetch("/api/weekly/list", { cache: "no-store" });
      let j: unknown = await r.json();
      let raw = extractAlbumsFromResp(j);

      // запасной эндпоинт
      if (!Array.isArray(raw) || raw.length === 0) {
        try {
          r = await fetch("/api/weekly/categories", { cache: "no-store" });
          j = await r.json();
          raw = extractAlbumsFromResp(j);
        } catch { /* ignore */ }
      }

      const norm = (raw || []).map(normalizeAlbum);
      setAlbums(norm);
    } catch {
      setErr("Не удалось загрузить список альбомов");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCanManage = useCallback(async () => {
    try {
      const r = await fetch("/api/photo/can-upload", { cache: "no-store" });
      const j: unknown = await r.json();
      const jr = isRec(j) ? j : {};
      setCanManage(Boolean(jr.canUpload ?? jr.ok));
    } catch {
      setCanManage(false);
    }
  }, []);

  useEffect(() => {
    void loadAlbums();
    void loadCanManage();
  }, [loadAlbums, loadCanManage]);

  // --- действия с альбомом ---
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
        const j: unknown = await r.json().catch(() => null);
        const ok = isRec(j) && typeof j.ok === "boolean" ? j.ok : false;
        if (!ok) {
          const msg = isRec(j) && typeof j.error === "string" ? j.error : r.statusText;
          alert(`Не удалось сохранить подпись: ${msg}`);
          return;
        }
        setAlbums((xs) => xs.map((x) => (x.safe === album.safe ? { ...x, name: newName } : x)));
      } catch (e) {
        alert(String(e));
      } finally {
        setBusyKey(null);
      }
    },
    [canManage],
  );

  const onDeleteAlbum = useCallback(
    async (album: Album) => {
      if (!canManage) return;
      if (!confirm(`Удалить альбом «${album.name}» и все его фото?`)) return;
      try {
        setBusyKey(album.safe);
        const prefix = `weekly/${album.safe}/`;
        const r = await fetch("/api/weekly/folder/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prefix }),
        });
        const j: unknown = await r.json().catch(() => null);
        const ok = isRec(j) && typeof j.ok === "boolean" ? j.ok : false;
        if (!ok) {
          const msg = isRec(j) && typeof j.error === "string" ? j.error : r.statusText;
          alert(`Не удалось удалить альбом: ${msg}`);
          return;
        }
        setAlbums((xs) => xs.filter((x) => x.safe !== album.safe));
      } catch (e) {
        alert(String(e));
      } finally {
        setBusyKey(null);
      }
    },
    [canManage],
  );

  const formatDate = useCallback((s: string | null) => {
    if (!s) return "—";
    try {
      return new Date(s).toLocaleString("ru-RU");
    } catch {
      return s;
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Недельный актив</h1>
        <Link href="/weekly/all" className="underline text-white/70 hover:text-white">
          Показать все фото
        </Link>
      </div>

      <p className="mb-4 text-white/70">
        Тут Вы можете увидеть свой актив/явку за неделю. Выберите папку или создайте новую.
        Также можно загрузить фото сразу, указав название новой папки — она будет создана автоматически.
      </p>

      <UploadClient
        categories={albums.map((a) => a.name)}
        onUploaded={loadAlbums}
      />

      {loading && <div className="mt-4 text-white/70">Загружаем альбомы…</div>}
      {!loading && err && <div className="mt-4 text-red-400">{err}</div>}
      {!loading && !err && albums.length === 0 && (
        <div className="mt-4 text-white/70">Альбомов пока нет.</div>
      )}

      {!loading && !err && albums.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <li
              key={a.safe}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-0"
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
                <div className="absolute right-3 top-3 z-10 flex gap-2">
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
