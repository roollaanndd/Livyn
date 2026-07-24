"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Phone, MapPin, Crown } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Application = {
  id: string;
  churchName: string;
  position: string;
  denomination: string | null;
  city: string | null;
  phone: string | null;
  bio: string | null;
  submittedAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
};

export function LeaderReviewPanel({ applications: initial }: { applications: Application[] }) {
  const [apps, setApps] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(app: Application, action: "approve" | "reject") {
    let reason: string | undefined;
    if (action === "reject") {
      const r = window.prompt("Alasan penolakan (untuk pemohon):");
      if (r === null) return;
      reason = r;
    }
    setBusy(app.id);
    const res = await fetch(`/api/admin/leaders/${app.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Gagal");
      return;
    }
    setApps((prev) => prev.filter((a) => a.id !== app.id));
    toast.success(action === "approve" ? "Disetujui — role leader diaktifkan" : "Ditolak");
  }

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <Crown className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
        <p className="text-[13px] text-muted-foreground">Tidak ada aplikasi pemimpin yang menunggu.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {apps.map((app) => (
        <li key={app.id}>
          <Card className="p-5">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-[13px] font-bold text-primary">
                {app.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-extrabold text-heading">{app.user.name}</p>
                <p className="text-[12px] text-muted-foreground">{app.user.email}</p>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {new Date(app.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </span>
            </div>

            <div className="space-y-2 rounded-xl bg-surface-muted p-4 text-[13px]">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Gereja & Jabatan</p>
                <p className="mt-0.5 font-semibold text-heading">
                  {app.position} · {app.churchName}
                </p>
              </div>
              {(app.denomination || app.city) && (
                <div className="flex flex-wrap gap-3 text-[12.5px] text-muted-foreground">
                  {app.denomination && (
                    <span className="inline-flex items-center gap-1">
                      <Crown className="h-3 w-3" /> {app.denomination}
                    </span>
                  )}
                  {app.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {app.city}
                    </span>
                  )}
                </div>
              )}
              {app.phone && (
                <p className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
                  <Phone className="h-3 w-3" /> {app.phone}
                </p>
              )}
              {app.bio && <p className="pt-1 text-[13px] italic leading-relaxed text-foreground/85">{app.bio}</p>}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => decide(app, "approve")}
                disabled={busy === app.id}
                className="flex-1"
              >
                {busy === app.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Setujui
              </Button>
              <Button
                onClick={() => decide(app, "reject")}
                variant="outline"
                disabled={busy === app.id}
                className="flex-1"
              >
                <XCircle className="h-4 w-4" />
                Tolak
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
