"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LivynMark } from "@/components/brand/logo";

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
    <div className="min-h-dvh flex flex-col justify-center px-6 py-10 bg-background">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/masuk" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali ke masuk
        </Link>

        <div className="mb-8 flex flex-col items-center">
          <LivynMark className="h-14 w-14" />
          <h1 className="font-display mt-4 text-2xl font-bold text-center">Lupa Kata Sandi</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Masukkan email akunmu, kami akan kirim tautan untuk atur ulang kata sandi
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center rounded-lg border border-border bg-surface-muted p-6 text-center">
            <MailCheck className="mb-2 h-8 w-8 text-primary" />
            <p className="text-sm text-foreground">
              Jika <span className="font-semibold">{email}</span> terdaftar, tautan atur ulang telah dikirim. Periksa kotak masuk emailmu.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input type="email" required placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Kirim Tautan Reset
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
