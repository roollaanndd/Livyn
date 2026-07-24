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

const CANVAS_W = 1080;
const CANVAS_H = 1920;

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

function drawLivynMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  const scale = size / 120;
  ctx.scale(scale, scale);

  const gradient = ctx.createLinearGradient(20, 10, 100, 110);
  gradient.addColorStop(0, "#6BC994");
  gradient.addColorStop(0.5, "#4CAF7D");
  gradient.addColorStop(1, "#2D7D5F");
  ctx.fillStyle = gradient;

  // Main "L" shape (letter form from logo)
  ctx.beginPath();
  ctx.moveTo(40, 12);
  ctx.bezierCurveTo(40, 9.8, 41.8, 8, 44, 8);
  ctx.lineTo(56, 8);
  ctx.bezierCurveTo(58.2, 8, 60, 9.8, 60, 12);
  ctx.lineTo(60, 78);
  ctx.bezierCurveTo(60, 88, 68, 96, 78, 96);
  ctx.bezierCurveTo(80.2, 96, 82, 97.8, 82, 100);
  ctx.lineTo(82, 108);
  ctx.bezierCurveTo(82, 110.2, 80.2, 112, 78, 112);
  ctx.bezierCurveTo(56, 112, 40, 96, 40, 74);
  ctx.closePath();
  ctx.fill();

  // Leaf accent
  const leafGrad = ctx.createLinearGradient(55, 70, 85, 110);
  leafGrad.addColorStop(0, "#6BC994");
  leafGrad.addColorStop(1, "#C89B3C");
  ctx.fillStyle = leafGrad;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(60, 88);
  ctx.bezierCurveTo(64, 96, 71, 103, 80, 107);
  ctx.bezierCurveTo(82, 108, 82.5, 110.5, 81, 112.2);
  ctx.bezierCurveTo(79.5, 113.8, 77, 114, 75, 113);
  ctx.bezierCurveTo(63, 107, 53, 97, 48, 84);
  ctx.bezierCurveTo(47, 81.5, 48.5, 79, 51, 78.5);
  ctx.lineTo(58, 77);
  ctx.bezierCurveTo(60, 76.5, 61.5, 78, 60, 88);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

