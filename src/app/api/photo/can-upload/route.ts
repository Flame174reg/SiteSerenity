import { NextResponse } from "next/server";
import { auth } from "@/auth";

// парсим список id из переменной окружения (через запятую / пробелы)
function parseAdminIds(src?: string) {
  return new Set(
    (src ?? "")
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export async function GET() {
  // если не авторизован — запрет
  const session = await auth().catch(() => null);
  const discordId = (session as any)?.discordId as string | undefined;

  const admins = parseAdminIds(process.env.ADMIN_DISCORD_IDS);
  const allowed = !!discordId && admins.has(discordId);

  // фронт ждёт { allowed: boolean }
  return NextResponse.json({ allowed });
}
