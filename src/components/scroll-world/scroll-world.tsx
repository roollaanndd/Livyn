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
export function ScrollWorld({ config }: { config: ScrollWorldConfig }) {
  const host = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const destroy = mountScrollWorld(node, configRef.current);
    return () => destroy?.();
  }, []);

  return <div ref={host} />;
}
