import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listFriends, listReceivedVersePings } from "@/lib/queries/community";
import { TopBar } from "@/components/nav/top-bar";
import { FriendInvitePanel } from "@/components/community/friend-invite-panel";
import { FriendList } from "@/components/community/friend-list";
import { VersePingInbox } from "@/components/community/verse-ping-inbox";

export default async function FriendsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const [friends, pings] = await Promise.all([
    listFriends(session.sub).catch(() => []),
    listReceivedVersePings(session.sub, 30).catch(() => []),
  ]);

  const pingsForClient = pings.map((p) => ({
    id: p.id,
    verseRef: p.verseRef,
    verseText: p.verseText,
    note: p.note,
    readAt: p.readAt ? p.readAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    fromUser: p.fromUser,
  }));

  const unreadCount = pings.filter((p) => !p.readAt).length;

  return (
    <div>
      <TopBar title="Teman" />

      <div className="space-y-8 px-5 pb-8">
        {/* Verse pings — top position, most engaging */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-extrabold text-heading">
              Ayat Untukmu
            </h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                {unreadCount} baru
              </span>
            )}
          </div>
          <VersePingInbox pings={pingsForClient} />
        </section>

        {/* Invite panel */}
        <section>
          <h2 className="mb-3 font-display text-[15px] font-extrabold text-heading">Undang & Terima</h2>
          <FriendInvitePanel />
        </section>

        {/* Friend list */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-extrabold text-heading">Temanmu</h2>
            <span className="text-[12px] text-muted-foreground">{friends.length} orang</span>
          </div>
          <FriendList friends={friends} />
        </section>
      </div>
    </div>
  );
}
