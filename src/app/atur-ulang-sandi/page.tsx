"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LivynCheckCircle, LivynSpinner, LivynShieldAlert } from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LivynMark } from "@/components/brand/logo";
import { AuthLayout } from "@/components/auth/auth-layout";

/**
 * Consumes the token from the password-reset email and calls
 * /api/auth/reset-password. On success the user is signed out everywhere
 * (server-side) and sent to /masuk to log in with the new password.
 */
function ResetInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Tautan tidak lengkap. Minta tautan baru dari halaman lupa sandi.");
    }
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirm) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal mengatur ulang kata sandi.");
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.replace("/masuk"), 2500);
    } catch {
      toast.error("Gagal terhubung. Coba lagi.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <LivynCheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="font-display text-xl font-bold">Kata sandi diperbarui</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Kamu akan diarahkan ke halaman masuk. Semua sesi lain di perangkat lain sudah keluar otomatis.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10">
            <LivynShieldAlert className="h-8 w-8 text-warning" />
          </div>
          <h1 className="font-display text-xl font-bold">Tautan tidak lengkap</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Buka tautan dari emailmu, atau minta tautan baru dari halaman lupa sandi.
          </p>
          <Link href="/lupa-sandi" className="text-sm font-semibold text-primary hover:text-primary-hover">
            Minta tautan baru
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3.5">
          <LivynMark className="h-[60px] w-[60px]" gradientId="reset-mark" />
          <div className="text-center">
            <h1 className="font-display text-xl font-bold text-heading">Buat kata sandi baru</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="pw" className="text-sm font-semibold text-heading">
              Kata sandi baru
            </label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pw2" className="text-sm font-semibold text-heading">
              Konfirmasi kata sandi
            </label>
            <Input
              id="pw2"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" size="lg" className="h-[52px] w-full text-[15px] font-bold" disabled={loading}>
            {loading ? <LivynSpinner className="h-5 w-5 animate-spin" /> : "Simpan kata sandi baru"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <div className="flex justify-center py-12">
            <LivynSpinner className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AuthLayout>
      }
    >
      <ResetInner />
    </Suspense>
  );
}
