import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { circleUpdateSchema } from "@/lib/validation/community";
import { getMyCircleRole } from "@/lib/queries/community";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const role = await getMyCircleRole(id, session.sub);
  if (role !== "leader") return NextResponse.json({ error: "Hanya pemimpin circle" }, { status: 403 });

  const parsed = circleUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.description !== undefined) update.description = parsed.data.description || null;
  if (parsed.data.emoji !== undefined) update.emoji = parsed.data.emoji;

  const circle = await prisma.circle.update({ where: { id }, data: update });
  return NextResponse.json({ circle });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const circle = await prisma.circle.findUnique({ where: { id }, select: { ownerId: true } });
  if (!circle) return NextResponse.json({ error: "Circle tidak ditemukan" }, { status: 404 });
  if (circle.ownerId !== session.sub)
    return NextResponse.json({ error: "Hanya pemilik circle bisa hapus" }, { status: 403 });

  await prisma.circle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
