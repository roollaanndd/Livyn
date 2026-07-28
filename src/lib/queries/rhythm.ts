import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const RHYTHM_KINDS = ["verse", "devotion", "prayer", "journal"] as const;
export type RhythmKind = (typeof RHYTHM_KINDS)[number];

export type Rhythm = Record<RhythmKind, boolean>;

/** Calendar day in Asia/Jakarta, the timezone the rest of the app reasons in. */
export function jakartaDay(now: Date = new Date()): string {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Start of the current Jakarta day, expressed as a real UTC instant so it can
 * be compared against stored timestamps. */
function jakartaDayStart(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 7 * 60 * 60 * 1000);
}

/** What this member has already done today.
 *
 * Verse and devotion come from DailyActivity (nothing else records them);
 * prayer and journal are read from the rows those actions already create, so
 * there is one source of truth per habit rather than a parallel tally. */
export const getTodayRhythm = cache(async (userId: string): Promise<Rhythm> => {
  const day = jakartaDay();
  const since = jakartaDayStart();

  const [activities, prayerCount, journalCount] = await Promise.all([
    prisma.dailyActivity
      .findMany({ where: { userId, day }, select: { kind: true } })
      .catch(() => [] as { kind: string }[]),
    prisma.prayerLog.count({ where: { userId, prayedAt: { gte: since } } }).catch(() => 0),
    prisma.journalEntry.count({ where: { userId, createdAt: { gte: since } } }).catch(() => 0),
  ]);

  const done = new Set((activities as { kind: string }[]).map((a) => a.kind));

  return {
    verse: done.has("verse"),
    devotion: done.has("devotion"),
    prayer: prayerCount > 0,
    journal: journalCount > 0,
  };
});
