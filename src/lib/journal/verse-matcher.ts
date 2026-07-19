// No external AI API is configured for Livyn, so "AI-suggested verse" is
// implemented as deterministic keyword matching against the curated verse
// set in prisma/bible-verses.ts. Every ref below points at a verse that is
// actually seeded — see BIBLE_TEXT for the source of truth on what exists.
export type VerseRef = { book: string; chapter: number; verse: number };
export type MatchResult = { ref: VerseRef; note: string };

type Rule = { keywords: string[]; ref: VerseRef; note: string };

const RULES: Rule[] = [
  {
    keywords: ["takut", "menakutkan", "ngeri", "was-was", "panik", "khawatir", "kuatir akan bahaya"],
    ref: { book: "yes", chapter: 41, verse: 10 },
    note: "Kamu tidak sendirian menghadapi ini — Tuhan berjanji menyertai dan menguatkanmu di tengah rasa takutmu.",
  },
  {
    keywords: ["cemas", "gelisah", "khawatir", "kuatir", "besok", "masa depan tidak jelas"],
    ref: { book: "flp", chapter: 4, verse: 6 },
    note: "Bawa kekuatiranmu kepada Tuhan dalam doa — Ia mengundangmu untuk tidak memikulnya sendiri.",
  },
  {
    keywords: ["lelah", "capek", "letih", "jenuh", "burnout", "beban", "berat", "menyerah"],
    ref: { book: "1ptr", chapter: 5, verse: 7 },
    note: "Serahkan bebanmu kepada-Nya — Ia sungguh-sungguh peduli padamu.",
  },
  {
    keywords: ["sedih", "duka", "menangis", "kehilangan", "patah hati", "hancur", "terpuruk"],
    ref: { book: "mzm", chapter: 23, verse: 4 },
    note: "Bahkan di lembah yang paling gelap sekalipun, kamu tidak berjalan sendiri.",
  },
  {
    keywords: ["sendiri", "sendirian", "kesepian", "ditinggalkan", "diabaikan", "tidak ada yang peduli"],
    ref: { book: "rm", chapter: 8, verse: 38 },
    note: "Tidak ada apa pun yang bisa memisahkanmu dari kasih Allah — kamu selalu dijangkau oleh-Nya.",
  },
  {
    keywords: ["marah", "kesal", "jengkel", "emosi", "benci", "dendam", "kecewa berat"],
    ref: { book: "gal", chapter: 5, verse: 22 },
    note: "Minta Roh Kudus menumbuhkan kesabaran dan penguasaan diri di tengah emosi yang bergejolak ini.",
  },
  {
    keywords: ["bersyukur", "syukur", "sukacita", "bahagia", "senang", "diberkati"],
    ref: { book: "flp", chapter: 4, verse: 4 },
    note: "Syukurlah — Tuhan turut bersukacita bersamamu dalam kebaikan hari ini.",
  },
  {
    keywords: ["bingung", "galau", "tidak tahu arah", "keputusan", "pilihan", "ragu-ragu"],
    ref: { book: "ams", chapter: 3, verse: 5 },
    note: "Saat arah belum jelas, percayakan langkahmu kepada Tuhan — Ia akan meluruskan jalanmu.",
  },
  {
    keywords: ["putus asa", "tidak ada harapan", "hopeless", "gagal total", "hancur masa depan"],
    ref: { book: "yer", chapter: 29, verse: 11 },
    note: "Tuhan punya rancangan damai sejahtera untukmu, bukan rancangan kecelakaan — ada harapan di depan.",
  },
  {
    keywords: ["gelisah hati", "tidak tenang", "damai", "tenang", "khawatir hati"],
    ref: { book: "yoh", chapter: 14, verse: 27 },
    note: "Damai sejahtera yang Tuhan beri berbeda dari damai dunia — biarkan hatimu tidak gelisah.",
  },
  {
    keywords: ["kerja", "pekerjaan", "karir", "usaha", "gagal", "kegagalan", "bisnis"],
    ref: { book: "flp", chapter: 4, verse: 13 },
    note: "Kekuatanmu bukan dari dirimu sendiri — Kristus yang memampukanmu menanggung semua ini.",
  },
  {
    keywords: ["keluarga", "pertengkaran", "konflik", "hubungan", "pasangan", "cinta", "kasih", "sahabat", "teman"],
    ref: { book: "1kor", chapter: 13, verse: 4 },
    note: "Kasih itu sabar dan murah hati — mintalah Tuhan menolongmu mengasihi seperti itu dalam situasi ini.",
  },
  {
    keywords: ["meninggal", "kematian", "kehilangan orang", "berduka"],
    ref: { book: "why", chapter: 21, verse: 4 },
    note: "Suatu hari nanti Tuhan akan menghapus setiap air mata — dukacita ini tidak akan selamanya.",
  },
  {
    keywords: ["ujian", "cobaan", "pencobaan", "masalah", "kesulitan", "tantangan", "sulit"],
    ref: { book: "yak", chapter: 1, verse: 2 },
    note: "Pencobaan yang kamu alami sedang membentuk ketekunan dan kedewasaan imanmu.",
  },
  {
    keywords: ["bahaya", "ancaman", "tidak aman", "terancam", "perlindungan"],
    ref: { book: "mzm", chapter: 91, verse: 1 },
    note: "Berlindunglah pada Tuhan — Ia adalah tempat perlindunganmu yang paling aman.",
  },
  {
    keywords: ["butuh tolong", "tidak berdaya", "pertolongan", "minta tolong"],
    ref: { book: "mzm", chapter: 121, verse: 1 },
    note: "Pertolonganmu datang dari Tuhan, pencipta langit dan bumi — carilah Dia lebih dahulu.",
  },
  {
    keywords: ["menunggu", "sabar", "proses", "belum waktunya", "waktu tuhan"],
    ref: { book: "pkh", chapter: 3, verse: 1 },
    note: "Ada masanya untuk segala sesuatu — percayai waktu Tuhan dalam prosesmu.",
  },
  {
    keywords: ["berharga", "dicintai", "tidak berharga", "insecure", "minder"],
    ref: { book: "1yoh", chapter: 4, verse: 18 },
    note: "Kasih Allah yang sempurna melenyapkan rasa takut — kamu sangat berharga di mata-Nya.",
  },
  {
    keywords: ["iman", "percaya", "ragu", "keraguan", "imanku"],
    ref: { book: "yoh", chapter: 3, verse: 16 },
    note: "Ingat betapa besar kasih Allah bagimu — itulah dasar dari imanmu.",
  },
  {
    keywords: ["awal baru", "mulai lagi", "harapan baru", "berubah"],
    ref: { book: "why", chapter: 21, verse: 1 },
    note: "Tuhan sanggup membuat sesuatu yang baru — hari ini bisa menjadi awal yang baru.",
  },
];

