import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentChallenge } from "@/lib/queries/challenge";
import { markChapterRead } from "@/lib/gamification/challenge-progress";
import { markChapterReadSchema } from "@/lib/validation/challenge";
import { getLevelForPoints } from "@/lib/gamification/levels";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const limited = await rateLimit(`challenge-read:${session.sub}`, 60, 60 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });

  const parsed = markChapterReadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const challenge = await getCurrentChallenge();
  if (!challenge) return NextResponse.json({ error: "Tidak ada tantangan aktif bulan ini" }, { status: 404 });

  const { chapter } = parsed.data;
  if (chapter < challenge.chapterFrom || chapter > challenge.chapterTo) {
    return NextResponse.json({ error: "Pasal di luar cakupan tantangan" }, { status: 400 });
  }

  const { progress, pointsAwarded, alreadyRead } = await markChapterRead(session.sub, challenge.id, chapter);

  const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { points: true } });
  const level = getLevelForPoints(user?.points ?? 0);

  if (!alreadyRead) {
    await logAudit({
      userId: session.sub,
      action: "challenge.chapter_read",
      targetType: "ReadingChallenge",
      targetId: challenge.id,
      metadata: { chapter, pointsAwarded },
    });
  }

  return NextResponse.json({ progress, pointsAwarded, alreadyRead, points: user?.points ?? 0, level });
}
