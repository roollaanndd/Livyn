// Renders the landing page's diorama scenes to SVG.
//
//   node scripts/build-scenes.mjs
//
// The scroll-world skill (github.com/oso95/scroll-world) generates its scenes
// as AI stills from one shared "style preamble" repeated verbatim in every
// prompt — that repetition is what keeps the world cohesive. This file is the
// same idea expressed as code: one isometric projection, one palette, one
// light direction, one set of primitives, reused by every scene. Cohesion
// comes out by construction instead of out of prompt discipline, and it costs
// no image-generation credits.
//
// Output: public/scroll-world/scenes/<id>.svg — one still per landing section,
// which is also exactly the slot a generated camera clip's poster would take,
// so swapping in real clips later is additive (see README → Landing page).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/scroll-world/scenes");

// ---------------------------------------------------------------------------
// The style preamble, as constants
// ---------------------------------------------------------------------------

// Every scene is rendered twice. The portrait cut is not a crop of the
// landscape one — it is the same world re-projected for a 9:16 frame, which is
// what the skill asks for on mobile and what a hard centre-crop of a 16:9
// still can't give you (on a phone it shows barely a third of the diorama).
// Generated art makes that free; only the AI pipeline has to pay for it twice.
const FORMATS = [
  { suffix: "", W: 1920, H: 1080, U: 57, OX: 960, OY: 548 },
  { suffix: "-m", W: 1080, H: 1920, U: 54, OX: 540, OY: 880 },
];

// The camera in use while a scene is being written out.
let CAM = FORMATS[0];

// Isometric projection. One world unit is CAM.U screen px; +x runs to the
// lower right, +y to the lower left, +z straight up. The camera sits at large
// x+y, so the visible vertical faces of a box are always its +x and +y sides.
// U is set so a ~9-unit island clears the frame with margin to spare: the
// engine covers the viewport with these stills, so whichever axis the
// viewport's aspect ratio crops must have room to give.
const iso = (x, y, z) =>
  [CAM.OX + (x - y) * 0.866 * CAM.U, CAM.OY + (x + y) * 0.5 * CAM.U - z * CAM.U];

// A circle on the ground plane projects to an axis-aligned ellipse: the
// screen-x amplitude is 0.866·√2·r and the screen-y amplitude is 0.5·√2·r.
const isoRx = (r) => 0.866 * Math.SQRT2 * CAM.U * r;
const isoRy = (r) => 0.5 * Math.SQRT2 * CAM.U * r;

/** Pixel sizes that aren't derived from the projection — glow radii, shadow
 *  spreads — still have to follow the zoom. Written at the landscape scale. */
const px = (n) => (n * CAM.U) / 57;

const PALETTE = {
  night: "#0A1610",
  nightDeep: "#060F0A",
  soil: "#1B3527",
  grass: "#2F7D5F",
  stone: "#20463A",
  wall: "#EDE6D6",
  wallWarm: "#DBC9A8",
  roof: "#C89B3C",
  roofDeep: "#9F7827",
  wood: "#8A6A44",
  water: "#3E9C86",
  gold: "#E8C877",
  glow: "#F2DFA8",
  sage: "#4FA882",
  sageDeep: "#2D7D5F",
  leaf: "#3E9573",
  cloth: "#C9705A",
};

// Light comes from the upper right and slightly behind: top faces are lifted,
// +y faces (screen left) fall into shade.
const TOP_LIFT = 0.2;
const RIGHT_LIFT = 0.02;
const LEFT_DROP = 0.26;

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

const hex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
const parse = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (c, t, amt) => {
  const a = parse(c);
  const b = parse(t);
  return "#" + a.map((v, i) => hex(v + (b[i] - v) * amt)).join("");
};
const lighten = (c, amt) => mix(c, "#FFFFFF", amt);
const darken = (c, amt) => mix(c, "#000000", amt);

// ---------------------------------------------------------------------------
// Primitives — every scene is built from these, which is what makes the set
// read as one world.
// ---------------------------------------------------------------------------

const fmt = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const poly = (pts, fill, extra = "") => `<polygon points="${fmt(pts)}" fill="${fill}"${extra}/>`;

