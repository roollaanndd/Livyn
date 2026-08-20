"use client";

import { useState } from "react";
import { LivynQuote, LivynBible } from "@/components/icons/livyn-icons";
import { cn } from "@/lib/utils";

type Ping = {
  id: string;
  verseRef: string;
  verseText: string;
  note: string | null;
  readAt: string | null;
  createdAt: string;
  fromUser: { id: string; name: string; avatarUrl: string | null };
};

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function VersePingInbox({ pings: initial }: { pings: Ping[] }) {
  const [pings, setPings] = useState(initial);

  async function markRead(id: string) {
    setPings((prev) => prev.map((p) => (p.id === id ? { ...p, readAt: new Date().toISOString() } : p)));
    await fetch(`/api/verse-ping/${id}/read`, { method: "POST" }).catch(() => {});
  }

  if (pings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <LivynQuote className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-[13px] text-muted-foreground">Belum ada ayat yang dikirim ke kamu.</p>
        <p className="text-[12px] text-muted-foreground/70">
          Kirim ayat penguat dari halaman Alkitab ke temanmu — mereka akan menerimanya di sini.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {pings.map((p) => {
        const unread = !p.readAt;
        return (
          <li key={p.id}>
            <button
              onClick={() => unread && markRead(p.id)}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition-colors",
                unread ? "border-primary/25 bg-primary/[0.04]" : "border-border-subtle bg-surface",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                    {p.fromUser.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-[13px] font-semibold text-heading">{p.fromUser.name}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{relativeTime(p.createdAt)}</span>
              </div>

              <blockquote className="mt-3 font-display text-[14px] italic leading-[1.6] text-heading">
                &ldquo;{p.verseText}&rdquo;
              </blockquote>
              <p className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-primary">
                <LivynBible className="h-3.5 w-3.5" /> {p.verseRef}
              </p>

              {p.note && (
                <p className="mt-3 rounded-xl bg-surface-muted p-3 text-[13px] leading-relaxed text-foreground/85">
                  {p.note}
                </p>
              )}

              {unread && (
                <span className="mt-3 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Baru
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
