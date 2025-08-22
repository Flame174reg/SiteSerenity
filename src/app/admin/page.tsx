// src/app/admin/page.tsx
import { auth } from "@/auth";
import AdminClient from "./ui/AdminClient";

export default async function AdminPage() {
  const session = await auth();
  const me = session?.user?.id;
  const OWNER_ID = "1195944713639960601";

  if (!me) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="opacity-70">Нужно войти через Discord.</p>
        </div>
      </main>
    );
  }

  if (me !== OWNER_ID) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="opacity-70">Доступ только для владельца.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Администрирование</h1>
        <p className="opacity-70 text-sm">Выбирайте, кому разрешены загрузки фото (роль «Админ»).</p>
        <AdminClient />
      </div>
    </main>
  );
}
