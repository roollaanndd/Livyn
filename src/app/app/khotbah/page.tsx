import Link from "next/link";
import { redirect } from "next/navigation";
import { LivynPlay } from "@/components/icons/livyn-icons";
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

      <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-none">
        <Link
          href="/app/khotbah"
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all",
            !kategori
              ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
              : "bg-surface-muted text-muted-foreground hover:bg-border",
          )}
        >
          Semua
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/app/khotbah?kategori=${c.slug}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all",
              kategori === c.slug
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                : "bg-surface-muted text-muted-foreground hover:bg-border",
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="stagger space-y-3 px-5 pb-8">
        {sermons.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
              <LivynPlay className="h-6 w-6 text-primary" />
            </div>
            <p className="text-[13px] text-muted-foreground">Belum ada khotbah pada kategori ini.</p>
          </div>
        )}
        {sermons.map((s) => (
          <Link key={s.id} href={`/app/khotbah/${s.slug}`}>
            <Card className="animate-slide-up-fade overflow-hidden p-0 active:scale-[0.98] transition-transform">
              <div className="relative flex h-32 items-center justify-center" style={{ background: "var(--gradient-verse)" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <LivynPlay className="h-6 w-6 text-white/90" />
                </div>
                <span className="absolute bottom-2.5 right-3 rounded-lg bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                  {formatDurationShort(s.durationSec)}
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold leading-snug text-heading text-[14px]">{s.title}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{s.pastor} · {s.church}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatViewCount(s.viewCount)}x ditonton</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
