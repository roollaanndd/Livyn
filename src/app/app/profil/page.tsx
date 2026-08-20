import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LivynBookmarkCheck,
  LivynShieldCheck,
  LivynDevice,
  LivynDashboard,
  LivynClipboardList,
  LivynChevronRight,
  LivynJournal,
  LivynTrophy,
  LivynPeople,
  LivynQuote,
  LivynCrown,
  LivynCompass,
  LivynPrayer,
  LivynScroll,
} from "@/components/icons/livyn-icons";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth/rbac";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/profile/theme-toggle";
import { LogoutButton } from "@/components/profile/logout-button";
import { LanguageSwitch } from "@/components/profile/language-switch";
import { PushToggle } from "@/components/push/push-toggle";
import { AccountControls } from "@/components/profile/account-controls";

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) redirect("/");

  const [bookmarkCount, deviceCount, streakLogCount, t] = await Promise.all([
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.loginEvent.count({ where: { userId: user.id, success: true } }),
    prisma.prayerLog.count({ where: { userId: user.id } }),
    getT(),
  ]);

  const ROLE_KEYS = {
    user: "roles.user",
    contributor: "roles.contributor",
    moderator: "roles.moderator",
    admin: "roles.admin",
    super_admin: "roles.super_admin",
    leader: "roles.leader",
  } as const;
  const roleKey = ROLE_KEYS[user.role as keyof typeof ROLE_KEYS];

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
          {roleKey ? t(roleKey) : user.role}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-7 grid grid-cols-3 gap-2.5">
        {[
          { value: bookmarkCount, label: t("profile.savedCount") },
          { value: streakLogCount, label: t("profile.prayerCount") },
          { value: deviceCount, label: t("profile.loginCount") },
        ].map((stat) => (
          <Card key={stat.label} className="flex flex-col items-center gap-0.5 p-4">
            <p className="font-display text-lg font-bold text-heading">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Preferences */}
      <div className="mt-7">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {t("profile.sectionPreferences")}
        </p>
        <Card className="divide-y divide-border-subtle overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4">
            <span className="text-[13px] font-medium text-heading">{t("profile.language")}</span>
            <LanguageSwitch />
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <span className="text-[13px] font-medium text-heading">{t("profile.theme")}</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <span className="text-[13px] font-medium text-heading">{t("profile.pushNotifications")}</span>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Pengingat doa, ayat harian, tantangan</p>
            </div>
            <PushToggle />
          </div>
        </Card>
      </div>

      {/* Menu */}
      <div className="mt-6">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Menu</p>
        <Card className="divide-y divide-border-subtle overflow-hidden">
          <ProfileLink href="/app/favorit" icon={LivynBookmarkCheck} label={t("profile.favorites")} />
          <ProfileLink href="/app/doa" icon={LivynPrayer} label={t("profile.answeredPrayers")} />
          <ProfileLink href="/app/teman" icon={LivynQuote} label="Teman & Ayat Masuk" />
          <ProfileLink href="/app/circle" icon={LivynPeople} label="Circle" />
          <ProfileLink href="/app/pemimpin" icon={LivynCrown} label="Pemimpin" />
          <ProfileLink href="/app/jurnal" icon={LivynJournal} label="Jurnal Curhatku" />
          <ProfileLink href="/app/tantangan" icon={LivynTrophy} label="Tantangan Bulanan" />
          <ProfileLink href="/app/devosi/tersimpan" icon={LivynBookmarkCheck} label="Renungan Tersimpan" />
          <ProfileLink href="/app/profil/keamanan" icon={LivynShieldCheck} label="Keamanan & Sesi Login" />
          <ProfileLink href="/app/profil/perangkat" icon={LivynDevice} label="Perangkat Terhubung" />
          <ProfileLink href="/onboarding" icon={LivynCompass} label="Lihat Panduan Livyn" />
          {hasRole(user.role, "contributor") && (
            <ProfileLink href="/contributor" icon={LivynClipboardList} label="Dasbor Kontributor" />
          )}
          {hasRole(user.role, "moderator") && (
            <ProfileLink href="/admin" icon={LivynDashboard} label="Dasbor Admin" />
          )}
        </Card>
      </div>

      {/* About */}
      <div className="mt-6">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {t("profile.sectionAbout")}
        </p>
        <Card className="divide-y divide-border-subtle overflow-hidden">
          <ProfileLink href="/syarat-ketentuan" icon={LivynScroll} label={t("profile.terms")} />
          <ProfileLink href="/kebijakan-privasi" icon={LivynShieldCheck} label={t("profile.privacy")} />
        </Card>
      </div>

      {/* Data & Akun — Play Store and App Store require both delete and export
          to be discoverable inside the app itself. */}
      <AccountControls hasPassword={Boolean(user.passwordHash)} />

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

function ProfileLink({ href, icon: Icon, label }: { href: string; icon: typeof LivynBookmarkCheck; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 p-4 hover:bg-surface-muted/50 transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
        <Icon className="h-[16px] w-[16px] text-muted-foreground" />
      </div>
      <span className="flex-1 text-[13px] font-medium text-heading">{label}</span>
      <LivynChevronRight className="h-4 w-4 text-muted-foreground/40" />
    </Link>
  );
}
