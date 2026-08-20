"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LivynSpinner, LivynSpark } from "@/components/icons/livyn-icons";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export function TryDemoButton({ variant = "secondary", className }: { variant?: ButtonProps["variant"]; className?: string }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);

  async function tryDemo() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal masuk ke akun demo. Coba lagi nanti.");
        return;
      }
      localStorage.setItem("livyn_onboarded", "1");
      await refresh();
      toast.success("Selamat datang di demo Livyn!");
      router.replace("/app");
    } catch {
      toast.error("Terjadi kesalahan jaringan. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} size="lg" className={className} onClick={tryDemo} disabled={loading}>
      {loading ? <LivynSpinner className="h-4 w-4 animate-spin" /> : <LivynSpark className="h-4 w-4" />}
      Coba Sekarang Tanpa Akun
    </Button>
  );
}
