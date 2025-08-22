// src/lib/db.ts
import { sql } from "@vercel/postgres";

export async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      discord_id TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT,
      last_login_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT DEFAULT 'uploader'
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      discord_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}

// ——— helpers ———

export type DBUser = {
  discord_id: string;
  name: string | null;
  avatar: string | null;
  last_login_at: string; // ISO
};

export async function upsertUser(
  discordId: string,
  name: string | null,
  avatar: string | null
): Promise<void> {
  await ensureTables();
  await sql`
    INSERT INTO users (discord_id, name, avatar, last_login_at)
    VALUES (${discordId}, ${name}, ${avatar}, NOW())
    ON CONFLICT (discord_id) DO UPDATE
      SET name = EXCLUDED.name,
          avatar = EXCLUDED.avatar,
          last_login_at = NOW();
  `;
}

export async function listUsersForAdmin(): Promise<DBUser[]> {
  await ensureTables();
  const res = await sql<DBUser>`
    SELECT discord_id, name, avatar, last_login_at
    FROM users
    ORDER BY last_login_at DESC
  `;
  return res.rows;
}

export async function setUploader(id: string, admin: boolean): Promise<void> {
  await ensureTables();
  if (admin) {
    await sql`
      INSERT INTO uploaders (discord_id)
      VALUES (${id})
      ON CONFLICT (discord_id) DO NOTHING
    `;
  } else {
    await sql`DELETE FROM uploaders WHERE discord_id = ${id}`;
  }
}

export async function isUploader(id: string): Promise<boolean> {
  await ensureTables();
  const res = await sql`
    SELECT 1 FROM uploaders WHERE discord_id = ${id} LIMIT 1
  `;
  return (res.rowCount ?? 0) > 0;
}
