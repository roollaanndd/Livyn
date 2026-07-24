import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const ping = await prisma.versePing.findUnique({ where: { id }, select: { toUserId: true, readAt: true } });
  if (!ping || ping.toUserId !== session.sub)
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  if (!ping.readAt) {
    await prisma.versePing.update({ where: { id }, data: { readAt: new Date() } });
  }

  return NextResponse.json({ ok: true });
}
