"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LivynHome,
  LivynDevotion,
  LivynPrayer,
  LivynBible,
  type LivynIconComponent,
} from "@/components/icons/livyn-icons";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LivynAiIcon } from "@/components/brand/logo";
import { SPRING, TAP } from "@/lib/motion";
import { useT } from "@/lib/i18n/client";
import type { TKey } from "@/lib/i18n/translate";

type Tab = {
  href: string;
  labelKey: TKey;
  icon: LivynIconComponent | null;
  exact?: boolean;
  isCenter?: boolean;
};

const TABS: Tab[] = [
  { href: "/app", labelKey: "nav.home", icon: LivynHome, exact: true },
  { href: "/app/alkitab", labelKey: "nav.bible", icon: LivynBible },
  { href: "/app/ai-pastor", labelKey: "nav.aiPastor", icon: null, isCenter: true },
  { href: "/app/devosi", labelKey: "nav.devotion", icon: LivynDevotion },
  { href: "/app/doa", labelKey: "nav.prayer", icon: LivynPrayer },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  // Every tab here is a dynamic route, and Next.js only prefetches dynamic
  // routes down to the nearest loading.tsx by default — which for these is just
  // the spinner, no data. So tapping a tab always waited on a cold server
  // render. This nav is permanently on screen, so the five destinations prefetch
  // in full and a tap lands on data that is already in the router cache.
  const PREFETCH_FULL_ROUTE = true;

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
                    prefetch={PREFETCH_FULL_ROUTE}
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
                      transition={SPRING}
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
                      {t(tab.labelKey)}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch={PREFETCH_FULL_ROUTE}
                  className="relative flex flex-col items-center gap-1 py-2.5 pt-3.5"
                >
                  <motion.div className="relative" whileTap={TAP}>
                    {tab.icon && (
                      <motion.span
                        className="block"
                        animate={{ y: active ? -1 : 0 }}
                        transition={SPRING}
                      >
                        <tab.icon
                          className={cn(
                            "h-[22px] w-[22px] transition-colors duration-200",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                          strokeWidth={active ? 2.3 : 1.7}
                        />
                      </motion.span>
                    )}
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-primary"
                        transition={SPRING}
                      />
                    )}
                  </motion.div>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-all duration-200",
                      active ? "text-primary font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {t(tab.labelKey)}
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
