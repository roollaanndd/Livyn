"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Status = "loading" | "unsupported" | "off" | "on";

export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    }
    check().catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    setStatus("loading");
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error("Notifikasi belum dikonfigurasi di server ini");
        setStatus("off");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Izin notifikasi ditolak");
        setStatus("off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      toast.success("Notifikasi diaktifkan");
      setStatus("on");
    } catch {
      toast.error("Gagal mengaktifkan notifikasi");
      setStatus("off");
    }
  }

  async function disable() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      toast.success("Notifikasi dimatikan");
      setStatus("off");
    } catch {
      toast.error("Gagal mematikan notifikasi");
      setStatus("on");
    }
  }

  if (status === "unsupported") {
    return <span className="text-xs text-muted-foreground">Tidak didukung di perangkat ini</span>;
  }

  return (
    <button
      onClick={status === "on" ? disable : enable}
      disabled={status === "loading"}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60",
        status === "on" ? "bg-primary" : "bg-border",
      )}
      aria-label="Aktifkan notifikasi push"
    >
      {status === "loading" ? (
        <Loader2 className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            status === "on" ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      )}
    </button>
  );
}
