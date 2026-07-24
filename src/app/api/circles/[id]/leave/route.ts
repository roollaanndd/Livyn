import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const circle = await prisma.circle.findUnique({ where: { id }, select: { ownerId: true } });
  if (!circle) return NextResponse.json({ error: "Circle tidak ditemukan" }, { status: 404 });

  if (circle.ownerId === session.sub) {
    return NextResponse.json({ error: "Pemilik tidak bisa keluar — hapus circle sebagai gantinya" }, { status: 400 });
  }

  const membership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId: id, userId: session.sub } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ ok: true });

  await prisma.circleMember.delete({ where: { id: membership.id } });
  return NextResponse.json({ ok: true });
}
