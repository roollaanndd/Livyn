import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { areFriends } from "@/lib/queries/community";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { VersePingComposer } from "@/components/community/verse-ping-composer";

export default async function SendVersePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { id: friendId } = await params;
  const isFriend = await areFriends(session.sub, friendId);
  if (!isFriend) redirect("/app/teman");

  const friend = await prisma.user.findUnique({
    where: { id: friendId },
    select: { id: true, name: true, avatarUrl: true },
  });
  if (!friend) notFound();

  return (
    <div>
      <TopBar back title="Kirim Ayat" />
      <div className="px-5 pb-10 pt-2">
        <VersePingComposer friendId={friend.id} friendName={friend.name} />
      </div>
    </div>
  );
}
