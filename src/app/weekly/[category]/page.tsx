// src/app/weekly/[category]/page.tsx

import WeeklyFolderClient from "../folder.client";

type PageProps = {
  params: { category: string };
};

export default function WeeklyCategoryPage({ params }: PageProps) {
  // safe-сегмент папки из URL
  const categorySafe = params.category;

  // человекочитаемое имя — декодируем safe (если нужен иной источник — логика останется прежней)
  const categoryHuman = decodeURIComponent(categorySafe).replace(/\+/g, " ");

  return (
    <div className="mx-auto max-w-6xl">
      <WeeklyFolderClient safe={categorySafe} name={categoryHuman} />
    </div>
  );
}
