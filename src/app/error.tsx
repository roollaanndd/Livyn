"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // No-op unless NEXT_PUBLIC_SENTRY_DSN is configured; safe to always call.
    Sentry.captureException(error);
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center font-sans">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-foreground">Terjadi Kesalahan</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Halaman tidak dapat dimuat. Periksa koneksi internetmu dan coba lagi.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="h-4 w-4" />
        Coba Lagi
      </button>
    </div>
  );
}
