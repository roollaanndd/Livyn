import { redirect } from "next/navigation";
import { LivynShieldCheck, LivynShieldX } from "@/components/icons/livyn-icons";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { RevokeSessionsButton } from "@/components/profile/revoke-sessions-button";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export default async function SecurityPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const events = await prisma.loginEvent.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <TopBar back title="Keamanan & Sesi Login" />
      <div className="px-5 pt-3">
        <ChangePasswordForm />

        <Card className="mb-5 p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Keluar dari semua perangkat lain jika kamu curiga akunmu diakses tanpa izin. Kamu akan tetap masuk di perangkat ini.
          </p>
          <RevokeSessionsButton />
        </Card>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Riwayat Login</p>
        <div className="space-y-2 pb-8">
          {events.map((e) => (
            <Card key={e.id} className="flex items-start gap-3 p-3.5">
              {e.success ? (
                <LivynShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <LivynShieldX className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.success ? "Login berhasil" : "Login gagal"}</p>
                <p className="truncate text-xs text-muted-foreground">{e.ipAddress ?? "IP tidak diketahui"} · {e.userAgent ?? "Perangkat tidak diketahui"}</p>
                <p className="text-xs text-muted-foreground">
                  {e.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
