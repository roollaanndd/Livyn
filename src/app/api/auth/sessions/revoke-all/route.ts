import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/supabase-rest";
import { getCurrentUser, REFRESH_COOKIE } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const store = await cookies();
  const currentToken = store.get(REFRESH_COOKIE)?.value;
  const currentHash = currentToken ? hashToken(currentToken) : null;

  await db.session.revokeOtherSessions(session.sub, currentHash);

  await logAudit({ userId: session.sub, action: "auth.revoke_other_sessions", ipAddress: clientIp(req.headers) });

  return NextResponse.json({ ok: true });
}
