import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteGame } from "./actions";
import { ConfirmButton } from "./confirm-button";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <Link href="/adminka/results" className="btn-primary block text-center">
        ➕ Внести результат
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Игры</h2>
        <Link href="/adminka/games/new" className="btn-secondary text-sm">
          + Добавить игру
        </Link>
      </div>

      <div className="space-y-2">
        {games.length === 0 && <p className="text-ink/50">Игр пока нет.</p>}
        {games.map((game) => (
          <div key={game.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{game.name}</p>
                <p className="text-xs text-ink/50">
                  до {game.maxPlayers} игроков · +{game.pointsForWin} / {game.pointsForLoss}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/adminka/games/${game.id}/edit`} className="btn-secondary px-3 py-1.5 text-xs">
                  Изменить
                </Link>
                <form action={deleteGame}>
                  <input type="hidden" name="id" value={game.id} />
                  <ConfirmButton
                    confirmText={`Удалить игру «${game.name}»? Это удалит и всю её историю результатов.`}
                    className="btn-danger px-3 py-1.5 text-xs"
                  >
                    Удалить
                  </ConfirmButton>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
