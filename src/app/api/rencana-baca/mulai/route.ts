import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const limited = await rateLimit(`plan-enroll:${session.sub}`, 20, 60 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const planId = body?.planId;
  if (typeof planId !== "string") return NextResponse.json({ error: "planId diperlukan" }, { status: 400 });

  const plan = await prisma.readingPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Rencana tidak ditemukan" }, { status: 404 });

  const existing = await prisma.readingPlanEnrollment.findUnique({
    where: { userId_planId: { userId: session.sub, planId } },
  });
  if (existing) return NextResponse.json({ error: "Kamu sudah mengikuti rencana ini" }, { status: 409 });

  const enrollment = await prisma.readingPlanEnrollment.create({
    data: { userId: session.sub, planId },
  });

  return NextResponse.json({ ok: true, enrollment });
}
