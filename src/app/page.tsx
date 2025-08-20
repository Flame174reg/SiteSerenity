"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="font-sans grid grid-rows-[64px_1fr_20px] min-h-screen p-8 gap-16 sm:p-20">
      <header className="row-start-1 w-full max-w-5xl flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">Site Serenity</Link>

        <div className="flex items-center gap-3">
          <Link className="underline" href="/rules">Правила семьи</Link>

          {status === "authenticated" ? (
            <>
              <span className="text-sm text-gray-400">{session?.user?.name}</span>
              <button className="px-3 py-1 rounded bg-white/10" onClick={() => signOut()}>
                Выйти
              </button>
            </>
          ) : (
            <button className="px-3 py-1 rounded bg-white/10" onClick={() => signIn("discord")}>
              Войти через Discord
            </button>
          )}
        </div>
      </header>

      <main className="row-start-2 flex items-center justify-center">
        <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center" />
    </div>
  );
}
