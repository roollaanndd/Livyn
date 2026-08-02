// Renders the landing page's scenes to SVG.
//
//   node scripts/build-scenes.mjs
//
// The seven scenes are one continuous descent, not seven separate pictures:
// the camera starts in orbit above the earth, falls through the atmosphere,
// finds a city, picks one church out of it and ends on its open door — which
// is also the door into the app. Scrolling the page is the fall.
//
// That is what makes the set cohere. The scroll-world skill
// (github.com/oso95/scroll-world) gets cohesion out of AI stills by repeating
// one style preamble in every prompt; here it comes out of geometry instead.
// Scenes 3-7 are literally the same city model photographed by the same
// pinhole camera from five altitudes, so the church that is a few pixels wide
// in the aerial shot is the church you are standing in front of at the end.
// The engine's own push-in (`scale` on the still) covers the distance between
// two altitudes, so the seams read as one move.
//
// Output: public/scroll-world/scenes/<id>.svg — one still per landing section,
// landscape and portrait, which is also exactly the slot a generated camera
// clip's poster would take, so swapping in real clips later is additive
// (see README → Landing page).

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/scroll-world/scenes");

// ---------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------

// Every scene is rendered twice. The portrait cut is not a crop of the
// landscape one — it is the same world seen through a taller frame, which is
// what a phone needs and what a hard centre-crop of a 16:9 still can't give.
//
// `cx`/`cy` place the principal point — where whatever the camera is aimed at
// lands on screen. The page floats its copy over the left of a wide screen and
// over the bottom of a tall one, so the subject sits right on landscape and
// high on portrait, clear of the text in both.
const FORMATS = [
  { suffix: "", W: 1920, H: 1080, cx: 0.6, cy: 0.48 },
  { suffix: "-m", W: 1080, H: 1920, cx: 0.5, cy: 0.38 },
];

/** The format currently being rendered. */
let F = FORMATS[0];

/** Pixel sizes that aren't derived from the projection — blur radii, dot
 *  sizes. Written at the landscape scale and carried across. */
const px = (n) => (n * F.W) / 1920;

const D2R = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const nf = (v) => (Math.round(v * 10) / 10).toString();
/** Polygon coordinates, rounded to the pixel. The city scenes are thousands of
 *  quads; a decimal place nobody can see costs ~15% of the file. */
const ni = (v) => Math.round(v).toString();

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
const parse = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (c, t, amt) => {
  const a = parse(c);
  const b = parse(t);
  return "#" + a.map((v, i) => hex2(v + (b[i] - v) * amt)).join("");
};
const lighten = (c, amt) => mix(c, "#FFFFFF", amt);
const darken = (c, amt) => mix(c, "#000000", amt);
/** One knob for face shading: >1 lifts towards the light, <1 drops into shade. */
const tint = (c, k) => (k >= 1 ? lighten(c, k - 1) : darken(c, 1 - k));

// The whole descent is lit the same way — one cold sky, one warm human light —
// so the palette is shared by the orbit, the city and the church.
const C = {
  space: "#02040A",
  spaceLift: "#081422",
  ocean: "#0A3346",
  oceanDeep: "#04141F",
  land: "#2C6E53",
  landDry: "#6B7A4A",
  cloud: "#E9F2F5",
  air: "#5FBEE0",
  gold: "#E8C877",
  glow: "#F6E6B8",
  warm: "#FFCC86",
  night: "#0A1610",
  ground: "#0E1A18",
  block: "#0A1512",
  concrete: "#1A332E",
  concreteCool: "#173039",
  concreteWarm: "#23382C",
  stone: "#2A4A40",
  wall: "#CFC5AA",
  roof: "#2C4A44",
  wood: "#7A5C3C",
  cloth: "#C9705A",
};

/** Deterministic RNG (mulberry32), so re-running produces identical files. */
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// SVG primitives
// ---------------------------------------------------------------------------

const pts2d = (pts) => pts.map(([x, y]) => `${ni(x)},${ni(y)}`).join(" ");
const poly = (pts, fill, extra = "") => `<polygon points="${pts2d(pts)}" fill="${fill}"${extra}/>`;
const rect = (x, y, w, h, fill, extra = "") =>
  `<rect x="${nf(x)}" y="${nf(y)}" width="${nf(w)}" height="${nf(h)}" fill="${fill}"${extra}/>`;
const circle = (x, y, r, fill, extra = "") =>
  `<circle cx="${nf(x)}" cy="${nf(y)}" r="${nf(r)}" fill="${fill}"${extra}/>`;

/** Filters every scene uses. */
const COMMON_DEFS = () =>
  [
    `<filter id="soft" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="${nf(px(12))}"/></filter>`,
    `<filter id="bloom" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="${nf(px(34))}"/></filter>`,
    `<filter id="haze" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${nf(px(70))}"/></filter>`,
    `<filter id="wisp" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${nf(px(24))}"/></filter>`,
  ].join("");

/** A warm point light: the halo plus the thing emitting it. A near lamp is
 *  still a lamp, not a floodlight, so the halo is capped rather than scaled all
 *  the way in — otherwise the last two scenes wash out entirely. */
function lamp(x, y, r0, color = C.glow, strength = 1) {
  const r = Math.min(r0, px(5));
  return (
    circle(x, y, r * 3.4, color, ` opacity="${nf(0.1 * strength)}" filter="url(#bloom)"`) +
    circle(x, y, r * 1.5, color, ` opacity="${nf(0.3 * strength)}" filter="url(#soft)"`) +
    circle(x, y, r * 0.38, lighten(color, 0.45), ` opacity="${nf(0.95 * strength)}"`)
  );
}

