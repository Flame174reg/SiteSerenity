"use client";

import { useEffect, useState } from "react";
import Image from 'next/image';

type Row = {
  id: string;
  name?: string;
  avatar?: string;
  lastSeen: string;
  isAdmin: boolean;
  isOwner: boolean;
};

export default function AdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/users", { cache: "no-store" });
        if (!r.ok) throw new Error(`${r.status}`);
        const j = (await r.json()) as { users: Row[] };
        setRows(j.users || []);
      } catch {
        setError("Не удалось загрузить список пользователей");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggle(id: string, admin: boolean) {
    setSaving(id);
    try {
      const r = await fetch("/api/admin/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, admin }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      setRows((xs) => xs.map((x) => (x.id === id ? { ...x, isAdmin: admin } : x)));
    } catch {
      alert("Не удалось сохранить");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <div className="opacity-70">Загрузка…</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 text-sm opacity-70 mb-2 px-1">
        <div>Пользователь</div><div></div><div>Последний визит</div><div>Админ</div>
      </div>
      <ul className="space-y-2">
        {rows.map((u) => (
          <li key={u.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
            <img src={u.avatar || "/favicon.ico"} alt="" className="h-8 w-8 rounded-full object-cover bg-black/30" />
            <div className="min-w-0">
              <div className="truncate">{u.name || "Без имени"}</div>
              <div className="text-xs opacity-60 truncate">ID: {u.id}{u.isOwner ? " (владелец)" : ""}</div>
            </div>
            <div className="text-xs opacity-70">{new Date(u.lastSeen).toLocaleString("ru-RU")}</div>
            <div>
              <input
                type="checkbox"
                disabled={u.isOwner || saving === u.id}
                checked={u.isOwner || u.isAdmin}
                onChange={(e) => toggle(u.id, e.target.checked)}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs opacity-60 mt-3">Список формируется из тех, кто авторизовался хотя бы один раз.</p>
    </div>
  );
}
