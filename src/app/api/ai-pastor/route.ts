import { NextRequest } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type ModelMessage } from "ai";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildSystemPrompt,
  AI_PASTOR_MODEL,
  AI_PASTOR_MAX_TOKENS,
  AI_PASTOR_TEMPERATURE,
} from "@/lib/ai-pastor/guidelines";
import { classifyIntent, getIntentContext } from "@/lib/ai-pastor/intent";
import { getRelevantVerses } from "@/lib/ai-pastor/doctrine";
import { checkSafety } from "@/lib/ai-pastor/safety";

export const maxDuration = 30;

// The Authorization header is built from this env var. If the pasted key
// contains any non-printable-ASCII character (invisible unicode, arrows,
// newlines from copy-paste), fetch throws "Cannot convert argument to a
// ByteString" — so strip everything outside 0x21-0x7E defensively.
const RAW_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OPENROUTER_KEY = RAW_KEY.replace(/[^\x21-\x7E]/g, "");
// If stripping changed the key, the stored value is corrupted — after
// stripping it is a DIFFERENT string than the real key, so auth WILL fail.
const KEY_IS_CORRUPTED = RAW_KEY.trim() !== "" && OPENROUTER_KEY !== RAW_KEY.trim();

const openrouter = createOpenAI({
  apiKey: OPENROUTER_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Strip characters > 0x7F (non-ASCII) that some AI SDK / runtime paths can
// accidentally push into HTTP headers, causing WebIDL ByteString errors.
// Indonesian text is essentially pure ASCII so meaning is preserved.
function toAsciiSafe(text: string): string {
  return text
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/↓/g, "v")
    .replace(/↑/g, "^")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/‘/g, "'")
    .replace(/’/g, "'")
    .replace(/…/g, "...")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]/gu, "")
    .replace(/[^\x00-\x7F]/g, "");
}

function sanitizeModelMessages(messages: ModelMessage[]): ModelMessage[] {
  return messages.map((m) => {
    if (typeof m.content === "string") {
      return { ...m, content: toAsciiSafe(m.content) } as ModelMessage;
    }
    if (Array.isArray(m.content)) {
      const cleaned = m.content.map((part) => {
        if (part.type === "text" && typeof part.text === "string") {
          return { ...part, text: toAsciiSafe(part.text) };
        }
        return part;
      });
      return { ...m, content: cleaned } as ModelMessage;
    }
    return m;
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Silakan login terlebih dahulu." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const limited = rateLimit(`ai-pastor:${session.sub}`, 60, 60 * 60 * 1000);
  if (!limited.ok) {
    return new Response(
      JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi dalam beberapa menit." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!OPENROUTER_KEY) {
    return new Response(
      JSON.stringify({ error: "AI Pastor belum tersedia. Admin perlu mengkonfigurasi OPENROUTER_API_KEY di environment variables." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  if (KEY_IS_CORRUPTED) {
    return new Response(
      JSON.stringify({
        error:
          "API key OpenRouter di Vercel mengandung karakter tak terlihat (rusak saat copy-paste). Hapus OPENROUTER_API_KEY di Vercel, salin ulang key dengan tombol Copy di openrouter.ai/keys, tambahkan lagi, lalu redeploy.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Format permintaan tidak valid." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { messages } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: "Messages diperlukan." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // --- PIPELINE: Intent Engine -> Context Injection -> LLM -> Safety Filter ---

  const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
  const lastUserText = (() => {
    if (!lastUserMsg) return "";
    if (Array.isArray(lastUserMsg.parts)) {
      return lastUserMsg.parts
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { text?: string }) => p.text || "")
        .join(" ");
    }
    if (typeof lastUserMsg.content === "string") return lastUserMsg.content;
    if (Array.isArray(lastUserMsg.content)) {
      return lastUserMsg.content
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { text?: string }) => p.text || "")
        .join(" ");
    }
    return "";
  })();

  const intent = classifyIntent(lastUserText);
  const intentContext = getIntentContext(intent);
  const verseContext = getRelevantVerses(lastUserText);
  const systemPrompt = toAsciiSafe(buildSystemPrompt(intentContext, verseContext));

  const inputCheck = checkSafety(lastUserText);
  if (!inputCheck.safe) {
    console.warn(`[ai-pastor] Input blocked: ${inputCheck.reason}`);
  }

  try {
    const converted = await convertToModelMessages(messages);
    const modelMessages = sanitizeModelMessages(converted);
    const result = streamText({
      model: openrouter(AI_PASTOR_MODEL),
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: AI_PASTOR_MAX_TOKENS,
      temperature: AI_PASTOR_TEMPERATURE,
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("[ai-pastor] Stream error:", error);
        if (error == null) return "AI Pastor mengalami gangguan.";
        if (typeof error === "string") return error;
        if (error instanceof Error) {
          const msg = error.message;
          const lower = msg.toLowerCase();
          console.error("[ai-pastor] Error message:", msg);
          console.error("[ai-pastor] Error stack:", error.stack);
          if (msg.includes("401") || lower.includes("unauthorized") || lower.includes("auth")) {
            return "API key OpenRouter tidak valid atau ditolak. Hapus OPENROUTER_API_KEY di Vercel, salin ulang dengan tombol Copy di openrouter.ai/keys, lalu redeploy.";
          }
          if (msg.includes("402") || lower.includes("credits") || lower.includes("insufficient")) {
            return "Kredit OpenRouter tidak cukup. Top-up di openrouter.ai atau ganti ke model gratis.";
          }
          if (msg.includes("429") || lower.includes("rate limit")) {
            return "OpenRouter kena rate limit. Tunggu beberapa saat lalu coba lagi.";
          }
          if (msg.includes("404") || lower.includes("not found") || lower.includes("no endpoints")) {
            return "Model AI tidak tersedia di OpenRouter. Coba model lain.";
          }
          if (lower.includes("bytestring") || lower.includes("bytes")) {
            return "Terjadi konflik encoding pada permintaan. Silakan coba lagi.";
          }
          if (lower.includes("timeout") || lower.includes("timed out")) {
            return "AI Pastor terlalu lama merespons. Coba lagi.";
          }
          return `AI Pastor gagal: ${msg.slice(0, 200)}`;
        }
        return "AI Pastor mengalami gangguan yang tidak diketahui.";
      },
    });
  } catch (e) {
    console.error("[ai-pastor] Sync error:", e);
    const message = e instanceof Error ? e.message : "Gagal memproses permintaan.";
    return new Response(
      JSON.stringify({ error: `AI Pastor gagal: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
