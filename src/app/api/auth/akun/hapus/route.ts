import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookies } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * In-app account deletion.
 *
 * Play Store (User Data policy, in force since 2023) and App Store guideline
 * 5.1.1(v) both require any app that lets you create an account to also let
 * you delete it from the app itself. This endpoint is the compliance surface.
 *
 * Confirmation gate: the caller must re-enter their password (or, for OAuth
 * accounts, type the phrase HAPUS). That way a lost/borrowed phone with a
 * live session can't nuke the account with one accidental tap.
 *
 * Deletion is hard, not soft: User rows cascade-delete every related model
 * through the schema's `onDelete: Cascade` relations (prayer reminders,
 * journal entries, favorites, circles owned, sessions, push subscriptions,
 * etc.). One row-level audit entry is written just before the delete so the
 * event is traceable even after the User is gone.
 */

const schema = z.object({
  // Present for email accounts; used for password reverification.
  password: z.string().min(1).optional(),
  // For OAuth accounts (google/apple), the user types the literal phrase
  // instead — same idea, different mechanism.
  confirmPhrase: z.string().optional(),
});

const REQUIRED_PHRASE = "HAPUS";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  const ip = clientIp(req.headers);
  const limited = rateLimit(`delete-account:${session.sub}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) {
    // Nothing to delete — still clear cookies and treat as success.
    await clearSessionCookies();
    return NextResponse.json({ ok: true });
  }

  // Reverify identity.
  if (user.passwordHash) {
    if (!parsed.data.password) {
      return NextResponse.json({ error: "Masukkan kata sandimu untuk konfirmasi" }, { status: 400 });
    }
    const ok = await verifyPassword(user.passwordHash, parsed.data.password);
    if (!ok) {
      return NextResponse.json({ error: "Kata sandi salah" }, { status: 401 });
    }
  } else {
    // OAuth-only account.
    if (parsed.data.confirmPhrase !== REQUIRED_PHRASE) {
      return NextResponse.json(
        { error: `Ketik ${REQUIRED_PHRASE} untuk konfirmasi` },
        { status: 400 },
      );
    }
  }

  // Audit BEFORE the delete — this row survives the cascade because AuditLog
  // has userId set with no FK enforcement to User (schema-level choice), so
  // even after the User row is gone the moderator dashboard still shows the
  // deletion happened.
  await logAudit({
    userId: session.sub,
    action: "auth.account_deleted",
    ipAddress: ip,
    metadata: { email: user.email, deletedAt: new Date().toISOString() },
  });

  // Cascade takes care of everything the user owns. Wrapped in a try so a
  // partial failure still clears the caller's session cookies — a live
  // cookie pointing to a half-deleted user is worse than a stale error.
  try {
    await prisma.user.delete({ where: { id: session.sub } });
  } catch (err) {
    console.error("[delete-account] cascade failed:", err);
    await clearSessionCookies();
    return NextResponse.json(
      { error: "Sebagian data tidak dapat dihapus. Tim kami akan menyelesaikan pembersihan." },
      { status: 500 },
    );
  }

  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
