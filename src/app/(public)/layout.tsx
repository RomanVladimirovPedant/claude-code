import { NavLink } from "./nav-link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/90 px-4 pb-3 pt-5 backdrop-blur">
        <h1 className="text-center text-xl font-bold tracking-tight">🎉 Birthday Games</h1>
        <nav className="mt-4 grid grid-cols-2 gap-2">
          <NavLink href="/">Рейтинг</NavLink>
          <NavLink href="/games">Игры</NavLink>
        </nav>
      </header>
      <main className="flex-1 px-4 pb-10 pt-4">{children}</main>
    </div>
  );
}
