/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

function UserBadgeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-red-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75H4.5v-.75z"
      />
    </svg>
  );
}

export default function AccountCard() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  // ⬇️ Отмечаем вход пользователя (для списка в админке)
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/admin/seen", { method: "POST" }).catch(() => {});
    }
  }, [status]);

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white">
          <UserBadgeIcon />
        </div>
        <div className="min-w-0">
          <div className="text-xs muted">
            {loading ? (
              "Загрузка…"
            ) : session ? (
              <>
                <span className="small">USER ID:</span>{" "}
                <span className="font-semibold">
                  {(session as any)?.discordId ?? session?.user?.email ?? session?.user?.name ?? "—"}
                </span>
              </>
            ) : (
              "Личный кабинет"
            )}
          </div>
          <div className="text-base font-semibold leading-tight">Личный кабинет</div>
        </div>
      </div>

      <div className="mt-3">
        {loading ? null : session ? (
          <div className="flex items-center gap-2">
            <Link href="/account" className="btn-ghost inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm">
              Открыть →
            </Link>
            <button onClick={() => signOut()} className="btn inline-flex items-center gap-1">
              Выйти
            </button>
          </div>
        ) : (
          <button onClick={() => signIn("discord")} className="btn inline-flex items-center gap-1">
            Войти →
          </button>
        )}
      </div>
    </div>
  );
}
