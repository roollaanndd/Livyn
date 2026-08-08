import { notFound, redirect } from "next/navigation";
import { Users, Crown } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getCircleById,
  getMyCircleRole,
  listCircleMembers,
  listCirclePrayers,
  listActiveMissionsForCircle,
  listCircleBroadcasts,
  hasIPrayed,
  getMyCheckInsForMissions,
} from "@/lib/queries/community";
import { TopBar } from "@/components/nav/top-bar";
import { CircleHeaderActions } from "@/components/community/circle-header-actions";
import { CircleTabs } from "@/components/community/circle-tabs";
import { PrayerRequestList } from "@/components/community/prayer-request-list";
import { MissionList } from "@/components/community/mission-list";
import { BroadcastList } from "@/components/community/broadcast-list";

export default async function CircleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { id } = await params;
  const [circle, myRole] = await Promise.all([
    getCircleById(id),
    getMyCircleRole(id, session.sub),
  ]);
  if (!circle) notFound();
  if (!myRole) redirect("/app/circle");

  const [members, prayersRaw, missionsRaw, broadcasts] = await Promise.all([
    listCircleMembers(id),
    listCirclePrayers(id, session.sub).catch(() => []),
    listActiveMissionsForCircle(id).catch(() => []),
    listCircleBroadcasts(id, 20).catch(() => []),
  ]);

  const prayerIntercessions = await Promise.all(
    prayersRaw.map((p) => hasIPrayed(p.id, session.sub)),
  );

  const missionCheckIns = await getMyCheckInsForMissions(
    missionsRaw.map((m) => m.id),
    session.sub,
  );

  const prayers = prayersRaw.map((p, i) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    isAnonymous: p.isAnonymous,
    status: p.status,
    answeredNote: p.answeredNote,
    createdAt: p.createdAt.toISOString(),
    user: p.user,
    _count: p._count,
    haveIPrayed: prayerIntercessions[i],
    canModify: p.userId === session.sub || myRole === "leader",
  }));

  const totalMembers = members.length;
  const missions = missionsRaw.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    startDate: m.startDate.toISOString(),
    endDate: m.endDate.toISOString(),
    totalMembers,
    checkedInCount: m._count.checkIns,
    haveICheckedIn: missionCheckIns.has(m.id),
  }));

  const broadcastsForClient = broadcasts.map((b) => ({
    id: b.id,
    type: b.type,
    title: b.title,
    body: b.body,
    bibleRefs: b.bibleRefs,
    sundayDate: b.sundayDate ? b.sundayDate.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
    createdBy: b.createdBy,
  }));

  const isPastoral = circle.type === "pastoral";
  const isLeader = myRole === "leader";
  const openPrayerCount = prayers.filter((p) => p.status === "open").length;

  const tabs = [
    { id: "prayers", label: "Doa", badge: openPrayerCount },
    { id: "missions", label: "Misi", badge: missions.length },
    ...(isPastoral || broadcasts.length > 0
      ? [{ id: "broadcasts", label: "Siaran", badge: broadcasts.length }]
      : []),
    { id: "members", label: "Anggota", badge: totalMembers },
  ];

  return (
    <div>
      <TopBar back title="" transparent />

      {/* Hero */}
      <div className="relative -mt-14 pt-14">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-56"
          style={{ background: "linear-gradient(180deg, var(--primary-soft) 0%, transparent 100%)" }}
        />
        <div className="relative px-5 pt-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white text-[30px] shadow-[var(--shadow-md)]">
              {circle.emoji || "🌿"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {isPastoral && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    <Crown className="h-3 w-3" /> Pastoral
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Users className="h-3 w-3" /> {totalMembers}/{circle.memberLimit}
                </span>
              </div>
              <h1 className="mt-1.5 font-display text-[22px] font-extrabold leading-tight text-heading">
                {circle.name}
              </h1>
              {circle.description && (
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {circle.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <CircleHeaderActions
              circleId={circle.id}
              circleName={circle.name}
              joinCode={circle.joinCode}
              isOwner={circle.ownerId === session.sub}
            />
          </div>
        </div>
      </div>

      <div className="px-5 pb-10 pt-6">
        <CircleTabs
          tabs={tabs}
          panels={[
            <PrayerRequestList key="p" circleId={circle.id} prayers={prayers} currentUserId={session.sub} />,
            <MissionList key="m" circleId={circle.id} missions={missions} canCreate={isLeader} />,
            ...(isPastoral || broadcasts.length > 0
              ? [<BroadcastList key="b" circleId={circle.id} broadcasts={broadcastsForClient} canCreate={isLeader} />]
              : []),
            <MemberList key="mb" members={members} ownerId={circle.ownerId} />,
          ]}
        />
      </div>
    </div>
  );
}

function MemberList({
  members,
  ownerId,
}: {
  members: Awaited<ReturnType<typeof listCircleMembers>>;
  ownerId: string;
}) {
  return (
    <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
      {members.map((m) => (
        <li key={m.id} className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-[12px] font-bold text-primary">
            {m.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-heading">{m.user.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {m.role === "leader" ? "Pemimpin" : m.role === "co-leader" ? "Co-leader" : "Anggota"} · sejak{" "}
              {new Date(m.joinedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </p>
          </div>
          {m.user.id === ownerId && <Crown className="h-4 w-4 text-amber-500" />}
        </li>
      ))}
    </ul>
  );
}

