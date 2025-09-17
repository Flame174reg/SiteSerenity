// src/app/api/weekly/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

const OWNER_ID = "1195944713639960601";

// добавляет недостающие колонки и уникальный индекс на key
async function ensureTables() {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT NOT NULL
    );
  `;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS weekly_photos (
      url TEXT,
      category TEXT,
      caption TEXT,
      uploaded_by TEXT,
      uploaded_at TIMESTAMPTZ
    );
  `;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS key TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS url TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS category TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS caption TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploaded_by TEXT;`;
  await sql/*sql*/`ALTER TABLE weekly_photos ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();`;
  await sql/*sql*/`CREATE UNIQUE INDEX IF NOT EXISTS weekly_photos_key_unique ON weekly_photos(key);`;
}

async function isAdmin(discordId: string): Promise<boolean> {
  await ensureTables();
  const { rows } = await sql/*sql*/`
    SELECT 1 FROM uploaders WHERE discord_id = ${discordId} AND role = 'admin' LIMIT 1;
  `;
  return rows.length > 0 || discordId === OWNER_ID;
}

// запрещаем только "/", остальные юникод-символы и пробелы разрешаем
function validateCategory(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 64) return null;
  if (trimmed.includes("/")) return null;
  return trimmed;
}

// сегмент ключа хранить в Blob безопасно: кодируем (в UI показываем исходное имя)
function toSafeSegment(raw: string) {
  return encodeURIComponent(raw);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
    if (!(await isAdmin(me))) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

    const form = await req.formData();
    const rawCategoryInput = String(form.get("category") ?? "Общая");
    const categoryHuman = validateCategory(rawCategoryInput);
    if (!categoryHuman) return NextResponse.json({ ok: false, reason: "bad_category" }, { status: 400 });

    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, reason: "no_file" }, { status: 400 });

    const safeCat = toSafeSegment(categoryHuman);
    const safeName = file.name.replace(/[^\w.\-]+/g, "_"); // само имя файла слегка чистим
    const key = `weekly/${safeCat}/${Date.now()}_${safeName}`;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return NextResponse.json({ ok: false, reason: "blob_token_missing" }, { status: 500 });

    const uploaded = await put(key, file, { access: "public", token });

    await ensureTables();
    await sql/*sql*/`
      INSERT INTO weekly_photos (key, url, category, caption, uploaded_by, uploaded_at)
      VALUES (${key}, ${uploaded.url}, ${categoryHuman}, NULL, ${me}, NOW())
      ON CONFLICT (key) DO UPDATE
      SET url = EXCLUDED.url,
          category = EXCLUDED.category,
          uploaded_by = EXCLUDED.uploaded_by,
          uploaded_at = EXCLUDED.uploaded_at;
    `;

    return NextResponse.json({ ok: true, key, url: uploaded.url, category: categoryHuman, size: file.size });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
