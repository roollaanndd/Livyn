import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { circleCreateSchema } from "@/lib/validation/community";
import { generateCircleJoinCode } from "@/lib/community/codes";
import { circleTypeFor, memberLimitFor, maxCirclesFor } from "@/lib/community/permissions";
import { listMyCircles } from "@/lib/queries/community";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const circles = await listMyCircles(session.sub);
  return NextResponse.json({ circles });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const parsed = circleCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const ownedCount = await prisma.circle.count({ where: { ownerId: session.sub } });
  const max = maxCirclesFor(session.role);
  if (ownedCount >= max) {
    return NextResponse.json({ error: `Batas maksimal ${max} circle tercapai` }, { status: 403 });
  }

  const type = circleTypeFor(session.role);
  const memberLimit = memberLimitFor(type);

  // Generate unique join code (retry on collision).
  let joinCode = generateCircleJoinCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.circle.findUnique({ where: { joinCode }, select: { id: true } });
    if (!clash) break;
    joinCode = generateCircleJoinCode();
  }

  const circle = await prisma.circle.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      emoji: parsed.data.emoji,
      ownerId: session.sub,
      type,
      memberLimit,
      joinCode,
    },
  });

  // Owner joins their own circle as leader automatically.
  await prisma.circleMember.create({
    data: { circleId: circle.id, userId: session.sub, role: "leader" },
  });

  return NextResponse.json({ circle });
}
