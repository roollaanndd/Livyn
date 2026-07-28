"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export function SmartReminderCard({
  peakHourLabel,
  showSuggestion,
  autoAdjust,
}: {
  /** "22:00", already formatted server-side. Null when there isn't enough data. */
  peakHourLabel: string | null;
  /** True when at least one active reminder sits more than an hour away from the peak. */
  showSuggestion: boolean;
  autoAdjust: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [auto, setAuto] = useState(autoAdjust);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  async function move() {
    if (!peakHourLabel) return;
    setBusy(true);
    const res = await fetch("/api/doa/pintar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move" }),
    }).catch(() => null);
    setBusy(false);

    if (!res?.ok) {
      toast.error(res?.status === 409 ? t("reminders.smartNotEnoughData") : t("common.errorGeneric"));
      return;
    }
    toast.success(t("reminders.smartApplied", { hour: peakHourLabel }));
    setDismissed(true);
    router.refresh();
  }

  async function toggleAuto() {
    const next = !auto;
    setAuto(next); // optimistic
    const res = await fetch("/api/doa/pintar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "auto", enabled: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setAuto(!next);
      toast.error(t("common.errorGeneric"));
      return;
    }
    router.refresh();
  }

  return (
    <Card className="mx-5 mb-4 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Clock className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-[14px] font-extrabold text-heading">{t("reminders.smartTitle")}</p>
            <button
              onClick={toggleAuto}
              role="switch"
              aria-checked={auto}
              aria-label={t("reminders.smartOn")}
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                auto ? "bg-primary" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  auto ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            {peakHourLabel ? t("reminders.smartHint") : t("reminders.smartNotEnoughData")}
          </p>

          {peakHourLabel && showSuggestion && !dismissed && !auto && (
            <div className="mt-3 rounded-xl bg-surface-muted p-3">
              <p className="text-[12.5px] leading-relaxed text-heading">
                {t("reminders.smartSuggestion", { hour: peakHourLabel })}
              </p>
              <div className="mt-2.5 flex gap-2">
                <Button size="sm" onClick={move} disabled={busy}>
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t("reminders.smartApply")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDismissed(true)} disabled={busy}>
                  {t("reminders.smartDismiss")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
