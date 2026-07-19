import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const schema = z.object({ reminderId: z.string().optional(), note: z.string().max(500).optional() });

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const log = await prisma.prayerLog.create({
    data: { userId: session.sub, reminderId: parsed.data.reminderId, note: parsed.data.note },
  });
  return NextResponse.json({ log });
}

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const logsToday = await prisma.prayerLog.findMany({
    where: { userId: session.sub, prayedAt: { gte: startOfDay } },
  });
  return NextResponse.json({ logsToday });
}
