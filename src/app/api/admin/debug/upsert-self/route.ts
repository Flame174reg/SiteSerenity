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

async function getExistingColumns(table: string): Promise<Set<string>> {
  const { rows } = await sql/*sql*/`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table};
  `;
  return new Set(rows.map((r) => String(r.column_name)));
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 200 });
    }

    // 1) Минимальная таблица, если вообще нет
    if (!(await tableExists("users"))) {
      await sql/*sql*/`
        CREATE TABLE IF NOT EXISTS users (
          discord_id TEXT PRIMARY KEY,
          name TEXT,
          last_login_at TIMESTAMPTZ
        );
      `;
    }

    // 2) Читаем доступные колонки
    const cols = await getExistingColumns("users"); // например: discord_id, name, last_login_at

    // 3) Собираем данные из сессии
    const discord_id = session.user.id;
    const name = getString(session.user as unknown, "name") ?? null;
    const email = getString(session.user as unknown, "email") ?? null;

    // 4) Конструируем INSERT/UPSERT только по существующим колонкам
    const fields: string[] = ["discord_id"];
    const values: string[] = [`'${discord_id.replace(/'/g, "''")}'`];

    if (cols.has("name")) {
      fields.push("name");
      values.push(name === null ? "NULL" : `'${name.replace(/'/g, "''")}'`);
    }
    if (cols.has("email")) {
      fields.push("email");
      values.push(email === null ? "NULL" : `'${email.replace(/'/g, "''")}'`);
    }
    if (cols.has("avatar_url")) {
      // аватар сейчас не знаем — оставим NULL; при полном логине через Discord он обновится
      fields.push("avatar_url");
      values.push("NULL");
    }
    if (cols.has("last_login_at")) {
      fields.push("last_login_at");
      values.push("NOW()");
    }

    // ON CONFLICT — обновляем только те поля, что есть
    const setUpdates = fields
      .filter((f) => f !== "discord_id")
      .map((f) => `${f} = EXCLUDED.${f}`)
      .join(", ");

    const query = `
      INSERT INTO users (${fields.join(", ")})
      VALUES (${values.join(", ")})
      ON CONFLICT (discord_id) DO UPDATE SET ${setUpdates};
    `;

    await sql.unsafe(query);
    return NextResponse.json({ ok: true, id: discord_id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
