"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LivynDownload,
  LivynShare,
  LivynImage,
  LivynCheck,
  LivynSpinner,
  LivynRefresh,
  LivynSpark,
} from "@/components/icons/livyn-icons";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

/**
 * DevotionShareCard — parallel to VerseShareCard but shaped around a whole
 * devotion (theme + title + featured verse + date + brand). Reuses the same
 * /api/verse-image/generate endpoint for the background photo, because the
 * server picks a stock query from keyword matches in the passed text — the
 * verse text is already the perfect input for that. The full compositing
 * runs in the browser so we never spend server bandwidth on the final PNG.
 *
 * Design notes: kept warmer than the verse card so the two feel like a set,
 * not a duplicate. Theme pill at the top with the accent color the devotion
 * page uses; title in the display serif with a soft glow; verse below as a
 * quiet pull-quote; footer keeps the same "livyn.app" brand lockup so both
 * cards read as one product on someone's story feed.
 */

interface DevotionShareCardProps {
  title: string;
  theme: string;
  /** Accent slug from src/lib/devotions/daily-themes.ts */
  accent: "sage" | "amber" | "rose" | "sky" | "violet" | "teal";
  verseText: string;
  verseRef: string;
  className?: string;
}

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const SIDE_MARGIN = 96;

// Rank of the palette used inside the canvas; each entry mirrors the CSS
// tokens the on-screen devotion page uses so the shared card and the page
// feel like the same design system.
const ACCENT_PALETTE: Record<
  DevotionShareCardProps["accent"],
  { chip: string; chipBg: string; rule: string; glow: string }
> = {
  sage: { chip: "#B4E8CC", chipBg: "rgba(34,113,72,0.44)", rule: "rgba(180,232,204,0.85)", glow: "rgba(107,201,148,0.35)" },
  amber: { chip: "#FFD9A3", chipBg: "rgba(120,72,10,0.44)", rule: "rgba(255,217,163,0.85)", glow: "rgba(240,180,80,0.35)" },
  rose: { chip: "#FDCAD3", chipBg: "rgba(120,32,50,0.44)", rule: "rgba(253,202,211,0.85)", glow: "rgba(240,120,140,0.35)" },
  sky: { chip: "#BEE0FA", chipBg: "rgba(28,72,120,0.44)", rule: "rgba(190,224,250,0.85)", glow: "rgba(120,180,240,0.35)" },
  violet: { chip: "#D9CAF7", chipBg: "rgba(72,48,120,0.44)", rule: "rgba(217,202,247,0.85)", glow: "rgba(160,120,240,0.35)" },
  teal: { chip: "#B4EAE1", chipBg: "rgba(32,90,90,0.44)", rule: "rgba(180,234,225,0.85)", glow: "rgba(80,200,190,0.35)" },
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
    if (ctx.measureText(word).width <= maxWidth) {
      current = word;
      continue;
    }
    // A single unbreakable word wider than maxWidth — hard-break by character
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
 * Free stock sources sometimes return photos with letterbox bars baked in.
 * Detect and crop them before cover-fitting, so the composed image genuinely
 * reaches every edge. Copied intentionally from verse-share-card.tsx —
 * shared to a helper the next time either card grows a variant.
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
    return full;
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
  if (w >= dw && h >= dh) return full;
  if (w < dw * 0.5 || h < dh * 0.5) return full;
  return {
    sx: Math.round(left / scale),
    sy: Math.round(top / scale),
    sw: Math.round(w / scale),
    sh: Math.round(h / scale),
  };
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

/** Fit the devotion title into the available height, shrinking if needed. */
function fitTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number) {
  for (let fontSize = 96; fontSize > 44; fontSize -= 4) {
    ctx.font = `800 ${fontSize}px Georgia, 'Times New Roman', serif`;
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = Math.round(fontSize * 1.16);
    const height = lines.length * lineHeight;
    if (height <= maxHeight && lines.length <= 5) {
      return { fontSize, lines, lineHeight, height };
    }
  }
  ctx.font = `800 44px Georgia, 'Times New Roman', serif`;
  const lines = wrapText(ctx, text, maxWidth);
  return { fontSize: 44, lines, lineHeight: 52, height: lines.length * 52 };
}

/** Fit the verse text under the title in the smaller pull-quote region. */
function fitVerse(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number) {
  for (let fontSize = 42; fontSize > 24; fontSize -= 2) {
    ctx.font = `italic 500 ${fontSize}px Georgia, 'Times New Roman', serif`;
    const lines = wrapText(ctx, `"${text}"`, maxWidth);
    const lineHeight = Math.round(fontSize * 1.5);
    const height = lines.length * lineHeight;
    if (height <= maxHeight && lines.length <= 6) {
      return { fontSize, lines, lineHeight, height };
    }
  }
  // Last resort: truncate cleanly with an ellipsis.
  ctx.font = `italic 500 24px Georgia, 'Times New Roman', serif`;
  const lineHeight = 36;
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  const lines = wrapText(ctx, `"${text}"`, maxWidth).slice(0, maxLines);
  if (lines.length === maxLines && lines[maxLines - 1]) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,;:]*\s*$/, "") + "…";
  }
  return { fontSize: 24, lines, lineHeight, height: lines.length * lineHeight };
}

