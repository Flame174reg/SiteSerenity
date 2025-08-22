import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  // 1) Авторизация (дискорд)
  const session = await auth().catch(() => null);
  const discordId =
    (session as unknown as { discordId?: string })?.discordId ?? undefined;
  if (!discordId) return new NextResponse("Unauthorized", { status: 401 });

  // 2) Таблицы и доступ
  await ensureTables();

  const allowed = await sql<{ exists: number }>`
    SELECT 1 as exists FROM uploaders 
    WHERE discord_id = ${discordId} 
    LIMIT 1
  `;

  if (allowed.rowCount === 0 && !isSuperAdmin(discordId)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 3) Парсим форму
  const form = await req.formData();
  const fileEntry = form.get("file");
  if (!(fileEntry instanceof Blob)) {
    return new NextResponse("No file", { status: 400 });
  }
  const file = fileEntry as File; // File наследует Blob в runtime

  const name = (form.get("name") as string) || file.name || "photo";
  const description = (form.get("description") as string) || null;

  const contentType = file.type || "image/jpeg";
  const ext = contentType.split("/")[1] || "jpg";
  const filename = `${Date.now()}-${slugify(name)}.${ext}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new NextResponse("Missing BLOB_READ_WRITE_TOKEN", { status: 500 });
  }

  // 4) Заливаем в Vercel Blob
  const { url } = await put(filename, file, {
    access: "public",
    contentType,
    token,
  });

  // 5) Пишем запись в БД (автор берём из сессии, если есть)
  const authorName =
    (session as unknown as { user?: { name?: string } })?.user?.name ?? null;

  await sql`
    INSERT INTO weekly_photos (url, discord_id, author, description)
    VALUES (${url}, ${discordId}, ${authorName}, ${description})
  `;

  return NextResponse.json({ url });
}
