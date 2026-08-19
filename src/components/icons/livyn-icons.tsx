import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({
  size = 24,
  className,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      {...baseProps}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/**
 * LIVYN ICON FAMILY
 *
 * Design language:
 * - Organic rounded geometry
 * - Quiet / contemplative
 * - Slightly human, never mechanical
 * - Consistent 1.8px stroke
 * - Designed specifically for Livyn
 *
 * Every glyph lives inside the same optical box (roughly 4.5 → 19.5 of a
 * 24×24 grid) so a 16px badge and a 32px hero icon carry the same weight.
 * Nothing here hard-codes a colour: the stroke is always `currentColor`, so
 * an icon takes the colour of whatever it sits in.
 *
 *   <LivynBible className="h-5 w-5 text-[#2D7D5F]" />
 *   <LivynPrayer size={28} className="text-white" />
 */

/* ------------------------------------------------------------------ *
 * Faith & practice
 * ------------------------------------------------------------------ */

export function LivynBible(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 4.5h9.8a3.2 3.2 0 0 1 3.2 3.2v11.8H8.7a3.2 3.2 0 0 1-3.2-3.2V4.5Z" />
      <path d="M8.7 19.5V7.7a3.2 3.2 0 0 1 3.2-3.2" />
      <path d="M12.5 9.2v5.1M10 11.75h5" />
    </Icon>
  );
}

export function LivynPrayer(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.2 11.2c-1.4-1.8-2-3.5-1.2-4.5.7-.9 1.9-.7 2.8.3l2.3 2.5" />
      <path d="M16.8 11.2c1.4-1.8 2-3.5 1.2-4.5-.7-.9-1.9-.7-2.8.3l-2.3 2.5" />
      <path d="M9.4 10.1c.9 2 1.8 3.3 2.6 4 .8-.7 1.7-2 2.6-4" />
      <path d="M8.2 14.1c-.8 1.2-1.1 2.6-.7 3.8.5 1.6 2.1 2.7 4.5 2.7s4-1.1 4.5-2.7c.4-1.2.1-2.6-.7-3.8" />
      <path d="M12 4.2v2" />
    </Icon>
  );
}

export function LivynJournal(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 4.5h11.5a1.5 1.5 0 0 1 1.5 1.5v12.8a1.2 1.2 0 0 1-1.2 1.2H7.2A2.2 2.2 0 0 1 5 17.8V5.5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 8h6.5M8.5 11.5h6.5M8.5 15h4" />
      <path d="M5 17.5c0 1.4 1 2.5 2.4 2.5" />
    </Icon>
  );
}

export function LivynSermon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 18.5V7.8a2.8 2.8 0 0 1 2.8-2.8h8.4A.8.8 0 0 1 18 5.8v12.7" />
      <path d="M6 18.5c0-1.1.9-2 2-2h10" />
      <path d="M10 9.2v4.2l3.5-2.1L10 9.2Z" />
    </Icon>
  );
}

export function LivynBell(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.2 16.5h11.6c-.9-1.1-1.5-2.5-1.5-4.1V10a4.3 4.3 0 0 0-8.6 0v2.4c0 1.6-.6 3-1.5 4.1Z" />
      <path d="M9.8 19.2c.5.5 1.3.8 2.2.8s1.7-.3 2.2-.8" />
      <path d="M12 4.2v1.2" />
    </Icon>
  );
}

export function LivynCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M9 12.2c.9 1 1.9 1.5 3 1.5s2.1-.5 3-1.5" />
      <circle cx="9.2" cy="9.5" r=".7" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="9.5" r=".7" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function LivynPeople(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="2.5" />
      <circle cx="16.2" cy="9.5" r="2" />
      <path d="M4.8 18.5c.4-3 2-4.5 4.2-4.5s3.8 1.5 4.2 4.5" />
      <path d="M14 14.8c2.7-.1 4.5 1.2 5.1 3.7" />
    </Icon>
  );
}

export function LivynHeart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19.3S4.8 15.2 4.8 9.8c0-2.3 1.5-3.8 3.5-3.8 1.6 0 2.9.9 3.7 2.2.8-1.3 2.1-2.2 3.7-2.2 2 0 3.5 1.5 3.5 3.8 0 5.4-7.2 9.5-7.2 9.5Z" />
    </Icon>
  );
}

