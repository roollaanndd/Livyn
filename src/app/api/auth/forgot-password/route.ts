import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/supabase-rest";
import { hashToken } from "@/lib/auth/tokens";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`forgot-pw:${ip}`, 5, 15 * 60 * 1000);
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

  console.log(`[Livyn] Password reset link for ${user.email}: /atur-ulang-sandi?token=${token}`);

  return generic;
}
