import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateGame, deleteGame } from "../../../actions";
import { ConfirmButton } from "../../../confirm-button";

export default async function EditGamePage({ params }: { params: { id: string } }) {
  const game = await prisma.game.findUnique({ where: { id: Number(params.id) } });
  if (!game) notFound();

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Изменить игру</h2>
      <form action={updateGame} className="card space-y-4 p-4">
        <input type="hidden" name="id" value={game.id} />
        <div>
          <label className="label" htmlFor="name">
            Название
          </label>
          <input className="input" id="name" name="name" defaultValue={game.name} required />
        </div>
        <div>
          <label className="label" htmlFor="rulesText">
            Правила
          </label>
          <textarea
            className="input"
            id="rulesText"
            name="rulesText"
            rows={4}
            defaultValue={game.rulesText}
          />
        </div>
        <div>
          <label className="label" htmlFor="maxPlayers">
            Максимум игроков
          </label>
          <input
            className="input"
            id="maxPlayers"
            name="maxPlayers"
            type="number"
            min={1}
            defaultValue={game.maxPlayers}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="pointsForWin">
              Очки за победу
            </label>
            <input
              className="input"
              id="pointsForWin"
              name="pointsForWin"
              type="number"
              defaultValue={game.pointsForWin}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="pointsForLoss">
              Очки за поражение
            </label>
            <input
              className="input"
              id="pointsForLoss"
              name="pointsForLoss"
              type="number"
              defaultValue={game.pointsForLoss}
              required
            />
          </div>
        </div>
        <p className="text-xs text-ink/50">
          Изменение очков не повлияет на уже внесённые результаты — они сохраняют значения на
          момент внесения.
        </p>
        <button type="submit" className="btn-primary w-full">
          Сохранить
        </button>
      </form>

      <form action={deleteGame}>
        <input type="hidden" name="id" value={game.id} />
        <ConfirmButton
          confirmText={`Удалить игру «${game.name}»? Это удалит и всю её историю результатов.`}
          className="btn-danger w-full"
        >
          Удалить игру
        </ConfirmButton>
      </form>
    </div>
  );
}