export function LivynLeaf(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.2 4.8C11.5 5.1 6.2 8.1 6.2 13.2c0 3.3 2.5 5.7 5.7 5.7 5.1 0 7.1-5.3 7.3-14.1Z" />
      <path d="M5.1 19.8c2.4-3.6 5.3-6.2 9.2-8.7" />
    </Icon>
  );
}

export function LivynSpark(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5c.5 4.8 2.7 7 7.5 7.5-4.8.5-7 2.7-7.5 7.5-.5-4.8-2.7-7-7.5-7.5 4.8-.5 7-2.7 7.5-7.5Z" />
    </Icon>
  );
}

export function LivynTarget(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function LivynCalendar(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="5.5" width="15" height="14" rx="2" />
      <path d="M8 3.8v3.4M16 3.8v3.4M4.5 9h15" />
      <path d="M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01M8.5 16h.01M12 16h.01" />
    </Icon>
  );
}

export function LivynHome(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4.8 10.7 7.2-6 7.2 6" />
      <path d="M6.5 9.5v9.2h11V9.5" />
      <path d="M9.5 18.7v-5h5v5" />
    </Icon>
  );
}

export function LivynProfile(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 19.2c.6-3.3 2.8-5 6.5-5s5.9 1.7 6.5 5" />
    </Icon>
  );
}

export function LivynSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="5.8" />
      <path d="m15.2 15.2 4.3 4.3" />
    </Icon>
  );
}

export function LivynChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 5 7 7-7 7" />
    </Icon>
  );
}

export function LivynCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5.5 12.5 4.2 4.2L18.8 7.7" />
    </Icon>
  );
}

export function LivynClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ *
 * Scripture & reading
 * ------------------------------------------------------------------ */

/** An open book with text — the daily devotion, read rather than shelved. */
export function LivynDevotion(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 7.2C10.6 5.7 8.6 5 5.8 5A.8.8 0 0 0 5 5.8v10.4c0 .5.4.8.8.8 2.8 0 4.8.7 6.2 2.2 1.4-1.5 3.4-2.2 6.2-2.2.5 0 .8-.3.8-.8V5.8a.8.8 0 0 0-.8-.8c-2.8 0-4.8.7-6.2 2.2Z" />
      <path d="M12 7.2v12" />
      <path d="M7.8 9.4h1.6M7.8 12.4h1.6M14.6 9.4h1.6M14.6 12.4h1.6" />
    </Icon>
  );
}

/** Open book with a finished mark — a reading plan being kept. */
export function LivynReadingPlan(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 7.2C10.6 5.7 8.6 5 5.8 5A.8.8 0 0 0 5 5.8v10.4c0 .5.4.8.8.8 2.8 0 4.8.7 6.2 2.2" />
      <path d="M12 7.2c1.1-1.2 2.6-1.9 4.6-2.1" />
      <path d="M12 19.2V7.2" />
      <path d="m13.8 13.6 2 2 4-4.2" />
    </Icon>
  );
}

export function LivynBookmark(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.8 5.8a1.3 1.3 0 0 1 1.3-1.3h7.8a1.3 1.3 0 0 1 1.3 1.3v13.7L12 15.9l-5.2 3.6V5.8Z" />
    </Icon>
  );
}

export function LivynBookmarkCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.8 5.8a1.3 1.3 0 0 1 1.3-1.3h7.8a1.3 1.3 0 0 1 1.3 1.3v13.7L12 15.9l-5.2 3.6V5.8Z" />
      <path d="m9.7 9.8 1.7 1.7 3.2-3.4" />
    </Icon>
  );
}

/** A long document — terms, a policy, a transcript. */
export function LivynScroll(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 6.9A1.9 1.9 0 0 1 7.4 5h9.2a1.9 1.9 0 0 1 1.9 1.9v9.6a2.5 2.5 0 0 1-2.5 2.5H8a2.5 2.5 0 0 1-2.5-2.5V6.9Z" />
      <path d="M8.7 8.8h6.6M8.7 12h6.6M8.7 15.2h4" />
    </Icon>
  );
}

