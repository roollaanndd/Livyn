import { cn } from "@/lib/utils";

export function LivynMark({ className, gradientId = "livyn-mark" }: { className?: string; gradientId?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(className)}>
      <defs>
        <linearGradient id={gradientId} x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4CAF7D" />
          <stop offset="50%" stopColor="#2D7D5F" />
          <stop offset="100%" stopColor="#1E5A44" />
        </linearGradient>
        <linearGradient id={`${gradientId}-leaf`} x1="55" y1="70" x2="85" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4CAF7D" />
          <stop offset="100%" stopColor="#C89B3C" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M40 12C40 9.8 41.8 8 44 8H56C58.2 8 60 9.8 60 12V78C60 88 68 96 78 96C80.2 96 82 97.8 82 100V108C82 110.2 80.2 112 78 112C56 112 40 96 40 74V12Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M60 88C64 96 71 103 80 107C82 108 82.5 110.5 81 112.2C79.5 113.8 77 114 75 113C63 107 53 97 48 84C47 81.5 48.5 79 51 78.5L58 77C60 76.5 61.5 78 60 88Z"
        fill={`url(#${gradientId}-leaf)`}
        opacity="0.65"
      />
    </svg>
  );
}

export function LivynWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-extrabold tracking-tight", className)}>
      LIVYN
    </span>
  );
}

export function LivynLogo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "gap-1.5", md: "gap-2", lg: "gap-3" };
  const marks = { sm: "h-7 w-7", md: "h-10 w-10", lg: "h-14 w-14" };
  const texts = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" };

  return (
    <div className={cn("flex items-center", sizes[size], className)}>
      <LivynMark className={marks[size]} gradientId={`livyn-logo-${size}`} />
      <LivynWordmark className={texts[size]} />
    </div>
  );
}

/**
 * AI Pastor mark: a cross whose foot flows into the Livyn leaf.
 *
 * The previous icon was a generic AI sparkle inside its own green circle —
 * nothing Christian about it, and since every place it appears already sits
 * inside a green gradient tile, it painted a green badge on a green badge.
 *
 * This draws the glyph alone in `currentColor` so the tile behind it shows
 * through. The silhouette is deliberately heavy: it has to stay legible at
 * 18px in the journal card and 28px in the nav, where thin strokes and
 * radiating detail turn to mush.
 */
export function LivynAiIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-white", className)}
      aria-hidden="true"
    >
      <path
        d="M20.3 9.5a3.7 3.7 0 0 1 7.4 0v7.2h6.9a3.5 3.5 0 0 1 0 7h-6.9v9.7c0 3 2.3 5.4 5.4 5.7a2.2 2.2 0 0 1-.3 4.4C25.5 43.3 20.3 38 20.3 31.4V23.7h-6.9a3.5 3.5 0 0 1 0-7h6.9z"
        fill="currentColor"
      />
      {/* The leaf curl carried over from the Livyn mark. */}
      <path
        d="M26.6 31.4c1.6 3.6 4.5 6.6 8.4 8.3 1.2.5 1.3 2.2.2 2.9-1 .6-2.3.5-3.3-.1-4.8-3-8.3-7.3-10-12.1-.4-1.1.3-2.3 1.5-2.4l3-.4c1-.1 1.4.5 1.2 3.8z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}
