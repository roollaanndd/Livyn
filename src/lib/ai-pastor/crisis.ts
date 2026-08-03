/**
 * Deterministic crisis response.
 *
 * Before Phase 4 the pipeline was: classify intent → build "crisis" system
 * prompt asking the LLM to be gentle and mention hotlines → hope the LLM
 * complies. LLMs sometimes don't — a bad sampling, a jailbreak in the
 * conversation history, an overwrought reply that buries the numbers.
 * For actual suicidal ideation this is unacceptable.
 *
 * This module returns a locked, tested response the moment crisis intent
 * is detected. No LLM call happens, no sampling variability, and the
 * hotlines are guaranteed to be first.
 *
 * The numbers below are Indonesian mental-health / crisis lines. Verify
 * annually — hotlines rebrand. Never remove one without an equivalent
 * replacement.
 */

export const CRISIS_RESPONSE_TEXT = `Rasa sakitmu nyata, dan aku turut merasakannya. Terima kasih sudah mengatakannya di sini — itu bukan hal kecil.

Kalau kamu sedang berpikir untuk menyakiti diri, tolong hubungi salah satu ini sekarang:

**Hotline & Bantuan Krisis (Indonesia)**

- **Kementerian Kesehatan — 119 ext. 8** (24 jam, gratis, dari HP apa pun)
- **Into The Light Indonesia — 119 ext. 8** (pencegahan bunuh diri)
- **LSM Jangan Bunuh Diri — 021-9696-9293** (hotline dukungan)
- **SEJIWA — 119 ext. 8** (curhat, dukungan mental)

Atau kalau ada gembala, konselor, atau seseorang yang kamu percaya — hubungi dia sekarang juga. Kamu tidak perlu menanggung ini sendirian.

Setelah kamu aman, aku di sini untuk mendengarkan sebanyak yang kamu mau. Kamu berharga di mata Tuhan, dan hidupmu berarti.`;

export function buildCrisisResponsePayload(): { role: "assistant"; content: string; parts: Array<{ type: "text"; text: string }> } {
  return {
    role: "assistant",
    content: CRISIS_RESPONSE_TEXT,
    parts: [{ type: "text", text: CRISIS_RESPONSE_TEXT }],
  };
}