/** A box with its base corner at (x,y,z), extending +w, +d, +h. */
function box(x, y, z, w, d, h, color, opts = {}) {
  const top = opts.top ?? lighten(color, TOP_LIFT);
  const right = opts.right ?? lighten(color, RIGHT_LIFT);
  const left = opts.left ?? darken(color, LEFT_DROP);
  return [
    poly(
      [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)],
      top
    ),
    poly(
      [iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h)],
      right
    ),
    poly(
      [iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x, y + d, z + h)],
      left
    ),
  ].join("");
}

/** A cylinder: iso-ellipse cap over a straight body. */
function cyl(cx, cy, z, r, h, color) {
  const [bx, by] = iso(cx, cy, z);
  const [tx, ty] = iso(cx, cy, z + h);
  const rx = isoRx(r);
  const ry = isoRy(r);
  return [
    `<path d="M${(bx - rx).toFixed(1)},${by.toFixed(1)} A${rx.toFixed(1)},${ry.toFixed(1)} 0 0 0 ${(bx + rx).toFixed(1)},${by.toFixed(1)} L${(tx + rx).toFixed(1)},${ty.toFixed(1)} A${rx.toFixed(1)},${ry.toFixed(1)} 0 0 1 ${(tx - rx).toFixed(1)},${ty.toFixed(1)} Z" fill="${darken(color, 0.12)}"/>`,
    `<ellipse cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${lighten(color, TOP_LIFT)}"/>`,
  ].join("");
}

/** A flat disc lying on the ground plane, e.g. a rug or a pool. */
function disc(cx, cy, z, r, color, extra = "") {
  const [x, y] = iso(cx, cy, z);
  return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${isoRx(r).toFixed(1)}" ry="${isoRy(r).toFixed(1)}" fill="${color}"${extra}/>`;
}

/** A pitched roof sitting on a w×d footprint at height z. `open` drops the
 *  near slope, the cutaway trick that lets the camera see the interior. */
function roof(x, y, z, w, d, h, color, open = false) {
  const ridgeA = iso(x, y + d / 2, z + h);
  const ridgeB = iso(x + w, y + d / 2, z + h);
  return [
    // Far slope first, then the two the camera actually sees.
    poly([iso(x, y, z), iso(x + w, y, z), ridgeB, ridgeA], lighten(color, 0.14)),
    open
      ? ""
      : poly([iso(x, y + d, z), iso(x + w, y + d, z), ridgeB, ridgeA], darken(color, 0.2)),
    poly([iso(x, y, z), iso(x, y + d, z), ridgeA], darken(color, 0.3)),
    poly([iso(x + w, y, z), iso(x + w, y + d, z), ridgeB], lighten(color, 0.04)),
  ].join("");
}

/** The floating island every scene sits on: a slab of soil with a grass top
 *  and a tapered underside, plus the shadow it casts into the dark. */
function island(x, y, w, d, opts = {}) {
  const h = opts.h ?? 1.1;
  const grass = opts.grass ?? PALETTE.grass;
  const soil = opts.soil ?? PALETTE.soil;
  const apex = iso(x + w / 2, y + d / 2, -(opts.taper ?? 4.6));
  const [sx, sy] = iso(x + w / 2, y + d / 2, -(opts.taper ?? 4.6) - 1.2);
  return [
    // Ground shadow, well below the island so it reads as height not contact.
    `<ellipse cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" rx="${px(w * 26).toFixed(1)}" ry="${px(w * 8).toFixed(1)}" fill="url(#swContact)"/>`,
    box(x, y, 0, w, d, h, soil, { top: grass }),
    // Underside: the two faces the camera can see, drawn down to a point.
    poly([iso(x + w, y, 0), iso(x + w, y + d, 0), apex], darken(soil, 0.34)),
    poly([iso(x, y + d, 0), iso(x + w, y + d, 0), apex], darken(soil, 0.52)),
  ].join("");
}

