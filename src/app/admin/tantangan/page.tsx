import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { ChallengeManager } from "@/components/admin/challenge-manager";

export default async function AdminChallengesPage() {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) redirect("/app");

  const [challenges, books] = await Promise.all([
    prisma.readingChallenge.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { _count: { select: { progress: true } } },
    }),
    prisma.bibleBook.findMany({ orderBy: { orderIndex: "asc" }, select: { code: true, name: true, chapterCount: true } }),
  ]);

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold">Tantangan Bulanan</h1>
      <ChallengeManager
        initialChallenges={challenges.map((c) => ({
          id: c.id,
          title: c.title,
          month: c.month,
          year: c.year,
          bookCode: c.bookCode,
          chapterFrom: c.chapterFrom,
          chapterTo: c.chapterTo,
          description: c.description,
          active: c.active,
          participantCount: c._count.progress,
        }))}
        books={books}
      />
    </div>
  );
}
