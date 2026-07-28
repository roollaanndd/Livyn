import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push/send";
import { getTodayVerse } from "@/lib/queries/home";
import { formatHour, peakHour } from "@/lib/habit";

// Triggered by an external scheduler (Vercel Cron, or any cron-job.org /
// GitHub Actions schedule hitting this URL with the shared secret). Designed
// to be safe to call at any interval: prayer reminders are matched against a
// trailing time window (so a coarser cron cadence just means slightly late,
// not missed, reminders), and the daily verse push is deduped per calendar
// day via the Setting table so it only ever goes out once regardless of how
// often the cron fires.
function minutesSinceMidnight(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windowMinutes = Number(req.nextUrl.searchParams.get("windowMinutes") ?? 15);
  // Reminder times are Indonesian local times; the server runs in UTC.
  // Shift to Asia/Jakarta (UTC+7, no DST) before comparing.
  const jkt = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const nowMinutes = jkt.getUTCHours() * 60 + jkt.getUTCMinutes();
  const dow = jkt.getUTCDay();

  const reminders = await prisma.prayerReminder.findMany({ where: { active: true } });

  // Members with autoAdjust on are sent at their own habit hour instead of the
  // hour they once typed in. One lookup per such member, cached across their
  // reminders so a person with four reminders costs one query, not four.
  const habitHourByUser = new Map<string, number | null>();
  async function effectiveTime(r: { userId: string; time: string; autoAdjust?: boolean }) {
    if (!r.autoAdjust) return r.time;
    if (!habitHourByUser.has(r.userId)) {
      const user = await prisma.user
        .findUnique({ where: { id: r.userId }, select: { habitHours: true } })
        .catch(() => null);
      habitHourByUser.set(r.userId, user ? (peakHour(user.habitHours)?.hour ?? null) : null);
    }
    const hour = habitHourByUser.get(r.userId);
    // Not enough evidence yet — fall back to the time they set themselves.
    return hour === null || hour === undefined ? r.time : formatHour(hour);
  }

  let prayerSent = 0;
  for (const r of reminders) {
    const diff = nowMinutes - minutesSinceMidnight(await effectiveTime(r));
    if (diff < 0 || diff >= windowMinutes) continue;
    if (!r.daysOfWeek.split(",").map(Number).includes(dow)) continue;
    const { sent } = await sendPushToUser(r.userId, {
      title: `🙏 ${r.label}`,
      body: "Waktunya berdoa. Tuhan menantikanmu.",
      url: "/app/doa",
      tag: `prayer-${r.id}`,
    });
    prayerSent += sent;
  }

  let verseSent = 0;
  const todayStr = jkt.toISOString().slice(0, 10); // Jakarta calendar day
  const lastVerseSetting = await prisma.setting.findUnique({ where: { key: "push:lastDailyVerseDate" } });
  // Send the daily verse once per Jakarta day, and only from 06:00 WIB onward
  // so subscribers get it in the morning rather than at midnight.
  if (nowMinutes >= 6 * 60 && lastVerseSetting?.value !== todayStr) {
    const verse = await getTodayVerse();
    if (verse) {
      const subscribedUserIds = await prisma.pushSubscription.findMany({
        select: { userId: true },
        distinct: ["userId"],
      });
      for (const { userId } of subscribedUserIds) {
        const { sent } = await sendPushToUser(userId, {
          title: "📖 Ayat Hari Ini",
          body: `"${verse.text}" — ${verse.book.name} ${verse.chapter}:${verse.verse}`,
          url: "/app",
          tag: "daily-verse",
        });
        verseSent += sent;
      }
    }
    await prisma.setting.upsert({
      where: { key: "push:lastDailyVerseDate" },
      update: { value: todayStr },
      create: { key: "push:lastDailyVerseDate", value: todayStr },
    });
  }

  return NextResponse.json({ ok: true, prayerSent, verseSent });
}
