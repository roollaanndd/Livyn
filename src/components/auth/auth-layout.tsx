"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AuthLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/4 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full opacity-[0.025]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn("relative z-10 w-full max-w-sm px-6", className)}
      >
        {children}
      </motion.div>
    </div>
  );
}
