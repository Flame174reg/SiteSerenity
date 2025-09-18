// src/app/admin/page.tsx
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import AdminClient from "./ui/AdminClient";

const OWNER_ID = "1195944713639960601";

export default async function AdminPage() {
  const session = await auth();
  const me = session?.user?.id;

  if (!me || me !== OWNER_ID) {
    // Прячем сам раздел от всех, кроме владельца
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-semibold">Администрирование</h1>
      <p className="mb-4 opacity-70">
        Выбирайте, кому разрешены загрузки фото (роль «Админ»).
      </p>
      <AdminClient />
    </div>
  );
}
