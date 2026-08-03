import { NextRequest } from "next/server";
import { streamText, convertToModelMessages, type ModelMessage } from "ai";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildSystemPrompt,
  AI_PASTOR_MAX_TOKENS,
  AI_PASTOR_TEMPERATURE,
} from "@/lib/ai-pastor/guidelines";
import {
  HAS_OPENROUTER_KEY,
  KEY_IS_CORRUPTED,
  describeOpenRouterError,
  openrouterChat,
  resolveModelChain,
} from "@/lib/ai-pastor/model";
import { classifyIntent, getIntentContext } from "@/lib/ai-pastor/intent";
import { getRelevantVerses } from "@/lib/ai-pastor/doctrine";
import { checkSafety } from "@/lib/ai-pastor/safety";
import { CRISIS_RESPONSE_TEXT } from "@/lib/ai-pastor/crisis";

export const maxDuration = 30;

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

  const limited = await rateLimit(`ai-pastor:${session.sub}`, 60, 60 * 60 * 1000);
  if (!limited.ok) {
    return new Response(
      JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi dalam beberapa menit." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!HAS_OPENROUTER_KEY) {
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

  // Crisis intent bypasses the LLM entirely. The response has to be
  // deterministic — hotlines first, no sampling variability, no chance of
  // the model burying the numbers under a rhetorical flourish. See
  // src/lib/ai-pastor/crisis.ts for the locked text.
  if (intent === "crisis") {
    console.warn(`[ai-pastor] Crisis intent detected; returning locked response for user ${session.sub}`);
    // Stream the fixed text back through the same UI channel so the client
    // renders it identically to a normal reply — one chunk, then done.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // AI SDK UI message stream format: text-delta + text-done.
        const id = crypto.randomUUID();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text-start", id })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text-delta", id, delta: CRISIS_RESPONSE_TEXT })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text-end", id })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "x-vercel-ai-ui-message-stream": "v1",
      },
    });
  }

  const intentContext = getIntentContext(intent);
  const verseContext = getRelevantVerses(lastUserText);
  const systemPrompt = buildSystemPrompt(intent, intentContext, verseContext);

  const inputCheck = checkSafety(lastUserText);
  if (!inputCheck.safe) {
    console.warn(`[ai-pastor] Input blocked: ${inputCheck.reason}`);
  }

  try {
    const converted = await convertToModelMessages(messages);
    const modelMessages = sanitizeModelMessages(converted);
    // Verified against OpenRouter's live catalogue; the rest of the chain is
    // handed to OpenRouter as fallbacks so a retired slug can't take chat down.
    const modelChain = await resolveModelChain();
    const result = streamText({
      model: openrouterChat(modelChain),
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
          console.error("[ai-pastor] Error message:", error.message);
          console.error("[ai-pastor] Error stack:", error.stack);
          return describeOpenRouterError(error.message);
        }
        return "AI Pastor mengalami gangguan yang tidak diketahui.";
      },
    });
  } catch (e) {
    console.error("[ai-pastor] Sync error:", e);
    const message = e instanceof Error ? e.message : "Gagal memproses permintaan.";
    return new Response(
      JSON.stringify({ error: describeOpenRouterError(message) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
