import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { devotionSchema } from "@/lib/validation/content";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !hasRole(session.role, "contributor")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.devotion.findUnique({ where: { id } });
  if (!existing || existing.authorId !== session.sub) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }
  if (existing.status === "published") {
    return NextResponse.json({ error: "Renungan yang sudah terbit tidak dapat diubah langsung. Hubungi moderator." }, { status: 409 });
  }

  const parsed = devotionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const { submit, categoryId, ...data } = parsed.data;
  const devotion = await prisma.devotion.update({
    where: { id },
    data: { ...data, categoryId: categoryId || null, status: submit ? "pending" : "draft", rejectReason: null },
  });

  await logAudit({ userId: session.sub, action: "content.devotion_updated", targetType: "devotion", targetId: id });

  return NextResponse.json({ devotion });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !hasRole(session.role, "contributor")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.devotion.findUnique({ where: { id } });
  if (!existing || existing.authorId !== session.sub) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }
  if (existing.status === "published") {
    return NextResponse.json({ error: "Tidak dapat menghapus renungan yang sudah terbit." }, { status: 409 });
  }

  await prisma.devotion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
