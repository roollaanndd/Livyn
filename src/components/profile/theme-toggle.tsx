"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration-safe mount flag
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setTheme(o.value)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            mounted && theme === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
          aria-label={o.label}
        >
          <o.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
