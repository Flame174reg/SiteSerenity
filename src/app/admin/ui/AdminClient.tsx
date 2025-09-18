// src/app/admin/ui/AdminClient.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Row = {
  id: string;
  name?: string;
  avatar?: string | null;
  lastSeen: string;
  isAdmin: boolean;
  isOwner: boolean;
  isSuperAdmin?: boolean;
};

function discordFallback(id: string): string {
  const n = Number.isFinite(Number(id)) ? Number(id) % 5 : 0;
  return `https://cdn.discordapp.com/embed/avatars/${n}.png?size=64`;
}

function pickAvatar(u: Row): string {
  const a = (u.avatar ?? "").trim();
  if (!a) return discordFallback(u.id);
  try {
    const url = new URL(a);
    if (url.protocol === "http:" || url.protocol === "https:") return a;
  } catch {
    /* ignore */
  }
  return discordFallback(u.id);
}

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
        const base = (j.users || []).map((u) => ({
          ...u,
          isSuperAdmin: u.isOwner, // владелец = суперадмин
        }));

        const ids = base.map((u) => u.id);
        const r2 = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids }),
          cache: "no-store",
        });
        if (r2.ok) {
          const j2 = (await r2.json()) as {
            ok: boolean;
            roles?: Record<string, { isAdmin: boolean; isSuperAdmin: boolean }>;
          };
          if (j2?.ok && j2.roles) {
            for (const u of base) {
              const role = j2.roles[u.id];
              if (role) {
                u.isSuperAdmin = u.isOwner || role.isSuperAdmin;
                u.isAdmin = u.isOwner || role.isAdmin;
              }
            }
          }
        }

        setRows(base);
      } catch {
        setError("Не удалось загрузить список пользователей");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleAdmin(id: string, admin: boolean) {
    setSaving(id);
    try {
      const r = await fetch("/api/admin/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, admin }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      setRows((xs) =>
        xs.map((x) =>
          x.id === id
            ? { ...x, isAdmin: admin || x.isOwner || x.isSuperAdmin === true }
            : x
        )
      );
    } catch {
      alert("Не удалось сохранить роль Админ");
    } finally {
      setSaving(null);
    }
  }

  async function toggleSuper(id: string, superFlag: boolean) {
    setSaving(id);
    try {
      const r = await fetch("/api/admin/super/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, super: superFlag }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !j?.ok) {
        const msg = j?.error || r.statusText || "unknown error";
        throw new Error(msg);
      }
      setRows((xs) =>
        xs.map((x) =>
          x.id === id
            ? {
                ...x,
                isSuperAdmin: superFlag || x.isOwner,
                isAdmin: superFlag || x.isOwner || x.isAdmin,
              }
            : x
        )
      );
    } catch (e) {
      alert(`Не удалось сохранить роль Суперадмин: ${String(e instanceof Error ? e.message : e)}`);
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <div className="opacity-70">Загрузка…</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 text-sm opacity-70 mb-2 px-1">
        <div>Пользователь</div>
        <div />
        <div>Последний визит</div>
        <div>Админ</div>
        <div>Супер</div>
      </div>

      <ul className="space-y-2">
        {rows.map((u) => (
          <li
            key={u.id}
            className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
          >
            <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
              <Image
                src={pickAvatar(u)}
                alt={u.name || "avatar"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
                unoptimized
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement & { src: string };
                  img.src = discordFallback(u.id);
                }}
                priority
              />
            </div>

            <div className="min-w-0">
              <div className="truncate">{u.name || "Без имени"}</div>
              <div className="text-xs opacity-60 truncate">
                ID: {u.id}
                {u.isOwner ? " (владелец)" : ""}
              </div>
            </div>

            <div className="text-xs opacity-70">
              {new Date(u.lastSeen).toLocaleString("ru-RU")}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                disabled={u.isOwner || saving === u.id}
                checked={u.isOwner || u.isAdmin || u.isSuperAdmin}
                onChange={(e) => toggleAdmin(u.id, e.target.checked)}
                title="Админ"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                disabled={u.isOwner || saving === u.id}
                checked={u.isOwner || !!u.isSuperAdmin}
                onChange={(e) => toggleSuper(u.id, e.target.checked)}
                title="Суперадмин"
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs opacity-60 mt-3">
        Список формируется из тех, кто авторизовался хотя бы один раз.
      </p>
    </div>
  );
}
