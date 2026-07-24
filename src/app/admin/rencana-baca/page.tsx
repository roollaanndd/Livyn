import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { ReadingPlanManager } from "@/components/admin/reading-plan-manager";

export default async function AdminReadingPlansPage() {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) redirect("/app");

  const [plans, books] = await Promise.all([
    prisma.readingPlan.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { enrollments: true } } },
    }),
    prisma.bibleBook.findMany({ orderBy: { orderIndex: "asc" }, select: { code: true, name: true, chapterCount: true } }),
  ]);

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold">Rencana Bacaan</h1>
      <ReadingPlanManager
        initialPlans={plans.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          coverEmoji: p.coverEmoji,
          totalDays: p.totalDays,
          category: p.category,
          difficulty: p.difficulty,
          active: p.active,
          enrollmentCount: p._count.enrollments,
        }))}
        books={books}
      />
    </div>
  );
}
