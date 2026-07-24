import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { AI_PASTOR_MODEL } from "@/lib/ai-pastor/guidelines";
import { MOOD_META } from "@/lib/journal/mood-meta";

export const maxDuration = 30;

const OPENROUTER_KEY = (process.env.OPENROUTER_API_KEY ?? "").replace(/[^\x21-\x7E]/g, "");

const openrouter = createOpenAI({
  apiKey: OPENROUTER_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const REFLECTION_SYSTEM_PROMPT = `Kamu adalah AI Pastor dari aplikasi Livyn - pendamping rohani Kristen yang hangat dan penuh kasih.

Pengguna baru saja menulis jurnal / curhatan pribadi kepada Tuhan. Tugasmu adalah merespons curhatan itu seperti seorang kakak rohani yang benar-benar peduli dan mendengarkan.

ATURAN:
1. Respons harus PERSONAL - tanggapi hal-hal spesifik yang mereka tulis, jangan generik.
2. Mulai dengan validasi perasaan mereka. Tunjukkan bahwa kamu benar-benar membaca ceritanya.
3. Gunakan bahasa Indonesia sehari-hari yang hangat, panggil dengan "kamu". Jangan kaku atau menggurui.
4. Sertakan SATU ayat Alkitab yang relevan dengan pergumulan mereka, dengan format: "teks ayat" - Kitab Pasal:Ayat
5. Akhiri dengan doa singkat (2-3 kalimat) untuk mereka, atau kalimat penguat.
6. Panjang total: 2-3 paragraf pendek. Jangan bertele-tele.
7. JANGAN menghakimi apapun yang mereka tulis. Kasih dulu, selalu.
8. Jika mereka menulis hal berat (kehilangan, depresi, putus asa), akui beratnya - jangan buru-buru ke "solusi rohani". Jika ada tanda krisis serius, sarankan dengan lembut untuk bicara dengan gembala atau konselor, dan sertakan hotline Kemenkes 119 ext 8.`;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  const limited = rateLimit(`journal-reflect:${session.sub}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
  }

  if (!OPENROUTER_KEY) {
    return NextResponse.json(
      { error: "Refleksi AI belum tersedia. Admin perlu mengkonfigurasi OPENROUTER_API_KEY." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const entry = await prisma.journalEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== session.sub) {
    return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
  }

  const moodLabel = entry.mood ? MOOD_META[entry.mood as keyof typeof MOOD_META]?.label : null;
  const userPrompt = [
    moodLabel ? `Perasaan yang dipilih: ${moodLabel}` : null,
    entry.title ? `Judul: ${entry.title}` : null,
    `Isi curhatan:\n${entry.body}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const result = await generateText({
      model: openrouter(AI_PASTOR_MODEL),
      system: REFLECTION_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 600,
      temperature: 0.8,
    });

    const reflection = result.text.trim();
    if (!reflection) {
      return NextResponse.json({ error: "AI tidak memberikan respons. Coba lagi." }, { status: 502 });
    }

    return NextResponse.json({ reflection });
  } catch (e) {
    console.error("[jurnal-refleksi] Error:", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("401")) {
      return NextResponse.json({ error: "API key OpenRouter tidak valid." }, { status: 502 });
    }
    if (msg.includes("402") || msg.toLowerCase().includes("credit")) {
      return NextResponse.json({ error: "Kredit OpenRouter tidak cukup." }, { status: 502 });
    }
    if (msg.includes("429")) {
      return NextResponse.json({ error: "Layanan AI sedang sibuk. Coba lagi sebentar." }, { status: 502 });
    }
    return NextResponse.json({ error: "Gagal membuat refleksi. Coba lagi." }, { status: 502 });
  }
}