/** Star field above `maxY`. Thins out as the descent goes on. */
function stars(seed, count, maxY, opacity = 1) {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = r() * F.W;
    const y = r() * Math.max(1, maxY);
    const rad = px(0.7 + r() * r() * 2.2);
    const op = (0.25 + r() * 0.6) * opacity;
    out += circle(x, y, rad, r() > 0.9 ? C.air : "#FFFFFF", ` opacity="${nf(op)}"`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scenes 1-2: the earth
// ---------------------------------------------------------------------------

/** Orthographic globe centred on a lat/lon — what a camera directly above that
 *  point sees. */
function sphere({ cx, cy, R, lat0, lon0 }) {
  const s0 = Math.sin(lat0 * D2R);
  const c0 = Math.cos(lat0 * D2R);
  return {
    cx,
    cy,
    R,
    /** Unit vector in view space (+x right, +y up, +z towards the camera). */
    at(lat, lon) {
      const p = lat * D2R;
      const l = (lon - lon0) * D2R;
      const sp = Math.sin(p);
      const cp = Math.cos(p);
      const cl = Math.cos(l);
      const x = cp * Math.sin(l);
      const y = c0 * sp - s0 * cp * cl;
      const z = s0 * sp + c0 * cp * cl;
      return { x, y, z, sx: cx + R * x, sy: cy - R * y };
    },
  };
}

// Coarse coastlines, written out in lat/lon. Not a map — enough of one that
// the hemisphere under the camera reads as this one, with Nusantara in the
// middle of it, which is where the app's readers are.
const LAND = [
  // Eurasia, from the Arabian Sea round to Kamchatka and back across Siberia.
  [
    [66, 25], [70, 21], [73, 16], [76, 9], [80, 10], [81, 16], [85, 20], [88, 22],
    [92, 21], [95, 17], [98, 16], [99, 10], [101, 3], [104, 2], [105, 9], [109, 11],
    [107, 17], [109, 21], [114, 22], [118, 24], [121, 26], [122, 31], [120, 35],
    [122, 39], [126, 40], [129, 43], [132, 45], [136, 49], [141, 53], [143, 59],
    [150, 60], [156, 58], [162, 61], [170, 65], [172, 70], [160, 71], [140, 73],
    [120, 74], [100, 76], [80, 73], [68, 72], [60, 70], [57, 62], [53, 52],
    [50, 44], [49, 38], [47, 30], [52, 26], [57, 25], [61, 24],
  ],
  // Australia.
  [
    [113, -22], [114, -26], [115, -33], [118, -35], [123, -34], [129, -32],
    [134, -33], [138, -35], [141, -38], [146, -39], [150, -37], [153, -30],
    [153, -25], [147, -19], [142, -11], [137, -12], [135, -15], [130, -12],
    [127, -14], [122, -17], [117, -20],
  ],
  // New Guinea.
  [[131, -1], [135, -3], [141, -3], [146, -5], [150, -9], [147, -10], [141, -9], [137, -8], [133, -5]],
  // Borneo.
  [[109, 2], [113, 3], [117, 4], [119, 1], [117, -3], [114, -3], [110, -2]],
  // Sumatra.
  [[95, 5], [98, 4], [102, 2], [106, -3], [105, -6], [102, -5], [99, -2], [96, 2]],
  // Java.
  [[105, -6], [110, -6], [114, -8], [112, -9], [108, -8], [105, -7]],
  // Sulawesi.
  [[119, 1], [122, 1], [125, 1], [124, -2], [122, -4], [120, -5], [119, -3], [120, 0]],
  // The Philippines, sketched as one mass.
  [[120, 18], [122, 17], [124, 13], [126, 10], [125, 6], [122, 7], [120, 12], [119, 16]],
  // Japan.
  [[130, 32], [134, 34], [138, 37], [141, 41], [145, 44], [143, 42], [140, 38], [136, 35], [131, 31]],
  // New Zealand.
  [[173, -35], [176, -38], [175, -41], [171, -44], [167, -46], [168, -43], [172, -38]],
  // Sri Lanka, Taiwan, Hainan — small, but their absence is what makes a globe
  // look drawn rather than photographed.
  [[80, 9], [82, 8], [81, 6], [80, 7]],
  [[120, 25], [122, 25], [121, 22], [120, 23]],
  [[109, 20], [111, 20], [110, 18], [109, 19]],
];

// Where the lights are, at night, on that hemisphere.
const CITIES = [
  [106.8, -6.2, 1.15], [112.7, -7.3, 0.7], [98.7, 3.6, 0.55], [119.4, -5.1, 0.5],
  [115.2, -8.7, 0.4], [103.8, 1.35, 0.85], [101.7, 3.1, 0.65], [100.5, 13.7, 0.85],
  [106.7, 10.8, 0.75], [105.8, 21.0, 0.6], [121.0, 14.6, 0.85], [114.2, 22.3, 0.9],
  [121.5, 31.2, 1.0], [116.4, 39.9, 0.9], [127.0, 37.5, 0.85], [139.7, 35.7, 1.05],
  [135.5, 34.7, 0.75], [121.5, 25.0, 0.6], [77.2, 28.6, 0.9], [72.9, 19.1, 0.85],
  [88.4, 22.6, 0.75], [80.3, 13.1, 0.6], [90.4, 23.8, 0.65], [67.0, 24.9, 0.6],
  [151.2, -33.9, 0.75], [145.0, -37.8, 0.65], [153.0, -27.5, 0.5], [115.9, -32.0, 0.5],
  [174.8, -36.9, 0.45], [147.0, -9.5, 0.3], [79.9, 6.9, 0.4], [96.2, 16.9, 0.45],
  [113.3, 23.1, 0.8], [106.5, 29.6, 0.6], [117.2, 31.9, 0.5], [110.4, -7.8, 0.45],
];

/** The sun, in the globe's view space: upper right and a little behind the
 *  camera, so most of the disc is lit and the terminator runs bottom-left. */
const SUN = (() => {
  const v = { x: 0.58, y: 0.46, z: 0.67 };
  const m = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / m, y: v.y / m, z: v.z / m };
})();

/** A lat/lon ring as an SVG path. Points that have rotated off the far side
 *  are pinned to the limb, so a landmass running over the edge stays on the
 *  edge instead of collapsing across the disc. */
function landPath(sph, ring) {
  const out = ring.map(([lon, lat]) => {
    const v = sph.at(lat, lon);
    if (v.z > 0) return [v.sx, v.sy];
    const m = Math.hypot(v.x, v.y) || 1;
    return [sph.cx + (sph.R * v.x) / m, sph.cy - (sph.R * v.y) / m];
  });
  return `M${out.map(([x, y]) => `${nf(x)},${nf(y)}`).join("L")}Z`;
}

/** Scene 1 — the earth from orbit. */
function sceneOrbit() {
  const R = Math.min(F.W, F.H) * 0.46;
  const cx = F.W * (F.suffix ? 0.5 : 0.62);
  const cy = F.H * (F.suffix ? 0.38 : 0.47);
  const sph = sphere({ cx, cy, R, lat0: -4, lon0: 116 });
  const r = rng(20260802);

  // Clouds: swirled bands, clipped to the disc and shaded by the same
  // terminator as the ground under them.
  let clouds = "";
  for (let i = 0; i < 52; i++) {
    const lat = (r() - 0.5) * 150;
    const lon = 116 + (r() - 0.5) * 230;
    const v = sph.at(lat, lon);
    if (v.z < 0.12) continue;
    const rx = px(24 + r() * 92) * (0.4 + v.z * 0.8);
    const ry = rx * (0.2 + r() * 0.3);
    const rot = (r() - 0.5) * 50 + v.x * 34;
    clouds +=
      `<ellipse cx="${nf(v.sx)}" cy="${nf(v.sy)}" rx="${nf(rx)}" ry="${nf(ry)}" fill="${C.cloud}" ` +
      `opacity="${nf(0.1 + r() * 0.22)}" transform="rotate(${nf(rot)} ${nf(v.sx)} ${nf(v.sy)})" filter="url(#wisp)"/>`;
  }

  // City lights, only where the sun isn't.
  let lights = "";
  for (const [lon, lat, weight] of CITIES) {
    const v = sph.at(lat, lon);
    if (v.z < 0.09) continue;
    const day = v.x * SUN.x + v.y * SUN.y + v.z * SUN.z;
    const night = clamp((0.14 - day) / 0.5);
    if (night <= 0.02) continue;
    const rad = px(2 + weight * 4) * (0.45 + v.z * 0.7);
    lights +=
      circle(v.sx, v.sy, rad * 3.4, C.warm, ` opacity="${nf(0.18 * night * weight)}" filter="url(#soft)"`) +
      circle(v.sx, v.sy, rad, C.glow, ` opacity="${nf(0.8 * night)}"`);
    // A scatter of smaller towns around each one.
    for (let k = 0; k < 5; k++) {
      const v2 = sph.at(lat + (r() - 0.5) * 9, lon + (r() - 0.5) * 11);
      if (v2.z < 0.09) continue;
      lights += circle(v2.sx, v2.sy, px(0.9 + r() * 1.7), C.warm, ` opacity="${nf(0.5 * night * r())}"`);
    }
  }

  const defs =
    `<radialGradient id="ocean" cx="${nf(0.5 + SUN.x * 0.4)}" cy="${nf(0.5 - SUN.y * 0.4)}" r="0.8">` +
    `<stop offset="0" stop-color="${lighten(C.ocean, 0.34)}"/>` +
    `<stop offset="0.55" stop-color="${C.ocean}"/>` +
    `<stop offset="1" stop-color="${C.oceanDeep}"/></radialGradient>` +
    // The terminator: one soft shadow laid over ground, sea and cloud alike.
    `<radialGradient id="night" cx="${nf(0.5 + SUN.x * 0.46)}" cy="${nf(0.5 - SUN.y * 0.46)}" r="0.98">` +
    `<stop offset="0.3" stop-color="#000000" stop-opacity="0"/>` +
    `<stop offset="0.62" stop-color="#000814" stop-opacity="0.5"/>` +
    `<stop offset="0.86" stop-color="#000509" stop-opacity="0.88"/>` +
    `<stop offset="1" stop-color="#000306" stop-opacity="0.95"/></radialGradient>` +
    `<radialGradient id="space" cx="0.5" cy="0.42" r="0.85">` +
    `<stop offset="0" stop-color="${C.spaceLift}"/><stop offset="1" stop-color="${C.space}"/></radialGradient>` +
    `<clipPath id="globe"><circle cx="${nf(cx)}" cy="${nf(cy)}" r="${nf(R)}"/></clipPath>`;

  const body =
    rect(0, 0, F.W, F.H, "url(#space)") +
    stars(7, 300, F.H) +
    // Atmosphere: a cold halo outside the limb, warm where the sun grazes it.
    circle(cx, cy, R * 1.05, C.air, ` opacity="0.32" filter="url(#bloom)"`) +
    circle(cx + R * SUN.x * 0.75, cy - R * SUN.y * 0.75, R * 0.85, C.gold, ` opacity="0.12" filter="url(#haze)"`) +
    `<g clip-path="url(#globe)">` +
    circle(cx, cy, R, "url(#ocean)") +
    LAND.map((ring) => `<path d="${landPath(sph, ring)}" fill="${C.land}" opacity="0.95"/>`).join("") +
    // A drier, lighter interior on the two big masses, so land isn't flat green.
    LAND.slice(0, 2)
      .map((ring) => {
        const p = landPath(sph, ring);
        return `<path d="${p}" fill="${C.landDry}" opacity="0.2" transform="translate(${nf(cx * 0.05)} ${nf(cy * 0.04)}) scale(0.95)"/>`;
      })
      .join("") +
    clouds +
    circle(cx, cy, R, "url(#night)") +
    lights +
    `</g>` +
    // Rim light on the lit limb, and the thin bright line of the atmosphere.
    `<circle cx="${nf(cx)}" cy="${nf(cy)}" r="${nf(R * 1.004)}" fill="none" stroke="${C.air}" stroke-opacity="0.55" stroke-width="${nf(px(3))}" filter="url(#soft)"/>` +
    `<circle cx="${nf(cx)}" cy="${nf(cy)}" r="${nf(R * 1.02)}" fill="none" stroke="${C.glow}" stroke-opacity="0.12" stroke-width="${nf(px(10))}" filter="url(#bloom)"/>`;

  return { defs, body };
}

/** Scene 2 — inside the atmosphere: the limb from just above the cloud deck,
 *  with the archipelago below already showing its lights. */
function sceneAtmosphere() {
  const r = rng(4711);
  const RH = F.W * 2.5;                        // the planet, at this altitude
  const arcTop = F.H * (F.suffix ? 0.42 : 0.34);
  const cx = F.W * 0.5;
  const cy = arcTop + RH;

  // Coastlines, in screen space this time: from here you see shapes, not a
  // map. Flattened towards the limb, where the angle is grazing.
  const islands = [];
  for (let i = 0; i < 10; i++) {
    const iy = arcTop + (F.H - arcTop) * (0.08 + r() * 0.95);
    const depth = clamp((iy - arcTop) / (F.H - arcTop));
    const ix = F.W * (0.02 + r() * 0.96);
    const w = px(180 + r() * 430) * (0.45 + depth);
    const h = w * (0.09 + depth * 0.3);
    const n = 18;
    const pts = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const wobble = 0.5 + r() * 0.8;
      pts.push([ix + Math.cos(a) * w * 0.5 * wobble, iy + Math.sin(a) * h * 0.5 * wobble]);
    }
    islands.push({ iy, ix, w, h, depth, pts });
  }

  const land = islands
    .map((is) => poly(is.pts, mix(C.oceanDeep, C.land, 0.3 + is.depth * 0.55), ` opacity="${nf(0.7 + is.depth * 0.3)}"`))
    .join("");

  // Lights strung along the coasts, brightest in the near foreground.
  let lights = "";
  for (const is of islands) {
    const n = Math.round(8 + is.depth * 30);
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2;
      const rad = 0.15 + r() * 0.5;
      const x = is.ix + Math.cos(a) * is.w * rad;
      const y = is.iy + Math.sin(a) * is.h * rad;
      const s = px(1 + is.depth * 3) * (0.6 + r());
      lights += circle(x, y, s, r() > 0.75 ? C.gold : C.glow, ` opacity="${nf((0.3 + r() * 0.6) * (0.35 + is.depth))}"`);
    }
    lights += circle(is.ix, is.iy, is.w * 0.3, C.warm, ` opacity="${nf(0.06 + is.depth * 0.12)}" filter="url(#bloom)"`);
  }

  // The cloud deck: long bands, flattened by the grazing angle. Thin — from
  // inside the atmosphere the point is the ground showing through them, so
  // anything thicker just fogs the frame.
  let clouds = "";
  for (let i = 0; i < 22; i++) {
    const y = arcTop + (F.H - arcTop) * (0.01 + r() * 1.06);
    const depth = clamp((y - arcTop) / (F.H - arcTop));
    const x = r() * F.W;
    const rx = px(120 + r() * 380) * (0.35 + depth);
    const ry = rx * (0.03 + depth * 0.11);
    clouds += `<ellipse cx="${nf(x)}" cy="${nf(y)}" rx="${nf(rx)}" ry="${nf(ry)}" fill="${C.cloud}" opacity="${nf(0.03 + r() * 0.07)}" filter="url(#wisp)"/>`;
  }

  const defs =
    `<linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${C.space}"/>` +
    `<stop offset="0.55" stop-color="${C.spaceLift}"/>` +
    `<stop offset="1" stop-color="${mix(C.spaceLift, C.air, 0.4)}"/></linearGradient>` +
    `<linearGradient id="sea2" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${mix(C.ocean, C.air, 0.16)}"/>` +
    `<stop offset="0.18" stop-color="${darken(C.ocean, 0.25)}"/>` +
    `<stop offset="1" stop-color="${C.oceanDeep}"/></linearGradient>` +
    `<clipPath id="below"><rect x="0" y="${nf(arcTop)}" width="${nf(F.W)}" height="${nf(F.H - arcTop)}"/></clipPath>`;

  const body =
    rect(0, 0, F.W, arcTop + px(6), "url(#sky2)") +
    stars(19, 170, arcTop, 0.85) +
    // The atmosphere seen edge-on: a bright band hugging the limb.
    `<circle cx="${nf(cx)}" cy="${nf(cy)}" r="${nf(RH + px(24))}" fill="none" stroke="${C.air}" stroke-opacity="0.6" stroke-width="${nf(px(24))}" filter="url(#soft)"/>` +
    `<circle cx="${nf(cx)}" cy="${nf(cy)}" r="${nf(RH + px(78))}" fill="none" stroke="${C.air}" stroke-opacity="0.1" stroke-width="${nf(px(70))}" filter="url(#haze)"/>` +
    circle(F.W * 0.82, arcTop - px(50), F.W * 0.3, C.gold, ` opacity="0.16" filter="url(#haze)"`) +
    `<g clip-path="url(#below)">` +
    circle(cx, cy, RH, "url(#sea2)") +
    land +
    lights +
    clouds +
    // Foreground haze, so the bottom of the frame falls away into cloud.
    rect(0, F.H * 0.78, F.W, F.H * 0.22, C.cloud, ` opacity="0.035" filter="url(#haze)"`) +
    `</g>`;

  return { defs, body };
}

