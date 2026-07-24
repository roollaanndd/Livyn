"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VersePingComposer({ friendId, friendName }: { friendId: string; friendName: string }) {
  const router = useRouter();
  const [verseRef, setVerseRef] = useState("");
  const [verseText, setVerseText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/verse-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: friendId, verseRef, verseText, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal mengirim");
        setBusy(false);
        return;
      }
      toast.success(`Ayat terkirim ke ${friendName} 🙌`);
      router.replace("/app/teman");
    } catch {
      toast.error("Kesalahan jaringan");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary/70">Kirim kepada</p>
        <p className="mt-1 font-display text-[16px] font-extrabold text-heading">{friendName}</p>
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-bold text-heading">Referensi ayat</label>
        <Input
          value={verseRef}
          onChange={(e) => setVerseRef(e.target.value)}
          placeholder="Contoh: Filipi 4:13"
          maxLength={60}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-bold text-heading">Teks ayat</label>
        <textarea
          value={verseText}
          onChange={(e) => setVerseText(e.target.value)}
          placeholder='"Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku."'
          maxLength={600}
          rows={4}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[14px] leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-bold text-heading">Catatan pribadi (opsional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ayat ini kupikirin saat doakan kamu — semoga menguatkan."
          maxLength={300}
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[13px] leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={busy || !verseRef.trim() || !verseText.trim()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Kirim Ayat
      </Button>
    </form>
  );
}
