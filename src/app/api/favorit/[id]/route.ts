import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { favoriteNoteSchema } from "@/lib/validation/favorite";

async function ownedFavorite(id: string, userId: string) {
  const favorite = await prisma.favoriteVerse
    .findUnique({ where: { id }, select: { id: true, userId: true } })
    .catch(() => null);
  if (!favorite || favorite.userId !== userId) return null;
  return favorite;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  if (!(await ownedFavorite(id, session.sub))) {
    return NextResponse.json({ error: "Ayat tidak ditemukan" }, { status: 404 });
  }

  const parsed = favoriteNoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const favorite = await prisma.favoriteVerse.update({
    where: { id },
    data: { note: parsed.data.note },
  });
  return NextResponse.json({ favorite });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  if (!(await ownedFavorite(id, session.sub))) {
    return NextResponse.json({ error: "Ayat tidak ditemukan" }, { status: 404 });
  }

  await prisma.favoriteVerse.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
