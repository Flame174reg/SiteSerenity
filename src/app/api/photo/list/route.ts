// src/app/api/photo/list/route.ts
import { NextResponse } from "next/server";

type WeeklyPhoto = {
  url: string;
  author: string;
  createdAt: string; // ISO
};

export const dynamic = "force-dynamic"; // чтобы не кэшировало на билде

export async function GET() {
  // TODO: здесь потом подключим БД/хранилище. Пока — стаб, чтобы сборка проходила.
  const photos: WeeklyPhoto[] = [
    {
      url: "https://via.placeholder.com/800x500?text=Weekly+Photo",
      author: "System",
      createdAt: new Date().toISOString(),
    },
  ];

  return NextResponse.json({ photos });
}
