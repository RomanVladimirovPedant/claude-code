"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordResult, deleteResult, type Outcome } from "@/lib/results";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/games");
  revalidatePath("/adminka");
  revalidatePath("/adminka/results");
  revalidatePath("/adminka/players");
}

function toInt(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function createGame(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rulesText = String(formData.get("rulesText") ?? "").trim();
  const maxPlayers = toInt(formData.get("maxPlayers"), 2);
  const pointsForWin = toInt(formData.get("pointsForWin"), 0);
  const pointsForLoss = toInt(formData.get("pointsForLoss"), 0);

  if (!name) throw new Error("Название игры обязательно");

  await prisma.game.create({
    data: { name, rulesText, maxPlayers, pointsForWin, pointsForLoss },
  });

  revalidateAll();
  redirect("/adminka");
}

export async function updateGame(formData: FormData) {
  const id = toInt(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const rulesText = String(formData.get("rulesText") ?? "").trim();
  const maxPlayers = toInt(formData.get("maxPlayers"), 2);
  const pointsForWin = toInt(formData.get("pointsForWin"), 0);
  const pointsForLoss = toInt(formData.get("pointsForLoss"), 0);

  if (!name) throw new Error("Название игры обязательно");

  await prisma.game.update({
    where: { id },
    data: { name, rulesText, maxPlayers, pointsForWin, pointsForLoss },
  });

  revalidateAll();
  redirect("/adminka");
}

export async function deleteGame(formData: FormData) {
  const id = toInt(formData.get("id"));
  await prisma.game.delete({ where: { id } });
  revalidateAll();
  redirect("/adminka");
}

export async function createPlayer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Имя игрока обязательно");

  await prisma.player.create({ data: { name } });

  revalidateAll();
  redirect("/adminka/players");
}

export async function submitResult(formData: FormData) {
  const playerId = toInt(formData.get("playerId"));
  const gameId = toInt(formData.get("gameId"));
  const outcome = String(formData.get("outcome") ?? "win") as Outcome;

  if (!playerId || !gameId) throw new Error("Выберите игрока и игру");
  if (outcome !== "win" && outcome !== "loss") throw new Error("Некорректный исход");

  await recordResult(playerId, gameId, outcome);

  revalidateAll();
  redirect("/adminka/results");
}

export async function removeResult(formData: FormData) {
  const id = toInt(formData.get("id"));
  await deleteResult(id);
  revalidateAll();
  redirect("/adminka/results");
}
