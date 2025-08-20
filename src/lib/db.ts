import { sql } from "@vercel/postgres";

export async function ensureTables() {
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
