"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {/* reducedMotion="user" makes every framer-motion animation in the app
          honour the OS "reduce motion" setting — transforms are dropped while
          opacity still cross-fades, so nothing snaps in without warning. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  );
}
