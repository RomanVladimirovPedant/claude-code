import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Adminka",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/90 px-4 pb-3 pt-5 backdrop-blur">
        <h1 className="text-center text-lg font-bold tracking-tight">⚙️ Adminka</h1>
        <nav className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Link href="/adminka" className="btn-secondary">
            Игры
          </Link>
          <Link href="/adminka/results" className="btn-secondary">
            Результаты
          </Link>
          <Link href="/adminka/players" className="btn-secondary">
            Игроки
          </Link>
        </nav>
      </header>
      <main className="flex-1 px-4 pb-10 pt-4">{children}</main>
    </div>
  );
}
