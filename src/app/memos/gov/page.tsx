import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Памятки госника",
  description: "Подборка основных кодексов, прецедентов и полезных ссылок",
};

type LinkItem = { title: string; href: string };

const links: LinkItem[] = [
  {
    title: "Судебные Прецеденты и Толкования",
    href: "https://forum.majestic-rp.ru/threads/sudebnyye-pretsedenty-i-tolkovaniya.2263276/",
  },
  {
    title: "Процессуальный кодекс",
    href: "https://forum.majestic-rp.ru/threads/protsessual-nyi-kodeks-shtata-san-andreas.2190752/",
  },
  {
    title: "Уголовный кодекс",
    href: "https://forum.majestic-rp.ru/threads/ugolovnyi-kodeks-shtata-san-andreas.2190757/",
  },
  {
    title: "Гражданский кодекс",
    href: "https://forum.majestic-rp.ru/threads/grazhdanskii-kodeks-shtata-san-andreas.2190952/",
  },
  {
    title: "Дорожный кодекс",
    href: "https://forum.majestic-rp.ru/threads/dorozhnyi-kodeks-shtata-san-andreas.2190948/",
  },
  {
    title: "Трудовой кодекс",
    href: "https://forum.majestic-rp.ru/threads/trudovoi-kodeks-shtata-san-andreas.2190945/",
  },
  {
    title: "Конституция",
    href: "https://forum.majestic-rp.ru/threads/konstitutsiya-shtata-san-andreas.2190783/",
  },
  {
    title: "Этический кодекс",
    href: "https://forum.majestic-rp.ru/threads/eticheskii-kodeks-shtata-san-andreas.2190761/",
  },
  {
    title: "Административный кодекс",
    href: "https://forum.majestic-rp.ru/threads/administrativnyi-kodeks-shtata-san-andreas.2190759/",
  },
  {
    title: "Поиск по законам и ассистент",
    href: "https://docossum.space/legal/seattle",
  },
  {
    title: "Таблица разрешённых вещей 1.18 ПГО",
    href: "https://docs.google.com/spreadsheets/d/1UNmIeS1-vYGEoT0-ScQwgDZTd4ciuIbMJXTwZhyMM7U/edit?gid=556123862#gid=556123862",
  },
];

export default function GovMemosPage() {
  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Памятки госника</h1>
          <p className="text-gray-400">
            Быстрый доступ к кодексам, прецедентам и инструментам.
          </p>
        </header>

        <section className="grid gap-3">
          {links.map((item, i) => (
            <a
              key={i}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <span className="opacity-70 group-hover:opacity-100">↗</span>
              </div>
              <p className="mt-1 text-xs opacity-60 break-all">{item.href}</p>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
