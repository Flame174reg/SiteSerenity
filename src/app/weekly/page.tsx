/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";

type Photo = { id: number; url: string; discord_id: string | null; created_at: string };

export default function Weekly() {
  const [list, setList] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/photo/list", { cache: "no-store" });
    setList(await res.json());
  };

  useEffect(() => { load(); }, []);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/photo/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      await load();
      e.currentTarget.reset();
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Недельный актив</h1>
        <p className="opacity-70 text-sm">Загружать фото могут только пользователи с правами.</p>
      </header>

      <form onSubmit={onUpload} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <input name="file" type="file" accept="image/*" required className="text-sm" />
          <input name="name" type="text" placeholder="название файла (опц.)" className="px-2 py-1 rounded bg-black/30 border border-white/10 text-sm" />
          <button
            disabled={busy}
            className="px-3 py-1.5 rounded bg-white/10 border border-white/10 hover:bg-white/20 text-sm"
          >
            {busy ? "Загрузка..." : "Загрузить"}
          </button>
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
      </form>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <a key={p.id} href={p.url} target="_blank" className="group rounded-lg overflow-hidden border border-white/10 bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="w-full h-56 object-cover group-hover:opacity-90 transition" />
            <div className="p-2 text-xs opacity-70">
              {new Date(p.created_at).toLocaleString()} {p.discord_id ? `• ${p.discord_id}` : ""}
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
