import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLAYERS = [
  "Максим Иванов",
  "Роман Владимиров",
  "Валерия Масагутова",
  "Руслан Ефимов",
  "Милена Хусаинова",
  "Руслан Вахитов",
  "Полина Ефимова",
  "Никита Хлынцев",
  "Вячеслав Савинов",
  "Ксения Савинова",
  "Максим Гордеев",
  "Никита Шайнов",
  "Радмир Вагапов",
  "Руслан Абдрахманов",
];

const GAMES = [
  {
    name: "Бирпонг",
    rulesText:
      "Команды по очереди кидают мяч, стараясь попасть в стаканы соперника. Промазал — ход переходит. Потопил все стаканы — победа.",
    maxPlayers: 4,
    pointsForWin: 300,
    pointsForLoss: -100,
  },
  {
    name: "Пивное казино-рулетка",
    rulesText:
      "По кругу крутится рулетка, выпавший сектор определяет, кто пьёт штрафной или получает бонус. Победитель раунда определяется по итогам круга.",
    maxPlayers: 6,
    pointsForWin: 200,
    pointsForLoss: -100,
  },
  {
    name: "Морской бой",
    rulesText:
      "Классический морской бой на бумаге или стаканах. Кто первым топит весь флот соперника — побеждает.",
    maxPlayers: 2,
    pointsForWin: 300,
    pointsForLoss: -400,
  },
  {
    name: "Дартс на баллы",
    rulesText: "Три броска дротиков, считаем сумму очков. У кого больше — тот победил.",
    maxPlayers: 2,
    pointsForWin: 250,
    pointsForLoss: -100,
  },
  {
    name: "Флип-кап",
    rulesText:
      "Нужно щелчком перевернуть стакан на попа. Кто первым справится за меньшее число попыток — побеждает.",
    maxPlayers: 4,
    pointsForWin: 300,
    pointsForLoss: -100,
  },
  {
    name: "Квиз про именинника",
    rulesText: "Вопросы о жизни и привычках именинника. Больше правильных ответов — победа.",
    maxPlayers: 10,
    pointsForWin: 200,
    pointsForLoss: 0,
  },
  {
    name: "Армрестлинг",
    rulesText: "Побеждает тот, кто положит руку соперника на стол.",
    maxPlayers: 2,
    pointsForWin: 300,
    pointsForLoss: -200,
  },
];

async function main() {
  for (const name of PLAYERS) {
    const existing = await prisma.player.findFirst({ where: { name } });
    if (!existing) {
      await prisma.player.create({ data: { name } });
    }
  }

  for (const game of GAMES) {
    const existing = await prisma.game.findFirst({ where: { name: game.name } });
    if (!existing) {
      await prisma.game.create({ data: game });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
