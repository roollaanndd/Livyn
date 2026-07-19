import "server-only";
import { prisma } from "@/lib/prisma";

export async function listPublishedSermons(opts: { categorySlug?: string } = {}) {
  return prisma.sermon.findMany({
    where: { status: "published", ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}) },
    orderBy: { publishDate: "desc" },
    include: { author: true, category: true },
  });
}

export async function getSermonBySlug(slug: string) {
  return prisma.sermon.findUnique({ where: { slug }, include: { author: true, category: true } });
}

export async function getUserWatchProgress(userId: string, sermonId: string) {
  return prisma.watchProgress.findUnique({ where: { userId_sermonId: { userId, sermonId } } });
}
