import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true, name: true, email: true, role: true, avatarUrl: true,
      themePreference: true, fontSize: true, emailVerified: true,
    },
  });

  return NextResponse.json({ user });
}
