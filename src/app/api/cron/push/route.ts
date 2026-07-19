import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push/send";
import { getTodayVerse } from "@/lib/queries/home";

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
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const dow = now.getDay();

  const reminders = await prisma.prayerReminder.findMany({ where: { active: true } });
  let prayerSent = 0;
  for (const r of reminders) {
    const diff = nowMinutes - minutesSinceMidnight(r.time);
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
  const todayStr = now.toISOString().slice(0, 10);
  const lastVerseSetting = await prisma.setting.findUnique({ where: { key: "push:lastDailyVerseDate" } });
  if (lastVerseSetting?.value !== todayStr) {
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
