import Link from "next/link";
import { redirect } from "next/navigation";
import { LivynPen, LivynChevronRight, LivynJournal } from "@/components/icons/livyn-icons";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { Card, HeroCard } from "@/components/ui/card";
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
      <TopBar title="Jurnal" back />

      <div className="px-5 pb-8 pt-4">
        {/* Write CTA */}
        <Link href="/app/jurnal/baru">
          <HeroCard className="mb-6 active:scale-[0.98] transition-transform">
            <div className="relative p-5" style={{ background: "var(--gradient-primary)" }}>
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/8 blur-2xl" />
              </div>
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <LivynPen className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-white text-[15px]">Tulis Catatan Baru</p>
                  <p className="text-[13px] text-white/60">Ceritakan harimu, dapatkan ayat penguat</p>
                </div>
                <LivynChevronRight className="h-5 w-5 text-white/40" />
              </div>
            </div>
          </HeroCard>
        </Link>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
              <LivynJournal className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-base font-bold text-heading">Belum Ada Catatan</h3>
              <p className="max-w-[240px] text-[13px] text-muted-foreground leading-relaxed">
                Mulai curhat kepada Tuhan tentang harimu dan dapatkan ayat penguat.
              </p>
            </div>
            <Link href="/app/jurnal/baru">
              <Button size="sm">Tulis Catatan Pertamamu</Button>
            </Link>
          </div>
        ) : (
          <div className="stagger space-y-3">
            {entries.map((entry) => {
              const mood = entry.mood ? MOOD_META[entry.mood] : null;
              return (
                <Link key={entry.id} href={`/app/jurnal/${entry.id}`}>
                  <Card className="animate-slide-up-fade p-4 active:scale-[0.98] transition-transform">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2">
                          {mood && <span className="text-base leading-none">{mood.emoji}</span>}
                          <p className="text-[11px] text-muted-foreground">
                            {entry.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                        {entry.title && (
                          <p className="font-display truncate font-bold text-heading text-[14px]">{entry.title}</p>
                        )}
                        <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">{entry.body}</p>
                        {entry.suggestedVerse && (
                          <p className="mt-2 text-[12px] font-medium text-primary">
                            {entry.suggestedVerse.book.name} {entry.suggestedVerse.chapter}:{entry.suggestedVerse.verse}
                          </p>
                        )}
                      </div>
                      <LivynChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
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
