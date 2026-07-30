import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canModerate, isAdmin, outranks, ROLES } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

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

  if (parsed.data.role === undefined && parsed.data.status === undefined) {
    return NextResponse.json({ error: "Tidak ada perubahan yang dikirim" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });

  // Authority runs strictly downward. Without this a moderator could suspend an
  // admin, and an admin could demote a super_admin or a peer — the account being
  // acted on must sit below the account acting.
  if (!outranks(session.role, target.role)) {
    return NextResponse.json(
      { error: "Tidak dapat mengubah akun dengan peran setara atau lebih tinggi" },
      { status: 403 },
    );
  }

  // Only admins (and above) may change roles; moderators may only
  // suspend/reinstate accounts (status).
  if (parsed.data.role !== undefined && !isAdmin(session.role)) {
    return NextResponse.json({ error: "Hanya admin yang dapat mengubah peran pengguna" }, { status: 403 });
  }

  // A role may only be granted below the granter's own, so nobody can create a
  // peer or a superior. This subsumes the old "only Super Admin may assign
  // Super Admin" rule and closes the same hole one rank down.
  if (parsed.data.role !== undefined && !outranks(session.role, parsed.data.role)) {
    return NextResponse.json(
      { error: "Tidak dapat menetapkan peran setara atau lebih tinggi dari peranmu" },
      { status: 403 },
    );
  }

  const user = await prisma.user.update({ where: { id }, data: parsed.data });
  await logAudit({
    userId: session.sub,
    action: "admin.user_updated",
    targetType: "user",
    targetId: id,
    metadata: { ...parsed.data, previousRole: target.role },
    ipAddress: clientIp(req.headers),
  });

  return NextResponse.json({ user });
}
