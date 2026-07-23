export type IntentType =
  | "bible_explanation"
  | "prayer_request"
  | "counseling"
  | "doctrine_question"
  | "devotion"
  | "practical_guidance"
  | "crisis"
  | "general";

interface IntentPattern {
  type: IntentType;
  keywords: string[];
  priority: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    type: "crisis",
    keywords: [
      "bunuh diri", "mati saja", "tidak mau hidup", "ingin mati",
      "mengakhiri hidup", "menyakiti diri", "putus asa sekali",
      "tidak ada harapan", "lebih baik mati", "suicide",
    ],
    priority: 100,
  },
  {
    type: "bible_explanation",
    keywords: [
      "jelaskan ayat", "arti ayat", "maksud ayat", "tafsir",
      "artinya apa", "kitab", "pasal", "ayat", "alkitab",
      "firman", "injil", "mazmur", "amsal", "kejadian",
      "keluaran", "imamat", "bilangan", "ulangan",
      "yosua", "hakim", "rut", "samuel", "raja",
      "tawarikh", "ezra", "nehemia", "ester", "ayub",
      "pengkhotbah", "kidung agung", "yesaya", "yeremia",
      "ratapan", "yehezkiel", "daniel", "hosea", "yoel",
      "amos", "obaja", "yunus", "mikha", "nahum",
      "habakuk", "zefanya", "hagai", "zakharia", "maleakhi",
      "matius", "markus", "lukas", "yohanes", "kisah",
      "roma", "korintus", "galatia", "efesus", "filipi",
      "kolose", "tesalonika", "timotius", "titus", "filemon",
      "ibrani", "yakobus", "petrus", "wahyu",
    ],
    priority: 80,
  },
  {
    type: "prayer_request",
    keywords: [
      "doakan", "berdoa", "cara berdoa", "doa untuk",
      "mohon doa", "doa", "pimpin doa", "contoh doa",
      "doa syafaat", "berdoa bersama",
    ],
    priority: 70,
  },
  {
    type: "counseling",
    keywords: [
      "sedih", "cemas", "takut", "khawatir", "depresi",
      "stres", "stress", "galau", "patah hati", "kesepian",
      "kecewa", "marah", "benci", "menyesal", "bersalah",
      "malu", "trauma", "sakit hati", "dikhianati",
      "perceraian", "cerai", "selingkuh", "keluarga berantakan",
      "kehilangan", "berduka", "duka", "meninggal",
      "masalah keluarga", "masalah rumah tangga",
      "hubungan rusak", "konflik",
    ],
    priority: 60,
  },
  {
    type: "doctrine_question",
    keywords: [
      "doktrin", "teologi", "trinitas", "roh kudus",
      "keselamatan", "baptisan", "baptis", "perjamuan",
      "gereja", "denominasi", "calvinis", "arminian",
      "karismatik", "pantekosta", "katolik", "ortodoks",
      "predestinasi", "akhir zaman", "eskatologi",
      "surga", "neraka", "malaikat", "iblis", "setan",
      "dosa", "pengampunan", "penebusan", "salib",
      "kebangkitan", "kedatangan kedua", "rapture",
      "milenium", "penciptaan", "evolusi",
    ],
    priority: 50,
  },
  {
    type: "devotion",
    keywords: [
      "renungan", "meditasi", "perenungan", "firman hari ini",
      "bacaan hari ini", "devotion", "quiet time",
      "saat teduh", "refleksi",
    ],
    priority: 40,
  },
  {
    type: "practical_guidance",
    keywords: [
      "bagaimana", "cara", "tips", "panduan",
      "nasihat", "saran", "apa yang harus",
      "pekerjaan", "karir", "pacaran", "menikah",
      "pernikahan", "anak", "orangtua", "pelayanan",
      "persepuluhan", "perpuluhan", "persembahan",
      "ibadah", "gereja mana",
    ],
    priority: 30,
  },
];

export function classifyIntent(message: string): IntentType {
  const lower = message.toLowerCase();

  let bestMatch: IntentType = "general";
  let bestPriority = -1;
  let bestMatchCount = 0;

  for (const pattern of INTENT_PATTERNS) {
    const matchCount = pattern.keywords.filter((kw) => lower.includes(kw)).length;
    if (matchCount > 0 && (pattern.priority > bestPriority || (pattern.priority === bestPriority && matchCount > bestMatchCount))) {
      bestMatch = pattern.type;
      bestPriority = pattern.priority;
      bestMatchCount = matchCount;
    }
  }

  return bestMatch;
}

export function getIntentContext(intent: IntentType): string {
  switch (intent) {
    case "crisis":
      return CRISIS_CONTEXT;
    case "bible_explanation":
      return BIBLE_CONTEXT;
    case "prayer_request":
      return PRAYER_CONTEXT;
    case "counseling":
      return COUNSELING_CONTEXT;
    case "doctrine_question":
      return DOCTRINE_CONTEXT;
    case "devotion":
      return DEVOTION_CONTEXT;
    case "practical_guidance":
      return PRACTICAL_CONTEXT;
    default:
      return "";
  }
}

