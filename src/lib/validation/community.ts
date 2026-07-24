import { z } from "zod";

export const circleCreateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(50, "Nama maksimal 50 karakter"),
  description: z.string().trim().max(200, "Deskripsi maksimal 200 karakter").optional().or(z.literal("")),
  emoji: z.string().trim().min(1).max(4).default("🌿"),
});

export const circleUpdateSchema = circleCreateSchema.partial();

export const prayerRequestSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(120, "Judul maksimal 120 karakter"),
  body: z.string().trim().max(1000, "Detail maksimal 1000 karakter").optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false),
});

export const prayerAnswerSchema = z.object({
  answeredNote: z.string().trim().max(500).optional().or(z.literal("")),
});

export const versePingSchema = z.object({
  toUserId: z.string().min(1, "Pilih penerima"),
  verseRef: z.string().trim().min(2, "Referensi ayat wajib").max(60),
  verseText: z.string().trim().min(5, "Teks ayat wajib").max(600),
  note: z.string().trim().max(300, "Catatan maksimal 300 karakter").optional().or(z.literal("")),
});

export const weeklyMissionSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(80),
  description: z.string().trim().min(5, "Deskripsi wajib").max(500),
  category: z.enum(["reading", "prayer", "fasting", "evangelism", "service", "custom"]).default("reading"),
  durationDays: z.number().int().min(1).max(60).default(7),
});

export const missionCheckInSchema = z.object({
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const broadcastSchema = z.object({
  type: z.enum(["announcement", "sermon_note", "prayer_focus"]).default("announcement"),
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(120),
  body: z.string().trim().min(5, "Isi wajib").max(4000),
  bibleRefs: z.string().trim().max(200).optional().or(z.literal("")),
  sundayDate: z.string().optional(),
});

export const leaderApplicationSchema = z.object({
  churchName: z.string().trim().min(2, "Nama gereja wajib").max(100),
  position: z.string().trim().min(2, "Jabatan wajib").max(80),
  denomination: z.string().trim().max(60).optional().or(z.literal("")),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  bio: z.string().trim().max(400).optional().or(z.literal("")),
});
