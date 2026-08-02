"use client";

import { useEffect, useRef } from "react";
import { mountScrollWorld, type ScrollWorldConfig } from "@/lib/scroll-world/scrub-engine";
import "./scroll-world.css";

/**
 * Mounts the scroll-world engine, which builds its own DOM and injects its own
 * CSS — so this component is just the host element and a lifecycle.
 *
 * The world is mounted once per visit: the config comes from the server and
 * doesn't change while the page is open, and re-mounting would reset the
 * visitor's scroll position mid-flight.
 */
export function ScrollWorld({
  config,
  retireAt,
}: {
  config: ScrollWorldConfig;
  /** Selector for the content that follows. When its top reaches the top of
   *  the viewport the flight retires, handing the screen over. Without it the
   *  flight simply runs to the bottom of its own track. */
  retireAt?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const destroy = mountScrollWorld(node, configRef.current);

    // The engine paints in fixed layers that cover the viewport for the whole
    // flight — sky, stage, copy scrim, route rail, hint. They have no idea
    // anything follows them, so once the flight is over they would sit on top
    // of the page below. `sw-done` retires them at the seam (see
    // scroll-world.css) and comes straight back off on the way up.
    // Measuring the follower rather than the track keeps this exact even
    // though the two deliberately overlap: the engine reserves a trailing
    // viewport so the last clip can finish, and the page below is pulled up
    // over most of it so the seam isn't a screen of nothing.
    const follower = retireAt ? document.querySelector(retireAt) : null;
    const onScroll = () => {
      const reached = follower
        ? follower.getBoundingClientRect().top <= 0
        : window.scrollY >= node.offsetTop + node.offsetHeight - window.innerHeight - 1;
      node.classList.toggle("sw-done", reached);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      destroy?.();
    };
  }, [retireAt]);

  return <div ref={host} />;
}
