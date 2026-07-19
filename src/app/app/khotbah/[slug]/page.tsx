import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSermonBySlug, getUserWatchProgress } from "@/lib/queries/sermons";
import { TopBar } from "@/components/nav/top-bar";
import { Badge } from "@/components/ui/badge";
import { SermonPlayer } from "@/components/sermon/sermon-player";
import { formatViewCount } from "@/lib/format";

export default async function SermonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/masuk");

  const { slug } = await params;
  const sermon = await getSermonBySlug(slug);
  if (!sermon || sermon.status !== "published") notFound();

  const progress = await getUserWatchProgress(session.sub, sermon.id);

  return (
    <div>
      <TopBar back title="Khotbah" />
      <SermonPlayer
        sermonId={sermon.id}
        videoUrl={sermon.videoUrl}
        startPosition={progress?.completed ? 0 : progress?.positionSec ?? 0}
        transcript={sermon.transcript}
      />

      <div className="px-5 pb-10">
        {sermon.category && <Badge className="mb-2">{sermon.category.name}</Badge>}
        <h1 className="font-display text-xl font-bold leading-snug">{sermon.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sermon.pastor} · {sermon.church}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{formatViewCount(sermon.viewCount)}x ditonton</p>

        <p className="devotion-body mt-5 whitespace-pre-line text-foreground">{sermon.description}</p>
      </div>
    </div>
  );
}
