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

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const probe = new URL(req.url).searchParams.get("probe");
  const out: Record<string, unknown> = {
    hasKey: HAS_OPENROUTER_KEY,
    keyCorrupted: KEY_IS_CORRUPTED,
    candidates: candidateModels(),
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
    const all = json.data ?? [];
    const free = all.filter((m) => {
      const p = m.pricing as { prompt?: string; completion?: string } | undefined;
      return Number(p?.prompt ?? "1") === 0 && Number(p?.completion ?? "1") === 0;
    });
    out.freeModelDetail = free.map((m) => ({
      id: m.id,
      ctx: m.context_length,
      arch: m.architecture,
      supported: (m.supported_parameters as string[] | undefined)?.slice(0, 40),
    }));
  } catch (e) {
    out.catalogueError = e instanceof Error ? e.message : String(e);
  }

  out.resolvedChain = await resolveModelChain();

  // Probe specific models one at a time: ?probe=a,b,c
  if (probe) {
    const results: Record<string, unknown> = {};
    for (const id of probe.split(",").map((s) => s.trim()).filter(Boolean)) {
      try {
        const r = await generateText({
          model: openrouterChat([id]),
          system: "Kamu pendamping rohani Kristen berbahasa Indonesia.",
          prompt: "Sebutkan satu ayat Alkitab tentang damai sejahtera, lalu satu kalimat penguatan.",
          maxOutputTokens: 120,
        });
        results[id] = { ok: true, text: r.text.trim().slice(0, 300) };
      } catch (e) {
        results[id] = { ok: false, error: (e instanceof Error ? e.message : String(e)).slice(0, 300) };
      }
    }
    out.probe = results;
  }

  return NextResponse.json(out, { status: 200 });
}
