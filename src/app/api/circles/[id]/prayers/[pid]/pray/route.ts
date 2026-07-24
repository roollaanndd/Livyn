import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getMyCircleRole } from "@/lib/queries/community";

// Toggle: if I already prayed, remove; otherwise add.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id: circleId, pid } = await params;
  const role = await getMyCircleRole(circleId, session.sub);
  if (!role) return NextResponse.json({ error: "Bukan anggota circle" }, { status: 403 });

  const request = await prisma.prayerRequest.findUnique({
    where: { id: pid },
    select: { circleId: true },
  });
  if (!request || request.circleId !== circleId)
    return NextResponse.json({ error: "Permintaan doa tidak ditemukan" }, { status: 404 });

  const existing = await prisma.prayerIntercession.findUnique({
    where: { prayerRequestId_userId: { prayerRequestId: pid, userId: session.sub } },
    select: { id: true },
  });

  if (existing) {
    await prisma.prayerIntercession.delete({ where: { id: existing.id } });
    return NextResponse.json({ prayed: false });
  }

  await prisma.prayerIntercession.create({
    data: { prayerRequestId: pid, userId: session.sub },
  });
  return NextResponse.json({ prayed: true });
}
