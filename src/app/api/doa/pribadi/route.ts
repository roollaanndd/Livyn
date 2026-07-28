import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { personalPrayerSchema } from "@/lib/validation/personal-prayer";

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const where =
    status === "open" || status === "answered"
      ? { userId: session.sub, status }
      : { userId: session.sub };

  const prayers = await prisma.personalPrayer
    .findMany({ where, orderBy: { createdAt: "desc" } })
    .catch(() => []);
  return NextResponse.json({ prayers });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  const parsed = personalPrayerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }

  try {
    const prayer = await prisma.personalPrayer.create({
      data: {
        userId: session.sub,
        title: parsed.data.title,
        body: parsed.data.body ?? null,
        status: "open",
      },
    });
    return NextResponse.json({ prayer });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan doa" }, { status: 503 });
  }
}