/** Low-poly tree: a trunk under two stacked, offset canopies. */
function tree(cx, cy, z, scale = 1, color = PALETTE.leaf) {
  const t = 0.22 * scale;
  return [
    box(cx - t / 2, cy - t / 2, z, t, t, 0.9 * scale, PALETTE.wood),
    box(cx - 0.62 * scale, cy - 0.62 * scale, z + 0.8 * scale, 1.24 * scale, 1.24 * scale, 0.9 * scale, color),
    box(cx - 0.42 * scale, cy - 0.42 * scale, z + 1.62 * scale, 0.84 * scale, 0.84 * scale, 0.66 * scale, lighten(color, 0.1)),
  ].join("");
}

/** A person, small enough to set the diorama's scale. */
function figure(cx, cy, z, color = PALETTE.cloth, scale = 1) {
  const b = 0.26 * scale;
  return [
    box(cx - b / 2, cy - b / 2, z, b, b, 0.62 * scale, color),
    box(cx - b / 2, cy - b / 2, z + 0.62 * scale, b, b, 0.24 * scale, PALETTE.wallWarm),
  ].join("");
}

/** A warm point light: the glow plus the thing that emits it. */
function lamp(cx, cy, z, r = 0.9, color = PALETTE.glow) {
  const [x, y] = iso(cx, cy, z);
  return [
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${px(r * 130).toFixed(1)}" fill="${color}" opacity="0.14" filter="url(#swSoft)"/>`,
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${px(r * 52).toFixed(1)}" fill="${color}" opacity="0.3" filter="url(#swSoft)"/>`,
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${px(r * 11).toFixed(1)}" fill="${lighten(color, 0.5)}"/>`,
  ].join("");
}

/** A shaft of light falling from off-frame onto a point in the scene. */
function beam(cx, cy, z, color) {
  const [x, y] = iso(cx, cy, z);
  return poly(
    [
      [x - 120, -40],
      [x + 190, -40],
      [x + 96, y],
      [x - 60, y],
    ],
    color,
    ` opacity="0.09" filter="url(#swSoft)"`
  );
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

/** Deterministic jitter, so re-running the script produces identical files. */
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

function motes(seed, accent) {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < 26; i++) {
    const x = r() * CAM.W;
    const y = 80 + r() * (CAM.H - 260);
    const rad = 1.4 + r() * 2.6;
    const dur = (7 + r() * 9).toFixed(1);
    out +=
      `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(1)}" fill="${i % 5 === 0 ? accent : PALETTE.glow}" opacity="0">` +
      `<animate attributeName="opacity" values="0;0.5;0" dur="${dur}s" begin="${(r() * 9).toFixed(1)}s" repeatCount="indefinite"/>` +
      `</circle>`;
  }
  return out;
}

const SCENES = [];
const scene = (id, accent, build) => SCENES.push({ id, accent, build });

// 1 — the hero: a hill at first light, one path, one lamp at the top.
scene("terang", "#C89B3C", (a) =>
  [
    beam(0.5, -1, 6.4, PALETTE.glow),
    island(-5, -5, 10, 10, { taper: 5.2 }),
    // The hill: three stacked, shrinking slabs read as terraces.
    box(-3.4, -3.4, 1.1, 6.8, 6.8, 0.7, PALETTE.grass),
    box(-2.3, -2.3, 1.8, 4.6, 4.6, 0.7, lighten(PALETTE.grass, 0.06)),
    box(-1.2, -1.2, 2.5, 2.4, 2.4, 0.6, lighten(PALETTE.grass, 0.12)),
    // A path of stepping stones climbing the terraces towards the lamp.
    disc(2.4, 2.4, 1.11, 0.3, darken(PALETTE.grass, 0.3)),
    disc(1.5, 1.9, 1.81, 0.3, darken(PALETTE.grass, 0.26)),
    disc(0.7, 1.1, 2.51, 0.3, darken(PALETTE.grass, 0.22)),
    tree(-2.6, 1.9, 1.8, 1.05),
    tree(2.5, -2.2, 1.8, 0.8, PALETTE.sage),
    tree(-1.4, 3.1, 1.8, 0.7),
    figure(1.1, 1.9, 1.81, PALETTE.cloth, 1),
    // The lamp post at the summit.
    box(-0.12, -0.12, 3.1, 0.24, 0.24, 1.5, PALETTE.wood),
    box(-0.32, -0.32, 4.6, 0.64, 0.64, 0.62, a),
    lamp(0, 0, 5.1, 1.25),
  ].join("")
);

// 2 — devotions: an open pavilion with a lit reading stand.
scene("renungan", "#4FA882", () =>
  [
    beam(-0.6, -1.6, 5.6, PALETTE.glow),
    island(-4.6, -4.6, 9.2, 9.2, { taper: 4.4 }),
    box(-3, -3, 1.1, 6, 6, 0.24, PALETTE.wallWarm),
    // Four posts carrying a pitched roof — walls left off so the eye gets in.
    box(-2.7, -2.7, 1.34, 0.3, 0.3, 2.5, PALETTE.wood),
    box(2.4, -2.7, 1.34, 0.3, 0.3, 2.5, PALETTE.wood),
    box(-2.7, 2.4, 1.34, 0.3, 0.3, 2.5, PALETTE.wood),
    box(2.4, 2.4, 1.34, 0.3, 0.3, 2.5, PALETTE.wood),
    // The reading stand: a plinth, a sloped desk, an open page.
    box(-0.55, -0.55, 1.34, 1.1, 1.1, 0.9, PALETTE.stone),
    box(-0.75, -0.6, 2.24, 1.5, 1.2, 0.12, PALETTE.wood),
    poly(
      [iso(-0.75, -0.6, 2.36), iso(0, -0.6, 2.62), iso(0, 0.6, 2.62), iso(-0.75, 0.6, 2.36)],
      PALETTE.wall
    ),
    poly(
      [iso(0, -0.6, 2.62), iso(0.75, -0.6, 2.36), iso(0.75, 0.6, 2.36), iso(0, 0.6, 2.62)],
      lighten(PALETTE.wall, 0.06)
    ),
    lamp(0, 0, 3.4, 1.1),
    // A pergola, not a roof: at this camera angle any solid roof would sit
    // straight over the reading stand and hide the whole point of the scene.
    box(-3, -3, 3.84, 6, 0.3, 0.26, PALETTE.wood),
    box(-3, 2.7, 3.84, 6, 0.3, 0.26, PALETTE.wood),
    box(-3, -3, 3.84, 0.3, 6, 0.26, PALETTE.wood),
    box(2.7, -3, 3.84, 0.3, 6, 0.26, PALETTE.wood),
    ...[0, 1, 2, 3, 4].map((k) =>
      box(-2.4 + k * 1.2, -3, 4.06, 0.2, 6, 0.14, PALETTE.roof)
    ),
    figure(1.7, 0.4, 1.34, PALETTE.cloth),
    tree(-3.7, 2.8, 1.1, 0.85),
    tree(3.5, -2.4, 1.1, 0.7, PALETTE.sage),
  ].join("")
);

// 3 — scripture: a colonnade of 66 columns, receding into warm light.
scene("alkitab", "#6BCFA0", (a) => {
  const cols = [];
  for (let i = 0; i < 6; i++) {
    const y = -3.4 + i * 1.36;
    cols.push(box(-3.4, y, 1.34, 0.42, 0.42, 2.9, PALETTE.wall));
    cols.push(box(3, y, 1.34, 0.42, 0.42, 2.9, PALETTE.wall));
    // Book spines stacked along the aisle walls.
    for (let k = 0; k < 3; k++) {
      const c = [a, PALETTE.roof, PALETTE.sage][(i + k) % 3];
      cols.push(box(-2.6 + k * 0.2, y + 0.05, 1.34, 0.16, 0.34, 0.5 + ((i + k) % 3) * 0.12, c));
      cols.push(box(2.42 + k * 0.2, y + 0.05, 1.34, 0.16, 0.34, 0.5 + ((i + k * 2) % 3) * 0.12, c));
    }
  }
  return [
    beam(0, 3, 6, a),
    island(-4.4, -4.4, 8.8, 8.8, { taper: 4.6 }),
    box(-3.6, -4, 1.1, 7.2, 8, 0.24, PALETTE.wallWarm),
    disc(0, 0.6, 1.35, 1.9, darken(PALETTE.wallWarm, 0.16)),
    cols.join(""),
    // The far wall closes the hall and catches the light.
    box(-3.6, -4.2, 1.34, 7.2, 0.4, 3.4, darken(PALETTE.wall, 0.06)),
    lamp(0, -3.6, 3.2, 1.3, a),
    figure(0.4, 1.6, 1.34, PALETTE.cloth),
    // The hall stays open to the sky — a roof here would hide the whole nave.
    // Just an architrave capping the two colonnades.
    box(-3.5, -4, 4.24, 0.62, 8, 0.28, lighten(PALETTE.wall, 0.04)),
    box(2.9, -4, 4.24, 0.62, 8, 0.28, darken(PALETTE.wall, 0.06)),
  ].join("");
});

// 4 — prayer: a small chapel ringed by candles.
scene("doa", "#D4A853", (a) => {
  const ring = [];
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const cx = Math.cos(ang) * 2.8;
    const cy = Math.sin(ang) * 2.8;
    ring.push(cyl(cx, cy, 1.34, 0.13, 0.34, PALETTE.wall));
    const [lx, ly] = iso(cx, cy, 1.78);
    ring.push(
      `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="26" fill="${a}" opacity="0.26" filter="url(#swSoft)">` +
        `<animate attributeName="opacity" values="0.18;0.34;0.18" dur="${(3 + i * 0.4).toFixed(1)}s" repeatCount="indefinite"/>` +
        `</circle>` +
        `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4.5" fill="${PALETTE.glow}"/>`
    );
  }
  return [
    beam(0, 0, 6.6, a),
    island(-4.6, -4.6, 9.2, 9.2, { taper: 4.8 }),
    disc(0, 0, 1.11, 3.6, darken(PALETTE.wallWarm, 0.1)),
    box(-1.5, -1.5, 1.1, 3, 3, 2.6, PALETTE.wall),
    // Arched doorway, dark so the interior reads as depth.
    poly(
      [iso(1.5, -0.5, 1.1), iso(1.5, 0.5, 1.1), iso(1.5, 0.5, 2.5), iso(1.5, -0.5, 2.5)],
      darken(PALETTE.stone, 0.4)
    ),
    roof(-1.7, -1.7, 3.7, 3.4, 3.4, 1.5, a),
    // A slender cross on the ridge.
    box(-0.06, -0.06, 5.2, 0.12, 0.12, 0.9, PALETTE.gold),
    box(-0.3, -0.06, 5.62, 0.6, 0.12, 0.12, PALETTE.gold),
    ring.join(""),
    figure(2.3, 1.5, 1.11, PALETTE.cloth),
    tree(-3.5, -1.2, 1.1, 0.75),
    lamp(0, 0, 4.4, 1.5, a),
  ].join("");
});

// 5 — AI pastor: two chairs, one warm listening light between them.
scene("pastor", "#58B98C", (a) =>
  [
    beam(0.4, 0.4, 5.4, a),
    island(-4.2, -4.2, 8.4, 8.4, { taper: 4.2 }),
    disc(0, 0, 1.11, 3, darken(PALETTE.wallWarm, 0.08)),
    disc(0, 0, 1.12, 2.2, PALETTE.cloth, ' opacity="0.5"'),
    // Two chairs facing each other across the rug.
    box(-2.2, -0.5, 1.1, 1, 1, 0.5, PALETTE.wood),
    box(-2.2, -0.5, 1.6, 0.24, 1, 0.8, lighten(PALETTE.wood, 0.1)),
    box(1.2, -0.5, 1.1, 1, 1, 0.5, PALETTE.wood),
    box(1.96, -0.5, 1.6, 0.24, 1, 0.8, lighten(PALETTE.wood, 0.1)),
    figure(-1.7, 0, 1.6, PALETTE.cloth, 0.9),
    // The companion: a soft floating orb rather than a second person.
    lamp(1.7, 0, 2.2, 1.35, a),
    // A low table with a cup.
    cyl(0, 0, 1.11, 0.55, 0.5, PALETTE.wall),
    cyl(0, 0, 1.61, 0.16, 0.18, a),
    // Two walls meeting at the back corner give the room its depth; a shelf of
    // books and a tall window keep the reading-room read.
    box(-3.4, -3.6, 1.1, 6.8, 0.32, 2.9, PALETTE.wall),
    box(-3.6, -3.6, 1.1, 0.32, 6.8, 2.9, darken(PALETTE.wall, 0.12)),
    poly(
      [iso(0.6, -3.28, 1.9), iso(2.1, -3.28, 1.9), iso(2.1, -3.28, 3.6), iso(0.6, -3.28, 3.6)],
      "url(#swScreen)"
    ),
    box(-2.9, -3.28, 1.1, 1.9, 0.3, 0.24, PALETTE.wood),
    ...[0, 1, 2, 3, 4, 5].map((k) =>
      box(-2.82 + k * 0.3, -3.24, 1.34, 0.2, 0.24, 0.44 + (k % 3) * 0.1, [a, PALETTE.roof, PALETTE.cloth][k % 3])
    ),
    tree(-3.2, 2.6, 1.1, 0.8),
    tree(3.1, -1.8, 1.1, 0.65, PALETTE.sage),
  ].join("")
);

// 6 — circles: a round table on a plaza, a few people around it.
scene("circle", "#4FA882", (a) => {
  const seats = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + 0.3;
    const cx = Math.cos(ang) * 2.1;
    const cy = Math.sin(ang) * 2.1;
    seats.push(cyl(cx, cy, 1.11, 0.28, 0.42, PALETTE.wood));
    seats.push(
      figure(cx, cy, 1.53, [PALETTE.cloth, a, PALETTE.roof, PALETTE.sage][i % 4], 0.92)
    );
  }
  return [
    beam(0, 0, 5.6, a),
    island(-4.6, -4.6, 9.2, 9.2, { taper: 4.4 }),
    disc(0, 0, 1.11, 3.4, darken(PALETTE.wallWarm, 0.12)),
    // Four posts and a string of lanterns over the table — the canopy is left
    // off so nothing blocks the circle itself.
    ...[
      [-3.2, -3.2],
      [3, -3.2],
      [-3.2, 3],
      [3, 3],
    ].map(([px, py]) => box(px, py, 1.11, 0.22, 0.22, 2.6, PALETTE.wood)),
    ...[
      [-3.1, -1.4],
      [-1.4, -3.1],
      [3.1, 1.4],
      [1.4, 3.1],
    ].map(([px, py]) => lamp(px, py, 3.5, 0.5, PALETTE.glow)),
    seats.join(""),
    cyl(0, 0, 1.11, 1.4, 0.78, PALETTE.wall),
    disc(0, 0, 1.9, 1.35, lighten(PALETTE.wall, 0.12)),
    lamp(0, 0, 2.3, 1.3, a),
    // A low wall ringing the plaza, broken so the circle stays open.
    box(-3.9, 3.3, 1.1, 7.8, 0.4, 0.62, PALETTE.wallWarm),
    box(-3.9, -3.7, 1.1, 3, 0.4, 0.62, PALETTE.wallWarm),
    box(0.9, -3.7, 1.1, 3, 0.4, 0.62, PALETTE.wallWarm),
    tree(-3.7, -1.6, 1.1, 0.85),
    tree(3.7, 1.4, 1.1, 0.75, PALETTE.sage),
  ].join("");
});

