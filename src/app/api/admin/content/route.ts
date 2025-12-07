import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSiteContent, normalizeSiteContent, saveSiteContent } from "@/lib/contentStore";
import { isSuperAdminDb } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OkResp = { ok: true; content: Awaited<ReturnType<typeof getSiteContent>> };
type ErrResp = { ok: false; error: string };

async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth();
    const id =
      (session?.user as { id?: string; email?: string } | null | undefined)?.id ??
      (session?.user as { email?: string } | null | undefined)?.email ??
      (session as { sub?: string } | null | undefined)?.sub ??
      null;
    if (id) return String(id);
  } catch {
    /* ignore */
  }
  return null;
}

export async function GET() {
  const me = await getCurrentUserId();
  if (!(await isSuperAdminDb(me))) {
    return NextResponse.json<ErrResp>({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const content = await getSiteContent();
  return NextResponse.json<OkResp>({ ok: true, content });
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUserId();
  if (!(await isSuperAdminDb(me))) {
    return NextResponse.json<ErrResp>({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as unknown;
    const normalized = normalizeSiteContent(
      (body as Record<string, unknown> | undefined)?.content ?? body
    );
    const saved = await saveSiteContent({ ...normalized, updatedBy: me ?? undefined }, me ?? undefined);
    return NextResponse.json<OkResp>({ ok: true, content: saved });
  } catch (err) {
    return NextResponse.json<ErrResp>(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
