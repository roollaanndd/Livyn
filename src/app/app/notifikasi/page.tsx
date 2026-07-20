import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";

export default async function NotificationsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div>
      <TopBar back title="Notifikasi" />
      <div className="space-y-2 px-4 pb-6 pt-3">
        {notifications.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center text-sm text-muted-foreground">
            <Bell className="mb-3 h-8 w-8 text-muted-foreground/50" />
            Belum ada notifikasi. Ayat harian, pengingat doa, dan khotbah baru akan muncul di sini.
          </div>
        )}
        {notifications.map((n) => (
          <Card key={n.id} className={`p-4 ${!n.readAt ? "border-primary/30" : ""}`}>
            <p className="font-semibold">{n.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {n.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
