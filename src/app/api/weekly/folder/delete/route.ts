// src/app/api/weekly/folder/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DeleteRequest = {
  prefix?: string;
  token?: string;
};

/** Безопасно вытаскиваем сообщение об ошибке без any */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Unknown error';
  }
}

/** Достаём токен из body/заголовка/ENV */
function resolveToken(reqToken?: string): string | undefined {
  if (reqToken && reqToken.trim()) return reqToken.trim();
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  return undefined;
}

/** Батчевое удаление по префиксу с курсорной пагинацией */
async function deleteByPrefix(prefix: string, token?: string) {
  let deleted = 0;
  let cursor: string | undefined = undefined; // <-- явная аннотация разрывает цикл инференции

  // бесконечный цикл без eslint-disable
  for (;;) {
    const res: Awaited<ReturnType<typeof list>> = await list({
      prefix,
      limit: 1000,
      cursor,
      token,
    });

    if (res.blobs.length) {
      await Promise.all(res.blobs.map((b) => del(b.url, { token })));
      deleted += res.blobs.length;
    }

    // Без создания nextCursor — сразу и безопасно продвигаем курсор
    if (typeof res.cursor === 'string' && res.cursor.length > 0) {
      cursor = res.cursor;
    } else {
      break;
    }
  }

  return deleted;
}

/**
 * Тело запроса: { prefix: string, token?: string }
 * Токен можно передать заголовком: Authorization: Bearer <token>
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as DeleteRequest;
    const prefix = body.prefix?.trim();

    const headerAuth = req.headers.get('authorization');
    const headerToken =
      headerAuth?.toLowerCase().startsWith('bearer ')
        ? headerAuth.slice(7).trim()
        : undefined;

    if (!prefix) {
      return NextResponse.json(
        { ok: false, error: 'Missing "prefix" in request body.' },
        { status: 400 },
      );
    }

    const token = resolveToken(body.token ?? headerToken);
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Blob token is required (body.token / Authorization / ENV).' },
        { status: 400 },
      );
    }

    const deleted = await deleteByPrefix(prefix, token);
    return NextResponse.json({ ok: true, deleted });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Переиспользуем POST
  return POST(req);
}
