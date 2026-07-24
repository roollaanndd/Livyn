import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { leaderApplicationSchema } from "@/lib/validation/community";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const parsed = leaderApplicationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const existing = await prisma.leaderProfile.findUnique({ where: { userId: session.sub } });
  if (existing?.verified) return NextResponse.json({ error: "Kamu sudah terverifikasi" }, { status: 409 });

  const data = {
    churchName: parsed.data.churchName,
    position: parsed.data.position,
    denomination: parsed.data.denomination || null,
    city: parsed.data.city || null,
    phone: parsed.data.phone || null,
    bio: parsed.data.bio || null,
    verified: false,
    verifiedAt: null,
    verifiedById: null,
    rejectReason: null,
    submittedAt: new Date(),
  };

  const profile = existing
    ? await prisma.leaderProfile.update({ where: { userId: session.sub }, data })
    : await prisma.leaderProfile.create({ data: { userId: session.sub, ...data } });

  await logAudit({ userId: session.sub, action: "leader.application_submitted", targetType: "LeaderProfile", targetId: profile.id });
  return NextResponse.json({ profile });
}
