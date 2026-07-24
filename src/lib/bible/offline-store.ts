"use client";

/* IndexedDB store for the bundled Terjemahan Baru Bible.
 * Books are served as static JSON from /bible/tb/{code}.json and cached
 * here so the whole Bible works offline after one download. */

export interface OfflineBook {
  code: string;
  name: string;
  translation: string;
  /** chapters[chapterIndex][verseIndex] — both zero-based */
  chapters: string[][];
}

const DB_NAME = "livyn-bible";
const STORE = "books";
const FLAG_KEY = "livyn_bible_downloaded";

export const ALL_BOOK_CODES = [
  "kej", "kel", "im", "bil", "ul", "yos", "hak", "rut", "1sam", "2sam",
  "1raj", "2raj", "1taw", "2taw", "ezr", "neh", "est", "ayb", "mzm", "ams",
  "pkh", "kid", "yes", "yer", "rat", "yeh", "dan", "hos", "yl", "am",
  "ob", "yun", "mi", "nah", "hab", "zef", "hag", "za", "mal", "mat",
  "mrk", "luk", "yoh", "kis", "rm", "1kor", "2kor", "gal", "ef", "flp",
  "kol", "1tes", "2tes", "1tim", "2tim", "tit", "flm", "ibr", "yak", "1ptr",
  "2ptr", "1yoh", "2yoh", "3yoh", "yud", "why",
];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "code" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredBook(code: string): Promise<OfflineBook | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(code);
      req.onsuccess = () => resolve((req.result as OfflineBook) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function storeBook(book: OfflineBook): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(book);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // storage unavailable (private mode etc.) — reads fall back to network
  }
}

/** Load one book: IndexedDB first, then the bundled static JSON (and cache it). */
export async function loadBook(code: string): Promise<OfflineBook | null> {
  const stored = await getStoredBook(code);
  if (stored) return stored;

  try {
    const res = await fetch(`/bible/tb/${code}.json`);
    if (!res.ok) return null;
    const book = (await res.json()) as OfflineBook;
    await storeBook(book);
    return book;
  } catch {
    return null;
  }
}

export function isBibleDownloaded(): boolean {
  try {
    return localStorage.getItem(FLAG_KEY) === "TB";
  } catch {
    return false;
  }
}

export function markBibleDownloaded(): void {
  try {
    localStorage.setItem(FLAG_KEY, "TB");
  } catch {
    // ignore
  }
}

/** Download every book into IndexedDB, reporting progress (0..66). */
export async function downloadFullBible(onProgress: (done: number, total: number) => void): Promise<boolean> {
  const total = ALL_BOOK_CODES.length;
  let done = 0;
  // Modest concurrency so mobile connections aren't overwhelmed.
  const queue = [...ALL_BOOK_CODES];
  let failed = false;

  async function worker() {
    while (queue.length > 0 && !failed) {
      const code = queue.shift()!;
      const book = await loadBook(code);
      if (!book) {
        failed = true;
        return;
      }
      done += 1;
      onProgress(done, total);
    }
  }

  await Promise.all([worker(), worker(), worker(), worker()]);
  if (!failed) markBibleDownloaded();
  return !failed;
}
