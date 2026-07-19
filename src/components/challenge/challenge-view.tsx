"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Flame, Trophy, BookOpenCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LevelTier } from "@/lib/gamification/levels";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  bookName: string;
  chapterFrom: number;
  chapterTo: number;
};

type Progress = { chaptersRead: string; currentStreak: number; longestStreak: number; pointsEarned: number };

export function ChallengeView({
  challenge,
  initialProgress,
  points,
  level,
  nextTier,
  allTiers,
}: {
  challenge: Challenge;
  initialProgress: Progress;
  points: number;
  level: LevelTier;
  nextTier: LevelTier | null;
  allTiers: LevelTier[];
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [currentPoints, setCurrentPoints] = useState(points);
  const [currentLevel, setCurrentLevel] = useState(level);
  const [loading, setLoading] = useState(false);

  const readSet = useMemo(() => new Set(progress.chaptersRead.split(",").filter(Boolean).map(Number)), [progress.chaptersRead]);
  const totalChapters = challenge.chapterTo - challenge.chapterFrom + 1;
  const percent = Math.round((readSet.size / totalChapters) * 100);
  const nextChapter = useMemo(() => {
    for (let c = challenge.chapterFrom; c <= challenge.chapterTo; c++) {
      if (!readSet.has(c)) return c;
    }
    return null;
  }, [readSet, challenge.chapterFrom, challenge.chapterTo]);

  async function markRead(chapter: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/tantangan/baca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menandai pasal");
        return;
      }
      setProgress({
        chaptersRead: data.progress.chaptersRead,
        currentStreak: data.progress.currentStreak,
        longestStreak: data.progress.longestStreak,
        pointsEarned: data.progress.pointsEarned,
      });
      setCurrentPoints(data.points);
      setCurrentLevel(data.level);
      if (data.alreadyRead) {
        toast.info("Pasal ini sudah kamu baca sebelumnya");
      } else {
        toast.success(`+${data.pointsAwarded} poin! ${challenge.bookName} ${chapter} selesai dibaca.`);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  const pointsIntoLevel = currentPoints - currentLevel.minPoints;
  const levelSpan = nextTier ? nextTier.minPoints - currentLevel.minPoints : 1;
  const levelPercent = nextTier ? Math.min(100, Math.round((pointsIntoLevel / levelSpan) * 100)) : 100;

  return (
    <div className="space-y-5 px-5 pb-8 pt-4">
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-[#6C5CE7] to-[#4b3fc4] p-5 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Levelmu</p>
              <p className="font-display text-2xl font-bold">{currentLevel.name}</p>
            </div>
            <Trophy className="h-9 w-9 text-amber-300" />
          </div>
          <p className="mt-1 text-sm text-white/75">{currentPoints} poin total</p>
          {nextTier && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${levelPercent}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-white/70">
                {nextTier.minPoints - currentPoints} poin lagi menuju {nextTier.name}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-2 flex items-center gap-2">
          <BookOpenCheck className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-display font-bold">{challenge.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {challenge.bookName} {challenge.chapterFrom}–{challenge.chapterTo}
        </p>
        {challenge.description && <p className="mt-2 text-sm leading-relaxed">{challenge.description}</p>}

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{readSet.size} dari {totalChapters} pasal</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-amber-500">
          <Flame className="h-4 w-4" /> {progress.currentStreak} hari berturut-turut
          <span className="ml-1 font-normal text-muted-foreground">(rekor: {progress.longestStreak})</span>
        </div>

        {nextChapter !== null ? (
          <Button onClick={() => markRead(nextChapter)} disabled={loading} size="lg" className="mt-4 w-full">
            <Sparkles className="h-4 w-4" />
            Tandai {challenge.bookName} {nextChapter} Selesai Dibaca
          </Button>
        ) : (
          <p className="mt-4 rounded-md bg-emerald-500/10 p-3 text-center text-sm font-semibold text-emerald-600">
            🎉 Tantangan bulan ini selesai! Terus jaga kebiasaanmu.
          </p>
        )}
      </Card>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jenjang Pertumbuhan</p>
        <Card className="divide-y divide-border">
          {allTiers.map((tier) => (
            <div key={tier.level} className={cn("flex items-center justify-between p-3.5", tier.level === currentLevel.level && "bg-primary/5")}>
              <div>
                <p className={cn("text-sm font-semibold", tier.level === currentLevel.level && "text-primary")}>{tier.name}</p>
                <p className="text-xs text-muted-foreground">{tier.verseRef}</p>
              </div>
              <span className="text-xs text-muted-foreground">{tier.minPoints}+ poin</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
