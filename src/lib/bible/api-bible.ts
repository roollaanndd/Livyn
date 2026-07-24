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

/* Walk api.bible's structured JSON chapter content and group text by verse.
 * NOTE: the /chapters/{id}/verses list endpoint returns verse REFERENCES ONLY
 * (no content field) — that is why fetching from it produced empty verse text.
 * The chapter content endpoint with content-type=json is the reliable source. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkContent(nodes: any[], acc: Map<number, string>, state: { current: number }) {
  for (const node of nodes ?? []) {
    if (!node || typeof node !== "object") continue;

    if (node.type === "tag" && node.name === "verse") {
      const num = parseInt(node.attrs?.number ?? "", 10);
      if (!isNaN(num)) state.current = num;
    } else if (node.type === "text" && typeof node.text === "string") {
      let verseNum = state.current;
      const vid: string | undefined = node.attrs?.verseId;
      if (vid) {
        const parsed = parseInt(vid.split(".").pop() ?? "", 10);
        if (!isNaN(parsed)) verseNum = parsed;
      }
      if (verseNum > 0) {
        acc.set(verseNum, ((acc.get(verseNum) ?? "") + " " + node.text).trim());
      }
    }

    if (Array.isArray(node.items)) walkContent(node.items, acc, state);
  }
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
      `${API_BASE}/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
      { headers: headers() },
    );

    if (!res.ok) {
      console.error(`[api-bible] Failed to fetch ${chapterId}:`, res.status);
      return null;
    }

    const json = await res.json();
    const content = json.data?.content;
    if (!Array.isArray(content)) {
      console.error(`[api-bible] Unexpected content shape for ${chapterId}`);
      return null;
    }

    const acc = new Map<number, string>();
    walkContent(content, acc, { current: 0 });

    const verses: FetchedVerse[] = [...acc.entries()]
      .map(([verse, text]) => ({ verse, text: cleanVerseText(text) }))
      .filter((v) => v.text.length > 0)
      .sort((a, b) => a.verse - b.verse);

    return verses;
  } catch (e) {
    console.error(`[api-bible] Exception fetching chapter:`, e);
    return null;
  }
}
