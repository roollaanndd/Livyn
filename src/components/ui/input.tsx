import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground",
        "placeholder:text-muted-foreground/60",
        "outline-none transition-all duration-200",
        "focus:border-primary focus:ring-2 focus:ring-primary/15 focus:shadow-[var(--shadow-glow)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
