"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { pushSupported, subscribeToPush, unsubscribeFromPush, currentSubscription } from "@/lib/push/client";

type Status = "loading" | "unsupported" | "off" | "on";

export function PushToggle() {
  const t = useT();
  const [status, setStatus] = useState<Status>("loading");

  // Resolved asynchronously on purpose: the browser's subscription state is an
  // external system, and setting state synchronously here would cascade renders.
  useEffect(() => {
    async function resolve() {
      if (!pushSupported()) return "unsupported" as const;
      const sub = await currentSubscription();
      return sub ? ("on" as const) : ("off" as const);
    }
    resolve()
      .then(setStatus)
      .catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    setStatus("loading");
    const result = await subscribeToPush();
    if (result === "subscribed") {
      toast.success(t("push.enabled"));
      setStatus("on");
      return;
    }
    if (result === "denied") toast.error(t("push.denied"));
    else if (result === "unconfigured") toast.error(t("push.notConfigured"));
    else if (result === "ios-install-required") {
      toast.info("Tambahkan Livyn ke layar utama iPhone dulu (Share > Tambahkan ke Layar Utama), lalu aktifkan notifikasi dari sana.");
    } else toast.error(t("push.enableFailed"));
    setStatus("off");
  }

  async function disable() {
    setStatus("loading");
    const ok = await unsubscribeFromPush();
    if (ok) {
      toast.success(t("push.disabled"));
      setStatus("off");
    } else {
      toast.error(t("push.disableFailed"));
      setStatus("on");
    }
  }

  if (status === "unsupported") {
    return <span className="text-xs text-muted-foreground">{t("push.unsupported")}</span>;
  }

  return (
    <button
      onClick={status === "on" ? disable : enable}
      disabled={status === "loading"}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60",
        status === "on" ? "bg-primary" : "bg-border",
      )}
      aria-label={t("push.softPromptAccept")}
      aria-pressed={status === "on"}
    >
      {status === "loading" ? (
        <Loader2 className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            status === "on" ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      )}
    </button>
  );
}
