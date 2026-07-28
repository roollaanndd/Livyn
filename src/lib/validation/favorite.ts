import { z } from "zod";

export const favoriteVerseSchema = z.object({
  bookCode: z.string().min(1).max(16),
  bookName: z.string().min(1).max(64),
  chapter: z.number().int().min(1).max(200),
  verse: z.number().int().min(1).max(200),
  text: z.string().min(1).max(4000),
  note: z.string().max(1000).optional().nullable(),
});

export const favoriteNoteSchema = z.object({
  note: z.string().max(1000).nullable(),
});

export type FavoriteVerseInput = z.infer<typeof favoriteVerseSchema>;
