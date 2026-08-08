import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

/**
 * GDPR/UU-PDP data portability. Returns everything Livyn stores about the
 * signed-in user, as one JSON attachment. No credentials or hashes ever
 * leave (passwordHash, tokenHash, 2fa secrets are stripped) — the point is
 * transparency for the user, not a fresh attack surface if the file leaks.
 *
 * Rate-limited to one per hour per account to keep this from becoming a
 * cheap way to scrape the whole database if credentials are ever stolen.
 */

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  const limited = await rateLimit(`data-export:${session.sub}`, 1, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Kamu sudah mengekspor data belakangan ini. Coba lagi dalam beberapa waktu." },
      { status: 429 },
    );
  }

  const userId = session.sub;

  const [
    user,
    prayerReminders,
    prayerLogs,
    personalPrayers,
    journalEntries,
    favoriteVerses,
    bookmarks,
    highlights,
    notes,
    notifications,
    challengeProgress,
    readingPlanEnrollments,
    dailyActivity,
    pushSubscriptions,
    devices,
    loginHistory,
    circlesOwned,
    circleMemberships,
    prayerRequests,
    prayerIntercessions,
    friendshipsRequested,
    friendshipsReceived,
    versePingsSent,
    versePingsReceived,
    missionsCreated,
    missionCheckIns,
    broadcastsAuthored,
    contributorProfile,
    leaderProfile,
    devotions,
    sermons,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.prayerReminder.findMany({ where: { userId } }),
    prisma.prayerLog.findMany({ where: { userId } }),
    prisma.personalPrayer.findMany({ where: { userId } }),
    prisma.journalEntry.findMany({ where: { userId } }),
    prisma.favoriteVerse.findMany({ where: { userId } }),
    prisma.bookmark.findMany({ where: { userId } }),
    prisma.highlight.findMany({ where: { userId } }),
    prisma.note.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
    prisma.challengeProgress.findMany({ where: { userId } }),
    prisma.readingPlanEnrollment.findMany({ where: { userId } }),
    prisma.dailyActivity.findMany({ where: { userId } }),
    prisma.pushSubscription.findMany({ where: { userId } }),
    prisma.device.findMany({ where: { userId } }),
    prisma.loginEvent.findMany({ where: { userId } }),
    prisma.circle.findMany({ where: { ownerId: userId } }),
    prisma.circleMember.findMany({ where: { userId } }),
    prisma.prayerRequest.findMany({ where: { userId } }),
    prisma.prayerIntercession.findMany({ where: { userId } }),
    prisma.friendship.findMany({ where: { requesterId: userId } }),
    prisma.friendship.findMany({ where: { addresseeId: userId } }),
    prisma.versePing.findMany({ where: { fromUserId: userId } }),
    prisma.versePing.findMany({ where: { toUserId: userId } }),
    prisma.weeklyMission.findMany({ where: { createdById: userId } }),
    prisma.missionCheckIn.findMany({ where: { userId } }),
    prisma.circleBroadcast.findMany({ where: { createdById: userId } }),
    // findUnique returns null on no match; a rejected promise here means a
    // real DB error we should surface via Promise.all, not silently swallow.
    prisma.contributorProfile.findUnique({ where: { userId } }),
    prisma.leaderProfile.findUnique({ where: { userId } }),
    prisma.devotion.findMany({ where: { authorId: userId } }),
    prisma.sermon.findMany({ where: { authorId: userId } }),
  ]);

  // Strip sensitive fields; the goal is transparency, not a replay attack kit.
  // Copy rather than mutate the Prisma-returned object — sharing the reference
  // with any other consumer in the same request would leak the redaction.
  let sanitizedUser: Record<string, unknown> | null = null;
  if (user) {
    const {
      passwordHash: _pw,
      twoFactorSecret: _tfa,
      ...safe
    } = user as Record<string, unknown>;
    void _pw;
    void _tfa;
    sanitizedUser = safe;
  }

  const sanitizedPushSubs = (pushSubscriptions as Array<Record<string, unknown>>).map((s) => {
    // Endpoint is per-device and knowing it enables push replay from another
    // account holder if the file leaks — drop endpoint/keys, keep only the
    // browser identifier and any non-sensitive metadata.
    const { endpoint: _e, p256dh: _p, auth: _a, ...safe } = s;
    void _e;
    void _p;
    void _a;
    return safe;
  });

  await logAudit({ userId, action: "auth.data_exported" });

  const payload = {
    _meta: {
      generatedAt: new Date().toISOString(),
      about: "Semua data yang Livyn simpan tentangmu. Kata sandi, kode 2FA, dan endpoint push tidak disertakan.",
      contact: "privasi@livyn.app",
    },
    user: sanitizedUser,
    contributorProfile,
    leaderProfile,
    devotionsAuthored: devotions,
    sermonsAuthored: sermons,
    prayerReminders,
    prayerLogs,
    personalPrayers,
    journalEntries,
    favoriteVerses,
    bookmarks,
    highlights,
    notes,
    notifications,
    challengeProgress,
    readingPlanEnrollments,
    dailyActivity,
    pushSubscriptions: sanitizedPushSubs,
    devices,
    loginHistory,
    community: {
      circlesOwned,
      circleMemberships,
      prayerRequests,
      prayerIntercessions,
      friendshipsRequested,
      friendshipsReceived,
      versePingsSent,
      versePingsReceived,
      missionsCreated,
      missionCheckIns,
      broadcastsAuthored,
    },
  };

  const filename = `livyn-data-${userId}-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
