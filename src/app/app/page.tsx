import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LivynSearch,
  LivynBell,
  LivynChevronRight,
  LivynFlame,
  LivynPlay,
  LivynCalendar,
  LivynSpark,
  LivynBible,
  LivynPrayer,
  LivynPeople,
  LivynHeadphones,
  LivynCrown,
  LivynTrophy,
} from "@/components/icons/livyn-icons";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  getTodayVerse,
  getLatestSermon,
  getContinueWatching,
  getPrayerStreak,
} from "@/lib/queries/home";
import { getTodaysDevotion } from "@/lib/devotions/daily-themes";
import { unreadVersePingCount, listMyCircles } from "@/lib/queries/community";
import { isLeader } from "@/lib/community/permissions";
import { getLevelForPoints } from "@/lib/gamification/levels";
import { getTodayRhythm } from "@/lib/queries/rhythm";
import { isFavorited } from "@/lib/queries/favorites";
import { upcomingChristianEvents } from "@/lib/christian-calendar";
import { getT, getLocale } from "@/lib/i18n/server";
import type { TFunction } from "@/lib/i18n/translate";
import { Card, HeroCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LivynMark } from "@/components/brand/logo";
import { IconLink } from "@/components/nav/top-bar";
import { ThemeSwitch } from "@/components/nav/theme-switch";
import { formatDurationShort } from "@/lib/format";
import { VerseShareCard } from "@/components/verse/verse-share-card";
import { FavoriteButton } from "@/components/verse/favorite-button";
import { RhythmStrip } from "@/components/home/rhythm-strip";
import { ActivityBeacon } from "@/components/home/activity-beacon";

