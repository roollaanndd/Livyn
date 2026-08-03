import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-rest";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueRefreshToken } from "@/lib/auth/tokens";
import { setSessionCookies } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const DEMO_EMAIL = "anaktuhan@livyn.app";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = await rateLimit(`demo-login:${ip}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  try {
    const user = await db.user.findByEmail(DEMO_EMAIL);
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Akun demo tidak tersedia saat ini." }, { status: 503 });
    }

    const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
    const { token: refreshToken } = await issueRefreshToken(user.id);
    await setSessionCookies(accessToken, refreshToken);

    db.loginEvent.create({
      userId: user.id, ipAddress: ip, userAgent: req.headers.get("user-agent") ?? undefined, success: true, reason: "demo",
    }).catch(() => {});

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
}
