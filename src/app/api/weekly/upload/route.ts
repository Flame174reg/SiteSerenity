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

    // 1) Папка: строго из URL (forcedCategorySafe), иначе — из текста категории
    const forcedSafe = form.get("forcedCategorySafe");
    let safeFolder: string;
    if (typeof forcedSafe === "string" && forcedSafe && !forcedSafe.includes("/")) {
      safeFolder = forcedSafe; // уже safe из маршрута /weekly/<safe>
    } else {
      const human = String((form.get("category") ?? "")).trim() || "general";
      safeFolder = encodeURIComponent(human);
    }

    // 2) Ключ файла
    const ts = Date.now();
    const rnd = Math.random().toString(36).slice(2, 8);
    const ext = safeExt(file.name);
    const key = `weekly/${safeFolder}/${ts}-${rnd}.${ext}`;

    // 3) Загрузка изображения
    const uploaded = await put(key, file, {
      access: "public",
      token,
      contentType: file.type || `image/${ext}`,
      // addRandomSuffix: false по умолчанию. Ключ уже уникален (ts+rnd).
    });

    // 4) Гарантируем .keep — и разрешаем перезапись, чтобы не падать
    const keep = new Blob(["keep"], { type: "text/plain; charset=utf-8" });
    await put(`weekly/${safeFolder}/.keep`, keep, {
      access: "public",
      token,
      contentType: keep.type,
      allowOverwrite: true, // <-- важное изменение
    }).catch(() => { /* ignore */ });

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
