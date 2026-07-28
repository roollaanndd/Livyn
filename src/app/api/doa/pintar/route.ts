import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { formatHour, peakHour } from "@/lib/habit";

const bodySchema = z.discriminatedUnion("action", [
  // Move every active reminder to the member's habit hour, once.
  z.object({ action: z.literal("move") }),
  // Hand the timing over to the cron from now on.
  z.object({ action: z.literal("auto"), enabled: z.boolean() }),
]);

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const user = await prisma.user
    .findUnique({ where: { id: session.sub }, select: { habitHours: true } })
    .catch(() => null);
  if (!user) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  if (parsed.data.action === "auto") {
    await prisma.prayerReminder.updateMany({
      where: { userId: session.sub },
      data: { autoAdjust: parsed.data.enabled },
    });
    return NextResponse.json({ ok: true, autoAdjust: parsed.data.enabled });
  }

  const peak = peakHour(user.habitHours);
  if (!peak) return NextResponse.json({ error: "Belum cukup data" }, { status: 409 });

  const time = formatHour(peak.hour);
  await prisma.prayerReminder.updateMany({
    where: { userId: session.sub, active: true },
    data: { time },
  });

  return NextResponse.json({ ok: true, time });
}
