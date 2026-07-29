import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/supabase-rest";
import { hashToken } from "@/lib/auth/tokens";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// Normalised the same way registration and login normalise it, so a reset for
// " Nama@Email.com " finds the account created as "nama@email.com".
const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`forgot-pw:${ip}`, 5, 15 * 60 * 1000);
  const generic = NextResponse.json({ ok: true });
  if (!limited.ok) return generic;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return generic;

  const user = await db.user.findByEmail(parsed.data.email);
  if (!user) return generic;

  const token = randomBytes(32).toString("base64url");
  await db.passwordResetToken.create({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  await logAudit({ userId: user.id, action: "auth.password_reset_requested", ipAddress: ip });

  // NOT YET DELIVERED TO THE MEMBER. There is no mail provider wired up, so the
  // only way this link reaches anyone is an operator reading it out of the server
  // logs — while /lupa-sandi already tells them to check their inbox. The route
  // it points at (/atur-ulang-sandi) and its API now exist, so hooking up a
  // transactional email sender here is the one remaining step. Until then treat
  // password recovery as operator-assisted, and note that the log line below
  // puts a live credential in the log stream.
  console.log(`[Livyn] Password reset link for ${user.email}: /atur-ulang-sandi?token=${token}`);

  return generic;
}