// ---------------------------------------------------------------------------
// Scenes 3-7: one city, five altitudes
// ---------------------------------------------------------------------------
//
// World space is metres: +x right, +y away from the camera, +z up. The church
// stands at the origin with its door facing -y, which is where every camera
// looks from.

const V = (x, y, z) => ({ x, y, z });
const sub = (a, b) => V(a.x - b.x, a.y - b.y, a.z - b.z);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const unit = (a) => {
  const m = Math.hypot(a.x, a.y, a.z) || 1;
  return V(a.x / m, a.y / m, a.z / m);
};
const lerp3 = (a, b, t) => V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);

/** A pinhole camera. Horizontal field of view is fixed across formats, so the
 *  church is the same width in both cuts and the portrait frame simply sees
 *  more sky and more pavement. */
function makeCam({ eye, target, hfov = 56 }) {
  const f = F.W / 2 / Math.tan((hfov * D2R) / 2);
  const ox = F.W * F.cx;
  const oy = F.H * F.cy;
  const fwd = unit(sub(target, eye));
  const right = unit(cross(fwd, V(0, 0, 1)));
  const up = cross(right, fwd);
  const shoot = (d) => {
    const z = dot(d, fwd);
    const s = f / (z || 1e-6);
    return { x: ox + dot(d, right) * s, y: oy - dot(d, up) * s, z };
  };
  const project = (p) => shoot(sub(p, eye));
  // The horizon is the ground plane at infinity: the same projection, run on a
  // direction rather than a point.
  const horizon = shoot(V(fwd.x, fwd.y, 0)).y;
  /** Screen size of something `r` metres across at depth `z`. */
  const scale = (r, z) => (f * r) / Math.max(z, 1e-6);
  return { eye, target, f, project, horizon, scale };
}

