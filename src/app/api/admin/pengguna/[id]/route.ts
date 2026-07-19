import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin, canModerate, ROLES } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  role: z.enum(ROLES).optional(),
  status: z.enum(["active", "suspended", "banned"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !canModerate(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: "Tidak dapat mengubah peran/status akun sendiri" }, { status: 400 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  // Only admins (and above) may change roles; moderators may only
  // suspend/reinstate accounts (status).
  if (parsed.data.role !== undefined && !isAdmin(session.role)) {
    return NextResponse.json({ error: "Hanya admin yang dapat mengubah peran pengguna" }, { status: 403 });
  }

  if (parsed.data.role === "super_admin" && session.role !== "super_admin") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat menetapkan peran Super Admin" }, { status: 403 });
  }

  const user = await prisma.user.update({ where: { id }, data: parsed.data });
  await logAudit({ userId: session.sub, action: "admin.user_updated", targetType: "user", targetId: id, metadata: parsed.data });

  return NextResponse.json({ user });
}
