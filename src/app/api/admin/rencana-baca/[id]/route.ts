import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { readingPlanUpdateSchema } from "@/lib/validation/reading-plan";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.readingPlan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Rencana tidak ditemukan" }, { status: 404 });

  const parsed = readingPlanUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.coverEmoji !== undefined) updateData.coverEmoji = data.coverEmoji;
  if (data.totalDays !== undefined) updateData.totalDays = data.totalDays;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
  if (data.schedule !== undefined) updateData.schedule = JSON.stringify(data.schedule);
  if (data.active !== undefined) updateData.active = data.active;

  const plan = await prisma.readingPlan.update({ where: { id }, data: updateData });

  await logAudit({ userId: session.sub, action: "admin.reading_plan_updated", targetType: "ReadingPlan", targetId: id });

  return NextResponse.json({ plan });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.readingPlan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Rencana tidak ditemukan" }, { status: 404 });

  await prisma.readingPlan.delete({ where: { id } });
  await logAudit({ userId: session.sub, action: "admin.reading_plan_deleted", targetType: "ReadingPlan", targetId: id });

  return NextResponse.json({ ok: true });
}
