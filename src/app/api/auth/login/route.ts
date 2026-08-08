import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-rest";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueRefreshToken } from "@/lib/auth/tokens";
import { setSessionCookies } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isLocale } from "@/lib/i18n/config";
import { setLocaleCookie } from "@/lib/i18n/server";

// A pre-computed Argon2id hash we verify against when the requested email
// doesn't exist. The point isn't the hash itself — it's making the missing-
// user branch spend the same ~50-100ms as the wrong-password branch, so an
// attacker can't tell "no such account" from "wrong password" by clock alone
// and enumerate valid emails. Regenerate with argon2 CLI if the algo params
// in src/lib/auth/password.ts ever change.
const DUMMY_ARGON2_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c3RhdGljZHVtbXlzYWx0MTIzNA$Y0lJdcYP+cwn2Z1sScoIsvGCpb7q3+eLxrnkbufkvR8";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const ipLimit = await rateLimit(`login-ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const emailLimit = await rateLimit(`login-email:${email}`, 8, 10 * 60 * 1000);
  if (!emailLimit.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  try {
    const user = await db.user.findByEmail(email);
    const genericError = () => NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });

    // Always run the Argon2 verify, even when the user doesn't exist, so
    // both branches spend the same time and email existence can't be
    // inferred by response-time delta. The dummy hash is designed never to
    // match any real password.
    const passwordHashToCheck = user?.passwordHash ?? DUMMY_ARGON2_HASH;
    const valid = await verifyPassword(passwordHashToCheck, password);

    if (!user || !user.passwordHash) {
      db.loginEvent.create({
        userId: user?.id ?? "unknown", ipAddress: ip, userAgent, success: false, reason: "no_such_user",
      }).catch(() => {});
      return genericError();
    }

    if (!valid) {
      db.loginEvent.create({
        userId: user.id, ipAddress: ip, userAgent, success: false, reason: "bad_password",
      }).catch(() => {});
      return genericError();
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: "Akun ini tidak aktif. Hubungi admin." }, { status: 403 });
    }

    const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
    const { token: refreshToken } = await issueRefreshToken(user.id);
    await setSessionCookies(accessToken, refreshToken);
    // Carry the member's saved language onto this device.
    if (isLocale(user.language)) await setLocaleCookie(user.language);

    db.loginEvent.create({ userId: user.id, ipAddress: ip, userAgent, success: true }).catch(() => {});

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
}
