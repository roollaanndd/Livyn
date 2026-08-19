"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LivynCopy,
  LivynCheck,
  LivynShare,
  LivynLogOut,
  LivynSpinner,
} from "@/components/icons/livyn-icons";
import { toast } from "sonner";

export function CircleHeaderActions({
  circleId,
  circleName,
  joinCode,
  isOwner,
}: {
  circleId: string;
  circleName: string;
  joinCode: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      toast.success("Kode disalin");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Gagal menyalin");
    }
  }

  async function share() {
    const shareText = `Ayo gabung ke circle "${circleName}" di Livyn.\n\nMasukin kode ini di Circle > Gabung:\n${joinCode}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `Gabung ${circleName}`, text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Undangan disalin");
      }
    } catch {
      /* dismissed */
    }
  }

  async function leave() {
    if (!confirm("Yakin keluar dari circle ini?")) return;
    setBusy(true);
    const res = await fetch(`/api/circles/${circleId}/leave`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Gagal keluar");
      return;
    }
    toast.success("Kamu keluar dari circle");
    router.replace("/app/circle");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={share}
        className="flex h-9 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-[12px] font-bold text-primary active:scale-95 transition-transform"
      >
        <LivynShare className="h-3.5 w-3.5" />
        Bagikan
      </button>
      <button
        onClick={copy}
        className="flex h-9 items-center gap-1.5 rounded-xl bg-surface-muted px-3 text-[12px] font-semibold text-muted-foreground active:scale-95 transition-transform"
      >
        {copied ? <LivynCheck className="h-3.5 w-3.5 text-primary" /> : <LivynCopy className="h-3.5 w-3.5" />}
        <span className="tracking-widest">{joinCode}</span>
      </button>
      {!isOwner && (
        <button
          onClick={leave}
          disabled={busy}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground active:scale-95 transition-transform"
          aria-label="Keluar circle"
        >
          {busy ? <LivynSpinner className="h-3.5 w-3.5 animate-spin" /> : <LivynLogOut className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}
