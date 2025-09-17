// src/app/weekly/[category]/page.tsx
import WeeklyFolderClient from "../folder.client";

export const dynamic = "force-dynamic";

export default async function WeeklyCategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params; // Next 15: params — Promise
  const categorySafe = category;     // safe-сегмент из URL
  const categoryHuman = decodeURIComponent(categorySafe);

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <WeeklyFolderClient
          categorySafe={categorySafe}
          categoryHuman={categoryHuman}
        />
      </div>
    </main>
  );
}
