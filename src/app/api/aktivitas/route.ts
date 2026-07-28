import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jakartaDay } from "@/lib/queries/rhythm";

// Only the kinds with no record of their own — prayer and journal are counted
// from PrayerLog and JournalEntry, so accepting them here would double-count.
const bodySchema = z.object({ kind: z.enum(["verse", "devotion"]) });

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const day = jakartaDay();
  const { kind } = parsed.data;

  try {
    const existing = await prisma.dailyActivity.findFirst({
      where: { userId: session.sub, day, kind },
      select: { id: true },
    });
    if (!existing) {
      await prisma.dailyActivity.create({ data: { userId: session.sub, day, kind } });
    }
  } catch {
    // Progress rings are a nicety; a failure here must not surface to the user.
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
