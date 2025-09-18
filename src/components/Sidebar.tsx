"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import AccountCard from "./AccountCard";

const OWNER_ID = "1195944713639960601";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const { data: session } = useSession();

  const meId =
    (session?.user as { id?: string; email?: string } | undefined)?.id ||
    (session?.user as { email?: string } | undefined)?.email ||
    null;
  const isOwner = meId === OWNER_ID;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const Item = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className="block rounded-lg px-3 py-2 hover:bg-white/10"
    >
      {children}
    </Link>
  );

  return (
    <>
      {/* кнопка-бургер */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-20 z-40 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm backdrop-blur hover:bg-white/10"
        aria-label="Открыть меню"
      >
        ☰
      </button>

      {/* затемнение */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* панель */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[320px] transform bg-black/70 p-4 text-sm backdrop-blur transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Навигация</div>
          <button
            ref={closeBtnRef}
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>

        {/* Личный кабинет / авторизация */}
        <AccountCard />

        <div className="mt-4 space-y-3">
          {/* Админ-панель — только владельцу */}
          {isOwner && <Item href="/admin">Админ-панель</Item>}

          <Item href="/">Главная</Item>

          <div className="px-3 pt-3 text-xs uppercase opacity-60">Памятки</div>
          {/* правильные пути из репозитория */}
          <Item href="/memos/gov">Памятки госника</Item>
          <Item href="/memos/interrogations">Памятка по допросам</Item>
          <Item href="/memos/anti">Памятка против душки</Item>

          <div className="px-3 pt-3 text-xs uppercase opacity-60">Документы</div>
          <Item href="/contracts">Контракты</Item>
          <Item href="/weekly">Недельный актив</Item>
        </div>
      </aside>
    </>
  );
}
