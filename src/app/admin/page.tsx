// src/app/admin/page.tsx
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import AdminClient from "./ui/AdminClient";
import { sql } from "@vercel/postgres";

const OWNER_ID = "1195944713639960601";

async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    // гарантируем схему
    await sql/* sql */`
      CREATE TABLE IF NOT EXISTS uploaders (
        discord_id TEXT PRIMARY KEY,
        role TEXT NOT NULL DEFAULT 'admin',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    // на всякий случай добавим role, если её не было
    await sql/* sql */`ALTER TABLE uploaders ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'`;

    const r = await sql/* sql */`
      SELECT role FROM uploaders WHERE discord_id = ${userId} LIMIT 1
    `;
    const role = r.rows[0]?.role as string | undefined;
    return role === "superadmin";
  } catch {
    // если база недоступна — не даём доступ
    return false;
  }
}

export default async function AdminPage() {
  const session = await auth();
  const me = session?.user?.id ?? null;

  const allowed =
    !!me && (me === OWNER_ID || (await isSuperAdmin(me)));

  if (!allowed) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-semibold">Администрирование</h1>
      <p className="mb-4 opacity-70">
        Выбирайте, кому разрешены загрузки фото (роль «Админ») и кто является «Суперадмином».
      </p>
      <AdminClient />
    </div>
  );
}
