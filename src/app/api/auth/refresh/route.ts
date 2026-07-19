import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { REFRESH_COOKIE, setSessionCookies, clearSessionCookies } from "@/lib/auth/session";
import { rotateRefreshToken } from "@/lib/auth/tokens";
import { signAccessToken } from "@/lib/auth/jwt";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const store = await cookies();
  const presented = store.get(REFRESH_COOKIE)?.value;
  if (!presented) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });

  const result = await rotateRefreshToken(presented);

  if ("error" in result) {
    await clearSessionCookies();
    if (result.error === "reuse_detected") {
      await logAudit({ action: "auth.refresh_reuse_detected", ipAddress: clientIp(req.headers) });
    }
    return NextResponse.json({ error: "Sesi tidak valid, silakan login kembali" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: result.userId } });
  if (!user) {
    await clearSessionCookies();
    return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 401 });
  }

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
  await setSessionCookies(accessToken, result.token);

  return NextResponse.json({ ok: true });
}
