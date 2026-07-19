import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueRefreshToken } from "@/lib/auth/tokens";
import { setSessionCookies } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Brute-force protection: limit both per-IP and per-attempted-email.
  const ipLimit = rateLimit(`login-ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const emailLimit = rateLimit(`login-email:${email}`, 8, 10 * 60 * 1000);
  if (!emailLimit.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const genericError = () => NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });

  if (!user || !user.passwordHash) {
    await prisma.loginEvent.create({
      data: { userId: user?.id ?? "unknown", ipAddress: ip, userAgent, success: false, reason: "no_such_user" },
    }).catch(() => {});
    return genericError();
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await prisma.loginEvent.create({
      data: { userId: user.id, ipAddress: ip, userAgent, success: false, reason: "bad_password" },
    });
    return genericError();
  }

  if (user.status !== "active") {
    return NextResponse.json({ error: "Akun ini tidak aktif. Hubungi admin." }, { status: 403 });
  }

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
  const { token: refreshToken } = await issueRefreshToken(user.id);
  await setSessionCookies(accessToken, refreshToken);

  await prisma.loginEvent.create({ data: { userId: user.id, ipAddress: ip, userAgent, success: true } });
  await logAudit({ userId: user.id, action: "auth.login", ipAddress: ip });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