export function LivynFileText(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.6 4.5H8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8.9L13.6 4.5Z" />
      <path d="M13.4 4.6v3.4a1 1 0 0 0 1 1H18" />
      <path d="M9 13h6M9 16h4" />
    </Icon>
  );
}

export function LivynFileEdit(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 10.4V8.9L13.6 4.5H8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2.4" />
      <path d="M13.4 4.6v3.4a1 1 0 0 0 1 1H18" />
      <path d="M17.2 12.6a1.6 1.6 0 0 1 2.2 2.2l-4.2 4.2-2.8.6.6-2.8 4.2-4.2Z" />
    </Icon>
  );
}

/** A quoted verse passed between people. */
export function LivynQuote(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 7.7a2.2 2.2 0 0 1 2.2-2.2h8.6a2.2 2.2 0 0 1 2.2 2.2v5.6a2.2 2.2 0 0 1-2.2 2.2h-5l-4 3.1v-3.1H7.7a2.2 2.2 0 0 1-2.2-2.2V7.7Z" />
      <path d="M8.8 9.4h2v2c0 .9-.5 1.6-1.4 2" />
      <path d="M13.4 9.4h2v2c0 .9-.5 1.6-1.4 2" />
    </Icon>
  );
}

export function LivynHighlight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15.2 4.9 3.9 3.9-7.5 7.5H7.7v-3.9l7.5-7.5Z" />
      <path d="M5 19.8h14" />
    </Icon>
  );
}

export function LivynNote(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 6.7A2.2 2.2 0 0 1 7.2 4.5h9.6A2.2 2.2 0 0 1 19 6.7v6.6l-5.7 6.2H7.2A2.2 2.2 0 0 1 5 17.3V6.7Z" />
      <path d="M19 13.3h-3.5a2.2 2.2 0 0 0-2.2 2.2v4" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ *
 * Rhythm & time
 * ------------------------------------------------------------------ */

export function LivynClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.6" />
      <path d="M12 7.7V12l3 1.8" />
    </Icon>
  );
}

/** A gentle alarm — the prayer reminder, not a klaxon. */
export function LivynAlarm(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="13" r="6.4" />
      <path d="M12 9.8V13l2.3 1.4" />
      <path d="M5.9 5.1 4.2 6.9M18.1 5.1l1.7 1.8" />
      <path d="m7.7 18.6-1.3 1.5M16.3 18.6l1.3 1.5" />
    </Icon>
  );
}

export function LivynBellRing(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.8 16.4h10.4c-.8-1.1-1.3-2.4-1.3-3.9v-2.2a3.9 3.9 0 0 0-7.8 0v2.2c0 1.5-.5 2.8-1.3 3.9Z" />
      <path d="M10.1 18.9c.5.5 1.2.8 1.9.8s1.4-.3 1.9-.8" />
      <path d="M4.6 9a5.6 5.6 0 0 1 1.9-3.5M19.4 9a5.6 5.6 0 0 0-1.9-3.5" />
    </Icon>
  );
}

/** The streak flame — warmth, not fire. */
export function LivynFlame(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12.6 4.2c.4 3.1 4.6 4 4.6 8.5a5.2 5.2 0 0 1-10.4 0c0-2.5 1.6-3.9 2.6-5.7.5 1 1 1.6 1.7 2 .8-1.3 1.3-3 1.5-4.8Z" />
      <path d="M12 17.2a2 2 0 0 1-2-2c0-1.2 1-1.7 2-3 1 1.3 2 1.8 2 3a2 2 0 0 1-2 2Z" />
    </Icon>
  );
}

export function LivynSunrise(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.6v3" />
      <path d="m6.7 8 1.8 1.8M17.3 8l-1.8 1.8" />
      <path d="M7.6 15.2a4.4 4.4 0 0 1 8.8 0" />
      <path d="M4.6 15.2h1.4M18 15.2h1.4" />
      <path d="M5 19.2h14" />
    </Icon>
  );
}

export function LivynSun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3.8v1.9M12 18.3v1.9M3.8 12h1.9M18.3 12h1.9" />
      <path d="m6.1 6.1 1.4 1.4M16.5 16.5l1.4 1.4M6.1 17.9l1.4-1.4M16.5 7.5l1.4-1.4" />
    </Icon>
  );
}

