"use client";

import { useEffect, useState } from "react";
import {
  LivynCopy,
  LivynCheck,
  LivynShare,
  LivynSpinner,
  LivynUserPlus,
} from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FriendInvitePanel({ onFriendAdded }: { onFriendAdded?: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enterCode, setEnterCode] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/friends/invite", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!cancelled && data?.code) setCode(data.code);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function share() {
    if (!code) return;
    setBusy(true);
    const shareText = `Hai! Ayo terhubung di Livyn — app rohani untuk bertumbuh bareng.\n\nMasukin kode ini di Teman > Gabung: ${code}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Undang ke Livyn", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Undangan disalin");
      }
    } catch {
      /* user dismissed */
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Kode tersalin");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Gagal menyalin");
    }
  }

  async function accept() {
    if (!enterCode.trim() || accepting) return;
    setAccepting(true);
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: enterCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal menerima undangan");
      } else {
        toast.success(`Sekarang berteman dengan ${data.friend?.name ?? ""} 🙌`);
        setEnterCode("");
        onFriendAdded?.();
      }
    } catch {
      toast.error("Kesalahan jaringan");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-transparent p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary/70">Kode Undanganmu</p>
        <p className="mt-2 font-display text-[28px] font-extrabold tracking-[0.15em] text-heading">
          {code ?? "LOADING..."}
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Bagikan kode ini ke teman. Mereka bisa masuk lewat kolom di bawah.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={share} disabled={!code || busy} className="flex-1">
            {busy ? <LivynSpinner className="h-4 w-4 animate-spin" /> : <LivynShare className="h-4 w-4" />}
            Bagikan
          </Button>
          <button
            onClick={copyCode}
            disabled={!code}
            aria-label="Salin kode"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground active:scale-95 transition-transform"
          >
            {copied ? <LivynCheck className="h-4 w-4 text-primary" /> : <LivynCopy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-bold text-heading">Masukkan kode teman</p>
        <div className="flex gap-2">
          <Input
            value={enterCode}
            onChange={(e) => setEnterCode(e.target.value.toUpperCase())}
            placeholder="LVN-XXXX"
            className="uppercase tracking-widest"
            maxLength={12}
          />
          <Button onClick={accept} disabled={accepting || !enterCode.trim()}>
            {accepting ? <LivynSpinner className="h-4 w-4 animate-spin" /> : <LivynUserPlus className="h-4 w-4" />}
            Tambah
          </Button>
        </div>
      </div>
    </div>
  );
}
