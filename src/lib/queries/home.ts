import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/* Days since epoch in Asia/Jakarta (UTC+7, no DST). Using the user's local
 * calendar day means "today's" content rotates at midnight WIB — with the old
 * UTC day-of-year it only changed at 07:00 WIB, which read as "not changing". */
function jakartaDayKey(): number {
  return Math.floor((Date.now() + 7 * 60 * 60 * 1000) / 86_400_000);
}

// Daily verse: same for all users on a given day. Cache across requests
// keyed by the Jakarta day so the DB is hit once per day at most.
const getVerseByDayKey = unstable_cache(
  async (dayKey: number) => {
    const count = await prisma.bibleVerse.count();
    if (count === 0) return null;
    const skip = dayKey % count;
    const [verse] = await prisma.bibleVerse.findMany({
      take: 1,
      skip,
      orderBy: [{ bookId: "asc" }, { chapter: "asc" }, { verse: "asc" }],
      include: { book: true },
    });
    return verse ?? null;
  },
  ["today-verse"],
  { revalidate: 3600, tags: ["today-verse"] },
);

export const getTodayVerse = cache(async () => getVerseByDayKey(jakartaDayKey()));

// Daily devotion: same story — cache per Jakarta day.
const getDevotionByDayKey = unstable_cache(
  async (dayKey: number) => {
    const count = await prisma.devotion.count({ where: { status: "published" } });
    if (count === 0) return null;
    const skip = dayKey % count;
    const [devotion] = await prisma.devotion.findMany({
      where: { status: "published" },
      orderBy: [{ publishDate: "desc" }, { id: "asc" }],
      take: 1,
      skip,
      include: { author: true, category: true },
    });
    return devotion ?? null;
  },
  ["today-devotion"],
  { revalidate: 600, tags: ["today-devotion"] },
);

export const getTodayDevotion = cache(async () => getDevotionByDayKey(jakartaDayKey()));

// Latest sermon: also global. Cache for 5 minutes.
export const getLatestSermon = unstable_cache(
  async () =>
    prisma.sermon.findFirst({
      where: { status: "published" },
      orderBy: { publishDate: "desc" },
      include: { category: true },
    }),
  ["latest-sermon"],
  { revalidate: 300, tags: ["latest-sermon"] },
);

// Per-user data — React cache only (per-request dedup).
export const getContinueWatching = cache(async (userId: string) =>
  prisma.watchProgress.findMany({
    where: { userId, completed: false, positionSec: { gt: 0 } },
    orderBy: { updatedAt: "desc" },
    take: 3,
    include: { sermon: true },
  }),
);

export const getUpcomingReminders = cache(async (userId: string) =>
  prisma.prayerReminder.findMany({
    where: { userId, active: true },
    orderBy: { time: "asc" },
  }),
);

// 30 records is plenty for a streak (30-day streak needs 30 unique days).
export const getPrayerStreak = cache(async (userId: string) => {
  const logs = await prisma.prayerLog.findMany({
    where: { userId },
    orderBy: { prayedAt: "desc" },
    take: 30,
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
});