// 7 — the finale: the app itself, on a plinth, lit like an object.
scene("mulai", "#C89B3C", (a) =>
  [
    beam(0, 0, 7.4, PALETTE.glow),
    island(-4.4, -4.4, 8.8, 8.8, { taper: 5 }),
    // Stepped plinth.
    box(-2.6, -2.6, 1.1, 5.2, 5.2, 0.5, PALETTE.stone),
    box(-1.9, -1.9, 1.6, 3.8, 3.8, 0.5, mix(PALETTE.stone, PALETTE.wallWarm, 0.25)),
    box(-1.2, -1.2, 2.1, 2.4, 2.4, 0.5, mix(PALETTE.stone, PALETTE.wallWarm, 0.5)),
    lamp(0, 0, 4.6, 1.9),
    // The phone: a slab stood on end, screen towards the camera.
    box(-0.14, -0.75, 2.6, 0.28, 1.5, 3.1, darken(PALETTE.stone, 0.3)),
    poly(
      [iso(0.14, -0.66, 2.72), iso(0.14, 0.66, 2.72), iso(0.14, 0.66, 5.58), iso(0.14, -0.66, 5.58)],
      "url(#swScreen)"
    ),
    // The Livyn mark on the screen: a leaf over a rising stroke.
    poly(
      [iso(0.15, 0.06, 4.72), iso(0.15, -0.42, 4.18), iso(0.15, 0.06, 3.64), iso(0.15, 0.54, 4.18)],
      lighten(a, 0.18)
    ),
    poly(
      [iso(0.15, 0.16, 3.5), iso(0.15, -0.16, 3.5), iso(0.15, -0.16, 3.4), iso(0.15, 0.16, 3.4)],
      PALETTE.wall
    ),
    poly(
      [iso(0.15, 0.34, 3.16), iso(0.15, -0.34, 3.16), iso(0.15, -0.34, 3.06), iso(0.15, 0.34, 3.06)],
      mix(PALETTE.wall, PALETTE.night, 0.5)
    ),
    figure(2.2, 1.8, 1.11, PALETTE.cloth),
    // Trees sit clear of the phone's silhouette: anything nearer the camera
    // than the plinth paints over it, and the hero object must stay unbroken.
    tree(-3.3, 1.9, 1.1, 0.8),
    tree(3.6, -0.6, 1.1, 0.68, PALETTE.sage),
    tree(-2.2, -3.2, 1.1, 0.6),
  ].join("")
);

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

