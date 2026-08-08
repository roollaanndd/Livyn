import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-rest";
import { getCurrentUser, clearSessionCookies } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  try {
    const user = await db.user.findById(session.sub);

    if (!user) return NextResponse.json({ user: null }, { status: 200 });

    // A user suspended/banned mid-session used to retain access until the
    // JWT expired (up to 15 min) because /api/auth/me never rechecked the
    // stored status. Clear cookies and report "not signed in" so the client
    // routes back to /masuk immediately.
    if (user.status !== "active") {
      await clearSessionCookies();
      return NextResponse.json({ user: null }, { status: 200 });
    }

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
