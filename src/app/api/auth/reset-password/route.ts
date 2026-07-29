import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/supabase-rest";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { clearSessionCookies } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

/**
 * Completes the reset that /api/auth/forgot-password starts.
 *
 * That endpoint has been minting tokens and pointing at /atur-ulang-sandi since
 * it was written, but neither this route nor that page existed — the link went
 * nowhere, so nobody could actually recover an account.
 *
 * The token is only ever stored as a SHA-256 hash, so a leaked database row
 * cannot be replayed as a reset link. It is single-use, and using it drops every
 * existing session: whoever prompted the reset must not keep a live session.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`reset-pw:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }

  const { token, password } = parsed.data;
  // One message for every rejection: expired, already used, and never-existed
  // must be indistinguishable, or the response tells an attacker which guesses
  // were real tokens.
  const invalid = () =>
    NextResponse.json(
      { error: "Tautan atur ulang sudah tidak berlaku. Minta tautan baru ya." },
      { status: 400 },
    );

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!record || record.usedAt) return invalid();
    if (new Date(record.expiresAt) < new Date()) return invalid();

    const user = await db.user.findById(record.userId);
    if (!user) return invalid();

    await db.user.update(user.id, { passwordHash: await hashPassword(password) });

    // Burn the token before anything else can retry it.
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    // Every refresh token for this account goes, including any the attacker
    // holds. Passing no "current" token means none is spared.
    await db.session.revokeOtherSessions(user.id, null);
    await clearSessionCookies();

    await logAudit({
      userId: user.id,
      action: "auth.password_reset_completed",
      ipAddress: ip,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
}
