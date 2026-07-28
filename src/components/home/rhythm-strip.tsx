import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rhythm } from "@/lib/queries/rhythm";
import type { TFunction } from "@/lib/i18n/translate";

/** The four daily habits, in the order they tend to happen. Each ring is a
 * link, so an unfinished habit is one tap from being finished. */
const STEPS = [
  { key: "verse", labelKey: "home.rhythmVerse", href: "/app/alkitab" },
  { key: "devotion", labelKey: "home.rhythmDevotion", href: "/app/devosi" },
  { key: "prayer", labelKey: "home.rhythmPrayer", href: "/app/doa" },
  { key: "journal", labelKey: "home.rhythmJournal", href: "/app/jurnal/baru" },
] as const;

export function RhythmStrip({ rhythm, t }: { rhythm: Rhythm; t: TFunction }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STEPS.map((step) => {
        const done = rhythm[step.key];
        return (
          <Link
            key={step.key}
            href={step.href}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 py-2.5 active:scale-95 transition-transform"
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                done ? "border-white bg-white text-primary" : "border-white/35 text-transparent",
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="text-[10px] font-semibold text-white/85">{t(step.labelKey)}</span>
          </Link>
        );
      })}
    </div>
  );
}
