import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/supabase-rest";
import { hashToken } from "@/lib/auth/tokens";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

function absoluteUrl(req: NextRequest, path: string): string {
  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  return new URL(path, origin).toString();
}

function resetEmailBody(link: string): { html: string; text: string } {
  const text =
    `Halo,\n\n` +
    `Kami menerima permintaan untuk mengatur ulang kata sandi akun Livyn-mu.\n\n` +
    `Buka tautan berikut untuk membuat kata sandi baru (berlaku 60 menit):\n${link}\n\n` +
    `Jika kamu tidak meminta ini, abaikan email ini — akunmu tetap aman.\n\n` +
    `— Livyn`;
  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;color:#1a1a1a;max-width:520px;margin:0 auto;padding:24px">
    <h1 style="font-size:20px;margin:0 0 16px">Atur ulang kata sandi Livyn</h1>
    <p>Kami menerima permintaan untuk mengatur ulang kata sandi akunmu. Klik tombol di bawah untuk membuat kata sandi baru — tautan berlaku 60 menit.</p>
    <p style="margin:24px 0"><a href="${link}" style="background:#2D7D5F;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Buat kata sandi baru</a></p>
    <p style="color:#666;font-size:13px">Atau salin tautan ini ke browser:<br><span style="word-break:break-all">${link}</span></p>
    <p style="color:#666;font-size:13px">Jika kamu tidak meminta ini, abaikan email ini — akunmu tetap aman.</p>
    <p style="color:#999;font-size:12px;margin-top:32px">— Livyn</p>
  </body></html>`;
  return { html, text };
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = await rateLimit(`forgot-pw:${ip}`, 5, 15 * 60 * 1000);
  // Always the same shape — never leak whether the email exists in the DB,
  // and never let a downstream send failure change the caller-visible result.
  const generic = NextResponse.json({ ok: true });
  if (!limited.ok) return generic;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return generic;

  const user = await db.user.findByEmail(parsed.data.email.toLowerCase());
  if (!user) return generic;

  const token = randomBytes(32).toString("base64url");
  await db.passwordResetToken.create({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  await logAudit({ userId: user.id, action: "auth.password_reset_requested", ipAddress: ip });

  const link = absoluteUrl(req, `/atur-ulang-sandi?token=${token}`);
  const { html, text } = resetEmailBody(link);
  try {
    await sendEmail({ to: user.email, subject: "Atur ulang kata sandi Livyn", html, text });
  } catch (err) {
    // Log so the failure is visible, but keep the response generic — the
    // user should never learn from a timing difference whether an address
    // exists in our system.
    console.error("[forgot-password] sendEmail failed:", err);
  }

  return generic;
}
