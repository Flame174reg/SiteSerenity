/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth"; // у вас уже есть src/auth.ts
import Link from "next/link";

export const metadata = {
  title: "Личный кабинет",
};

export default async function AccountPage() {
  const session = await auth();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-extrabold">Личный кабинет</h1>

        {!session ? (
          <div className="rounded-xl border border-white/10 bg-black/50 p-6">
            <p className="opacity-80">
              Вы не авторизованы. Пожалуйста,&nbsp;
              <Link
                href="/api/auth/signin"
                className="underline hover:opacity-100"
              >
                войдите
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/50 p-6 space-y-4">
            <div className="text-sm opacity-70">Сессия активна</div>
            <div className="grid gap-2 text-sm">
              <div>
                <span className="opacity-60">Имя:&nbsp;</span>
                <span className="font-medium">{session.user?.name ?? "—"}</span>
              </div>
              <div>
                <span className="opacity-60">Email:&nbsp;</span>
                <span className="font-medium">{session.user?.email ?? "—"}</span>
              </div>
              <div>
                <span className="opacity-60">Discord ID:&nbsp;</span>
                <span className="font-medium">
                  {(session as any)?.discordId ?? "—"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/api/auth/signout"
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Выйти
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
