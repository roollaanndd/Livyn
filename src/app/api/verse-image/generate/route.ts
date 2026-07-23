import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
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
      { error: "OPENAI_API_KEY belum dikonfigurasi." },
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

  try {
    const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!dalleRes.ok) {
      const err = await dalleRes.text();
      console.error("DALL-E error:", err);
      return NextResponse.json({ error: "Gagal membuat gambar." }, { status: 502 });
    }

    const dalleData = await dalleRes.json();
    const imageUrl: string = dalleData.data[0].url;

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Gagal mengambil gambar." }, { status: 502 });
    }

    const imgBuf = await imgRes.arrayBuffer();

    return new Response(imgBuf, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Verse image generation error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
