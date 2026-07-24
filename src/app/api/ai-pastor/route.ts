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
  headers: {
    "HTTP-Referer": "https://livyn.app",
    "X-Title": "Livyn AI Pastor",
  },
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

  const intent = classifyIntent(lastUserText);
  const intentContext = getIntentContext(intent);
  const verseContext = getRelevantVerses(lastUserText);
  const systemPrompt = buildSystemPrompt(intentContext, verseContext);

  const inputCheck = checkSafety(lastUserText);
  if (!inputCheck.safe) {
    console.warn(`[ai-pastor] Input blocked: ${inputCheck.reason}`);
  }

  try {
    const result = streamText({
      model: openrouter(AI_PASTOR_MODEL),
      system: systemPrompt,
      messages,
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
          if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
            return "API key OpenRouter tidak valid. Periksa konfigurasi di Vercel.";
          }
          if (msg.includes("402") || msg.toLowerCase().includes("credits") || msg.toLowerCase().includes("insufficient")) {
            return "Kredit OpenRouter tidak cukup. Top-up di openrouter.ai atau ganti ke model gratis.";
          }
          if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
            return "OpenRouter kena rate limit. Tunggu beberapa saat lalu coba lagi.";
          }
          if (msg.includes("404") || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no endpoints")) {
            return "Model AI tidak tersedia di OpenRouter. Coba model lain.";
          }
          return `AI Pastor gagal: ${msg}`;
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
