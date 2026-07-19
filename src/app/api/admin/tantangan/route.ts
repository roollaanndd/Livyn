import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { readingChallengeSchema } from "@/lib/validation/challenge";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const challenges = await prisma.readingChallenge.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { _count: { select: { progress: true } } },
  });
  return NextResponse.json({ challenges });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const parsed = readingChallengeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  if (parsed.data.chapterTo < parsed.data.chapterFrom) {
    return NextResponse.json({ error: "Pasal akhir harus setelah pasal awal" }, { status: 400 });
  }

  const book = await prisma.bibleBook.findUnique({ where: { code: parsed.data.bookCode } });
  if (!book) return NextResponse.json({ error: "Kitab tidak ditemukan" }, { status: 400 });

  const existing = await prisma.readingChallenge.findUnique({
    where: { month_year: { month: parsed.data.month, year: parsed.data.year } },
  });
  if (existing) return NextResponse.json({ error: "Tantangan untuk bulan ini sudah ada" }, { status: 409 });

  const challenge = await prisma.readingChallenge.create({ data: parsed.data });
  await logAudit({ userId: session.sub, action: "admin.challenge_created", targetType: "ReadingChallenge", targetId: challenge.id });

  return NextResponse.json({ challenge });
}
