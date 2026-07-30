import { CORE_DOCTRINES, DENOMINATIONAL_SENSITIVITY } from "./doctrine";
import { getCrisisResources, sensitiveTopicReminder } from "./safety";
import { PASTOR_VOICE, PASTOR_VOICE_REMINDER } from "./voice";
import type { IntentType } from "./intent";

/**
 * Always-on theological guardrail. This is a boundary, not a curriculum — the
 * full doctrinal reference is only loaded when the user actually asks a
 * doctrinal question (see buildSystemPrompt).
 */
const DOCTRINE_GUARDRAIL = `## PEGANGAN
Alkitab Protestan (66 kitab, Terjemahan Baru). Allah Tritunggal. Yesus sepenuhnya Allah dan sepenuhnya manusia, mati dan bangkit. Keselamatan oleh anugerah melalui iman, bukan perbuatan.
Kamu tidak memihak denominasi mana pun. Kalau sebuah topik memang berbeda pandangan antar denominasi, katakan apa adanya secara singkat lalu arahkan ke gembala di gerejanya.`;

const BOUNDARIES = `## BATAS
Jangan membahas politik praktis, konflik antaragama atau antarsuku, diagnosis dan resep medis, nasihat hukum, nasihat investasi spesifik, okultisme, atau konten seksual eksplisit. Jangan pernah menghakimi keselamatan seseorang atau merendahkan agama lain.
Kalau diminta hal-hal itu, tolak dengan lembut dalam satu kalimat, lalu tawarkan bantuan yang memang bisa kamu berikan.`;

/**
 * Builds the system prompt for one turn.
 *
 * Kept deliberately small: the situational context and the deep doctrinal
 * reference are loaded only for the intents that need them. A short prompt is
 * what keeps the reply short, plain and in Indonesian — the free models this
 * app runs on start mirroring long policy text back at the user.
 */
export function buildSystemPrompt(
  intent: IntentType,
  intentContext: string,
  verseContext: string,
  sensitiveReason?: string,
): string {
  const sections = [PASTOR_VOICE, DOCTRINE_GUARDRAIL, BOUNDARIES];

  // The full doctrine and denominational reference is long. It earns its place
  // only when the question is actually about doctrine.
  if (intent === "doctrine_question") {
    sections.push(CORE_DOCTRINES, DENOMINATIONAL_SENSITIVITY);
  }

  if (intent === "crisis") {
    sections.push(getCrisisResources());
  } else if (sensitiveReason) {
    // Crisis wins: someone in crisis needs the hotline numbers and warmth, not
    // a reminder about topics to sidestep.
    sections.push(sensitiveTopicReminder(sensitiveReason));
  }

  sections.push(intentContext, verseContext, PASTOR_VOICE_REMINDER);

  return toAsciiSafe(sections.filter(Boolean).join("\n\n"));
}

// Defensive: strip characters > 0x7F (non-Latin-1) that some SDK/runtime paths
// can accidentally shove into HTTP headers (causing WebIDL ByteString errors).
// Common substitutes preserved so meaning stays intact for Indonesian text.
function toAsciiSafe(text: string): string {
  return text
    .replace(/—/g, "-")   // em dash
    .replace(/–/g, "-")   // en dash
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/↓/g, "v")   // root cause of an earlier ByteString bug
    .replace(/↑/g, "^")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/‘/g, "'")
    .replace(/’/g, "'")
    .replace(/…/g, "...")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]/gu, "") // emoji + variation selector
    .replace(/[^\x00-\x7F]/g, ""); // belt and braces
}

// Model selection lives in ./model.ts — it is resolved against OpenRouter's
// live catalogue instead of being pinned to one slug that can be retired.
export { AI_PASTOR_MODEL } from "./model";

/**
 * Roughly 120 words of Indonesian plus headroom to finish a sentence cleanly.
 *
 * This was 1000, then 700 — both far more than the voice prompt asks for, and a
 * generous budget is itself an invitation to ramble. Small models tend to fill
 * the space they are given, so the ceiling has to agree with the brief.
 */
export const AI_PASTOR_MAX_TOKENS = 400;

/**
 * Lowered from 0.7: at that setting replies wandered off the question and
 * picked up filler. Still warm enough not to sound canned.
 */
export const AI_PASTOR_TEMPERATURE = 0.55;
