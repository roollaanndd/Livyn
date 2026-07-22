"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col items-center gap-4 py-16 text-center", className)}
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="font-display text-base font-bold text-heading">{title}</h3>
        {description && (
          <p className="max-w-[260px] text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </motion.div>
  );
}
