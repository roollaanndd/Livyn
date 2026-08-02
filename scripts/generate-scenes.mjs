// Generates the landing page's seven scenes as photographic stills.
//
//   GEMINI_API_KEY=... node scripts/generate-scenes.mjs
//   GEMINI_API_KEY=... node scripts/generate-scenes.mjs --only terang,mulai --formats landscape
//   node scripts/generate-scenes.mjs --list-models
//
// Then import whatever came out — the importer validates each file and leaves
// anything it doesn't like on the drawn SVG:
//
//   node scripts/adopt-scenes.mjs .scene-renders/<date>
//
// WHY THIS EXISTS
//
// The scenes are drawn by `build-scenes.mjs` because generating them needs
// either credits or a GPU. Of the hosted generators, Google's is the one an
// agent sandbox can usually still reach (Higgsfield/OpenAI/HuggingFace are
// commonly refused by an egress policy, and Fooocus needs a local GPU), so
// this is the path that turns "we have no art budget" into "paste a key".
// Get one free at https://aistudio.google.com/apikey.
//
// WHAT IT SENDS
//
// The same two files the Fooocus kit uses — `style-preamble.txt` byte-identical
// in front of every prompt, then `<scene>.txt` — plus, by default, the drawn
// SVG frame itself as a composition reference. That reference is the point:
// the descent only works if every frame is lower than the last, and handing
// the model the geometry we already solved is what keeps the church in the
// same place instead of re-rolling a new city per scene. `--no-reference`
// falls back to text-only.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROMPTS = join(ROOT, "tools/fooocus/prompts");
const SVGS = join(ROOT, "public/scroll-world/scenes");

/** The seven scenes, in the order the camera falls through them. */
const SCENES = ["terang", "renungan", "alkitab", "doa", "pastor", "circle", "mulai"];

// Both cuts, at the sizes the page actually serves. The portrait one is not a
// crop: the page hands it to phones instead of centre-cropping the wide frame.
const VARIANTS = {
  landscape: { suffix: "", ratio: "16:9", w: 1344, h: 768, note: "wide 16:9 cinema frame" },
  portrait: { suffix: "-m", ratio: "9:16", w: 768, h: 1344, note: "tall 9:16 phone frame, same subject, same distance, more sky above and more ground below" },
};

const API = "https://generativelanguage.googleapis.com/v1beta";

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback = null) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};

const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const only = (opt("only") || "").split(",").filter(Boolean);
const formats = (opt("formats") || "both").toLowerCase();
const useReference = !flag("no-reference");
const dryRun = flag("dry-run");
const outDir = resolve(opt("out") || join(ROOT, ".scene-renders", new Date().toISOString().slice(0, 10)));

if (only.some((id) => !SCENES.includes(id))) {
  console.error(`--only takes any of: ${SCENES.join(" ")}`);
  process.exit(2);
}
const wanted = only.length ? only : SCENES;
const cuts =
  formats === "landscape" ? [VARIANTS.landscape] : formats === "portrait" ? [VARIANTS.portrait] : Object.values(VARIANTS);

// Node's built-in fetch ignores HTTPS_PROXY unless this is set at startup, and
// agent sandboxes route everything through one. Re-exec rather than fail with a
// timeout nobody can diagnose.
if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, ["--no-warnings", fileURLToPath(import.meta.url), ...argv], {
    env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
    stdio: "inherit",
  });
  process.exit(r.status ?? 1);
}

// ---------------------------------------------------------------------------
// The API
// ---------------------------------------------------------------------------

