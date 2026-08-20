"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LivynSpinner, LivynCrown } from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { TopBar } from "@/components/nav/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ApplyLeaderPage() {
  const router = useRouter();
  const [churchName, setChurchName] = useState("");
  const [position, setPosition] = useState("");
  const [denomination, setDenomination] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/leaders/me");
      const data = await res.json().catch(() => null);
      if (!cancelled && data?.profile) {
        setChurchName(data.profile.churchName ?? "");
        setPosition(data.profile.position ?? "");
        setDenomination(data.profile.denomination ?? "");
        setCity(data.profile.city ?? "");
        setPhone(data.profile.phone ?? "");
        setBio(data.profile.bio ?? "");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/leaders/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchName, position, denomination, city, phone, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal mengirim aplikasi");
        setBusy(false);
        return;
      }
      toast.success("Aplikasi terkirim — admin akan meninjau segera");
      router.replace("/app/pemimpin");
    } catch {
      toast.error("Kesalahan jaringan");
      setBusy(false);
    }
  }

  return (
    <div>
      <TopBar title="Ajukan sebagai Pemimpin" back />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LivynSpinner className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5 px-5 pb-10 pt-2">
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <LivynCrown className="h-4 w-4" />
              <p className="text-[11px] font-bold uppercase tracking-wider">Verifikasi Pemimpin</p>
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Data ini akan direview admin Livyn. Setelah disetujui, kamu dapat badge terverifikasi,
              circle dengan kapasitas 100 anggota, misi mingguan, dan siaran ke seluruh jemaat.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-heading">Nama gereja *</label>
            <Input value={churchName} onChange={(e) => setChurchName(e.target.value)} placeholder="GBI Sudirman" maxLength={100} required />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-heading">Jabatan / posisi *</label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Gembala Sidang / Pemimpin Ibadah Remaja / Pdt." maxLength={80} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-heading">Denominasi</label>
              <Input value={denomination} onChange={(e) => setDenomination(e.target.value)} placeholder="GBI, GKI, dll" maxLength={60} />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-heading">Kota</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jakarta" maxLength={60} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-heading">Nomor HP (untuk kontak admin)</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" maxLength={30} inputMode="tel" />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-heading">Ceritakan sedikit tentang pelayananmu</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Melayani sebagai gembala pemuda sejak 2018, dll."
              maxLength={400}
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[13px] leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LivynSpinner className="h-4 w-4 animate-spin" /> : "Kirim Aplikasi"}
          </Button>
        </form>
      )}
    </div>
  );
}
