import { NextRequest } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  AI_PASTOR_SYSTEM_PROMPT,
  AI_PASTOR_MODEL,
  AI_PASTOR_MAX_TOKENS,
  AI_PASTOR_TEMPERATURE,
} from "@/lib/ai-pastor/guidelines";

export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
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

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI Pastor belum tersedia. Admin perlu mengkonfigurasi GOOGLE_GENERATIVE_AI_API_KEY di environment variables." }),
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

  try {
    const result = streamText({
      model: google(AI_PASTOR_MODEL),
      system: AI_PASTOR_SYSTEM_PROMPT,
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
