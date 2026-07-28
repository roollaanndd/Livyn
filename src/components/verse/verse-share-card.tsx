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
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

interface VerseShareCardProps {
  verseText: string;
  verseRef: string;
  /** "full" is the wide gradient CTA under the daily-verse hero. "compact" is a
   * chip sized to sit inline in a list, where a full-width CTA per row would
   * bury the verses it belongs to. */
  variant?: "full" | "compact";
  className?: string;
}

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const SIDE_MARGIN = 96;

/* Vertical rhythm of the centre block. Everything is stacked from these, so a
   verse of any length stays balanced instead of drifting into the footer. */
const QUOTE_FONT = 116;
const QUOTE_H = 64;
const GAP_QUOTE_TEXT = 30;
const GAP_TEXT_QUOTE = 14;
const GAP_QUOTE_REF = 74;
const ACCENT_GAP = 34;
const REF_H = 46;
const GAP_REF_DATE = 42;
const DATE_H = 28;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let current = "";

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
      continue;
    }

    if (current) {
      lines.push(current);
      current = "";
    }

    // A single word can still be wider than the line (long reference or an
    // unbroken string) — hard-break it rather than letting it bleed off-canvas.
    if (ctx.measureText(word).width <= maxWidth) {
      current = word;
      continue;
    }

    let chunk = "";
    for (const ch of word) {
      if (chunk && ctx.measureText(chunk + ch).width > maxWidth) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk += ch;
      }
    }
    current = chunk;
  }

  if (current) lines.push(current);
  return lines;
}

/**
 * Free stock sources sometimes return photos with letterbox bars baked into
 * the pixels. Cover-fitting such an image faithfully preserves those bars,
 * which reads as "the background doesn't fill the card" — so detect a uniform
 * border and crop it away first.
 *
 * Detection runs on a downscaled copy: cheaper, and small amounts of JPEG
 * noise average out instead of defeating the uniformity test.
 */
function trimLetterbox(img: ImageBitmap): { sx: number; sy: number; sw: number; sh: number } {
  const full = { sx: 0, sy: 0, sw: img.width, sh: img.height };

  const dw = 160;
  const scale = dw / img.width;
  const dh = Math.max(1, Math.round(img.height * scale));

  const probe = document.createElement("canvas");
  probe.width = dw;
  probe.height = dh;
  const pctx = probe.getContext("2d", { willReadFrequently: true });
  if (!pctx) return full;
  pctx.drawImage(img, 0, 0, dw, dh);

  let data: Uint8ClampedArray;
  try {
    data = pctx.getImageData(0, 0, dw, dh).data;
  } catch {
    return full; // tainted canvas — keep the whole frame
  }

  const px = (x: number, y: number) => {
    const i = (y * dw + x) * 4;
    return [data[i], data[i + 1], data[i + 2]] as const;
  };
  const close = (a: readonly number[], b: readonly number[]) =>
    Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 36;

  const rowUniform = (y: number, ref: readonly number[]) => {
    for (let x = 0; x < dw; x++) if (!close(px(x, y), ref)) return false;
    return true;
  };
  const colUniform = (x: number, ref: readonly number[]) => {
    for (let y = 0; y < dh; y++) if (!close(px(x, y), ref)) return false;
    return true;
  };

  const maxY = Math.floor(dh * 0.3);
  const maxX = Math.floor(dw * 0.3);

  let top = 0;
  while (top < maxY && rowUniform(top, px(0, 0))) top++;
  let bottom = dh - 1;
  while (bottom > dh - 1 - maxY && rowUniform(bottom, px(0, dh - 1))) bottom--;
  let left = 0;
  while (left < maxX && colUniform(left, px(0, 0))) left++;
  let right = dw - 1;
  while (right > dw - 1 - maxX && colUniform(right, px(dw - 1, 0))) right--;

  const w = right - left + 1;
  const h = bottom - top + 1;
  // Nothing meaningful trimmed, or the result is implausibly small — keep all.
  if (w >= dw && h >= dh) return full;
  if (w < dw * 0.5 || h < dh * 0.5) return full;

  return {
    sx: Math.round(left / scale),
    sy: Math.round(top / scale),
    sw: Math.round(w / scale),
    sh: Math.round(h / scale),
  };
}

