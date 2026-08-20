"use client";

import { useState } from "react";
import {
  LivynPrayer,
  LivynCheckCircle,
  LivynSpark,
  LivynPlus,
  LivynSpinner,
} from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Prayer = {
  id: string;
  title: string;
  body: string | null;
  isAnonymous: boolean;
  status: string;
  answeredNote: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
  _count: { intercessions: number };
  haveIPrayed: boolean;
  canModify: boolean;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
  if (hrs < 24) return `${hrs}j`;
  return `${Math.floor(hrs / 24)}h`;
}

export function PrayerRequestList({
  circleId,
  prayers: initial,
  currentUserId,
}: {
  circleId: string;
  prayers: Prayer[];
  currentUserId: string;
}) {
  const [prayers, setPrayers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/prayers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, isAnonymous: anon }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal");
        return;
      }
      setPrayers((prev) => [
        {
          id: data.prayer.id,
          title: data.prayer.title,
          body: data.prayer.body,
          isAnonymous: data.prayer.isAnonymous,
          status: "open",
          answeredNote: null,
          createdAt: new Date().toISOString(),
          user: { id: currentUserId, name: "Kamu", avatarUrl: null },
          _count: { intercessions: 0 },
          haveIPrayed: false,
          canModify: true,
        },
        ...prev,
      ]);
      setTitle("");
      setBody("");
      setAnon(false);
      setShowForm(false);
      toast.success("Permintaan doa dikirim");
    } finally {
      setBusy(false);
    }
  }

  async function togglePray(p: Prayer) {
    const wasPrayed = p.haveIPrayed;
    // Optimistic update
    setPrayers((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? {
              ...x,
              haveIPrayed: !wasPrayed,
              _count: { intercessions: x._count.intercessions + (wasPrayed ? -1 : 1) },
            }
          : x,
      ),
    );
    const res = await fetch(`/api/circles/${circleId}/prayers/${p.id}/pray`, { method: "POST" });
    if (!res.ok) {
      // Rollback
      setPrayers((prev) =>
        prev.map((x) =>
          x.id === p.id
            ? {
                ...x,
                haveIPrayed: wasPrayed,
                _count: { intercessions: x._count.intercessions + (wasPrayed ? 1 : -1) },
              }
            : x,
        ),
      );
      toast.error("Gagal");
    }
  }

  async function markAnswered(p: Prayer) {
    const note = window.prompt("Kesaksian singkat (opsional):") ?? "";
    const res = await fetch(`/api/circles/${circleId}/prayers/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answeredNote: note }),
    });
    if (!res.ok) return toast.error("Gagal");
    setPrayers((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, status: "answered", answeredNote: note || null } : x)),
    );
    toast.success("Puji Tuhan! 🙌");
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3.5 text-[13px] font-bold text-primary active:scale-[0.99] transition-transform"
        >
          <LivynPlus className="h-4 w-4" /> Tambah Permintaan Doa
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Doakan ujian anak saya"
            maxLength={120}
            required
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Detail (opsional)"
            maxLength={1000}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[13px] leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-heading">
            <input
              type="checkbox"
              checked={anon}
              onChange={(e) => setAnon(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            Kirim anonim (nama tidak ditampilkan)
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={busy} className="flex-1">
              {busy ? <LivynSpinner className="h-4 w-4 animate-spin" /> : "Kirim"}
            </Button>
          </div>
        </form>
      )}

      {prayers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <LivynPrayer className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
          <p className="text-[13px] text-muted-foreground">Belum ada permintaan doa.</p>
          <p className="mt-1 text-[12px] text-muted-foreground/70">
            Bagikan pergumulanmu — teman-teman circle akan mendoakan.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {prayers.map((p) => {
          const answered = p.status === "answered";
          const displayName = p.isAnonymous ? "Anonim" : p.user.name;
          return (
            <li
              key={p.id}
              className={cn(
                "rounded-2xl border p-4 transition-colors",
                answered ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-border-subtle bg-surface",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-heading">{displayName}</p>
                    <p className="text-[10.5px] text-muted-foreground">{relativeTime(p.createdAt)} lalu</p>
                  </div>
                </div>
                {answered && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    <LivynSpark className="h-3 w-3" /> Dijawab
                  </span>
                )}
              </div>

              <p className="mt-3 font-display text-[15px] font-bold leading-snug text-heading">{p.title}</p>
              {p.body && <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">{p.body}</p>}

              {answered && p.answeredNote && (
                <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-[13px] italic text-emerald-800 dark:text-emerald-200">
                  {p.answeredNote}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => togglePray(p)}
                  disabled={answered}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12.5px] font-bold transition-all active:scale-95 disabled:opacity-50",
                    p.haveIPrayed
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/15",
                  )}
                >
                  <LivynPrayer className="h-3.5 w-3.5" />
                  {p.haveIPrayed ? "Sudah didoakan" : "Aku doakan"}
                  <span className="text-[11px] font-semibold opacity-80">· {p._count.intercessions}</span>
                </button>

                {p.canModify && !answered && (
                  <button
                    onClick={() => markAnswered(p)}
                    className="flex items-center gap-1 rounded-xl px-2 py-1 text-[11.5px] font-bold text-emerald-700 hover:bg-emerald-500/10"
                  >
                    <LivynCheckCircle className="h-3.5 w-3.5" />
                    Sudah dijawab
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
