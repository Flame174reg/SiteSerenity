"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  // Блокируем прокрутку страницы, когда меню открыто
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
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
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
          <span className="font-semibold">Навигация</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>

        <nav className="p-3 space-y-1 text-sm">
          <Item href="/">Главная</Item>

          <div className="px-3 pt-2 pb-1 text-xs uppercase opacity-60">
            Памятки
          </div>

          {/* Общий раздел (если сделаем страницу /memos) */}
          {/* <Item href="/memos">Все памятки</Item> */}

          {/* Конкретные памятки */}
          <div className="ml-2 space-y-1">
            {/* Когда появится отдельная страница гос.памяток — поменяй href */}
            <Item href="/memos/gov">Памятки госника</Item>
            <Item href="/memos/interrogations">Памятка по допросам</Item>
            <Item href="/memos/anti">Памятка против душки</Item>
          </div>

          <div className="px-3 pt-3 pb-1 text-xs uppercase opacity-60">
            Документы
          </div>
          <Item href="/contracts">Контракты</Item>
        </nav>
      </aside>
    </>
  );
}
