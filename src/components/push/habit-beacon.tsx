"use client";

import { useEffect } from "react";

const STORAGE_KEY = "livyn:habit-hour";

/** Fires once per clock hour per device to record when this member actually
 * uses Livyn. Renders nothing; the throttle key means navigating around the
 * app doesn't inflate the histogram. */
export function HabitBeacon() {
  useEffect(() => {
    const bucket = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    try {
      if (localStorage.getItem(STORAGE_KEY) === bucket) return;
      localStorage.setItem(STORAGE_KEY, bucket);
    } catch {
      return; // private mode with storage disabled — skip rather than spam
    }
    fetch("/api/habit", { method: "POST", keepalive: true }).catch(() => {});
  }, []);

  return null;
}
