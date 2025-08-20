import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route"; // серверный гард
import SignOutButton from "./signout-button";

export default async function Dashboard() {
  const session = await auth();     // проверяем сессию на сервере
  if (!session) redirect("/");      // гость -> на главную

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Добро пожаловать в Dashboard 🚀</h1>
      <p className="text-gray-600 mt-2">Это защищённая страница. Вы вошли как:</p>

      <div className="mt-4 space-y-1">
        <div><b>Имя:</b> {session.user?.name}</div>
        <div><b>Email:</b> {session.user?.email ?? "—"}</div>
        {/* @ts-ignore */}
        <div><b>Discord ID:</b> {session.discordId ?? "—"}</div>
      </div>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </main>
  );
}
