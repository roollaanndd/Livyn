"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  verseRef: string;
  verseText: string;
  className?: string;
};

export function DailyShareButton({ title, verseRef, verseText, className }: Props) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const shareText = `📖 Renungan Hari Ini — Livyn\n\n${title}\n\n"${verseText}"\n— ${verseRef}\n\nBaca selengkapnya di Livyn 🙏`;

  async function shareNative() {
    if (busy) return;
    setBusy(true);
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `${title} — Livyn`, text: shareText, url });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        toast.success("Renungan disalin ke clipboard");
      }
    } catch {
      // user dismissed share sheet — no toast needed
    } finally {
      setBusy(false);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Tersalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin");
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={shareNative}
        disabled={busy}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-4 py-3 text-[14px] font-bold shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        <Share2 className="h-4 w-4" />
        Bagikan Renungan
      </button>
      <button
        type="button"
        onClick={copyText}
        aria-label="Salin teks"
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted text-muted-foreground active:scale-95 transition-transform"
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
