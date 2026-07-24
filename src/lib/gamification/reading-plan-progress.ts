import "server-only";
import { prisma } from "@/lib/prisma";

const POINTS_PER_DAY = 10;
const STREAK_BONUS_PER_DAY = 2;
const MAX_STREAK_BONUS = 5;
const COMPLETION_BONUS = 50;

function sameCalendarDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function isYesterday(a: Date, b: Date) {
  const y = new Date(b);
  y.setDate(y.getDate() - 1);
  return sameCalendarDay(a, y);
}

export async function markDayComplete(userId: string, planId: string, day: number) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const plan = await tx.readingPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error("Plan not found");
    if (day < 1 || day > plan.totalDays) throw new Error("Invalid day");

    const existing = await tx.readingPlanEnrollment.findUnique({
      where: { userId_planId: { userId, planId } },
    });

    const completedDays = existing
      ? existing.completedDays.split(",").filter(Boolean).map(Number)
      : [];
    const alreadyDone = completedDays.includes(day);

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
    if (!alreadyDone) {
      pointsAwarded += POINTS_PER_DAY;
      if (isFirstReadToday) {
        pointsAwarded +=
          Math.min(currentStreak, MAX_STREAK_BONUS) * STREAK_BONUS_PER_DAY;
      }
      completedDays.push(day);
    }

    const longestStreak = Math.max(existing?.longestStreak ?? 0, currentStreak);
    const isComplete = completedDays.length >= plan.totalDays;

    if (isComplete && !existing?.completedAt && !alreadyDone) {
      pointsAwarded += COMPLETION_BONUS;
    }

    const enrollment = await tx.readingPlanEnrollment.upsert({
      where: { userId_planId: { userId, planId } },
      update: {
        completedDays: completedDays.join(","),
        currentStreak,
        longestStreak,
        lastReadAt: now,
        pointsEarned: { increment: pointsAwarded },
        completedAt: isComplete ? now : undefined,
      },
      create: {
        userId,
        planId,
        completedDays: completedDays.join(","),
        currentStreak,
        longestStreak,
        lastReadAt: now,
        pointsEarned: pointsAwarded,
        completedAt: isComplete ? now : null,
      },
    });

    if (pointsAwarded > 0) {
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: pointsAwarded } },
      });
    }

    return { enrollment, pointsAwarded, alreadyDone, isComplete };
  });
}
