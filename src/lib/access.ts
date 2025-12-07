import { sql } from "@vercel/postgres";

export const SUPER_ADMIN_ID =
  process.env.SUPER_ADMIN_ID ?? "1195944713639960601"; // ‘'گ?گ?گü Discord ID گُگ? ‘?گ?گ?گ>‘طگّگ?گٌ‘?

/**
 * Lightweight check used in a few legacy places where only an ID equality is expected.
 */
export function isSuperAdmin(id?: string | null): boolean {
  return !!id && id === SUPER_ADMIN_ID;
}

async function ensureUploadersTable() {
  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT NOT NULL DEFAULT 'admin',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql/* sql */`
    ALTER TABLE uploaders
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
  `;
  await sql/* sql */`
    ALTER TABLE uploaders
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `;
}

/**
 * Full super-admin check with DB-backed roles.
 * Falls back to SUPER_ADMIN_ID when the DB is unreachable.
 */
export async function isSuperAdminDb(id?: string | null): Promise<boolean> {
  const me = (id ?? "").trim();
  if (!me) return false;
  if (me === SUPER_ADMIN_ID) return true;

  try {
    await ensureUploadersTable();
    const res = await sql/* sql */`
      SELECT role FROM uploaders WHERE discord_id = ${me} LIMIT 1
    `;
    const role = res.rows[0]?.role as string | undefined;
    return role === "superadmin";
  } catch {
    // fall back to env check if DB is temporarily unavailable
    return me === SUPER_ADMIN_ID;
  }
}
