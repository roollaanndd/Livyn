#!/usr/bin/env bash
#
# Fooocus bootstrap — portable across machines.
#
#   https://github.com/lllyasviel/Fooocus (GPL-3.0)
#
# Fooocus is an offline Stable Diffusion XL image generator with a web UI.
# Unlike the Agent Reach kit next door, this one is NOT wired to a session
# hook, and that is deliberate:
#
#   * Fooocus has no CLI and no API — it is exclusively a Gradio web UI. An
#     agent session cannot call it, so auto-installing it buys sessions
#     nothing.
#   * It wants an Nvidia GPU and pulls several GB of model checkpoints on
#     first launch. Doing that unprompted in every fresh container would burn
#     the disk allowance and the clock for no return.
#
# So this is a deliberate, human-run installer with a preflight that refuses
# loudly rather than half-installing. Run it on the workstation that has the
# GPU.
#
# Usage:
#   bootstrap.sh --check          preflight only, report and exit
#   bootstrap.sh                  preflight, then install
#   bootstrap.sh --dir=PATH       install location (default ~/fooocus)
#   bootstrap.sh --allow-cpu      proceed without a GPU (see the warning)
#   bootstrap.sh --run            launch an existing install
#   bootstrap.sh --run --listen   ...and bind it on the network
#   bootstrap.sh --preset=NAME    default | realistic | anime

set -uo pipefail

readonly REPO="https://github.com/lllyasviel/Fooocus.git"
readonly MIN_FREE_GB=20   # deps ~4GB + SDXL base ~7GB + refiner/inpaint + headroom

DIR="${FOOOCUS_DIR:-$HOME/fooocus}"
MODE="install"
ALLOW_CPU=0
PRESET=""
LISTEN=0

for arg in "$@"; do
  case "$arg" in
    --check)      MODE="check" ;;
    --run)        MODE="run" ;;
    --allow-cpu)  ALLOW_CPU=1 ;;
    --listen)     LISTEN=1 ;;
    --dir=*)      DIR="${arg#*=}" ;;
    --preset=*)   PRESET="${arg#*=}" ;;
    -h|--help)    sed -n '2,28p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'fooocus bootstrap: unknown option %s\n' "$arg" >&2; exit 2 ;;
  esac
done

ok()   { printf '  \033[32mok\033[0m    %s\n' "$*"; }
bad()  { printf '  \033[31mno\033[0m    %s\n' "$*"; }
note() { printf '  \033[33mwarn\033[0m  %s\n' "$*"; }
say()  { printf '%s\n' "$*"; }

# ---------------------------------------------------------------------------
# Preflight — every one of these is a real reason Fooocus won't work
# ---------------------------------------------------------------------------

BLOCKERS=0

check_python() {
  local v
  if ! command -v python3 >/dev/null 2>&1; then
    bad "python3 not found (Fooocus needs 3.10+)"; BLOCKERS=$((BLOCKERS + 1)); return
  fi
  v="$(python3 -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null)"
  if ! python3 -c 'import sys;sys.exit(0 if sys.version_info[:2] >= (3,10) else 1)' 2>/dev/null; then
    bad "python3 $v is too old (needs 3.10)"; BLOCKERS=$((BLOCKERS + 1)); return
  fi
  # Upstream targets 3.10 and pins its torch stack against it. Newer usually
  # works, but when a wheel is missing this is the first thing to suspect.
  if [ "$v" = "3.10" ]; then
    ok "python3 $v"
  else
    note "python3 $v — upstream targets 3.10; if a wheel fails to build, try 3.10"
  fi
}

check_git() {
  if command -v git >/dev/null 2>&1; then ok "git"; else
    bad "git not found"; BLOCKERS=$((BLOCKERS + 1)); fi
}

