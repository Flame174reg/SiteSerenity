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
      <body className="min-h-screen antialiased">
        <ThemeBackground />

        <header className="sticky top-0 z-40 backdrop-soft border-b border-white/6 bg-[rgba(11,14,20,0.24)]">
          <div className="container-max h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="logo">
                <span className="inline-block w-8 h-8 rounded-md" style={{background:'linear-gradient(135deg,var(--accent),#4c1d95)'}}/>
                <span>Site Serenity</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm muted">
              <Link href="/rules" className="hover:underline muted">Правила</Link>
              <Link href="/guides" className="hover:underline muted">Гайды</Link>
              <Link href="/weekly" className="hover:underline muted">Еженедельник</Link>
            </nav>
          </div>
        </header>

        <SessionProviderWrapper>
          <div className="container-max grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 pt-6">
            <aside className="lg-sidebar-visible">
              <Sidebar />
            </aside>
            <main className="min-h-[60vh]">
              {children}
            </main>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
