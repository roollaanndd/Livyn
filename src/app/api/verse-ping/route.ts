import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { versePingSchema } from "@/lib/validation/community";
import { areFriends, listReceivedVersePings } from "@/lib/queries/community";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const pings = await listReceivedVersePings(session.sub, 30);
  return NextResponse.json({ pings });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });

  // 20 verse pings per hour is plenty for genuine use — well below spam.
  const limit = rateLimit(`verse-ping:${session.sub}`, 20, 60 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "Terlalu banyak kiriman. Coba lagi nanti." }, { status: 429 });

  const parsed = versePingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const { toUserId, verseRef, verseText, note } = parsed.data;

  if (toUserId === session.sub)
    return NextResponse.json({ error: "Tidak bisa mengirim ke diri sendiri" }, { status: 400 });

  const isFriend = await areFriends(session.sub, toUserId);
  if (!isFriend) return NextResponse.json({ error: "Hanya bisa kirim ke teman" }, { status: 403 });

  const ping = await prisma.versePing.create({
    data: {
      fromUserId: session.sub,
      toUserId,
      verseRef,
      verseText,
      note: note || null,
    },
  });

  return NextResponse.json({ ping });
}
