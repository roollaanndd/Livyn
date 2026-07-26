import { createOpenAI } from "@ai-sdk/openai";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";

/**
 * Shared OpenRouter wiring for every AI Pastor feature (chat + journal
 * reflection).
 *
 * Background: the app used to hard-code a single model slug
 * (`meta-llama/llama-4-maverick:free`). OpenRouter retired that free variant
 * and started answering every request with HTTP 404 ("This model is
 * unavailable for free"), which took AI Pastor and the journal reflection
 * offline at the same time. Free slugs rotate regularly, so pinning exactly
 * one of them is guaranteed to break again.
 *
 * This module makes model selection self-healing in two independent ways:
 *
 *  1. `resolveModelChain()` asks OpenRouter which models actually exist right
 *     now and keeps only the candidates that are currently listed and free.
 *  2. `openrouterChat()` additionally hands OpenRouter its native `models`
 *     routing array, so if the primary fails mid-request the OpenRouter side
 *     transparently retries the next one — this covers streaming too.
 */

// The Authorization header is built from this env var. If the pasted key
// contains any non-printable-ASCII character (invisible unicode, arrows,
// newlines from copy-paste), fetch throws "Cannot convert argument to a
// ByteString" — so strip everything outside 0x21-0x7E defensively.
const RAW_KEY = process.env.OPENROUTER_API_KEY ?? "";

export const OPENROUTER_KEY = RAW_KEY.replace(/[^\x21-\x7E]/g, "");

// If stripping changed the key, the stored value is corrupted — after
// stripping it is a DIFFERENT string than the real key, so auth WILL fail.
export const KEY_IS_CORRUPTED =
  RAW_KEY.trim() !== "" && OPENROUTER_KEY !== RAW_KEY.trim();

export const HAS_OPENROUTER_KEY = OPENROUTER_KEY.length > 0;

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const CATALOGUE_URL = `${OPENROUTER_BASE_URL}/models`;

/**
 * Preferred free models, best first. These are only *candidates* — anything
 * OpenRouter no longer lists is dropped at runtime by `resolveModelChain()`,
 * so a retired slug degrades to the next entry instead of breaking the app.
 *
 * Override with the `AI_PASTOR_MODEL` env var (comma-separated for several).
 */
export const AI_PASTOR_MODEL_CANDIDATES = [
  // Plain instruction-tuned models first. Reasoning-first models narrate their
  // planning, and even with reasoning.exclude set that scratchpad can arrive as
  // ordinary prose — which reads as the pastor talking to itself. Ordered so
  // the chattier ones are only reached if the calm ones are unavailable.
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "inclusionai/ling-3.0-flash:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "openai/gpt-oss-20b:free",
  // OpenRouter's own auto-router across whatever is free right now — the
  // safety net if every named slug above is eventually retired too.
  "openrouter/free",
];

