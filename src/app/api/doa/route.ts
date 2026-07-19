import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { prayerReminderSchema } from "@/lib/validation/prayer";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const reminders = await prisma.prayerReminder.findMany({
    where: { userId: session.sub },
    orderBy: { time: "asc" },
  });
  return NextResponse.json({ reminders });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const parsed = prayerReminderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const reminder = await prisma.prayerReminder.create({ data: { ...parsed.data, userId: session.sub } });
  return NextResponse.json({ reminder });
}
