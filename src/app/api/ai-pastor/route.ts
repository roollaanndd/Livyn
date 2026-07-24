import { NextRequest } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
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

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  baseURL: "https://openrouter.ai/api/v1",
});

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

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI Pastor belum tersedia. Admin perlu mengkonfigurasi OPENROUTER_API_KEY di environment variables." }),
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

  // --- PIPELINE: Intent Engine → Context Injection → LLM → Safety Filter ---

  // 1. Extract last user message for intent classification
  const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
  const lastUserText = lastUserMsg?.content
    ? typeof lastUserMsg.content === "string"
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg.content)
        ? lastUserMsg.content
            .filter((p: { type: string }) => p.type === "text")
            .map((p: { text?: string }) => p.text || "")
            .join(" ")
        : ""
    : "";

  // 2. Intent Engine: classify the user's question type
  const intent = classifyIntent(lastUserText);

  // 3. Bible Knowledge Base + Doctrine Rules: inject relevant context
  const intentContext = getIntentContext(intent);
  const verseContext = getRelevantVerses(lastUserText);

  // 4. Build the full system prompt with all context
  const systemPrompt = buildSystemPrompt(intentContext, verseContext);

  // 5. Input safety check on user message
  const inputCheck = checkSafety(lastUserText);
  if (!inputCheck.safe) {
    console.warn(`[ai-pastor] Input blocked: ${inputCheck.reason}`);
  }

  try {
    // 6. LLM call via OpenRouter with context-enriched system prompt
    const result = streamText({
      model: openrouter(AI_PASTOR_MODEL),
      system: systemPrompt,
      messages,
      maxOutputTokens: AI_PASTOR_MAX_TOKENS,
      temperature: AI_PASTOR_TEMPERATURE,
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error("[ai-pastor] Error:", e);
    const message = e instanceof Error ? e.message : "Gagal memproses permintaan.";
    return new Response(
      JSON.stringify({ error: `AI Pastor mengalami gangguan: ${message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
