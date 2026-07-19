import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ClipboardCheck, BookOpen, Clapperboard, Flag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { canModerate } from "@/lib/auth/rbac";
import { getAdminStats } from "@/lib/queries/admin";
import { Card } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const session = await getCurrentUser();
  if (!session || !canModerate(session.role)) redirect("/app");

  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold">Dasbor Admin</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} label="Total Pengguna" value={stats.totalUsers} />
        <StatCard icon={Users} label="Kontributor+" value={stats.totalContributors} />
        <StatCard icon={ClipboardCheck} label="Menunggu Tinjauan" value={stats.pendingDevotions + stats.pendingSermons} accent="text-amber-600" href="/admin/moderasi" />
        <StatCard icon={BookOpen} label="Renungan Terbit" value={stats.publishedDevotions} accent="text-emerald-600" />
        <StatCard icon={Clapperboard} label="Khotbah Terbit" value={stats.publishedSermons} accent="text-emerald-600" />
        <StatCard icon={Flag} label="Laporan Terbuka" value={stats.openReports} accent="text-red-500" />
      </div>

      {stats.pendingDevotions + stats.pendingSermons > 0 && (
        <Link href="/admin/moderasi">
          <Card className="mt-6 flex items-center justify-between border-primary/30 bg-primary/5 p-4">
            <span className="text-sm font-medium">
              Ada {stats.pendingDevotions + stats.pendingSermons} konten menunggu tinjauan
            </span>
            <span className="text-sm font-semibold text-primary">Tinjau sekarang →</span>
          </Card>
        </Link>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent?: string;
  href?: string;
}) {
  const content = (
    <Card className="p-4">
      <Icon className={`mb-2 h-4.5 w-4.5 ${accent ?? "text-primary"}`} />
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
