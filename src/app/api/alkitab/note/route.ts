import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const upsertSchema = z.object({
  bookCode: z.string().min(1).max(10),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  text: z.string().trim().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const body = upsertSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const { bookCode, chapter, verse, text } = body.data;
  const existing = await prisma.note.findFirst({ where: { userId: session.sub, bookCode, chapter, verse } });

  const note = existing
    ? await prisma.note.update({ where: { id: existing.id }, data: { text } })
    : await prisma.note.create({ data: { userId: session.sub, bookCode, chapter, verse, text } });

  return NextResponse.json({ note });
}

const deleteSchema = z.object({ id: z.string() });

export async function DELETE(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const body = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  await prisma.note.deleteMany({ where: { id: body.data.id, userId: session.sub } });
  return NextResponse.json({ ok: true });
}
