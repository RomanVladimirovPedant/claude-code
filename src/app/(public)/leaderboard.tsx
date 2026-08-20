"use client";

import { useEffect, useState } from "react";

type Player = { id: number; name: string; totalPoints: number };

const POLL_INTERVAL_MS = 7000;
const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState(initialPlayers);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/players", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPlayers(data.players);
      } catch {
        // networking hiccup, next poll will retry
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <ol className="space-y-2">
      {players.map((player, i) => (
        <li key={player.id} className="card flex items-center gap-3 px-4 py-3">
          <span className="w-8 shrink-0 text-center text-lg font-semibold text-ink/50">
            {MEDALS[i] ?? i + 1}
          </span>
          <span className="flex-1 truncate font-medium">{player.name}</span>
          <span
            className={`shrink-0 text-lg font-bold tabular-nums ${
              player.totalPoints < 0 ? "text-red-600" : "text-ink"
            }`}
          >
            {player.totalPoints}
          </span>
        </li>
      ))}
    </ol>
  );
}
