"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LivynSpinner, LivynEye, LivynEyeOff, LivynSpark } from "@/components/icons/livyn-icons";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { LivynMark, LivynWordmark } from "@/components/brand/logo";
import { TryDemoButton } from "@/components/auth/try-demo-button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { staggerChild, TAP } from "@/lib/motion";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error ?? "Gagal masuk. Coba lagi nanti.");
        setLoading(false);
        return;
      }

      await refresh();
      router.replace("/app");
    } catch {
      toast.error("Terjadi kesalahan jaringan. Periksa koneksi internet Anda.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Brand header */}
        <motion.div variants={staggerChild} className="flex flex-col items-center gap-3.5">
          <div className="relative">
            <motion.div
              className="absolute inset-0 scale-[1.9] rounded-full bg-primary/15 blur-3xl"
              animate={{ opacity: [0.6, 1, 0.6], scale: [1.8, 2, 1.8] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <LivynMark className="relative h-[68px] w-[68px]" gradientId="login-mark" />
          </div>
          <div className="text-center">
            <LivynWordmark className="text-[26px] text-heading" />
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Selamat datang kembali
            </p>
          </div>
        </motion.div>

        {/* Demo access — the fastest way in, so it leads */}
        <motion.div
          variants={staggerChild}
          className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.10] via-primary/[0.05] to-accent/[0.06] p-3.5"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <LivynSpark className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[13.5px] font-extrabold leading-tight text-heading">
                Baru pertama kali di Livyn?
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                Coba semua fitur tanpa daftar.
              </p>
            </div>
          </div>
          <TryDemoButton variant="primary" className="mt-3 h-11 w-full text-[14px] font-bold shadow-sm" />
        </motion.div>

        {/* Divider */}
        <motion.div variants={staggerChild} className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border-subtle" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
            atau masuk
          </span>
          <span className="h-px flex-1 bg-border-subtle" />
        </motion.div>

        {/* Login form */}
        <motion.form
          onSubmit={handleSubmit}
          variants={staggerChild}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-heading">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-heading">
                Kata Sandi
              </label>
              <Link href="/lupa-sandi" className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
                Lupa sandi?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <LivynEyeOff className="h-4.5 w-4.5" /> : <LivynEye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <motion.div whileTap={loading ? undefined : TAP}>
            <Button type="submit" className="h-[52px] w-full text-[15px] font-bold" size="lg" disabled={loading}>
              {loading ? <LivynSpinner className="h-5 w-5 animate-spin" /> : "Masuk"}
            </Button>
          </motion.div>
        </motion.form>

        {/* Sign up link */}
        <motion.p variants={staggerChild} className="text-center text-[13.5px] text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-bold text-primary transition-colors hover:text-primary-hover">
            Daftar
          </Link>
        </motion.p>
      </div>
    </AuthLayout>
  );
}
