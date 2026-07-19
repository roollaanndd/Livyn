import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/tokens";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`forgot-pw:${ip}`, 5, 15 * 60 * 1000);
  // Always return the same generic response regardless of outcome, to avoid
  // leaking whether an email is registered.
  const generic = NextResponse.json({ ok: true });
  if (!limited.ok) return generic;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return generic;

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return generic;

  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });

  await logAudit({ userId: user.id, action: "auth.password_reset_requested", ipAddress: ip });

  // No transactional email provider is wired up in this build — the reset
  // link would normally be emailed. Logged server-side so the flow is
  // testable end-to-end without SMTP.
  console.log(`[Livyn] Password reset link for ${user.email}: /atur-ulang-sandi?token=${token}`);

  return generic;
}
