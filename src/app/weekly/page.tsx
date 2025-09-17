// src/app/weekly/page.tsx
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import Image from "next/image";
import { headers } from "next/headers";
import UploadClient from "./upload.client";
import GalleryClient from "./gallery.client";

export const dynamic = "force-dynamic";

type WeeklyItem = {
  url: string;
  key: string;
  category: string;
  caption?: string | null;
  uploadedAt?: string;
  size?: number;
};

type RawSearchParams =
  | Record<string, string | string[] | undefined>
  | undefined;

const OWNER_ID = "1195944713639960601";

async function isAdmin(discordId: string | null | undefined) {
  if (!discordId) return false;
  if (discordId === OWNER_ID) return true;
  const { rows } = await sql/*sql*/`
    SELECT 1 FROM uploaders WHERE discord_id = ${discordId} AND role = 'admin' LIMIT 1;
  `;
  return rows.length > 0;
}

function isWeeklyItems(x: unknown): x is WeeklyItem[] {
  return Array.isArray(x) && x.every((it) => it && typeof it === "object" && "url" in (it as any) && "key" in (it as any));
}

async function fetchData(absBaseUrl: string, category?: string) {
  // список элементов выбранной категории
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  const resItems = await fetch(`${absBaseUrl}/api/weekly/list${qs}`, { cache: "no-store" });
  const dataItems = await resItems.json().catch(() => ({} as any));
  const items: WeeklyItem[] = isWeeklyItems(dataItems.items) ? dataItems.items : [];

  // категории (берем без фильтра)
  const resCats = await fetch(`${absBaseUrl}/api/weekly/list`, { cache: "no-store" });
  const dataCats = await resCats.json().catch(() => ({} as any));
  const categories: string[] = Array.isArray(dataCats.categories) ? dataCats.categories : [];

  return { items, categories };
}

export default async function WeeklyPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host") ?? "localhost:3000";
  const absBaseUrl = `${proto}://${host}`;

  const sp = (await searchParams) || {};
  const rawCat = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const category = (rawCat || "").trim().toLowerCase();

  const session = await auth();
  const myId = session?.user?.id ?? null;
  const admin = await isAdmin(myId);

  const { items, categories } = await fetchData(absBaseUrl, category);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Недельный актив</h1>

      {myId ? (
        <div className="text-sm text-gray-300">
          Вы вошли как: <span className="font-mono">{myId}</span>
        </div>
      ) : (
        <div className="text-sm text-gray-300">Войдите через Discord, чтобы загружать изображения (если вы администратор).</div>
      )}

      {/* Форма загрузки (только для админов/владельца) */}
      {admin && (
        <UploadClient
          defaultCategory={category || "general"}
          categories={categories}
        />
      )}

      <div className="border-t border-white/10 pt-4">
        <div className="mb-3 text-sm text-white/80">
          Тут Вы можете увидеть свой актив/явку за неделю.
        </div>

        {items.length === 0 ? (
          <div className="text-gray-400">Здесь пока пусто.</div>
        ) : (
          <GalleryClient items={items} isAdmin={admin} />
        )}
      </div>
    </div>
  );
}
