// src/app/weekly/create-folder.client.tsx
"use client";

import { useState } from "react";

type CreateFolderResponse = {
  ok: boolean;
  name?: string;
  safe?: string;
  reason?: string;
  error?: string;
};

export default function CreateFolderClient() {
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

      const raw: unknown = await r.json().catch(() => ({}));
      const data = raw as Partial<CreateFolderResponse>;

      if (!r.ok || data.ok !== true || !data.safe) {
        setMsg(`Ошибка: ${data.reason ?? data.error ?? r.status}`);
      } else {
        window.location.href = `/weekly/${data.safe}`;
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
