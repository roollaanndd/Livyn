"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { LivynMark, LivynWordmark } from "@/components/brand/logo";
import { TryDemoButton } from "@/components/auth/try-demo-button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { cn } from "@/lib/utils";

function usePasswordStrength(password: string) {
  return useMemo(() => {
    const checks = [
      { label: "Min. 8 karakter", met: password.length >= 8 },
      { label: "Huruf besar", met: /[A-Z]/.test(password) },
      { label: "Huruf kecil", met: /[a-z]/.test(password) },
      { label: "Angka", met: /\d/.test(password) },
    ];
    const score = checks.filter((c) => c.met).length;
    return { checks, score };
  }, [password]);
}

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const strength = usePasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error ?? "Gagal mendaftar. Coba lagi nanti.");
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

  const strengthColors = ["bg-error", "bg-error", "bg-warning", "bg-primary", "bg-success"];

  return (
    <AuthLayout>
      <div className="space-y-7">
        {/* Brand header */}
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
            <LivynMark className="relative h-16 w-16" gradientId="register-mark" />
          </div>
          <LivynWordmark className="text-2xl text-heading" />
          <p className="text-sm text-muted-foreground">Buat akun baru</p>
        </motion.div>

        {/* Register form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-heading">Nama</label>
            <Input
              id="name"
              type="text"
              placeholder="Nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-heading">Email</label>
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
            <label htmlFor="password" className="text-sm font-medium text-heading">Kata Sandi</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Buat kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 pt-1"
              >
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-300",
                        i < strength.score ? strengthColors[strength.score] : "bg-border",
                      )}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {strength.checks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5">
                      {check.met ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground/40" />
                      )}
                      <span className={cn("text-[11px]", check.met ? "text-success" : "text-muted-foreground/60")}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Daftar"}
          </Button>
        </motion.form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border-subtle" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
            atau
          </span>
          <span className="h-px flex-1 bg-border-subtle" />
        </div>

        <TryDemoButton className="w-full" />

        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-semibold text-primary hover:text-primary-hover transition-colors">
            Masuk
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
