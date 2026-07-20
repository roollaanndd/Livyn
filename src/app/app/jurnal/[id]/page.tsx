import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { LivynMark } from "@/components/brand/logo";
import { MOOD_META } from "@/lib/journal/mood-meta";
import { DeleteJournalButton } from "@/components/journal/delete-button";

export default async function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { id } = await params;
  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: { suggestedVerse: { include: { book: true } } },
  });
  if (!entry || entry.userId !== session.sub) notFound();

  const mood = entry.mood ? MOOD_META[entry.mood] : null;

  return (
    <div>
      <TopBar title="Catatan" back actions={<DeleteJournalButton id={entry.id} />} />

      <div className="space-y-5 px-5 pb-8 pt-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {mood && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold">
                {mood.emoji} {mood.label}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {entry.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          {entry.title && <h1 className="font-display mt-2 text-xl font-bold">{entry.title}</h1>}
        </div>

        <Card className="p-5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{entry.body}</p>
        </Card>

        {entry.suggestedVerse && (
          <Card className="relative overflow-hidden border-none bg-[#0B0D1A] p-5 text-white">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#6C5CE7]/30 blur-2xl" />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Ayat Penguat untukmu</span>
                <LivynMark className="h-6 w-6 opacity-70" />
              </div>
              <p className="font-display text-lg leading-relaxed">&ldquo;{entry.suggestedVerse.text}&rdquo;</p>
              <p className="mt-3 text-sm font-medium text-[#A78BFA]">
                {entry.suggestedVerse.book.name} {entry.suggestedVerse.chapter}:{entry.suggestedVerse.verse}
              </p>
              {entry.suggestedVerseNote && (
                <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-white/80">
                  {entry.suggestedVerseNote}
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
