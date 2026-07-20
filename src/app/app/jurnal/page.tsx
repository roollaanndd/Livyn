import Link from "next/link";
import { redirect } from "next/navigation";
import { PenLine, ChevronRight, BookHeart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOOD_META } from "@/lib/journal/mood-meta";

export default async function JournalPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const entries = await prisma.journalEntry.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { suggestedVerse: { include: { book: true } } },
  });

  return (
    <div>
      <TopBar title="Jurnal · Curhat kepada Tuhan" />

      <div className="px-5 pb-6 pt-4">
        <Link href="/app/jurnal/baru">
          <Card className="mb-5 border-none bg-gradient-to-br from-[#6C5CE7] to-[#4b3fc4] p-5 text-white active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                <PenLine className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold">Tulis Catatan Baru</p>
                <p className="text-sm text-white/75">Ceritakan harimu, dapatkan ayat penguat</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </div>
          </Card>
        </Link>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BookHeart className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Belum ada catatan. Mulai curhat kepada Tuhan tentang harimu.
            </p>
            <Link href="/app/jurnal/baru">
              <Button size="sm">Tulis Catatan Pertamamu</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const mood = entry.mood ? MOOD_META[entry.mood] : null;
              return (
                <Link key={entry.id} href={`/app/jurnal/${entry.id}`}>
                  <Card className="p-4 active:scale-[0.99] transition-transform">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {mood && <span className="text-base leading-none">{mood.emoji}</span>}
                          <p className="text-xs text-muted-foreground">
                            {entry.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                        {entry.title && <p className="font-display truncate font-bold">{entry.title}</p>}
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{entry.body}</p>
                        {entry.suggestedVerse && (
                          <p className="mt-2 text-xs font-medium text-primary">
                            {entry.suggestedVerse.book.name} {entry.suggestedVerse.chapter}:{entry.suggestedVerse.verse}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
