"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LivynSpinner } from "@/components/icons/livyn-icons";
import { motion } from "framer-motion";
import { TopBar } from "@/components/nav/top-bar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOOD_META } from "@/lib/journal/mood-meta";

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (body.trim().length < 3) {
      toast.error("Ceritakan sedikit lebih banyak tentang harimu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, body: body.trim(), mood: mood ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan catatan");
        return;
      }
      router.replace(`/app/jurnal/${data.entry.id}`);
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <TopBar title="Curhat kepada Tuhan" back />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6 px-5 pb-8 pt-5"
      >
        {/* Mood selector */}
        <div>
          <label className="mb-3 block text-[13px] font-semibold text-heading">
            Bagaimana perasaanmu hari ini?
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MOOD_META).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMood((m) => (m === key ? null : key))}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-[13px] font-medium transition-all",
                  mood === key
                    ? "border-primary bg-primary-soft text-primary shadow-[var(--shadow-sm)]"
                    : "border-border-subtle text-muted-foreground hover:bg-surface-muted",
                )}
              >
                <span className="text-base">{meta.emoji}</span> {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-heading">Judul (opsional)</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Hari yang berat"
            maxLength={100}
          />
        </div>

        {/* Body */}
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-heading">Ceritakan kepada Tuhan</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tuliskan apa yang terjadi hari ini, apa yang kamu rasakan, atau apa yang ingin kamu doakan..."
            rows={10}
            maxLength={5000}
            className="w-full resize-none rounded-2xl border border-border bg-surface p-4 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 focus:shadow-[var(--shadow-glow)]"
          />
          <p className="mt-1.5 text-right text-[11px] text-muted-foreground">{body.length}/5000</p>
        </div>

        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Setelah kamu menyimpan, Livyn akan menyarankan satu ayat Alkitab yang relevan untuk menguatkan dan menghiburmu.
        </p>

        <Button onClick={submit} size="lg" className="w-full" disabled={loading}>
          {loading && <LivynSpinner className="h-4.5 w-4.5 animate-spin" />}
          Simpan Catatan
        </Button>
      </motion.div>
    </div>
  );
}
