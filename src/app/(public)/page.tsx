import { prisma } from "@/lib/prisma";
import { Leaderboard } from "./leaderboard";

export const dynamic = "force-dynamic";

export default async function RatingPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
    select: { id: true, name: true, totalPoints: true },
  });

  return (
    <div>
      <p className="mb-4 text-center text-sm text-ink/50">
        Обновляется автоматически
      </p>
      {players.length === 0 ? (
        <p className="text-center text-ink/50">Пока нет игроков.</p>
      ) : (
        <Leaderboard initialPlayers={players} />
      )}
    </div>
  );
}
