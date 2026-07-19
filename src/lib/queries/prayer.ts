import "server-only";
import { prisma } from "@/lib/prisma";
import { getPrayerStreak } from "@/lib/queries/home";

export async function getUserPrayerReminders(userId: string) {
  return prisma.prayerReminder.findMany({ where: { userId }, orderBy: { time: "asc" } });
}

export async function getTodayPrayerLogReminderIds(userId: string): Promise<Set<string>> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const logs = await prisma.prayerLog.findMany({
    where: { userId, prayedAt: { gte: startOfDay } },
    select: { reminderId: true },
  });
  return new Set(logs.map((l) => l.reminderId).filter((id): id is string => !!id));
}

export { getPrayerStreak };