/** A world-space quad, or "" if any corner is behind the camera. */
function quad(cam, a, b, c, d, fill, extra = "") {
  const ps = [a, b, c, d].map((p) => cam.project(p));
  if (ps.some((p) => p.z <= 0.4)) return "";
  return poly(ps.map((p) => [p.x, p.y]), fill, extra);
}

/** How hard each face of an axis-aligned box is lit. The light is high, to the
 *  right and slightly behind the camera — the same direction as the sun on the
 *  globe, carried all the way down. */
const FACE = { top: 1.2, front: 0.94, back: 0.6, right: 1.04, left: 0.72 };

/** The three or fewer faces of a box the camera can see. `flat` drops the
 *  side face — invisible at a few pixels across, and a third of the aerial
 *  shot's bytes. */
function boxFaces(cam, b, color, flat = false) {
  const { x, y, z, w, d, h } = b;
  const x1 = x + w;
  const y1 = y + d;
  const z1 = z + h;
  const e = cam.eye;
  let out = "";
  if (e.z > z1) out += quad(cam, V(x, y, z1), V(x1, y, z1), V(x1, y1, z1), V(x, y1, z1), tint(color, FACE.top));
  if (e.y < y) out += quad(cam, V(x, y, z), V(x1, y, z), V(x1, y, z1), V(x, y, z1), tint(color, FACE.front));
  else if (e.y > y1) out += quad(cam, V(x, y1, z), V(x1, y1, z), V(x1, y1, z1), V(x, y1, z1), tint(color, FACE.back));
  if (flat) return out;
  if (e.x < x) out += quad(cam, V(x, y, z), V(x, y1, z), V(x, y1, z1), V(x, y, z1), tint(color, FACE.left));
  else if (e.x > x1) out += quad(cam, V(x1, y, z), V(x1, y1, z), V(x1, y1, z1), V(x1, y, z1), tint(color, FACE.right));
  return out;
}

