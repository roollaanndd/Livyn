"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LivynBell, LivynClose, LivynSpinner } from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { pushSupported, subscribeToPush } from "@/lib/push/client";

const DISMISSED_KEY = "livyn:push-prompt-dismissed";
/** Long enough that the prompt lands after the member has seen something
 * worth being reminded about, rather than on top of a still-loading screen. */
const APPEAR_DELAY_MS = 6000;

export function PushSoftPrompt() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    // Only ever ask through this card while the browser is still neutral —
    // once granted or denied, the browser prompt cannot be re-opened anyway.
    if (Notification.permission !== "default") return;
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* storage disabled — the prompt simply reappears next session */
    }
    setVisible(false);
  }

  async function accept() {
    setBusy(true);
    const result = await subscribeToPush();
    setBusy(false);

    if (result === "subscribed") toast.success(t("push.enabled"));
    else if (result === "denied") toast.error(t("push.denied"));
    else if (result === "unconfigured") toast.error(t("push.notConfigured"));
    else if (result === "ios-install-required") {
      toast.info("Tambahkan Livyn ke layar utama iPhone dulu (Share > Tambahkan ke Layar Utama), lalu aktifkan notifikasi dari sana.");
    } else toast.error(t("push.enableFailed"));

    dismiss();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label={t("push.softPromptTitle")}
          className="fixed inset-x-0 bottom-[92px] z-50 mx-auto w-full max-w-md px-4"
        >
          <div className="glass-heavy relative rounded-2xl border border-border-subtle p-4 shadow-[var(--shadow-lg)]">
            <button
              onClick={dismiss}
              aria-label={t("common.close")}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 active:scale-95"
            >
              <LivynClose className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-7">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <LivynBell className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-[14px] font-extrabold text-heading">{t("push.softPromptTitle")}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {t("push.softPromptBody")}
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex gap-2">
              <Button size="sm" className="flex-1" onClick={accept} disabled={busy}>
                {busy ? <LivynSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
                {t("push.softPromptAccept")}
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss} disabled={busy}>
                {t("push.softPromptDecline")}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
