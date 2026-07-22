import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Bell, ChevronRight, Flame, PlayCircle, CalendarHeart, PenLine, Trophy, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  getTodayVerse,
  getTodayDevotion,
  getLatestSermon,
  getContinueWatching,
  getUpcomingReminders,
  getPrayerStreak,
} from "@/lib/queries/home";
import { getCurrentChallenge, getChallengeProgress } from "@/lib/queries/challenge";
import { getLevelForPoints, getNextTier } from "@/lib/gamification/levels";
import { upcomingChristianEvents } from "@/lib/christian-calendar";
import { Card, HeroCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LivynMark } from "@/components/brand/logo";
import { IconLink } from "@/components/nav/top-bar";
import { formatDurationShort } from "@/lib/format";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export default async function HomePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const [user, verse, devotion, sermon, continueWatching, reminders, streak, events, challenge] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub }, select: { name: true, avatarUrl: true, points: true } }),
    getTodayVerse(),
    getTodayDevotion(),
    getLatestSermon(),
    getContinueWatching(session.sub),
    getUpcomingReminders(session.sub),
    getPrayerStreak(session.sub),
    Promise.resolve(upcomingChristianEvents(3)),
    getCurrentChallenge(),
  ]);

  const firstName = (user?.name ?? session.name).split(" ")[0];
  const points = user?.points ?? 0;
  const level = getLevelForPoints(points);
  const nextTier = getNextTier(points);
  const challengeProgress = challenge ? await getChallengeProgress(session.sub, challenge.id) : null;
  const chaptersReadCount = challengeProgress ? challengeProgress.chaptersRead.split(",").filter(Boolean).length : 0;
  const totalChapters = challenge ? challenge.chapterTo - challenge.chapterFrom + 1 : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 safe-top pb-4">
        <div className="flex-1">
          <p className="text-[13px] text-muted-foreground">{greeting()},</p>
          <h1 className="font-display text-[22px] font-bold text-heading tracking-tight">{firstName}</h1>
        </div>
        <IconLink href="/app/cari" label="Cari">
          <Search className="h-[18px] w-[18px]" />
        </IconLink>
        <IconLink href="/app/notifikasi" label="Notifikasi">
          <Bell className="h-[18px] w-[18px]" />
        </IconLink>
        <Link
          href="/app/profil"
          className="ml-0.5 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary-soft"
        >
          <span className="font-display text-sm font-bold text-primary">{firstName.charAt(0).toUpperCase()}</span>
        </Link>
      </header>

      <div className="stagger space-y-5 px-5 pb-8">
        {/* Today's Verse — Hero Card */}
        {verse && (
          <HeroCard className="animate-slide-up-fade">
            <div
              className="relative p-6"
              style={{ background: "var(--gradient-verse)" }}
            >
              {/* Decorative orbs */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
              </div>

              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
                    Ayat Hari Ini
                  </span>
                  <LivynMark className="h-5 w-5 opacity-40" gradientId="verse-logo" />
                </div>
                <p className="font-display text-[18px] leading-[1.55] text-white/90 font-medium">
                  &ldquo;{verse.text}&rdquo;
                </p>
                <p className="mt-4 text-[13px] font-semibold text-primary">
                  {verse.book.name} {verse.chapter}:{verse.verse}
                </p>
              </div>
            </div>
          </HeroCard>
        )}

        {/* AI Pastor Quick Access */}
        <Link href="/app/ai-pastor">
          <Card className="animate-slide-up-fade flex items-center gap-4 p-4 active:scale-[0.98] transition-transform border-primary/10 bg-primary-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-heading text-[15px]">Tanya AI Pastor</p>
              <p className="text-[13px] text-muted-foreground truncate">Pendamping rohani pribadimu, kapan saja</p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary/50 shrink-0" />
          </Card>
        </Link>

        {/* Today's Devotion */}
        {devotion && (
          <Link href={`/app/devosi/${devotion.slug}`}>
            <Card className="animate-slide-up-fade overflow-hidden p-0 active:scale-[0.98] transition-transform">
              <div className="p-5">
                <div className="mb-2.5 flex items-center gap-2">
                  <Badge>Renungan Hari Ini</Badge>
                  {devotion.category && <Badge variant="muted">{devotion.category.name}</Badge>}
                </div>
                <h2 className="font-display text-[17px] font-bold leading-snug text-heading">{devotion.title}</h2>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{devotion.excerpt}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">
                    {devotion.author.name} · {devotion.readingTimeMin} menit baca
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Level & Challenge */}
        <Link href="/app/tantangan">
          <HeroCard className="animate-slide-up-fade active:scale-[0.98] transition-transform">
            <div className="relative p-5" style={{ background: "var(--gradient-primary)" }}>
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/8 blur-2xl" />
              </div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
                    Level {level.name}
                  </p>
                  <p className="font-display text-lg font-bold text-white">{points} Poin</p>
                  {challenge ? (
                    <p className="mt-1 text-[13px] text-white/65">
                      {chaptersReadCount}/{totalChapters} pasal · {challenge.title}
                    </p>
                  ) : (
                    <p className="mt-1 text-[13px] text-white/65">Nantikan tantangan berikutnya</p>
                  )}
                  {nextTier && (
                    <p className="mt-1 text-[11px] text-white/40">
                      {nextTier.minPoints - points} poin menuju {nextTier.name}
                    </p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Trophy className="h-6 w-6 text-amber-300" />
                </div>
              </div>
            </div>
          </HeroCard>
        </Link>

        {/* Journal CTA */}
        <Link href="/app/jurnal/baru">
          <Card className="animate-slide-up-fade flex items-center gap-4 p-4 active:scale-[0.98] transition-transform">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <PenLine className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-heading text-[15px]">Curhat kepada Tuhan</p>
              <p className="text-[13px] text-muted-foreground">Tulis catatan harianmu, dapatkan ayat penguat</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </Card>
        </Link>

        {/* Prayer Reminders */}
        <Card className="animate-slide-up-fade">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="font-display text-[15px] font-bold text-heading">Pengingat Doa</h3>
            <div className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1">
              <Flame className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-bold text-accent">{streak} hari</span>
            </div>
          </div>
          <div className="space-y-2 px-5 pb-5">
            {reminders.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                Belum ada pengingat doa. Yuk atur yang pertama.
              </p>
            ) : (
              reminders.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3">
                  <span className="text-[13px] font-medium text-heading">{r.label}</span>
                  <span className="text-[13px] text-muted-foreground">{r.time}</span>
                </div>
              ))
            )}
            <Link
              href="/app/doa"
              className="mt-2 flex items-center justify-center gap-1 text-[13px] font-semibold text-primary"
            >
              Kelola Pengingat <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Continue watching */}
        {continueWatching.length > 0 && (
          <div className="animate-slide-up-fade">
            <h3 className="font-display mb-3 text-[15px] font-bold text-heading">Lanjutkan Menonton</h3>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
              {continueWatching.map((w) => (
                <Link key={w.id} href={`/app/khotbah/${w.sermon.slug}`} className="w-52 shrink-0">
                  <Card className="overflow-hidden p-0 active:scale-[0.98] transition-transform">
                    <div className="relative flex h-28 items-center justify-center" style={{ background: "var(--gradient-verse)" }}>
                      <PlayCircle className="h-8 w-8 text-white/80" />
                    </div>
                    <div className="p-3.5">
                      <p className="line-clamp-1 text-[13px] font-semibold text-heading">{w.sermon.title}</p>
                      <p className="text-[11px] text-muted-foreground">{w.sermon.pastor}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Latest sermon */}
        {sermon && (
          <div className="animate-slide-up-fade">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-bold text-heading">Khotbah Terbaru</h3>
              <Link href="/app/khotbah" className="text-[12px] font-semibold text-primary">
                Lihat Semua
              </Link>
            </div>
            <Link href={`/app/khotbah/${sermon.slug}`}>
              <Card className="overflow-hidden p-0 active:scale-[0.98] transition-transform">
                <div className="relative flex h-36 items-center justify-center" style={{ background: "var(--gradient-verse)" }}>
                  <PlayCircle className="h-11 w-11 text-white/80" />
                  <span className="absolute bottom-2.5 right-3 rounded-lg bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                    {formatDurationShort(sermon.durationSec)}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-semibold leading-snug text-heading">{sermon.title}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {sermon.pastor} · {sermon.church}
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Upcoming events */}
        <div className="animate-slide-up-fade">
          <h3 className="font-display mb-3 text-[15px] font-bold text-heading">Peristiwa Kristiani</h3>
          <Card>
            <ul className="divide-y divide-border-subtle">
              {events.map((e) => (
                <li key={e.name} className="flex items-center gap-3.5 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <CalendarHeart className="h-[18px] w-[18px]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-heading">{e.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {e.date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
