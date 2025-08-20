"use client";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="font-sans grid grid-rows-[64px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header className="row-start-1 w-full max-w-5xl flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">Site Serenity</Link>
        <div className="flex items-center gap-3">
          <Link className="underline" href="/dashboard">Dashboard</Link>
          {status === "authenticated" ? (
            <>
              <span className="text-sm text-gray-400">{session.user?.name}</span>
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

      {/* ниже оставляю твой исходный контент */}
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>.
          </li>
          <li className="tracking-[-.01em]">Save and see your changes instantly.</li>
        </ol>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        {/* ссылки как были */}
      </footer>
    </div>
  );
}
