"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LivynSpinner, LivynKey } from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { TopBar } from "@/components/nav/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinCirclePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/circles/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal gabung");
        setBusy(false);
        return;
      }
      if (data.alreadyMember) {
        toast.info("Kamu sudah menjadi anggota");
      } else {
        toast.success(`Selamat datang di ${data.circle?.name ?? "circle"}!`);
      }
      router.replace(`/app/circle/${data.circle.id}`);
    } catch {
      toast.error("Kesalahan jaringan");
      setBusy(false);
    }
  }

  return (
    <div>
      <TopBar title="Gabung Circle" back />
      <div className="px-5 pb-10 pt-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <LivynKey className="h-7 w-7" />
        </div>

        <div className="mx-auto max-w-sm text-center">
          <h1 className="font-display text-[20px] font-extrabold text-heading">Masukkan Kode Circle</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Kode diberikan oleh pemimpin circle — biasanya di warta jemaat atau lewat teman.
          </p>
        </div>

        <form onSubmit={submit} className="mx-auto mt-8 max-w-sm space-y-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD-1234"
            maxLength={12}
            className="text-center font-display text-[22px] font-extrabold uppercase tracking-[0.25em]"
            required
          />
          <Button type="submit" size="lg" className="w-full" disabled={busy || !code.trim()}>
            {busy ? <LivynSpinner className="h-4 w-4 animate-spin" /> : "Gabung"}
          </Button>
        </form>
      </div>
    </div>
  );
}
