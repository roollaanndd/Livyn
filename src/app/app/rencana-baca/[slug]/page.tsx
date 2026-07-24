import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getReadingPlanBySlug, getEnrollment } from "@/lib/queries/reading-plan";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { PlanDetailView } from "@/components/reading-plan/plan-detail-view";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { slug } = await params;
  const plan = await getReadingPlanBySlug(slug);
  if (!plan) notFound();

  const enrollment = await getEnrollment(session.sub, plan.id);

  const books = await prisma.bibleBook.findMany({ select: { code: true, name: true } });
  const bookNames: Record<string, string> = {};
  for (const b of books) bookNames[b.code] = b.name;

  return (
    <div>
      <TopBar title={plan.title} />
      <PlanDetailView
        plan={plan}
        initialEnrollment={
          enrollment
            ? {
                completedDays: enrollment.completedDays,
                currentStreak: enrollment.currentStreak,
                longestStreak: enrollment.longestStreak,
                pointsEarned: enrollment.pointsEarned,
                completedAt: enrollment.completedAt?.toISOString() ?? null,
              }
            : null
        }
        bookNames={bookNames}
      />
    </div>
  );
}
