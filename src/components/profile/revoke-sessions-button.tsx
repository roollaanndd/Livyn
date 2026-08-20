"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LivynSpinner, LivynLogOut } from "@/components/icons/livyn-icons";
import { Button } from "@/components/ui/button";

export function RevokeSessionsButton() {
  const [loading, setLoading] = useState(false);

  async function revoke() {
    setLoading(true);
    const res = await fetch("/api/auth/sessions/revoke-all", { method: "POST" });
    setLoading(false);
    if (res.ok) toast.success("Perangkat lain telah dikeluarkan dari akunmu");
    else toast.error("Gagal memproses permintaan");
  }

  return (
    <Button variant="outline" size="sm" onClick={revoke} disabled={loading}>
      {loading ? <LivynSpinner className="h-4 w-4 animate-spin" /> : <LivynLogOut className="h-4 w-4" />}
      Keluar dari Perangkat Lain
    </Button>
  );
}