/** Lit windows on one face, given its bottom-left corner and its two edge
 *  vectors. Skipped when the face is too small on screen to be worth the
 *  bytes — which is most of the city in the aerial shots. */
function faceWindows(cam, origin, across, upv, cols, rows, rand, opts = {}) {
  const o = cam.project(origin);
  const far = cam.project(V(origin.x + across.x, origin.y + across.y, origin.z + across.z));
  if (o.z <= 1 || far.z <= 1) return "";
  if (Math.hypot(far.x - o.x, far.y - o.y) < px(26)) return "";
  const lit = opts.lit ?? 0.45;
  const inset = opts.inset ?? 0.3;
  const budget = opts.budget;
  let out = "";
  for (let i = 0; i < cols; i++) {
    for (let k = 0; k < rows; k++) {
      if (rand() > lit) continue;
      if (budget && budget.left-- <= 0) return out;
      const s0 = (i + inset / 2) / cols;
      const s1 = (i + 1 - inset / 2) / cols;
      const t0 = (k + inset) / rows;
      const t1 = (k + 1 - inset) / rows;
      const at = (s, t) =>
        V(
          origin.x + across.x * s + upv.x * t,
          origin.y + across.y * s + upv.y * t,
          origin.z + across.z * s + upv.z * t
        );
      out += quad(
        cam,
        at(s0, t0), at(s1, t0), at(s1, t1), at(s0, t1),
        mix(C.warm, C.glow, 0.4 + rand() * 0.5),
        ` opacity="${nf(0.5 + rand() * 0.45)}"`
      );
    }
  }
  return out;
}

/** The city block grid. Two blocks are left empty: the church's, and the
 *  square in front of it. */
const BLOCK = 170;
const INNER = 63;                       // half-width of a block's built area

function cityBlocks() {
  const out = [];
  for (let gx = -9; gx <= 9; gx++) {
    for (let gy = -4; gy <= 16; gy++) {
      if (gx === 0 && (gy === 0 || gy === -1)) continue;
      out.push({ gx, gy, x: gx * BLOCK, y: gy * BLOCK });
    }
  }
  return out;
}

function cityBuildings(seed) {
  const rand = rng(seed);
  const palette = [C.concrete, C.concreteCool, C.concreteWarm, darken(C.concrete, 0.22)];
  const out = [];
  for (const b of cityBlocks()) {
    const count = 2 + Math.floor(rand() * 3);
    for (let k = 0; k < count; k++) {
      const w = 24 + rand() * 46;
      const d = 24 + rand() * 46;
      const x = b.x - INNER + rand() * (INNER * 2 - w);
      const y = b.y - INNER + rand() * (INNER * 2 - d);
      const dist = Math.hypot(x + w / 2, y + d / 2);
      // Low around the church so it keeps the skyline; taller further out.
      const h =
        dist < 380
          ? 12 + rand() * 18
          : 20 + rand() * 32 + (rand() < 0.22 ? 40 + rand() * 70 : 0);
      out.push({
        x, y, z: 0, w, d, h,
        color: palette[Math.floor(rand() * palette.length)],
        seed: Math.floor(rand() * 1e9),
      });
    }
  }
  return out;
}

const BUILDINGS = cityBuildings(90210);

/** A round-headed opening on a vertical face: a rectangle with a half-round
 *  top, built in world space so it keeps its perspective. */
function archOnFace(cam, { base, across, height, fill, opacity = 1 }) {
  const w = Math.hypot(across.x, across.y, across.z);
  const half = w / 2;
  const straight = Math.max(0, height - half);
  const pts = [];
  let ok = true;
  const push = (p) => {
    const q = cam.project(p);
    if (q.z <= 0.4) {
      ok = false;
      return;
    }
    pts.push([q.x, q.y]);
  };
  const a0 = V(base.x, base.y, 0);
  const a1 = V(base.x + across.x, base.y + across.y, 0);
  push(V(base.x, base.y, base.z));
  push(V(base.x, base.y, base.z + straight));
  for (let i = 0; i <= 10; i++) {
    const ang = Math.PI - (i / 10) * Math.PI;
    const t = (Math.cos(ang) + 1) / 2;
    const p = lerp3(a0, a1, t);
    push(V(p.x, p.y, base.z + straight + Math.sin(ang) * half));
  }
  push(V(base.x + across.x, base.y + across.y, base.z + straight));
  push(V(base.x + across.x, base.y + across.y, base.z));
  if (!ok || pts.length < 4) return { svg: "", center: null, size: 0 };
  const c = cam.project(V(base.x + across.x / 2, base.y + across.y / 2, base.z + height * 0.5));
  return {
    svg: poly(pts, fill, opacity === 1 ? "" : ` opacity="${nf(opacity)}"`),
    center: c.z > 0.4 ? { x: c.x, y: c.y } : null,
    size: cam.scale(w, Math.max(c.z, 1)),
  };
}

