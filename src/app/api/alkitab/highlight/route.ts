import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const schema = z.object({
  bookCode: z.string().min(1).max(10),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  color: z.string().default("gold"),
});

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const { bookCode, chapter, verse, color } = body.data;
  const existing = await prisma.highlight.findUnique({
    where: { userId_bookCode_chapter_verse: { userId: session.sub, bookCode, chapter, verse } },
  });

  if (existing) {
    await prisma.highlight.delete({ where: { id: existing.id } });
    return NextResponse.json({ highlighted: false });
  }

  await prisma.highlight.create({ data: { userId: session.sub, bookCode, chapter, verse, color } });
  return NextResponse.json({ highlighted: true });
}
