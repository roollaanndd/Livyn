import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  HAS_OPENROUTER_KEY,
  KEY_IS_CORRUPTED,
  describeOpenRouterError,
  openrouterChat,
  resolveModelChain,
} from "@/lib/ai-pastor/model";
import { PASTOR_VOICE, PASTOR_VOICE_REMINDER, sanitizeReply } from "@/lib/ai-pastor/voice";
import { MOOD_META } from "@/lib/journal/mood-meta";

export const maxDuration = 30;

const REFLECTION_SYSTEM_PROMPT = [
  PASTOR_VOICE,
  `## SITUASINYA
Dia baru saja menulis jurnal - curhatan pribadi kepada Tuhan. Dia tidak sedang bertanya, jadi jangan menjawab seperti menjawab pertanyaan.

Bacalah betul-betul apa yang dia tulis, lalu tanggapi hal yang spesifik dari ceritanya sehingga terasa dia benar-benar didengar. Jangan generik.

Mulai dari perasaannya, bukan dari ayat. Sebut kembali apa yang dia alami dengan katamu sendiri dulu. Baru setelah itu, kalau memang pas, satu ayat yang menyentuh persoalannya - bukan ayat yang sekadar cocok temanya.

Tutup dengan doa yang sangat pendek untuknya, atau satu kalimat penguat. Pilih salah satu, jangan dua-duanya.

Jangan menghakimi apa pun yang dia tulis, apa pun isinya.

Kalau yang dia tulis berat - kehilangan, depresi, putus asa - akui dulu beratnya dan jangan buru-buru menutupnya dengan penghiburan. Kalau ada tanda krisis yang serius, sarankan dengan lembut untuk bicara dengan gembala atau konselor, dan sebutkan Hotline Kemenkes 119 ext. 8.`,
  PASTOR_VOICE_REMINDER,
].join("\n\n");

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  const limited = await rateLimit(`journal-reflect:${session.sub}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
  }

  if (!HAS_OPENROUTER_KEY) {
    return NextResponse.json(
      { error: "Refleksi AI belum tersedia. Admin perlu mengkonfigurasi OPENROUTER_API_KEY." },
      { status: 503 },
    );
  }

  if (KEY_IS_CORRUPTED) {
    return NextResponse.json(
      { error: "API key OpenRouter rusak (karakter tak terlihat dari copy-paste). Paste ulang di Vercel lalu redeploy." },
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

  // Verified against OpenRouter's live catalogue; the rest of the chain is
  // handed to OpenRouter as fallbacks so a retired slug can't break reflection.
  const modelChain = await resolveModelChain();

  try {
    const result = await generateText({
      model: openrouterChat(modelChain),
      system: REFLECTION_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 450,
      temperature: 0.8,
    });

    const reflection = sanitizeReply(result.text);
    if (!reflection) {
      return NextResponse.json({ error: "AI tidak memberikan respons. Coba lagi." }, { status: 502 });
    }

    return NextResponse.json({ reflection });
  } catch (e) {
    console.error("[jurnal-refleksi] Error:", e);
    const msg = e instanceof Error ? e.message : "Gagal membuat refleksi.";
    return NextResponse.json({ error: describeOpenRouterError(msg) }, { status: 502 });
  }
}
