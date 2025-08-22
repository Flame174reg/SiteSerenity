// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

async function ensureSchema() {
  // Создаем таблицы, если их нет
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS users (
      discord_id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      avatar_url TEXT,
      last_login_at TIMESTAMPTZ
    );
  `;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
      role TEXT NOT NULL
    );
  `;
}

export async function GET() {
  try {
    const session = await auth();
    const me = session?.user?.id;

    // Если не залогинен — отдаём пусто, чтобы UI не краснел
    if (!me) return NextResponse.json({ users: [], reason: "unauthenticated" });

    // Гарантируем схему (если ensureTables где-то не сработал)
    await ensureSchema();

    const OWNER_ID = "1195944713639960601";

    const { rows } = await sql/*sql*/`
      SELECT
        u.discord_id AS id,
        COALESCE(u.name, '') AS name,
        u.avatar_url AS avatar,
        u.last_login_at AS last_seen,
        CASE WHEN up.role = 'admin' THEN TRUE ELSE FALSE END AS is_admin
      FROM users u
      LEFT JOIN uploaders up ON up.discord_id = u.discord_id
      ORDER BY u.last_login_at DESC NULLS LAST
      LIMIT 500;
    `;

    const users = rows.map((r) => ({
      id: String(r.id),
      name: (r.name as string) || "Без имени",
      avatar: (r.avatar as string) || null,
      lastSeen: r.last_seen ? new Date(r.last_seen as string | Date).toISOString() : null,
      isAdmin: Boolean(r.is_admin),
      isOwner: String(r.id) === OWNER_ID,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    // На время диагностики вернем текст ошибки (потом можно убрать detail)
    return NextResponse.json(
      { users: [], error: "db_error", detail: String(err) },
      { status: 200 }
    );
  }
}
