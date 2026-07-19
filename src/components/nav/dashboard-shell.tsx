"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, Clapperboard, Users, ClipboardCheck, Tags, ScrollText, Trophy } from "lucide-react";
import { LivynMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type DashboardNavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const ICONS = { LayoutDashboard, Sparkles, Clapperboard, Users, ClipboardCheck, Tags, ScrollText, Trophy };

const NAV_CONFIG: Record<"contributor" | "admin", { homeHref: string; items: Array<{ href: string; label: string; icon: keyof typeof ICONS }> }> = {
  contributor: {
    homeHref: "/contributor",
    items: [
      { href: "/contributor", label: "Dasbor", icon: "LayoutDashboard" },
      { href: "/contributor/renungan", label: "Renungan Saya", icon: "Sparkles" },
      { href: "/contributor/khotbah", label: "Khotbah Saya", icon: "Clapperboard" },
    ],
  },
  admin: {
    homeHref: "/admin",
    items: [
      { href: "/admin", label: "Dasbor", icon: "LayoutDashboard" },
      { href: "/admin/moderasi", label: "Moderasi", icon: "ClipboardCheck" },
      { href: "/admin/pengguna", label: "Pengguna", icon: "Users" },
      { href: "/admin/kategori", label: "Kategori", icon: "Tags" },
      { href: "/admin/tantangan", label: "Tantangan", icon: "Trophy" },
      { href: "/admin/audit", label: "Log Audit", icon: "ScrollText" },
    ],
  },
};

export function DashboardShell({
  title,
  variant,
  children,
}: {
  title: string;
  variant: "contributor" | "admin";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { homeHref, items } = NAV_CONFIG[variant];
  const navItems: DashboardNavItem[] = items.map((i) => ({ ...i, icon: ICONS[i.icon] }));

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-surface lg:p-5">
        <Link href={homeHref} className="mb-8 flex items-center gap-2">
          <LivynMark className="h-8 w-8" />
          <span className="font-display text-lg font-bold">{title}</span>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== homeHref && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-muted",
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4">
          <Link href="/app" className="text-xs text-muted-foreground hover:text-foreground">
            ← Kembali ke aplikasi
          </Link>
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-2">
            <LivynMark className="h-6 w-6" />
            <span className="font-display font-bold">{title}</span>
          </div>
          <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== homeHref && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold",
                    active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
