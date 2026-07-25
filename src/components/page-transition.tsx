"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { DURATION, EASE_OUT } from "@/lib/motion";

/**
 * Entry animation for a routed page.
 *
 * Keyed on the pathname so it replays on every navigation — as a `template.tsx`
 * child it remounts anyway, but the key makes that explicit and survives if the
 * component is ever moved into a layout.
 *
 * Deliberately short and translation-light: this runs on every single page
 * change, and anything longer than ~250ms starts to feel like latency rather
 * than polish.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.quick, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
