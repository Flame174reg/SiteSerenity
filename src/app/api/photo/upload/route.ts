/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";
import { put } from "@vercel/blob";

export const runtime = "nodejs"; // гарантируем поддержку Blob/File

export async function POST(req: Request) {
  const session = await auth();
  const discordId = (session as any)?.discordId;
  if (!discordId) return new Response("Unauthorized", { status: 401 });

  await ensureTables();
  const allowed = await sql`SELECT 1 FROM uploaders WHERE discord_id=${discordId} LIMIT 1`;
  if (!allowed.rowCount && !isSuperAdmin(discordId)) {
    return new Response("Forbidden", { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) return new Response("No file", { status: 400 });

  const name = (form.get("name") as string) || "photo";
  const filename = `${Date.now()}-${name}.jpg`;

  const { url } = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN, // берём из интеграции
  });

  await sql`INSERT INTO weekly_photos (url, discord_id) VALUES (${url}, ${discordId})`;
  return Response.json({ url });
}
