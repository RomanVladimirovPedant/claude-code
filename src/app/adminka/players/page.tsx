import { prisma } from "@/lib/prisma";
import { createPlayer } from "../actions";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold">Добавить игрока</h2>
        <form action={createPlayer} className="card flex gap-2 p-3">
          <input
            className="input"
            name="name"
            placeholder="Имя и фамилия"
            required
            autoComplete="off"
          />
          <button type="submit" className="btn-primary shrink-0">
            Добавить
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Игроки ({players.length})</h2>
        <ol className="space-y-2">
          {players.map((p, i) => (
            <li key={p.id} className="card flex items-center gap-3 px-4 py-2.5">
              <span className="w-6 shrink-0 text-center text-sm text-ink/40">{i + 1}</span>
              <span className="flex-1 truncate font-medium">{p.name}</span>
              <span
                className={`shrink-0 font-bold tabular-nums ${
                  p.totalPoints < 0 ? "text-red-600" : "text-ink"
                }`}
              >
                {p.totalPoints}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
