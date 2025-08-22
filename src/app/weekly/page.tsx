// src/app/weekly/page.tsx
import { auth } from "@/auth";
import Image from "next/image";

// ===== Types =====
type WeeklyItem = {
  url: string;
  key: string;
  uploadedAt?: string;
  size?: number;
};

type RawSearchParams =
  | Record<string, string | string[] | undefined>
  | undefined;

function isWeeklyItemArray(x: unknown): x is WeeklyItem[] {
  return (
    Array.isArray(x) &&
    x.every(
      (it) =>
        it &&
        typeof it === "object" &&
        typeof (it as Record<string, unknown>).url === "string" &&
        typeof (it as Record<string, unknown>).key === "string"
    )
  );
}

// ===== Data =====
async function fetchItems(category?: string): Promise<WeeklyItem[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  const endpoint = base ? `${base}/api/weekly/list${qs}` : `/api/weekly/list${qs}`;
  const res = await fetch(endpoint, { cache: "no-store" });
  if (!res.ok) return [];
  const data: unknown = await res.json().catch(() => ({}));
  const items = (data as { items?: unknown }).items;
  return isWeeklyItemArray(items) ? items : [];
}

// ===== Page (Next 15: searchParams can be Promise) =====
export default async function WeeklyPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = (await searchParams) || {};
  const rawCat = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const category = (rawCat || "").trim().toLowerCase();

  const session = await auth();
  const myId = session?.user?.id ?? null;

  const items = await fetchItems(category);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">
        Weekly gallery {category ? `— ${category}` : ""}
      </h1>

      {myId ? (
        <div className="text-sm text-gray-500">
          Вы вошли как: <span className="font-mono">{myId}</span>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Войдите через Discord, чтобы загружать изображения (если вы администратор).
        </div>
      )}

      {/* Клиентская форма загрузки (права проверяет API) */}
      {/* @ts-expect-error Async Server Component imports client component */}
      <UploadClient defaultCategory={category} />

      <div className="border-t pt-4">
        <div className="mb-3 text-sm">
          Категория (query): <code>?category=&lt;name&gt;</code>. Если не указана — показываем все под
          <code> weekly/</code>.
        </div>

        {items.length === 0 ? (
          <div className="text-gray-500">Здесь пока пусто.</div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((it) => (
              <li key={it.key} className="group relative border rounded-lg overflow-hidden">
                <a href={it.url} target="_blank" rel="noreferrer">
                  <Image
                    src={it.url}
                    alt={it.key}
                    width={600}
                    height={400}
                    className="object-cover w-full h-48"
                  />
                </a>
                <div className="p-2 text-xs text-gray-600 break-all">{it.key}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Отдельный импорт клиентского компонента — вниз файла, чтобы TS не путался
import UploadClient from "./upload.client";