export function LivynMoon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.4 14.3A7.9 7.9 0 0 1 9.7 4.6a7.9 7.9 0 1 0 9.7 9.7Z" />
    </Icon>
  );
}

export function LivynMoonStar(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18.4 14.9A7.4 7.4 0 0 1 9.1 5.6a7.4 7.4 0 1 0 9.3 9.3Z" />
      <path d="M17.4 3.2c.3 1.7.9 2.4 2.6 2.7-1.7.3-2.3.9-2.6 2.6-.3-1.7-.9-2.3-2.6-2.6 1.7-.3 2.3-1 2.6-2.7Z" />
    </Icon>
  );
}

/** Follows the system theme. */
export function LivynMonitor(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.2" y="5" width="15.6" height="11" rx="2.2" />
      <path d="M9 19.6h6M12 16v3.6" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ *
 * Growth & encouragement
 * ------------------------------------------------------------------ */

export function LivynCrown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5.4 16.6-1-8.2c-.1-.8.9-1.3 1.5-.8l3.1 2.6a.9.9 0 0 0 1.3-.2l2-3.1a.9.9 0 0 1 1.5 0l2 3.1a.9.9 0 0 0 1.3.2l3.1-2.6c.6-.5 1.6 0 1.5.8l-1 8.2H5.4Z" />
      <path d="M6 19.4h12" />
    </Icon>
  );
}

export function LivynTrophy(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4.8h8v5.4a4 4 0 0 1-8 0V4.8Z" />
      <path d="M8 6.6H5.9a1 1 0 0 0-1 1c0 2 1.5 3.6 3.2 3.8" />
      <path d="M16 6.6h2.1a1 1 0 0 1 1 1c0 2-1.5 3.6-3.2 3.8" />
      <path d="M12 14.3v3" />
      <path d="M8.6 19.4c0-1.2.9-2.1 2-2.1h2.8c1.1 0 2 .9 2 2.1H8.6Z" />
    </Icon>
  );
}

export function LivynClipboardCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.2 5.7H7.7a1.8 1.8 0 0 0-1.8 1.8v10.2a1.8 1.8 0 0 0 1.8 1.8h8.6a1.8 1.8 0 0 0 1.8-1.8V7.5a1.8 1.8 0 0 0-1.8-1.8h-1.5" />
      <rect x="9.2" y="4" width="5.6" height="3.4" rx="1.2" />
      <path d="m9.5 13.4 1.9 1.9 3.4-3.6" />
    </Icon>
  );
}

export function LivynClipboardList(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.2 5.7H7.7a1.8 1.8 0 0 0-1.8 1.8v10.2a1.8 1.8 0 0 0 1.8 1.8h8.6a1.8 1.8 0 0 0 1.8-1.8V7.5a1.8 1.8 0 0 0-1.8-1.8h-1.5" />
      <rect x="9.2" y="4" width="5.6" height="3.4" rx="1.2" />
      <path d="M9.2 11.6h5.6M9.2 14.9h3.6" />
    </Icon>
  );
}

export function LivynDashboard(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.6" y="4.6" width="6.2" height="6.8" rx="1.8" />
      <rect x="13.2" y="4.6" width="6.2" height="4.4" rx="1.8" />
      <rect x="4.6" y="13.8" width="6.2" height="5.6" rx="1.8" />
      <rect x="13.2" y="11.4" width="6.2" height="8" rx="1.8" />
    </Icon>
  );
}

export function LivynCompass(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.6" />
      <path d="m15.4 8.6-1.8 4.8-4.8 1.8 1.8-4.8 4.8-1.8Z" />
    </Icon>
  );
}

export function LivynFlag(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.2 19.6V5" />
      <path d="M6.2 5.6c3.8-1.8 7.6 1.8 11.4 0v7.6c-3.8 1.8-7.6-1.8-11.4 0V5.6Z" />
    </Icon>
  );
}

export function LivynMapPin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.2s6.2-4.9 6.2-9.6a6.2 6.2 0 1 0-12.4 0c0 4.7 6.2 9.6 6.2 9.6Z" />
      <circle cx="12" cy="10.4" r="2.3" />
    </Icon>
  );
}

