import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .max(128)
    .regex(/[a-z]/, "Harus mengandung huruf kecil")
    .regex(/[A-Z]/, "Harus mengandung huruf besar")
    .regex(/[0-9]/, "Harus mengandung angka"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
