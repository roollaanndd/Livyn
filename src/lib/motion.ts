import type { Transition, Variants } from "framer-motion";

/**
 * One motion vocabulary for the whole app.
 *
 * Before this, every component invented its own duration and easing curve —
 * some 0.3s, some 0.6s, a mix of ease-out and three different cubic-beziers —
 * so nothing felt like it belonged to the same product. Import from here
 * instead of writing raw numbers.
 */

/** Decelerating curve. The default for anything entering the screen. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Symmetric curve, for things that move between two states. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** Slight overshoot. Use sparingly — confirmations, the active nav pill. */
export const EASE_SPRINGY = [0.34, 1.4, 0.64, 1] as const;

export const DURATION = {
  /** Taps, hovers, colour changes. Fast enough to feel instant. */
  instant: 0.12,
  /** Most UI state changes. */
  quick: 0.22,
  /** Page and section entrances. */
  normal: 0.36,
  /** Deliberate, full-screen moments only. */
  slow: 0.6,
} as const;

/** Physical spring for anything the finger drives. */
export const SPRING: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 32,
  mass: 0.7,
};

/** Softer spring for larger surfaces, where 400 stiffness reads as jittery. */
export const SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

// --- Variants ---------------------------------------------------------------

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.quick, ease: EASE_OUT } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: DURATION.quick } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.normal, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION.quick } },
};

/**
 * Parent for a list whose children should arrive one after another.
 * Pair with `staggerChild` on each item.
 */
export function staggerParent(stagger = 0.05, delay = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: EASE_OUT } },
};

/** Standard press feedback. Consistent everywhere something is tappable. */
export const TAP = { scale: 0.97 } as const;
