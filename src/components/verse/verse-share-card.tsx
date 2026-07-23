"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Share2,
  Image as ImageIcon,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface VerseShareCardProps {
  verseText: string;
  verseRef: string;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = words[0] ?? "";

  for (let i = 1; i < words.length; i++) {
    const test = current + " " + words[i];
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = words[i];
    } else {
      current = test;
    }
  }
  lines.push(current);
  return lines;
}

async function compositeImage(
  bgBlob: Blob,
  verseText: string,
  verseRef: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const img = await createImageBitmap(bgBlob);
  ctx.drawImage(img, 0, 0, 1024, 1024);

  const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
  gradient.addColorStop(0, "rgba(0,0,0,0.3)");
  gradient.addColorStop(0.4, "rgba(0,0,0,0.45)");
  gradient.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.textAlign = "center";

  ctx.fillStyle = "#4CAF7D";
  ctx.beginPath();
  ctx.arc(498, 155, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("LIVYN", 527, 160);

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(492, 185);
  ctx.lineTo(532, 185);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "italic 72px Georgia, 'Times New Roman', serif";
  ctx.fillText("“", 512, 260);

  const fontSize =
    verseText.length > 200
      ? 24
      : verseText.length > 150
        ? 28
        : verseText.length > 80
          ? 32
          : 38;

  ctx.font = `italic ${fontSize}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;

  const lines = wrapText(ctx, verseText, 780);
  const lineHeight = fontSize * 1.65;
  const totalTextHeight = lines.length * lineHeight;
  const startY = 512 - totalTextHeight / 2 + 30;

  lines.forEach((line, i) => {
    ctx.fillText(line, 512, startY + i * lineHeight);
  });

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "italic 72px Georgia, 'Times New Roman', serif";
  ctx.fillText("”", 512, startY + totalTextHeight + 30);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 6;
  ctx.fillText(verseRef, 512, startY + totalTextHeight + 85);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("FAITH  ·  EVERY DAY  ·  EVERY STEP", 512, 990);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export function VerseShareCard({ verseText, verseRef }: VerseShareCardProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [composedBlob, setComposedBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadDone, setDownloadDone] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/verse-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: verseText, ref: verseRef }),
      });

      if (!res.ok) {
        let msg = "Gagal membuat gambar.";
        try {
          const data = await res.json();
          if (data.error) msg = data.error;
        } catch {
          // not json
        }
        throw new Error(msg);
      }

      const bgBlob = await res.blob();
      const composed = await compositeImage(bgBlob, verseText, verseRef);

      if (imageUrl) URL.revokeObjectURL(imageUrl);
      const url = URL.createObjectURL(composed);

      setComposedBlob(composed);
      setImageUrl(url);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Gagal membuat gambar.");
    } finally {
      setLoading(false);
    }
  }, [verseText, verseRef, imageUrl]);

  function download() {
    if (!composedBlob) return;
    const url = URL.createObjectURL(composedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `livyn-ayat-${verseRef.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadDone(true);
    setTimeout(() => setDownloadDone(false), 2000);
  }

  async function share() {
    if (!composedBlob) return;
    const file = new File([composedBlob], "livyn-ayat.png", {
      type: "image/png",
    });

    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${verseRef} — Livyn`,
          text: `“${verseText}” — ${verseRef}`,
          files: [file],
        });
      } else {
        await navigator.share({
          title: `${verseRef} — Livyn`,
          text: `“${verseText}” — ${verseRef}\n\nLivyn — Faith. Every Day. Every Step.`,
        });
      }
    } catch {
      // user cancelled or not supported
    }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="mt-4">
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
              {imageUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-border-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Gambar ayat"
                    className="w-full aspect-square object-cover"
                  />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center aspect-square rounded-xl border border-border-subtle bg-surface-muted/50">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-[13px] text-muted-foreground">
                        Membuat gambar...
                      </p>
                      <p className="text-[11px] text-muted-foreground/60">
                        Sekitar 10-15 detik
                      </p>
                    </div>
                  ) : errorMsg ? (
                    <div className="flex flex-col items-center gap-3 px-6 text-center">
                      <p className="text-[13px] text-red-500 font-medium">
                        Gagal membuat gambar
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-[240px]">
                        {errorMsg}
                      </p>
                      <button
                        onClick={generate}
                        className="mt-1 text-[13px] font-semibold text-primary"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  ) : (
                    <button onClick={generate} className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-glow)]">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-[13px] font-semibold text-primary">
                        Generate Gambar AI
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-[200px] text-center leading-relaxed">
                        AI akan membuat gambar pemandangan unik yang sesuai ayat ini
                      </p>
                    </button>
                  )}
                </div>
              )}

              {imageUrl && (
                <div className="flex gap-2">
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-heading hover:bg-surface-muted/80 transition-colors disabled:opacity-50"
                    aria-label="Generate ulang"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={download}
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-muted px-4 py-2.5 text-[13px] font-semibold text-heading hover:bg-surface-muted/80 transition-colors disabled:opacity-50"
                  >
                    {downloadDone ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>{downloadDone ? "Tersimpan!" : "Simpan"}</span>
                  </button>
                  {canShare && (
                    <button
                      onClick={share}
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Bagikan</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