function greetingKey() {
  const h = new Date().getHours();
  if (h < 11) return "greeting.morning" as const;
  if (h < 15) return "greeting.afternoon" as const;
  if (h < 18) return "greeting.evening" as const;
  return "greeting.night" as const;
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

/** Small caps label that breaks the card stack into scannable groups. */
function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between px-0.5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

export default async function HomePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const t = await getT();
  const firstName = session.name.split(" ")[0];

  return (
    <div className="animate-fade-in">
      <div className="space-y-6 px-5 pb-8 safe-top pt-2">
        {/* 1 — Identity: greeting, name, level, streak and today's rhythm, in one
            card. Previously three competing surfaces; the points card in
            particular fought the verse hero for attention. */}
        <Suspense fallback={<CardSkeleton h="h-44" />}>
          <IdentityCard userId={session.sub} firstName={firstName} t={t} />
        </Suspense>

        {/* 2 — The one hero on this screen. */}
        <Suspense fallback={<CardSkeleton h="h-52" />}>
          <TodayVerseSection userId={session.sub} t={t} />
        </Suspense>

        {/* 3 — Continue: the two things worth doing right now. */}
        <section>
          <SectionLabel>{t("home.continueLabel")}</SectionLabel>
          <div className="space-y-3">
            <TodayDevotionSection t={t} />
            <Link href="/app/ai-pastor">
              <Card className="flex items-center gap-4 p-4 active:scale-[0.98] transition-transform border-primary/15 bg-gradient-to-r from-primary-soft to-transparent">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/15">
                  <LivynSpark className="h-5.5 w-5.5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-extrabold text-heading text-[15px]">{t("home.askAiPastor")}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{t("home.askAiPastorSub")}</p>
                </div>
                <LivynChevronRight className="h-4.5 w-4.5 shrink-0 text-primary/50" />
              </Card>
            </Link>
          </div>
        </section>

        {/* 4 — Explore: four destinations instead of eight. The four that were
            dropped all still have a home — in the rhythm strip above, in the
            bottom nav, or behind "more". */}
        <section>
          <SectionLabel
            action={
              <Link href="/app/profil" className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
                {t("common.more")} →
              </Link>
            }
          >
            {t("home.exploreLabel")}
          </SectionLabel>
          <div className="grid grid-cols-4 gap-3">
            {([
              { href: "/app/alkitab", label: t("nav.bible"), icon: LivynBible, bg: "bg-primary-soft", fg: "text-primary" },
              { href: "/app/doa", label: t("nav.prayer"), icon: LivynPrayer, bg: "bg-amber-500/10", fg: "text-amber-600" },
              { href: "/app/circle", label: "Circle", icon: LivynPeople, bg: "bg-violet-500/10", fg: "text-violet-600" },
              { href: "/app/khotbah", label: "Khotbah", icon: LivynHeadphones, bg: "bg-sky-500/10", fg: "text-sky-600" },
            ] as const).map((a) => (
              <Link key={a.href} href={a.href} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${a.bg} shadow-[var(--shadow-sm)]`}>
                  <a.icon className={`h-[22px] w-[22px] ${a.fg}`} />
                </div>
                <span className="text-[11px] font-semibold text-heading">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5 — Community, as one card with numbers rather than two cards. */}
        <Suspense fallback={<CardSkeleton h="h-16" />}>
          <CommunitySection userId={session.sub} role={session.role} t={t} />
        </Suspense>

        {/* 6 — Below the fold: sermons and the calendar. */}
        <Suspense fallback={null}>
          <ContinueWatchingSection userId={session.sub} t={t} />
        </Suspense>

        <Suspense fallback={<CardSkeleton h="h-56" />}>
          <LatestSermonSection t={t} />
        </Suspense>

        <ChristianEventsSection t={t} />
      </div>
    </div>
  );
}

async function IdentityCard({ userId, firstName, t }: { userId: string; firstName: string; t: TFunction }) {
  const [user, streak, rhythm] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { points: true } }).catch(() => null),
    getPrayerStreak(userId).catch(() => 0),
    getTodayRhythm(userId),
  ]);

  const points = user?.points ?? 0;
  const level = getLevelForPoints(points);

  return (
    <HeroCard className="animate-slide-up-fade">
      <div className="relative p-5" style={{ background: "var(--gradient-primary)" }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-white/60">
                {t(greetingKey())} {greetingEmoji()}
              </p>
              <h1 className="truncate font-display text-[22px] font-extrabold leading-tight tracking-tight text-white">
                {firstName}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* On-dark overrides: these controls normally sit on a light surface. */}
              <ThemeSwitch className="bg-white/15 text-white/85 hover:text-white" />
              <IconLink href="/app/cari" label="Cari" className="text-white/85 hover:bg-white/15 hover:text-white">
                <LivynSearch className="h-[18px] w-[18px]" />
              </IconLink>
              <IconLink href="/app/notifikasi" label="Notifikasi" className="text-white/85 hover:bg-white/15 hover:text-white">
                <LivynBell className="h-[18px] w-[18px]" />
              </IconLink>
              <Link
                href="/app/profil"
                className="ml-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 backdrop-blur-sm"
              >
                <span className="font-display text-sm font-bold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Link
              href="/app/tantangan"
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm active:scale-95 transition-transform"
            >
              <LivynTrophy className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[11.5px] font-bold text-white">{t("home.points", { count: points })}</span>
              <span className="text-[11.5px] font-medium text-white/55">· {level.name}</span>
            </Link>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
              <LivynFlame className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[11.5px] font-bold text-white">{t("home.streakDays", { count: streak })}</span>
            </span>
          </div>

          <p className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
            {t("home.rhythmTitle")}
          </p>
          <RhythmStrip rhythm={rhythm} t={t} />
        </div>
      </div>
    </HeroCard>
  );
}

async function TodayVerseSection({ userId, t }: { userId: string; t: TFunction }) {
  const verse = await getTodayVerse().catch(() => null);
  if (!verse) return null;

  const bookCode = verse.book.code as string;
  const favorited = await isFavorited(userId, bookCode, verse.chapter, verse.verse).catch(() => false);

  return (
    <HeroCard className="animate-slide-up-fade">
      {/* Rendering the verse is what counts as "read it today". */}
      <ActivityBeacon kind="verse" />
      <div className="relative p-6" style={{ background: "var(--gradient-verse)" }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-accent/10 blur-2xl" />
        </div>
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/45">
              {t("home.todayVerse")}
            </span>
            <LivynMark className="h-5 w-5 opacity-30" gradientId="verse-logo" />
          </div>
          <p className="font-display text-[18px] font-medium leading-[1.6] text-white/90">
            &ldquo;{verse.text}&rdquo;
          </p>
          <p className="mt-4 text-[13px] font-bold text-primary">
            {verse.book.name} {verse.chapter}:{verse.verse}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <VerseShareCard
              verseText={verse.text}
              verseRef={`${verse.book.name} ${verse.chapter}:${verse.verse}`}
            />
            <FavoriteButton
              initialFavorited={favorited}
              target={{
                bookCode,
                bookName: verse.book.name,
                chapter: verse.chapter,
                verse: verse.verse,
                text: verse.text,
              }}
            />
          </div>
        </div>
      </div>
    </HeroCard>
  );
}

function TodayDevotionSection({ t }: { t: TFunction }) {
  const devotion = getTodaysDevotion();
  return (
    <Link href="/app/devosi">
      <Card className="overflow-hidden p-0 active:scale-[0.98] transition-transform">
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Badge>{t("home.todayDevotion")}</Badge>
            <Badge variant="muted">{devotion.theme}</Badge>
          </div>
          <h3 className="font-display text-[17px] font-extrabold leading-snug text-heading">{devotion.title}</h3>
          <p className="mt-2 line-clamp-2 text-[13px] italic leading-relaxed text-muted-foreground">
            &ldquo;{devotion.verseText}&rdquo;
          </p>
          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted-foreground">{devotion.verseRef}</span>
            <span className="flex items-center gap-1 text-[12px] font-bold text-primary">
              {t("common.read")} <LivynChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

async function CommunitySection({ userId, role, t }: { userId: string; role: string; t: TFunction }) {
  const [pingCount, circles] = await Promise.all([
    unreadVersePingCount(userId).catch(() => 0),
    listMyCircles(userId).catch(() => []),
  ]);
  const circleCount = circles.length;
  const showLeaderCta = !isLeader(role);

  if (!showLeaderCta && pingCount === 0 && circleCount === 0) return null;

  // One line of numbers reads faster than two cards saying the same thing.
  const summary = [
    pingCount > 0 ? t("home.communityNewVerses", { count: pingCount }) : null,
    circleCount > 0 ? t("home.communityCircles", { count: circleCount }) : null,
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {summary.length > 0 && (
        <Link href={pingCount > 0 ? "/app/teman" : "/app/circle"}>
          <Card className="flex items-center gap-3.5 p-4 active:scale-[0.98] transition-transform">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
              <LivynPeople className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[14.5px] font-extrabold text-heading">{t("home.communityTitle")}</p>
              <p className="truncate text-[12px] text-muted-foreground">{summary.join(" · ")}</p>
            </div>
            <LivynChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
          </Card>
        </Link>
      )}

      {showLeaderCta && (
        <Link href="/app/pemimpin">
          <Card className="flex items-center gap-3 border-amber-500/20 bg-gradient-to-r from-amber-50 to-transparent p-3.5 active:scale-[0.98] transition-transform dark:from-amber-950/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
              <LivynCrown className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1">
              <p className="text-[12.5px] font-bold text-heading">{t("home.leaderCtaTitle")}</p>
              <p className="text-[11px] text-muted-foreground">{t("home.leaderCtaSub")}</p>
            </div>
            <LivynChevronRight className="h-4 w-4 text-amber-500/50" />
          </Card>
        </Link>
      )}
    </div>
  );
}

async function ContinueWatchingSection({ userId, t }: { userId: string; t: TFunction }) {
  const items = await getContinueWatching(userId).catch(() => []);
  if (items.length === 0) return null;
  return (
    <section>
      <SectionLabel>{t("home.continueWatching")}</SectionLabel>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
        {items.map((w: { id: string; sermon: { slug: string; title: string; pastor: string } }) => (
          <Link key={w.id} href={`/app/khotbah/${w.sermon.slug}`} className="w-52 shrink-0">
            <Card className="overflow-hidden p-0 active:scale-[0.98] transition-transform">
              <div className="relative flex h-28 items-center justify-center" style={{ background: "var(--gradient-verse)" }}>
                <LivynPlay className="h-9 w-9 text-white/80" />
              </div>
              <div className="p-3.5">
                <p className="line-clamp-1 text-[13px] font-bold text-heading">{w.sermon.title}</p>
                <p className="text-[11px] font-medium text-muted-foreground">{w.sermon.pastor}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function LatestSermonSection({ t }: { t: TFunction }) {
  const sermon = await getLatestSermon().catch(() => null);
  if (!sermon) return null;
  return (
    <section>
      <SectionLabel
        action={
          <Link href="/app/khotbah" className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
            {t("common.seeAll")}
          </Link>
        }
      >
        {t("home.latestSermon")}
      </SectionLabel>
      <Link href={`/app/khotbah/${sermon.slug}`}>
        <Card className="overflow-hidden p-0 active:scale-[0.98] transition-transform">
          <div className="relative flex h-40 items-center justify-center" style={{ background: "var(--gradient-verse)" }}>
            <LivynPlay className="h-12 w-12 text-white/80" />
            <span className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {formatDurationShort(sermon.durationSec)}
            </span>
          </div>
          <div className="p-4">
            <p className="font-bold leading-snug text-heading">{sermon.title}</p>
            <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
              {sermon.pastor} &middot; {sermon.church}
            </p>
          </div>
        </Card>
      </Link>
    </section>
  );
}

async function ChristianEventsSection({ t }: { t: TFunction }) {
  const locale = await getLocale();
  return (
    <section>
      <SectionLabel>{t("home.christianEvents")}</SectionLabel>
      <Card>
        <ul className="divide-y divide-border-subtle">
          {upcomingChristianEvents(3).map((e) => (
            <li key={e.name} className="flex items-center gap-3.5 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <LivynCalendar className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-heading">{e.name}</p>
                <p className="text-[12px] font-medium text-muted-foreground">
                  {e.date.toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
