"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LivynMark } from "@/components/brand/logo";
import { AuthLayout } from "@/components/auth/auth-layout";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Gagal mengatur ulang kata sandi.");
        return;
      }
      setDone(true);
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi internetmu.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-surface p-6 text-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-soft">
          <ShieldAlert className="h-6 w-6 text-error" />
        </div>
        <p className="text-[13px] text-foreground leading-relaxed">
          Tautan ini tidak lengkap. Minta tautan atur ulang yang baru dari halaman lupa kata sandi.
        </p>
        <Button variant="outline" onClick={() => router.push("/lupa-sandi")}>
          Minta Tautan Baru
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center rounded-2xl border border-border-subtle bg-surface p-6 text-center gap-3"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <p className="text-[13px] text-foreground leading-relaxed">
          Kata sandi berhasil diganti. Semua perangkat yang tadinya masuk sudah dikeluarkan — silakan
          masuk lagi dengan kata sandi barumu.
        </p>
        <Button size="lg" className="w-full" onClick={() => router.push("/masuk")}>
          Masuk Sekarang
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-heading" htmlFor="new-password">
          Kata Sandi Baru
        </label>
        <Input
          id="new-password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-[12px] text-muted-foreground">
          Minimal 8 karakter, dengan huruf besar, huruf kecil, dan angka.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-heading" htmlFor="confirm-password">
          Ulangi Kata Sandi
        </label>
        <Input
          id="confirm-password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Ulangi kata sandi baru"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-error-soft border border-error/20 p-3 text-[13px] text-error">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
        Simpan Kata Sandi Baru
      </Button>
    </motion.form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <div className="space-y-8">
        <Link
          href="/masuk"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke masuk
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            <div className="absolute inset-0 scale-150 blur-2xl">
              <div className="h-full w-full rounded-full bg-primary/10" />
            </div>
            <LivynMark className="relative h-16 w-16" gradientId="reset-mark" />
          </div>
          <h1 className="font-display text-2xl font-bold text-heading text-center">Atur Ulang Kata Sandi</h1>
          <p className="text-[13px] text-center text-muted-foreground max-w-[280px] leading-relaxed">
            Pilih kata sandi baru untuk akunmu
          </p>
        </motion.div>

        {/* useSearchParams needs a Suspense boundary above it. */}
        <Suspense fallback={<div className="h-40" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthLayout>
  );
}
