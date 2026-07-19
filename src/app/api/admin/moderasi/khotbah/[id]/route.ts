import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canModerate } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";

const schema = z.object({ action: z.enum(["approve", "reject"]), reason: z.string().max(500).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !canModerate(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const sermon = await prisma.sermon.update({
    where: { id },
    data:
      parsed.data.action === "approve"
        ? { status: "published", publishDate: new Date(), rejectReason: null }
        : { status: "rejected", rejectReason: parsed.data.reason ?? "Tidak memenuhi pedoman konten" },
  });

  await prisma.moderationAction.create({
    data: { moderatorId: session.sub, targetType: "sermon", targetId: id, action: parsed.data.action, reason: parsed.data.reason },
  });
  await logAudit({ userId: session.sub, action: `moderation.sermon_${parsed.data.action}`, targetType: "sermon", targetId: id });

  return NextResponse.json({ sermon });
}
