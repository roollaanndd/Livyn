"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Image as ImageIcon, Check, Loader2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "mountain", label: "Gunung", color: "#e8896b" },
  { id: "lake", label: "Danau", color: "#7ec8e3" },
  { id: "forest", label: "Hutan", color: "#8bc28d" },
  { id: "sunset", label: "Senja", color: "#f1c40f" },
];

interface VerseShareCardProps {
  verseText: string;
  verseRef: string;
}

export function VerseShareCard({ verseText, verseRef }: VerseShareCardProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("mountain");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function getImageUrl(t: string) {
    const params = new URLSearchParams({ text: verseText, ref: verseRef, theme: t });
    return `/api/verse-image?${params.toString()}`;
  }

  async function downloadImage() {
    setLoading(true);
    try {
      const res = await fetch(getImageUrl(theme));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `livyn-ayat-${verseRef.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function shareImage() {
    setLoading(true);
    try {
      const res = await fetch(getImageUrl(theme));
      const blob = await res.blob();
      const file = new File([blob], `livyn-ayat.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${verseRef} — Livyn`,
          text: `"${verseText}" — ${verseRef}`,
          files: [file],
        });
      } else {
        await navigator.share({
          title: `${verseRef} — Livyn`,
          text: `"${verseText}" — ${verseRef}\n\nLivyn — Faith. Every Day. Every Step.`,
        });
      }
    } catch {
      // user cancelled or not supported
    } finally {
      setLoading(false);
    }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="mt-4">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[12px] font-semibold text-primary/70 hover:text-primary transition-colors"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        <span>Buat Gambar Ayat</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {/* Preview */}
              <div className="relative overflow-hidden rounded-xl border border-border-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(theme)}
                  alt="Preview ayat"
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
              </div>

              {/* Theme picker */}
              <div className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex gap-1.5">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      title={t.label}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-all",
                        theme === t.id ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100",
                      )}
                      style={{ backgroundColor: t.color }}
                    />
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={downloadImage}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-muted px-4 py-2.5 text-[13px] font-semibold text-heading hover:bg-surface-muted/80 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : done ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>{done ? "Tersimpan!" : "Simpan"}</span>
                </button>
                {canShare && (
                  <button
                    onClick={shareImage}
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Bagikan</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
