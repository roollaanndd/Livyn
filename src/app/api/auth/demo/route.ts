import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueRefreshToken } from "@/lib/auth/tokens";
import { setSessionCookies } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// Lets visitors explore the app instantly without registering. Signs them
// into a fixed, low-privilege seeded account ("warga@livyn.app") — no
// password check, since the whole point is a frictionless "try it" entry
// point. Rate limited per IP since it's an unauthenticated shortcut.
const DEMO_EMAIL = "warga@livyn.app";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`demo-login:${ip}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "Akun demo tidak tersedia saat ini." }, { status: 503 });
  }

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
  const { token: refreshToken } = await issueRefreshToken(user.id);
  await setSessionCookies(accessToken, refreshToken);

  await prisma.loginEvent.create({
    data: { userId: user.id, ipAddress: ip, userAgent: req.headers.get("user-agent") ?? undefined, success: true, reason: "demo" },
  });
  await logAudit({ userId: user.id, action: "auth.demo_login", ipAddress: ip });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
