// src/app/api/weekly/folder/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { list, del } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER_ID = "1195944713639960601";

async function isAdminOrOwner(userId: string): Promise<boolean> {
  if (userId === OWNER_ID) return true;
  try {
    const { rows } = await sql/* sql */`
      SELECT role FROM uploaders WHERE discord_id = ${userId} LIMIT 1
    `;
    return rows.length > 0 && rows[0].role === "admin";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // --- доступ ---
    const session = await auth();
    const me = session?.user?.id;
    if (!me) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }
    if (!(await isAdminOrOwner(me))) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    // --- входные данные ---
    const body = (await req.json().catch(() => null)) as { safe?: string } | null;
    const safe = (body?.safe ?? "").trim();
    if (!safe) {
      return NextResponse.json({ ok: false, error: "safe is required" }, { status: 400 });
    }

    // Токен для RW, если используется. На Vercel можно не указывать, если подключена интеграция.
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN || undefined;

    // Ключи в Blob хранятся как weekly/<safe>/...
    const prefix = `weekly/${safe}/`;

    // --- удаляем ВСЁ в папке постранично через cursor ---
    let deleted = 0;
    let cursor: string | undefined = undefined;

    while (true) {
      const { blobs, cursor: nextCursor } = await list({
        prefix,
        limit: 1000,
        cursor,
        token,
      });

      for (const b of blobs) {
        await del(b.url, { token });
      }
      deleted += blobs.length;

      if (!nextCursor) break;
      cursor = nextCursor;
    }

    // --- чистим подписи в БД (если таблица есть) ---
    try {
      await sql/* sql */`
        DELETE FROM weekly_photos
        WHERE key LIKE ${prefix + "%"}
      `;
    } catch {
      // таблицы может не быть — это не критично
    }

    return NextResponse.json({ ok: true, safe, deleted });
  } catch (e) {
    // всегда JSON, чтобы клиентский парсер не падал
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}

// Поддержим DELETE тем же кодом
export async function DELETE(req: Request) {
  return POST(req);
}

// Префлайт/служебные — чтобы не ловить 405
export function OPTIONS() {
  return new Response(null, { status: 204 });
}
export function HEAD() {
  return new Response(null, { status: 200 });
}
