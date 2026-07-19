import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Clock, BookOpen } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDevotionBySlug, getUserBookmarkedDevotionIds } from "@/lib/queries/devotions";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { Badge } from "@/components/ui/badge";
import { DevotionActions } from "@/components/devotion/devotion-actions";
import { FontSizeControl } from "@/components/devotion/font-size-control";

export default async function DevotionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/masuk");

  const { slug } = await params;
  const devotion = await getDevotionBySlug(slug);
  if (!devotion || devotion.status !== "published") notFound();

  await prisma.devotion.update({ where: { id: devotion.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const bookmarks = await getUserBookmarkedDevotionIds(session.sub);
  const refs = devotion.bibleRefs.split(",").map((r) => r.trim()).filter(Boolean);

  return (
    <div>
      <TopBar back title="Renungan" />

      <article className="px-5 pb-10 pt-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {devotion.category && <Badge>{devotion.category.name}</Badge>}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {devotion.readingTimeMin} menit baca
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold leading-tight">{devotion.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Oleh {devotion.author.name}</p>

        <div className="my-4 flex items-center justify-between">
          <DevotionActions
            devotionId={devotion.id}
            initialBookmarked={bookmarks.has(devotion.id)}
            title={devotion.title}
            slug={devotion.slug}
            offlinePayload={{
              title: devotion.title,
              body: devotion.body,
              author: devotion.author.name,
              bibleRefs: devotion.bibleRefs,
              savedAt: new Date().toISOString(),
            }}
          />
          <FontSizeControl />
        </div>

        <div className="devotion-body whitespace-pre-line text-foreground">{devotion.body}</div>

        {refs.length > 0 && (
          <div className="mt-8 rounded-lg border border-border bg-surface-muted p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> Referensi Alkitab
            </p>
            <div className="flex flex-wrap gap-2">
              {refs.map((ref) => (
                <Link key={ref} href={`/app/alkitab?cari=${encodeURIComponent(ref)}`}>
                  <Badge variant="default">{ref}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
