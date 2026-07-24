import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/community/permissions";
import { listPendingLeaderApplications } from "@/lib/queries/community";
import { LeaderReviewPanel } from "@/components/admin/leader-review-panel";

export default async function AdminLeadersPage() {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) redirect("/app");

  const apps = await listPendingLeaderApplications();

  const applications = apps.map((a) => ({
    id: a.id,
    churchName: a.churchName,
    position: a.position,
    denomination: a.denomination,
    city: a.city,
    phone: a.phone,
    bio: a.bio,
    submittedAt: a.submittedAt.toISOString(),
    user: a.user,
  }));

  return (
    <div>
      <h1 className="font-display mb-2 text-2xl font-bold">Verifikasi Pemimpin</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Review aplikasi pendeta/pemimpin yang ingin mendapat tools pastoral.
      </p>
      <LeaderReviewPanel applications={applications} />
    </div>
  );
}
