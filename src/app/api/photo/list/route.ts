// src/app/api/photo/list/route.ts
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic"; // только один раз!
export const runtime = "nodejs";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "weekly.json");
    const file = await readFile(filePath, "utf8");
    const data = JSON.parse(file);
    // ожидаем структуру { photos: [...] }
    return NextResponse.json(data);
  } catch {
    // если файла нет — вернём пустой список
    return NextResponse.json({ photos: [] });
  }
}