/** A tree: a trunk and a soft canopy. Cheap, because there are never many. */
function treeAt(cam, p, h) {
  const trunk = boxFaces(cam, { x: p.x - 0.4, y: p.y - 0.4, z: p.z, w: 0.8, d: 0.8, h: h * 0.5 }, C.wood);
  const top = cam.project(V(p.x, p.y, p.z + h * 0.8));
  if (top.z <= 1) return trunk;
  const r = cam.scale(h * 0.45, top.z);
  if (r < px(2)) return trunk;
  return (
    trunk +
    circle(top.x, top.y, r, darken(C.land, 0.4)) +
    circle(top.x - r * 0.25, top.y - r * 0.3, r * 0.6, darken(C.land, 0.2), ` opacity="0.85"`)
  );
}

/** A person, drawn only when the camera is close enough for one to register. */
function personAt(cam, p, color) {
  const head = cam.project(V(p.x, p.y, 1.75));
  if (head.z <= 1) return "";
  if (cam.scale(1.75, head.z) < px(7)) return "";
  return (
    boxFaces(cam, { x: p.x - 0.28, y: p.y - 0.2, z: 0, w: 0.56, d: 0.4, h: 1.45 }, color) +
    circle(head.x, head.y, cam.scale(0.22, head.z), C.wall, ` opacity="0.85"`)
  );
}

/** The church: nave, tower, spire, cross, and a door with the light on. */
function church(cam, glows, detail) {
  const rand = rng(1312);
  const out = [];
  const nave = { x: -14, y: -14, z: 0, w: 28, d: 58, h: 20 };
  const tower = { x: -9, y: -32, z: 0, w: 18, d: 18, h: 42 };
  const stoneLit = mix(C.wall, C.stone, 0.58);

  // Steps up to the door.
  for (let i = 0; i < 3; i++) {
    out.push(boxFaces(cam, { x: -12 + i, y: -38 + i * 2, z: 0, w: 24 - i * 2, d: 6, h: 0.6 + i * 0.6 }, C.stone));
  }

  out.push(boxFaces(cam, nave, stoneLit));

  // Gable roof over the nave: two slopes meeting on a ridge, plus the gable
  // wall the camera sees end-on.
  const ridgeH = nave.h + 10;
  const cxN = nave.x + nave.w / 2;
  out.push(
    quad(cam, V(nave.x, nave.y, nave.h), V(nave.x, nave.y + nave.d, nave.h), V(cxN, nave.y + nave.d, ridgeH), V(cxN, nave.y, ridgeH), tint(C.roof, 0.78)),
    quad(cam, V(nave.x + nave.w, nave.y, nave.h), V(nave.x + nave.w, nave.y + nave.d, nave.h), V(cxN, nave.y + nave.d, ridgeH), V(cxN, nave.y, ridgeH), tint(C.roof, 1.2)),
    quad(cam, V(nave.x, nave.y, nave.h), V(nave.x + nave.w, nave.y, nave.h), V(cxN, nave.y, ridgeH), V(cxN, nave.y, ridgeH), tint(stoneLit, FACE.front))
  );

  // Nave windows: tall, warm, down both sides.
  for (let i = 0; i < 6; i++) {
    const y0 = nave.y + 6 + i * 8.5;
    const right = archOnFace(cam, {
      base: V(nave.x + nave.w + 0.2, y0, 5),
      across: V(0, 4.6, 0),
      height: 9,
      fill: mix(C.warm, C.glow, 0.4),
      opacity: 0.85,
    });
    out.push(right.svg);
    if (right.center && right.size > px(4)) {
      glows.push({ x: right.center.x, y: right.center.y, r: right.size * 1.6, color: C.warm, op: 0.22 });
    }
    out.push(
      archOnFace(cam, {
        base: V(nave.x - 0.2, y0, 5),
        across: V(0, 4.6, 0),
        height: 9,
        fill: mix(C.warm, C.glow, 0.4),
        opacity: 0.5,
      }).svg
    );
  }

  out.push(boxFaces(cam, tower, lighten(stoneLit, 0.04)));

  // The belfry opening near the top of the tower.
  out.push(
    archOnFace(cam, {
      base: V(tower.x + 4.5, tower.y - 0.2, 30),
      across: V(9, 0, 0),
      height: 8,
      fill: mix("#0B0F0E", C.warm, 0.12),
      opacity: 0.92,
    }).svg
  );

  // Spire, then the cross: the two things still visible from four blocks out.
  const apex = V(tower.x + tower.w / 2, tower.y + tower.d / 2, 66);
  const c0 = V(tower.x, tower.y, tower.h);
  const c1 = V(tower.x + tower.w, tower.y, tower.h);
  const c2 = V(tower.x + tower.w, tower.y + tower.d, tower.h);
  const c3 = V(tower.x, tower.y + tower.d, tower.h);
  out.push(quad(cam, c0, c1, apex, apex, tint(C.roof, 0.95)));
  out.push(
    cam.eye.x >= tower.x + tower.w / 2
      ? quad(cam, c1, c2, apex, apex, tint(C.roof, 1.22))
      : quad(cam, c0, c3, apex, apex, tint(C.roof, 0.7))
  );

  const crossZ = 66;
  out.push(boxFaces(cam, { x: -0.5, y: -24, z: crossZ, w: 1, d: 1, h: 9 }, C.gold));
  out.push(boxFaces(cam, { x: -3, y: -24, z: crossZ + 5.4, w: 6, d: 1, h: 1 }, C.gold));
  const cp = cam.project(V(0, -23.5, crossZ + 6));
  if (cp.z > 1) glows.push({ x: cp.x, y: cp.y, r: Math.max(px(7), cam.scale(7, cp.z)), color: C.gold, op: 0.5 });

  // The rose window over the door.
  const rose = cam.project(V(0, tower.y - 0.3, 26));
  if (rose.z > 1) {
    const rr = cam.scale(4.2, rose.z);
    out.push(circle(rose.x, rose.y, rr * 1.12, darken(stoneLit, 0.25)));
    out.push(circle(rose.x, rose.y, rr, mix(C.warm, C.glow, 0.5), ` opacity="0.92"`));
    if (rr > px(6)) {
      // Tracery: six spokes and a hub, which is what tells the eye this is a
      // window and not a lamp.
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI;
        out.push(
          `<line x1="${nf(rose.x - Math.cos(a) * rr)}" y1="${nf(rose.y - Math.sin(a) * rr)}" ` +
            `x2="${nf(rose.x + Math.cos(a) * rr)}" y2="${nf(rose.y + Math.sin(a) * rr)}" ` +
            `stroke="${darken(stoneLit, 0.3)}" stroke-width="${nf(Math.max(1, rr * 0.09))}" opacity="0.85"/>`
        );
      }
      out.push(circle(rose.x, rose.y, rr * 0.3, darken(stoneLit, 0.3), ` opacity="0.85"`));
      out.push(circle(rose.x, rose.y, rr * 0.2, C.gold, ` opacity="0.9"`));
    }
    if (rr > px(2)) glows.push({ x: rose.x, y: rose.y, r: rr * 2.4, color: C.warm, op: 0.3 });
  }

  // The door — open, with the light on. This is the entrance the last scene's
  // button stands in front of.
  const door = archOnFace(cam, {
    base: V(-5, tower.y - 0.4, 0),
    across: V(10, 0, 0),
    height: 15,
    fill: "url(#doorlight)",
  });
  out.push(door.svg);
  if (door.center) {
    glows.push({ x: door.center.x, y: door.center.y + door.size * 0.3, r: Math.max(px(10), door.size * 1.5), color: C.warm, op: 0.34 });
  }

  // Light spilling down the steps and out across the square.
  out.push(
    quad(
      cam,
      V(-7, tower.y - 0.4, 0.12), V(7, tower.y - 0.4, 0.12), V(15, -54, 0.12), V(-15, -54, 0.12),
      C.warm,
      ` opacity="0.16" filter="url(#soft)"`
    )
  );

  // Lanterns either side of the steps, and trees along the churchyard.
  if (detail) {
    for (const lx of [-17, 17]) {
      out.push(boxFaces(cam, { x: lx - 0.6, y: -40, z: 0, w: 1.2, d: 1.2, h: 7 }, C.wood));
      const lp = cam.project(V(lx, -39.4, 8));
      if (lp.z > 1) glows.push({ x: lp.x, y: lp.y, r: Math.max(px(5), Math.min(cam.scale(3, lp.z), px(60))), color: C.warm, op: 0.32 });
    }
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      out.push(treeAt(cam, V(side * (30 + rand() * 10), -70 + Math.floor(i / 2) * 26 + rand() * 8, 0), 5 + rand() * 3));
    }
  }

  return out.join("");
}

