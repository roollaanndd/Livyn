import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { memberLimitFor } from "@/lib/community/permissions";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role))
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const profile = await prisma.leaderProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "Aplikasi tidak ditemukan" }, { status: 404 });

  if (parsed.data.action === "approve") {
    await prisma.$transaction(async (tx) => {
      await tx.leaderProfile.update({
        where: { id },
        data: {
          verified: true,
          verifiedAt: new Date(),
          verifiedById: session.sub,
          rejectReason: null,
        },
      });
      // Grant "leader" role on the user record — do not downgrade admins.
      const user = await tx.user.findUnique({ where: { id: profile.userId }, select: { role: true } });
      if (user && user.role !== "admin" && user.role !== "super_admin") {
        await tx.user.update({ where: { id: profile.userId }, data: { role: "leader" } });
      }
      // Bump the member limit on any existing pastoral circles they own.
      const circles = await tx.circle.findMany({ where: { ownerId: profile.userId } });
      for (const c of circles) {
        await tx.circle.update({
          where: { id: c.id },
          data: { type: "pastoral", memberLimit: memberLimitFor("pastoral") },
        });
      }
    });
    await logAudit({ userId: session.sub, action: "admin.leader_approved", targetType: "LeaderProfile", targetId: id });
    return NextResponse.json({ ok: true });
  }

  await prisma.leaderProfile.update({
    where: { id },
    data: {
      verified: false,
      rejectReason: parsed.data.reason ?? "Tidak memenuhi kriteria",
    },
  });
  await logAudit({ userId: session.sub, action: "admin.leader_rejected", targetType: "LeaderProfile", targetId: id });
  return NextResponse.json({ ok: true });
}