const CRISIS_CONTEXT = `
## PERINGATAN: DETEKSI KRISIS
Pengguna mungkin sedang dalam kondisi krisis. PRIORITASKAN:
1. Tunjukkan empati dan kasih yang mendalam — "Kamu tidak sendirian, dan Tuhan mengasihimu."
2. WAJIB berikan nomor darurat:
   - Hotline Kemenkes RI: 119 ext. 8
   - Into The Light Indonesia: 021-7884-5555
   - Yayasan Pulih: 021-788-42580
3. Dorong untuk menghubungi gembala/pendeta atau orang kepercayaan.
4. Berikan ayat penghiburan (Mazmur 34:19, Yesaya 41:10, Yeremia 29:11).
5. JANGAN menghakimi atau meremehkan perasaan mereka.
6. JANGAN hanya memberikan "jawaban rohani" — akui bahwa rasa sakit mereka nyata.`;

const BIBLE_CONTEXT = `
## KONTEKS: PENJELASAN ALKITAB
Saat menjelaskan ayat atau bagian Alkitab:
1. Berikan konteks historis — siapa penulis, kapan ditulis, kepada siapa.
2. Jelaskan makna dalam bahasa asli (Ibrani/Yunani) jika relevan.
3. Hubungkan dengan konteks pasal/kitab secara keseluruhan.
4. Berikan aplikasi praktis untuk kehidupan sehari-hari.
5. Jika ada perbedaan penafsiran antar denominasi, sebutkan dengan adil.
6. Kutip ayat pendukung lainnya yang berkaitan.`;

const PRAYER_CONTEXT = `
## KONTEKS: DOA & PANDUAN BERDOA
Saat membantu soal doa:
1. Jika diminta contoh doa, tulis doa yang personal dan tulus — bukan template kaku.
2. Ajarkan prinsip doa (ACTS: Adoration, Confession, Thanksgiving, Supplication).
3. Ingatkan bahwa doa adalah percakapan dengan Tuhan, bukan ritual.
4. Doa boleh pendek atau panjang — yang penting tulus dari hati.
5. Sertakan ayat tentang doa (Filipi 4:6-7, Matius 6:9-13, 1 Tesalonika 5:17).
6. Jika pengguna minta didoakan, tulis doa khusus untuk situasi mereka.`;

const COUNSELING_CONTEXT = `
## KONTEKS: PENDAMPINGAN & KONSELING ROHANI
Saat mendampingi pengguna yang bergumul:
1. PERTAMA: Dengarkan dan validasi perasaan mereka — "Aku mengerti ini berat."
2. Jangan langsung melompat ke "jawaban" — tunjukkan empati dulu.
3. Berikan perspektif Alkitab yang menghibur, bukan menghakimi.
4. Sarankan langkah-langkah praktis yang bisa diambil.
5. Untuk masalah berat (trauma, depresi klinis), arahkan ke konselor profesional Kristen.
6. Ingatkan bahwa meminta tolong adalah tanda kekuatan, bukan kelemahan.
7. Ayat kunci: Mazmur 23, Mazmur 46:2, Roma 8:28, 2 Korintus 12:9.`;

const DOCTRINE_CONTEXT = `
## KONTEKS: PERTANYAAN DOKTRINAL
Saat menjawab pertanyaan teologi/doktrin:
1. Jelaskan POSISI UTAMA yang dipegang mayoritas Kristen Protestan:
   - Trinitas (Bapa, Anak, Roh Kudus — satu Allah dalam tiga pribadi)
   - Keselamatan oleh anugerah melalui iman (Efesus 2:8-9)
   - Alkitab sebagai otoritas tertinggi (Sola Scriptura)
   - Yesus Kristus sepenuhnya Allah dan sepenuhnya manusia
2. Jika ada perbedaan antar denominasi (misalnya baptisan bayi vs dewasa, karunia Roh), jelaskan semua pandangan secara FAIR.
3. JANGAN memihak satu denominasi — katakan "ada perbedaan pandangan" dan sarankan diskusi dengan gembala.
4. Gunakan bahasa yang jelas dan mudah dipahami — hindari jargon teologi berlebihan.
5. Selalu kembalikan ke apa yang Alkitab katakan.`;

const DEVOTION_CONTEXT = `
## KONTEKS: RENUNGAN HARIAN
Saat memberikan renungan:
1. Pilih satu ayat atau perikop yang relevan dengan topik/musim.
2. Berikan konteks singkat tentang ayat tersebut.
3. Tarik aplikasi praktis yang relevan untuk kehidupan sehari-hari.
4. Akhiri dengan pertanyaan refleksi dan/atau doa singkat.
5. Gunakan nada yang hangat dan penuh dorongan.
6. Renungan ideal: 3-4 paragraf, tidak terlalu panjang.`;

const PRACTICAL_CONTEXT = `
## KONTEKS: PANDUAN PRAKTIS KEHIDUPAN KRISTEN
Saat memberikan nasihat praktis:
1. Selalu mulai dari prinsip Alkitab yang relevan.
2. Berikan saran yang realistis dan bisa diterapkan.
3. Untuk topik seperti pacaran/pernikahan/pekerjaan — berikan panduan berdasarkan nilai-nilai Kristen tanpa menghakimi.
4. Untuk keuangan/perpuluhan — jelaskan prinsip Alkitab tapi jangan memaksa.
5. Untuk pemilihan gereja — bantu pertimbangan, jangan pilihkan.
6. Jika topik di luar keahlian rohani (medis, hukum, keuangan detail), arahkan ke profesional.`;
