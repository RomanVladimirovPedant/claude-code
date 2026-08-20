import { prisma } from "@/lib/prisma";
import { submitResult, removeResult } from "../actions";
import { ConfirmButton } from "../confirm-button";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const [players, games, results] = await Promise.all([
    prisma.player.findMany({ orderBy: { name: "asc" } }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    prisma.gameResult.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
      include: { player: true, game: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold">Внести результат</h2>
        <form action={submitResult} className="card space-y-4 p-4">
          <div>
            <label className="label" htmlFor="playerId">
              Игрок
            </label>
            <select className="input" id="playerId" name="playerId" required defaultValue="">
              <option value="" disabled>
                Выберите игрока
              </option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="gameId">
              Игра
            </label>
            <select className="input" id="gameId" name="gameId" required defaultValue="">
              <option value="" disabled>
                Выберите игру
              </option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (+{g.pointsForWin} / {g.pointsForLoss})
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Исход</span>
            <div className="grid grid-cols-2 gap-2">
              <label className="has-[:checked]:border-green-600 has-[:checked]:bg-green-600/10 has-[:checked]:text-green-700 flex cursor-pointer items-center justify-center rounded-xl border border-ink/15 py-3 font-semibold">
                <input type="radio" name="outcome" value="win" defaultChecked className="sr-only" />
                Победа
              </label>
              <label className="has-[:checked]:border-red-600 has-[:checked]:bg-red-600/10 has-[:checked]:text-red-700 flex cursor-pointer items-center justify-center rounded-xl border border-ink/15 py-3 font-semibold">
                <input type="radio" name="outcome" value="loss" className="sr-only" />
                Поражение
              </label>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Сохранить
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">История результатов</h2>
        <div className="space-y-2">
          {results.length === 0 && <p className="text-ink/50">Записей ещё нет.</p>}
          {results.map((r) => (
            <div key={r.id} className="card flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.player.name}</p>
                <p className="truncate text-xs text-ink/50">
                  {r.game.name} · {r.outcome === "win" ? "победа" : "поражение"} ·{" "}
                  {new Date(r.timestamp).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`shrink-0 font-bold tabular-nums ${
                  r.pointsDelta < 0 ? "text-red-600" : "text-green-700"
                }`}
              >
                {r.pointsDelta > 0 ? `+${r.pointsDelta}` : r.pointsDelta}
              </span>
              <form action={removeResult}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmButton
                  confirmText={`Удалить запись «${r.player.name} — ${r.game.name}»?`}
                  className="btn-danger px-2.5 py-1.5 text-xs"
                >
                  ✕
                </ConfirmButton>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
