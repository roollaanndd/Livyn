import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserPrayerReminders, getTodayPrayerLogReminderIds, getPrayerStreak } from "@/lib/queries/prayer";
import { TopBar } from "@/components/nav/top-bar";
import { PrayerReminders } from "@/components/prayer/prayer-reminders";

export default async function PrayerPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const [reminders, doneToday, streak] = await Promise.all([
    getUserPrayerReminders(session.sub),
    getTodayPrayerLogReminderIds(session.sub),
    getPrayerStreak(session.sub),
  ]);

  return (
    <div>
      <TopBar title="Pengingat Doa" />
      <PrayerReminders
        initialReminders={reminders.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        initialDoneToday={Array.from(doneToday)}
        streak={streak}
      />
    </div>
  );
}
