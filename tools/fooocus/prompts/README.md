# Scene prompts for the landing page

The landing page at `/` is one continuous descent: the camera starts in orbit above the
earth, falls through the atmosphere, finds a city, picks one church out of it, and ends on
that church's open door — which is the door into the app. Its art currently comes from
`scripts/build-scenes.mjs`, which renders that descent in code — deliberate placeholders,
made because generating them needed image credits nobody had.

Fooocus replaces that step for free, locally. These prompts generate the same seven
altitudes as rendered SDXL images.

The same two files drive `scripts/generate-scenes.mjs`, which calls Google's image API
instead — same preamble, same per-scene prompts, no GPU needed, and it attaches the drawn
frame as a composition reference. See "Membangkitkan gambar adegan" in the root README.

## Two rules

**1. `style-preamble.txt` goes in front of every scene prompt, byte-identical every time.**
That repetition is the entire reason seven separately-generated images read as one world.
Change it if you like — but change it for all seven and regenerate all seven, never one.

**2. The order is the camera's altitude, so it cannot be shuffled.** `terang` is orbit and
`mulai` is the doorway; each scene has to look like it was shot lower than the one before
it. Generate them in order and judge each one against the one above it — if scene 4 could
plausibly have been taken from higher up than scene 3, regenerate it, because the whole
page is that fall.

The final prompt for a scene is:

```
<style-preamble.txt>. Subject: <scene>.txt
```

## Fooocus settings

| Setting | Value |
|---|---|
| Performance | **Quality** |
| Aspect ratio | **1344 × 768** for desktop, **768 × 1344** for the mobile cut |
| Styles | `Fooocus V2`, `Fooocus Cinematic`, `SAI Photographic` |
| Negative prompt | see below |
| Seed | fix one seed and reuse it across all seven — it tightens cohesion further |

Negative prompt:

```
text, letters, words, numbers, watermark, signature, logo, ui, interface, human face,
close-up portrait, clutter, daylight, midday sun, cartoon, flat vector, blurry, lens flare
```

## Generating

Render each scene twice — once landscape, once portrait. The portrait cut is not a crop:
the landing page serves it to phones because centre-cropping a 16:9 frame on a tall screen
shows about a third of the diorama. Same prompt, same seed, portrait ratio.

Name the files `<scene>.png` and `<scene>-m.png`, where `<scene>` is one of:

```
terang  renungan  alkitab  doa  pastor  circle  mulai
```

Then import them:

```bash
node scripts/adopt-scenes.mjs ~/fooocus/outputs/2026-08-01
```

That validates each file, copies it into `public/scroll-world/scenes/`, and updates the
manifest so the page starts serving it. Scenes you haven't generated keep their SVG, so
you can do this one scene at a time and see each one land.

## Judging the results

Look at the seven together, in order, not one at a time — the test is whether they read as
one fall: one world, one light, each frame lower than the last. If a scene drifts,
regenerate that scene rather than adjusting the preamble.

Keep the subject centred and the frame edges quiet. The page crops those edges differently
on every viewport, so nothing that matters should live near them.
