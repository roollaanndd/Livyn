interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  filtered?: string;
}

/**
 * Topics that need the reply handled carefully.
 *
 * These describe the *subject* of a message, not a verdict on the person
 * sending it — see checkSafety for why that distinction matters.
 */
const SENSITIVE_PATTERNS = [
  { pattern: /pasti\s+masuk\s+neraka/gi, reason: "menghakimi keselamatan orang lain" },
  { pattern: /agama\s+(islam|hindu|buddha|konghucu)\s+(salah|sesat|kafir)/gi, reason: "menghina agama lain" },
  // The alternation was ungrouped, so this arm read as `/bunuh/` on its own and
  // matched "bunuh diri" — the exact phrase a person in crisis uses. Grouping it
  // keeps the pattern on violence *towards others*, which is what it means.
  { pattern: /(bunuh|membunuh|bakar|hancurkan)\s+(orang|mereka|kaum)/gi, reason: "mengandung kekerasan" },
  { pattern: /(partai|caleg|calon|pilih|coblos)\s+(nomor|urut)/gi, reason: "politik praktis" },
  { pattern: /minum\s+obat\s+ini|resep\s+obat|diagnosis/gi, reason: "nasihat medis" },
];

const SENSITIVE_REPLACEMENTS = [
  {
    pattern: /kamu\s+harus\s+(masuk\s+gereja|pindah\s+gereja|ikut\s+denominasi)\s+(\w+)/gi,
    replacement: "kamu bisa berdiskusi dengan gembala atau pendeta kepercayaanmu tentang hal ini",
  },
];

/**
 * Flags a message as touching a sensitive topic.
 *
 * Deliberately not a gate. The caller used to compute this and throw it away,
 * and the obvious repair — refusing the request — would have been worse than the
 * dead code: someone writing about violence or medication is usually a person
 * who needs the pastoral reply, not a request to shut the conversation down. The
 * boundaries in the system prompt are what shape the answer; this only tells the
 * model which boundary is live this turn. See sensitiveTopicReminder.
 */
export function checkSafety(text: string): SafetyCheckResult {
  for (const { pattern, reason } of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return { safe: false, reason };
    }
  }

  let filtered = text;
  for (const { pattern, replacement } of SENSITIVE_REPLACEMENTS) {
    pattern.lastIndex = 0;
    filtered = filtered.replace(pattern, replacement);
  }

  return { safe: true, filtered };
}

/** Prompt section naming the boundary that this turn brushed against. */
export function sensitiveTopicReminder(reason: string): string {
  return `## PERHATIAN KHUSUS TURN INI
Pesan terakhir menyentuh hal yang sensitif (${reason}). Tanggapi orangnya dengan hangat dan jangan menghakimi, tapi jangan ikut masuk ke ranah itu: tolak bagian yang di luar batasmu dalam satu kalimat, lalu bantu apa yang memang bisa kamu bantu.`;
}

/**
 * Emergency contacts, injected only when the intent engine flags a crisis.
 * Everything else that used to live in the safety prompt is now covered more
 * briefly by the BATAS section in guidelines.ts — repeating it on every turn
 * made replies long and clinical.
 */
export function getCrisisResources(): string {
  return `## NOMOR YANG HARUS KAMU SEBUTKAN
Sertakan nomor ini dengan lembut, bukan sebagai daftar dingin:
- Hotline Kemenkes RI: 119 ext. 8
- Into The Light Indonesia: 021-7884-5555
- Yayasan Pulih: 021-788-42580`;
}
