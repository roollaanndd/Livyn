import { z } from "zod";

export const MOODS = ["damai", "sukacita", "bersyukur", "sedih", "cemas", "marah", "lelah", "bingung"] as const;

export const journalEntrySchema = z.object({
  title: z.string().trim().max(100).optional(),
  body: z.string().trim().min(3, "Ceritakan sedikit lebih banyak").max(5000),
  mood: z.enum(MOODS).optional(),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
