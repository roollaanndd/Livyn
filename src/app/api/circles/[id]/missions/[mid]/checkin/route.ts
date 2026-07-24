import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { missionCheckInSchema } from "@/lib/validation/community";
import { getMyCircleRole } from "@/lib/queries/community";

// Idempotent check-in — first call creates, subsequent calls are no-ops.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; mid: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id: circleId, mid } = await params;
  const role = await getMyCircleRole(circleId, session.sub);
  if (!role) return NextResponse.json({ error: "Bukan anggota" }, { status: 403 });

  const mission = await prisma.weeklyMission.findUnique({
    where: { id: mid },
    select: { circleId: true, endDate: true },
  });
  if (!mission || mission.circleId !== circleId)
    return NextResponse.json({ error: "Misi tidak ditemukan" }, { status: 404 });
  if (mission.endDate < new Date())
    return NextResponse.json({ error: "Misi sudah selesai" }, { status: 410 });

  const parsed = missionCheckInSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const existing = await prisma.missionCheckIn.findUnique({
    where: { missionId_userId: { missionId: mid, userId: session.sub } },
    select: { id: true },
  });

  if (existing) {
    // Allow updating the note on re-check-in.
    if (parsed.data.note !== undefined) {
      await prisma.missionCheckIn.update({
        where: { id: existing.id },
        data: { note: parsed.data.note || null },
      });
    }
    return NextResponse.json({ checkedIn: true, wasNew: false });
  }

  await prisma.missionCheckIn.create({
    data: { missionId: mid, userId: session.sub, note: parsed.data.note || null },
  });
  return NextResponse.json({ checkedIn: true, wasNew: true });
}
