import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLeaderProfile } from "@/lib/queries/community";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Silakan login" }, { status: 401 });
  const profile = await getLeaderProfile(session.sub);
  return NextResponse.json({ profile });
}
