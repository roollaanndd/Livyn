"use client";

import Link from "next/link";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

type Plan = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverEmoji: string;
  totalDays: number;
  difficulty: string;
};

type Enrollment = {
  completedDays: string;
  completedAt: string | null;
} | null;

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjutan",
};

export function PlanCard({ plan, enrollment }: { plan: Plan; enrollment: Enrollment }) {
  const completed = enrollment?.completedDays?.split(",").filter(Boolean).length ?? 0;
  const percent = Math.round((completed / plan.totalDays) * 100);
  const isComplete = !!enrollment?.completedAt;
  const isEnrolled = !!enrollment;

  return (
    <Link href={`/app/rencana-baca/${plan.slug}`}>
      <Card className="group relative overflow-hidden border-border-subtle p-4 transition-all hover:shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-2xl">
            {plan.coverEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold text-foreground line-clamp-1">
              {plan.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {plan.description}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {plan.totalDays} hari
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {DIFFICULTY_LABEL[plan.difficulty] ?? plan.difficulty}
              </span>
            </div>
          </div>
          {isComplete && (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          )}
        </div>

        {isEnrolled && !isComplete && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completed}/{plan.totalDays} hari</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
