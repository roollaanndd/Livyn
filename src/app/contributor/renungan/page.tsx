import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { listContributorDevotions } from "@/lib/queries/contributor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "muted" | "danger" }> = {
  published: { label: "Terbit", variant: "success" },
  pending: { label: "Menunggu", variant: "warning" },
  draft: { label: "Draf", variant: "muted" },
  rejected: { label: "Ditolak", variant: "danger" },
};

export default async function ContributorDevotionsPage() {
  const session = await getCurrentUser();
  if (!session || !hasRole(session.role, "contributor")) redirect("/app");

  const devotions = await listContributorDevotions(session.sub);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Renungan Saya</h1>
        <Link href="/contributor/renungan/baru">
          <Button size="sm"><Plus className="h-4 w-4" /> Baru</Button>
        </Link>
      </div>

      <div className="space-y-2">
        {devotions.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Belum ada renungan.</p>}
        {devotions.map((d) => {
          const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.draft;
          const editable = d.status !== "published";
          return (
            <Link key={d.id} href={editable ? `/contributor/renungan/${d.id}` : `/app/devosi/${d.slug}`}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.category?.name ?? "Tanpa kategori"} · {d.readingTimeMin} menit</p>
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
