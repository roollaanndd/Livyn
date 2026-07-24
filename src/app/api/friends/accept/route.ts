import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({ code: z.string().trim().min(4).max(20) });

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Kode tidak valid" }, { status: 400 });
  const code = parsed.data.code.toUpperCase();

  const invite = await prisma.friendInviteCode.findUnique({ where: { code } });
  if (!invite) return NextResponse.json({ error: "Kode tidak ditemukan" }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: "Kode sudah dipakai" }, { status: 410 });
  if (invite.expiresAt && invite.expiresAt < new Date())
    return NextResponse.json({ error: "Kode kadaluarsa" }, { status: 410 });
  if (invite.userId === session.sub)
    return NextResponse.json({ error: "Kode milikmu sendiri" }, { status: 400 });

  // Prevent duplicate friendships in either direction.
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: invite.userId, addresseeId: session.sub },
        { requesterId: session.sub, addresseeId: invite.userId },
      ],
    },
    select: { id: true },
  });

  if (!existing) {
    await prisma.friendship.create({
      data: { requesterId: invite.userId, addresseeId: session.sub, status: "accepted" },
    });
  }

  // Reusable codes stay valid — do NOT mark as used, since one user may share
  // their code with multiple friends. Only expiry gates the code.

  const friend = await prisma.user.findUnique({
    where: { id: invite.userId },
    select: { id: true, name: true, avatarUrl: true },
  });

  return NextResponse.json({ friend });
}
