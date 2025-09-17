// src/app/weekly/[category]/page.tsx
import Link from "next/link";
import UploadClient from "../upload.client";

type WeeklyListResp = {
  ok: boolean;
  items: {
    url: string;
    key: string;
    category: string;      // human-readable
    caption?: string | null;
    uploadedAt?: string;
    size?: number;
  }[];
  categories: string[];
  error?: string;
};

export const dynamic = "force-dynamic";

export default async function WeeklyCategoryPage(props: { params: { category: string } }) {
  const categorySafe = props.params.category;                 // safe-сегмент из URL
  const categoryHuman = decodeURIComponent(categorySafe);     // человекочитаемо

  // тянем содержимое ПАПКИ по safe
  const r = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/weekly/list?safe=${encodeURIComponent(categorySafe)}`,
    { cache: "no-store" }
  ).catch(() => null);

  const data: WeeklyListResp =
    (await r?.json().catch(() => null)) ??
    { ok: false, items: [], categories: [], error: "fetch_failed" };

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">Недельный актив — {categoryHuman}</h1>
          <Link href="/weekly" className="text-sm underline text-white/80 hover:text-white">Все папки</Link>
        </div>
        <p className="text-sm text-white/70">
          Тут вы можете увидеть свой актив/явку за неделю. Загрузка идёт строго в папку <span className="font-medium">{categoryHuman}</span>.
        </p>

        {/* Загрузчик (жёстко в текущую папку) */}
        <UploadClient
          defaultCategory={categoryHuman}
          categories={[categoryHuman, ...data.categories.filter(c => c !== categoryHuman)]}
          forcedCategorySafe={categorySafe}
        />

        {/* Контент папки */}
        {data.ok ? (
          data.items.length > 0 ? (
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.items.map((it) => (
                <li key={it.key} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.url}
                    alt={it.caption ?? ""}
                    className="w-full h-64 object-cover"
                    loading="lazy"
                  />
                  {/* подпись — белая, как просили */}
                  {it.caption ? (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-white text-sm drop-shadow">{it.caption}</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 text-white/70">В этой папке пока нет изображений.</div>
          )
        ) : (
          <div className="mt-6 text-red-400">Ошибка загрузки списка: {data.error}</div>
        )}
      </div>
    </main>
  );
}
