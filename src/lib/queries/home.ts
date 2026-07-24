import "server-only";
import { prisma } from "@/lib/prisma";

/* Days since epoch in Asia/Jakarta (UTC+7, no DST). Using the user's local
 * calendar day means "today's" content rotates at midnight WIB — with the old
 * UTC day-of-year it only changed at 07:00 WIB, which read as "not changing". */
function jakartaDayKey(): number {
  return Math.floor((Date.now() + 7 * 60 * 60 * 1000) / 86_400_000);
}

export async function getTodayVerse() {
  const count = await prisma.bibleVerse.count();
  if (count === 0) return null;
  const skip = jakartaDayKey() % count;
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
    // id tiebreak keeps the order stable when publishDates are equal,
    // so the daily rotation is deterministic
    orderBy: [{ publishDate: "desc" }, { id: "asc" }],
    include: { author: true, category: true },
  });
  if (published.length === 0) return null;
  return published[jakartaDayKey() % published.length];
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
