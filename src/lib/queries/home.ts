import "server-only";
import { prisma } from "@/lib/prisma";

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function getTodayVerse() {
  const count = await prisma.bibleVerse.count();
  if (count === 0) return null;
  const skip = dayOfYear() % count;
  const [verse] = await prisma.bibleVerse.findMany({
    take: 1,
    skip,
    orderBy: [{ bookId: "asc" }, { chapter: "asc" }, { verse: "asc" }],
    include: { book: true },
  });
  return verse ?? null;
}

export async function getTodayDevotion() {
  const published = await prisma.devotion.findMany({
    where: { status: "published" },
    orderBy: { publishDate: "desc" },
    include: { author: true, category: true },
  });
  if (published.length === 0) return null;
  return published[dayOfYear() % published.length];
}

export async function getLatestSermon() {
  return prisma.sermon.findFirst({
    where: { status: "published" },
    orderBy: { publishDate: "desc" },
    include: { category: true },
  });
}

export async function getContinueWatching(userId: string) {
  return prisma.watchProgress.findMany({
    where: { userId, completed: false, positionSec: { gt: 0 } },
    orderBy: { updatedAt: "desc" },
    take: 3,
    include: { sermon: true },
  });
}

export async function getUpcomingReminders(userId: string) {
  return prisma.prayerReminder.findMany({
    where: { userId, active: true },
    orderBy: { time: "asc" },
  });
}

export async function getPrayerStreak(userId: string) {
  const logs = await prisma.prayerLog.findMany({
    where: { userId },
    orderBy: { prayedAt: "desc" },
    take: 60,
    select: { prayedAt: true },
  });
  if (logs.length === 0) return 0;

  const days = new Set(logs.map((l) => l.prayedAt.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
