import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
    select: { id: true, name: true, totalPoints: true },
  });
  return NextResponse.json({ players });
}
