"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LivynMark } from "@/components/brand/logo";
import { TryDemoButton } from "@/components/auth/try-demo-button";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const RULES = [
  { test: (p: string) => p.length >= 8, label: "Minimal 8 karakter" },
  { test: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p), label: "Huruf besar & kecil" },
  { test: (p: string) => /[0-9]/.test(p), label: "Mengandung angka" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mendaftar");
        return;
      }
      localStorage.setItem("livyn_onboarded", "1");
      await refresh();
      toast.success("Akun berhasil dibuat. Selamat datang di Livyn!");
      router.replace("/app");
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center px-6 py-10 bg-background">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <LivynMark className="h-14 w-14" />
          <h1 className="font-display mt-4 text-2xl font-bold">Mulai Bersama Livyn</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Bangun kebiasaan rohani harianmu, mulai hari ini</p>
        </div>

        <TryDemoButton className="w-full" />
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          atau daftar dengan akun
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nama Lengkap</label>
            <Input required placeholder="Nama kamu" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input type="email" required autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Kata Sandi</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <ul className="mt-2 space-y-1">
                {RULES.map((rule) => {
                  const ok = rule.test(password);
                  return (
                    <li key={rule.label} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-emerald-600" : "text-muted-foreground")}>
                      <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full", ok ? "bg-emerald-500" : "bg-border")}>
                        {ok && <Check className="h-2.5 w-2.5 text-white" />}
                      </span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Buat Akun
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          atau
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" size="lg" className="w-full" type="button" onClick={() => toast.info("Google Login memerlukan kredensial OAuth produksi")}>
          Lanjutkan dengan Google
        </Button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-semibold text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
