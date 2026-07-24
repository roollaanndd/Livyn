import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getMyCircleRole } from "@/lib/queries/community";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; mid: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id: circleId, mid } = await params;
  const role = await getMyCircleRole(circleId, session.sub);
  if (role !== "leader") return NextResponse.json({ error: "Hanya pemimpin" }, { status: 403 });

  const mission = await prisma.weeklyMission.findUnique({ where: { id: mid }, select: { circleId: true } });
  if (!mission || mission.circleId !== circleId)
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  await prisma.weeklyMission.delete({ where: { id: mid } });
  return NextResponse.json({ ok: true });
}