# Fooocus is a GPU program. CPU works but the upstream README puts it at
# roughly 17x slower and 32GB RAM, which is a different product in practice —
# so it is opt-in, never the silent fallback.
check_gpu() {
  if command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi -L >/dev/null 2>&1; then
    ok "Nvidia GPU: $(nvidia-smi -L 2>/dev/null | head -1)"
    return
  fi
  if command -v rocminfo >/dev/null 2>&1; then ok "AMD ROCm runtime present"; return; fi
  if [ "$(uname -s)" = "Darwin" ] && [ "$(uname -m)" = "arm64" ]; then
    note "Apple Silicon — supported but markedly slower than Nvidia"; return
  fi
  if [ "$ALLOW_CPU" -eq 1 ]; then
    note "no GPU — continuing on CPU (~17x slower, wants 32GB RAM)"
  else
    bad "no GPU detected (Nvidia 4GB+ VRAM recommended)"
    bad "      pass --allow-cpu to proceed anyway, and read the warning first"
    BLOCKERS=$((BLOCKERS + 1))
  fi
}

check_disk() {
  local free
  free="$(df -Pk "$(dirname "$DIR")" 2>/dev/null | awk 'NR==2{print int($4/1048576)}')"
  [ -z "$free" ] && { note "could not measure free space at $DIR"; return; }
  if [ "$free" -ge "$MIN_FREE_GB" ]; then
    ok "disk: ${free}GB free (need ~${MIN_FREE_GB}GB)"
  else
    bad "disk: only ${free}GB free at $DIR, need ~${MIN_FREE_GB}GB for deps + checkpoints"
    BLOCKERS=$((BLOCKERS + 1))
  fi
}

# The clone and the first-launch model pull are separate hosts, and sandboxes
# commonly allow one and refuse the other. Check both — a green clone with a
# blocked huggingface leaves you with an install that hangs on first prompt.
check_net() {
  local host code
  for host in "https://github.com" "https://huggingface.co"; do
    code="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 15 -I "$host" 2>/dev/null)" || code="000"
    case "$code" in
      200|301|302) ok "network: $host" ;;
      *) bad "network: $host unreachable (HTTP $code)"; BLOCKERS=$((BLOCKERS + 1)) ;;
    esac
  done
}

preflight() {
  say "Fooocus preflight — target $DIR"
  check_python; check_git; check_gpu; check_disk; check_net
  say ""
  if [ "$BLOCKERS" -gt 0 ]; then
    say "$BLOCKERS blocker(s). Fooocus will not run here as configured."
    return 1
  fi
  say "All clear."
  return 0
}

# ---------------------------------------------------------------------------
# Modes
# ---------------------------------------------------------------------------

launch() {
  [ -d "$DIR" ] || { say "No install at $DIR — run without --run first."; exit 1; }
  # shellcheck disable=SC1091
  source "$DIR/fooocus_env/bin/activate" || { say "venv missing at $DIR/fooocus_env"; exit 1; }
  cd "$DIR" || exit 1
  set --
  [ -n "$PRESET" ] && set -- "$@" --preset "$PRESET"
  [ "$LISTEN" -eq 1 ] && set -- "$@" --listen
  say "Launching Fooocus (first run downloads several GB of checkpoints)…"
  exec python entry_with_update.py "$@"
}

case "$MODE" in
  check) preflight; exit 0 ;;
  run)   launch ;;
esac

preflight || {
  say ""
  say "Nothing installed. Fix the blockers above, or run --check on the"
  say "machine you actually intend to use."
  exit 1
}

say ""
if [ -d "$DIR/.git" ]; then
  say "Updating existing install at $DIR"
  git -C "$DIR" pull --ff-only || say "  (pull skipped — local changes?)"
else
  say "Cloning Fooocus into $DIR"
  git clone --depth 1 "$REPO" "$DIR" || exit 1
fi

say "Creating venv and installing requirements (this takes a while)…"
python3 -m venv "$DIR/fooocus_env" || exit 1
"$DIR/fooocus_env/bin/pip" install --upgrade pip >/dev/null 2>&1 || true
"$DIR/fooocus_env/bin/pip" install -r "$DIR/requirements_versions.txt" || {
  say "Requirements failed to install — see the output above."
  exit 1
}

say ""
say "Fooocus is installed at $DIR."
say "Launch it with:  bash tools/fooocus/bootstrap.sh --run"
say "The first launch downloads the SDXL checkpoints (several GB)."
