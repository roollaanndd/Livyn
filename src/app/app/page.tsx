import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Bell, ChevronRight, Flame, PlayCircle, CalendarHeart, PenLine, Trophy, Sparkles, BookOpenText, HandHeart, BookHeart, BookMarked } from "lucide-react";
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
import { VerseShareCard } from "@/components/verse/verse-share-card";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function greetingEmoji() {
  const h = new Date().getHours();
  if (h < 11) return "☀️";
  if (h < 15) return "🌤️";
  if (h < 18) return "🌅";
  return "🌙";
}

function CardSkeleton({ h = "h-24" }: { h?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-muted/70 ${h}`} />;
}

export default async function HomePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const firstName = session.name.split(" ")[0];

  return (
    <div className="animate-fade-in">
      {/* Header — renders immediately, no DB */}
      <header className="flex items-center gap-3 px-5 safe-top pb-4">
        <div className="flex-1">
          <p className="text-[13px] text-muted-foreground font-medium">{greeting()} {greetingEmoji()}</p>
          <h1 className="font-display text-[24px] font-extrabold text-heading tracking-tight leading-tight">{firstName}</h1>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground/70 font-medium">
            {new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <IconLink href="/app/cari" label="Cari">
          <Search className="h-[18px] w-[18px]" />
        </IconLink>
        <IconLink href="/app/notifikasi" label="Notifikasi">
          <Bell className="h-[18px] w-[18px]" />
        </IconLink>
        <Link
          href="/app/profil"
          className="ml-0.5 flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-sm"
        >
          <span className="font-display text-sm font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
        </Link>
      </header>

      <div className="stagger space-y-5 px-5 pb-8">
        {/* Quick actions — static, renders immediately */}
        <div className="animate-slide-up-fade grid grid-cols-4 gap-3">
          {[
            { href: "/app/alkitab", label: "Alkitab", icon: BookOpenText, bg: "bg-primary-soft", fg: "text-primary" },
            { href: "/app/devosi", label: "Renungan", icon: BookHeart, bg: "bg-rose-500/10", fg: "text-rose-600" },
            { href: "/app/doa", label: "Doa", icon: HandHeart, bg: "bg-amber-500/10", fg: "text-amber-600" },
            { href: "/app/jurnal", label: "Jurnal", icon: PenLine, bg: "bg-sky-500/10", fg: "text-sky-600" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${a.bg} shadow-[var(--shadow-sm)]`}>
                <a.icon className={`h-[22px] w-[22px] ${a.fg}`} />
              </div>
              <span className="text-[11px] font-semibold text-heading">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Today's Verse — streams */}
        <Suspense fallback={<CardSkeleton h="h-48" />}>
          <TodayVerseSection />
        </Suspense>

        {/* AI Pastor Quick Access — static */}
        <Link href="/app/ai-pastor">
          <Card className="animate-slide-up-fade flex items-center gap-4 p-4 active:scale-[0.98] transition-transform border-primary/15 bg-gradient-to-r from-primary-soft to-transparent">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/15">
              <Sparkles className="h-5.5 w-5.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-extrabold text-heading text-[15px]">Tanya AI Pastor</p>
              <p className="text-[13px] text-muted-foreground truncate">Pendamping rohani pribadimu, kapan saja</p>
            </div>
            <ChevronRight className="h-4.5 w-4.5 text-primary/50 shrink-0" />
          </Card>
        </Link>

        {/* Reading Plans — static */}
        <Link href="/app/rencana-baca">
          <Card className="animate-slide-up-fade flex items-center gap-4 p-4 active:scale-[0.98] transition-transform border-emerald-500/15 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/20">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-500/10 shadow-sm">
              <BookMarked className="h-5.5 w-5.5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-extrabold text-heading text-[15px]">Rencana Bacaan</p>
              <p className="text-[13px] text-muted-foreground truncate">Baca Alkitab terstruktur setiap hari</p>
            </div>
            <ChevronRight className="h-4.5 w-4.5 text-emerald-500/50 shrink-0" />
          </Card>
        </Link>

        {/* Today's Devotion — streams */}
        <Suspense fallback={<CardSkeleton h="h-36" />}>
          <TodayDevotionSection />
        </Suspense>

        {/* Level & Challenge — streams */}
        <Suspense fallback={<CardSkeleton h="h-28" />}>
          <LevelChallengeSection userId={session.sub} />
        </Suspense>

        {/* Journal CTA — static */}
        <Link href="/app/jurnal/baru">
          <Card className="animate-slide-up-fade flex items-center gap-4 p-4 active:scale-[0.98] transition-transform">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <PenLine className="h-5.5 w-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-extrabold text-heading text-[15px]">Curhat kepada Tuhan</p>
              <p className="text-[13px] text-muted-foreground">Tulis catatan harianmu, dapatkan ayat penguat</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </Card>
        </Link>

        {/* Prayer Reminders — streams */}
        <Suspense fallback={<CardSkeleton h="h-40" />}>
          <PrayerRemindersSection userId={session.sub} />
        </Suspense>

        {/* Continue watching — streams */}
        <Suspense fallback={null}>
          <ContinueWatchingSection userId={session.sub} />
        </Suspense>

        {/* Latest sermon — streams */}
        <Suspense fallback={<CardSkeleton h="h-56" />}>
          <LatestSermonSection />
        </Suspense>

        {/* Christian events — static, no DB */}
        <div className="animate-slide-up-fade">
          <h3 className="font-display mb-3 text-[15px] font-extrabold text-heading">Peristiwa Kristiani</h3>
          <Card>
            <ul className="divide-y divide-border-subtle">
              {upcomingChristianEvents(3).map((e) => (
                <li key={e.name} className="flex items-center gap-3.5 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <CalendarHeart className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-heading">{e.name}</p>
                    <p className="text-[12px] text-muted-foreground font-medium">
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

async function TodayVerseSection() {
  const verse = await getTodayVerse().catch(() => null);
  if (!verse) return null;
  return (
    <HeroCard className="animate-slide-up-fade">
      <div className="relative p-6" style={{ background: "var(--gradient-verse)" }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-accent/10 blur-2xl" />
        </div>
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/45">
              Ayat Hari Ini
            </span>
            <LivynMark className="h-5 w-5 opacity-30" gradientId="verse-logo" />
          </div>
          <p className="font-display text-[18px] leading-[1.6] text-white/90 font-medium">
            &ldquo;{verse.text}&rdquo;
          </p>
          <p className="mt-4 text-[13px] font-bold text-primary">
            {verse.book.name} {verse.chapter}:{verse.verse}
          </p>
          <VerseShareCard
            verseText={verse.text}
            verseRef={`${verse.book.name} ${verse.chapter}:${verse.verse}`}
          />
        </div>
      </div>
    </HeroCard>
  );
}

async function TodayDevotionSection() {
  const devotion = await getTodayDevotion().catch(() => null);
  if (!devotion) return null;
  return (
    <Link href={`/app/devosi/${devotion.slug}`}>
      <Card className="animate-slide-up-fade overflow-hidden p-0 active:scale-[0.98] transition-transform">
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Badge>Renungan Hari Ini</Badge>
            {devotion.category && <Badge variant="muted">{devotion.category.name}</Badge>}
          </div>
          <h2 className="font-display text-[17px] font-extrabold leading-snug text-heading">{devotion.title}</h2>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{devotion.excerpt}</p>
          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground font-medium">
              {devotion.author.name} · {devotion.readingTimeMin} menit baca
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

async function LevelChallengeSection({ userId }: { userId: string }) {
  const [user, challenge] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { points: true } }).catch(() => null),
    getCurrentChallenge().catch(() => null),
  ]);
  const points = user?.points ?? 0;
  const level = getLevelForPoints(points);
  const nextTier = getNextTier(points);
  const challengeProgress = challenge ? await getChallengeProgress(userId, challenge.id).catch(() => null) : null;
  const chaptersReadCount = challengeProgress ? challengeProgress.chaptersRead.split(",").filter(Boolean).length : 0;
  const totalChapters = challenge ? challenge.chapterTo - challenge.chapterFrom + 1 : 0;

  return (
    <Link href="/app/tantangan">
      <HeroCard className="animate-slide-up-fade active:scale-[0.98] transition-transform">
        <div className="relative p-5" style={{ background: "var(--gradient-primary)" }}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/8 blur-2xl" />
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">
                Level {level.name}
              </p>
              <p className="font-display text-xl font-extrabold text-white">{points} Poin</p>
              {challenge ? (
                <p className="mt-1.5 text-[13px] text-white/65 font-medium">
                  {chaptersReadCount}/{totalChapters} pasal · {challenge.title}
                </p>
              ) : (
                <p className="mt-1.5 text-[13px] text-white/65">Nantikan tantangan berikutnya</p>
              )}
              {nextTier && (
                <p className="mt-1 text-[11px] text-white/40">
                  {nextTier.minPoints - points} poin menuju {nextTier.name}
                </p>
              )}
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Trophy className="h-7 w-7 text-amber-300" />
            </div>
          </div>
        </div>
      </HeroCard>
    </Link>
  );
}

async function PrayerRemindersSection({ userId }: { userId: string }) {
  const [reminders, streak] = await Promise.all([
    getUpcomingReminders(userId).catch(() => []),
    getPrayerStreak(userId).catch(() => 0),
  ]);
  return (
    <Card className="animate-slide-up-fade">
      <div className="flex items-center justify-between p-5 pb-3">
        <h3 className="font-display text-[15px] font-extrabold text-heading">Pengingat Doa</h3>
        <div className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5">
          <Flame className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-bold text-accent">{streak} hari</span>
        </div>
      </div>
      <div className="space-y-2 px-5 pb-5">
        {reminders.length === 0 ? (
          <p className="text-[13px] text-muted-foreground py-2">
            Belum ada pengingat doa. Yuk atur yang pertama.
          </p>
        ) : (
          reminders.slice(0, 3).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3.5">
              <span className="text-[13px] font-semibold text-heading">{r.label}</span>
              <span className="text-[13px] text-muted-foreground font-medium">{r.time}</span>
            </div>
          ))
        )}
        <Link
          href="/app/doa"
          className="mt-2 flex items-center justify-center gap-1 text-[13px] font-bold text-primary"
        >
          Kelola Pengingat <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}

async function ContinueWatchingSection({ userId }: { userId: string }) {
  const items = await getContinueWatching(userId).catch(() => []);
  if (items.length === 0) return null;
  return (
    <div className="animate-slide-up-fade">
      <h3 className="font-display mb-3 text-[15px] font-extrabold text-heading">Lanjutkan Menonton</h3>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
        {items.map((w) => (
          <Link key={w.id} href={`/app/khotbah/${w.sermon.slug}`} className="w-52 shrink-0">
            <Card className="overflow-hidden p-0 active:scale-[0.98] transition-transform">
              <div className="relative flex h-28 items-center justify-center" style={{ background: "var(--gradient-verse)" }}>
                <PlayCircle className="h-9 w-9 text-white/80" />
              </div>
              <div className="p-3.5">
                <p className="line-clamp-1 text-[13px] font-bold text-heading">{w.sermon.title}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{w.sermon.pastor}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function LatestSermonSection() {
  const sermon = await getLatestSermon().catch(() => null);
  if (!sermon) return null;
  return (
    <div className="animate-slide-up-fade">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-extrabold text-heading">Khotbah Terbaru</h3>
        <Link href="/app/khotbah" className="text-[12px] font-bold text-primary">
          Lihat Semua
        </Link>
      </div>
      <Link href={`/app/khotbah/${sermon.slug}`}>
        <Card className="overflow-hidden p-0 active:scale-[0.98] transition-transform">
          <div className="relative flex h-40 items-center justify-center" style={{ background: "var(--gradient-verse)" }}>
            <PlayCircle className="h-12 w-12 text-white/80" />
            <span className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {formatDurationShort(sermon.durationSec)}
            </span>
          </div>
          <div className="p-4">
            <p className="font-bold leading-snug text-heading">{sermon.title}</p>
            <p className="mt-1.5 text-[12px] text-muted-foreground font-medium">
              {sermon.pastor} · {sermon.church}
            </p>
          </div>
        </Card>
      </Link>
    </div>
  );
}
