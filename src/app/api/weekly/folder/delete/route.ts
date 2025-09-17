// src/app/api/weekly/folder/delete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { list, del } from "@vercel/blob";

export const dynamic = "force-dynamic";

const OWNER_ID = "1195944713639960601";

async function isAdminOrOwner(userId: string): Promise<boolean> {
  if (userId === OWNER_ID) return true;
  try {
    const { rows } = await sql/*sql*/`
      SELECT role FROM uploaders WHERE discord_id = ${userId} LIMIT 1
    `;
    return rows.length > 0 && rows[0].role === "admin";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const me = session?.user?.id;
    if (!me) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }
    if (!(await isAdminOrOwner(me))) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null) as { safe?: string } | null;
    const safe = (body?.safe ?? "").trim();
    if (!safe) {
      return NextResponse.json({ ok: false, error: "safe is required" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing BLOB_READ_WRITE_TOKEN/BLOB_TOKEN" },
        { status: 500 }
      );
    }

    const prefix = `weekly/${safe}/`;
    let deleted = 0;
    let cursor: string | undefined = undefined;

    // Удаляем ВСЕ объекты в папке (постранично)
    do {
      const { blobs, hasMore, cursor: nextCursor } = await list({
        prefix,
        limit: 1000,
        cursor,
        token,
      });
      if (blobs.length) {
        await Promise.all(blobs.map((b) => del(b.url, { token })));
        deleted += blobs.length;
      }
      cursor = hasMore ? nextCursor : undefined;
    } while (cursor);

    return NextResponse.json({ ok: true, safe, deleted });
  } catch (e) {
    // всегда возвращаем JSON, чтобы клиентский парсер не падал
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}

// Разрешим также DELETE-метод тем же кодом
export async function DELETE(req: Request) {
  return POST(req);
}

// На всякий — CORS/префлайт, чтобы не ловить 405 на OPTIONS
export function OPTIONS() {
  return NextResponse.json({ ok: true });
}
