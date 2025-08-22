// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureTables } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const me = session?.user?.id;

    // Если не залогинен — отдаем пусто (UI не краснеет)
    if (!me) return NextResponse.json({ users: [], reason: "unauthenticated" });

    await ensureTables();

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
    console.error("GET /api/admin/users failed:", err);
    // Возвращаем 200, чтобы клиент не рисовал ошибку
    return NextResponse.json({ users: [], error: "db_error" });
  }
}
