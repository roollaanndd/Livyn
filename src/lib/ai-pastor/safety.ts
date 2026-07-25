interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  filtered?: string;
}

const BLOCKED_PATTERNS = [
  { pattern: /pasti\s+masuk\s+neraka/gi, reason: "menghakimi keselamatan orang lain" },
  { pattern: /agama\s+(islam|hindu|buddha|konghucu)\s+(salah|sesat|kafir)/gi, reason: "menghina agama lain" },
  { pattern: /bunuh|membunuh|bakar|hancurkan\s+(orang|mereka|kaum)/gi, reason: "mengandung kekerasan" },
  { pattern: /(partai|caleg|calon|pilih|coblos)\s+(nomor|urut)/gi, reason: "politik praktis" },
  { pattern: /minum\s+obat\s+ini|resep\s+obat|diagnosis/gi, reason: "nasihat medis" },
];

const SENSITIVE_REPLACEMENTS = [
  {
    pattern: /kamu\s+harus\s+(masuk\s+gereja|pindah\s+gereja|ikut\s+denominasi)\s+(\w+)/gi,
    replacement: "kamu bisa berdiskusi dengan gembala atau pendeta kepercayaanmu tentang hal ini",
  },
];

export function checkSafety(text: string): SafetyCheckResult {
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
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
