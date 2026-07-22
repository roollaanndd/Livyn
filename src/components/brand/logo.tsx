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

export function LivynAiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(className)}>
      <defs>
        <linearGradient id="ai-icon-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4CAF7D" />
          <stop offset="100%" stopColor="#2D7D5F" />
        </linearGradient>
        <filter id="ai-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feFlood floodColor="#2D7D5F" floodOpacity="0.35" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#ai-icon-grad)" filter="url(#ai-glow)" />
      <path
        d="M24 12L26.5 19.5L34 17L28.5 23L34 29L26.5 26.5L24 34L21.5 26.5L14 29L19.5 23L14 17L21.5 19.5L24 12Z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="24" cy="23" r="2.5" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