async function call(path, init = {}) {
  const res = await fetch(`${API}/${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-goog-api-key": KEY, ...(init.headers || {}) },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* left null: the caller reports the raw body */
  }
  return { ok: res.ok, status: res.status, json, text };
}

/** Image models the key can actually call, best first. Asked for rather than
 *  hard-coded, because these ids turn over faster than this repo does. */
async function imageModels() {
  const r = await call("models?pageSize=200");
  if (!r.ok) throw new Error(`listing models failed (${r.status}): ${r.json?.error?.message || r.text.slice(0, 200)}`);
  return (r.json.models || [])
    .filter(
      (m) =>
        (m.supportedGenerationMethods || []).includes("generateContent") &&
        /image/.test(m.name) &&
        !/embed|vision-only/.test(m.name)
    )
    .map((m) => m.name.replace(/^models\//, ""))
    // Prefer the heavier tier, and a stable id over a preview of the same thing.
    .sort((a, b) => {
      const rank = (n) => (/pro/.test(n) ? 0 : /flash/.test(n) ? 1 : 2) + (/preview|exp/.test(n) ? 0.5 : 0);
      return rank(a) - rank(b) || b.localeCompare(a);
    });
}

/** One image. Returns { buffer, mime }. */
async function generate(model, prompt, reference, ratio) {
  const parts = [{ text: prompt }];
  if (reference) parts.push({ inline_data: { mime_type: "image/png", data: reference.toString("base64") } });

  const send = (withImageConfig) =>
    call(`models/${model}:generateContent`, {
      method: "POST",
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          ...(withImageConfig ? { imageConfig: { aspectRatio: ratio } } : {}),
        },
      }),
    });

  let r = await send(true);
  // Older image models reject imageConfig outright; the reference frame then
  // carries the aspect ratio, and adopt-scenes.mjs rejects anything that came
  // back the wrong shape.
  if (!r.ok && r.status === 400 && /imageConfig|aspectRatio|Unknown name/i.test(r.text)) r = await send(false);

  for (let attempt = 0; !r.ok && attempt < 4 && [429, 500, 503, 504].includes(r.status); attempt++) {
    const wait = 2000 * 2 ** attempt;
    console.log(`      ${r.status}, retrying in ${wait / 1000}s`);
    await new Promise((f) => setTimeout(f, wait));
    r = await send(true);
  }
  if (!r.ok) throw new Error(`${r.status}: ${r.json?.error?.message || r.text.slice(0, 200)}`);

  for (const part of r.json.candidates?.[0]?.content?.parts || []) {
    const inline = part.inlineData || part.inline_data;
    if (inline?.data) return { buffer: Buffer.from(inline.data, "base64"), mime: inline.mimeType || inline.mime_type || "image/png" };
  }
  const said = (r.json.candidates?.[0]?.content?.parts || []).map((p) => p.text).filter(Boolean).join(" ");
  throw new Error(`no image came back${said ? `: ${said.slice(0, 160)}` : ` (${r.json.candidates?.[0]?.finishReason || "unknown reason"})`}`);
}

// ---------------------------------------------------------------------------
// Reference frames — the drawn SVG, rasterised
// ---------------------------------------------------------------------------

function findChrome() {
  const named = [process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"];
  for (const p of named) if (p && existsSync(p)) return p;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (base && existsSync(base)) {
    for (const entry of readdirSync(base)) {
      if (!entry.startsWith("chromium-")) continue;
      const p = join(base, entry, "chrome-linux", "chrome");
      if (existsSync(p)) return p;
    }
  }
  return null;
}

const CHROME = useReference ? findChrome() : null;

/** Rasterise one scene SVG so it can be sent as a composition reference. */
function rasterise(svgFile, w, h) {
  if (!CHROME) return null;
  const tmp = join(outDir, ".ref");
  mkdirSync(tmp, { recursive: true });
  const html = join(tmp, "frame.html");
  const png = join(tmp, "frame.png");
  writeFileSync(
    html,
    `<body style="margin:0"><img src="file://${svgFile}" style="width:${w}px;height:${h}px;display:block"></body>`
  );
  try {
    execFileSync(
      CHROME,
      ["--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", `--window-size=${w},${h}`, `--screenshot=${png}`, `file://${html}`],
      { stdio: "ignore" }
    );
    return readFileSync(png);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const preamble = readFileSync(join(PROMPTS, "style-preamble.txt"), "utf8").trim();

function promptFor(id, cut, hasReference) {
  const subject = readFileSync(join(PROMPTS, `${id}.txt`), "utf8").trim();
  const lines = [`${preamble}. Subject: ${subject}.`, `Framing: ${cut.note}.`];
  if (hasReference) {
    lines.push(
      "The attached image is the exact frame to reproduce: keep its camera altitude, its composition, " +
        "where the horizon sits and where the buildings and the church stand. Render it as a photograph — " +
        "real materials, real haze, real light falloff — without moving the camera or rearranging anything."
    );
  }
  lines.push("No text, no letters, no watermark, no logo, no UI.");
  return lines.join(" ");
}

if (flag("list-models")) {
  if (!KEY) {
    console.error("set GEMINI_API_KEY first (https://aistudio.google.com/apikey)");
    process.exit(2);
  }
  console.log((await imageModels()).join("\n") || "(the key can't call any image model)");
  process.exit(0);
}

if (!KEY && !dryRun) {
  console.error(
    "No API key. Set GEMINI_API_KEY (free at https://aistudio.google.com/apikey) and re-run,\n" +
      "or use --dry-run to print the prompts without calling anything."
  );
  process.exit(2);
}

let model = opt("model") || (dryRun ? "(dry run)" : null);
if (!model) {
  try {
    model = (await imageModels())[0];
  } catch (err) {
    console.error(`Could not ask Google which models this key can use.\n  ${err.message}`);
    process.exit(1);
  }
}
if (!model) {
  console.error("this key can't call any image model — check it at https://aistudio.google.com/apikey");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
console.log(`model:     ${model}`);
console.log(`reference: ${useReference ? (CHROME ? "the drawn SVG frame" : "wanted, but no chromium found — text only") : "off"}`);
console.log(`out:       ${outDir}\n`);

let made = 0;
let failed = 0;

for (const id of wanted) {
  for (const cut of cuts) {
    const name = `${id}${cut.suffix}`;
    const svg = join(SVGS, `${name}.svg`);
    const wantsReference = useReference && Boolean(CHROME) && existsSync(svg);

    if (dryRun) {
      console.log(`--- ${name} (${cut.ratio})\n${promptFor(id, cut, wantsReference)}\n`);
      continue;
    }

    const reference = wantsReference ? rasterise(svg, cut.w, cut.h) : null;
    const prompt = promptFor(id, cut, Boolean(reference));

    process.stdout.write(`  ${name} (${cut.ratio})… `);
    try {
      const { buffer, mime } = await generate(model, prompt, reference, cut.ratio);
      const ext = mime.includes("jpeg") ? ".jpg" : mime.includes("webp") ? ".webp" : ".png";
      writeFileSync(join(outDir, `${name}${ext}`), buffer);
      console.log(`${(buffer.length / 1024).toFixed(0)} KB`);
      made++;
    } catch (err) {
      console.log(`failed — ${err.message}`);
      failed++;
    }
  }
}

if (dryRun) process.exit(0);

console.log(`\n${made} generated, ${failed} failed.`);
if (made > 0) {
  console.log(`\nImport them with:\n  node scripts/adopt-scenes.mjs ${outDir}`);
  console.log("Scenes that failed keep their drawn SVG, so a partial run still leaves a coherent page.");
}
process.exit(failed && !made ? 1 : 0);
