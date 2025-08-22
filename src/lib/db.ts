// src/lib/db.ts
import { sql } from "@vercel/postgres";

/**
 * Создаёт все необходимые таблицы, если их ещё нет.
 * Вызывай перед любыми операциями с БД (например, в auth events, API-роутах).
 */
export async function ensureTables() {
  // Пользователи, авторизованные через Discord
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS users (
      discord_id     TEXT PRIMARY KEY,
      name           TEXT,
      email          TEXT,
      avatar_url     TEXT,
      created_at     TIMESTAMPTZ DEFAULT now(),
      last_login_at  TIMESTAMPTZ DEFAULT now()
    );
  `;

  // Те, кому разрешена загрузка фото (админы раздела "Недельный актив")
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id  TEXT PRIMARY KEY,
      role        TEXT DEFAULT 'uploader',      -- для будущего расширения (uploader/admin и т.п.)
      granted_by  TEXT,                         -- кто выдал доступ (discord_id)
      granted_at  TIMESTAMPTZ DEFAULT now()
    );
  `;

  // Фото "Недельного актива"
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      id           SERIAL PRIMARY KEY,
      url          TEXT NOT NULL,
      description  TEXT,
      discord_id   TEXT,                        -- кто загрузил (можно связать с users)
      created_at   TIMESTAMPTZ DEFAULT now()
    );
  `;

  // Полезные индексы (idempotent — не упадут, если уже есть)
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS weekly_photos_created_at_idx ON weekly_photos (created_at DESC);`;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS users_last_login_at_idx ON users (last_login_at DESC);`;
}
