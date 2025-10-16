"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-56px)] grid place-items-center px-6">
      <section className="w-full max-w-4xl text-center space-y-6">
        <div className="card-soft p-10">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Site Serenity
          </h1>
          <p className="mt-3 text-lg muted">
            Семейный портал — новости, памятки и еженедельник в одном аккуратном месте.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link href="/weekly" className="btn">Еженедельник</Link>
            <Link href="/contracts" className="btn-ghost">Документы</Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-left">
            <div className="text-sm muted">Быстрый доступ</div>
            <div className="mt-2 font-semibold">Памятки</div>
          </div>
          <div className="card text-left">
            <div className="text-sm muted">Управление</div>
            <div className="mt-2 font-semibold">Админ-панель</div>
          </div>
          <div className="card text-left">
            <div className="text-sm muted">Профиль</div>
            <div className="mt-2 font-semibold">Личный кабинет</div>
          </div>
        </div>
      </section>
    </main>
  );
}
