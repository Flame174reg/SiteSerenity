import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";

export async function GET() {
  await ensureTables();
  const { rows } = await sql`SELECT discord_id, role FROM uploaders ORDER BY discord_id`;
  return Response.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  const discordId = (session as any)?.discordId;
  if (!isSuperAdmin(discordId)) return new Response("Forbidden", { status: 403 });

  const { discord_id, role = "uploader" } = await req.json();
  if (!discord_id) return new Response("discord_id required", { status: 400 });

  await ensureTables();
  await sql`INSERT INTO uploaders (discord_id, role)
            VALUES (${discord_id}, ${role})
            ON CONFLICT (discord_id) DO UPDATE SET role=${role}`;
  return new Response("ok");
}

export async function DELETE(req: Request) {
  const session = await auth();
  const discordId = (session as any)?.discordId;
  if (!isSuperAdmin(discordId)) return new Response("Forbidden", { status: 403 });

  const { discord_id } = await req.json();
  if (!discord_id) return new Response("discord_id required", { status: 400 });

  await ensureTables();
  await sql`DELETE FROM uploaders WHERE discord_id=${discord_id}`;
  return new Response("ok");
}
