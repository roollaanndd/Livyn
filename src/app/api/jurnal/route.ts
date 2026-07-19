import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { journalEntrySchema } from "@/lib/validation/journal";
import { matchVerse } from "@/lib/journal/verse-matcher";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

  const entries = await prisma.journalEntry.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 20,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { suggestedVerse: { include: { book: true } } },
  });

  return NextResponse.json({ entries, nextCursor: entries.length === 20 ? entries[entries.length - 1].id : null });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const ip = clientIp(req.headers);
  const limited = rateLimit(`journal-create:${session.sub}`, 30, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak catatan dalam waktu singkat. Coba lagi nanti." }, { status: 429 });
  }

  const parsed = journalEntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }

  const { title, body, mood } = parsed.data;
  const match = matchVerse(body, mood);
  const suggestedVerse = await prisma.bibleVerse.findFirst({
    where: { book: { code: match.ref.book }, chapter: match.ref.chapter, verse: match.ref.verse },
  });

  const entry = await prisma.journalEntry.create({
    data: {
      userId: session.sub,
      title,
      body,
      mood,
      suggestedVerseId: suggestedVerse?.id,
      suggestedVerseNote: match.note,
    },
    include: { suggestedVerse: { include: { book: true } } },
  });

  await logAudit({ userId: session.sub, action: "journal.create", targetType: "JournalEntry", targetId: entry.id, ipAddress: ip });

  return NextResponse.json({ entry });
}
