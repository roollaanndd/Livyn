import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

async function generateImage(
  apiKey: string,
  prompt: string,
  model: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const body: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
    size: "1024x1024",
  };
  if (model === "dall-e-3") {
    body.quality = "standard";
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `${model} error (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      msg = parsed?.error?.message ?? msg;
    } catch {
      // use default msg
    }
    return { ok: false, error: msg };
  }

  const data = await res.json();
  return { ok: true, url: data.data[0].url };
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const limited = rateLimit(`verse-img:${session.sub}`, 15, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY belum dikonfigurasi di server." },
      { status: 503 },
    );
  }

  const { text, ref } = await req.json();
  if (!text || !ref) {
    return NextResponse.json({ error: "text and ref are required" }, { status: 400 });
  }

  const prompt = [
    "A breathtaking, serene landscape photograph suitable as a Bible verse background.",
    `The scene should evoke the spiritual mood and theme of this verse: "${text}" (${ref}).`,
    "Style: cinematic photography, ethereal natural lighting, dramatic sky.",
    "Beautiful nature: mountains, valleys, lakes, forests, sunsets, sunrise, starry night sky, ocean, meadows, or waterfalls.",
    "The image should have a slightly dark, moody, atmospheric quality with rich deep colors,",
    "making it suitable for overlaying white text.",
    "No text, no words, no letters, no numbers, no watermarks, no people, no animals in the image.",
    "Ultra high quality, photorealistic, 4K cinematic feel.",
  ].join(" ");

  const apiKey = process.env.OPENAI_API_KEY;
  const models = ["gpt-image-1", "dall-e-3", "dall-e-2"];
  let lastError = "";

  for (const model of models) {
    try {
      const result = await generateImage(apiKey, prompt, model);
      if (!result.ok) {
        console.error(`[verse-image] ${model} failed:`, result.error);
        lastError = result.error;
        continue;
      }

      const imgRes = await fetch(result.url);
      if (!imgRes.ok) {
        lastError = "Gagal mengunduh gambar dari OpenAI.";
        continue;
      }

      const imgBuf = await imgRes.arrayBuffer();
      return new Response(imgBuf, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      console.error(`[verse-image] ${model} exception:`, e);
      lastError = e instanceof Error ? e.message : "Unknown error";
      continue;
    }
  }

  return NextResponse.json({ error: lastError || "Semua model gagal." }, { status: 502 });
}
