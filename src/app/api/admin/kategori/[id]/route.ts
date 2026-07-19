import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id } = await params;
  await prisma.category.delete({ where: { id } }).catch(() => {});
  await logAudit({ userId: session.sub, action: "admin.category_deleted", targetType: "category", targetId: id });

  return NextResponse.json({ ok: true });
}
