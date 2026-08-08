import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/supabase-rest";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin, canModerate, hasRole, ROLES, type Role } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  role: z.enum(ROLES).optional(),
  status: z.enum(["active", "suspended", "banned"]).optional(),
});

const RANK: Record<Role, number> = {
  user: 0,
  contributor: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !canModerate(session.role)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

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

  // Cross-level protection: the target must be STRICTLY below the caller's
  // rank. Otherwise a compromised admin could demote another admin or the
  // super_admin to `user` and lock the org out of its own moderation.
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
  const callerRank = RANK[session.role as Role] ?? 0;
  const targetRank = RANK[target.role as Role] ?? 0;
  if (targetRank >= callerRank) {
    return NextResponse.json(
      { error: "Tidak dapat mengubah pengguna dengan peran setara atau lebih tinggi" },
      { status: 403 },
    );
  }

  // And the assigned new role must also be strictly below the caller's rank
  // — no elevating anyone to your own tier or above. Existing check for
  // super_admin promotion stays as an extra belt.
  if (parsed.data.role !== undefined) {
    const newRank = RANK[parsed.data.role as Role] ?? 0;
    if (newRank >= callerRank && !hasRole(session.role, "super_admin")) {
      return NextResponse.json(
        { error: "Tidak dapat menetapkan peran setara atau lebih tinggi dari peranmu" },
        { status: 403 },
      );
    }
    if (parsed.data.role === "super_admin" && session.role !== "super_admin") {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat menetapkan peran Super Admin" },
        { status: 403 },
      );
    }
  }

  const user = await prisma.user.update({ where: { id }, data: parsed.data });

  // Any change to role or status kicks the target off every existing
  // session so the new privilege level takes effect immediately instead of
  // waiting up to 15 min for the access-token JWT to expire.
  if (parsed.data.role !== undefined || parsed.data.status !== undefined) {
    await db.session.revokeOtherSessions(id, null).catch(() => {});
  }

  await logAudit({
    userId: session.sub,
    action: "admin.user_updated",
    targetType: "user",
    targetId: id,
    metadata: parsed.data,
  });

  return NextResponse.json({ user });
}