/** Largest type size at which the whole centre block still fits the region. */
function fitVerseBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
) {
  const measure = (fontSize: number) => {
    ctx.font = `500 ${fontSize}px Georgia, 'Times New Roman', serif`;
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = Math.round(fontSize * 1.42);
    const textHeight = lines.length * lineHeight;
    const height =
      QUOTE_H + GAP_QUOTE_TEXT + textHeight + GAP_TEXT_QUOTE + QUOTE_H +
      GAP_QUOTE_REF + ACCENT_GAP + REF_H + GAP_REF_DATE + DATE_H;
    return { fontSize, lines, lineHeight, textHeight, height };
  };

  for (let fontSize = 78; fontSize > 30; fontSize -= 2) {
    const block = measure(fontSize);
    if (block.height <= maxHeight) return block;
  }
  return measure(30);
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

/* Rounded pill path drawn manually — ctx.roundRect is missing on older WebViews */
function drawPillPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + r, r, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.closePath();
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

  const img = await createImageBitmap(bgBlob);
  const cx = CANVAS_W / 2;

  // === BACKGROUND ========================================================
  // Trim any baked-in letterbox bars first, then cover-fit what remains so
  // the photo genuinely reaches every edge.
  const source = trimLetterbox(img);
  const dstRatio = CANVAS_W / CANVAS_H;
  let { sx, sy, sw, sh } = source;
  if (sw / sh > dstRatio) {
    const nw = sh * dstRatio;
    sx += (sw - nw) / 2;
    sw = nw;
  } else {
    const nh = sw / dstRatio;
    sy += (sh - nh) / 2;
    sh = nh;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);

  // Darken only the top and bottom, where the brand and footer sit. The middle
  // stays bright so the image still reads as a photograph.
  const overlay = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  overlay.addColorStop(0, "rgba(0, 10, 7, 0.58)");
  overlay.addColorStop(0.16, "rgba(0, 10, 7, 0.24)");
  overlay.addColorStop(0.5, "rgba(0, 10, 7, 0.18)");
  overlay.addColorStop(0.78, "rgba(0, 10, 7, 0.44)");
  overlay.addColorStop(1, "rgba(0, 10, 7, 0.74)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // === REGIONS ===========================================================
  const headerTop = 132;
  const markSize = 64;
  const headerBottom = headerTop + markSize + 52;

  const pillH = 74;
  const pillY = CANVAS_H - 292;
  const campaignY = CANVAS_H - 162;
  const domainY = CANVAS_H - 116;
  const footerTop = pillY - 48;

  const midTop = headerBottom + 48;
  const midH = footerTop - 48 - midTop;

  // Size the verse to the space actually available, rather than guessing from
  // character count — long verses used to run into the footer.
  const block = fitVerseBlock(ctx, verseText, CANVAS_W - SIDE_MARGIN * 2, midH);
  const blockTop = midTop + (midH - block.height) / 2;

  // Soft scrim behind the verse only, so busy photos stay readable without
  // flattening the whole image.
  const scrim = ctx.createLinearGradient(0, blockTop - 110, 0, blockTop + block.height + 110);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(0.5, "rgba(0,0,0,0.34)");
  scrim.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, blockTop - 110, CANVAS_W, block.height + 220);

  // === TOP: brand lockup, centred as a single unit =======================
  ctx.font = "900 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const wordW = ctx.measureText("LIVYN").width;
  const markGap = 16;
  const lockupX = cx - (markSize + markGap + wordW) / 2;

  drawLivynMark(ctx, lockupX + markSize / 2, headerTop + markSize / 2, markSize);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 12;
  ctx.fillText("LIVYN", lockupX + markSize + markGap, headerTop + markSize / 2 + 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = "600 19px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("FAITH  ·  EVERY DAY  ·  EVERY STEP", cx, headerTop + markSize + 14);

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 54, headerTop + markSize + 50);
  ctx.lineTo(cx + 54, headerTop + markSize + 50);
  ctx.stroke();

  // === CENTRE: verse, quotes, reference ==================================
  let y = blockTop;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(107, 201, 148, 0.6)";
  ctx.font = `italic ${QUOTE_FONT}px Georgia, 'Times New Roman', serif`;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 16;
  ctx.fillText("“", cx, y - QUOTE_FONT * 0.14);
  y += QUOTE_H + GAP_QUOTE_TEXT;

  ctx.font = `500 ${block.fontSize}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 2;
  block.lines.forEach((line, i) => ctx.fillText(line, cx, y + i * block.lineHeight));
  y += block.textHeight + GAP_TEXT_QUOTE;

  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "rgba(107, 201, 148, 0.6)";
  ctx.font = `italic ${QUOTE_FONT}px Georgia, 'Times New Roman', serif`;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 16;
  ctx.fillText("”", cx, y - QUOTE_FONT * 0.14);
  y += QUOTE_H + GAP_QUOTE_REF;

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(107, 201, 148, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 44, y);
  ctx.lineTo(cx + 44, y);
  ctx.stroke();
  y += ACCENT_GAP;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 44px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 10;
  ctx.fillText(verseRef.toUpperCase(), cx, y);
  y += REF_H + GAP_REF_DATE;

  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = "500 26px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.shadowBlur = 8;
  ctx.fillText(dateStr, cx, y);

  // === BOTTOM: campaign footer ===========================================
  ctx.shadowBlur = 0;

  const pillText = "Dibuat dengan aplikasi";
  const brandText = "LIVYN";
  ctx.font = "500 26px -apple-system, BlinkMacSystemFont, sans-serif";
  const pillTextW = ctx.measureText(pillText).width;
  ctx.font = "900 28px -apple-system, BlinkMacSystemFont, sans-serif";
  const brandTextW = ctx.measureText(brandText).width;

  const logoSize = 42;
  const gap = 12;
  const padX = 30;
  const pillW = padX + logoSize + gap + pillTextW + 10 + brandTextW + padX;
  const pillX = (CANVAS_W - pillW) / 2;

  ctx.fillStyle = "rgba(10, 22, 16, 0.55)";
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1.5;
  drawPillPath(ctx, pillX, pillY, pillW, pillH);
  ctx.fill();
  ctx.stroke();

  let cursorX = pillX + padX;
  drawLivynMark(ctx, cursorX + logoSize / 2, pillY + pillH / 2, logoSize);
  cursorX += logoSize + gap;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "500 26px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(pillText, cursorX, pillY + pillH / 2 + 1);
  cursorX += pillTextW + 10;

  ctx.fillStyle = "#6BC994";
  ctx.font = "900 28px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(brandText, cursorX, pillY + pillH / 2 + 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "600 24px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.fillText("Firman, doa & renungan setiap hari", cx, campaignY);

  ctx.fillStyle = "rgba(107, 201, 148, 0.95)";
  ctx.font = "700 25px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("livyn.app", cx, domainY);

  ctx.shadowBlur = 0;
  ctx.textBaseline = "alphabetic";

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export function VerseShareCard({
  verseText,
  verseRef,
  variant = "full",
  className,
}: VerseShareCardProps) {
  const t = useT();
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
        let msg = t("verseImage.failed");
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
      setErrorMsg(e instanceof Error ? e.message : t("verseImage.failed"));
    } finally {
      setLoading(false);
    }
  }, [verseText, verseRef, t]);

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

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !imageUrl && !loading) generate();
  }

  return (
    <div className={cn(variant === "full" && "mt-4", className)}>
      {variant === "compact" ? (
        <button
          onClick={toggle}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-2 text-[12px] font-bold text-primary transition-transform active:scale-95"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {t("verseImage.ctaCompact")}
        </button>
      ) : (
        <button
          onClick={toggle}
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary/85 px-4 py-3.5 text-left shadow-md shadow-primary/20 transition-transform active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <ImageIcon className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex-1">
            <span className="block text-[14px] font-bold text-white">{t("verseImage.cta")}</span>
            <span className="block text-[11.5px] text-white/80">{t("verseImage.ctaSub")}</span>
          </div>
          <Sparkles className="h-4.5 w-4.5 text-white/80" />
        </button>
      )}

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
                    alt={t("verseImage.alt")}
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
                        {t("verseImage.generating")}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60">
                        {t("verseImage.generatingHint")}
                      </p>
                    </div>
                  ) : errorMsg ? (
                    <div className="flex flex-col items-center gap-3 px-6 text-center">
                      <p className="text-[13px] text-red-500 font-medium">
                        {t("verseImage.failed")}
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-[240px]">
                        {errorMsg}
                      </p>
                      <button
                        onClick={generate}
                        className="mt-1 text-[13px] font-semibold text-primary"
                      >
                        {t("verseImage.retry")}
                      </button>
                    </div>
                  ) : (
                    <button onClick={generate} className="flex flex-col items-center gap-3 px-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-glow)]">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-[13px] font-semibold text-primary">
                        {t("verseImage.generate")}
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-[220px] text-center leading-relaxed">
                        {t("verseImage.generateHint")}
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
                    aria-label={t("verseImage.regenerate")}
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
                    <span>{downloadDone ? t("verseImage.saved") : t("verseImage.save")}</span>
                  </button>
                  {canShare && (
                    <button
                      onClick={share}
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>{t("verseImage.share")}</span>
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
