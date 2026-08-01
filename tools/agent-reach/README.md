# Agent Reach — portable bootstrap kit

[Agent Reach](https://github.com/Panniantong/Agent-Reach) (MIT) is a CLI that gives a coding
agent access to internet content — web pages, YouTube transcripts, GitHub, RSS, semantic
search, Twitter/X, Reddit, Bilibili, Xiaohongshu, Xueqiu, podcasts, LinkedIn — without
wiring up each platform's API by hand.

This folder is a **self-contained kit**: drop it into any repository, or point it at your
home directory, and Agent Reach installs itself on session start. It is deliberately not
tied to this project — nothing in it references Livyn.

## Why a script instead of upstream's one-liner

Upstream installs by telling your agent to fetch `docs/install.md` and do whatever it
says. That works, but it means an agent executing remote instructions it hasn't reviewed,
differently every time. `bootstrap.sh` does the same installation as reviewed, idempotent
shell: same commands, same destinations, but pinned, repeatable, and readable in one file.

Everything lands in `$HOME` (`~/.agent-reach`, `~/.local/bin`, `~/.agent-reach-venv`) and
never in the repository — that is upstream's own rule, and it keeps workspaces clean.

## Quick start

```bash
# Install for the current machine (all channels)
bash tools/agent-reach/bootstrap.sh

# See what it would do first
bash tools/agent-reach/bootstrap.sh --dry-run

# Is it installed, and are the channels healthy?
bash tools/agent-reach/bootstrap.sh --check
```

### Make it automatic

```bash
# …for this repo: writes .claude/hooks/session-start.sh + .claude/settings.json
bash tools/agent-reach/bootstrap.sh --wire

# …for every project on this machine: writes ~/.claude/hooks + ~/.claude/settings.json
bash tools/agent-reach/bootstrap.sh --wire-global
```

### Use it in another repository

```bash
cp -r tools/agent-reach /path/to/other-repo/tools/
cd /path/to/other-repo && bash tools/agent-reach/bootstrap.sh --wire
```

Commit the folder and the `.claude/` files. Every future Claude Code session on that repo
bootstraps Agent Reach automatically — including sessions on the web, where the container
is rebuilt each time.

## Requirements

- **Python 3.10+**, and ideally `pipx`. Without `pipx` the script builds a private venv at
  `~/.agent-reach-venv` rather than touching the system Python (PEP 668).
- **Real outbound network.** This is the one that bites. The install pulls
  `github.com/Panniantong/agent-reach/archive/main.zip`, and the channels themselves need
  `youtube.com`, `x.com`, `reddit.com`, `r.jina.ai` and friends. In a sandbox that
  restricts egress, `bootstrap.sh` detects it, says so, and exits cleanly without
  installing — it will never fail the session it is starting.

  If you are running Claude Code on the web and want Agent Reach to work there, the
  environment's network policy has to allow those hosts; see
  <https://code.claude.com/docs/en/claude-code-on-the-web>.

## Channels

Installed with `--channels=all`. These work with **no credentials**:

| Channel | Tool | Example |
|---|---|---|
| Web pages | Jina Reader | `curl -s "https://r.jina.ai/<URL>"` |
| YouTube | `yt-dlp` | `yt-dlp --dump-json <URL>` |
| GitHub | `gh` | `gh search repos "query"` |
| RSS/Atom | `feedparser` | `python3 -c "import feedparser; ..."` |
| Semantic search | Exa via `mcporter` | `mcporter call 'exa.web_search_exa(...)'` |
| Bilibili | `bili` | `bili search "query" --type video` |
| V2EX | built in | — |

### Channels that need your own credentials

**This script never handles secrets — run these yourself.** They write to
`~/.agent-reach/` with restrictive permissions.

```bash
agent-reach configure twitter-cookies "<Cookie-Editor header string>"
agent-reach configure xhs-cookies "key=val; key=val"        # Xiaohongshu
agent-reach configure --from-browser chrome --platform xueqiu
agent-reach configure groq-key gsk_xxxxx                    # podcast transcription
agent-reach configure proxy http://user:pass@host:port      # if egress needs a proxy
rdt login                                                   # Reddit
```

Reddit, Facebook and Instagram additionally want the OpenCLI Chrome extension, and
LinkedIn wants a browser login — `agent-reach doctor` will tell you exactly what is
missing for each.

> **Upstream's own warning, worth repeating:** cookie and browser-session auth carries two
> real risks — platforms may detect non-browser API calls and **ban the account**, and a
> leaked cookie grants **full account access**. Use a secondary account for these
> channels, not your main one.

## Day to day

```bash
agent-reach doctor        # channel status, and what each one is missing
agent-reach watch         # quick health + update check, good for a scheduled task
agent-reach check-update  # is there a newer version
```

After installation you call the upstream tools directly (`gh`, `yt-dlp`, `twitter`,
`bili`, `opencli`, `mcporter`); Agent Reach is the installer, health checker and router,
not a wrapper around them.

## Hook behaviour

The session hook runs **synchronously**, which means a session waits for it:

- Already installed → resolves the binary and exits in milliseconds. This is every session
  after the first.
- Not installed, network fine → performs the full install once. On Claude Code on the web
  the container is cached afterwards, so this is once per container, not once per session.
- Not installed, network blocked → prints why and exits 0.

If you would rather never wait, make the hook asynchronous by adding this as the first
line of `.claude/hooks/session-start.sh` after the shebang:

```bash
echo '{"async": true, "asyncTimeout": 600000}'
```

The trade-off is the usual one: async starts your session immediately but the agent may
briefly run before Agent Reach is ready.

To disable the hook without removing it, delete the `SessionStart` block from
`.claude/settings.json`.

## Uninstall

```bash
pipx uninstall agent-reach          # or: rm -rf ~/.agent-reach-venv
rm -rf ~/.agent-reach               # config, tools and credentials
rm -rf .claude/hooks/session-start.sh
```
