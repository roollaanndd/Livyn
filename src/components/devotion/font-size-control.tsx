"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SIZES = ["sm", "md", "lg", "xl"] as const;

export function FontSizeControl() {
  const [size, setSize] = useState<(typeof SIZES)[number]>("md");

  useEffect(() => {
    const stored = localStorage.getItem("livyn_font_size") as (typeof SIZES)[number] | null;
    if (stored && SIZES.includes(stored)) apply(stored);
  }, []);

  function apply(next: (typeof SIZES)[number]) {
    setSize(next);
    document.documentElement.setAttribute("data-font-size", next);
    localStorage.setItem("livyn_font_size", next);
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
      {SIZES.map((s) => (
        <button
          key={s}
          onClick={() => apply(s)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full font-display font-bold transition-colors",
            s === "sm" && "text-xs",
            s === "md" && "text-sm",
            s === "lg" && "text-base",
            s === "xl" && "text-lg",
            size === s ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
          aria-label={`Ukuran huruf ${s}`}
        >
          A
        </button>
      ))}
    </div>
  );
}