/**
 * One city scene. `eye`/`target` are the only things that really change
 * between scenes 3 and 7 — everything else is the same model, which is what
 * makes the five frames one continuous fall.
 */
function cityScene({ eye, target, hfov = 56, starOp = 0.5, groundHaze = 0.5, people = 0, detail = false, accent }) {
  const cam = makeCam({ eye, target, hfov });
  const rand = rng(6032);
  const glows = [];
  const horizon = cam.horizon;
  const skyBottom = Math.min(F.H, Math.max(0, horizon));

  // --- ground and streets ---------------------------------------------------
  const ground =
    horizon < F.H
      ? rect(0, Math.max(0, horizon - px(2)), F.W, F.H - Math.max(0, horizon - px(2)), C.ground)
      : rect(0, 0, F.W, F.H, C.ground);

  // Block slabs sit on the ground; the gaps between them are the streets.
  const slabs = [];
  for (const b of cityBlocks()) {
    const q = quad(
      cam,
      V(b.x - INNER, b.y - INNER, 0.05),
      V(b.x + INNER, b.y - INNER, 0.05),
      V(b.x + INNER, b.y + INNER, 0.05),
      V(b.x - INNER, b.y + INNER, 0.05),
      C.block
    );
    if (q) slabs.push(q);
  }

  // The square in front of the church, paved lighter so the eye goes there.
  const plaza = quad(
    cam,
    V(-INNER, -BLOCK - INNER, 0.06),
    V(INNER, -BLOCK - INNER, 0.06),
    V(INNER, -40, 0.06),
    V(-INNER, -40, 0.06),
    mix(C.ground, C.stone, 0.4)
  );

  // --- street lamps ---------------------------------------------------------
  let lamps = "";
  let lampCount = 0;
  for (let gx = -9; gx <= 9 && lampCount < 300; gx++) {
    for (let t = -5; t <= 17 && lampCount < 300; t++) {
      const p = cam.project(V(gx * BLOCK - INNER - 17, t * BLOCK + (t % 2 ? 46 : -46), 7));
      if (p.z <= 8 || p.x < -F.W * 0.1 || p.x > F.W * 1.1 || p.y < 0 || p.y > F.H * 1.1) continue;
      lamps += lamp(p.x, p.y, Math.max(px(1.1), cam.scale(1.5, p.z)), C.warm, clamp(0.3 + 700 / p.z, 0.3, 1));
      lampCount++;
    }
  }

  // --- the city itself ------------------------------------------------------
  // Windows are what the frame is made of and also what the file is made of:
  // a whole city's worth of them runs to megabytes. They are drawn
  // nearest-first against a fixed budget, so the detail lands where the eye
  // is and the far blocks fall back to lit dots.
  const visible = [];
  for (const b of BUILDINGS) {
    const c = cam.project(V(b.x + b.w / 2, b.y + b.d / 2, b.h / 2));
    if (c.z <= 40) continue;                                   // beside us, or behind
    const on = cam.scale(Math.max(b.w, b.h), c.z);
    if (on < px(2)) continue;                                  // too far to matter
    if (c.x < -F.W * 0.3 || c.x > F.W * 1.3 || c.y > F.H * 1.35) continue;
    visible.push({ b, depth: c.z, on });
  }
  visible.sort((a, b) => a.depth - b.depth);

  const budget = { left: 1200 };
  const items = [];
  for (const { b, depth, on } of visible) {
    const brand = rng(b.seed);
    let svg = boxFaces(cam, b, b.color, on < px(14));
    if (on > px(46) && budget.left > 0) {
      const rows = Math.max(2, Math.round(b.h / 6));
      svg += faceWindows(cam, V(b.x, b.y, 0), V(b.w, 0, 0), V(0, 0, b.h), Math.max(2, Math.round(b.w / 7)), rows, brand, { lit: 0.34, budget });
      if (cam.eye.x > b.x + b.w) {
        svg += faceWindows(cam, V(b.x + b.w, b.y, 0), V(0, b.d, 0), V(0, 0, b.h), Math.max(2, Math.round(b.d / 7)), rows, brand, { lit: 0.3, budget });
      } else if (cam.eye.x < b.x) {
        svg += faceWindows(cam, V(b.x, b.y, 0), V(0, b.d, 0), V(0, 0, b.h), Math.max(2, Math.round(b.d / 7)), rows, brand, { lit: 0.22, budget });
      }
    } else if (on > px(7)) {
      // Too far for windows to survive rounding: a few lit dots instead.
      for (let k = 0; k < 4; k++) {
        const p = cam.project(V(b.x + brand() * b.w, b.y, brand() * b.h));
        if (p.z > 1) svg += circle(p.x, p.y, Math.max(px(0.7), on * 0.04), C.warm, ` opacity="${nf(0.3 + brand() * 0.5)}"`);
      }
    }
    items.push({ depth, svg });
  }

  // The church rides in the same depth-sorted list as everything else.
  items.push({ depth: cam.project(V(0, 0, 20)).z, svg: church(cam, glows, detail) });
  items.sort((a, b) => b.depth - a.depth);

  // People on the square, once the camera is low enough for them to read.
  let crowd = "";
  for (let i = 0; i < people; i++) {
    crowd += personAt(
      cam,
      V((rand() - 0.5) * 76, -48 - rand() * 96, 0),
      [C.cloth, C.wall, C.wood, C.gold][Math.floor(rand() * 4)]
    );
  }

  const defs =
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${C.space}"/>` +
    `<stop offset="0.5" stop-color="${C.night}"/>` +
    `<stop offset="1" stop-color="${mix(C.night, accent, 0.34)}"/></linearGradient>` +
    `<radialGradient id="doorlight" cx="0.5" cy="0.9" r="0.95">` +
    `<stop offset="0" stop-color="${lighten(C.glow, 0.35)}"/>` +
    `<stop offset="0.5" stop-color="${C.warm}"/>` +
    `<stop offset="1" stop-color="${mix(C.warm, "#7A3E12", 0.6)}"/></radialGradient>`;

  const sky =
    rect(0, 0, F.W, F.H, "url(#sky)") +
    (skyBottom > 4 ? stars(31, Math.round(220 * starOp) + 30, skyBottom, starOp) : "") +
    // The city's own light, bounced back off the air above the horizon.
    (horizon > -F.H * 0.25 && horizon < F.H * 1.15
      ? `<ellipse cx="${nf(F.W * 0.5)}" cy="${nf(horizon)}" rx="${nf(F.W * 0.9)}" ry="${nf(F.H * 0.24 * groundHaze + px(30))}" fill="${accent}" opacity="${nf(0.24 * groundHaze)}" filter="url(#haze)"/>`
      : "");

  // Bloom, with a ceiling on both radius and strength. Close to the church a
  // halo scaled straight off the projection would be wider than the frame.
  const bloom = glows
    .map((g) => {
      const r = Math.min(g.r, px(190));
      const op = g.op * clamp(px(190) / Math.max(g.r, 1), 0.45, 1);
      return circle(g.x, g.y, r, g.color, ` opacity="${nf(op)}" filter="url(#bloom)"`);
    })
    .join("");

  const body =
    sky +
    ground +
    slabs.join("") +
    plaza +
    items.map((i) => i.svg).join("") +
    crowd +
    lamps +
    bloom +
    // A last breath of air between the camera and the city.
    (groundHaze > 0.2
      ? rect(0, F.H * 0.6, F.W, F.H * 0.4, mix(C.night, accent, 0.35), ` opacity="${nf(0.12 * groundHaze)}" filter="url(#haze)"`)
      : "");

  return { defs, body };
}

