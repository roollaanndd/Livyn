import { redirect } from "next/navigation";
import { BookOpen, Sparkles, Heart, HandHeart, MessageSquareQuote } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getTodaysDevotion, formatTodaysDate } from "@/lib/devotions/daily-themes";
import { TopBar } from "@/components/nav/top-bar";
import { DailyShareButton } from "@/components/devotion/daily-share-button";
import { ActivityBeacon } from "@/components/home/activity-beacon";

// Simple, home-consistent gradient per accent — kept subtle so the writing stays hero.
const ACCENT_GRADIENTS: Record<string, string> = {
  sage: "from-emerald-500/8 via-transparent to-transparent",
  amber: "from-amber-500/8 via-transparent to-transparent",
  rose: "from-rose-500/8 via-transparent to-transparent",
  sky: "from-sky-500/8 via-transparent to-transparent",
  violet: "from-violet-500/8 via-transparent to-transparent",
  teal: "from-teal-500/8 via-transparent to-transparent",
};

const ACCENT_BADGE: Record<string, string> = {
  sage: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  teal: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
};

const ACCENT_VERSE: Record<string, string> = {
  sage: "border-emerald-500/20 bg-emerald-500/[0.04]",
  amber: "border-amber-500/20 bg-amber-500/[0.04]",
  rose: "border-rose-500/20 bg-rose-500/[0.04]",
  sky: "border-sky-500/20 bg-sky-500/[0.04]",
  violet: "border-violet-500/20 bg-violet-500/[0.04]",
  teal: "border-teal-500/20 bg-teal-500/[0.04]",
};

export default async function DailyDevotionPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const devotion = getTodaysDevotion();
  const today = formatTodaysDate();
  const accent = devotion.accent;

  return (
    <div className="relative bg-background">
      {/* Opening today's devotion is what ticks the rhythm ring on Home. */}
      <ActivityBeacon kind="devotion" />
      {/* Soft home-themed backdrop */}
      <div className={`pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-gradient-to-b ${ACCENT_GRADIENTS[accent]}`} />

      <TopBar back title="Renungan Hari Ini" transparent />

      <article className="relative mx-auto max-w-lg px-5 pb-16">
        {/* Meta header */}
        <div className="animate-slide-up-fade pt-2">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
            {today}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${ACCENT_BADGE[accent]}`}
            >
              <Sparkles className="h-3 w-3" />
              {devotion.theme}
            </span>
          </div>

          <h1 className="mt-4 font-display text-[28px] font-extrabold leading-[1.15] tracking-tight text-heading">
            {devotion.title}
          </h1>
        </div>

        {/* Featured verse */}
        <div className={`animate-slide-up-fade mt-6 rounded-2xl border p-5 ${ACCENT_VERSE[accent]}`}>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-primary/70" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary/70">
              Ayat Renungan
            </span>
          </div>
          <blockquote className="font-display text-[16.5px] font-medium italic leading-[1.7] text-heading">
            &ldquo;{devotion.verseText}&rdquo;
          </blockquote>
          <p className="mt-3 text-[13px] font-bold text-primary">— {devotion.verseRef} (TB)</p>
        </div>

        {/* Sermon flow: opening → unpacking → application → reflection → prayer */}
        <div className="mt-8 space-y-8">
          <Section icon={<Heart className="h-4 w-4" />} label="Pembuka">
            <p className="devotion-body text-[15.5px] leading-[1.85] text-foreground/90">
              {devotion.opening}
            </p>
          </Section>

          <Section icon={<BookOpen className="h-4 w-4" />} label="Merenungkan Firman">
            <p className="devotion-body text-[15.5px] leading-[1.85] text-foreground/90">
              {devotion.unpacking}
            </p>
          </Section>

          <Section icon={<Sparkles className="h-4 w-4" />} label="Dalam Hidup Kita">
            <p className="devotion-body text-[15.5px] leading-[1.85] text-foreground/90">
              {devotion.application}
            </p>
          </Section>

          {/* Reflection questions — visually distinct */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-5">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <MessageSquareQuote className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Refleksi</span>
            </div>
            <ul className="space-y-3">
              {devotion.reflection.map((q, i) => (
                <li key={i} className="flex gap-3 text-[14.5px] leading-[1.7] text-foreground/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prayer */}
          <div className={`rounded-2xl border p-5 ${ACCENT_VERSE[accent]}`}>
            <div className="mb-3 flex items-center gap-2 text-primary">
              <HandHeart className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Doa Penutup</span>
            </div>
            <p className="font-display text-[15px] italic leading-[1.8] text-heading">
              {devotion.prayer}
            </p>
          </div>
        </div>

        {/* Share */}
        <div className="mt-10">
          <DailyShareButton
            title={devotion.title}
            verseRef={devotion.verseRef}
            verseText={devotion.verseText}
          />
          <p className="mt-3 text-center text-[12px] text-muted-foreground">
            Renungan berbeda setiap hari · Livyn
          </p>
        </div>
      </article>
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="animate-slide-up-fade">
      <div className="mb-3 flex items-center gap-2 text-primary/80">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  );
}
