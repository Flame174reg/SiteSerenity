// src/app/api/weekly/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OWNER_ID = "1195944713639960601";

async function isAdmin(id: string) {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS uploaders (
      discord_id TEXT PRIMARY KEY,
      role TEXT NOT NULL
    );
  `;
  const { rows } = await sql/*sql*/`
    SELECT 1 FROM uploaders WHERE discord_id = ${id} AND role='admin' LIMIT 1;
  `;
  return rows.length > 0 || id === OWNER_ID;
}

function safeExt(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ext.match(/^[a-z0-9]{1,5}$/) ? ext : "jpg";
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
    if (!(await isAdmin(me))) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return NextResponse.json({ ok: false, reason: "blob_token_missing" }, { status: 500 });

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, reason: "no_file" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, reason: "not_image" }, { status: 400 });
    }

    // 1) Папка: выбираем ПРИНУДИТЕЛЬНО из URL (forcedCategorySafe), если она передана
    const forcedSafe = form.get("forcedCategorySafe");
    let safeFolder: string | null = null;
    if (typeof forcedSafe === "string" && forcedSafe && !forcedSafe.includes("/")) {
      // это уже safe-сегмент из URL (/weekly/<safe>)
      safeFolder = forcedSafe;
    } else {
      // иначе берём «человеческое» название категории, кодируем сами
      const human = String((form.get("category") ?? "")).trim() || "general";
      safeFolder = encodeURIComponent(human);
    }

    // 2) Ключ файла в выбранной папке
    const ts = Date.now();
    const rnd = Math.random().toString(36).slice(2, 8);
    const ext = safeExt(file.name);
    const key = `weekly/${safeFolder}/${ts}-${rnd}.${ext}`;

    // 3) Заливаем файл
    const uploaded = await put(key, file, {
      access: "public",
      token,
      contentType: file.type || `image/${ext}`,
    });

    // 4) Гарантируем наличие .keep (не навредит, можем перезаписать)
    const keep = new Blob(["keep"], { type: "text/plain; charset=utf-8" });
    await put(`weekly/${safeFolder}/.keep`, keep, {
      access: "public",
      token,
      contentType: keep.type,
    }).catch(() => { /* игнор, если что-то не так */ });

    return NextResponse.json({
      ok: true,
      key,
      url: uploaded.url,
      categorySafe: safeFolder,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
