"use client";

import Image from "next/image";
import { useState } from "react";

type Item = {
  url: string;
  key: string;
  category: string;
  caption?: string | null;
};

export default function GalleryClient({ items, isAdmin }: { items: Item[]; isAdmin: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function onDelete(key: string) {
    if (!confirm("Удалить изображение?")) return;
    setBusy(key);
    try {
      const res = await fetch("/api/weekly/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        alert(`Ошибка удаления: ${data?.reason || data?.error || res.status}`);
      } else {
        location.reload();
      }
    } finally {
      setBusy(null);
    }
  }

  async function onEdit(key: string, prev: string | null | undefined) {
    const caption = prompt("Подпись к фото:", prev ?? "") ?? prev;
    if (caption === prev) return;
    setBusy(key);
    try {
      const res = await fetch("/api/weekly/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, caption }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        alert(`Ошибка сохранения подписи: ${data?.reason || data?.error || res.status}`);
      } else {
        location.reload();
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((it) => (
        <li key={it.key} className="group relative border border-white/10 rounded-xl overflow-hidden bg-black/30 backdrop-blur">
          <a href={it.url} target="_blank" rel="noreferrer" className="block">
            <Image
              src={it.url}
              alt={it.key}
              width={900}
              height={600}
              className="object-cover w-full h-48"
              unoptimized
            />
          </a>

          {/* подпись */}
          <div className="px-3 py-2 text-xs text-white bg-gradient-to-t from-black/60 to-transparent">
            {it.caption ? <span>{it.caption}</span> : <span className="opacity-70">Без подписи</span>}
          </div>

          {/* админ-действия */}
          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => onEdit(it.key, it.caption ?? "")}
                disabled={busy === it.key}
                className="px-2 py-1 text-xs rounded bg-white/90 text-black hover:bg-white disabled:opacity-50"
                title="Изменить подпись"
              >
                Подпись
              </button>
              <button
                onClick={() => onDelete(it.key)}
                disabled={busy === it.key}
                className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                title="Удалить"
              >
                Удалить
              </button>
            </div>
          )}

          {/* путь */}
          <div className="px-3 pb-2 text-[11px] text-white/90 break-all">{it.key}</div>
        </li>
      ))}
    </ul>
  );
}
