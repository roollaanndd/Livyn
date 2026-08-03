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

const FALLBACK_QUERIES = [
  "beautiful mountain landscape",
  "serene nature scenery",
  "dramatic sunset landscape",
  "peaceful lake mountains",
  "majestic waterfall nature",
  "starry night sky mountains",
  "misty forest morning",
  "ocean horizon sunrise",
];

function getSearchQuery(verseText: string): string {
  const lower = verseText.toLowerCase();
  for (const [keyword, queries] of Object.entries(VERSE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return queries[Math.floor(Math.random() * queries.length)];
    }
  }
  return FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)];
}

async function fetchFromPexels(query: string, apiKey: string): Promise<Response | null> {
  const page = Math.floor(Math.random() * 5) + 1;
  try {
    const searchRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&size=large&per_page=15&page=${page}`,
      { headers: { Authorization: apiKey } },
    );

    if (!searchRes.ok) {
      console.error("[verse-image] Pexels search failed:", searchRes.status);
      return null;
    }

    const data = await searchRes.json();
    const photos = data.photos;

    if (!photos || photos.length === 0) return null;

    const photo = photos[Math.floor(Math.random() * photos.length)];
    // large2x keeps enough resolution to fill 1080x1920 without upscaling;
    // src.portrait is only 800x1200 and would come out soft.
    const imageUrl = photo.src.large2x || photo.src.original || photo.src.large;

    return await passThroughImage(await fetch(imageUrl));
  } catch (e) {
    console.error("[verse-image] Pexels exception:", e);
    return null;
  }
}

/**
 * An error page or rate-limit notice served with a 200 would reach the client
 * and blow up in `createImageBitmap` as an opaque failure. Only pass through
 * responses that really are images, so a bad source falls to the next one.
 */
async function passThroughImage(imgRes: Response): Promise<Response | null> {
  if (!imgRes.ok) return null;

  const contentType = imgRes.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) return null;

  const imgBuf = await imgRes.arrayBuffer();
  if (imgBuf.byteLength < 1024) return null; // placeholder / empty payload

  return new Response(imgBuf, {
    headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
  });
}

async function fetchFromLoremFlickr(query: string, seed: number): Promise<Response | null> {
  try {
    // LoremFlickr supports tag-based image search, no API key needed.
    const tags = query.replace(/\s+/g, ",");
    const url = `https://loremflickr.com/1080/1920/${encodeURIComponent(tags)}?lock=${seed}`;
    return await passThroughImage(await fetch(url, { redirect: "follow" }));
  } catch (e) {
    console.error("[verse-image] LoremFlickr exception:", e);
    return null;
  }
}

async function fetchFromPicsum(seed: number): Promise<Response | null> {
  try {
    const url = `https://picsum.photos/seed/livyn${seed}/1080/1920`;
    return await passThroughImage(await fetch(url, { redirect: "follow" }));
  } catch (e) {
    console.error("[verse-image] Picsum exception:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const limited = await rateLimit(`verse-img:${session.sub}`, 15, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429 },
    );
  }

  const { text, ref } = await req.json();
  if (!text || !ref) {
    return NextResponse.json({ error: "text and ref are required" }, { status: 400 });
  }

  const query = getSearchQuery(text);
  // Random seed on every request so each generate produces a fresh background.
  const seed = Math.floor(Math.random() * 1_000_000_000);

  // Try Pexels first if configured
  if (process.env.PEXELS_API_KEY) {
    const pexelsRes = await fetchFromPexels(query, process.env.PEXELS_API_KEY.trim());
    if (pexelsRes) return pexelsRes;
    console.warn("[verse-image] Pexels failed, falling back to LoremFlickr");
  }

  // Fallback: LoremFlickr (themed, no key needed)
  const loremRes = await fetchFromLoremFlickr(query, seed);
  if (loremRes) return loremRes;

  // Last resort: Picsum (random but consistent per verse)
  const picsumRes = await fetchFromPicsum(seed);
  if (picsumRes) return picsumRes;

  return NextResponse.json(
    { error: "Gagal membuat gambar. Semua sumber gambar tidak tersedia." },
    { status: 502 },
  );
}