async function compositeImage(
  bgBlob: Blob,
  args: {
    title: string;
    theme: string;
    accent: DevotionShareCardProps["accent"];
    verseText: string;
    verseRef: string;
  },
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;
  const palette = ACCENT_PALETTE[args.accent];

  const img = await createImageBitmap(bgBlob);
  const cx = CANVAS_W / 2;

  // === BACKGROUND ========================================================
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

  // Softer, more editorial overlay than the verse card — the devotion card
  // reads as a magazine cover rather than a lock-screen quote.
  const overlay = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  overlay.addColorStop(0, "rgba(6, 14, 10, 0.68)");
  overlay.addColorStop(0.35, "rgba(6, 14, 10, 0.42)");
  overlay.addColorStop(0.65, "rgba(6, 14, 10, 0.46)");
  overlay.addColorStop(1, "rgba(6, 14, 10, 0.82)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Accent-tinted radial glow behind the title so the theme colour reads
  // even on a busy photo. Kept low-alpha so it's felt, not noticed.
  const glow = ctx.createRadialGradient(cx, 780, 60, cx, 780, 720);
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 260, CANVAS_W, 1100);

  // === HEADER ============================================================
  const headerTop = 132;
  const markSize = 64;

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
  ctx.fillText("RENUNGAN HARI INI", cx, headerTop + markSize + 14);
  ctx.shadowBlur = 0;

  // === THEME PILL ========================================================
  const themeText = args.theme.toUpperCase();
  ctx.font = "800 26px -apple-system, BlinkMacSystemFont, sans-serif";
  const themeW = ctx.measureText(themeText).width;
  const themePadX = 32;
  const themeH = 52;
  const themePillW = themeW + themePadX * 2;
  const themePillX = cx - themePillW / 2;
  const themePillY = 320;

  ctx.fillStyle = palette.chipBg;
  ctx.strokeStyle = palette.chip;
  ctx.lineWidth = 2;
  drawPillPath(ctx, themePillX, themePillY, themePillW, themeH);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.chip;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.fillText(themeText, cx, themePillY + themeH / 2 + 1);
  ctx.shadowBlur = 0;

  // === TITLE =============================================================
  const titleTop = themePillY + themeH + 60;
  const titleMaxH = 560;
  const titleBlock = fitTitle(ctx, args.title, CANVAS_W - SIDE_MARGIN * 2, titleMaxH);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 3;
  ctx.font = `800 ${titleBlock.fontSize}px Georgia, 'Times New Roman', serif`;
  titleBlock.lines.forEach((line, i) =>
    ctx.fillText(line, cx, titleTop + i * titleBlock.lineHeight),
  );
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;

  // Accent rule under the title
  const ruleY = titleTop + titleBlock.height + 44;
  ctx.strokeStyle = palette.rule;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 56, ruleY);
  ctx.lineTo(cx + 56, ruleY);
  ctx.stroke();

  // === VERSE PULL-QUOTE ==================================================
  const verseTop = ruleY + 48;
  const verseMaxH = 380;
  const verseBlock = fitVerse(ctx, args.verseText, CANVAS_W - SIDE_MARGIN * 2, verseMaxH);

  ctx.font = `italic 500 ${verseBlock.fontSize}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 14;
  verseBlock.lines.forEach((line, i) =>
    ctx.fillText(line, cx, verseTop + i * verseBlock.lineHeight),
  );

  ctx.shadowBlur = 8;
  ctx.fillStyle = palette.chip;
  ctx.font = "700 30px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(`— ${args.verseRef}`, cx, verseTop + verseBlock.height + 26);
  ctx.shadowBlur = 0;

  // === FOOTER BRAND PILL =================================================
  const pillH = 74;
  const pillY = CANVAS_H - 292;
  const pillText = "Baca lengkap di";
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

  // === TAGLINE + DATE ====================================================
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "600 24px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  ctx.fillText(dateStr, cx, CANVAS_H - 162);

  ctx.fillStyle = "rgba(107, 201, 148, 0.95)";
  ctx.font = "700 25px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("livyn.app", cx, CANVAS_H - 116);

  ctx.shadowBlur = 0;
  ctx.textBaseline = "alphabetic";

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export function DevotionShareCard({
  title,
  theme,
  accent,
  verseText,
  verseRef,
  className,
}: DevotionShareCardProps) {
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
      // Reuse the same background service the verse card uses. Passing the
      // verse text as `text` gives the server a good keyword surface to
      // pick a scene from (kasih/damai/pengharapan etc.) — same as the
      // verse card path, so we get the same aesthetic.
      const res = await fetch("/api/verse-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: verseText, ref: verseRef }),
      });

      if (!res.ok) {
        let msg = t("devotionImage.failed");
        try {
          const data = await res.json();
          if (data.error) msg = data.error;
        } catch {
          /* not json */
        }
        throw new Error(msg);
      }

      const bgBlob = await res.blob();
      const composed = await compositeImage(bgBlob, { title, theme, accent, verseText, verseRef });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(composed);
      });
      setComposedBlob(composed);
      setImageUrl(dataUrl);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t("devotionImage.failed"));
    } finally {
      setLoading(false);
    }
  }, [title, theme, accent, verseText, verseRef, t]);

  function download() {
    if (!composedBlob) return;
    const url = URL.createObjectURL(composedBlob);
    const a = document.createElement("a");
    a.href = url;
    const slug = title.replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").toLowerCase().slice(0, 60);
    a.download = `livyn-renungan-${slug || "hari-ini"}.png`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadDone(true);
    setTimeout(() => setDownloadDone(false), 2000);
  }

  async function share() {
    if (!composedBlob) return;
    const file = new File([composedBlob], "livyn-renungan.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${title} — Livyn`,
          text: `📖 Renungan Hari Ini — ${title}\n\n"${verseText}"\n— ${verseRef}\n\nBaca lengkap di Livyn 🙏`,
          files: [file],
        });
      } else {
        await navigator.share({
          title: `${title} — Livyn`,
          text: `📖 Renungan Hari Ini — ${title}\n\n"${verseText}" — ${verseRef}\n\nLivyn — Faith. Every Day. Every Step.`,
        });
      }
    } catch {
      /* user cancelled or unsupported */
    }
  }

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !imageUrl && !loading) generate();
  }

  return (
    <div className={cn("mt-4", className)}>
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary/85 px-4 py-3.5 text-left shadow-md shadow-primary/20 transition-transform active:scale-[0.98]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <LivynImage className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="flex-1">
          <span className="block text-[14px] font-bold text-white">{t("devotionImage.cta")}</span>
          <span className="block text-[11.5px] text-white/80">{t("devotionImage.ctaSub")}</span>
        </div>
        <LivynSpark className="h-4.5 w-4.5 text-white/80" />
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
                    alt={t("devotionImage.alt")}
                    className="block h-auto w-full"
                    style={{ aspectRatio: "9 / 16", objectFit: "cover" }}
                  />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <LivynSpinner className="h-8 w-8 animate-spin text-white" />
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
                      <LivynSpinner className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-[13px] text-muted-foreground">
                        {t("devotionImage.generating")}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60">
                        {t("devotionImage.generatingHint")}
                      </p>
                    </div>
                  ) : errorMsg ? (
                    <div className="flex flex-col items-center gap-3 px-6 text-center">
                      <p className="text-[13px] font-medium text-red-500">
                        {t("devotionImage.failed")}
                      </p>
                      <p className="max-w-[240px] text-[11px] text-muted-foreground">{errorMsg}</p>
                      <button
                        onClick={generate}
                        className="mt-1 text-[13px] font-semibold text-primary"
                      >
                        {t("devotionImage.retry")}
                      </button>
                    </div>
                  ) : (
                    <button onClick={generate} className="flex flex-col items-center gap-3 px-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-glow)]">
                        <LivynSpark className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-[13px] font-semibold text-primary">
                        {t("devotionImage.generate")}
                      </p>
                      <p className="max-w-[220px] text-center text-[11px] leading-relaxed text-muted-foreground">
                        {t("devotionImage.generateHint")}
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
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-heading transition-colors hover:bg-surface-muted/80 disabled:opacity-50"
                    aria-label={t("devotionImage.regenerate")}
                  >
                    {loading ? <LivynSpinner className="h-4 w-4 animate-spin" /> : <LivynRefresh className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={download}
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-muted px-4 py-2.5 text-[13px] font-semibold text-heading transition-colors hover:bg-surface-muted/80 disabled:opacity-50"
                  >
                    {downloadDone ? <LivynCheck className="h-4 w-4 text-primary" /> : <LivynDownload className="h-4 w-4" />}
                    <span>{downloadDone ? t("devotionImage.saved") : t("devotionImage.save")}</span>
                  </button>
                  {canShare && (
                    <button
                      onClick={share}
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      <LivynShare className="h-4 w-4" />
                      <span>{t("devotionImage.share")}</span>
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
