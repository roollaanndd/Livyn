type VerseRef = { book: string; chapter: number; verse: number };

const CURATED_VERSES: VerseRef[] = [
  // -- Kekuatan & Pengharapan --
  { book: "yes", chapter: 41, verse: 10 },
  { book: "yer", chapter: 29, verse: 11 },
  { book: "mzm", chapter: 23, verse: 1 },
  { book: "mzm", chapter: 46, verse: 1 },
  { book: "mzm", chapter: 27, verse: 1 },
  { book: "mzm", chapter: 37, verse: 4 },
  { book: "mzm", chapter: 91, verse: 1 },
  { book: "mzm", chapter: 121, verse: 1 },
  { book: "mzm", chapter: 119, verse: 105 },
  { book: "mzm", chapter: 34, verse: 18 },
  { book: "mzm", chapter: 55, verse: 22 },
  { book: "mzm", chapter: 62, verse: 1 },
  { book: "mzm", chapter: 73, verse: 26 },
  { book: "mzm", chapter: 138, verse: 8 },
  { book: "mzm", chapter: 139, verse: 14 },
  { book: "mzm", chapter: 145, verse: 18 },
  { book: "mzm", chapter: 147, verse: 3 },
  { book: "mzm", chapter: 103, verse: 12 },
  { book: "mzm", chapter: 28, verse: 7 },
  { book: "mzm", chapter: 16, verse: 8 },
  { book: "mzm", chapter: 18, verse: 2 },
  { book: "mzm", chapter: 32, verse: 8 },
  { book: "mzm", chapter: 40, verse: 1 },
  { book: "mzm", chapter: 42, verse: 11 },
  { book: "mzm", chapter: 56, verse: 3 },
  { book: "mzm", chapter: 71, verse: 5 },
  { book: "mzm", chapter: 84, verse: 11 },
  { book: "mzm", chapter: 94, verse: 19 },
  { book: "mzm", chapter: 100, verse: 5 },
  { book: "mzm", chapter: 107, verse: 1 },
  { book: "mzm", chapter: 118, verse: 24 },

  // -- Kasih & Anugerah --
  { book: "yoh", chapter: 3, verse: 16 },
  { book: "yoh", chapter: 14, verse: 27 },
  { book: "yoh", chapter: 14, verse: 6 },
  { book: "yoh", chapter: 15, verse: 5 },
  { book: "yoh", chapter: 16, verse: 33 },
  { book: "yoh", chapter: 10, verse: 10 },
  { book: "yoh", chapter: 11, verse: 25 },
  { book: "yoh", chapter: 8, verse: 32 },
  { book: "yoh", chapter: 1, verse: 12 },
  { book: "yoh", chapter: 13, verse: 34 },
  { book: "yoh", chapter: 15, verse: 13 },
  { book: "rom", chapter: 8, verse: 28 },
  { book: "rom", chapter: 8, verse: 38 },
  { book: "rom", chapter: 5, verse: 8 },
  { book: "rom", chapter: 12, verse: 2 },
  { book: "rom", chapter: 15, verse: 13 },
  { book: "rom", chapter: 8, verse: 1 },
  { book: "rom", chapter: 8, verse: 31 },
  { book: "rom", chapter: 12, verse: 12 },
  { book: "1kor", chapter: 13, verse: 4 },
  { book: "1kor", chapter: 10, verse: 13 },
  { book: "1kor", chapter: 16, verse: 13 },
  { book: "1kor", chapter: 15, verse: 58 },
  { book: "2kor", chapter: 5, verse: 17 },
  { book: "2kor", chapter: 12, verse: 9 },
  { book: "2kor", chapter: 4, verse: 16 },
  { book: "2kor", chapter: 4, verse: 18 },

  // -- Iman & Kepercayaan --
  { book: "ibr", chapter: 11, verse: 1 },
  { book: "ibr", chapter: 12, verse: 2 },
  { book: "ibr", chapter: 13, verse: 5 },
  { book: "ibr", chapter: 4, verse: 16 },
  { book: "ibr", chapter: 10, verse: 23 },
  { book: "ams", chapter: 3, verse: 5 },
  { book: "ams", chapter: 3, verse: 6 },
  { book: "ams", chapter: 16, verse: 3 },
  { book: "ams", chapter: 18, verse: 10 },
  { book: "ams", chapter: 22, verse: 6 },
  { book: "ams", chapter: 4, verse: 23 },
  { book: "ams", chapter: 16, verse: 9 },
  { book: "ams", chapter: 27, verse: 17 },
  { book: "ams", chapter: 31, verse: 25 },
  { book: "ams", chapter: 19, verse: 21 },
  { book: "ams", chapter: 11, verse: 25 },

  // -- Damai & Ketenangan --
  { book: "flp", chapter: 4, verse: 13 },
  { book: "flp", chapter: 4, verse: 6 },
  { book: "flp", chapter: 4, verse: 7 },
  { book: "flp", chapter: 4, verse: 8 },
  { book: "flp", chapter: 1, verse: 6 },
  { book: "flp", chapter: 2, verse: 13 },
  { book: "flp", chapter: 3, verse: 14 },
  { book: "ef", chapter: 2, verse: 10 },
  { book: "ef", chapter: 3, verse: 20 },
  { book: "ef", chapter: 6, verse: 10 },
  { book: "gal", chapter: 2, verse: 20 },
  { book: "gal", chapter: 5, verse: 22 },
  { book: "gal", chapter: 6, verse: 9 },
  { book: "kol", chapter: 3, verse: 23 },
  { book: "kol", chapter: 3, verse: 2 },
  { book: "kol", chapter: 3, verse: 15 },

  // -- Yesaya & Nabi-Nabi --
  { book: "yes", chapter: 40, verse: 31 },
  { book: "yes", chapter: 43, verse: 2 },
  { book: "yes", chapter: 43, verse: 19 },
  { book: "yes", chapter: 54, verse: 10 },
  { book: "yes", chapter: 55, verse: 8 },
  { book: "yes", chapter: 26, verse: 3 },
  { book: "yes", chapter: 40, verse: 29 },
  { book: "yes", chapter: 41, verse: 13 },
  { book: "yes", chapter: 46, verse: 4 },
  { book: "yes", chapter: 58, verse: 11 },
  { book: "yes", chapter: 30, verse: 21 },
  { book: "yes", chapter: 49, verse: 16 },
  { book: "yes", chapter: 53, verse: 5 },
  { book: "yer", chapter: 17, verse: 7 },
  { book: "yer", chapter: 33, verse: 3 },
  { book: "rat", chapter: 3, verse: 22 },
  { book: "rat", chapter: 3, verse: 23 },
  { book: "mik", chapter: 6, verse: 8 },
  { book: "nah", chapter: 1, verse: 7 },
  { book: "hab", chapter: 3, verse: 19 },
  { book: "zef", chapter: 3, verse: 17 },
  { book: "mal", chapter: 3, verse: 10 },

  // -- Matius & Injil Sinoptik --
  { book: "mat", chapter: 6, verse: 33 },
  { book: "mat", chapter: 11, verse: 28 },
  { book: "mat", chapter: 5, verse: 16 },
  { book: "mat", chapter: 28, verse: 20 },
  { book: "mat", chapter: 7, verse: 7 },
  { book: "mat", chapter: 19, verse: 26 },
  { book: "mat", chapter: 5, verse: 14 },
  { book: "mat", chapter: 22, verse: 37 },
  { book: "mat", chapter: 6, verse: 34 },
  { book: "luk", chapter: 1, verse: 37 },
  { book: "luk", chapter: 6, verse: 38 },
  { book: "luk", chapter: 12, verse: 7 },
  { book: "mrk", chapter: 11, verse: 24 },
  { book: "mrk", chapter: 9, verse: 23 },

  // -- Surat-surat Umum --
  { book: "yak", chapter: 1, verse: 2 },
  { book: "yak", chapter: 1, verse: 5 },
  { book: "yak", chapter: 4, verse: 8 },
  { book: "yak", chapter: 1, verse: 17 },
  { book: "1ptr", chapter: 5, verse: 7 },
  { book: "1ptr", chapter: 2, verse: 9 },
  { book: "1ptr", chapter: 5, verse: 10 },
  { book: "2ptr", chapter: 3, verse: 9 },
  { book: "1yoh", chapter: 4, verse: 18 },
  { book: "1yoh", chapter: 1, verse: 9 },
  { book: "1yoh", chapter: 4, verse: 8 },
  { book: "1yoh", chapter: 5, verse: 14 },

  // -- Perjanjian Lama Lainnya --
  { book: "ul", chapter: 31, verse: 6 },
  { book: "ul", chapter: 31, verse: 8 },
  { book: "yos", chapter: 1, verse: 9 },
  { book: "yos", chapter: 1, verse: 5 },
  { book: "2taw", chapter: 7, verse: 14 },
  { book: "pkh", chapter: 3, verse: 11 },
  { book: "kej", chapter: 50, verse: 20 },
  { book: "kel", chapter: 14, verse: 14 },
  { book: "bil", chapter: 6, verse: 24 },

  // -- Surat Pastoral & Lainnya --
  { book: "1tim", chapter: 4, verse: 12 },
  { book: "2tim", chapter: 1, verse: 7 },
  { book: "2tim", chapter: 3, verse: 16 },
  { book: "1tes", chapter: 5, verse: 16 },
  { book: "1tes", chapter: 5, verse: 18 },
  { book: "tit", chapter: 3, verse: 5 },
  { book: "why", chapter: 21, verse: 4 },
  { book: "why", chapter: 3, verse: 20 },
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
