"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LivynSpinner, LivynSave, LivynSend } from "@/components/icons/livyn-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { id: string; name: string };

export function SermonForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pastor, setPastor] = useState("");
  const [church, setChurch] = useState("");
  const [durationMin, setDurationMin] = useState(20);
  const [categoryId, setCategoryId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);

  async function save(submit: boolean) {
    if (!title.trim() || !description.trim() || !videoUrl.trim() || !pastor.trim()) {
      toast.error("Lengkapi semua kolom wajib terlebih dahulu");
      return;
    }
    setSaving(submit ? "submit" : "draft");
    const res = await fetch("/api/contributor/khotbah", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        videoUrl,
        pastor,
        church,
        durationSec: durationMin * 60,
        categoryId: categoryId || null,
        transcript,
        submit,
      }),
    });
    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menyimpan");
      return;
    }
    toast.success(submit ? "Khotbah dikirim untuk ditinjau moderator" : "Draf tersimpan");
    router.push("/contributor/khotbah");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Judul Khotbah</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">URL Video (MP4/HLS)</label>
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
        <p className="mt-1 text-xs text-muted-foreground">
          Build ini belum memiliki pipeline unggah &amp; transcoding video — tempel tautan video yang sudah dihosting.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nama Pengkhotbah</label>
          <Input value={pastor} onChange={(e) => setPastor(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Gereja</label>
          <Input value={church} onChange={(e) => setChurch(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Kategori</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Durasi (menit)</label>
          <Input type="number" min={1} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value) || 1)} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Transkrip (opsional)</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => save(false)} disabled={saving !== null}>
          {saving === "draft" ? <LivynSpinner className="h-4 w-4 animate-spin" /> : <LivynSave className="h-4 w-4" />}
          Simpan Draf
        </Button>
        <Button onClick={() => save(true)} disabled={saving !== null}>
          {saving === "submit" ? <LivynSpinner className="h-4 w-4 animate-spin" /> : <LivynSend className="h-4 w-4" />}
          Kirim untuk Ditinjau
        </Button>
      </div>
    </div>
  );
}
