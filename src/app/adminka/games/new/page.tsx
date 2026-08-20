import { createGame } from "../../actions";

export default function NewGamePage() {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Новая игра</h2>
      <form action={createGame} className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="name">
            Название
          </label>
          <input className="input" id="name" name="name" required />
        </div>
        <div>
          <label className="label" htmlFor="rulesText">
            Правила
          </label>
          <textarea className="input" id="rulesText" name="rulesText" rows={4} />
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
            defaultValue={2}
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
              defaultValue={300}
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
              defaultValue={-100}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full">
          Сохранить
        </button>
      </form>
    </div>
  );
}
