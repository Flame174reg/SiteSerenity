// src/app/api/weekly/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

const OWNER_ID = "1195944713639960601";

async function isAdmin(discordId: string): Promise<boolean> {
  const { rows } = await sql/*sql*/`
    SELECT 1 FROM uploaders
    WHERE discord_id = ${discordId} AND role = 'admin'
    LIMIT 1;
  `;
  return rows.length > 0 || discordId === OWNER_ID;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
    if (!(await isAdmin(me))) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file");
    const category = String(form.get("category") ?? "uncategorized").trim().toLowerCase();

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, reason: "no_file" }, { status: 400 });
    }
    if (!category || /[^\w\-]/.test(category)) {
      // только буквы/цифры/подчёркивание/дефис — чтобы не городить странные пути
      return NextResponse.json({ ok: false, reason: "bad_category" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const key = `weekly/${category}/${Date.now()}_${safeName}`;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return NextResponse.json({ ok: false, reason: "blob_token_missing" }, { status: 500 });

    // заливаем как public
    const uploaded = await put(key, file, { access: "public", token });
    return NextResponse.json({ ok: true, key, url: uploaded.url, size: uploaded.size });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
