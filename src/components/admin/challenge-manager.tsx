"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Challenge = {
  id: string;
  title: string;
  month: number;
  year: number;
  bookCode: string;
  chapterFrom: number;
  chapterTo: number;
  description: string | null;
  active: boolean;
  participantCount: number;
};

type Book = { code: string; name: string; chapterCount: number };

const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const now = new Date();
const EMPTY_FORM = {
  title: "",
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  bookCode: "",
  chapterFrom: 1,
  chapterTo: 1,
  description: "",
};

export function ChallengeManager({ initialChallenges, books }: { initialChallenges: Challenge[]; books: Book[] }) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const selectedBook = books.find((b) => b.code === form.bookCode);

  async function create() {
    if (!form.title.trim() || !form.bookCode) {
      toast.error("Lengkapi judul dan kitab terlebih dahulu");
      return;
    }
    const res = await fetch("/api/admin/tantangan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        month: form.month,
        year: form.year,
        bookCode: form.bookCode,
        chapterFrom: form.chapterFrom,
        chapterTo: form.chapterTo,
        description: form.description.trim() || undefined,
        active: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal membuat tantangan");
      return;
    }
    setChallenges((prev) => [{ ...data.challenge, participantCount: 0 }, ...prev]);
    setForm(EMPTY_FORM);
    setFormOpen(false);
    toast.success("Tantangan dibuat");
  }

  async function toggleActive(c: Challenge) {
    const res = await fetch(`/api/admin/tantangan/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    if (res.ok) {
      setChallenges((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
    }
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setFormOpen((o) => !o)}>
          <Plus className="h-4 w-4" /> Tantangan Baru
        </Button>
      </div>

      {formOpen && (
        <Card className="mb-5 space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Judul</label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Contoh: Baca Injil Yohanes Bersama" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Bulan</label>
              <select
                value={form.month}
                onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {MONTH_LABELS.map((label, idx) => (
                  <option key={label} value={idx + 1}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tahun</label>
              <Input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Kitab</label>
            <select
              value={form.bookCode}
              onChange={(e) => setForm((f) => ({ ...f, bookCode: e.target.value, chapterFrom: 1, chapterTo: 1 }))}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Pilih kitab</option>
              {books.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          {selectedBook && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Pasal Awal</label>
                <Input
                  type="number"
                  min={1}
                  max={selectedBook.chapterCount}
                  value={form.chapterFrom}
                  onChange={(e) => setForm((f) => ({ ...f, chapterFrom: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Pasal Akhir</label>
                <Input
                  type="number"
                  min={1}
                  max={selectedBook.chapterCount}
                  value={form.chapterTo}
                  onChange={(e) => setForm((f) => ({ ...f, chapterTo: Number(e.target.value) }))}
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">Deskripsi (opsional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <Button onClick={create} className="w-full">Buat Tantangan</Button>
        </Card>
      )}

      <div className="space-y-3">
        {challenges.map((c) => (
          <Card key={c.id} className={cn("p-4", !c.active && "opacity-60")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted-foreground">
                  {MONTH_LABELS[c.month - 1]} {c.year} · {c.bookCode} {c.chapterFrom}–{c.chapterTo}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {c.participantCount} peserta
                </p>
              </div>
              <button
                onClick={() => toggleActive(c)}
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  c.active ? "bg-primary" : "bg-border",
                )}
                aria-label="Aktif/nonaktif"
              >
                <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", c.active ? "translate-x-4" : "translate-x-0.5")} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
