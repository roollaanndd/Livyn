// Imports Fooocus-generated scene art into the landing page.
//
//   node scripts/adopt-scenes.mjs <dir>          # import everything it finds
//   node scripts/adopt-scenes.mjs <dir> --dry-run
//   node scripts/adopt-scenes.mjs --reset        # go back to the drawn SVGs
//
// The landing page's scenes start life as SVGs drawn by build-scenes.mjs —
// placeholders standing in for generated art. This script swaps in the real
// thing, one scene at a time: anything it doesn't find keeps its SVG, so a
// half-finished render session still leaves a coherent page.
//
// It writes `scene-manifest.json`, which is what the page actually reads. No
// image processing happens here (and no image dependency is needed): Fooocus
// already emits web-ready PNGs at the right ratios, so this validates them and
// moves them into place.
//
// Prompts and the settings to generate with: tools/fooocus/prompts/README.md

import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCENES_DIR = join(ROOT, "public/scroll-world/scenes");
const MANIFEST = join(ROOT, "src/lib/scroll-world/scene-manifest.json");

/** The seven scenes, in the order the camera visits them. */
const SCENES = ["terang", "renungan", "alkitab", "doa", "pastor", "circle", "mulai"];

const ACCEPTED = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const reset = args.includes("--reset");
const sourceDir = args.find((a) => !a.startsWith("--"));

// ---------------------------------------------------------------------------
// Dimension reading, without pulling in an image library
// ---------------------------------------------------------------------------

/** Width/height straight out of the file header. Returns null if unrecognised. */
function dimensions(file) {
  const buf = readFileSync(file);

  // PNG: IHDR is always the first chunk, width/height at bytes 16..24.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }

  // WebP: VP8X carries the canvas size; VP8 (lossy) and VP8L (lossless) differ.
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const fourcc = buf.toString("ascii", 12, 16);
    if (fourcc === "VP8X") return { w: (buf.readUIntLE(24, 3) & 0xffffff) + 1, h: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
    if (fourcc === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (fourcc === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
  }

  // JPEG: walk the segment chain to the SOFn frame header.
  if (buf.length > 4 && buf.readUInt16BE(0) === 0xffd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0..SOF15, skipping the non-frame markers in that range.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/** A scene URL with a hash of the file's contents on it. The names are fixed,
 *  so without this the service worker, the browser and the CDN all keep
 *  serving whatever art was there before. */
function stamped(file) {
  const path = join(SCENES_DIR, file);
  if (!existsSync(path)) return `/scroll-world/scenes/${file}`;
  const hash = createHash("sha1").update(readFileSync(path)).digest("hex").slice(0, 8);
  return `/scroll-world/scenes/${file}?v=${hash}`;
}

const svgManifest = () =>
  Object.fromEntries(
    SCENES.map((id) => [id, { still: stamped(`${id}.svg`), stillMobile: stamped(`${id}-m.svg`) }])
  );

function readManifest() {
  if (!existsSync(MANIFEST)) return svgManifest();
  try {
    return { ...svgManifest(), ...JSON.parse(readFileSync(MANIFEST, "utf8")) };
  } catch {
    console.warn("manifest was unreadable — starting from the drawn SVGs");
    return svgManifest();
  }
}

function writeManifest(manifest) {
  mkdirSync(dirname(MANIFEST), { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (reset) {
  if (dryRun) {
    console.log("would reset every scene back to its drawn SVG");
  } else {
    writeManifest(svgManifest());
    console.log("Reset: all seven scenes are back to the drawn SVGs.");
  }
  process.exit(0);
}

if (!sourceDir) {
  console.error("usage: node scripts/adopt-scenes.mjs <dir-of-generated-images> [--dry-run]");
  console.error("       node scripts/adopt-scenes.mjs --reset");
  process.exit(2);
}

const src = resolve(sourceDir);
if (!existsSync(src)) {
  console.error(`no such directory: ${src}`);
  process.exit(1);
}

const manifest = readManifest();
let adopted = 0;
let skipped = 0;

// Index the source directory by basename so nested Fooocus output dates work.
const candidates = new Map();
for (const entry of readdirSync(src, { withFileTypes: true, recursive: true })) {
  if (!entry.isFile()) continue;
  const ext = extname(entry.name).toLowerCase();
  if (!ACCEPTED.has(ext)) continue;
  const stem = basename(entry.name, extname(entry.name));
  // First match wins, so a re-render placed alongside an old file needs the
  // old one removed — better than silently picking an arbitrary one.
  if (!candidates.has(stem)) candidates.set(stem, join(entry.parentPath ?? src, entry.name));
}

for (const id of SCENES) {
  for (const [variant, key, portrait] of [
    [id, "still", false],
    [`${id}-m`, "stillMobile", true],
  ]) {
    const file = candidates.get(variant);
    if (!file) {
      skipped++;
      continue;
    }

    const dim = dimensions(file);
    if (!dim) {
      console.warn(`  ${variant}: unreadable image header — skipped`);
      skipped++;
      continue;
    }

    // The page serves the portrait cut to phones precisely so it isn't a
    // centre-crop of the landscape one. Silently accepting a landscape file
    // there would reintroduce the bug the portrait cut exists to fix.
    const isPortrait = dim.h > dim.w;
    if (portrait !== isPortrait) {
      console.warn(
        `  ${variant}: expected ${portrait ? "portrait" : "landscape"} but got ${dim.w}x${dim.h} — skipped`
      );
      skipped++;
      continue;
    }

    const ext = extname(file).toLowerCase();
    const dest = join(SCENES_DIR, `${variant}${ext}`);
    if (dryRun) {
      console.log(`  would adopt ${variant} (${dim.w}x${dim.h}) from ${file}`);
    } else {
      mkdirSync(SCENES_DIR, { recursive: true });
      copyFileSync(file, dest);
      manifest[id][key] = stamped(`${variant}${ext}`);
      console.log(`  adopted ${variant} (${dim.w}x${dim.h})`);
    }
    adopted++;
  }
}

if (!dryRun && adopted > 0) writeManifest(manifest);

console.log("");
console.log(`${adopted} adopted, ${skipped} left on the drawn SVG.`);
if (adopted > 0 && !dryRun) {
  console.log("Run `npm run build` and open / to see them.");
}
