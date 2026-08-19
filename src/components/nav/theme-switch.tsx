"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { LivynSun, LivynMoon } from "@/components/icons/livyn-icons";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT, TAP } from "@/lib/motion";

/**
 * One-tap day/night switch for the app header.
 *
 * The full three-way control (light / dark / system) still lives in the
 * profile; this is the everyday affordance, because a setting buried two
 * screens deep may as well not exist. Tapping commits to an explicit theme,
 * which is the intent when someone reaches for this button.
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration-safe mount flag
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      whileTap={TAP}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-surface-muted text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {/* Render nothing until mounted so the icon does not flip after hydration. */}
      <AnimatePresence mode="wait" initial={false}>
        {mounted && (
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
            transition={{ duration: DURATION.quick, ease: EASE_OUT }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isDark ? <LivynMoon className="h-[18px] w-[18px]" /> : <LivynSun className="h-[18px] w-[18px]" />}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
