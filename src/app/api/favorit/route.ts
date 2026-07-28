import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { favoriteVerseSchema } from "@/lib/validation/favorite";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const favorites = await prisma.favoriteVerse
    .findMany({ where: { userId: session.sub }, orderBy: { createdAt: "desc" } })
    .catch(() => []);
  return NextResponse.json({ favorites });
}

/** Toggle: saves the verse, or removes it if this user already saved it.
 * One endpoint keeps the bookmark button a single request either way. */
export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const parsed = favoriteVerseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const { bookCode, bookName, chapter, verse, text, note } = parsed.data;

  try {
    const existing = await prisma.favoriteVerse.findFirst({
      where: { userId: session.sub, bookCode, chapter, verse },
      select: { id: true },
    });

    if (existing) {
      await prisma.favoriteVerse.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    const favorite = await prisma.favoriteVerse.create({
      data: { userId: session.sub, bookCode, bookName, chapter, verse, text, note: note ?? null },
    });
    return NextResponse.json({ favorited: true, favorite });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan ayat" }, { status: 503 });
  }
}
