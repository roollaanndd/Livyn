import "server-only";
import { prisma } from "@/lib/prisma";

export async function getContributorStats(authorId: string) {
  const [published, pending, draft, rejected, viewsAgg] = await Promise.all([
    prisma.devotion.count({ where: { authorId, status: "published" } }),
    prisma.devotion.count({ where: { authorId, status: "pending" } }),
    prisma.devotion.count({ where: { authorId, status: "draft" } }),
    prisma.devotion.count({ where: { authorId, status: "rejected" } }),
    prisma.devotion.aggregate({ where: { authorId, status: "published" }, _sum: { viewCount: true } }),
  ]);
  return { published, pending, draft, rejected, totalViews: viewsAgg._sum.viewCount ?? 0 };
}

export async function listContributorDevotions(authorId: string) {
  return prisma.devotion.findMany({ where: { authorId }, orderBy: { createdAt: "desc" }, include: { category: true } });
}

export async function listContributorSermons(authorId: string) {
  return prisma.sermon.findMany({ where: { authorId }, orderBy: { createdAt: "desc" }, include: { category: true } });
}

export async function getOwnedDevotion(authorId: string, id: string) {
  const d = await prisma.devotion.findUnique({ where: { id } });
  return d && d.authorId === authorId ? d : null;
}
