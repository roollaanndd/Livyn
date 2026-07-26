"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "livyn_pwa_dismiss";
const DISMISS_DAYS = 7;

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const diff = Date.now() - Number(dismissedAt);
      if (diff < DISMISS_DAYS * 86_400_000) return;
    }
    setDismissed(false);

    if (isIos()) {
      setShowIos(true);
      return;
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIos(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  }

  const show = !dismissed && (deferredPrompt || showIos);
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-md px-4"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-4 shadow-lg backdrop-blur-xl">
          <button
            onClick={dismiss}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-surface-muted"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 pr-4">
              <p className="font-display text-sm font-bold text-foreground">
                Pasang Livyn
              </p>
              {showIos ? (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Ketuk{" "}
                  <Share className="inline h-3.5 w-3.5 -translate-y-px text-primary" />{" "}
                  lalu pilih <span className="font-semibold">&quot;Tambahkan ke Layar Utama&quot;</span>
                </p>
              ) : (
                <>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Akses lebih cepat dari layar utama, bisa dipakai offline.
                  </p>
                  <button
                    onClick={install}
                    className="mt-2 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                  >
                    Pasang Sekarang
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
