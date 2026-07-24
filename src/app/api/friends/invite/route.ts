import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateFriendInviteCode } from "@/lib/community/codes";

// Get or create a still-valid invite code for the current user. Codes are
// reusable within their 7-day window so users can share a stable link.
export async function POST() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const now = new Date();
  const existing = await prisma.friendInviteCode.findFirst({
    where: { userId: session.sub, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (existing && (!existing.expiresAt || existing.expiresAt > now)) {
    return NextResponse.json({ code: existing.code, expiresAt: existing.expiresAt });
  }

  // Retry loop in the rare event of code collision (~1 in 850k).
  let code = generateFriendInviteCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.friendInviteCode.findUnique({ where: { code }, select: { id: true } });
    if (!clash) break;
    code = generateFriendInviteCode();
  }

  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const created = await prisma.friendInviteCode.create({
    data: { code, userId: session.sub, expiresAt },
  });
  return NextResponse.json({ code: created.code, expiresAt });
}
