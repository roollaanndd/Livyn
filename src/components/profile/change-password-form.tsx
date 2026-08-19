"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LivynSpinner, LivynKey } from "@/components/icons/livyn-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * In-app password change form. Sits under Profil > Keamanan.
 * Requires the current password (same-device unattended-session guard).
 * On success, the server revokes every other refresh token for the user.
 */
export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (next !== confirm) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal mengganti kata sandi.");
        return;
      }
      toast.success("Kata sandi diperbarui. Sesi di perangkat lain sudah keluar.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      toast.error("Gagal terhubung.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mb-5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <LivynKey className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold text-heading">Ganti kata sandi</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Sesi di perangkat lain akan otomatis keluar setelah ganti kata sandi.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          type="password"
          placeholder="Kata sandi saat ini"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Input
          type="password"
          placeholder="Kata sandi baru (min. 8 karakter)"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Input
          type="password"
          placeholder="Konfirmasi kata sandi baru"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Button type="submit" className="w-full" disabled={loading || !current || !next || !confirm}>
          {loading && <LivynSpinner className="h-4 w-4 animate-spin" />}
          Simpan kata sandi baru
        </Button>
      </form>
    </Card>
  );
}
