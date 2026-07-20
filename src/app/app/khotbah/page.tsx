import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listPublishedSermons } from "@/lib/queries/sermons";
import { listCategories } from "@/lib/queries/devotions";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { formatDurationShort, formatViewCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function SermonListPage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { kategori } = await searchParams;
  const [sermons, categories] = await Promise.all([listPublishedSermons({ categorySlug: kategori }), listCategories()]);

  return (
    <div>
      <TopBar title="Khotbah" />

      <div className="-mb-1 flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
        <Link
          href="/app/khotbah"
          className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-medium", !kategori ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground")}
        >
          Semua
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/app/khotbah?kategori=${c.slug}`}
            className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-medium", kategori === c.slug ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground")}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="space-y-3 px-4 pb-6 pt-2">
        {sermons.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Belum ada khotbah pada kategori ini.</p>}
        {sermons.map((s) => (
          <Link key={s.id} href={`/app/khotbah/${s.slug}`}>
            <Card className="overflow-hidden p-0 active:scale-[0.99] transition-transform">
              <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-[#0B0D1A] to-[#2b2f4a]">
                <PlayCircle className="h-9 w-9 text-white/90" />
                <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
                  {formatDurationShort(s.durationSec)}
                </span>
              </div>
              <div className="p-3.5">
                <p className="font-semibold leading-snug">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.pastor} · {s.church}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatViewCount(s.viewCount)}x ditonton</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
