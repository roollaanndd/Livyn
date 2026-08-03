"use client";

/** Shared browser-side push plumbing, used by both the settings toggle and the
 * in-app soft prompt so the two can never drift apart. */

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * iOS Safari only exposes Web Push to *installed* PWAs (from iOS 16.4).
 * A user on iPhone Safari-in-browser will see pushSupported() return true
 * but the actual `Notification.requestPermission()` throws or the
 * subscription fails silently. Detect the "iOS but not installed" case so
 * callers can show an "Install to home screen first" message instead of a
 * generic "notifications failed" error.
 */
export function iosNeedsInstall(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  if (!isIos) return false;
  const isStandalone =
    // Modern; Safari sets this on the installed PWA.
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Legacy Safari fallback.
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return !isStandalone;
}

export type SubscribeResult = "subscribed" | "denied" | "unconfigured" | "failed" | "ios-install-required";

export async function subscribeToPush(): Promise<SubscribeResult> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return "unconfigured";
  if (iosNeedsInstall()) return "ios-install-required";

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";

    await navigator.serviceWorker.register("/sw.js").catch(() => {});
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const json = sub.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
    return res.ok ? "subscribed" : "failed";
  } catch {
    return "failed";
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
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
    return true;
  } catch {
    return false;
  }
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}
