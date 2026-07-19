import { z } from "zod";

export const devotionSchema = z.object({
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(150),
  excerpt: z.string().trim().min(10, "Ringkasan minimal 10 karakter").max(300),
  body: z.string().trim().min(50, "Isi renungan minimal 50 karakter"),
  bibleRefs: z.string().trim().min(2, "Referensi Alkitab wajib diisi").max(300),
  readingTimeMin: z.number().int().min(1).max(30),
  categoryId: z.string().min(1).nullable().optional(),
  submit: z.boolean().default(false), // true = submit for review, false = save draft
});

export const sermonSchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(10).max(1000),
  videoUrl: z.string().trim().url("URL video tidak valid"),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal("")),
  durationSec: z.number().int().min(0).max(6 * 60 * 60),
  pastor: z.string().trim().min(2).max(100),
  church: z.string().trim().max(150).optional().or(z.literal("")),
  transcript: z.string().trim().max(20000).optional().or(z.literal("")),
  categoryId: z.string().min(1).nullable().optional(),
  submit: z.boolean().default(false),
});
