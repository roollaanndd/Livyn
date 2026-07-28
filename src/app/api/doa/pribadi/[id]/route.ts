import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { personalPrayerPatchSchema } from "@/lib/validation/personal-prayer";

async function ownedPrayer(id: string, userId: string) {
  const prayer = await prisma.personalPrayer
    .findUnique({ where: { id }, select: { id: true, userId: true, status: true } })
    .catch(() => null);
  if (!prayer || prayer.userId !== userId) return null;
  return prayer as { id: string; userId: string; status: string };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const owned = await ownedPrayer(id, session.sub);
  if (!owned) return NextResponse.json({ error: "Doa tidak ditemukan" }, { status: 404 });

  const parsed = personalPrayerPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  // answeredAt is derived from status, never sent by the client: marking a
  // prayer answered stamps the moment, reopening it clears the stamp.
  if (parsed.data.status === "answered" && owned.status !== "answered") {
    data.answeredAt = new Date();
  } else if (parsed.data.status === "open") {
    data.answeredAt = null;
    data.answeredNote = null;
  }

  const prayer = await prisma.personalPrayer.update({ where: { id }, data });
  return NextResponse.json({ prayer });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  if (!(await ownedPrayer(id, session.sub))) {
    return NextResponse.json({ error: "Doa tidak ditemukan" }, { status: 404 });
  }

  await prisma.personalPrayer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
