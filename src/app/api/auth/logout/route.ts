import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_COOKIE, clearSessionCookies, getCurrentUser } from "@/lib/auth/session";
import { revokeRefreshToken } from "@/lib/auth/tokens";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  const user = await getCurrentUser();

  if (refreshToken) await revokeRefreshToken(refreshToken);
  await clearSessionCookies();

  if (user) await logAudit({ userId: user.sub, action: "auth.logout", ipAddress: clientIp(req.headers) });

  return NextResponse.json({ ok: true });
}
