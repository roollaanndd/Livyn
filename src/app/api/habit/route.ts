import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jakartaHour, recordHour } from "@/lib/habit";

/** Records that this member opened the app in the current hour. The client
 * sends at most one of these per hour (see HabitBeacon), so the read-modify-
 * write below is cheap and a lost race just drops one sample. */
export async function POST() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { habitHours: true },
    });
    if (!user) return NextResponse.json({ ok: false }, { status: 404 });

    await prisma.user.update({
      where: { id: session.sub },
      data: { habitHours: recordHour(user.habitHours, jakartaHour()) },
    });
  } catch {
    // Never surface this: it is background telemetry for one convenience
    // feature, not something worth interrupting the member over.
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
