// Types for the vendored `scrub-engine.js`. The engine itself is plain JS kept
// close to upstream; this file is the typed surface the app codes against.

export type ScrollWorldCta = {
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
};

export type ScrollWorldSection = {
  id: string;
  /** Short label for the top nav and the route rail. */
  label: string;
  /** Poster image. Also the whole picture until a `clip` exists. */
  still: string;
  /** Portrait poster, paired with `clipMobile`. */
  stillMobile?: string;
  /** Scroll-scrubbed camera clip for this scene. Optional: without it the
   *  still stays up and slowly pushes in as you scroll. */
  clip?: string;
  /** Lighter 720p/-g 4 encode served on phones. */
  clipMobile?: string;
  accent?: string;
  /** Viewport-heights of scroll spent in this scene (overrides `diveScroll`). */
  scroll?: number;
  /** 0–1: settle the camera mid-scene, where the copy peaks. Keep <= 0.6. */
  linger?: number;
  eyebrow?: string;
  title?: string;
  body?: string;
  tags?: string[];
  /** Usually only on the last section. */
  cta?: ScrollWorldCta;
};

export type ScrollWorldConfig = {
  brand?: { name: string; href?: string };
  cta?: { label: string; href: string };
  hint?: string;
  nav?: boolean;
  atmosphere?: boolean;
  diveScroll?: number;
  connScroll?: number;
  crossfade?: number;
  sections: ScrollWorldSection[];
  /** length === sections.length - 1; a null slot just crossfades that seam. */
  connectors?: Array<string | null>;
  connectorsMobile?: Array<string | null>;
};

/** Mounts the engine into `container`. Returns a teardown, or undefined when
 *  the config had no sections (upstream bails early). */
export function mountScrollWorld(
  container: HTMLElement,
  config: ScrollWorldConfig
): (() => void) | undefined;
