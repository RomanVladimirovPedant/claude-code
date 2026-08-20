import { prisma } from "@/lib/prisma";

export type Outcome = "win" | "loss";

export async function recordResult(playerId: number, gameId: number, outcome: Outcome) {
  const game = await prisma.game.findUniqueOrThrow({ where: { id: gameId } });
  const pointsDelta = outcome === "win" ? game.pointsForWin : game.pointsForLoss;

  await prisma.$transaction([
    prisma.gameResult.create({
      data: { playerId, gameId, outcome, pointsDelta },
    }),
    prisma.player.update({
      where: { id: playerId },
      data: { totalPoints: { increment: pointsDelta } },
    }),
  ]);
}

export async function deleteResult(resultId: number) {
  const result = await prisma.gameResult.findUniqueOrThrow({ where: { id: resultId } });

  await prisma.$transaction([
    prisma.player.update({
      where: { id: result.playerId },
      data: { totalPoints: { decrement: result.pointsDelta } },
    }),
    prisma.gameResult.delete({ where: { id: resultId } }),
  ]);
}
