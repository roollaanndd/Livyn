"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, Download, Loader2, CheckCircle2 } from "lucide-react";
import { downloadFullBible, isBibleDownloaded } from "@/lib/bible/offline-store";

export function DownloadBibleCard() {
  const [state, setState] = useState<"unknown" | "needed" | "downloading" | "done" | "error">("unknown");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setState(isBibleDownloaded() ? "done" : "needed");
  }, []);

  async function start() {
    setState("downloading");
    setProgress(0);
    const ok = await downloadFullBible((done, total) => {
      setProgress(Math.round((done / total) * 100));
    });
    setState(ok ? "done" : "error");
  }

  if (state === "unknown") return null;

  if (state === "done") {
    return (
      <div className="mx-5 mt-4 flex items-center gap-2.5 rounded-2xl border border-primary/15 bg-primary-soft/40 px-4 py-3">
        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-primary" />
        <p className="text-[12.5px] font-medium text-heading">
          Alkitab TB lengkap tersedia — bisa dibaca offline
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/85 p-5 text-white shadow-md shadow-primary/20"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <BookOpenCheck className="h-5.5 w-5.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold">Unduh Alkitab Lengkap</h3>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/85">
            66 kitab Terjemahan Baru (±5 MB) — sekali unduh, seluruh Alkitab bisa dibaca kapan saja, bahkan tanpa internet.
          </p>

          {state === "downloading" ? (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-white"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-white/90">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengunduh... {progress}%
              </p>
            </div>
          ) : (
            <button
              onClick={start}
              className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[13.5px] font-bold text-primary transition-transform active:scale-95"
            >
              <Download className="h-4 w-4" />
              {state === "error" ? "Coba Unduh Lagi" : "Unduh Sekarang"}
            </button>
          )}
          {state === "error" && (
            <p className="mt-2 text-[11.5px] text-white/80">
              Unduhan terputus. Periksa koneksi internetmu lalu coba lagi.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
