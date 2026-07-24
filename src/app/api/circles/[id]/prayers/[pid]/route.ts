import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { prayerAnswerSchema } from "@/lib/validation/community";
import { getMyCircleRole } from "@/lib/queries/community";

// Mark as answered — only the requester or circle leader can do this.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id: circleId, pid } = await params;
  const prayer = await prisma.prayerRequest.findUnique({
    where: { id: pid },
    select: { userId: true, circleId: true },
  });
  if (!prayer || prayer.circleId !== circleId)
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const myRole = await getMyCircleRole(circleId, session.sub);
  const canAct = prayer.userId === session.sub || myRole === "leader";
  if (!canAct) return NextResponse.json({ error: "Hanya pemohon atau pemimpin" }, { status: 403 });

  const parsed = prayerAnswerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const updated = await prisma.prayerRequest.update({
    where: { id: pid },
    data: {
      status: "answered",
      answeredAt: new Date(),
      answeredNote: parsed.data.answeredNote || null,
    },
  });
  return NextResponse.json({ prayer: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id: circleId, pid } = await params;
  const prayer = await prisma.prayerRequest.findUnique({
    where: { id: pid },
    select: { userId: true, circleId: true },
  });
  if (!prayer || prayer.circleId !== circleId)
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const myRole = await getMyCircleRole(circleId, session.sub);
  const canAct = prayer.userId === session.sub || myRole === "leader";
  if (!canAct) return NextResponse.json({ error: "Hanya pemohon atau pemimpin" }, { status: 403 });

  await prisma.prayerRequest.delete({ where: { id: pid } });
  return NextResponse.json({ ok: true });
}
