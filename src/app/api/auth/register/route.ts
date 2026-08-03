import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-rest";
import { registerSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueRefreshToken } from "@/lib/auth/tokens";
import { setSessionCookies } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = await rateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await db.user.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      id: randomBytes(12).toString("hex"),
      name,
      email,
      passwordHash,
    });

    const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
    const { token: refreshToken } = await issueRefreshToken(user.id);
    await setSessionCookies(accessToken, refreshToken);

    db.loginEvent.create({ userId: user.id, ipAddress: ip, userAgent: req.headers.get("user-agent") ?? undefined, success: true }).catch(() => {});

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "Layanan sedang tidak tersedia. Coba lagi nanti." }, { status: 503 });
  }
}
