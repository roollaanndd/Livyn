type VerseRef = { book: string; chapter: number; verse: number };

const CURATED_VERSES: VerseRef[] = [
  // -- Kekuatan & Pengharapan --
  { book: "yes", chapter: 41, verse: 10 },
  { book: "yes", chapter: 41, verse: 13 },
  { book: "yer", chapter: 29, verse: 11 },
  { book: "yer", chapter: 29, verse: 12 },
  { book: "yer", chapter: 29, verse: 13 },
  { book: "mzm", chapter: 23, verse: 1 },
  { book: "mzm", chapter: 23, verse: 2 },
  { book: "mzm", chapter: 23, verse: 3 },
  { book: "mzm", chapter: 23, verse: 4 },
  { book: "mzm", chapter: 23, verse: 5 },
  { book: "mzm", chapter: 23, verse: 6 },
  { book: "mzm", chapter: 91, verse: 1 },
  { book: "mzm", chapter: 91, verse: 2 },
  { book: "mzm", chapter: 91, verse: 4 },
  { book: "mzm", chapter: 91, verse: 5 },
  { book: "mzm", chapter: 91, verse: 9 },
  { book: "mzm", chapter: 91, verse: 10 },
  { book: "mzm", chapter: 91, verse: 11 },
  { book: "mzm", chapter: 91, verse: 14 },
  { book: "mzm", chapter: 91, verse: 15 },
  { book: "mzm", chapter: 91, verse: 16 },
  { book: "mzm", chapter: 121, verse: 1 },
  { book: "mzm", chapter: 121, verse: 2 },
  { book: "mzm", chapter: 121, verse: 3 },
  { book: "mzm", chapter: 121, verse: 5 },
  { book: "mzm", chapter: 121, verse: 7 },
  { book: "mzm", chapter: 121, verse: 8 },

  // -- Kasih & Anugerah --
  { book: "yoh", chapter: 3, verse: 16 },
  { book: "yoh", chapter: 3, verse: 17 },
  { book: "yoh", chapter: 14, verse: 27 },
  { book: "yoh", chapter: 14, verse: 6 },
  { book: "yoh", chapter: 14, verse: 1 },
  { book: "yoh", chapter: 1, verse: 1 },
  { book: "yoh", chapter: 1, verse: 3 },
  { book: "yoh", chapter: 1, verse: 4 },
  { book: "yoh", chapter: 1, verse: 5 },
  { book: "yoh", chapter: 1, verse: 9 },
  { book: "yoh", chapter: 1, verse: 12 },
  { book: "yoh", chapter: 1, verse: 14 },
  { book: "rm", chapter: 8, verse: 28 },
  { book: "rm", chapter: 8, verse: 31 },
  { book: "rm", chapter: 8, verse: 38 },
  { book: "rm", chapter: 8, verse: 39 },
  { book: "1kor", chapter: 13, verse: 4 },
  { book: "1kor", chapter: 13, verse: 5 },
  { book: "1kor", chapter: 13, verse: 6 },
  { book: "1kor", chapter: 13, verse: 7 },
  { book: "1kor", chapter: 13, verse: 8 },
  { book: "1kor", chapter: 13, verse: 13 },

  // -- Iman & Kepercayaan --
  { book: "ams", chapter: 3, verse: 5 },
  { book: "ams", chapter: 3, verse: 6 },
  { book: "ams", chapter: 3, verse: 11 },
  { book: "ams", chapter: 3, verse: 12 },

  // -- Damai & Ketenangan --
  { book: "flp", chapter: 4, verse: 4 },
  { book: "flp", chapter: 4, verse: 6 },
  { book: "flp", chapter: 4, verse: 7 },
  { book: "flp", chapter: 4, verse: 8 },
  { book: "flp", chapter: 4, verse: 13 },
  { book: "flp", chapter: 4, verse: 19 },
  { book: "gal", chapter: 5, verse: 22 },
  { book: "gal", chapter: 5, verse: 23 },

  // -- Matius & Injil Sinoptik --
  { book: "mat", chapter: 6, verse: 33 },
  { book: "mat", chapter: 6, verse: 34 },
  { book: "mat", chapter: 5, verse: 3 },
  { book: "mat", chapter: 5, verse: 4 },
  { book: "mat", chapter: 5, verse: 5 },
  { book: "mat", chapter: 5, verse: 6 },
  { book: "mat", chapter: 5, verse: 7 },
  { book: "mat", chapter: 5, verse: 8 },
  { book: "mat", chapter: 5, verse: 9 },

  // -- Surat-surat Umum --
  { book: "yak", chapter: 1, verse: 2 },
  { book: "yak", chapter: 1, verse: 3 },
  { book: "yak", chapter: 1, verse: 5 },
  { book: "yak", chapter: 1, verse: 17 },
  { book: "1ptr", chapter: 5, verse: 6 },
  { book: "1ptr", chapter: 5, verse: 7 },
  { book: "1yoh", chapter: 4, verse: 18 },
  { book: "1yoh", chapter: 4, verse: 19 },

  // -- Pengkhotbah --
  { book: "pkh", chapter: 3, verse: 1 },
  { book: "pkh", chapter: 3, verse: 2 },
  { book: "pkh", chapter: 3, verse: 3 },
  { book: "pkh", chapter: 3, verse: 4 },
  { book: "pkh", chapter: 3, verse: 5 },
  { book: "pkh", chapter: 3, verse: 6 },
  { book: "pkh", chapter: 3, verse: 7 },
  { book: "pkh", chapter: 3, verse: 8 },

  // -- Wahyu --
  { book: "why", chapter: 21, verse: 1 },
  { book: "why", chapter: 21, verse: 4 },
];

function seededShuffle(arr: VerseRef[], seed: number): VerseRef[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function getDailyVerseRef(dayKey: number): VerseRef {
  const epoch = Math.floor(dayKey / CURATED_VERSES.length);
  const shuffled = seededShuffle(CURATED_VERSES, epoch);
  return shuffled[dayKey % CURATED_VERSES.length];
}

export const CURATED_VERSE_COUNT = CURATED_VERSES.length;
