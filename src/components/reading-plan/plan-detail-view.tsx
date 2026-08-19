"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  LivynFlame,
  LivynCheckCircle,
  LivynRing,
  LivynBible,
  LivynSpark,
  LivynTrophy,
} from "@/components/icons/livyn-icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ScheduleDay = {
  day: number;
  bookCode: string;
  chapter: number;
  title?: string;
};

type Plan = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverEmoji: string;
  totalDays: number;
  schedule: string;
};

type Enrollment = {
  completedDays: string;
  currentStreak: number;
  longestStreak: number;
  pointsEarned: number;
  completedAt: string | null;
} | null;

export function PlanDetailView({
  plan,
  initialEnrollment,
  bookNames,
}: {
  plan: Plan;
  initialEnrollment: Enrollment;
  bookNames: Record<string, string>;
}) {
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [loading, setLoading] = useState<number | "enroll" | null>(null);

  const schedule: ScheduleDay[] = useMemo(() => {
    try {
      return JSON.parse(plan.schedule);
    } catch {
      return [];
    }
  }, [plan.schedule]);

  const completedSet = useMemo(
    () =>
      new Set(
        enrollment?.completedDays?.split(",").filter(Boolean).map(Number) ?? [],
      ),
    [enrollment?.completedDays],
  );

  const percent = Math.round((completedSet.size / plan.totalDays) * 100);
  const isComplete = !!enrollment?.completedAt;
  const isEnrolled = !!enrollment;

  const nextDay = useMemo(() => {
    for (const item of schedule) {
      if (!completedSet.has(item.day)) return item.day;
    }
    return null;
  }, [schedule, completedSet]);

  async function enroll() {
    setLoading("enroll");
    try {
      const res = await fetch("/api/rencana-baca/mulai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Gagal memulai rencana");
        return;
      }
      setEnrollment({
        completedDays: "",
        currentStreak: 0,
        longestStreak: 0,
        pointsEarned: 0,
        completedAt: null,
      });
      toast.success("Rencana bacaan dimulai!");
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(null);
    }
  }

  async function markDay(day: number) {
    setLoading(day);
    try {
      const res = await fetch("/api/rencana-baca/selesai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, day }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menandai");
        return;
      }
      setEnrollment({
        completedDays: data.enrollment.completedDays,
        currentStreak: data.enrollment.currentStreak,
        longestStreak: data.enrollment.longestStreak,
        pointsEarned: data.enrollment.pointsEarned,
        completedAt: data.enrollment.completedAt,
      });
      if (data.alreadyDone) {
        toast.info("Hari ini sudah kamu selesaikan");
      } else if (data.isComplete) {
        toast.success(`Selamat! Rencana selesai! +${data.pointsAwarded} poin`);
      } else {
        toast.success(`+${data.pointsAwarded} poin! Hari ${day} selesai.`);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5 px-5 pb-8 pt-4">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-4xl">
          {plan.coverEmoji}
        </div>
        <h1 className="font-display text-lg font-bold">{plan.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {/* Progress or Enroll */}
      {isEnrolled ? (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedSet.size}/{plan.totalDays} hari selesai
            </span>
            <span className="font-semibold text-primary">{percent}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <LivynFlame className="h-4 w-4" />
              {enrollment?.currentStreak ?? 0} hari
            </span>
            <span className="text-xs text-muted-foreground">
              Rekor: {enrollment?.longestStreak ?? 0}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {enrollment?.pointsEarned ?? 0} poin
            </span>
          </div>
        </Card>
      ) : (
        <Button
          onClick={enroll}
          disabled={loading === "enroll"}
          size="lg"
          className="w-full"
        >
          <LivynSpark className="h-4 w-4" />
          Mulai Rencana Bacaan
        </Button>
      )}

      {isComplete && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl bg-emerald-500/10 p-4 text-center"
        >
          <LivynTrophy className="mx-auto h-8 w-8 text-emerald-500" />
          <p className="mt-2 text-sm font-bold text-emerald-600">
            Rencana Bacaan Selesai!
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Terus bertumbuh dalam Firman Tuhan
          </p>
        </motion.div>
      )}

      {/* Schedule */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Jadwal Bacaan
        </h2>
        <div className="space-y-2">
          <AnimatePresence>
            {schedule.map((item) => {
              const done = completedSet.has(item.day);
              const isNext = item.day === nextDay && isEnrolled && !isComplete;
              const bookName = bookNames[item.bookCode] ?? item.bookCode;

              return (
                <motion.div
                  key={item.day}
                  layout
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    done
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                      : isNext
                        ? "border-primary/30 bg-primary-soft"
                        : "border-border-subtle",
                  )}
                >
                  <button
                    onClick={() => isEnrolled && !done && markDay(item.day)}
                    disabled={!isEnrolled || loading === item.day}
                    className="shrink-0"
                  >
                    {done ? (
                      <LivynCheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <LivynRing
                        className={cn(
                          "h-5 w-5",
                          isNext
                            ? "text-primary"
                            : "text-muted-foreground/40",
                        )}
                      />
                    )}
                  </button>

                  <Link
                    href={`/app/alkitab/${item.bookCode}/${item.chapter}`}
                    className="flex-1 min-w-0"
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        done && "line-through text-muted-foreground",
                      )}
                    >
                      <span className="text-muted-foreground">
                        Hari {item.day}:
                      </span>{" "}
                      {item.title ?? `${bookName} ${item.chapter}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bookName} {item.chapter}
                    </p>
                  </Link>

                  {isNext && !done && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => markDay(item.day)}
                      disabled={loading === item.day}
                      className="shrink-0 text-xs"
                    >
                      <LivynBible className="h-3.5 w-3.5" />
                      Baca
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
