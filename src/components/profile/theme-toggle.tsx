"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { LivynSun, LivynMoon, LivynMonitor } from "@/components/icons/livyn-icons";
import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/motion";

const OPTIONS = [
  { value: "light", label: "Terang", icon: LivynSun },
  { value: "dark", label: "Gelap", icon: LivynMoon },
  { value: "system", label: "Sistem", icon: LivynMonitor },
] as const;

/**
 * Segmented light / dark / system control.
 *
 * The selected pill is a shared layout element, so switching slides it across
 * rather than popping the highlight from one button to another.
 */
export function ThemeToggle({ showLabels = false }: { showLabels?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration-safe mount flag
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
      {OPTIONS.map((o) => {
        const active = mounted && theme === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            aria-label={o.label}
            aria-pressed={active}
            className={cn(
              "relative flex h-8 items-center justify-center gap-1.5 rounded-full transition-colors",
              showLabels ? "px-3" : "w-8",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-toggle-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={SPRING}
              />
            )}
            <o.icon className="relative h-4 w-4" />
            {showLabels && <span className="relative text-[12px] font-semibold">{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
