"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Item = {
  id: string;
  title: string;
  excerpt?: string;
  description?: string;
  authorName: string;
  categoryName?: string | null;
};

export function ModerationQueue({
  devotions,
  sermons,
}: {
  devotions: Item[];
  sermons: Item[];
}) {
  const [devoList, setDevoList] = useState(devotions);
  const [sermonList, setSermonList] = useState(sermons);

  async function act(kind: "devosi" | "khotbah", id: string, action: "approve" | "reject") {
    let reason: string | undefined;
    if (action === "reject") {
      reason = window.prompt("Alasan penolakan (opsional):") ?? undefined;
    }
    const res = await fetch(`/api/admin/moderasi/${kind}/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    if (!res.ok) {
      toast.error("Gagal memproses");
      return;
    }
    if (kind === "devosi") setDevoList((prev) => prev.filter((d) => d.id !== id));
    else setSermonList((prev) => prev.filter((s) => s.id !== id));
    toast.success(action === "approve" ? "Konten diterbitkan" : "Konten ditolak");
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display mb-3 text-base font-bold">Renungan Menunggu ({devoList.length})</h2>
        <div className="space-y-2">
          {devoList.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada renungan menunggu tinjauan.</p>}
          {devoList.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{d.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{d.excerpt}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.authorName} {d.categoryName && <>· <Badge variant="muted">{d.categoryName}</Badge></>}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => act("devosi", d.id, "approve")}>
                  <Check className="h-3.5 w-3.5" /> Setujui
                </Button>
                <Button size="sm" variant="destructive" onClick={() => act("devosi", d.id, "reject")}>
                  <X className="h-3.5 w-3.5" /> Tolak
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display mb-3 text-base font-bold">Khotbah Menunggu ({sermonList.length})</h2>
        <div className="space-y-2">
          {sermonList.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada khotbah menunggu tinjauan.</p>}
          {sermonList.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="min-w-0">
                <p className="font-semibold">{s.title}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.authorName} {s.categoryName && <>· <Badge variant="muted">{s.categoryName}</Badge></>}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => act("khotbah", s.id, "approve")}>
                  <Check className="h-3.5 w-3.5" /> Setujui
                </Button>
                <Button size="sm" variant="destructive" onClick={() => act("khotbah", s.id, "reject")}>
                  <X className="h-3.5 w-3.5" /> Tolak
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
