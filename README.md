# theseus

A wizard TUI that rebuilds a Claude Code environment from a known-good setup —
marketplaces, plugins, MCP servers, and a project `.claude/` scaffold — in one
guided pass.

Named for the ship of Theseus: replace every plank and it's still your setup.

## Run

```bash
npx claude-theseus            # interactive wizard
# or, from a clone:
npm install && npm start
```

## What it does

Walks five steps, each a checkbox list preselected to the full setup:

1. **Marketplaces** — `claude plugin marketplace add` for 5 registries
2. **Plugins** — `claude plugin install` for the core 14 (superpowers, caveman,
   ponytail, figma, code-review, security-guidance, LSP backends, …)
3. **MCP servers** — `claude mcp add` for obsidian / context7 / figma. For
   obsidian the wizard **auto-detects the existing Local REST API key** from
   your vault's `data.json` and injects it (masked in all previews, never
   committed). It does not *generate* a key — Obsidian's plugin mints that
   in-app; if none exists, enable the Local REST API plugin first or set
   `OBSIDIAN_API_KEY`.
4. **User files** — copies loose `~/.claude/` skills, commands, and agents
   vendored under `assets/` (council, obsidian-brain, the `/obsidian:*`
   commands, schedule-day, error-log-cleaner) — none available from a marketplace
5. **Project scaffold** — writes a Maestro-style `.claude/` (skills, commands,
   agents) into the target project

Highlight any plugin / server / skill and a panel shows **why · for who · what ·
goal · measurable impact**. Then a review screen lists every action before
anything runs.

## Idempotent — patches only what's missing

On launch the wizard probes your machine (`claude plugin marketplace list`,
`plugin list`, `mcp list`, and file existence) and **deselects anything already
configured** — marketplaces, plugins, MCP servers, user files, and scaffold
files that already exist at the target. Configured rows show `✓ configured` and
are skipped. Re-run it any time to fill only the gaps. Pass `--all` to re-apply
everything regardless.

## Controls

`↑↓` move · `space` toggle · `a` all · `n` none · `→` next · `←` back ·
`d` dry-run · `enter`/`r` run · `q` quit

## Flags

```
--dry-run         start in dry-run (preview, no execution)
--target <dir>    where to scaffold .claude/ (default: cwd)
--print-plan      print the default plan and exit (no TUI)
--yes             run the full default setup headlessly
-h, --help        help
```

`--print-plan` and `--yes` are scriptable, no-TTY paths. Combine `--yes
--dry-run` to preview the whole run without touching anything.

## Edit the setup

Everything lives in `src/catalog.js` — add a marketplace, flip a plugin's
default `selected`, change an MCP URL, or add a scaffold file. No other code
changes needed.

## Test

```bash
npm test    # plan shape + real scaffold writes, no CLI/network
```
