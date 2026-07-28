/** Habit hours are stored as 24 comma-separated counters on User.habitHours,
 * one per hour of the day in Asia/Jakarta. A histogram rather than a row per
 * visit: it answers "when does this person actually show up?" in a single
 * column, with no table to grow and no clean-up job to write. */

export const HOURS_IN_DAY = 24;

/** Below this many recorded opens the peak is noise, not a habit. */
export const MIN_SAMPLES_FOR_SUGGESTION = 5;

export function parseHabitHours(raw: string | null | undefined): number[] {
  const counts = new Array<number>(HOURS_IN_DAY).fill(0);
  if (!raw) return counts;
  const parts = raw.split(",");
  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    const value = Number(parts[hour]);
    counts[hour] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }
  return counts;
}

export function serializeHabitHours(counts: number[]): string {
  return counts.slice(0, HOURS_IN_DAY).join(",");
}

export function recordHour(raw: string | null | undefined, hour: number): string {
  const counts = parseHabitHours(raw);
  if (hour >= 0 && hour < HOURS_IN_DAY) counts[hour] += 1;
  return serializeHabitHours(counts);
}

/** The current hour in Asia/Jakarta (UTC+7, no DST), which is the timezone the
 * rest of the app already reasons in. */
export function jakartaHour(now: Date = new Date()): number {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).getUTCHours();
}

export type HabitPeak = { hour: number; samples: number; total: number };

/** The hour this user opens the app most often, or null when there isn't
 * enough evidence yet to move anything on their behalf. */
export function peakHour(raw: string | null | undefined): HabitPeak | null {
  const counts = parseHabitHours(raw);
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (total < MIN_SAMPLES_FOR_SUGGESTION) return null;

  let best = 0;
  for (let hour = 1; hour < HOURS_IN_DAY; hour++) {
    if (counts[hour] > counts[best]) best = hour;
  }
  if (counts[best] === 0) return null;
  return { hour: best, samples: counts[best], total };
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** True when the reminder is more than an hour away from when this person is
 * actually around — the only case where moving it is worth suggesting. */
export function isReminderMistimed(reminderTime: string, peak: number): boolean {
  const [h] = reminderTime.split(":").map(Number);
  if (!Number.isFinite(h)) return false;
  const distance = Math.min(Math.abs(h - peak), HOURS_IN_DAY - Math.abs(h - peak));
  return distance > 1;
}
