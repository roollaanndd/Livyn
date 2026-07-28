"use client";

import { useEffect } from "react";

/** Marks one habit as done for today, once per device per day. Rendered inside
 * the thing it measures — the verse hero, the devotion reader — so "done" means
 * the member actually saw it, not merely that they opened the app. */
export function ActivityBeacon({ kind }: { kind: "verse" | "devotion" }) {
  useEffect(() => {
    const day = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const storageKey = `livyn:activity:${kind}`;
    try {
      if (localStorage.getItem(storageKey) === day) return;
      localStorage.setItem(storageKey, day);
    } catch {
      return;
    }
    fetch("/api/aktivitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
      keepalive: true,
    }).catch(() => {});
  }, [kind]);

  return null;
}