export function LivynTag(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11.4 4.8H6.6a1.8 1.8 0 0 0-1.8 1.8v4.8c0 .5.2.9.5 1.3l6.6 6.6a1.8 1.8 0 0 0 2.5 0l4.5-4.5a1.8 1.8 0 0 0 0-2.5l-6.6-6.6a1.8 1.8 0 0 0-1.3-.5Z" />
      <circle cx="8.9" cy="8.9" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function LivynTags(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.6 4.8H6.3a1.6 1.6 0 0 0-1.6 1.6v3.3c0 .4.2.8.5 1.1l5.6 5.6a1.6 1.6 0 0 0 2.3 0l3.3-3.3a1.6 1.6 0 0 0 0-2.3l-5.6-5.6a1.6 1.6 0 0 0-1.2-.4Z" />
      <circle cx="8" cy="8.1" r="1" fill="currentColor" stroke="none" />
      <path d="m14.2 5.6 4.6 4.6a1.9 1.9 0 0 1 0 2.7l-3.9 3.9" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ *
 * Media
 * ------------------------------------------------------------------ */

export function LivynPlay(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.6" />
      <path d="M10.4 9.2v5.6l4.6-2.8-4.6-2.8Z" />
    </Icon>
  );
}

export function LivynHeadphones(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 14.2v-2a7 7 0 0 1 14 0v2" />
      <path d="M5 13.6h1.7a1.6 1.6 0 0 1 1.6 1.6v2.3a1.6 1.6 0 0 1-1.6 1.6h-.1A1.6 1.6 0 0 1 5 17.5v-3.9Z" />
      <path d="M19 13.6h-1.7a1.6 1.6 0 0 0-1.6 1.6v2.3a1.6 1.6 0 0 0 1.6 1.6h.1a1.6 1.6 0 0 0 1.6-1.6v-3.9Z" />
    </Icon>
  );
}

export function LivynImage(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="5" width="15" height="14" rx="2.4" />
      <circle cx="9.3" cy="9.8" r="1.3" />
      <path d="m4.9 16.8 3.9-3.7a1.7 1.7 0 0 1 2.3 0l3.4 3.3" />
      <path d="m13 15.4 1.6-1.6a1.7 1.7 0 0 1 2.3 0l2.2 2.1" />
    </Icon>
  );
}

export function LivynMegaphone(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 10.4 18 5.6v12.8L7 13.6v-3.2Z" />
      <path d="M7 10.4h-.9a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6H7" />
      <path d="M9.7 14.5v2.7a2.2 2.2 0 0 0 2.2 2.2 1.7 1.7 0 0 0 1.7-1.7v-1.6" />
      <path d="M19.9 10.2a2.8 2.8 0 0 1 0 3.6" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

export function LivynPlus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Icon>
  );
}

export function LivynTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.8 7.4h12.4" />
      <path d="M9.6 7.4V6a1.5 1.5 0 0 1 1.5-1.5h1.8A1.5 1.5 0 0 1 14.4 6v1.4" />
      <path d="m7.1 7.4.8 10.2a1.9 1.9 0 0 0 1.9 1.8h4.4a1.9 1.9 0 0 0 1.9-1.8l.8-10.2" />
      <path d="M10.5 11v4.6M13.5 11v4.6" />
    </Icon>
  );
}

export function LivynShare(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="17.4" cy="6.3" r="2.3" />
      <circle cx="6.6" cy="12" r="2.3" />
      <circle cx="17.4" cy="17.7" r="2.3" />
      <path d="m8.6 10.9 6.8-3.5M8.6 13.1l6.8 3.5" />
    </Icon>
  );
}

/**
 * The system share sheet — an arrow leaving a tray. Distinct from
 * `LivynShare`, which is a link passed between people: this one names the
 * platform button (iOS Safari's, say) that a user is being told to tap.
 */
export function LivynShareUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.6v10" />
      <path d="m8.5 7.9 3.5-3.3 3.5 3.3" />
      <path d="M6.6 11.2h-.5a1.6 1.6 0 0 0-1.6 1.6v5.1a1.6 1.6 0 0 0 1.6 1.6h11.8a1.6 1.6 0 0 0 1.6-1.6v-5.1a1.6 1.6 0 0 0-1.6-1.6h-.5" />
    </Icon>
  );
}

