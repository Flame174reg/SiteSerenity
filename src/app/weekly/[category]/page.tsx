// src/app/weekly/[category]/page.tsx
import Link from "next/link";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import UploadClient from "../upload.client";
import GalleryClient from "../gallery.client";

export const dynamic = "force-dynamic";
const OWNER_ID = "1195944713639960601";

type Item = {
  url: string;
  key: string;
  category: string;
  caption?: string | null;
  uploadedAt?: string;
  size?: number;
};
type ListResp = { ok: boolean; items: Item[]; categories: string[] };

async function getIsAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return false;
    await sql/*sql*/`
      CREATE TABLE IF NOT EXISTS uploaders (
        discord_id TEXT PRIMARY KEY,
        role TEXT NOT NULL
      );
    `;
    const { rows } = await sql/*sql*/`
      SELECT 1 FROM uploaders WHERE discord_id = ${me} AND role = 'admin' LIMIT 1;
    `;
    return rows.length > 0 || me === OWNER_ID;
  } catch {
    return false;
  }
}

async function getCategoryData(categorySafe: string): Promise<ListResp> {
  const name = decodeURIComponent(categorySafe);
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const res = await fetch(
    `${base}/api/weekly/list?category=${encodeURIComponent(name)}`,
    { cache: "no-store" }
  ).catch(() => null);
  const json = (await res?.json().catch(() => null)) as ListResp | null;
  return json ?? { ok: false, items: [], categories: [] };
}

export default async function WeeklyCategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  // В Next 15 params — Promise
  const { category } = await params;
  const categorySafe = category;
  const categoryHuman = decodeURIComponent(categorySafe);

  const [isAdmin, data] = await Promise.all([
    getIsAdmin(),
    getCategoryData(categorySafe),
  ]);

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{categoryHuman}</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/weekly"
              className="text-sm text-white/80 hover:text-white border border-white/20 rounded px-3 py-1"
            >
              ← Ко всем папкам
            </Link>
            <Link
              href="/"
              className="text-sm text-white/80 hover:text-white border border-white/20 rounded px-3 py-1"
            >
              На главную
            </Link>
          </div>
        </div>

        <UploadClient
          defaultCategory={categoryHuman}
          categories={[categoryHuman, ...(data.categories ?? [])]}
          forcedCategorySafe={categorySafe}
        />

        <p className="text-white/70 text-sm">
          Тут вы можете увидеть свой актив/явку за неделю.
        </p>

        <GalleryClient items={data.items} isAdmin={isAdmin} />
      </div>
    </main>
  );
}
