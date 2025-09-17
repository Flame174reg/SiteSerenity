// src/app/weekly/page.tsx
import WeeklyRootClient from "./root.client";

export const dynamic = "force-dynamic";

export default async function WeeklyRootPage() {
  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <WeeklyRootClient />
      </div>
    </main>
  );
}
