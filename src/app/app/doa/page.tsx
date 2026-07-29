import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getUserPrayerReminders, getTodayPrayerLogReminderIds, getPrayerStreak } from "@/lib/queries/prayer";
import { listPersonalPrayers } from "@/lib/queries/personal-prayer";
import { getT, getLocale } from "@/lib/i18n/server";
import { formatHour, isReminderMistimed, peakHour } from "@/lib/habit";
import { TopBar } from "@/components/nav/top-bar";
import { PrayerReminders } from "@/components/prayer/prayer-reminders";
import { SmartReminderCard } from "@/components/prayer/smart-reminder-card";
import { PersonalPrayers } from "@/components/prayer/personal-prayers";

export default async function PrayerPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const [reminders, doneToday, streak, personalPrayers, user, t, locale] = await Promise.all([
    getUserPrayerReminders(session.sub),
    getTodayPrayerLogReminderIds(session.sub),
    getPrayerStreak(session.sub),
    listPersonalPrayers(session.sub),
    prisma.user.findUnique({ where: { id: session.sub }, select: { habitHours: true } }).catch(() => null),
    getT(),
    getLocale(),
  ]);

  const peak = peakHour(user?.habitHours);
  const activeReminders = reminders.filter((r: { active: boolean }) => r.active);
  // The switch reads "on" only when every active reminder is delegated, so a
  // half-migrated state never shows as fully automatic.
  const autoAdjust =
    activeReminders.length > 0 && activeReminders.every((r: { autoAdjust?: boolean }) => Boolean(r.autoAdjust));
  const showSuggestion =
    peak !== null && activeReminders.some((r: { time: string }) => isReminderMistimed(r.time, peak.hour));

  return (
    <div>
      <TopBar title={t("prayers.title")} />

      <SmartReminderCard
        peakHourLabel={peak ? formatHour(peak.hour) : null}
        showSuggestion={showSuggestion}
        autoAdjust={autoAdjust}
      />

      <PrayerReminders
        initialReminders={reminders.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        initialDoneToday={Array.from(doneToday)}
        streak={streak}
      />

      <PersonalPrayers
        locale={locale}
        initial={personalPrayers.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          answeredAt: p.answeredAt ? p.answeredAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
