import "server-only";
import { prisma } from "@/lib/prisma";

export async function unifiedSearch(query: string) {
  if (!query.trim()) return { devotions: [], verses: [], sermons: [], categories: [] };

  const [devotions, verses, sermons, categories] = await Promise.all([
    prisma.devotion.findMany({
      where: { status: "published", OR: [{ title: { contains: query } }, { excerpt: { contains: query } }] },
      take: 8,
      include: { category: true },
    }),
    prisma.bibleVerse.findMany({ where: { text: { contains: query } }, take: 8, include: { book: true } }),
    prisma.sermon.findMany({
      where: {
        status: "published",
        OR: [{ title: { contains: query } }, { pastor: { contains: query } }, { church: { contains: query } }],
      },
      take: 8,
    }),
    prisma.category.findMany({ where: { name: { contains: query } }, take: 5 }),
  ]);

  return { devotions, verses, sermons, categories };
}
