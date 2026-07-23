"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
        <AlertTriangle className="h-8 w-8 text-warning" />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-heading">Terjadi Kesalahan</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Halaman tidak dapat dimuat. Periksa koneksi internetmu dan coba lagi.
      </p>
      <Button onClick={reset} className="mt-6 gap-2" size="lg">
        <RefreshCw className="h-4 w-4" />
        Coba Lagi
      </Button>
    </div>
  );
}
