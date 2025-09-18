import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

// Укажем runtime — blob SDK корректно работает в nodejs среде
export const runtime = 'nodejs';

// Опционально можно сделать эндпоинт "динамическим", чтобы не кешировался
export const dynamic = 'force-dynamic';

type DeleteRequest = {
  prefix?: string;
  token?: string;
};

/**
 * Универсальный хелпер — забираем токен из body / заголовка / ENV.
 */
function resolveToken(reqToken?: string): string | undefined {
  // 1) Явно переданный
  if (reqToken && reqToken.trim()) return reqToken.trim();
  // 2) Из переменных окружения (если используешь server-side токен)
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  return undefined;
}

/**
 * Основная логика удаления: батчевый листинг по курсору, удаляем пачками.
 */
async function deleteByPrefix(prefix: string, token?: string) {
  let deleted = 0;
  let cursor: string | undefined = undefined;

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

    const nextCursor: string | undefined = res.cursor as string | undefined;
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return deleted;
}

/**
 * Поддержим оба метода — POST и DELETE.
 * Тело запроса: { prefix: string, token?: string }
 * Токен можно также передать в заголовке Authorization: Bearer <token>
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as DeleteRequest;
    const prefix = body.prefix?.trim();
    const headerAuth = req.headers.get('authorization');
    const headerToken = headerAuth?.toLowerCase().startsWith('bearer ')
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
      // Если работаешь с приватным бакетом, токен обязателен
      return NextResponse.json(
        { ok: false, error: 'Blob token is required (body.token / Authorization / ENV).' },
        { status: 400 },
      );
    }

    const deleted = await deleteByPrefix(prefix, token);
    return NextResponse.json({ ok: true, deleted });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Просто прокидываем в POST, чтобы не дублировать код
  return POST(req);
}
