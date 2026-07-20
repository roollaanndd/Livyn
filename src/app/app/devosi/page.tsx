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
          <Link href="/app/devosi/tersimpan" className="rounded-full p-2 hover:bg-surface-muted" aria-label="Tersimpan">
            <BookmarkCheck className="h-5 w-5" />
          </Link>
        }
      />

      <div className="-mb-1 flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
        <Link
          href="/app/devosi"
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium",
            !kategori ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground",
          )}
        >
          Semua
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/app/devosi?kategori=${c.slug}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium",
              kategori === c.slug ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground",
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="space-y-3 px-4 pb-6 pt-2">
        {devotions.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Belum ada renungan pada kategori ini.</p>
        )}
        {devotions.map((d) => (
          <Link key={d.id} href={`/app/devosi/${d.slug}`}>
            <Card className="p-4 active:scale-[0.99] transition-transform">
              <div className="mb-1.5 flex items-center gap-2">
                {d.category && <Badge variant="muted">{d.category.name}</Badge>}
                {bookmarked.has(d.id) && <BookmarkCheck className="h-3.5 w-3.5 text-primary" />}
              </div>
              <h3 className="font-display font-bold leading-snug">{d.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.excerpt}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {d.author.name} · {d.readingTimeMin} menit baca
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
