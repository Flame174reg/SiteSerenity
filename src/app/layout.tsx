// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import SessionProviderWrapper from "../components/SessionProvider";
import ThemeBackground from "../components/ThemeBackground";
import Sidebar from "../components/Sidebar"; // ⬅️ добавили

export const metadata: Metadata = {
  title: "Site Serenity",
  description: "Family portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-white antialiased">
        {/* Глобальный фон */}
        <ThemeBackground />

        {/* Глобальный хедер */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur">
          <div className="mx-auto max-w-5xl h-14 px-6 flex items-center justify-between">
            {/* Кнопка на главную */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-white/5 border border-white/10 hover:bg-white/10"
            >
              ← На главную
            </Link>

            {/* Навигация */}
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/rules" className="hover:underline">
                Правила
              </Link>
            </nav>
          </div>
        </header>

        {/* Провайдер сессии + выдвижная колонка + контент */}
        <SessionProviderWrapper>
          <Sidebar />      {/* ⬅️ выдвижная панель слева */}
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
