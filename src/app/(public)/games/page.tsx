import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-3">
      {games.length === 0 ? (
        <p className="text-center text-ink/50">Игры ещё не добавлены.</p>
      ) : (
        games.map((game) => (
          <article key={game.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{game.name}</h2>
              <span className="shrink-0 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/60">
                до {game.maxPlayers} игроков
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">{game.rulesText}</p>
            <div className="mt-3 flex gap-2 text-sm font-semibold">
              <span className="rounded-lg bg-green-600/10 px-2.5 py-1 text-green-700">
                Победа +{game.pointsForWin}
              </span>
              <span className="rounded-lg bg-red-600/10 px-2.5 py-1 text-red-700">
                Поражение {game.pointsForLoss}
              </span>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
