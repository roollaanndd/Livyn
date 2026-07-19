import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-rest";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  try {
    const user = await db.user.findById(session.sub);

    if (!user) return NextResponse.json({ user: null }, { status: 200 });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        themePreference: user.themePreference,
        fontSize: user.fontSize,
        emailVerified: user.emailVerified,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
