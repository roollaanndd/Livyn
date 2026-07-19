import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const schema = z.object({
  positionSec: z.number().int().min(0),
  durationSec: z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const completed = !!parsed.data.durationSec && parsed.data.positionSec >= parsed.data.durationSec - 5;

  await prisma.watchProgress.upsert({
    where: { userId_sermonId: { userId: session.sub, sermonId: id } },
    update: { positionSec: parsed.data.positionSec, completed },
    create: { userId: session.sub, sermonId: id, positionSec: parsed.data.positionSec, completed },
  });

  if (completed) {
    await prisma.sermon.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
