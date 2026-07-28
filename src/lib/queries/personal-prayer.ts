import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type PersonalPrayerRow = {
  id: string;
  title: string;
  body: string | null;
  status: string;
  answeredNote: string | null;
  answeredAt: Date | null;
  createdAt: Date;
};

export const listPersonalPrayers = cache(
  async (userId: string, status?: "open" | "answered"): Promise<PersonalPrayerRow[]> => {
    return (await prisma.personalPrayer
      .findMany({
        where: status ? { userId, status } : { userId },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => [])) as PersonalPrayerRow[];
  },
);

export const countAnsweredPrayers = cache(async (userId: string): Promise<number> => {
  return (await prisma.personalPrayer
    .count({ where: { userId, status: "answered" } })
    .catch(() => 0)) as number;
});
