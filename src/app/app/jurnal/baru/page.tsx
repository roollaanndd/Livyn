"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

      <div className="space-y-5 px-5 pb-8 pt-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Bagaimana perasaanmu hari ini?</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MOOD_META).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMood((m) => (m === key ? null : key))}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  mood === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                )}
              >
                <span>{meta.emoji}</span> {meta.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Judul (opsional)</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Hari yang berat" maxLength={100} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Ceritakan kepada Tuhan</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tuliskan apa yang terjadi hari ini, apa yang kamu rasakan, atau apa yang ingin kamu doakan..."
            rows={10}
            maxLength={5000}
            className="w-full resize-none rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{body.length}/5000</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Setelah kamu menyimpan, Livyn akan menyarankan satu ayat Alkitab yang relevan untuk menguatkan dan menghiburmu.
        </p>

        <Button onClick={submit} size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Catatan
        </Button>
      </div>
    </div>
  );
}
