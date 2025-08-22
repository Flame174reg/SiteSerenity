// src/app/api/admin/debug/upsert-self/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

function getString(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === "object" && key in obj) {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

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

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 200 });
    }

    // минимальная таблица (без DDL миграций)
    if (!(await tableExists("users"))) {
      await sql/*sql*/`
        CREATE TABLE IF NOT EXISTS users (
          discord_id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          last_login_at TIMESTAMPTZ
        );
      `;
    }

    const hasAvatar = await columnExists("users", "avatar_url");

    const pid = session.user.id;
    const name = getString(session.user as unknown, "name") ?? null;
    const email = getString(session.user as unknown, "email") ?? null;

    if (hasAvatar) {
      // аватар из профиля нам недоступен здесь — поставим NULL, потом обновится при входе
      await sql/*sql*/`
        INSERT INTO users (discord_id, name, email, avatar_url, last_login_at)
        VALUES (${pid}, ${name}, ${email}, NULL, NOW())
        ON CONFLICT (discord_id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            last_login_at = NOW();
      `;
    } else {
      await sql/*sql*/`
        INSERT INTO users (discord_id, name, email, last_login_at)
        VALUES (${pid}, ${name}, ${email}, NOW())
        ON CONFLICT (discord_id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            last_login_at = NOW();
      `;
    }

    return NextResponse.json({ ok: true, id: pid });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
