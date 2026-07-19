import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, CheckCircle2, Clock, FileEdit, XCircle, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { getContributorStats, listContributorDevotions } from "@/lib/queries/contributor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatViewCount } from "@/lib/format";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "muted" | "danger" }> = {
  published: { label: "Terbit", variant: "success" },
  pending: { label: "Menunggu", variant: "warning" },
  draft: { label: "Draf", variant: "muted" },
  rejected: { label: "Ditolak", variant: "danger" },
};

export default async function ContributorDashboardPage() {
  const session = await getCurrentUser();
  if (!session || !hasRole(session.role, "contributor")) redirect("/app");

  const [stats, devotions] = await Promise.all([
    getContributorStats(session.sub),
    listContributorDevotions(session.sub),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dasbor Kontributor</h1>
        <Link href="/contributor/renungan/baru">
          <Button size="sm"><Plus className="h-4 w-4" /> Renungan Baru</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Eye} label="Total Dilihat" value={formatViewCount(stats.totalViews)} />
        <StatCard icon={CheckCircle2} label="Terbit" value={stats.published} accent="text-emerald-600" />
        <StatCard icon={Clock} label="Menunggu" value={stats.pending} accent="text-amber-600" />
        <StatCard icon={FileEdit} label="Draf" value={stats.draft} accent="text-muted-foreground" />
        <StatCard icon={XCircle} label="Ditolak" value={stats.rejected} accent="text-red-500" />
      </div>

      <h2 className="font-display mt-8 mb-3 text-base font-bold">Kiriman Terbaru</h2>
      <div className="space-y-2">
        {devotions.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada renungan. Mulai buat yang pertama!</p>
        )}
        {devotions.slice(0, 8).map((d) => {
          const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.draft;
          return (
            <Link key={d.id} href={d.status === "published" ? `/app/devosi/${d.slug}` : `/contributor/renungan/${d.id}`}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.category?.name ?? "Tanpa kategori"} · {d.viewCount} dilihat</p>
                  {d.status === "rejected" && d.rejectReason && (
                    <p className="mt-1 text-xs text-red-500">Alasan: {d.rejectReason}</p>
                  )}
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Eye; label: string; value: string | number; accent?: string }) {
  return (
    <Card className="p-4">
      <Icon className={`mb-2 h-4.5 w-4.5 ${accent ?? "text-primary"}`} />
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
