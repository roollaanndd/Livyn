import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getCurrentChallenge, getChallengeProgress } from "@/lib/queries/challenge";
import { getLevelForPoints, getNextTier, LEVEL_TIERS } from "@/lib/gamification/levels";
import { TopBar } from "@/components/nav/top-bar";
import { ChallengeView } from "@/components/challenge/challenge-view";

export default async function ChallengePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const [user, challenge] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub }, select: { points: true } }),
    getCurrentChallenge(),
  ]);

  const points = user?.points ?? 0;
  const level = getLevelForPoints(points);
  const nextTier = getNextTier(points);

  if (!challenge) {
    return (
      <div>
        <TopBar title="Tantangan Bulanan" />
        <div className="px-5 py-16 text-center">
          <p className="text-sm text-muted-foreground">Belum ada tantangan aktif bulan ini. Nantikan tantangan berikutnya!</p>
        </div>
      </div>
    );
  }

  const [book, progress] = await Promise.all([
    prisma.bibleBook.findUnique({ where: { code: challenge.bookCode } }),
    getChallengeProgress(session.sub, challenge.id),
  ]);

  return (
    <div>
      <TopBar title="Tantangan Bulanan" />
      <ChallengeView
        challenge={{ ...challenge, bookName: book?.name ?? challenge.bookCode }}
        initialProgress={
          progress
            ? { chaptersRead: progress.chaptersRead, currentStreak: progress.currentStreak, longestStreak: progress.longestStreak, pointsEarned: progress.pointsEarned }
            : { chaptersRead: "", currentStreak: 0, longestStreak: 0, pointsEarned: 0 }
        }
        points={points}
        level={level}
        nextTier={nextTier}
        allTiers={LEVEL_TIERS}
      />
    </div>
  );
}
