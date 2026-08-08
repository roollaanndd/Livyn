import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { prayerRequestSchema } from "@/lib/validation/community";
import { getMyCircleRole, listCirclePrayers } from "@/lib/queries/community";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const role = await getMyCircleRole(id, session.sub);
  if (!role) return NextResponse.json({ error: "Bukan anggota circle" }, { status: 403 });

  const prayers = await listCirclePrayers(id, session.sub);
  return NextResponse.json({ prayers });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const role = await getMyCircleRole(id, session.sub);
  if (!role) return NextResponse.json({ error: "Bukan anggota circle" }, { status: 403 });

  const parsed = prayerRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const prayer = await prisma.prayerRequest.create({
    data: {
      circleId: id,
      userId: session.sub,
      title: parsed.data.title,
      body: parsed.data.body || null,
      isAnonymous: parsed.data.isAnonymous,
      status: "open",
    },
  });

  return NextResponse.json({ prayer });
}
