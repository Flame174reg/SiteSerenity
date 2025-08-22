"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountCard from "./AccountCard";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Закрывать меню при смене маршрута
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Блокируем прокрутку страницы, когда меню открыто
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    // Фокус на кнопку "закрыть" при открытии
    if (open) closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Закрытие по Esc
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
      {/* плавающая кнопка-бургер */}
      <button
        aria-label="Открыть меню"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-20 z-40 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm backdrop-blur hover:bg-white/10"
      >
        ☰
      </button>

      {/* затемнение */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* панель */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] border-r border-white/10 bg-black/80 backdrop-blur-lg transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
          <span id="sidebar-title" className="font-semibold">
            Навигация
          </span>
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
        <div className="p-3 border-b border-white/10">
          <AccountCard />
        </div>

        <nav className="p-3 space-y-1 text-sm">
          <Item href="/admin">Админ-панель</Item>
          <Item href="/">Главная</Item>

          <div className="px-3 pt-2 pb-1 text-xs uppercase opacity-60">Памятки</div>
          <div className="ml-2 space-y-1">
            <Item href="/memos/gov">Памятки госника</Item>
            <Item href="/memos/interrogations">Памятка по допросам</Item>
            <Item href="/memos/anti">Памятка против душки</Item>
          </div>

          <div className="px-3 pt-3 pb-1 text-xs uppercase opacity-60">Документы</div>
          <Item href="/contracts">Контракты</Item>
          <Item href="/weekly">Недельный актив</Item>
        </nav>
      </aside>
    </>
  );
}