async function compositeImage(
  bgBlob: Blob,
  verseText: string,
  verseRef: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;

  // Background: cover-fit the source image to 9:16 canvas
  const img = await createImageBitmap(bgBlob);
  const srcRatio = img.width / img.height;
  const dstRatio = CANVAS_W / CANVAS_H;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (srcRatio > dstRatio) {
    // source is wider — crop sides
    sw = img.height * dstRatio;
    sx = (img.width - sw) / 2;
  } else {
    // source is taller — crop top/bottom
    sh = img.width / dstRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);

  // Vertical gradient overlay for text readability
  const overlay = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  overlay.addColorStop(0, "rgba(0, 20, 12, 0.75)");
  overlay.addColorStop(0.35, "rgba(0, 15, 10, 0.45)");
  overlay.addColorStop(0.65, "rgba(0, 15, 10, 0.55)");
  overlay.addColorStop(1, "rgba(0, 20, 12, 0.88)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Center vignette for verse focus
  const vignette = ctx.createRadialGradient(
    CANVAS_W / 2, CANVAS_H / 2, 100,
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.85,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // === TOP: Livyn brand header ===
  const topY = 180;
  drawLivynMark(ctx, CANVAS_W / 2 - 90, topY, 68);

  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 12;
  ctx.fillText("LIVYN", CANVAS_W / 2 - 42, topY + 18);

  // Tagline under wordmark
  ctx.shadowBlur = 6;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 18px -apple-system, BlinkMacSystemFont, sans-serif";
  const tagline = "FAITH  ·  EVERY DAY  ·  EVERY STEP";
  ctx.fillText(tagline, CANVAS_W / 2, topY + 68);

  // Decorative divider under brand
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2 - 60, topY + 100);
  ctx.lineTo(CANVAS_W / 2 + 60, topY + 100);
  ctx.stroke();

  // === CENTER: Verse text ===
  ctx.textAlign = "center";

  // Opening quote mark (large, decorative)
  ctx.fillStyle = "rgba(107, 201, 148, 0.55)";
  ctx.font = "italic 220px Georgia, 'Times New Roman', serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 20;
  ctx.fillText("“", CANVAS_W / 2, 620);

  // Verse text — big, bold, high contrast
  const textMaxWidth = CANVAS_W - 160;
  const len = verseText.length;
  const fontSize =
    len > 280 ? 44 :
    len > 220 ? 50 :
    len > 160 ? 58 :
    len > 100 ? 68 : 78;

  ctx.font = `500 ${fontSize}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 3;

  const lines = wrapText(ctx, verseText, textMaxWidth);
  const lineHeight = fontSize * 1.45;
  const totalTextHeight = lines.length * lineHeight;
  const centerY = CANVAS_H / 2;
  const startY = centerY - totalTextHeight / 2 + fontSize / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_W / 2, startY + i * lineHeight);
  });

  // Closing quote mark
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "rgba(107, 201, 148, 0.55)";
  ctx.font = "italic 220px Georgia, 'Times New Roman', serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 20;
  ctx.fillText("”", CANVAS_W / 2, startY + totalTextHeight + 100);

  // === Verse reference — prominent, boxed style ===
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const refY = startY + totalTextHeight + 220;

  // Small accent line above reference
  ctx.strokeStyle = "rgba(107, 201, 148, 0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2 - 40, refY - 40);
  ctx.lineTo(CANVAS_W / 2 + 40, refY - 40);
  ctx.stroke();

  // Reference text — bold, prominent, green tint
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 44px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 10;
  ctx.fillText(verseRef.toUpperCase(), CANVAS_W / 2, refY);

  // === BOTTOM: Livyn footer branding ===
  ctx.shadowBlur = 0;

  const bottomY = CANVAS_H - 130;

  // Small mark
  drawLivynMark(ctx, CANVAS_W / 2 - 105, bottomY, 44);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "900 36px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 6;
  ctx.fillText("LIVYN", CANVAS_W / 2 - 75, bottomY + 12);

  // Domain / URL hint
  ctx.textAlign = "center";
  ctx.shadowBlur = 4;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("livyn.app", CANVAS_W / 2, bottomY + 60);

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

      // Preview via data URL — blob object URLs fail to render inside some
      // mobile WebViews even though the same blob downloads fine.
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(composed);
      });

      setComposedBlob(composed);
      setImageUrl(dataUrl);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Gagal membuat gambar.");
    } finally {
      setLoading(false);
    }
  }, [verseText, verseRef]);

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
    }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="mt-4">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && !imageUrl && !loading) generate();
        }}
        className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary/85 px-4 py-3.5 text-left shadow-md shadow-primary/20 transition-transform active:scale-[0.98]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <ImageIcon className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="flex-1">
          <span className="block text-[14px] font-bold text-white">Buat Gambar Ayat</span>
          <span className="block text-[11.5px] text-white/80">
            Untuk dibagikan ke Story IG / Status WA
          </span>
        </div>
        <Sparkles className="h-4.5 w-4.5 text-white/80" />
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
                <div className="relative w-full overflow-hidden rounded-xl border border-border-subtle bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Gambar ayat"
                    className="block w-full h-auto"
                    style={{ aspectRatio: "9 / 16", objectFit: "cover" }}
                  />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="flex w-full items-center justify-center rounded-xl border border-border-subtle bg-surface-muted/50"
                  style={{ aspectRatio: "9 / 16" }}
                >
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
                    <button onClick={generate} className="flex flex-col items-center gap-3 px-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-glow)]">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-[13px] font-semibold text-primary">
                        Generate Gambar Ayat
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-[220px] text-center leading-relaxed">
                        Format 9:16 siap untuk Story Instagram, WhatsApp Status, dan sosmed lainnya
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
