// src/app/weekly/page.tsx
import Link from "next/link";
import CreateFolderClient from "./create-folder.client";

type Folder = {
  name: string;
  safe: string;
  count: number;
  coverUrl: string | null;
  updatedAt?: string | null;
};

async function getFolders(): Promise<Folder[]> {
  // серверный fetch без кэша
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const res = await fetch(`${base}/api/weekly/folders`, { cache: "no-store" }).catch(() => null);
  const json = (await res?.json().catch(() => null)) as
    | { ok: boolean; folders: Folder[] }
    | null;
  return json?.folders ?? [];
}

export default async function WeeklyRootPage() {
  const folders = await getFolders();

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Недельный актив</h1>
          <Link
            href="/"
            className="text-sm text-white/80 hover:text-white border border-white/20 rounded px-3 py-1"
          >
            ← На главную
          </Link>
        </div>

        <p className="text-white/70">Выберите папку, чтобы просмотреть или загрузить изображения за неделю.</p>

        {/* клиентский виджет создания папки */}
        <CreateFolderClient />

        {/* сетка папок */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {folders.map((f) => (
            <Link
              key={f.safe}
              href={`/weekly/${f.safe}`}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {f.coverUrl ? (
                <img
                  src={f.coverUrl}
                  alt={f.name}
                  className="h-44 w-full object-cover opacity-90 transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-44 w-full grid place-items-center text-white/30 text-sm">
                  (папка пуста)
                </div>
              )}

              <div className="p-3 flex items-center justify-between">
                <div className="text-white font-medium">{f.name}</div>
                <div className="text-white/70 text-sm">{f.count}</div>
              </div>
            </Link>
          ))}
        </div>

        {folders.length === 0 && (
          <div className="text-white/60 text-sm">Папок пока нет — создайте первую.</div>
        )}
      </div>
    </main>
  );
}
