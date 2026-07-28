import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type FavoriteVerseRow = {
  id: string;
  bookCode: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  note: string | null;
  createdAt: Date;
};

export const listFavorites = cache(async (userId: string): Promise<FavoriteVerseRow[]> => {
  return (await prisma.favoriteVerse
    .findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
    .catch(() => [])) as FavoriteVerseRow[];
});

export const countFavorites = cache(async (userId: string): Promise<number> => {
  return (await prisma.favoriteVerse.count({ where: { userId } }).catch(() => 0)) as number;
});

/** Whether one specific verse is already saved — used to render the button in
 * its correct state on first paint instead of flickering after hydration. */
export const isFavorited = cache(
  async (userId: string, bookCode: string, chapter: number, verse: number): Promise<boolean> => {
    const row = await prisma.favoriteVerse
      .findFirst({ where: { userId, bookCode, chapter, verse }, select: { id: true } })
      .catch(() => null);
    return Boolean(row);
  },
);

/** The set of verses saved within one chapter, so the Bible reader can mark
 * them all with a single query instead of one per verse. */
export const favoritedVersesInChapter = cache(
  async (userId: string, bookCode: string, chapter: number): Promise<Set<number>> => {
    const rows = (await prisma.favoriteVerse
      .findMany({ where: { userId, bookCode, chapter }, select: { verse: true } })
      .catch(() => [])) as { verse: number }[];
    return new Set(rows.map((r) => r.verse));
  },
);
