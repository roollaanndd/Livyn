import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/supabase-rest";
import { getCurrentUser, REFRESH_COOKIE } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { registerSchema } from "@/lib/validation/auth";

/**
 * Password change for a signed-in user.
 *
 * Requires the current password so a briefly-unattended session can't be
 * used to permanently steal an account. On success, every OTHER refresh
 * token family for the user is revoked — the current device stays signed
 * in, everything else logs out — because a rotated password is a signal
 * you may have already lost sessions to an attacker.
 */

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: registerSchema.shape.password,
});

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  const ip = clientIp(req.headers);
  const limited = await rateLimit(`change-pw:${session.sub}`, 5, 60 * 60 * 1000);
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

  const user = await db.user.findById(session.sub);
  if (!user || !user.passwordHash) {
    // Either the account is gone or was created via OAuth and has no
    // password to change. Same message in both cases; nothing to disclose.
    return NextResponse.json({ error: "Akun ini tidak dapat mengganti kata sandi di sini." }, { status: 400 });
  }

  const ok = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
  if (!ok) {
    await logAudit({ userId: session.sub, action: "auth.password_change_failed", ipAddress: ip });
    return NextResponse.json({ error: "Kata sandi saat ini salah." }, { status: 401 });
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return NextResponse.json({ error: "Kata sandi baru harus berbeda dari yang lama." }, { status: 400 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.user.update(session.sub, { passwordHash: newHash });

  // Keep THIS device signed in; kill every other session for this user.
  const store = await cookies();
  const currentRefresh = store.get(REFRESH_COOKIE)?.value;
  const currentHash = currentRefresh ? hashToken(currentRefresh) : null;
  await db.session.revokeOtherSessions(session.sub, currentHash);

  await logAudit({ userId: session.sub, action: "auth.password_changed", ipAddress: ip });

  return NextResponse.json({ ok: true });
}
