import "server-only";
import { prisma } from "@/lib/prisma";

export async function listPublishedDevotions(opts: { categorySlug?: string; search?: string } = {}) {
  return prisma.devotion.findMany({
    where: {
      status: "published",
      ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
      ...(opts.search
        ? {
            OR: [
              { title: { contains: opts.search } },
              { excerpt: { contains: opts.search } },
              { body: { contains: opts.search } },
            ],
          }
        : {}),
    },
    orderBy: { publishDate: "desc" },
    include: { author: true, category: true },
  });
}

export async function getDevotionBySlug(slug: string) {
  return prisma.devotion.findUnique({
    where: { slug },
    include: { author: true, category: true },
  });
}

export async function getUserBookmarkedDevotionIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.bookmark.findMany({ where: { userId }, select: { devotionId: true } });
  return new Set(rows.map((r) => r.devotionId));
}

export async function listUserBookmarkedDevotions(userId: string) {
  const rows = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { devotion: { include: { author: true, category: true } } },
  });
  return rows.map((r) => r.devotion);
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}
