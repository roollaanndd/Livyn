"use client";

import { useState } from "react";
import {
  LivynMegaphone,
  LivynBible,
  LivynPrayer,
  LivynPlus,
  LivynSpinner,
  LivynClose,
} from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Broadcast = {
  id: string;
  type: string;
  title: string;
  body: string;
  bibleRefs: string | null;
  sundayDate: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; avatarUrl: string | null };
};

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  announcement: { label: "Pengumuman", icon: LivynMegaphone, color: "text-sky-600" },
  sermon_note: { label: "Catatan Khotbah", icon: LivynBible, color: "text-amber-600" },
  prayer_focus: { label: "Fokus Doa", icon: LivynPrayer, color: "text-rose-600" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${Math.max(1, hrs)} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function BroadcastList({
  circleId,
  broadcasts: initial,
  canCreate,
}: {
  circleId: string;
  broadcasts: Broadcast[];
  canCreate: boolean;
}) {
  const [broadcasts, setBroadcasts] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<keyof typeof TYPE_META>("announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bibleRefs, setBibleRefs] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/broadcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, body, bibleRefs }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal");
        return;
      }
      setBroadcasts((prev) => [{ ...data.broadcast, createdBy: { id: "", name: "Kamu", avatarUrl: null } }, ...prev]);
      setTitle("");
      setBody("");
      setBibleRefs("");
      setShowForm(false);
      toast.success("Siaran dikirim ke seluruh circle");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {canCreate && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3.5 text-[13px] font-bold text-primary active:scale-[0.99] transition-transform"
        >
          <LivynPlus className="h-4 w-4" /> Buat Siaran
        </button>
      )}

      {showForm && (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-[14px] font-extrabold text-heading">Siaran Baru</p>
            <button type="button" onClick={() => setShowForm(false)}><LivynClose className="h-4 w-4 text-muted-foreground" /></button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TYPE_META) as (keyof typeof TYPE_META)[]).map((k) => {
              const meta = TYPE_META[k];
              const active = type === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setType(k)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition-all",
                    active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground",
                  )}
                >
                  <meta.icon className="h-4 w-4" />
                  {meta.label}
                </button>
              );
            })}
          </div>

          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul" maxLength={120} required />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Isi siaran"
            maxLength={4000}
            rows={6}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[13px] leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
          <Input
            value={bibleRefs}
            onChange={(e) => setBibleRefs(e.target.value)}
            placeholder="Referensi ayat (opsional, contoh: Matius 5:1-12)"
            maxLength={200}
          />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <LivynSpinner className="h-4 w-4 animate-spin" /> : "Publikasikan"}
          </Button>
        </form>
      )}

      {broadcasts.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <LivynMegaphone className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
          <p className="text-[13px] text-muted-foreground">Belum ada siaran.</p>
          {canCreate && (
            <p className="mt-1 text-[12px] text-muted-foreground/70">
              Kirim catatan khotbah, pengumuman, atau fokus doa mingguan.
            </p>
          )}
        </div>
      )}

      <ul className="space-y-3">
        {broadcasts.map((b) => {
          const meta = TYPE_META[b.type] ?? TYPE_META.announcement;
          const Icon = meta.icon;
          return (
            <li key={b.id} className="rounded-2xl border border-border-subtle bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <div className={cn("flex items-center gap-1.5", meta.color)}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider">{meta.label}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{relativeTime(b.createdAt)}</span>
              </div>

              <p className="mt-2 font-display text-[16px] font-extrabold leading-snug text-heading">{b.title}</p>
              <div className="mt-2 whitespace-pre-line text-[13.5px] leading-[1.75] text-foreground/90">{b.body}</div>

              {b.bibleRefs && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {b.bibleRefs.split(",").map((r, i) => (
                    <span key={i} className="rounded-lg bg-primary/10 px-2 py-1 text-[11.5px] font-bold text-primary">
                      {r.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>oleh {b.createdBy?.name ?? "Pemimpin"}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
