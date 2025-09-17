// src/app/weekly/page.tsx
import Link from "next/link";

type FoldersResp = {
  ok: boolean;
  folders: { name: string; safe: string; count: number; coverUrl: string | null; updatedAt?: string | null }[];
};

async function getFolders(): Promise<FoldersResp["folders"]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/weekly/folders`, {
    cache: "no-store",
  }).catch(() => null);
  const json = (await res?.json().catch(() => null)) as FoldersResp | null;
  return json?.folders ?? [];
}

export default async function WeeklyRootPage() {
  const folders = await getFolders();

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Недельный актив</h1>
          <Link
            href="/"
            className="text-sm text-white/80 hover:text-white border border-white/20 rounded px-3 py-1"
          >
            ← На главную
          </Link>
        </div>

        <p className="text-white/70">Выберите папку, чтобы просмотреть или загрузить изображения за неделю.</p>

        <CreateFolderClient />

        {/* сетка папок */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {folders.map((f) => (
            <Link
              key={f.safe}
              href={`/weekly/${f.safe}`}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
            >
              {/* обложка */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {f.coverUrl ? (
                <img
                  src={f.coverUrl}
                  alt={f.name}
                  className="h-44 w-full object-cover opacity-90 transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-44 w-full grid place-items-center text-white/30 text-sm">
                  (папка пуста)
                </div>
              )}

              <div className="p-3 flex items-center justify-between">
                <div className="text-white font-medium">{f.name}</div>
                <div className="text-white/70 text-sm">{f.count}</div>
              </div>
            </Link>
          ))}
        </div>

        {folders.length === 0 && (
          <div className="text-white/60 text-sm">Папок пока нет — создайте первую.</div>
        )}
      </div>
    </main>
  );
}

/* ---------- КЛИЕНТ-СОЗДАТЕЛЬ ПАПОК ---------- */
"use client";
import { useState } from "react";

function CreateFolderClient() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    setMsg(null);
    const n = name.trim();
    if (!n) return setMsg("Укажите название папки.");
    if (n.includes("/")) return setMsg("В названии папки нельзя использовать «/».");
    setBusy(true);
    try {
      const r = await fetch("/api/weekly/folder/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      const j: any = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok !== true) {
        setMsg(`Ошибка: ${j?.reason ?? j?.error ?? r.status}`);
      } else {
        window.location.href = `/weekly/${j.safe}`;
      }
    } catch (e) {
      setMsg(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например: Апрель 2025"
        className="bg-transparent border border-white/20 rounded px-3 py-1 text-sm text-white w-64"
      />
      <button
        onClick={create}
        disabled={busy}
        className="px-3 py-1 rounded bg-white text-black text-sm font-medium disabled:opacity-50"
      >
        Создать папку
      </button>
      {msg && <span className="text-sm text-white/80">{msg}</span>}
    </div>
  );
}
