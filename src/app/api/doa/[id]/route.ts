import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { prayerReminderSchema } from "@/lib/validation/prayer";

const patchSchema = prayerReminderSchema.partial().extend({ active: z.boolean().optional() });

async function assertOwnership(userId: string, id: string) {
  const reminder = await prisma.prayerReminder.findUnique({ where: { id } });
  return reminder && reminder.userId === userId ? reminder : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(session.sub, id);
  if (!owned) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const reminder = await prisma.prayerReminder.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ reminder });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(session.sub, id);
  if (!owned) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  await prisma.prayerReminder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
