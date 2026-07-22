"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LivynMark } from "@/components/brand/logo";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

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
            <LivynMark className="relative h-16 w-16" gradientId="forgot-mark" />
          </div>
          <h1 className="font-display text-2xl font-bold text-heading text-center">Lupa Kata Sandi</h1>
          <p className="text-[13px] text-center text-muted-foreground max-w-[280px] leading-relaxed">
            Masukkan email akunmu, kami akan kirim tautan untuk atur ulang kata sandi
          </p>
        </motion.div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center rounded-2xl border border-border-subtle bg-surface p-6 text-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft">
              <MailCheck className="h-6 w-6 text-success" />
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">
              Jika <span className="font-semibold">{email}</span> terdaftar, tautan atur ulang telah dikirim. Periksa kotak masuk emailmu.
            </p>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-heading">Email</label>
              <Input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
              Kirim Tautan Reset
            </Button>
          </motion.form>
        )}
      </div>
    </AuthLayout>
  );
}
