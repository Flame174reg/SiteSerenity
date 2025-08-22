// src/app/weekly/page.tsx
import { auth } from "@/auth";
import Image from "next/image";
import UploadClient from "./upload.client";

async function fetchItems(category?: string) {
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/weekly/list`, "http://localhost");
  if (category) url.searchParams.set("category", category);
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/weekly/list` : "/api/weekly/list"}${category ? `?category=${encodeURIComponent(category)}` : ""}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({ items: [] as any[] }));
  return Array.isArray(data.items) ? data.items : [];
}

export default async function WeeklyPage({ searchParams }: { searchParams: { category?: string } }) {
  const session = await auth();
  const isLogged = Boolean(session);
  const myId = session?.user?.id ?? null;

  // Простейшая проверка админа на клиенте мы не делаем — решает API.
  const category = (searchParams?.category || "").trim().toLowerCase();
  const items = await fetchItems(category);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Weekly gallery {category ? `— ${category}` : ""}</h1>

      {isLogged ? (
        <div className="text-sm text-gray-500">
          Вы вошли как: <span className="font-mono">{myId}</span>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Войдите через Discord, чтобы загружать изображения (если вы администратор).
        </div>
      )}

      {/* Форма загрузки рендерится всегда, но сама загрузка ограничена API (403 не-админам) */}
      <UploadClient defaultCategory={category} />

      <div className="border-t pt-4">
        <div className="mb-3 text-sm">
          Категория (query): <code>?category=&lt;name&gt;</code>. Если не указана — показываем все под `weekly/`.
        </div>

        {items.length === 0 ? (
          <div className="text-gray-500">Здесь пока пусто.</div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((it: any) => (
              <li key={it.key} className="group relative border rounded-lg overflow-hidden">
                <a href={it.url} target="_blank" rel="noreferrer">
                  {/* next/image для оптимизации */}
                  <Image
                    src={it.url}
                    alt={it.key}
                    width={600}
                    height={400}
                    className="object-cover w-full h-48"
                  />
                </a>
                <div className="p-2 text-xs text-gray-600 break-all">
                  {it.key}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
