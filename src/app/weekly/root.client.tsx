// src/app/weekly/root.client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import UploadClient from "./upload.client";

type Folder = {
  name: string;       // человекочитаемо (например "Апрель 2025")
  safe: string;       // URL-сегмент (encodeURIComponent(name))
  count: number;      // число видимых файлов
  coverUrl: string | null;
  updatedAt?: string | null;
};

type FoldersResp =
  | { ok: true; folders: Folder[] }
  | { ok: false; folders: Folder[]; error: string };

export default function WeeklyRootClient() {
  const [data, setData] = useState<FoldersResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  // анти-кеш
  const url = useMemo(() => `/api/weekly/folders?t=${Date.now()}`, []);

  async function loadOnce() {
    try {
      setErr(null);
      const r = await fetch(url, { cache: "no-store" });
      const j: FoldersResp = await r.json();
      setData(j);
      setLoading(false);
    } catch (e) {
      setErr(String(e));
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOnce();
    // права на загрузку/удаление (только владелец/админ)
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
  }, []);

  async function onCreateFolder() {
    const name = window.prompt("Название папки (например: Апрель 2025):")?.trim();
    if (!name) return;
    try {
      const r = await fetch("/api/weekly/folder/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await r.json();
      if (j?.ok && j.safe) {
        window.location.href = `/weekly/${j.safe}`;
      } else {
        alert(`Не удалось создать папку: ${j?.error ?? r.statusText}`);
      }
    } catch (e) {
      alert(String(e));
    }
  }

  async function onDeleteFolder(safe: string) {
    if (!canManage) return;
    if (!confirm("Удалить папку целиком? Все изображения и подписи будут удалены безвозвратно.")) return;
    try {
      const r = await fetch("/api/weekly/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ safe, all: true }),
      });
      const j = await r.json();
      if (j?.ok) {
        // обновим список
        loadOnce();
      } else {
        alert(`Не удалось удалить папку: ${j?.error ?? j?.reason ?? r.statusText}`);
      }
    } catch (e) {
      alert(String(e));
    }
  }

  const folders: Folder[] = (data && "folders" in data && data.folders) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Недельный актив</h1>
        <div className="flex items-center gap-3">
          {canManage && (
            <button
              onClick={onCreateFolder}
              className="rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 px-3 py-1.5 text-sm"
            >
              + Создать папку
            </button>
          )}
          <Link href="/weekly?all=1" className="text-sm underline text-white/80 hover:text-white">
            Показать все фото
          </Link>
        </div>
      </div>

      <p className="text-sm text-white/70">
        Тут Вы можете увидеть свой актив/явку за неделю. Выберите папку или создайте новую. Также можно загрузить
        фото сразу, указав название новой папки — она будет создана автоматически.
      </p>

      {/* Блок "быстрой" загрузки в новую/существующую папку */}
      <UploadClient />

      {/* Список папок */}
      {loading && <div className="text-white/70">Загружаем папки…</div>}
      {!loading && err && <div className="text-red-400">Ошибка: {err}</div>}
      {!loading && !err && folders.length === 0 && (
        <div className="text-white/70">
          Пока нет папок. Создайте первую — например, «Апрель 2025».
        </div>
      )}

      {!loading && !err && folders.length > 0 && (
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {folders.map((f) => (
            <li key={f.safe} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <Link href={`/weekly/${f.safe}`} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.coverUrl ?? "/icon.png"}
                  alt={f.name}
                  className="w-full h-56 object-cover"
                />
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{f.name}</h3>
                    <span className="text-xs text-white/60">{f.count}</span>
                  </div>
                  {f.updatedAt && (
                    <div className="text-xs text-white/50 mt-1">
                      обновлено: {new Date(f.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </Link>

              {canManage && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteFolder(f.safe);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition
                             rounded-md bg-red-500/80 hover:bg-red-500 text-white text-xs px-2 py-1"
                  title="Удалить папку"
                >
                  Удалить
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
