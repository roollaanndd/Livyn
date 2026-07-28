import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { TERMS_VERSION } from "@/lib/terms/config";

export async function POST() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  try {
    await prisma.user.update({
      where: { id: session.sub },
      data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION },
    });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan persetujuan" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, version: TERMS_VERSION });
}
