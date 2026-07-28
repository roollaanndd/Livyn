"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

const SHORT: Record<Locale, string> = { id: "ID", en: "EN" };

export function LanguageSwitch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Optimistic: the segmented control must move under the finger immediately,
  // before the round trip that persists the choice.
  const [selected, setSelected] = useState<Locale>(locale);

  async function choose(next: Locale) {
    if (next === selected || pending) return;
    const previous = selected;
    setSelected(next);
    const res = await fetch("/api/bahasa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => null);

    if (!res?.ok) {
      setSelected(previous);
      toast.error(t("common.errorGeneric"));
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex shrink-0 rounded-full bg-surface-muted p-0.5" role="group" aria-label={t("profile.language")}>
      {LOCALES.map((code) => (
        <button
          key={code}
          onClick={() => choose(code)}
          disabled={pending}
          aria-pressed={selected === code}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-bold transition-colors disabled:opacity-60",
            selected === code ? "bg-primary text-white shadow-sm" : "text-muted-foreground",
          )}
        >
          {SHORT[code]}
        </button>
      ))}
    </div>
  );
}