export function LivynSend(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.4 4.6 4.9 9.9c-.9.3-.9 1.6 0 1.9l5.6 1.7 1.7 5.6c.3.9 1.6.9 1.9 0L19.4 4.6Z" />
      <path d="m19.4 4.6-8.9 8.9" />
    </Icon>
  );
}

export function LivynDownload(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.6v9.8" />
      <path d="m8.2 10.8 3.8 3.8 3.8-3.8" />
      <path d="M5.5 16.2v1.3a1.9 1.9 0 0 0 1.9 1.9h9.2a1.9 1.9 0 0 0 1.9-1.9v-1.3" />
    </Icon>
  );
}

export function LivynCopy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="10.5" height="10.5" rx="2.4" />
      <path d="M15 9V6.9a2.4 2.4 0 0 0-2.4-2.4H6.9A2.4 2.4 0 0 0 4.5 6.9v5.7A2.4 2.4 0 0 0 6.9 15H9" />
    </Icon>
  );
}

export function LivynSave(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 6.5a2 2 0 0 1 2-2h8.1l3.9 3.9v9.1a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-11Z" />
      <path d="M8.6 4.5v4.2h6V4.5" />
      <path d="M8.6 19.5v-4.8h6.8v4.8" />
    </Icon>
  );
}

export function LivynPen(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.8 19.4h14.4" />
      <path d="M15.9 4.9a1.9 1.9 0 0 1 2.7 2.7l-8.3 8.3-3.6.9.9-3.6 8.3-8.3Z" />
    </Icon>
  );
}

export function LivynEye(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.2 12s3.4-5.8 8.8-5.8S20.8 12 20.8 12s-3.4 5.8-8.8 5.8S3.2 12 3.2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </Icon>
  );
}

export function LivynEyeOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.7 6.5a8.7 8.7 0 0 1 2.3-.3c5.4 0 8.8 5.8 8.8 5.8a15.6 15.6 0 0 1-2.5 3.2" />
      <path d="M6.3 8.2A15.6 15.6 0 0 0 3.2 12s3.4 5.8 8.8 5.8a8.7 8.7 0 0 0 3.3-.6" />
      <path d="M10.2 10.2a2.6 2.6 0 0 0 3.6 3.6" />
      <path d="m4.9 4.9 14.2 14.2" />
    </Icon>
  );
}

export function LivynLogOut(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.4 4.8H7.7a2.2 2.2 0 0 0-2.2 2.2v10a2.2 2.2 0 0 0 2.2 2.2h6.7" />
      <path d="m15.6 8.4 3.6 3.6-3.6 3.6" />
      <path d="M19.2 12h-9" />
    </Icon>
  );
}

export function LivynRefresh(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.2 12a7.2 7.2 0 0 1-12.2 5.2L4.8 15" />
      <path d="M4.8 12a7.2 7.2 0 0 1 12.2-5.2L19.2 9" />
      <path d="M19.2 4.9V9h-4.1M4.8 19.1V15h4.1" />
    </Icon>
  );
}

export function LivynUndo(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.7 12a7.3 7.3 0 1 0 7.3-7.3 7.9 7.9 0 0 0-5.5 2.2L4.7 8.8" />
      <path d="M4.7 4.9V9h4.1" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ *
 * Feedback & state
 * ------------------------------------------------------------------ */

/**
 * The waiting arc. Rendered on its own it is a static three-quarter ring —
 * pair it with `animate-spin` wherever something is in flight.
 */
export function LivynSpinner(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.4a7.6 7.6 0 1 0 7.6 7.6" />
    </Icon>
  );
}

export function LivynCheckCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.6" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </Icon>
  );
}

export function LivynCloseCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.6" />
      <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
    </Icon>
  );
}

export function LivynAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.5 5 4.2 16.2a1.7 1.7 0 0 0 1.5 2.6h12.6a1.7 1.7 0 0 0 1.5-2.6L13.5 5a1.7 1.7 0 0 0-3 0Z" />
      <path d="M12 9.8v3.4M12 16.2h.01" />
    </Icon>
  );
}

