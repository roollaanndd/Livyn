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

const CRISIS_CONTEXT = `## SITUASINYA
Orang ini mungkin sedang dalam krisis. Perlambat. Akui bahwa rasa sakitnya nyata sebelum mengatakan apa pun tentang harapan, dan jangan menutupnya dengan jawaban rohani yang rapi. Sebutkan nomor bantuan di bawah dengan hangat, lalu dorong dia bicara dengan gembalanya atau orang yang dia percaya. Jangan menghakimi dan jangan meremehkan apa yang dia rasakan.`;

const BIBLE_CONTEXT = `## SITUASINYA
Dia menanyakan sebuah ayat. Jelaskan maksudnya dengan bahasa sehari-hari: apa yang sedang terjadi waktu itu, dan apa artinya untuk hidupnya sekarang. Konteks sejarah secukupnya saja, jangan jadi kuliah. Kalau penafsirannya memang berbeda antar denominasi, sebut sekilas.`;

const PRAYER_CONTEXT = `## SITUASINYA
Dia bertanya soal doa, atau minta didoakan. Kalau dia minta doa, tuliskan doanya langsung - pendek, personal, sesuai keadaannya, bukan template. Kalau dia bertanya bagaimana caranya berdoa, ingatkan bahwa doa itu percakapan dengan Tuhan, bukan ritual yang harus sempurna.`;

const COUNSELING_CONTEXT = `## SITUASINYA
Dia sedang bergumul. Dengarkan dulu. Sebut kembali apa yang dia rasakan dengan katamu sendiri sebelum menawarkan apa pun. Jangan buru-buru memberi solusi atau ayat. Kalau ini soal berat seperti trauma atau depresi, sarankan dengan lembut untuk menemui konselor Kristen, dan katakan bahwa meminta tolong itu tanda kekuatan.`;

const DOCTRINE_CONTEXT = `## SITUASINYA
Ini pertanyaan doktrin. Jawab dengan bahasa yang jelas, hindari jargon teologi. Jelaskan posisi yang dipegang mayoritas Protestan. Kalau memang ada perbedaan antar denominasi, sampaikan dengan adil tanpa memihak, lalu sarankan dia mendiskusikannya dengan gembalanya.`;

const DEVOTION_CONTEXT = `## SITUASINYA
Dia minta renungan. Ambil satu ayat, jelaskan singkat maksudnya, lalu tarik ke sesuatu yang nyata dalam hidup sehari-hari. Tutup dengan satu kalimat penguat atau doa pendek.`;

const PRACTICAL_CONTEXT = `## SITUASINYA
Dia minta nasihat praktis. Mulai dari prinsip Alkitab yang relevan, lalu beri saran yang realistis dan bisa dia lakukan. Jangan menghakimi pilihannya. Kalau ini sebenarnya urusan medis, hukum, atau keuangan detail, katakan terus terang bahwa itu di luar wilayahmu dan arahkan ke profesional.`;
