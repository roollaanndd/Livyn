import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { markDayComplete } from "@/lib/gamification/reading-plan-progress";
import { getLevelForPoints } from "@/lib/gamification/levels";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const limited = await rateLimit(`plan-read:${session.sub}`, 60, 60 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const planId = body?.planId;
  const day = body?.day;
  if (typeof planId !== "string" || typeof day !== "number") {
    return NextResponse.json({ error: "planId dan day diperlukan" }, { status: 400 });
  }

  try {
    const { enrollment, pointsAwarded, alreadyDone, isComplete } = await markDayComplete(
      session.sub,
      planId,
      day,
    );

    const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { points: true } });
    const level = getLevelForPoints(user?.points ?? 0);

    return NextResponse.json({
      enrollment,
      pointsAwarded,
      alreadyDone,
      isComplete,
      points: user?.points ?? 0,
      level,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
