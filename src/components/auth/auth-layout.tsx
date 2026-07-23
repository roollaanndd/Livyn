"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AuthLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-[0.035]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn("relative z-10 w-full max-w-sm px-6", className)}
      >
        {children}
      </motion.div>
    </div>
  );
}
