"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LivynSpinner, LivynSave, LivynSend } from "@/components/icons/livyn-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { id: string; name: string };

export function DevotionForm({
  devotionId,
  categories,
  initial,
}: {
  devotionId?: string;
  categories: Category[];
  initial?: {
    title: string;
    excerpt: string;
    body: string;
    bibleRefs: string;
    readingTimeMin: number;
    categoryId: string | null;
  };
}) {
  const router = useRouter();
  const storageKey = `livyn_draft_devosi_${devotionId ?? "new"}`;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [bibleRefs, setBibleRefs] = useState(initial?.bibleRefs ?? "");
  const [readingTimeMin, setReadingTimeMin] = useState(initial?.readingTimeMin ?? 3);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const hydrated = useRef(false);

  // Restore local autosave draft (only for new, unsaved entries).
  useEffect(() => {
    if (initial || hydrated.current) return;
    hydrated.current = true;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage draft restore is browser-only, unreadable during SSR
      setTitle(draft.title ?? "");
      setExcerpt(draft.excerpt ?? "");
      setBody(draft.body ?? "");
      setBibleRefs(draft.bibleRefs ?? "");
      setReadingTimeMin(draft.readingTimeMin ?? 3);
      setCategoryId(draft.categoryId ?? "");
    } catch {}
  }, [initial, storageKey]);

  // Autosave to localStorage every few keystrokes (debounced).
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ title, excerpt, body, bibleRefs, readingTimeMin, categoryId }));
    }, 800);
    return () => clearTimeout(timer);
  }, [title, excerpt, body, bibleRefs, readingTimeMin, categoryId, storageKey]);

  async function save(submit: boolean) {
    if (!title.trim() || !excerpt.trim() || !body.trim() || !bibleRefs.trim()) {
      toast.error("Lengkapi semua kolom wajib terlebih dahulu");
      return;
    }
    setSaving(submit ? "submit" : "draft");

    const payload = { title, excerpt, body, bibleRefs, readingTimeMin, categoryId: categoryId || null, submit };
    const res = await fetch(devotionId ? `/api/contributor/devosi/${devotionId}` : "/api/contributor/devosi", {
      method: devotionId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menyimpan");
      return;
    }

    localStorage.removeItem(storageKey);
    toast.success(submit ? "Renungan dikirim untuk ditinjau moderator" : "Draf tersimpan");
    router.push("/contributor/renungan");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Judul</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul renungan" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Ringkasan</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="Ringkasan singkat 1-2 kalimat"
          className="w-full rounded-md border border-border bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
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
          <label className="mb-1.5 block text-sm font-medium">Lama Baca (menit)</label>
          <Input
            type="number"
            min={1}
            max={30}
            value={readingTimeMin}
            onChange={(e) => setReadingTimeMin(Number(e.target.value) || 1)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Referensi Alkitab</label>
        <Input value={bibleRefs} onChange={(e) => setBibleRefs(e.target.value)} placeholder="Contoh: Filipi 4:6-7, Mazmur 23:1" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Isi Renungan</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          placeholder="Tulis isi renunganmu di sini. Gunakan baris kosong untuk memisahkan paragraf."
          className="w-full rounded-md border border-border bg-surface p-3 font-mono text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-xs text-muted-foreground">Draf disimpan otomatis di perangkat ini selagi kamu mengetik.</p>
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