const defs = (accent) => `
  <defs>
    <radialGradient id="swSky" cx="52%" cy="34%" r="78%">
      <stop offset="0%" stop-color="${mix(PALETTE.night, accent, 0.22)}"/>
      <stop offset="52%" stop-color="${PALETTE.night}"/>
      <stop offset="100%" stop-color="${PALETTE.nightDeep}"/>
    </radialGradient>
    <radialGradient id="swHalo" cx="50%" cy="42%" r="52%">
      <stop offset="0%" stop-color="${PALETTE.glow}" stop-opacity="0.2"/>
      <stop offset="60%" stop-color="${accent}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="swContact" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${PALETTE.nightDeep}" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="${PALETTE.nightDeep}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="swScreen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${mix(PALETTE.night, accent, 0.55)}"/>
      <stop offset="100%" stop-color="${mix(PALETTE.night, accent, 0.14)}"/>
    </linearGradient>
    <filter id="swSoft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
    <radialGradient id="swVignette" cx="50%" cy="46%" r="72%">
      <stop offset="55%" stop-color="${PALETTE.nightDeep}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${PALETTE.nightDeep}" stop-opacity="0.72"/>
    </radialGradient>
  </defs>`;

mkdirSync(OUT, { recursive: true });

for (const format of FORMATS) {
  CAM = format;
  const { W, H, suffix } = format;
  for (const [i, s] of SCENES.entries()) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">` +
      defs(s.accent) +
      `<rect width="${W}" height="${H}" fill="url(#swSky)"/>` +
      `<rect width="${W}" height="${H}" fill="url(#swHalo)"/>` +
      motes(1009 + i * 37, s.accent) +
      `<g>${s.build(s.accent)}</g>` +
      // Vignette: darkened corners keep the eye on the diorama, the same job
      // tilt-shift does in the reference art direction. It also means the frame
      // edges — which `object-fit:cover` crops differently per viewport — carry
      // no detail anyone can miss.
      `<rect width="${W}" height="${H}" fill="url(#swVignette)"/>` +
      `</svg>`;
    writeFileSync(resolve(OUT, `${s.id}${suffix}.svg`), svg + "\n");
    process.stdout.write(`${s.id}${suffix}.svg  ${(svg.length / 1024).toFixed(1)} kB\n`);
  }
}
