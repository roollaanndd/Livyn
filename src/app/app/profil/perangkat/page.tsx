import { redirect } from "next/navigation";
import { Smartphone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";

export default async function DevicesPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const events = await prisma.loginEvent.findMany({
    where: { userId: session.sub, success: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const devices = new Map<string, { userAgent: string; lastSeen: Date; count: number }>();
  for (const e of events) {
    const key = e.userAgent ?? "unknown";
    const existing = devices.get(key);
    if (existing) existing.count += 1;
    else devices.set(key, { userAgent: key, lastSeen: e.createdAt, count: 1 });
  }

  return (
    <div>
      <TopBar back title="Perangkat Terhubung" />
      <div className="px-5 pt-3">
        <p className="mb-4 text-sm text-muted-foreground">
          Daftar ini diturunkan dari riwayat login browser/perangkatmu.
        </p>
        <div className="space-y-2 pb-8">
          {Array.from(devices.values()).map((d, i) => (
            <Card key={i} className="flex items-center gap-3 p-4">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.userAgent}</p>
                <p className="text-xs text-muted-foreground">
                  Terakhir aktif {d.lastSeen.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
