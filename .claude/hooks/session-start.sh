#!/usr/bin/env bash
# Installed by tools/agent-reach/bootstrap.sh --wire. Delegates so the hook
# stays a shim and the logic stays reviewable in one place.
set -uo pipefail
# CLAUDE_PROJECT_DIR is set by Claude Code; fall back to the git root so the
# hook is also runnable by hand.
: "${CLAUDE_PROJECT_DIR:=$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
export CLAUDE_PROJECT_DIR
kit="$CLAUDE_PROJECT_DIR/tools/agent-reach/bootstrap.sh"
[ -x "$kit" ] || [ -f "$kit" ] || exit 0
exec bash "$kit" --quiet
