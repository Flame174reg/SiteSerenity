"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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

  const avatarSrc = (u: Row) =>
    u.avatar && u.avatar.trim().length > 0
      ? u.avatar
      : "/images/avatar-placeholder.png";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 grid grid-cols-[auto_1fr_auto_auto] gap-3 px-1 text-sm opacity-70">
        <div>Пользователь</div>
        <div></div>
        <div>Последний визит</div>
        <div>Админ</div>
      </div>
      <ul className="space-y-2">
        {rows.map((u) => (
          <li
            key={u.id}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
          >
            <Image
              src={avatarSrc(u)}
              alt={u.name ?? "avatar"}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
              priority
            />
            <div className="min-w-0">
              <div className="truncate">{u.name || "Без имени"}</div>
              <div className="truncate text-xs opacity-60">
                ID: {u.id}
                {u.isOwner ? " (владелец)" : ""}
              </div>
            </div>
            <div className="text-xs opacity-70">
              {new Date(u.lastSeen).toLocaleString("ru-RU")}
            </div>
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
      <p className="mt-3 text-xs opacity-60">
        Список формируется из тех, кто авторизовался хотя бы один раз.
      </p>
    </div>
  );
}
