import { cn } from "@/lib/utils";

export function LivynMark({ className, gradientId = "livyn-mark" }: { className?: string; gradientId?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(className)}>
      <defs>
        <linearGradient id={gradientId} x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6C5CE7" />
        </linearGradient>
      </defs>
      <path
        d="M40 12C40 9.8 41.8 8 44 8H56C58.2 8 60 9.8 60 12V78C60 88 68 96 78 96C80.2 96 82 97.8 82 100V108C82 110.2 80.2 112 78 112C56 112 40 96 40 74V12Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M60 88C64 96 71 103 80 107C82 108 82.5 110.5 81 112.2C79.5 113.8 77 114 75 113C63 107 53 97 48 84C47 81.5 48.5 79 51 78.5L58 77C60 76.5 61.5 78 60 88Z"
        fill={`url(#${gradientId})`}
        opacity="0.55"
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
