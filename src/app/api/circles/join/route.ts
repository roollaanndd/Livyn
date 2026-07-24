import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({ code: z.string().trim().min(4).max(20) });

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Kode tidak valid" }, { status: 400 });
  const joinCode = parsed.data.code.toUpperCase();

  const circle = await prisma.circle.findUnique({
    where: { joinCode },
    include: { _count: { select: { members: true } } },
  });
  if (!circle) return NextResponse.json({ error: "Circle tidak ditemukan" }, { status: 404 });

  const already = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId: circle.id, userId: session.sub } },
    select: { id: true },
  });
  if (already) return NextResponse.json({ circle, alreadyMember: true });

  if (circle._count.members >= circle.memberLimit) {
    return NextResponse.json({ error: "Circle sudah penuh" }, { status: 403 });
  }

  await prisma.circleMember.create({
    data: { circleId: circle.id, userId: session.sub, role: "member" },
  });

  return NextResponse.json({ circle });
}
