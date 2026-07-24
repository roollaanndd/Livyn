"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpenText, AlarmClock, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LivynAiIcon } from "@/components/brand/logo";

const TABS = [
  { href: "/app", label: "Beranda", icon: Home, exact: true },
  { href: "/app/alkitab", label: "Alkitab", icon: BookOpen },
  { href: "/app/ai-pastor", label: "AI Pastor", icon: null, isCenter: true },
  { href: "/app/devosi", label: "Renungan", icon: BookOpenText },
  { href: "/app/doa", label: "Doa", icon: AlarmClock },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2">
      <div className="relative">
        <div className="glass-heavy rounded-t-3xl pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-5 items-end px-1">
            {TABS.map((tab) => {
              const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

              if (tab.isCenter) {
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="relative flex flex-col items-center justify-center pb-2 pt-1"
                  >
                    <motion.div
                      className={cn(
                        "relative -mt-6 flex h-[56px] w-[56px] items-center justify-center rounded-2xl transition-all duration-300",
                        active
                          ? "bg-gradient-to-br from-primary to-primary/85 shadow-lg shadow-primary/25"
                          : "bg-gradient-to-br from-primary to-primary/90 shadow-md shadow-primary/15",
                      )}
                      whileTap={{ scale: 0.92 }}
                      animate={active ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <LivynAiIcon className="h-7 w-7" />
                      {active && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          style={{ boxShadow: "0 0 24px rgba(45,125,95,0.45)" }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    <span className={cn(
                      "mt-1 text-[10px] font-semibold transition-colors",
                      active ? "text-primary" : "text-muted-foreground",
                    )}>
                      {tab.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="relative flex flex-col items-center gap-1 py-2.5 pt-3.5"
                >
                  <div className="relative">
                    {tab.icon && (
                      <tab.icon
                        className={cn(
                          "h-[22px] w-[22px] transition-all duration-200",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                        strokeWidth={active ? 2.3 : 1.7}
                      />
                    )}
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-all duration-200",
                      active ? "text-primary font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
