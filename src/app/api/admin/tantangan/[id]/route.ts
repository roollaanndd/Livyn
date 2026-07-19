import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({ active: z.boolean().optional(), description: z.string().trim().max(500).optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const challenge = await prisma.readingChallenge.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!challenge) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  await logAudit({ userId: session.sub, action: "admin.challenge_updated", targetType: "ReadingChallenge", targetId: id });
  return NextResponse.json({ challenge });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id } = await params;
  await prisma.readingChallenge.delete({ where: { id } }).catch(() => null);
  await logAudit({ userId: session.sub, action: "admin.challenge_deleted", targetType: "ReadingChallenge", targetId: id });
  return NextResponse.json({ ok: true });
}
