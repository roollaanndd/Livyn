import { z } from "zod";

export const personalPrayerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().max(2000).optional().nullable(),
});

export const personalPrayerPatchSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  body: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["open", "answered"]).optional(),
  answeredNote: z.string().trim().max(2000).nullable().optional(),
});

export type PersonalPrayerInput = z.infer<typeof personalPrayerSchema>;
