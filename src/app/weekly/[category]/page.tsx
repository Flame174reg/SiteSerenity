// src/app/weekly/[category]/page.tsx
import WeeklyFolderClient from "../folder.client";

export default async function WeeklyCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  // В Next 15.5 params промисифицирован — ждём и достаём safe-сегмент
  const { category: categorySafe } = await params;

  // Человекочитаемое имя папки
  const categoryHuman = decodeURIComponent(categorySafe).replace(/\+/g, " ");

  return (
    <div className="mx-auto max-w-6xl">
      <WeeklyFolderClient safe={categorySafe} name={categoryHuman} />
    </div>
  );
}
