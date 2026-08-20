"use client";

import { useState } from "react";
import {
  LivynCheckCircle,
  LivynTrophy,
  LivynSpinner,
  LivynPlus,
  LivynClose,
} from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mission = {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  totalMembers: number;
  checkedInCount: number;
  haveICheckedIn: boolean;
};

const CATEGORY_LABEL: Record<string, string> = {
  reading: "📖 Baca Alkitab",
  prayer: "🙏 Doa",
  fasting: "🕊️ Puasa",
  evangelism: "💬 Kesaksian",
  service: "🤝 Pelayanan",
  custom: "✨ Lainnya",
};

function daysLeft(endIso: string): number {
  return Math.max(0, Math.ceil((new Date(endIso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function MissionList({
  circleId,
  missions: initial,
  canCreate,
}: {
  circleId: string;
  missions: Mission[];
  canCreate: boolean;
}) {
  const [missions, setMissions] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("reading");
  const [durationDays, setDurationDays] = useState(7);
  const [busy, setBusy] = useState(false);

  async function checkIn(m: Mission) {
    if (m.haveICheckedIn) return;
    setMissions((prev) =>
      prev.map((x) =>
        x.id === m.id ? { ...x, haveICheckedIn: true, checkedInCount: x.checkedInCount + 1 } : x,
      ),
    );
    const res = await fetch(`/api/circles/${circleId}/missions/${m.id}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      setMissions((prev) =>
        prev.map((x) =>
          x.id === m.id ? { ...x, haveICheckedIn: false, checkedInCount: x.checkedInCount - 1 } : x,
        ),
      );
      toast.error("Gagal check-in");
      return;
    }
    toast.success("Check-in sukses 🙌");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !title.trim() || !description.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/missions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, durationDays }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal");
        return;
      }
      setMissions((prev) => [
        {
          id: data.mission.id,
          title,
          description,
          category,
          startDate: data.mission.startDate,
          endDate: data.mission.endDate,
          totalMembers: initial[0]?.totalMembers ?? 1,
          checkedInCount: 0,
          haveICheckedIn: false,
        },
        ...prev,
      ]);
      setTitle("");
      setDescription("");
      setCategory("reading");
      setDurationDays(7);
      setShowForm(false);
      toast.success("Misi mingguan dibuat");
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: Mission) {
    if (!confirm(`Hapus misi "${m.title}"?`)) return;
    const res = await fetch(`/api/circles/${circleId}/missions/${m.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Gagal menghapus");
    setMissions((prev) => prev.filter((x) => x.id !== m.id));
  }

  return (
    <div className="space-y-4">
      {canCreate && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3.5 text-[13px] font-bold text-primary active:scale-[0.99] transition-transform"
        >
          <LivynPlus className="h-4 w-4" /> Buat Misi Mingguan
        </button>
      )}

      {showForm && (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-[14px] font-extrabold text-heading">Misi Baru</p>
            <button type="button" onClick={() => setShowForm(false)}><LivynClose className="h-4 w-4 text-muted-foreground" /></button>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-heading">Kategori</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCategory(k)}
                  className={cn(
                    "rounded-xl px-2 py-2 text-[11.5px] font-semibold transition-all",
                    category === k ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Baca Injil Yohanes minggu ini"
            maxLength={80}
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail misi — apa yang harus dilakukan anggota"
            maxLength={500}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[13px] leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />

          <div className="flex items-center gap-2">
            <label className="text-[12px] font-bold text-heading">Durasi</label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value, 10))}
              className="rounded-xl border border-border bg-background px-3 py-2 text-[13px]"
            >
              <option value={3}>3 hari</option>
              <option value={7}>1 minggu</option>
              <option value={14}>2 minggu</option>
              <option value={30}>30 hari</option>
            </select>
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <LivynSpinner className="h-4 w-4 animate-spin" /> : "Publikasikan"}
          </Button>
        </form>
      )}

      {missions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <LivynTrophy className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
          <p className="text-[13px] text-muted-foreground">Belum ada misi aktif.</p>
          {canCreate && (
            <p className="mt-1 text-[12px] text-muted-foreground/70">
              Sebagai pemimpin, kamu bisa buat misi mingguan untuk anggota.
            </p>
          )}
        </div>
      )}

      <ul className="space-y-3">
        {missions.map((m) => {
          const pct = m.totalMembers > 0 ? Math.min(100, Math.round((m.checkedInCount / m.totalMembers) * 100)) : 0;
          const days = daysLeft(m.endDate);
          return (
            <li key={m.id} className="rounded-2xl border border-border-subtle bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary">
                  {CATEGORY_LABEL[m.category] ?? m.category}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {days === 0 ? "Berakhir hari ini" : `${days} hari lagi`}
                </span>
              </div>
              <p className="mt-2 font-display text-[15px] font-extrabold leading-snug text-heading">{m.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{m.description}</p>

              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Progress circle</span>
                  <span className="font-bold text-primary">
                    {m.checkedInCount} / {m.totalMembers}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => checkIn(m)}
                  disabled={m.haveICheckedIn}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all active:scale-[0.98]",
                    m.haveICheckedIn
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  <LivynCheckCircle className="h-4 w-4" />
                  {m.haveICheckedIn ? "Sudah selesai" : "Aku selesai"}
                </button>
                {canCreate && (
                  <button
                    onClick={() => remove(m)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground active:scale-95"
                    aria-label="Hapus misi"
                  >
                    <LivynClose className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