export function LivynAlertCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.6" />
      <path d="M12 8.1v4.4M12 15.6h.01" />
    </Icon>
  );
}

/** An empty ring — a step that has not been taken yet. */
export function LivynRing(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.5" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ *
 * Trust, account & device
 * ------------------------------------------------------------------ */

export function LivynKey(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="15.7" cy="8.3" r="3.6" />
      <path d="m13.2 10.9-8.4 8.4" />
      <path d="m7.6 16.5 2 2M10 14.1l2 2" />
    </Icon>
  );
}

export function LivynShieldCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.1c4-1.4 6.2-4.6 6.2-8.4V6.9a1 1 0 0 0-.7-1L12 4.1 6.5 5.9a1 1 0 0 0-.7 1v4.8c0 3.8 2.2 7 6.2 8.4Z" />
      <path d="m9.4 11.9 1.9 1.9 3.4-3.6" />
    </Icon>
  );
}

export function LivynShieldAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.1c4-1.4 6.2-4.6 6.2-8.4V6.9a1 1 0 0 0-.7-1L12 4.1 6.5 5.9a1 1 0 0 0-.7 1v4.8c0 3.8 2.2 7 6.2 8.4Z" />
      <path d="M12 8.6v3.6M12 15.2h.01" />
    </Icon>
  );
}

export function LivynShieldX(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.1c4-1.4 6.2-4.6 6.2-8.4V6.9a1 1 0 0 0-.7-1L12 4.1 6.5 5.9a1 1 0 0 0-.7 1v4.8c0 3.8 2.2 7 6.2 8.4Z" />
      <path d="m10.1 9.9 3.8 3.8M13.9 9.9l-3.8 3.8" />
    </Icon>
  );
}

export function LivynDevice(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6.8" y="3.6" width="10.4" height="16.8" rx="2.6" />
      <path d="M10.6 17.4h2.8" />
    </Icon>
  );
}

export function LivynPhone(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.4 5.6a2 2 0 0 1 2.8-.4l1.5 1.2a2 2 0 0 1 .4 2.7l-.8 1.1a9.8 9.8 0 0 0 3.5 3.5l1.1-.8a2 2 0 0 1 2.7.4l1.2 1.5a2 2 0 0 1-.4 2.8l-.7.5c-1.1.8-2.6.8-3.8.1a20.4 20.4 0 0 1-7.7-7.7c-.7-1.2-.7-2.7.1-3.8l.5-.7Z" />
    </Icon>
  );
}

export function LivynMailCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.4 11.4V7.6a2 2 0 0 0-2-2H6.6a2 2 0 0 0-2 2v8.8a2 2 0 0 0 2 2h6.2" />
      <path d="m5 8 6 4.2a2 2 0 0 0 2.3 0L19.3 8" />
      <path d="m15 17.3 1.7 1.7 3-3.2" />
    </Icon>
  );
}

export function LivynOffline(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.9 10.1a11.1 11.1 0 0 1 14.2 0" />
      <path d="M8 13.3a6.4 6.4 0 0 1 8 0" />
      <circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none" />
      <path d="m5 19 14-14" />
    </Icon>
  );
}

export function LivynCloudCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.8 18h9.1a3.4 3.4 0 0 0 .3-6.8 5.2 5.2 0 0 0-9.7-1.2A3.9 3.9 0 0 0 7.8 18Z" />
      <path d="m9.9 13.6 1.7 1.7 3-3.2" />
    </Icon>
  );
}

export function LivynCloudDownload(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.7 15.6h-.9a3.9 3.9 0 0 1-.2-7.8 5.2 5.2 0 0 1 9.7 1.2 3.4 3.4 0 0 1-.4 6.6h-1.5" />
      <path d="M12 11.4v8.2" />
      <path d="m9.2 16.8 2.8 2.8 2.8-2.8" />
    </Icon>
  );
}

export function LivynUserPlus(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="8.4" r="3.2" />
      <path d="M4.4 19.3c.5-3.4 2.5-5.2 5.6-5.2 1 0 1.9.2 2.7.6" />
      <path d="M16.8 13.8v5.4M14.1 16.5h5.4" />
    </Icon>
  );
}

