#!/usr/bin/env bash
#
# Agent Reach bootstrap — portable across repos and machines.
#
#   https://github.com/Panniantong/Agent-Reach (MIT)
#
# Agent Reach is a CLI that gives a coding agent access to internet content:
# web pages, YouTube transcripts, GitHub, RSS, search, Twitter/X, Reddit,
# Bilibili, Xiaohongshu and more. This script installs it the way upstream's
# docs/install.md describes, but as reviewed, idempotent shell rather than by
# pointing an agent at a URL and letting it improvise.
#
# Everything lands in $HOME (~/.agent-reach, ~/.local/bin), never in the repo —
# that is upstream's own rule and it keeps the workspace clean.
#
# Usage:
#   bootstrap.sh                 install if missing, else no-op
#   bootstrap.sh --check         report status only, install nothing
#   bootstrap.sh --dry-run       print what would run
#   bootstrap.sh --force         reinstall even if already present
#   bootstrap.sh --channels=X    override channel set (default: all)
#   bootstrap.sh --wire          add the SessionStart hook to THIS repo
#   bootstrap.sh --wire-global   add the SessionStart hook for ALL projects
#   bootstrap.sh --quiet         only speak up on problems
#
# Exit status is 0 in every ordinary situation, including "the network won't
# allow the install" — a session-start hook must never fail the session it is
# starting. Only genuinely broken usage returns non-zero.

set -uo pipefail

readonly ARCHIVE_URL="https://github.com/Panniantong/agent-reach/archive/main.zip"
readonly HOME_DIR="${AGENT_REACH_HOME:-$HOME/.agent-reach}"
readonly VENV_DIR="$HOME/.agent-reach-venv"
readonly LOG="$HOME_DIR/bootstrap.log"

CHANNELS="${AGENT_REACH_CHANNELS:-all}"
MODE="install"
DRY_RUN=0
FORCE=0
QUIET=0

for arg in "$@"; do
  case "$arg" in
    --check)         MODE="check" ;;
    --wire)          MODE="wire" ;;
    --wire-global)   MODE="wire-global" ;;
    --dry-run)       DRY_RUN=1 ;;
    --force)         FORCE=1 ;;
    --quiet)         QUIET=1 ;;
    --channels=*)    CHANNELS="${arg#*=}" ;;
    -h|--help)       sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'agent-reach bootstrap: unknown option %s\n' "$arg" >&2; exit 2 ;;
  esac
done

say()  { [ "$QUIET" -eq 1 ] || printf '%s\n' "$*"; }
warn() { printf '%s\n' "$*" >&2; }
log()  { mkdir -p "$HOME_DIR" 2>/dev/null || true; printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*" >>"$LOG" 2>/dev/null || true; }
run()  { if [ "$DRY_RUN" -eq 1 ]; then printf '  would run: %s\n' "$*"; else log "run: $*"; "$@" >>"$LOG" 2>&1; fi; }

# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------

# `agent-reach` may be on PATH, in ~/.local/bin (pipx) or inside the venv
# fallback. Resolve it the same way every time so --check and the hook agree.
resolve_bin() {
  local c
  for c in "$(command -v agent-reach 2>/dev/null)" \
           "$HOME/.local/bin/agent-reach" \
           "$VENV_DIR/bin/agent-reach"; do
    [ -n "$c" ] && [ -x "$c" ] && { printf '%s' "$c"; return 0; }
  done
  return 1
}

# The install pulls a zip straight from github.com. Plenty of sandboxes and
# corporate proxies refuse exactly that host, so probe before committing to a
# multi-minute install that would die halfway.
archive_reachable() {
  local code
  code="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 -I "$ARCHIVE_URL" 2>/dev/null)" || code="000"
  [ "$code" = "200" ] || [ "$code" = "302" ]
}

# ---------------------------------------------------------------------------
# Wiring — makes this kit self-installing in any repo
# ---------------------------------------------------------------------------

# Writes the shim that Claude Code runs at session start. Kept to a delegation
# so the real logic stays in this one reviewable file.
write_hook() {
  local dir="$1" rel="$2"
  mkdir -p "$dir/hooks"
  cat >"$dir/hooks/session-start.sh" <<EOF
#!/usr/bin/env bash
# Installed by tools/agent-reach/bootstrap.sh --wire. Delegates so the hook
# stays a shim and the logic stays reviewable in one place.
set -uo pipefail
# CLAUDE_PROJECT_DIR is set by Claude Code; fall back to the git root so the
# hook is also runnable by hand.
: "\${CLAUDE_PROJECT_DIR:=\$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
export CLAUDE_PROJECT_DIR
kit="$rel/bootstrap.sh"
[ -x "\$kit" ] || [ -f "\$kit" ] || exit 0
exec bash "\$kit" --quiet
EOF
  chmod +x "$dir/hooks/session-start.sh"

  local settings="$dir/settings.json"
  local hook_cmd="\$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh"
  [ "$dir" = "$HOME/.claude" ] && hook_cmd="$dir/hooks/session-start.sh"

  if [ -f "$settings" ] && grep -q 'session-start.sh' "$settings" 2>/dev/null; then
    say "  settings.json already registers the hook — left alone"
    return 0
  fi
  if [ -f "$settings" ]; then
    warn "  $settings exists and has no agent-reach hook."
    warn "  Merge this into its \"hooks\" key by hand (not overwriting your config):"
    warn "    {\"SessionStart\":[{\"hooks\":[{\"type\":\"command\",\"command\":\"$hook_cmd\"}]}]}"
    return 0
  fi
  cat >"$settings" <<EOF
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$hook_cmd"
          }
        ]
      }
    ]
  }
}
EOF
  say "  wrote $settings"
}

# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------

install_agent_reach() {
  # pipx is upstream's recommendation and sidesteps PEP 668 entirely.
  if command -v pipx >/dev/null 2>&1; then
    say "  installing via pipx…"
    run pipx install --force "$ARCHIVE_URL"
    return $?
  fi

  # No pipx: a private venv is the fallback upstream documents for
  # externally-managed Pythons. Never pip-install into the system Python.
  say "  pipx not found — installing into $VENV_DIR…"
  if [ ! -d "$VENV_DIR" ]; then
    run python3 -m venv "$VENV_DIR" || return 1
  fi
  run "$VENV_DIR/bin/pip" install --upgrade pip || true
  run "$VENV_DIR/bin/pip" install "$ARCHIVE_URL"
}

# ---------------------------------------------------------------------------
# Modes
# ---------------------------------------------------------------------------

case "$MODE" in
  wire|wire-global)
    if [ "$MODE" = "wire-global" ]; then
      target="$HOME/.claude"
      rel="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    else
      root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
      target="$root/.claude"
      rel="\$CLAUDE_PROJECT_DIR/tools/agent-reach"
    fi
    say "Wiring the Agent Reach session hook into $target"
    write_hook "$target" "$rel"
    say "Done. New Claude Code sessions will bootstrap Agent Reach."
    exit 0
    ;;
esac

if bin="$(resolve_bin)"; then
  if [ "$MODE" = "check" ] || [ "$FORCE" -eq 0 ]; then
    say "Agent Reach is installed: $bin"
    if [ "$MODE" = "check" ]; then
      "$bin" doctor 2>&1 || warn "(doctor reported problems — see above)"
    fi
    exit 0
  fi
fi

if [ "$MODE" = "check" ]; then
  say "Agent Reach is not installed."
  say "Install it with: bash tools/agent-reach/bootstrap.sh"
  exit 0
fi

# From here on we intend to install.
if ! command -v python3 >/dev/null 2>&1; then
  warn "agent-reach: python3 not found — skipping install (Agent Reach needs Python 3.10+)."
  log "abort: no python3"
  exit 0
fi

if ! archive_reachable; then
  # This is the common case inside locked-down sandboxes. Say so precisely and
  # get out of the way rather than failing the session.
  warn "agent-reach: cannot reach $ARCHIVE_URL"
  warn "agent-reach: this environment's network policy blocks it. Agent Reach"
  warn "agent-reach: also needs youtube.com / x.com / reddit.com / r.jina.ai to"
  warn "agent-reach: be useful, so opening egress is the real fix."
  log "abort: archive unreachable"
  # A dry run is asking "what would you do", so answer it anyway.
  if [ "$DRY_RUN" -eq 0 ]; then
    warn "agent-reach: skipping install."
    exit 0
  fi
  warn "agent-reach: --dry-run, so showing the plan regardless."
fi

say "Installing Agent Reach (channels: $CHANNELS) — logging to $LOG"
mkdir -p "$HOME_DIR"

if ! install_agent_reach; then
  warn "agent-reach: install failed — see $LOG"
  exit 0
fi

if [ "$DRY_RUN" -eq 1 ]; then
  printf '  would run: agent-reach install --env=auto --channels=%s\n' "$CHANNELS"
  printf '  would run: agent-reach doctor\n'
  exit 0
fi

if ! bin="$(resolve_bin)"; then
  warn "agent-reach: installed but the binary is not on PATH — see $LOG"
  exit 0
fi

say "  running: agent-reach install --env=auto --channels=$CHANNELS"
run "$bin" install --env=auto --channels="$CHANNELS"

# Make the CLI reachable for the rest of this session without a reshell.
if [ -n "${CLAUDE_ENV_FILE:-}" ] && [ "$DRY_RUN" -eq 0 ]; then
  printf 'export PATH="%s:%s:$PATH"\n' "$HOME/.local/bin" "$VENV_DIR/bin" >>"$CLAUDE_ENV_FILE"
fi

say ""
say "Agent Reach is installed. Channel health:"
"$bin" doctor 2>&1 || true
say ""
say "Channels needing your own credentials are listed in tools/agent-reach/README.md."
say "Run those configure commands yourself — this script never handles secrets."
