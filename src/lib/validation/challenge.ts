import { z } from "zod";

export const readingChallengeSchema = z.object({
  title: z.string().trim().min(3).max(100),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2100),
  bookCode: z.string().trim().min(2).max(10),
  chapterFrom: z.number().int().min(1),
  chapterTo: z.number().int().min(1),
  description: z.string().trim().max(500).optional(),
  active: z.boolean().default(true),
});

export const markChapterReadSchema = z.object({
  chapter: z.number().int().min(1),
});