const ENV_MODELS = (process.env.AI_PASTOR_MODEL ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function dedupe(models: string[]): string[] {
  return [...new Set(models)];
}

/** Candidate list before it is checked against the live catalogue. */
export function candidateModels(): string[] {
  return dedupe([...ENV_MODELS, ...AI_PASTOR_MODEL_CANDIDATES]);
}

/**
 * Backwards-compatible single-model export. Prefer `resolveModelChain()` —
 * this is only the unverified first choice.
 */
export const AI_PASTOR_MODEL = candidateModels()[0];

// --- Live catalogue ---------------------------------------------------------

interface CatalogueModel {
  id: string;
  context_length?: number | null;
  pricing?: { prompt?: string; completion?: string };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

/**
 * Models that exist and are free but are useless as a pastoral chat backend:
 * music/speech/image generation, embeddings, rerankers, safety classifiers and
 * code-completion models. OpenRouter's free tier is full of these and several
 * advertise enormous context windows, so they out-rank real chat models unless
 * they are excluded by name as well as by modality.
 */
const UNSUITABLE_ID =
  /embed|rerank|whisper|tts|speech|audio|music|lyria|imagen|image|video|veo|moderation|content-safety|guard|-code|coder|laguna/i;

/**
 * Reasoning-first models. They are capable, but they spend their output budget
 * thinking and are the ones most likely to leak a scratchpad into a pastoral
 * reply. A warm two-paragraph answer does not need them.
 */
const REASONING_ID = /reasoning|thinking|deepseek-r1|\br1\b|-o[1-4]\b|qwq/i;

const MIN_CONTEXT_LENGTH = 8000;

/**
 * OpenRouter rejects a `models` fallback array longer than three entries
 * ("'models' array must have 3 items or fewer."), so the chain is capped here.
 */
const MAX_CHAIN_LENGTH = 3;

const SUCCESS_TTL_MS = 10 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;
const CATALOGUE_TIMEOUT_MS = 6000;

let cachedChain: { models: string[]; expiresAt: number } | null = null;
let inflight: Promise<string[]> | null = null;

function isFree(model: CatalogueModel): boolean {
  const prompt = Number(model.pricing?.prompt ?? "0");
  const completion = Number(model.pricing?.completion ?? "0");
  return (
    Number.isFinite(prompt) &&
    Number.isFinite(completion) &&
    prompt === 0 &&
    completion === 0
  );
}

/** Accepts a text prompt and answers with text — i.e. usable for chat. */
function isTextToText(model: CatalogueModel): boolean {
  const outputs = model.architecture?.output_modalities;
  const inputs = model.architecture?.input_modalities;

  if (Array.isArray(outputs) && outputs.length > 0 && !outputs.includes("text")) {
    return false;
  }
  if (Array.isArray(inputs) && inputs.length > 0 && !inputs.includes("text")) {
    return false;
  }

  // Legacy field looks like "text+image->text".
  const modality = model.architecture?.modality;
  if (typeof modality === "string" && modality.includes("->")) {
    const [input, output] = modality.split("->");
    return input.includes("text") && output.includes("text");
  }
  return true;
}

function isUsable(model: CatalogueModel): boolean {
  return (
    !UNSUITABLE_ID.test(model.id) &&
    !REASONING_ID.test(model.id) &&
    isTextToText(model) &&
    (model.context_length ?? MIN_CONTEXT_LENGTH) >= MIN_CONTEXT_LENGTH
  );
}

async function fetchCatalogue(): Promise<CatalogueModel[] | null> {
  try {
    const res = await fetch(CATALOGUE_URL, {
      headers: OPENROUTER_KEY
        ? { Authorization: `Bearer ${OPENROUTER_KEY}` }
        : undefined,
      signal: AbortSignal.timeout(CATALOGUE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[ai-pastor] Model catalogue fetch failed: ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { data?: CatalogueModel[] };
    return Array.isArray(json.data) ? json.data : null;
  } catch (e) {
    console.warn("[ai-pastor] Model catalogue unreachable:", e);
    return null;
  }
}

async function buildChain(): Promise<string[]> {
  const candidates = candidateModels();
  const catalogue = await fetchCatalogue();

  // Catalogue unreachable — fall back to the static preference list and
  // re-check again soon rather than caching a guess for ten minutes.
  if (!catalogue) {
    cachedChain = { models: candidates, expiresAt: Date.now() + FAILURE_TTL_MS };
    return candidates;
  }

  const byId = new Map(catalogue.map((m) => [m.id, m]));

  const verified = candidates.filter((id) => {
    const model = byId.get(id);
    return model != null && isFree(model) && isUsable(model);
  });

  // Every hand-picked slug is gone. Rather than fail, pick whatever free
  // chat models OpenRouter currently offers, largest context first.
  const discovered = catalogue
    .filter((m) => !candidates.includes(m.id) && isFree(m) && isUsable(m))
    .sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0))
    .map((m) => m.id);

  const chain = dedupe([...verified, ...discovered]).slice(0, MAX_CHAIN_LENGTH);

  if (chain.length === 0) {
    console.warn("[ai-pastor] No free model available in OpenRouter catalogue");
    cachedChain = { models: candidates, expiresAt: Date.now() + FAILURE_TTL_MS };
    return candidates;
  }

  if (verified.length === 0) {
    console.warn(
      `[ai-pastor] All preferred models retired; using discovered: ${chain.join(", ")}`,
    );
  }

  cachedChain = { models: chain, expiresAt: Date.now() + SUCCESS_TTL_MS };
  return chain;
}

/**
 * Ordered list of models to try, verified against OpenRouter's live catalogue.
 * Cached in module memory; never throws.
 */
export async function resolveModelChain(): Promise<string[]> {
  if (cachedChain && cachedChain.expiresAt > Date.now()) return cachedChain.models;
  if (inflight) return inflight;

  inflight = buildChain().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Drop the cached chain so the next request re-checks the catalogue. */
export function invalidateModelChain(): void {
  cachedChain = null;
}

// --- Provider ---------------------------------------------------------------

/**
 * OpenRouter accepts a `models` array alongside `model` and walks it in order
 * when a model errors. Injecting it via a wrapped `fetch` gives us server-side
 * fallback for streaming requests too, which the AI SDK cannot retry itself.
 */
function fetchWithOpenRouterOptions(chain: string[]): typeof fetch {
  return async (input, init) => {
    if (init?.method === "POST" && typeof init.body === "string") {
      try {
        const body = JSON.parse(init.body);
        if (body && typeof body === "object" && "model" in body) {
          if (chain.length > 1) body.models = chain;
          // Ask OpenRouter to leave reasoning tokens out of the response.
          // Without this, thinking-capable models stream their scratchpad
          // straight into the reply the user sees.
          body.reasoning = { exclude: true };
          init = { ...init, body: JSON.stringify(body) };
        }
      } catch {
        // Body is not JSON we understand — send it through untouched.
      }
    }
    return fetch(input, init);
  };
}

/**
 * Language model for the given chain (first entry is the primary). Use
 * `resolveModelChain()` to build the chain.
 */
export function openrouterChat(chain: string[]) {
  const models = chain.length > 0 ? chain : candidateModels();
  const provider = createOpenAI({
    apiKey: OPENROUTER_KEY,
    baseURL: OPENROUTER_BASE_URL,
    // OpenRouter attributes traffic with these and applies friendlier free-tier
    // limits to identified apps.
    headers: {
      "HTTP-Referer": "https://livyn-six.vercel.app",
      "X-Title": "Livyn",
    },
    fetch: fetchWithOpenRouterOptions(models),
  });

  // .chat() forces the /chat/completions endpoint — the SDK's default
  // Responses API (/responses) is not supported by OpenRouter.
  //
  // The middleware pulls <think>...</think> out of the text stream and into
  // reasoning parts, which the UI does not render. Belt and braces with
  // reasoning.exclude above: that covers models whose reasoning OpenRouter
  // knows how to strip, this covers models that just inline the tags.
  return wrapLanguageModel({
    model: provider.chat(models[0]),
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  });
}

// --- Error reporting --------------------------------------------------------

/** True when the failure means "this model is gone", not "the request was bad". */
export function isModelUnavailableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    message.includes("404") ||
    lower.includes("unavailable for free") ||
    lower.includes("no endpoints") ||
    lower.includes("not a valid model") ||
    lower.includes("model not found")
  );
}

/**
 * Indonesian, user-facing explanation for an OpenRouter failure. Also drops the
 * cached model chain when the cause is a retired model, so the next attempt
 * re-resolves against the live catalogue instead of repeating the failure.
 */
export function describeOpenRouterError(message: string): string {
  const lower = message.toLowerCase();

  if (isModelUnavailableError(message)) {
    invalidateModelChain();
    return "Model AI sedang tidak tersedia di OpenRouter. Kami sudah mencari model pengganti - silakan coba kirim ulang pesanmu.";
  }
  if (message.includes("401") || lower.includes("unauthorized")) {
    return "API key OpenRouter tidak valid atau ditolak. Hapus OPENROUTER_API_KEY di Vercel, salin ulang dengan tombol Copy di openrouter.ai/keys, lalu redeploy.";
  }
  if (message.includes("402") || lower.includes("credit") || lower.includes("insufficient")) {
    return "Kredit OpenRouter tidak cukup. Top-up di openrouter.ai atau gunakan model gratis.";
  }
  if (message.includes("429") || lower.includes("rate limit")) {
    return "Batas pemakaian gratis OpenRouter tercapai. Tunggu beberapa saat lalu coba lagi.";
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborted")) {
    return "AI Pastor terlalu lama merespons. Coba lagi.";
  }
  if (lower.includes("bytestring") || lower.includes("bytes")) {
    return "Terjadi konflik encoding pada permintaan. Silakan coba lagi.";
  }
  return `AI Pastor gagal: ${message.slice(0, 200)}`;
}
