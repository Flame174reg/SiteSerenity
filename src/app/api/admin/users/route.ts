// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

async function tableExists(table: string): Promise<boolean> {
  const { rows } = await sql/*sql*/`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
    LIMIT 1;
  `;
  return rows.length > 0;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const { rows } = await sql/*sql*/`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${table}
      AND column_name = ${column}
    LIMIT 1;
  `;
  return rows.length > 0;
}

export async function GET() {
  try {
    const session = await auth();
    const me = session?.user?.id;

    if (!me) {
      // не залогинен — возвращаем пусто, UI не краснеет
      return NextResponse.json({ users: [], reason: "unauthenticated" });
    }

    const hasUsers = await tableExists("users");
    if (!hasUsers) {
      // таблицы пользователей нет — вернем пусто
      return NextResponse.json({ users: [] });
    }

    const hasAvatar = await columnExists("users", "avatar_url");
    const OWNER_ID = "1195944713639960601";

    // Два SQL-ветвления: с аватаром и без
    const queryWithAvatar = sql/*sql*/`
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

    const queryWithoutAvatar = sql/*sql*/`
      SELECT
        u.discord_id AS id,
        COALESCE(u.name, '') AS name,
        NULL AS avatar,
        u.last_login_at AS last_seen,
        CASE WHEN up.role = 'admin' THEN TRUE ELSE FALSE END AS is_admin
      FROM users u
      LEFT JOIN uploaders up ON up.discord_id = u.discord_id
      ORDER BY u.last_login_at DESC NULLS LAST
      LIMIT 500;
    `;

    const { rows } = await (hasAvatar ? queryWithAvatar : queryWithoutAvatar);

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
    return NextResponse.json(
      { users: [], error: "db_error", detail: String(err) },
      { status: 200 }
    );
  }
}
