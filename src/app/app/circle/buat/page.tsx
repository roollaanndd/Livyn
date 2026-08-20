"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LivynSpinner } from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { TopBar } from "@/components/nav/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMOJI_CHOICES = ["🌿", "🕊️", "✨", "🙏", "❤️", "📖", "🌱", "🌻", "☀️", "🕯️"];

export default function CreateCirclePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🌿");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, emoji }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal membuat circle");
        setBusy(false);
        return;
      }
      toast.success("Circle berhasil dibuat");
      router.replace(`/app/circle/${data.circle.id}`);
    } catch {
      toast.error("Kesalahan jaringan");
      setBusy(false);
    }
  }

  return (
    <div>
      <TopBar title="Buat Circle" back />
      <form onSubmit={submit} className="space-y-5 px-5 pb-10 pt-2">
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-heading">Pilih emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[22px] transition-all ${
                  emoji === e
                    ? "bg-primary/15 ring-2 ring-primary"
                    : "bg-surface-muted hover:bg-border"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-[13px] font-bold text-heading">Nama circle</label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Komsel Rabu Malam"
            maxLength={50}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="desc" className="text-[13px] font-bold text-heading">Deskripsi (opsional)</label>
          <textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kelompok kecil pemuda GBI Sudirman"
            maxLength={200}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[14px] leading-relaxed placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-2xl bg-surface-muted p-4 text-[12px] leading-relaxed text-muted-foreground">
          Setelah dibuat, kamu akan dapat <strong className="text-heading">kode gabung</strong> yang
          bisa dibagikan ke teman. Kamu jadi pemimpin circle secara otomatis.
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <LivynSpinner className="h-4 w-4 animate-spin" /> : "Buat Circle"}
        </Button>
      </form>
    </div>
  );
}
