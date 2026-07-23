import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const VERSE_KEYWORDS: Record<string, string[]> = {
  kasih: ["sunset landscape", "golden hour nature", "warm sunrise meadow"],
  cinta: ["sunset landscape", "golden hour nature", "warm sunrise meadow"],
  damai: ["calm lake mountains", "peaceful valley", "serene forest lake"],
  sejahtera: ["calm lake mountains", "peaceful valley", "serene forest lake"],
  terang: ["sunrise mountains", "light rays forest", "golden sunbeam"],
  cahaya: ["sunrise mountains", "light rays forest", "golden sunbeam"],
  kuasa: ["dramatic mountain peaks", "storm clouds landscape", "majestic waterfall"],
  kuat: ["dramatic mountain peaks", "storm clouds landscape", "majestic waterfall"],
  pengharapan: ["dawn sky", "sunrise over ocean", "morning mist valley"],
  harapan: ["dawn sky", "sunrise over ocean", "morning mist valley"],
  sukacita: ["bright meadow flowers", "sunlit valley", "beautiful garden landscape"],
  iman: ["mountain summit", "starry night sky", "vast landscape horizon"],
  percaya: ["mountain summit", "starry night sky", "vast landscape horizon"],
  doa: ["peaceful morning nature", "quiet forest path", "misty mountains"],
  berkat: ["lush green valley", "beautiful waterfall nature", "abundant nature scenery"],
  perlindungan: ["sheltered valley mountains", "fortress rock landscape", "strong cliff ocean"],
  takut: ["peaceful calm waters", "gentle sunrise", "still lake reflection"],
  cemas: ["peaceful calm waters", "gentle sunrise", "still lake reflection"],
  salib: ["dramatic sky clouds", "sunset cross silhouette landscape", "dramatic golden hour"],
  yesus: ["beautiful dramatic sky", "glorious sunrise landscape", "majestic nature scenery"],
  tuhan: ["majestic mountain landscape", "vast sky panorama", "awe inspiring nature"],
};

function getSearchQuery(verseText: string): string {
  const lower = verseText.toLowerCase();

  for (const [keyword, queries] of Object.entries(VERSE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return queries[Math.floor(Math.random() * queries.length)];
    }
  }

  const fallback = [
    "beautiful mountain landscape",
    "serene nature scenery",
    "dramatic sunset landscape",
    "peaceful lake mountains",
    "majestic waterfall nature",
    "starry night sky mountains",
    "misty forest morning",
    "ocean horizon sunrise",
  ];
  return fallback[Math.floor(Math.random() * fallback.length)];
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

  if (!process.env.PEXELS_API_KEY) {
    return NextResponse.json(
      { error: "PEXELS_API_KEY belum dikonfigurasi di server." },
      { status: 503 },
    );
  }

  const { text, ref } = await req.json();
  if (!text || !ref) {
    return NextResponse.json({ error: "text and ref are required" }, { status: 400 });
  }

  const query = getSearchQuery(text);
  const page = Math.floor(Math.random() * 5) + 1;

  const apiKey = process.env.PEXELS_API_KEY!.trim();

  try {
    const searchRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=square&size=large&per_page=15&page=${page}`,
      {
        headers: { Authorization: apiKey },
      },
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("[verse-image] Pexels search failed:", searchRes.status, errText);
      if (searchRes.status === 401 || searchRes.status === 403) {
        return NextResponse.json(
          { error: "API key Pexels tidak valid. Periksa konfigurasi server." },
          { status: 502 },
        );
      }
      return NextResponse.json(
        { error: "Gagal mencari gambar. Coba lagi." },
        { status: 502 },
      );
    }

    const data = await searchRes.json();
    const photos = data.photos;

    if (!photos || photos.length === 0) {
      const fallbackRes = await fetch(
        `https://api.pexels.com/v1/search?query=beautiful+nature+landscape&orientation=square&size=large&per_page=15`,
        { headers: { Authorization: apiKey } },
      );
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData.photos?.length > 0) {
          const photo = fallbackData.photos[Math.floor(Math.random() * fallbackData.photos.length)];
          const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;
          const imgRes = await fetch(imageUrl);
          if (imgRes.ok) {
            const imgBuf = await imgRes.arrayBuffer();
            const contentType = imgRes.headers.get("content-type") || "image/jpeg";
            return new Response(imgBuf, {
              headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
            });
          }
        }
      }
      return NextResponse.json(
        { error: "Tidak ditemukan gambar yang cocok. Coba lagi." },
        { status: 404 },
      );
    }

    const photo = photos[Math.floor(Math.random() * photos.length)];
    const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Gagal mengunduh gambar. Coba lagi." },
        { status: 502 },
      );
    }

    const imgBuf = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";

    return new Response(imgBuf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[verse-image] Exception:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal membuat gambar." },
      { status: 500 },
    );
  }
}
