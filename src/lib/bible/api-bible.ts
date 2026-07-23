import "server-only";
import { BOOK_CODE_TO_USFM } from "./book-mapping";

const API_BASE = "https://api.scripture.api.bible/v1";

function apiKey(): string {
  return process.env.API_BIBLE_KEY ?? "";
}

function headers(): Record<string, string> {
  return { "api-key": apiKey(), Accept: "application/json" };
}

export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  nameLocal: string;
  description: string;
}

let versionsCache: BibleVersion[] | null = null;
let versionsCacheTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function getAvailableVersions(): Promise<BibleVersion[]> {
  if (!apiKey()) return [];
  if (versionsCache && Date.now() - versionsCacheTime < CACHE_TTL) return versionsCache;

  try {
    const res = await fetch(`${API_BASE}/bibles?language=ind&include-full-details=false`, {
      headers: headers(),
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      console.error("[api-bible] Failed to fetch versions:", res.status);
      return versionsCache ?? [];
    }

    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const versions: BibleVersion[] = (json.data ?? []).map((b: any) => ({
      id: b.id,
      abbreviation: b.abbreviationLocal || b.abbreviation || "",
      name: b.name || "",
      nameLocal: b.nameLocal || b.name || "",
      description: b.descriptionLocal || b.description || "",
    }));

    versionsCache = versions;
    versionsCacheTime = Date.now();
    return versions;
  } catch (e) {
    console.error("[api-bible] Exception fetching versions:", e);
    return versionsCache ?? [];
  }
}

export async function getBibleIdForVersion(abbreviation: string): Promise<string | null> {
  const versions = await getAvailableVersions();
  const match = versions.find(
    (v) => v.abbreviation.toUpperCase() === abbreviation.toUpperCase(),
  );
  return match?.id ?? null;
}

function cleanVerseText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/^\s*\d+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface FetchedVerse {
  verse: number;
  text: string;
}

export async function fetchChapterVerses(
  bibleId: string,
  bookCode: string,
  chapter: number,
): Promise<FetchedVerse[] | null> {
  if (!apiKey()) return null;

  const usfm = BOOK_CODE_TO_USFM[bookCode];
  if (!usfm) return null;

  const chapterId = `${usfm}.${chapter}`;

  try {
    const res = await fetch(
      `${API_BASE}/bibles/${bibleId}/chapters/${chapterId}/verses?content-type=text`,
      { headers: headers() },
    );

    if (!res.ok) {
      console.error(`[api-bible] Failed to fetch ${chapterId}:`, res.status);
      return null;
    }

    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verses: FetchedVerse[] = (json.data ?? []).map((v: any) => {
      const parts = (v.id as string).split(".");
      const verseNum = parseInt(parts[parts.length - 1], 10);
      return {
        verse: verseNum,
        text: cleanVerseText(v.content ?? ""),
      };
    }).filter((v: FetchedVerse) => v.text.length > 0 && !isNaN(v.verse));

    return verses;
  } catch (e) {
    console.error(`[api-bible] Exception fetching chapter:`, e);
    return null;
  }
}
