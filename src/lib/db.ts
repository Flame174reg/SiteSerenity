// src/lib/db.ts
import { sql } from "@vercel/postgres";

export async function ensureTables() {
  // Пользователи (кто логинился хотя бы раз)
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS users (
      discord_id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      avatar_url TEXT,
      last_login_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Кому разрешена загрузка фото (роль админа/владельца)
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT DEFAULT 'uploader' -- 'admin' | 'owner' | 'uploader'
    );
  `;

  // Фото «Недельного актива»
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      discord_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}
