import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentChallenge } from "@/lib/queries/challenge";
import { getLevelForPoints, getNextTier } from "@/lib/gamification/levels";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const [challenge, user] = await Promise.all([
    getCurrentChallenge(),
    prisma.user.findUnique({ where: { id: session.sub }, select: { points: true } }),
  ]);

  const points = user?.points ?? 0;
  const level = getLevelForPoints(points);
  const nextTier = getNextTier(points);

  if (!challenge) {
    return NextResponse.json({ challenge: null, progress: null, points, level, nextTier });
  }

  const [book, progress] = await Promise.all([
    prisma.bibleBook.findUnique({ where: { code: challenge.bookCode } }),
    prisma.challengeProgress.findUnique({ where: { userId_challengeId: { userId: session.sub, challengeId: challenge.id } } }),
  ]);

  return NextResponse.json({
    challenge: { ...challenge, book },
    progress,
    points,
    level,
    nextTier,
  });
}