const MOOD_FALLBACK: Record<string, { ref: VerseRef; note: string }> = {
  damai: { ref: { book: "yoh", chapter: 14, verse: 27 }, note: "Simpan damai sejahtera yang Tuhan berikan ini di hatimu." },
  sukacita: { ref: { book: "flp", chapter: 4, verse: 4 }, note: "Bersukacitalah senantiasa — Tuhan turut merayakan hari baikmu." },
  bersyukur: { ref: { book: "flp", chapter: 4, verse: 6 }, note: "Bawa rasa syukurmu ke hadapan Tuhan dalam doa." },
  sedih: { ref: { book: "mzm", chapter: 23, verse: 4 }, note: "Tuhan besertamu bahkan di titik terberat hari ini." },
  cemas: { ref: { book: "flp", chapter: 4, verse: 7 }, note: "Biarkan damai sejahtera Allah menjaga hati dan pikiranmu." },
  marah: { ref: { book: "gal", chapter: 5, verse: 23 }, note: "Minta Tuhan menolongmu menemukan penguasaan diri saat ini." },
  lelah: { ref: { book: "1ptr", chapter: 5, verse: 7 }, note: "Serahkan kelelahanmu kepada Tuhan yang memelihara kamu." },
  bingung: { ref: { book: "ams", chapter: 3, verse: 6 }, note: "Akui Tuhan dalam segala hal, dan Ia akan meluruskan jalanmu." },
};

const DEFAULT_MATCH: MatchResult = {
  ref: { book: "yer", chapter: 29, verse: 11 },
  note: "Apa pun yang kamu tuliskan hari ini, Tuhan punya rancangan damai sejahtera untukmu.",
};

export function matchVerse(text: string, mood?: string | null): MatchResult {
  const normalized = text.toLowerCase();

  let best: Rule | null = null;
  let bestScore = 0;
  for (const rule of RULES) {
    const score = rule.keywords.reduce((acc, kw) => (normalized.includes(kw) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  if (best) return { ref: best.ref, note: best.note };

  if (mood && MOOD_FALLBACK[mood]) return MOOD_FALLBACK[mood];

  return DEFAULT_MATCH;
}
