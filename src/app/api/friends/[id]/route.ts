import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  const { id: otherId } = await params;

  // Remove any friendship rows either way.
  const rows = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: session.sub, addresseeId: otherId },
        { requesterId: otherId, addresseeId: session.sub },
      ],
    },
    select: { id: true },
  });

  for (const r of rows) {
    await prisma.friendship.delete({ where: { id: r.id } });
  }

  return NextResponse.json({ ok: true });
}
