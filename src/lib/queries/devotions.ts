import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Category-filtered list is public data — cache per (category, search) pair.
export const listPublishedDevotions = unstable_cache(
  async (opts: { categorySlug?: string; search?: string } = {}) =>
    prisma.devotion.findMany({
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
    }),
  ["published-devotions"],
  { revalidate: 300, tags: ["devotions"] },
);

export const getDevotionBySlug = unstable_cache(
  async (slug: string) =>
    prisma.devotion.findUnique({
      where: { slug },
      include: { author: true, category: true },
    }),
  ["devotion-by-slug"],
  { revalidate: 300, tags: ["devotions"] },
);

// Per-user data — React cache only.
export const getUserBookmarkedDevotionIds = cache(async (userId: string): Promise<Set<string>> => {
  const rows = await prisma.bookmark.findMany({ where: { userId }, select: { devotionId: true } });
  return new Set(rows.map((r) => r.devotionId));
});

export const listUserBookmarkedDevotions = cache(async (userId: string) => {
  const rows = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { devotion: { include: { author: true, category: true } } },
  });
  return rows.map((r) => r.devotion);
});

// Categories change rarely — cache aggressively.
export const listCategories = unstable_cache(
  async () => prisma.category.findMany({ orderBy: { name: "asc" } }),
  ["categories"],
  { revalidate: 3600, tags: ["categories"] },
);
