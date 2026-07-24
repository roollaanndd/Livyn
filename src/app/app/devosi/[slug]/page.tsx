import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Clock, BookOpen, Quote, Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDevotionBySlug, getUserBookmarkedDevotionIds } from "@/lib/queries/devotions";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { Badge } from "@/components/ui/badge";
import { DevotionActions } from "@/components/devotion/devotion-actions";
import { FontSizeControl } from "@/components/devotion/font-size-control";

export default async function DevotionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { slug } = await params;
  const devotion = await getDevotionBySlug(slug);
  if (!devotion || devotion.status !== "published") notFound();

  await prisma.devotion.update({ where: { id: devotion.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const bookmarks = await getUserBookmarkedDevotionIds(session.sub);
  const refs = devotion.bibleRefs.split(",").map((r) => r.trim()).filter(Boolean);

  const publishDate = devotion.publishDate
    ? new Date(devotion.publishDate).toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="bg-background">
      <TopBar back title="" transparent />

      <article className="mx-auto max-w-lg">
        {/* Hero header */}
        <div className="relative px-5 pb-6 pt-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {devotion.category && (
              <Badge className="bg-primary/10 text-primary border-0 text-[11px] font-bold uppercase tracking-wider">
                {devotion.category.name}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> {devotion.readingTimeMin} menit
            </span>
            {publishDate && (
              <span className="text-[11px] text-muted-foreground">{publishDate}</span>
            )}
          </div>

          <h1 className="font-display text-[26px] font-extrabold leading-[1.2] tracking-tight text-heading">
            {devotion.title}
          </h1>

          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground italic">
            {devotion.excerpt}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="font-display text-sm font-bold text-primary">
                {devotion.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{devotion.author.name}</p>
              <p className="text-[11px] text-muted-foreground">{devotion.viewCount} pembaca</p>
            </div>
          </div>
        </div>

        {/* Bible verse highlight */}
        {refs.length > 0 && (
          <div className="mx-5 mb-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Quote className="h-4 w-4 text-primary/60" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary/60">
                Bacaan Hari Ini
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {refs.map((ref) => (
                <Link key={ref} href={`/app/alkitab?cari=${encodeURIComponent(ref)}`}>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-primary shadow-sm transition-colors hover:bg-primary hover:text-white">
                    <BookOpen className="h-3.5 w-3.5" />
                    {ref}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div className="mx-5 mb-6 flex items-center justify-between rounded-xl bg-surface-muted/50 px-4 py-2.5">
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

        {/* Body */}
        <div className="px-5 pb-6">
          <div className="devotion-body prose-livyn whitespace-pre-line text-[15px] leading-[1.85] text-foreground/90">
            {devotion.body}
          </div>
        </div>

        {/* Footer */}
        <div className="mx-5 mb-10 rounded-2xl border border-border-subtle bg-surface p-5 text-center">
          <Heart className="mx-auto mb-2 h-5 w-5 text-rose-400" />
          <p className="text-sm font-semibold text-foreground">Renungan ini memberkatimu?</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Bagikan kepada teman yang membutuhkan penguatan hari ini.
          </p>
        </div>
      </article>
    </div>
  );
}
