import { z } from "zod";

const scheduleItemSchema = z.object({
  day: z.number().int().min(1),
  bookCode: z.string().min(2).max(10),
  chapter: z.number().int().min(1),
  title: z.string().max(100).optional(),
});

export const readingPlanSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  coverEmoji: z.string().max(4).default("📖"),
  totalDays: z.number().int().min(1).max(365),
  category: z.enum(["general", "gospel", "wisdom", "epistles", "ot-history"]).default("general"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  schedule: z.array(scheduleItemSchema).min(1),
  active: z.boolean().default(true),
});

export const readingPlanUpdateSchema = readingPlanSchema.partial().extend({
  active: z.boolean().optional(),
});
