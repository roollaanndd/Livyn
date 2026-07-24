import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { listPendingLeaderApplications } from "@/lib/queries/community";

export async function GET() {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role))
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const applications = await listPendingLeaderApplications();
  return NextResponse.json({ applications });
}
