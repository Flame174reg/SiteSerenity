import { auth } from "@/auth";
import { OWNER_ID } from "@/lib/adminStore";
import AdminClient from "./ui/AdminClient";

export const metadata = { title: "Админ-панель" };

type SessionLike = { discordId?: string };

export default async function AdminPage() {
  const session = (await auth()) as unknown as SessionLike | null;
  if (!session?.discordId || session.discordId !== OWNER_ID) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold">Доступ запрещён</h1>
          <p className="opacity-70 mt-2">Эта страница доступна только владельцу.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Админ-панель</h1>
        <AdminClient />
      </div>
    </main>
  );
}