export function LivynUserMinus(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="8.4" r="3.2" />
      <path d="M4.4 19.3c.5-3.4 2.5-5.2 5.6-5.2 1 0 1.9.2 2.7.6" />
      <path d="M14.1 16.5h5.4" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ *
 * Direction
 * ------------------------------------------------------------------ */

export function LivynChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15 5-7 7 7 7" />
    </Icon>
  );
}

export function LivynChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 9 7 7 7-7" />
    </Icon>
  );
}

export function LivynArrowLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.2 12H5.4" />
      <path d="m11 5.5-5.6 6.5 5.6 6.5" />
    </Icon>
  );
}

/**
 * Central semantic icon registry.
 *
 * Use this when icons are selected dynamically.
 */
export const LIVYN_ICONS = {
  bible: LivynBible,
  prayer: LivynPrayer,
  journal: LivynJournal,
  sermon: LivynSermon,
  bell: LivynBell,
  circle: LivynCircle,
  people: LivynPeople,
  heart: LivynHeart,
  leaf: LivynLeaf,
  spark: LivynSpark,
  target: LivynTarget,
  calendar: LivynCalendar,
  home: LivynHome,
  profile: LivynProfile,
  search: LivynSearch,
  chevronRight: LivynChevronRight,
  check: LivynCheck,
  close: LivynClose,
  devotion: LivynDevotion,
  readingPlan: LivynReadingPlan,
  bookmark: LivynBookmark,
  bookmarkCheck: LivynBookmarkCheck,
  scroll: LivynScroll,
  fileText: LivynFileText,
  fileEdit: LivynFileEdit,
  quote: LivynQuote,
  highlight: LivynHighlight,
  note: LivynNote,
  clock: LivynClock,
  alarm: LivynAlarm,
  bellRing: LivynBellRing,
  flame: LivynFlame,
  sunrise: LivynSunrise,
  sun: LivynSun,
  moon: LivynMoon,
  moonStar: LivynMoonStar,
  monitor: LivynMonitor,
  crown: LivynCrown,
  trophy: LivynTrophy,
  clipboardCheck: LivynClipboardCheck,
  clipboardList: LivynClipboardList,
  dashboard: LivynDashboard,
  compass: LivynCompass,
  flag: LivynFlag,
  mapPin: LivynMapPin,
  tag: LivynTag,
  tags: LivynTags,
  play: LivynPlay,
  headphones: LivynHeadphones,
  image: LivynImage,
  megaphone: LivynMegaphone,
  plus: LivynPlus,
  trash: LivynTrash,
  share: LivynShare,
  shareUp: LivynShareUp,
  send: LivynSend,
  download: LivynDownload,
  copy: LivynCopy,
  save: LivynSave,
  pen: LivynPen,
  eye: LivynEye,
  eyeOff: LivynEyeOff,
  logOut: LivynLogOut,
  refresh: LivynRefresh,
  undo: LivynUndo,
  spinner: LivynSpinner,
  checkCircle: LivynCheckCircle,
  closeCircle: LivynCloseCircle,
  alert: LivynAlert,
  alertCircle: LivynAlertCircle,
  ring: LivynRing,
  key: LivynKey,
  shieldCheck: LivynShieldCheck,
  shieldAlert: LivynShieldAlert,
  shieldX: LivynShieldX,
  device: LivynDevice,
  phone: LivynPhone,
  mailCheck: LivynMailCheck,
  offline: LivynOffline,
  cloudCheck: LivynCloudCheck,
  cloudDownload: LivynCloudDownload,
  userPlus: LivynUserPlus,
  userMinus: LivynUserMinus,
  chevronLeft: LivynChevronLeft,
  chevronDown: LivynChevronDown,
  arrowLeft: LivynArrowLeft,
} as const;

export type LivynIconName = keyof typeof LIVYN_ICONS;

/**
 * The shape every icon in the family shares. Use it where a component takes
 * an icon as data — a nav tab, a stat card — the way `LucideIcon` was used
 * before the family existed.
 */
export type LivynIconComponent = (props: IconProps) => React.JSX.Element;

export type { IconProps as LivynIconProps };

export function LivynIcon({
  name,
  ...props
}: { name: LivynIconName } & IconProps) {
  const Component = LIVYN_ICONS[name];

  return <Component {...props} />;
}
