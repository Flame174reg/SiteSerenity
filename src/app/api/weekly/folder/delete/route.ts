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

// Тип ответа list()
type ListResponse = Awaited<ReturnType<typeof list>>;

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

    const body = (await req.json().catch(() => null)) as { safe?: string } | null;
    const safe = (body?.safe ?? "").trim();
    if (!safe) {
      return NextResponse.json({ ok: false, error: "safe is required" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN || undefined;

    const prefix = `weekly/${safe}/`;
    let deleted = 0;
    let cursor: string | undefined = undefined;

    // постраничное удаление по cursor
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res: ListResponse = await list({ prefix, limit: 1000, cursor, token });

      if (res.blobs.length) {
        await Promise.all(res.blobs.map((b) => del(b.url, { token })));
        deleted += res.blobs.length;
      }

      const newCursor = res.cursor;
      if (!newCursor) break;
      cursor = newCursor;
    }

    // чистим подписи к фото в этой папке
    try {
      await sql/* sql */`
        DELETE FROM weekly_photos
        WHERE key LIKE ${prefix + "%"}
      `;
    } catch {
      // таблицы может не быть — ок
    }

    // чистим подпись самого альбома
    try {
      await sql/* sql */`
        DELETE FROM weekly_albums WHERE safe = ${safe}
      `;
    } catch {
      // таблицы может не быть — ок
    }

    return NextResponse.json({ ok: true, safe, deleted });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  return POST(req);
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
export function HEAD() {
  return new Response(null, { status: 200 });
}
