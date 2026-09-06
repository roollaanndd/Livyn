"use client";

import { useEffect } from "react";

/**
 * Fades sections in as they enter the viewport.
 *
 * One observer for the whole page rather than a wrapper component per section:
 * the markup stays server-rendered HTML (which is the point of everything below
 * the cinematic — crawlers and link previews read it), and this only adds a
 * class.
 *
 * Everything is visible by default in CSS; the "hidden" state is only applied
 * once this mounts (`data-reveal-ready` on <html>). So with JavaScript off, or
 * before hydration, the page reads normally instead of being a blank column —
 * and `prefers-reduced-motion` skips the whole thing.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (targets.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      for (const el of targets) el.classList.add("is-in");
      return;
    }

    document.documentElement.setAttribute("data-reveal-ready", "");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return null;
}
