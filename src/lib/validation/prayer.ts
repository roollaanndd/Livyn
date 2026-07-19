import { z } from "zod";

export const SLOTS = ["morning", "lunch", "evening", "midnight", "custom"] as const;

export const prayerReminderSchema = z.object({
  label: z.string().trim().min(2).max(60),
  slot: z.enum(SLOTS),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format waktu tidak valid (HH:mm)"),
  daysOfWeek: z.string().regex(/^[0-6](,[0-6]){0,6}$/, "Hari tidak valid"),
  ringtone: z.string().default("default"),
  repeat: z.boolean().default(true),
  verseAfter: z.boolean().default(true),
});

export type PrayerReminderInput = z.infer<typeof prayerReminderSchema>;
