import { redirect } from "next/navigation";
import Link from "next/link";
import { LivynPlus } from "@/components/icons/livyn-icons";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { listContributorSermons } from "@/lib/queries/contributor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "muted" | "danger" }> = {
  published: { label: "Terbit", variant: "success" },
  pending: { label: "Menunggu", variant: "warning" },
  draft: { label: "Draf", variant: "muted" },
  rejected: { label: "Ditolak", variant: "danger" },
};

export default async function ContributorSermonsPage() {
  const session = await getCurrentUser();
  if (!session || !hasRole(session.role, "contributor")) redirect("/app");

  const sermons = await listContributorSermons(session.sub);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Khotbah Saya</h1>
        <Link href="/contributor/khotbah/baru">
          <Button size="sm"><LivynPlus className="h-4 w-4" /> Baru</Button>
        </Link>
      </div>
      <div className="space-y-2">
        {sermons.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Belum ada khotbah.</p>}
        {sermons.map((s) => {
          const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.draft;
          return (
            <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.pastor} · {s.category?.name ?? "Tanpa kategori"}</p>
              </div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
