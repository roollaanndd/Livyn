# Fooocus — bootstrap kit

[Fooocus](https://github.com/lllyasviel/Fooocus) (GPL-3.0) is an offline Stable Diffusion
XL image generator: text-to-image, inpainting, outpainting, upscaling and style presets,
with prompt engineering handled for you.

```bash
bash tools/fooocus/bootstrap.sh --check     # will it run on this machine?
bash tools/fooocus/bootstrap.sh             # install (default ~/fooocus)
bash tools/fooocus/bootstrap.sh --run       # launch the web UI
```

## This one is not wired to session start — on purpose

The Agent Reach kit next door installs itself on every Claude Code session. This one
doesn't, for two reasons that are worth being explicit about:

1. **Fooocus has no CLI and no API.** It is exclusively a Gradio web UI that a human opens
   in a browser. An agent session has no way to call it, so auto-installing it would give
   sessions nothing at all.
2. **It is heavy.** An Nvidia GPU, plus several GB of model checkpoints downloaded on
   first launch. Pulling that into every fresh container would spend the disk allowance
   and the clock for zero return.

So `bootstrap.sh` is a deliberate, human-run installer. Run it on the workstation that has
the GPU.

## Requirements

The preflight checks all of these and refuses rather than half-installing:

| Requirement | Notes |
|---|---|
| **Nvidia GPU, 4GB+ VRAM** | RTX 3000-series or better recommended. AMD works via ROCm/DirectML at 8GB+; Apple Silicon works but is markedly slower. |
| **CPU-only** | Possible with `--allow-cpu`, but upstream puts it at ~17× slower and wanting 32GB RAM. Opt-in, never a silent fallback. |
| **Python 3.10** | Newer usually works; upstream pins its torch stack against 3.10, so that's the version to fall back to if a wheel won't build. |
| **~20GB free disk** | Dependencies plus the SDXL base checkpoint, refiner and the inpaint model. |
| **Network to `github.com` and `huggingface.co`** | Two different hosts. Sandboxes often allow the clone and refuse the model pull, which leaves you with an install that hangs on the first prompt — so both are checked. |

### It will not run in Claude Code on the web

Verified in this container, and it fails on three counts at once: **no GPU**, and both
`github.com` and `huggingface.co` are refused by the network policy. Fooocus is a
workstation program; this is the wrong kind of machine for it, and no amount of
configuration changes that.

## Options

```
--check          preflight only, report and exit
--dir=PATH       install location (default ~/fooocus, or $FOOOCUS_DIR)
--allow-cpu      proceed without a GPU
--run            launch an existing install
--run --listen   ...and bind it on the network rather than localhost
--preset=NAME    default | realistic | anime
```

## Using it with this project

Livyn already generates shareable verse images server-side, falling back to free stock
photography when `PEXELS_API_KEY` is unset. Fooocus could in principle produce those
backgrounds instead — but not as installed here: the web UI is not callable from the app.
That would need an HTTP layer in front of it, such as
[Fooocus-API](https://github.com/mrhan1993/Fooocus-API), plus a decision about where the
generation runs in production, since a serverless function has no GPU.

Nothing in this kit is wired into the app. It is a local tool, kept alongside the others.
