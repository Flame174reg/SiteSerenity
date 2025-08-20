"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="font-sans grid grid-rows-[64px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      {/* ↑ добавили место под шапку (64px) */}

      {/* ШАПКА с кнопками */}
      <header className="row-start-1 w-full max-w-5xl flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">Site Serenity</Link>

        <div className="flex items-center gap-3">
          <Link className="underline" href="/dashboard">Dashboard</Link>

          {status === "authenticated" ? (
            <>
              <span className="text-sm text-gray-400">{session.user?.name}</span>
              <button
                className="px-3 py-1 rounded bg-white/10"
                onClick={() => signOut()}
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              className="px-3 py-1 rounded bg-white/10"
              onClick={() => signIn("discord")}
            >
              Войти через Discord
            </button>
          )}
        </div>
      </header>

      {/* ТВОЙ исходный контент — оставляем как был */}
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              al
