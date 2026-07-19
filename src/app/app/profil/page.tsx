import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkCheck, ShieldCheck, Smartphone, LayoutDashboard, ClipboardList, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth/rbac";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/profile/theme-toggle";
import { LogoutButton } from "@/components/profile/logout-button";

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/masuk");

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) redirect("/masuk");

  const [bookmarkCount, deviceCount, streakLogCount] = await Promise.all([
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.loginEvent.count({ where: { userId: user.id, success: true } }),
    prisma.prayerLog.count({ where: { userId: user.id } }),
  ]);

  const roleLabel: Record<string, string> = {
    user: "Jemaat",
    contributor: "Kontributor",
    moderator: "Moderator",
    admin: "Admin",
    super_admin: "Super Admin",
  };

  return (
    <div className="px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <span className="font-display text-3xl font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
        </div>
        <h1 className="font-display mt-3 text-xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <span className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {roleLabel[user.role] ?? user.role}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <Card className="p-3">
          <p className="font-display text-lg font-bold">{bookmarkCount}</p>
          <p className="text-xs text-muted-foreground">Tersimpan</p>
        </Card>
        <Card className="p-3">
          <p className="font-display text-lg font-bold">{streakLogCount}</p>
          <p className="text-xs text-muted-foreground">Total Doa</p>
        </Card>
        <Card className="p-3">
          <p className="font-display text-lg font-bold">{deviceCount}</p>
          <p className="text-xs text-muted-foreground">Login</p>
        </Card>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tampilan</p>
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">Tema Aplikasi</span>
          <ThemeToggle />
        </Card>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Menu</p>
        <Card className="divide-y divide-border">
          <ProfileLink href="/app/devosi/tersimpan" icon={BookmarkCheck} label="Renungan Tersimpan" />
          <ProfileLink href="/app/profil/keamanan" icon={ShieldCheck} label="Keamanan & Sesi Login" />
          <ProfileLink href="/app/profil/perangkat" icon={Smartphone} label="Perangkat Terhubung" />
          {hasRole(user.role, "contributor") && (
            <ProfileLink href="/contributor" icon={ClipboardList} label="Dasbor Kontributor" />
          )}
          {hasRole(user.role, "moderator") && (
            <ProfileLink href="/admin" icon={LayoutDashboard} label="Dasbor Admin" />
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <LogoutButton />
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">Livyn · Faith. Every Day.</p>
    </div>
  );
}

function ProfileLink({ href, icon: Icon, label }: { href: string; icon: typeof BookmarkCheck; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4">
      <Icon className="h-4.5 w-4.5 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
