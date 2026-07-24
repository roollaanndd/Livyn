import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Current challenge is derived from month + year, so it changes only monthly.
// Cache for an hour to spare the DB.
const getChallengeForMonth = unstable_cache(
  async (month: number, year: number) =>
    prisma.readingChallenge.findFirst({
      where: { month, year, active: true },
    }),
  ["current-challenge"],
  { revalidate: 3600, tags: ["current-challenge"] },
);

export const getCurrentChallenge = cache(async () => {
  const now = new Date();
  return getChallengeForMonth(now.getMonth() + 1, now.getFullYear());
});

export const getChallengeProgress = cache(async (userId: string, challengeId: string) =>
  prisma.challengeProgress.findUnique({ where: { userId_challengeId: { userId, challengeId } } }),
);
