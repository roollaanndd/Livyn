import "server-only";
import { prisma } from "@/lib/prisma";
import { getBibleIdForVersion, fetchChapterVerses } from "@/lib/bible/api-bible";

export async function listBibleBooks() {
  return prisma.bibleBook.findMany({ orderBy: { orderIndex: "asc" } });
}

export async function getBibleBookByCode(code: string) {
  return prisma.bibleBook.findUnique({ where: { code } });
}

export async function getChapterVerses(bookId: string, chapter: number, translation = "TB") {
  return prisma.bibleVerse.findMany({
    where: { bookId, chapter, translation },
    orderBy: { verse: "asc" },
  });
}

export async function getOrFetchChapterVerses(
  bookId: string,
  bookCode: string,
  chapter: number,
  translation = "TB",
): Promise<{ verses: Awaited<ReturnType<typeof getChapterVerses>>; source: "cache" | "api" | "empty" }> {
  const cached = await getChapterVerses(bookId, chapter, translation);
  const cachedWithText = cached.filter((v: { text: string }) => v.text && v.text.trim().length > 0);
  if (cachedWithText.length > 0) {
    return { verses: cachedWithText, source: "cache" };
  }

  // Rows exist but all have empty text — poisoned cache from the old verses-list
  // endpoint (which returns references without content). Purge and refetch.
  if (cached.length > 0) {
    await prisma.bibleVerse
      .deleteMany({ where: { bookId, chapter, translation } })
      .catch(() => null);
  }

  if (!process.env.API_BIBLE_KEY) {
    return { verses: [], source: "empty" };
  }

  const bibleId = await getBibleIdForVersion(translation);
  if (!bibleId) {
    return { verses: [], source: "empty" };
  }

  const fetched = await fetchChapterVerses(bibleId, bookCode, chapter);
  if (!fetched || fetched.length === 0) {
    return { verses: [], source: "empty" };
  }

  const inserts = fetched.map((v) =>
    prisma.bibleVerse
      .create({
        data: {
          id: crypto.randomUUID(),
          bookId,
          chapter,
          verse: v.verse,
          text: v.text,
          translation,
        },
      })
      .catch(() => null),
  );
  await Promise.all(inserts);

  const saved = await getChapterVerses(bookId, chapter, translation);
  return { verses: saved.length > 0 ? saved : fetched.map((v, i) => ({
    id: `temp-${i}`,
    bookId,
    chapter,
    verse: v.verse,
    text: v.text,
    translation,
  })), source: "api" };
}

export async function getChaptersWithText(bookId: string, translation = "TB"): Promise<Set<number>> {
  const rows = await prisma.bibleVerse.findMany({
    where: { bookId, translation },
    select: { chapter: true },
    distinct: ["chapter"],
  });
  return new Set(rows.map((r: { chapter: number }) => r.chapter));
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
