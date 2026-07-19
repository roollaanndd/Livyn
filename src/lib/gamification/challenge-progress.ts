import "server-only";
import { prisma } from "@/lib/prisma";

const BASE_POINTS_PER_CHAPTER = 10;
const MAX_STREAK_BONUS_MULTIPLIER = 5;
const STREAK_BONUS_PER_DAY = 2;

function sameCalendarDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function isYesterday(a: Date, b: Date) {
  const yesterday = new Date(b);
  yesterday.setDate(yesterday.getDate() - 1);
  return sameCalendarDay(a, yesterday);
}

/** Marks a chapter read for a user's challenge, awarding points/streak. Idempotent per chapter. */
export async function markChapterRead(userId: string, challengeId: string, chapter: number) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.challengeProgress.findUnique({ where: { userId_challengeId: { userId, challengeId } } });

    const chaptersRead = existing ? existing.chaptersRead.split(",").filter(Boolean).map(Number) : [];
    const alreadyRead = chaptersRead.includes(chapter);

    let currentStreak = existing?.currentStreak ?? 0;
    let isFirstReadToday = true;
    if (existing?.lastReadAt) {
      if (sameCalendarDay(existing.lastReadAt, now)) {
        isFirstReadToday = false;
      } else if (isYesterday(existing.lastReadAt, now)) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    let pointsAwarded = 0;
    if (!alreadyRead) {
      pointsAwarded += BASE_POINTS_PER_CHAPTER;
      if (isFirstReadToday) {
        pointsAwarded += Math.min(currentStreak, MAX_STREAK_BONUS_MULTIPLIER) * STREAK_BONUS_PER_DAY;
      }
      chaptersRead.push(chapter);
    }

    const longestStreak = Math.max(existing?.longestStreak ?? 0, currentStreak);

    const progress = await tx.challengeProgress.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      update: {
        chaptersRead: chaptersRead.join(","),
        currentStreak,
        longestStreak,
        lastReadAt: now,
        pointsEarned: { increment: pointsAwarded },
      },
      create: {
        userId,
        challengeId,
        chaptersRead: chaptersRead.join(","),
        currentStreak,
        longestStreak,
        lastReadAt: now,
        pointsEarned: pointsAwarded,
      },
    });

    if (pointsAwarded > 0) {
      await tx.user.update({ where: { id: userId }, data: { points: { increment: pointsAwarded } } });
    }

    return { progress, pointsAwarded, alreadyRead };
  });
}
