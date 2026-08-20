"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { LivynRefresh, LivynAlert } from "@/components/icons/livyn-icons";
import { Button } from "@/components/ui/button";

export default function ContributorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Contributor error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
        <LivynAlert className="h-8 w-8 text-warning" />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-heading">Dasbor kontributor tidak dapat dimuat</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Terjadi kesalahan. Refresh halaman atau kembali sebentar lagi.
      </p>
      <Button onClick={reset} className="mt-6 gap-2" size="lg">
        <LivynRefresh className="h-4 w-4" />
        Coba Lagi
      </Button>
    </div>
  );
}
