// TEMPORARY diagnostic endpoint — used to verify AI Pastor model resolution
// against the live OpenRouter catalogue from a deployed environment.
// Delete before merging.
import { NextResponse } from "next/server";
import { generateText } from "ai";
import {
  HAS_OPENROUTER_KEY,
  KEY_IS_CORRUPTED,
  candidateModels,
  openrouterChat,
  resolveModelChain,
} from "@/lib/ai-pastor/model";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {
    hasKey: HAS_OPENROUTER_KEY,
    keyCorrupted: KEY_IS_CORRUPTED,
    envModel: process.env.AI_PASTOR_MODEL ?? null,
    candidates: candidateModels(),
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const json = (await res.json()) as {
      data?: Array<{ id: string; context_length?: number; pricing?: { prompt?: string; completion?: string } }>;
    };
    const all = json.data ?? [];
    const free = all.filter(
      (m) => Number(m.pricing?.prompt ?? "1") === 0 && Number(m.pricing?.completion ?? "1") === 0,
    );
    out.catalogueStatus = res.status;
    out.totalModels = all.length;
    out.freeModels = free
      .sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0))
      .map((m) => `${m.id} (ctx ${m.context_length ?? "?"})`);
    out.candidatesAlive = candidateModels().filter((id) => free.some((m) => m.id === id));
  } catch (e) {
    out.catalogueError = e instanceof Error ? e.message : String(e);
  }

  try {
    const chain = await resolveModelChain();
    out.resolvedChain = chain;

    const result = await generateText({
      model: openrouterChat(chain),
      prompt: "Balas dengan satu kata: Damai",
      maxOutputTokens: 16,
    });
    out.liveCall = { ok: true, text: result.text.trim() };
  } catch (e) {
    out.liveCall = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json(out, { status: 200 });
}
