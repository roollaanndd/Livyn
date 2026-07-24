"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tab = { id: string; label: string; badge?: number };

export function CircleTabs({
  tabs,
  panels,
  initial = 0,
}: {
  tabs: Tab[];
  panels: ReactNode[];
  initial?: number;
}) {
  const [active, setActive] = useState(initial);

  return (
    <div>
      <div className="sticky top-[56px] z-10 -mx-5 border-b border-border-subtle bg-background/95 px-5 pt-1 backdrop-blur-md">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActive(i)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 px-3 pb-3 pt-2 text-[13px] font-bold transition-colors",
                i === active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {typeof t.badge === "number" && t.badge > 0 && (
                <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {t.badge}
                </span>
              )}
              {i === active && (
                <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-4">{panels[active]}</div>
    </div>
  );
}
