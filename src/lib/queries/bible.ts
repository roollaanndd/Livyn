import "server-only";
import { prisma } from "@/lib/prisma";

export async function listBibleBooks() {
  return prisma.bibleBook.findMany({ orderBy: { orderIndex: "asc" } });
}

export async function getBibleBookByCode(code: string) {
  return prisma.bibleBook.findUnique({ where: { code } });
}

export async function getChapterVerses(bookId: string, chapter: number) {
  return prisma.bibleVerse.findMany({
    where: { bookId, chapter, translation: "TB" },
    orderBy: { verse: "asc" },
  });
}

export async function getChaptersWithText(bookId: string): Promise<Set<number>> {
  const rows = await prisma.bibleVerse.findMany({ where: { bookId }, select: { chapter: true }, distinct: ["chapter"] });
  return new Set(rows.map((r) => r.chapter));
}

export async function searchBibleVerses(query: string, limit = 30) {
  if (!query.trim()) return [];
  return prisma.bibleVerse.findMany({
    where: { text: { contains: query } },
    take: limit,
    include: { book: true },
  });
}

export async function getUserHighlightsForChapter(userId: string, bookCode: string, chapter: number) {
  return prisma.highlight.findMany({ where: { userId, bookCode, chapter } });
}

export async function getUserNotesForChapter(userId: string, bookCode: string, chapter: number) {
  return prisma.note.findMany({ where: { userId, bookCode, chapter } });
}
