import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Bell, ChevronRight, Flame, PlayCircle, CalendarHeart } from "lucide-react";
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
import { upcomingChristianEvents } from "@/lib/christian-calendar";
import { Card } from "@/components/ui/card";
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
  if (!session) redirect("/masuk");

  const [user, verse, devotion, sermon, continueWatching, reminders, streak, events] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub }, select: { name: true, avatarUrl: true } }),
    getTodayVerse(),
    getTodayDevotion(),
    getLatestSermon(),
    getContinueWatching(session.sub),
    getUpcomingReminders(session.sub),
    getPrayerStreak(session.sub),
    Promise.resolve(upcomingChristianEvents(3)),
  ]);

  const firstName = (user?.name ?? session.name).split(" ")[0];

  return (
    <div>
      <header className="flex items-center gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="font-display text-xl font-bold">{firstName} 👋</h1>
        </div>
        <IconLink href="/app/cari" label="Cari">
          <Search className="h-5 w-5" />
        </IconLink>
        <IconLink href="/app/notifikasi" label="Notifikasi">
          <Bell className="h-5 w-5" />
        </IconLink>
        <Link href="/app/profil" className="ml-1 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10">
          <span className="font-display text-sm font-bold text-primary">{firstName.charAt(0).toUpperCase()}</span>
        </Link>
      </header>

      <div className="space-y-5 px-5 pb-6">
        {/* Today's Verse */}
        {verse && (
          <Card className="relative overflow-hidden border-none bg-[#0B0D1A] text-white">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#6C5CE7]/30 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#6EE7C1]/20 blur-2xl" />
            <div className="relative p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Ayat Hari Ini</span>
                <LivynMark className="h-6 w-6 opacity-70" />
              </div>
              <p className="font-display text-lg leading-relaxed">&ldquo;{verse.text}&rdquo;</p>
              <p className="mt-3 text-sm font-medium text-[#A78BFA]">
                {verse.book.name} {verse.chapter}:{verse.verse}
              </p>
            </div>
          </Card>
        )}

        {/* Today's Devotion */}
        {devotion && (
          <Link href={`/app/devosi/${devotion.slug}`}>
            <Card className="p-0 overflow-hidden active:scale-[0.99] transition-transform">
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Badge>Renungan Hari Ini</Badge>
                  {devotion.category && <Badge variant="muted">{devotion.category.name}</Badge>}
                </div>
                <h2 className="font-display text-lg font-bold leading-snug">{devotion.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{devotion.excerpt}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{devotion.author.name} · {devotion.readingTimeMin} menit baca</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Prayer reminder widget */}
        <Card>
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="font-display text-base font-bold">Pengingat Doa</h3>
            <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Flame className="h-4 w-4" /> {streak} hari
            </div>
          </div>
          <div className="space-y-2 px-5 pb-5">
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pengingat doa. Yuk atur yang pertama.</p>
            ) : (
              reminders.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-2.5">
                  <span className="text-sm font-medium">{r.label}</span>
                  <span className="text-sm text-muted-foreground">{r.time}</span>
                </div>
              ))
            )}
            <Link href="/app/doa" className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-primary">
              Kelola Pengingat <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Continue watching */}
        {continueWatching.length > 0 && (
          <div>
            <h3 className="font-display mb-3 text-base font-bold">Lanjutkan Menonton</h3>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
              {continueWatching.map((w) => (
                <Link key={w.id} href={`/app/khotbah/${w.sermon.slug}`} className="w-56 shrink-0">
                  <Card className="overflow-hidden p-0">
                    <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary to-secondary">
                      <PlayCircle className="h-9 w-9 text-white/90" />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold">{w.sermon.title}</p>
                      <p className="text-xs text-muted-foreground">{w.sermon.pastor}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Latest sermon */}
        {sermon && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Khotbah Terbaru</h3>
              <Link href="/app/khotbah" className="text-xs font-semibold text-primary">Lihat Semua</Link>
            </div>
            <Link href={`/app/khotbah/${sermon.slug}`}>
              <Card className="overflow-hidden p-0 active:scale-[0.99] transition-transform">
                <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-[#0B0D1A] to-[#2b2f4a]">
                  <PlayCircle className="h-11 w-11 text-white/90" />
                  <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
                    {formatDurationShort(sermon.durationSec)}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-semibold leading-snug">{sermon.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sermon.pastor} · {sermon.church}</p>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Upcoming events */}
        <div>
          <h3 className="font-display mb-3 text-base font-bold">Peristiwa Kristiani Mendatang</h3>
          <Card>
            <ul className="divide-y divide-border">
              {events.map((e) => (
                <li key={e.name} className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <CalendarHeart className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
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
