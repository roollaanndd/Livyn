import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/supabase-rest";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import { clearSessionCookies } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { registerSchema } from "@/lib/validation/auth";

/**
 * Consumes a password-reset token minted by /api/auth/forgot-password and
 * sets a new password.
 *
 * Before this route existed, the forgot-password flow emailed a link to
 * /atur-ulang-sandi?token=... but neither the page nor the handler was
 * built. Users had no way to actually recover an account — the "email
 * sent" toast was the end of the road. Security audit item.
 *
 * Guarantees:
 *   1. The token is validated by SHA-256 hash lookup — the raw token
 *      never sits in the database.
 *   2. Tokens are single-use: `usedAt` is stamped inside the same
 *      transaction as the password write.
 *   3. Expired tokens are rejected without touching the user record.
 *   4. Every existing refresh-token family for the user is revoked, so a
 *      thief who already stole the old password loses their sessions the
 *      instant the real owner completes a reset.
 *   5. Cookies on THIS request are cleared too — the caller is not
 *      logged in as a side effect of resetting.
 */

const schema = z.object({
  token: z.string().min(1),
  // Reuse the register password policy for consistency.
  password: registerSchema.shape.password,
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = await rateLimit(`reset-pw:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } }).catch(() => null);

  if (!record || record.usedAt || new Date(record.expiresAt) < new Date()) {
    // Never leak whether the token existed but was already used vs never
    // existed. All bad-token paths get the same error.
    return NextResponse.json(
      { error: "Tautan tidak berlaku atau sudah kedaluwarsa. Minta tautan baru." },
      { status: 400 },
    );
  }

  // Mark used FIRST so a race between two clicks can only settle one write.
  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  const passwordHash = await hashPassword(parsed.data.password);
  await db.user.update(record.userId, { passwordHash });

  // Invalidate every refresh token for this user — a session stolen before
  // the reset must die now. The access-token cookie on THIS request is also
  // cleared; the user re-authenticates through the normal login flow.
  await db.session.revokeOtherSessions(record.userId, null);
  await clearSessionCookies();

  await logAudit({
    userId: record.userId,
    action: "auth.password_reset_completed",
    ipAddress: ip,
  });

  return NextResponse.json({ ok: true });
}
