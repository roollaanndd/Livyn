import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkCheck, ShieldCheck, Smartphone, LayoutDashboard, ClipboardList, ChevronRight, BookHeart, Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth/rbac";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/profile/theme-toggle";
import { LogoutButton } from "@/components/profile/logout-button";
import { PushToggle } from "@/components/push/push-toggle";

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) redirect("/");

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
    <div className="px-5 pb-10 safe-top animate-fade-in">
      {/* Profile header */}
      <div className="flex flex-col items-center pt-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 scale-125 blur-xl">
            <div className="h-full w-full rounded-full bg-primary/10" />
          </div>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-soft">
            <span className="font-display text-3xl font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <h1 className="font-display mt-4 text-xl font-bold text-heading">{user.name}</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{user.email}</p>
        <span className="mt-3 rounded-full bg-primary-soft px-3.5 py-1.5 text-[11px] font-semibold text-primary uppercase tracking-wider">
          {roleLabel[user.role] ?? user.role}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-7 grid grid-cols-3 gap-2.5">
        {[
          { value: bookmarkCount, label: "Tersimpan" },
          { value: streakLogCount, label: "Total Doa" },
          { value: deviceCount, label: "Login" },
        ].map((stat) => (
          <Card key={stat.label} className="flex flex-col items-center gap-0.5 p-4">
            <p className="font-display text-lg font-bold text-heading">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Appearance */}
      <div className="mt-7">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Tampilan</p>
        <Card className="flex items-center justify-between p-4">
          <span className="text-[13px] font-medium text-heading">Tema Aplikasi</span>
          <ThemeToggle />
        </Card>
      </div>

      {/* Notifications */}
      <div className="mt-6">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Notifikasi</p>
        <Card className="flex items-center justify-between p-4">
          <div>
            <span className="text-[13px] font-medium text-heading">Notifikasi Push</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pengingat doa, ayat harian, tantangan</p>
          </div>
          <PushToggle />
        </Card>
      </div>

      {/* Menu */}
      <div className="mt-6">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Menu</p>
        <Card className="divide-y divide-border-subtle overflow-hidden">
          <ProfileLink href="/app/jurnal" icon={BookHeart} label="Jurnal Curhatku" />
          <ProfileLink href="/app/tantangan" icon={Trophy} label="Tantangan Bulanan" />
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

      {/* Logout */}
      <div className="mt-6">
        <Card className="overflow-hidden">
          <LogoutButton />
        </Card>
      </div>

      <p className="mt-8 text-center text-[11px] text-muted-foreground/60">
        Livyn · Faith. Every Day. Every Step.
      </p>
    </div>
  );
}

function ProfileLink({ href, icon: Icon, label }: { href: string; icon: typeof BookmarkCheck; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 p-4 hover:bg-surface-muted/50 transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
        <Icon className="h-[16px] w-[16px] text-muted-foreground" />
      </div>
      <span className="flex-1 text-[13px] font-medium text-heading">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
    </Link>
  );
}
