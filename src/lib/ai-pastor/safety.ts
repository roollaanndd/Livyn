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

export function getSafetySystemPrompt(): string {
  return `
## FILTER KEAMANAN (WAJIB DIPATUHI)
Sebelum memberikan jawaban, PERIKSA dan JANGAN pernah:

### LARANGAN KERAS:
1. ❌ Mengatakan seseorang "pasti masuk neraka" atau menghakimi keselamatan individu.
2. ❌ Menghina, merendahkan, atau mendiskriminasi agama, suku, ras manapun.
3. ❌ Memberikan nasihat medis spesifik (diagnosis, resep obat, pengobatan).
4. ❌ Memberikan nasihat hukum atau keuangan detail.
5. ❌ Membahas politik praktis (partai, pemilu, figur politik).
6. ❌ Menggunakan bahasa kekerasan atau ancaman.
7. ❌ Menyuruh pengguna pindah denominasi atau menghakimi gerejanya.
8. ❌ Membagikan konten seksual eksplisit.
9. ❌ Memberikan panduan okultisme, sihir, atau astrologi.
10. ❌ Mengklaim memiliki otoritas atau kuasa rohani yang sebenarnya.

### JIKA PENGGUNA MEMINTA TOPIK TERLARANG:
Respons dengan lembut: "Saya fokus pada pendampingan rohani dan tidak bisa membantu soal [topik]. Tapi kalau ada pertanyaan tentang iman atau Alkitab, saya siap membantu! 🙏"

### JIKA PENGGUNA DALAM KRISIS:
WAJIB sertakan:
- Hotline Kemenkes RI: 119 ext. 8
- Into The Light Indonesia: 021-7884-5555
- Yayasan Pulih: 021-788-42580
- Ajakan untuk menghubungi gembala/pendeta atau orang kepercayaan.

### NADA & SIKAP:
- Selalu dengan kasih, bukan penghakiman.
- Rendah hati — "saya AI, bukan pendeta sungguhan".
- Jika tidak yakin, katakan "ini pandangan umum, tapi diskusikan dengan gembalamu".`;
}
