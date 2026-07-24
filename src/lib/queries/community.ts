import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

// -------- FRIENDS --------

export const listFriends = cache(async (userId: string) => {
  // Friendship rows where I'm either side. We fetch both directions and dedupe.
  const [asRequester, asAddressee] = await Promise.all([
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "accepted" },
      include: { addressee: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: { addresseeId: userId, status: "accepted" },
      include: { requester: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  type Friend = { id: string; name: string; avatarUrl: string | null; since: Date };
  const seen = new Set<string>();
  const friends: Friend[] = [];
  for (const r of asRequester) {
    if (r.addressee && !seen.has(r.addressee.id)) {
      seen.add(r.addressee.id);
      friends.push({ ...r.addressee, since: r.createdAt });
    }
  }
  for (const r of asAddressee) {
    if (r.requester && !seen.has(r.requester.id)) {
      seen.add(r.requester.id);
      friends.push({ ...r.requester, since: r.createdAt });
    }
  }
  return friends;
});

export const areFriends = cache(async (userA: string, userB: string): Promise<boolean> => {
  if (userA === userB) return true;
  const match = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: userA, addresseeId: userB },
        { requesterId: userB, addresseeId: userA },
      ],
    },
    select: { id: true },
  });
  return !!match;
});

// -------- VERSE PINGS --------

export const listReceivedVersePings = cache(async (userId: string, limit = 20) =>
  prisma.versePing.findMany({
    where: { toUserId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { fromUser: { select: { id: true, name: true, avatarUrl: true } } },
  }),
);

export const unreadVersePingCount = cache(async (userId: string): Promise<number> => {
  return prisma.versePing.count({ where: { toUserId: userId, readAt: null } });
});

// -------- CIRCLES --------

export const listMyCircles = cache(async (userId: string) => {
  const memberships = await prisma.circleMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    include: {
      circle: {
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { members: true, prayers: true, missions: true } },
        },
      },
    },
  });
  return memberships.map((m) => ({ ...m.circle, memberRole: m.role }));
});

export const getCircleById = cache(async (id: string) =>
  prisma.circle.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true, role: true } },
      _count: { select: { members: true, prayers: true, missions: true } },
    },
  }),
);

export const getMyCircleRole = cache(async (circleId: string, userId: string) => {
  const membership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId, userId } },
    select: { role: true },
  });
  return membership?.role ?? null;
});

export const listCircleMembers = cache(async (circleId: string) =>
  prisma.circleMember.findMany({
    where: { circleId },
    orderBy: { joinedAt: "asc" },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  }),
);

// -------- PRAYER REQUESTS --------

export const listCirclePrayers = cache(async (circleId: string, status = "open") =>
  prisma.prayerRequest.findMany({
    where: { circleId, status },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { intercessions: true } },
    },
  }),
);

export const listMyOpenPrayerCountAcrossCircles = cache(async (userId: string): Promise<number> => {
  // How many prayer requests exist in circles I belong to that are still open?
  const memberships = await prisma.circleMember.findMany({
    where: { userId },
    select: { circleId: true },
  });
  if (memberships.length === 0) return 0;
  // No `in` support guaranteed for our custom adapter across all fields; fetch per-circle then sum.
  const counts = await Promise.all(
    memberships.map((m) =>
      prisma.prayerRequest.count({ where: { circleId: m.circleId, status: "open" } }),
    ),
  );
  return counts.reduce((a, b) => a + b, 0);
});

export const hasIPrayed = cache(async (prayerRequestId: string, userId: string): Promise<boolean> => {
  const row = await prisma.prayerIntercession.findUnique({
    where: { prayerRequestId_userId: { prayerRequestId, userId } },
    select: { id: true },
  });
  return !!row;
});

// -------- MISSIONS --------

export const listActiveMissionsForCircle = cache(async (circleId: string) =>
  prisma.weeklyMission.findMany({
    where: { circleId, endDate: { gte: new Date() } },
    orderBy: { endDate: "asc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { checkIns: true } },
    },
  }),
);

export const getMyCheckInsForMissions = cache(async (missionIds: string[], userId: string) => {
  if (missionIds.length === 0) return new Set<string>();
  const rows = await Promise.all(
    missionIds.map((mid) =>
      prisma.missionCheckIn.findUnique({
        where: { missionId_userId: { missionId: mid, userId } },
        select: { missionId: true },
      }),
    ),
  );
  return new Set(rows.filter(Boolean).map((r) => r!.missionId));
});

// -------- BROADCASTS --------

export const listCircleBroadcasts = cache(async (circleId: string, limit = 10) =>
  prisma.circleBroadcast.findMany({
    where: { circleId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { createdBy: { select: { id: true, name: true, avatarUrl: true } } },
  }),
);

// -------- LEADER --------

export const getLeaderProfile = cache(async (userId: string) =>
  prisma.leaderProfile.findUnique({ where: { userId } }),
);

export const listPendingLeaderApplications = cache(async () =>
  prisma.leaderProfile.findMany({
    where: { verified: false, rejectReason: null },
    orderBy: { submittedAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  }),
);