// ---------------------------------------------------------------------------
// The seven scenes, in the order the camera falls through them
// ---------------------------------------------------------------------------

const SCENES = [
  // 1 — orbit. The whole earth, night creeping over the archipelago.
  { id: "terang", build: sceneOrbit },
  // 2 — the atmosphere, from just above the cloud deck.
  { id: "renungan", build: sceneAtmosphere },
  {
    // 3 — first sight of the ground: a city grid at night, the church still
    // just a lit spire somewhere in the middle of it.
    id: "alkitab",
    build: () =>
      cityScene({
        eye: V(0, -1150, 900),
        target: V(0, 60, 0),
        hfov: 62,
        starOp: 0.35,
        groundHaze: 0.85,
        accent: "#2E6E7A",
      }),
  },
  {
    // 4 — lower: individual roofs and lit windows, the cross now clearly above
    // everything around it.
    id: "doa",
    build: () =>
      cityScene({
        eye: V(0, -470, 300),
        target: V(0, 20, 20),
        hfov: 58,
        starOp: 0.45,
        groundHaze: 0.7,
        accent: "#3E7E76",
      }),
  },
  {
    // 5 — rooftop height, on the approach: the church has the frame now.
    id: "pastor",
    build: () =>
      cityScene({
        eye: V(0, -235, 78),
        target: V(0, -6, 32),
        hfov: 56,
        starOp: 0.55,
        groundHaze: 0.55,
        people: 6,
        accent: "#4FA882",
      }),
  },
  {
    // 6 — on the square, looking up at the facade: people, lanterns, open door.
    id: "circle",
    build: () =>
      cityScene({
        eye: V(0, -178, 16),
        target: V(0, -26, 31),
        hfov: 58,
        starOp: 0.6,
        groundHaze: 0.4,
        people: 14,
        detail: true,
        accent: "#5FB98C",
      }),
  },
  {
    // 7 — the last frame of the fall: the doorway, at the top of the steps.
    id: "mulai",
    build: () =>
      cityScene({
        eye: V(0, -122, 6),
        target: V(0, -31, 18),
        hfov: 58,
        starOp: 0.5,
        groundHaze: 0.25,
        people: 4,
        detail: true,
        accent: "#C89B3C",
      }),
  },
];

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });

for (const scene of SCENES) {
  for (const fmt of FORMATS) {
    F = fmt;
    const { defs, body } = scene.build();
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${F.W}" height="${F.H}" ` +
      `viewBox="0 0 ${F.W} ${F.H}" preserveAspectRatio="xMidYMid slice">` +
      `<defs>${COMMON_DEFS()}${defs}</defs>` +
      rect(0, 0, F.W, F.H, C.space) +
      body +
      `</svg>`;
    writeFileSync(resolve(OUT, `${scene.id}${F.suffix}.svg`), svg);
    console.log(`  ${scene.id}${F.suffix}.svg  ${(svg.length / 1024).toFixed(0)} KB`);
  }
}

console.log(`\n${SCENES.length} scenes x ${FORMATS.length} formats -> ${OUT}`);
