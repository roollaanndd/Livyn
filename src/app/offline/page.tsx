"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft"
      >
        <WifiOff className="h-10 w-10 text-primary" />
      </motion.div>

      <h1 className="mb-2 font-heading text-xl font-bold text-foreground">
        Kamu Sedang Offline
      </h1>
      <p className="mb-8 max-w-xs text-sm text-muted-foreground">
        Koneksi internet tidak tersedia. Beberapa fitur memerlukan koneksi
        untuk bekerja, tapi kamu tetap bisa membaca Alkitab offline.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>

        <a
          href="/app/alkitab"
          className="text-sm font-medium text-primary hover:underline"
        >
          Baca Alkitab Offline
        </a>
      </div>
    </div>
  );
}
