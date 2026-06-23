<div align="center">

```
   ╔╦╗╦ ╦╔═╗╔═╗╔═╗╦ ╦╔═╗
    ║ ╠═╣║╣ ╚═╗║╣ ║ ║╚═╗
    ╩ ╩ ╩╚═╝╚═╝╚═╝╚═╝╚═╝
```

###  rebuild your entire Claude Code setup in one guided pass

A wizard **TUI** that registers marketplaces, installs plugins, wires MCP
servers, copies your loose skills/commands/agents, and scaffolds a project
`.claude/` — interactively, idempotently, and with a little juice.

*Named for the ship of Theseus: replace every plank and it's still your setup.*

<br/>

[![release](https://img.shields.io/github/v/release/CarlosDanielDev/claude-theseus?style=for-the-badge&color=06b6d4)](https://github.com/CarlosDanielDev/claude-theseus/releases)
[![node](https://img.shields.io/badge/node-%E2%89%A518-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![no build](https://img.shields.io/badge/build-none-10b981?style=for-the-badge)](#)
[![runs from github](https://img.shields.io/badge/npx-github-8b5cf6?style=for-the-badge)](#-run)

<sub>icons below are Nerd Font glyphs — install a Nerd Font to see them render</sub>

</div>

---

##  Run

No install, no registry — straight from GitHub:

```bash
npx github:CarlosDanielDev/claude-theseus          # latest
npx github:CarlosDanielDev/claude-theseus#v0.2.2   # pinned
```

From a clone:

```bash
npm install && npm start
```

> Pure JS, **zero build step** — runs directly from source (htm instead of JSX).

---

##  What it does

Five steps, each a checkbox list preselected to a known-good setup:

| # | Step | Runs |
|---|------|------|
| 1 |  **Marketplaces** | `claude plugin marketplace add` × 5 registries |
| 2 |  **Plugins** | `claude plugin install` × 14 (superpowers, caveman, ponytail, figma, code-review, security-guidance, LSP backends, …) |
| 3 |  **MCP servers** | `claude mcp add` for obsidian / context7 / figma |
| 4 |  **User files** | copies loose `~/.claude/` skills, commands & agents vendored under `assets/` |
| 5 |  **Project scaffold** | writes a starter `.claude/` (skills/commands/agents) into the target |

Highlight **any** item and a panel explains it:

```
╭ superpowers@claude-plugins-official ─────────────────╮
│ Why      Claude drifts into ad-hoc work without ...  │
│ For who  Any dev who wants disciplined workflows.    │
│ What     Skills + enforcement: TDD, planning ...     │
│ Goal     Make Claude follow a method before code.    │
│ Impact   Fewer rework loops — plans/tests first.     │
╰──────────────────────────────────────────────────────╯
```

All **35** items carry that **why · for who · what · goal · measurable impact** card.
A review screen lists every action before anything runs.

---

##  Idempotent — patches only what's missing

On launch it probes your machine — `plugin marketplace list`, `plugin list`,
`mcp list`, and file existence — and **deselects anything already configured**.

```
Step 2/5 · Plugins · 2/14 selected · 12 configured · DRY-RUN
  ❯ ◇ firebase@claude-plugins-official ✓ configured
    ◆ rust-analyzer-lsp@claude-plugins-official
```

Configured rows read `✓ configured` and drop out of the plan. Re-run anytime to
fill the gaps — or `--all` to re-apply everything.

---

##  Obsidian, handled

For the Obsidian MCP server the wizard **auto-detects the existing Local REST
API key** from your vault's `data.json` and injects it — **masked in every
preview, never written to the repo**.

It does *not* generate a key (Obsidian's plugin mints that in-app). No key found →
clear hint to enable the plugin or set `OBSIDIAN_API_KEY`.

---

##  Demo / recording

A configured box has a near-empty plan. Point detection at an empty folder to
show the full flow:

```bash
mkdir /tmp/empty-home
npx github:CarlosDanielDev/claude-theseus \
  --load-from /tmp/empty-home --target /tmp/empty-home/proj --dry-run
```

`--load-from` treats the folder as a fake `$HOME` (via `CLAUDE_CONFIG_DIR`) for
**detection only** — everything reads as not-configured, so all 32 actions show.
`--dry-run` keeps the recording harmless. *Psst — the Konami code works in the wizard.*

---

##  Controls

| Keys | Action | | Keys | Action |
|------|--------|-|------|--------|
| `↑ ↓` | move | | `→` / `enter` | next step |
| `space` | toggle | | `←` | back |
| `a` / `n` | all / none | | `d` | toggle dry-run |
| `r` / `enter` | run (on review) | | `q` | quit |

---

##  Flags

```
--dry-run         preview only, execute nothing
--target <dir>    where to scaffold .claude/ (default: cwd)
--load-from <dir> detect against <dir> as a fake $HOME (demo); detection only
--all             include items already configured (default: skip)
--print-plan      print the plan and exit (no TUI)
--yes             run headlessly, no TUI
-h, --help        help
```

`--print-plan` and `--yes` are scriptable, no-TTY paths. `--yes --dry-run`
previews the whole run without touching anything.

---

##  Make it yours

Everything lives in **`src/catalog.js`** — add a marketplace, flip a plugin's
default `selected`, change an MCP URL, drop in a scaffold file. No other code to
touch. Loose skills are vendored under `assets/`.

---

##  Test

```bash
npm test    # plan shape + real scaffold writes + injection guard, then the snake suite
```

<div align="center">
<sub>built plank by plank · runs on Node ≥18 · no build step</sub>
</div>
