"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpenText, Sparkles, AlarmClock, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app", label: "Beranda", icon: Home, exact: true },
  { href: "/app/devosi", label: "Devosi", icon: Sparkles },
  { href: "/app/alkitab", label: "Alkitab", icon: BookOpenText },
  { href: "/app/doa", label: "Doa", icon: AlarmClock },
  { href: "/app/khotbah", label: "Khotbah", icon: Clapperboard },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-transform duration-200",
                active && "scale-105",
              )}
            >
              <tab.icon
                className={cn("h-5 w-5 transition-colors duration-200", active ? "text-primary" : "text-muted-foreground")}
                strokeWidth={active ? 2.3 : 1.8}
              />
              <span className={cn("transition-colors duration-200", active ? "text-primary" : "text-muted-foreground")}>{tab.label}</span>
              {active && <span className="absolute -bottom-0 h-0.5 w-4 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
