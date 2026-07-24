"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Users, Trash2, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Plan = {
  id: string;
  title: string;
  description: string;
  coverEmoji: string;
  totalDays: number;
  category: string;
  difficulty: string;
  active: boolean;
  enrollmentCount: number;
};

type Book = { code: string; name: string; chapterCount: number };

const CATEGORIES = [
  { value: "general", label: "Umum" },
  { value: "gospel", label: "Injil" },
  { value: "wisdom", label: "Hikmat" },
  { value: "epistles", label: "Surat-surat" },
  { value: "ot-history", label: "Sejarah PL" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Lanjutan" },
];

type ScheduleItem = { day: number; bookCode: string; chapter: number; title?: string };

const EMPTY_FORM = {
  title: "",
  description: "",
  coverEmoji: "📖",
  category: "general",
  difficulty: "beginner",
};

export function ReadingPlanManager({ initialPlans, books }: { initialPlans: Plan[]; books: Book[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [creating, setCreating] = useState(false);

  function addScheduleItem() {
    const day = scheduleItems.length + 1;
    setScheduleItems((prev) => [...prev, { day, bookCode: "", chapter: 1 }]);
  }

  function updateScheduleItem(index: number, updates: Partial<ScheduleItem>) {
    setScheduleItems((prev) => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  }

  function removeScheduleItem(index: number) {
    setScheduleItems((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, day: i + 1 })));
  }

  function generateSchedule() {
    if (!scheduleItems[0]?.bookCode) {
      toast.error("Pilih kitab pada hari pertama");
      return;
    }
    const firstBook = books.find((b) => b.code === scheduleItems[0].bookCode);
    if (!firstBook) return;

    const generated: ScheduleItem[] = [];
    for (let ch = 1; ch <= firstBook.chapterCount; ch++) {
      generated.push({ day: ch, bookCode: firstBook.code, chapter: ch });
    }
    setScheduleItems(generated);
    toast.success(`${generated.length} hari di-generate dari ${firstBook.name}`);
  }

  async function create() {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Lengkapi judul dan deskripsi");
      return;
    }
    if (scheduleItems.length === 0) {
      toast.error("Tambahkan minimal 1 jadwal bacaan");
      return;
    }
    const incomplete = scheduleItems.find((s) => !s.bookCode);
    if (incomplete) {
      toast.error(`Hari ${incomplete.day}: pilih kitab`);
      return;
    }

    setCreating(true);
    const res = await fetch("/api/admin/rencana-baca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        totalDays: scheduleItems.length,
        schedule: scheduleItems,
      }),
    });
    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      toast.error(data.error ?? "Gagal membuat rencana");
      return;
    }
    setPlans((prev) => [{ ...data.plan, enrollmentCount: 0 }, ...prev]);
    setForm(EMPTY_FORM);
    setScheduleItems([]);
    setFormOpen(false);
    toast.success("Rencana bacaan dibuat");
  }

  async function toggleActive(plan: Plan) {
    const res = await fetch(`/api/admin/rencana-baca/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !plan.active }),
    });
    if (res.ok) {
      setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, active: !p.active } : p));
    }
  }

  async function deletePlan(plan: Plan) {
    if (plan.enrollmentCount > 0) {
      toast.error("Tidak bisa hapus rencana yang sudah memiliki peserta");
      return;
    }
    const res = await fetch(`/api/admin/rencana-baca/${plan.id}`, { method: "DELETE" });
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      toast.success("Rencana dihapus");
    }
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setFormOpen((o) => !o)}>
          <Plus className="h-4 w-4" /> Rencana Baru
        </Button>
      </div>

      {formOpen && (
        <Card className="mb-5 space-y-4 p-5">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Emoji</label>
              <Input
                value={form.coverEmoji}
                onChange={(e) => setForm((f) => ({ ...f, coverEmoji: e.target.value }))}
                className="w-16 text-center text-xl"
                maxLength={4}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Judul</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Contoh: 30 Hari di Mazmur" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Jelaskan rencana bacaan ini..."
              className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tingkat Kesulitan</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule builder */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Jadwal Bacaan ({scheduleItems.length} hari)</label>
              <div className="flex gap-2">
                <button onClick={generateSchedule} className="text-xs text-primary hover:underline">
                  Generate dari kitab
                </button>
                <button onClick={addScheduleItem} className="text-xs text-primary hover:underline">
                  + Tambah hari
                </button>
              </div>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {scheduleItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-center text-xs text-muted-foreground">H{item.day}</span>
                  <select
                    value={item.bookCode}
                    onChange={(e) => updateScheduleItem(idx, { bookCode: e.target.value })}
                    className="h-9 flex-1 rounded border border-border bg-background px-2 text-xs outline-none focus:border-primary"
                  >
                    <option value="">Pilih kitab</option>
                    {books.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    max={books.find((b) => b.code === item.bookCode)?.chapterCount ?? 150}
                    value={item.chapter}
                    onChange={(e) => updateScheduleItem(idx, { chapter: Number(e.target.value) || 1 })}
                    className="h-9 w-16 text-xs"
                    placeholder="Ps"
                  />
                  <button onClick={() => removeScheduleItem(idx)} className="shrink-0 text-muted-foreground hover:text-error">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {scheduleItems.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">Belum ada jadwal. Tambahkan hari atau generate dari kitab.</p>
              )}
            </div>
          </div>

          <Button onClick={create} disabled={creating} className="w-full">
            {creating ? "Membuat..." : "Buat Rencana Bacaan"}
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {plans.length === 0 && (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Belum ada rencana bacaan.</p>
          </div>
        )}
        {plans.map((p) => (
          <Card key={p.id} className={cn("p-4", !p.active && "opacity-60")}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{p.coverEmoji}</span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{p.totalDays} hari</span>
                    <span>·</span>
                    <span>{CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}</span>
                    <span>·</span>
                    <span>{DIFFICULTIES.find((d) => d.value === p.difficulty)?.label ?? p.difficulty}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.enrollmentCount} peserta</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.enrollmentCount === 0 && (
                  <button onClick={() => deletePlan(p)} className="text-muted-foreground hover:text-error" aria-label="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => toggleActive(p)}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    p.active ? "bg-primary" : "bg-border",
                  )}
                  aria-label="Aktif/nonaktif"
                >
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", p.active ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
