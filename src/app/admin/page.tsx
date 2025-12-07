// src/app/admin/page.tsx
import React from "react";
import { auth } from "@/auth";
import { isSuperAdminDb, SUPER_ADMIN_ID } from "@/lib/access";
import AdminClient from "./ui/AdminClient";
import SiteContentEditor from "./ui/SiteContentEditor";

export default async function AdminPage() {
  const session = await auth();
  const me = session?.user?.id ?? null;

  const allowed = !!me && (me === SUPER_ADMIN_ID || (await isSuperAdminDb(me)));

  if (!allowed) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">404 Нет доступа</h1>
        <p className="mb-4 opacity-70">У вас нет прав для просмотра этой страницы.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Панель администрирования</h1>
        <p className="mb-4 opacity-70">
          Управляйте ролями модерации и редактируйте тексты на главной странице.
        </p>
      </div>

      <AdminClient />
      <SiteContentEditor />
    </div>
  );
}
