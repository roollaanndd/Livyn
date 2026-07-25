"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeSwitch } from "@/components/nav/theme-switch";
import { DURATION, EASE_OUT, staggerParent } from "@/lib/motion";

/**
 * Shell for the signed-out screens (masuk, daftar, lupa-sandi).
 *
 * The background is a slow-drifting aurora rather than three static blurred
 * circles — it gives the screen some depth without asking for attention. The
 * card sits on a subtle surface panel so the form reads as one object instead
 * of fields floating on the page background.
 */
export function AuthLayout({
  children,
  className,
  panel = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** Set false for screens that want to draw straight onto the background. */
  panel?: boolean;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 py-10">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-32 h-[30rem] w-[30rem] rounded-full opacity-[0.10] dark:opacity-[0.16]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
          animate={{ x: [0, 24, 0], y: [0, 18, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-48 -left-28 h-[32rem] w-[32rem] rounded-full opacity-[0.08] dark:opacity-[0.14]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
          animate={{ x: [0, -20, 0], y: [0, -22, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full opacity-[0.06] dark:opacity-[0.10]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
          animate={{ y: [0, 26, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        {/* Hairline grid, barely there — gives the flat background some texture. */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 72%)",
          }}
        />
      </div>

      <div className="absolute right-5 top-5 z-20 safe-top">
        <ThemeSwitch />
      </div>

      <motion.div
        variants={staggerParent(0.07, 0.05)}
        initial="hidden"
        animate="visible"
        className={cn("relative z-10 w-full max-w-sm", className)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: DURATION.slow, ease: EASE_OUT }}
          className={cn(
            panel &&
              "rounded-3xl border border-border-subtle bg-surface/70 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-7",
          )}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
