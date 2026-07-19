import "server-only";
import { prisma } from "@/lib/prisma";

export async function getCurrentChallenge() {
  const now = new Date();
  return prisma.readingChallenge.findFirst({
    where: { month: now.getMonth() + 1, year: now.getFullYear(), active: true },
  });
}

export async function getChallengeProgress(userId: string, challengeId: string) {
  return prisma.challengeProgress.findUnique({ where: { userId_challengeId: { userId, challengeId } } });
}
