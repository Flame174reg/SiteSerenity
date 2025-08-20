"use client";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Добро пожаловать в Dashboard 🚀</h1>
      <p className="text-gray-600 mt-2">
        Это ваша первая отдельная страница на сайте.
      </p>

      {session?.user?.name && (
        <p className="mt-4 opacity-70">Вы вошли как {session.user.name}</p>
      )}
    </main>
  );
}
