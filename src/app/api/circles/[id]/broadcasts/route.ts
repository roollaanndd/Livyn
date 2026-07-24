import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { broadcastSchema } from "@/lib/validation/community";
import { getMyCircleRole, listCircleBroadcasts } from "@/lib/queries/community";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const role = await getMyCircleRole(id, session.sub);
  if (!role) return NextResponse.json({ error: "Bukan anggota" }, { status: 403 });

  const broadcasts = await listCircleBroadcasts(id, 20);
  return NextResponse.json({ broadcasts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id } = await params;
  const role = await getMyCircleRole(id, session.sub);
  if (role !== "leader") return NextResponse.json({ error: "Hanya pemimpin circle" }, { status: 403 });

  const parsed = broadcastSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const broadcast = await prisma.circleBroadcast.create({
    data: {
      circleId: id,
      createdById: session.sub,
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body,
      bibleRefs: parsed.data.bibleRefs || null,
      sundayDate: parsed.data.sundayDate ? new Date(parsed.data.sundayDate) : null,
    },
  });

  return NextResponse.json({ broadcast });
}
