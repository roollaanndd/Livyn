import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

async function assertOwnership(userId: string, id: string) {
  const entry = await prisma.journalEntry.findUnique({ where: { id } });
  return entry && entry.userId === userId ? entry : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(session.sub, id);
  if (!owned) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: { suggestedVerse: { include: { book: true } } },
  });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const { id } = await params;
  const owned = await assertOwnership(session.sub, id);
  if (!owned) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  await prisma.journalEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
