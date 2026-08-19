"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LivynCheck, LivynSpinner } from "@/components/icons/livyn-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LivynMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export function ConsentForm({ points }: { points: string[] }) {
  const t = useT();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!agreed || saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/terms/accept", { method: "POST" }).catch(() => null);
    if (!res?.ok) {
      setError(t("terms.error"));
      setSaving(false);
      return;
    }
    // replace(), not push() — the consent screen must not sit in history where
    // the back button would return to it after acceptance.
    router.replace("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 safe-top">
      <div className="flex flex-col items-center pt-10 text-center">
        <LivynMark className="h-11 w-11" gradientId="consent-logo" />
        <h1 className="font-display mt-4 text-[22px] font-extrabold text-heading">{t("terms.welcome")}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{t("terms.intro")}</p>
      </div>

      <Card className="mt-7 p-5">
        <h2 className="font-display text-[15px] font-extrabold text-heading">{t("terms.heading")}</h2>
        <ul className="mt-3 space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
          <Link href="/syarat-ketentuan" className="font-semibold text-primary underline underline-offset-2">
            {t("terms.termsLink")}
          </Link>
          {" · "}
          <Link href="/kebijakan-privasi" className="font-semibold text-primary underline underline-offset-2">
            {t("terms.privacyLink")}
          </Link>
        </p>
      </Card>

      <button
        type="button"
        onClick={() => setAgreed((v) => !v)}
        aria-pressed={agreed}
        className="mt-5 flex w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left active:scale-[0.99] transition-transform"
      >
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            agreed ? "border-primary bg-primary text-white" : "border-border",
          )}
        >
          {agreed && <LivynCheck className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
        <span className="text-[13px] leading-relaxed text-heading">{t("terms.checkbox")}</span>
      </button>

      {error && <p className="mt-3 text-[13px] font-medium text-error">{error}</p>}

      <div className="mt-auto pt-6">
        <Button size="lg" className="w-full" disabled={!agreed || saving} onClick={submit}>
          {saving ? (
            <>
              <LivynSpinner className="h-4 w-4 animate-spin" /> {t("terms.saving")}
            </>
          ) : (
            t("terms.continue")
          )}
        </Button>
        {!agreed && (
          <p className="mt-2.5 text-center text-[12px] text-muted-foreground">{t("terms.continueHint")}</p>
        )}
      </div>
    </main>
  );
}
