import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listPublishedDevotions, listCategories, getUserBookmarkedDevotionIds } from "@/lib/queries/devotions";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function DevotionListPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { kategori } = await searchParams;
  const [devotions, categories, bookmarked] = await Promise.all([
    listPublishedDevotions({ categorySlug: kategori }),
    listCategories(),
    getUserBookmarkedDevotionIds(session.sub),
  ]);

  return (
    <div>
      <TopBar
        title="Renungan Harian"
        actions={
          <Link
            href="/app/devosi/tersimpan"
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-muted transition-colors"
            aria-label="Tersimpan"
          >
            <BookmarkCheck className="h-[18px] w-[18px]" />
          </Link>
        }
      />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-none">
        <Link
          href="/app/devosi"
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
            href={`/app/devosi?kategori=${c.slug}`}
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
        {devotions.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
              <BookmarkCheck className="h-6 w-6 text-primary" />
            </div>
            <p className="text-[13px] text-muted-foreground">Belum ada renungan pada kategori ini.</p>
          </div>
        )}
        {devotions.map((d) => (
          <Link key={d.id} href={`/app/devosi/${d.slug}`}>
            <Card className="animate-slide-up-fade p-5 active:scale-[0.98] transition-transform">
              <div className="mb-2.5 flex items-center gap-2">
                {d.category && <Badge variant="muted">{d.category.name}</Badge>}
                {bookmarked.has(d.id) && (
                  <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <h3 className="font-display text-[15px] font-bold leading-snug text-heading">{d.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">{d.excerpt}</p>
              <p className="mt-3 text-[12px] text-muted-foreground">
                {d.author.name} · {d.readingTimeMin} menit baca
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
