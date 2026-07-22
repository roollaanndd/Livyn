"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LivynMark } from "@/components/brand/logo";

export function LeafLoader({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-6 w-6", md: "h-10 w-10", lg: "h-14 w-14" };
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        animate={{ rotate: [0, 3, -3, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <LivynMark className={cn(sizes[size], "opacity-60")} gradientId="leaf-loader" />
      </motion.div>
    </div>
  );
}

export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <LeafLoader size="lg" />
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 rounded-md", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border-subtle bg-surface p-5 space-y-3", className)}>
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-5 w-3/4" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <div className={cn("skeleton h-10 w-10 rounded-full", className)} />;
}
