import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { weeklyMissionSchema } from "@/lib/validation/community";
import { getMyCircleRole, listActiveMissionsForCircle } from "@/lib/queries/community";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const role = await getMyCircleRole(id, session.sub);
  if (!role) return NextResponse.json({ error: "Bukan anggota" }, { status: 403 });

  const missions = await listActiveMissionsForCircle(id);
  return NextResponse.json({ missions });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const role = await getMyCircleRole(id, session.sub);
  if (role !== "leader") return NextResponse.json({ error: "Hanya pemimpin circle" }, { status: 403 });

  const parsed = weeklyMissionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + parsed.data.durationDays * 24 * 60 * 60 * 1000);

  const mission = await prisma.weeklyMission.create({
    data: {
      circleId: id,
      createdById: session.sub,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      startDate,
      endDate,
    },
  });

  return NextResponse.json({ mission });
}
