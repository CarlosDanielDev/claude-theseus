---
name: obsidian-brain
description: Use whenever the user wants to read, search, summarize, or extend notes in their Obsidian vault — including requests like "search my notes", "what did we decide last time", "resume where we left off", "summarize these notes", "save this to my vault", or any interaction with daily/periodic notes, tags, or the Obsidian CLI. Talks to Obsidian via the Local REST API (HTTPS on 127.0.0.1:27124). Also use this skill for the `/obsidian:resume`, `/obsidian:search`, and `/obsidian:summarize` slash commands.
---

# Obsidian Brain

Read-and-write access to the user's Obsidian vault via the Local REST API. The vault is the user's **second brain**; this skill is how Claude participates in it without overwriting the human's work.

## Core rule — the one thing that cannot bend

**Writes are scoped. Reads are free.**

- **Read anywhere**: the whole vault is legible (notes, headings, frontmatter, tags, daily notes, search).
- **Write only under the AI folder** (default: `_AI/`). That folder is your sandbox — it has subfolders for `Logs/`, `Skills/`, `Projects/`, `Memory/`, `PRDs/`. Inside, you own everything and can create/edit/delete freely.
- **Never** PUT / PATCH / POST / DELETE a path outside the AI folder. Not even "just this once." Not even if the user asks casually — confirm explicitly first, and even then prefer to write a sibling note inside the AI folder that references the human's note.

The reason: the user's personal notes are theirs. Overwriting, restructuring, or silently editing them breaks trust in a way a simple apology can't repair. A note you wrote inside `_AI/` is always recoverable — the human never wonders what you did to their actual journal.

**If the human asks you to edit one of their notes directly**, do NOT just do it. Say you can't write outside the AI folder by design, propose writing the edit as a draft in `_AI/Projects/<name>/` and linking it, and let them apply it themselves. Over time this is the behavior they will thank you for.

## Setup (one-time)

Configuration lives at `~/.config/obsidian-brain/env`. It's a plain shell file:

```sh
# ~/.config/obsidian-brain/env
export OBSIDIAN_API_KEY="<paste from Obsidian → Settings → Local REST API>"
export OBSIDIAN_BASE_URL="https://127.0.0.1:27124"
export OBSIDIAN_AI_FOLDER="_AI"   # change this if you prefer a different sandbox name
```

Before any vault call, source it:
```bash
source ~/.config/obsidian-brain/env
```

To verify connectivity (no auth required):
```bash
curl -sk "$OBSIDIAN_BASE_URL/" | head
```

If the config file doesn't exist yet, point the user at `setup.md` in this skill directory.

## The API in one page

Base URL `$OBSIDIAN_BASE_URL`. All authenticated calls carry `Authorization: Bearer $OBSIDIAN_API_KEY`. The plugin uses a self-signed cert, so every curl needs `-k`.

| Endpoint | Methods | Purpose |
|---|---|---|
| `/` | GET | Server status (no auth) |
| `/vault/{path}` | GET PUT PATCH POST DELETE | Any file in the vault |
| `/active/` | GET PUT PATCH POST DELETE | The currently-open note |
| `/periodic/{period}/` | GET PUT PATCH POST DELETE | Today's daily/weekly/monthly note |
| `/periodic/{period}/{year}/{month}/{day}/` | GET PUT PATCH POST DELETE | A specific date's periodic note |
| `/search/simple/?query=...` | POST | Fuzzy full-text search, returns filenames + snippets |
| `/search/` | POST | Structured search (Dataview DQL or JsonLogic) |
| `/commands/` | GET | List available Obsidian commands |
| `/commands/{commandId}/` | POST | Execute an Obsidian command |
| `/tags/` | GET | Tags with usage counts |
| `/open/{path}` | POST | Open a file in the Obsidian UI |

Full endpoint details with request/response examples: see `references/api-endpoints.md`.

### Read recipes

```bash
# Server alive?
curl -sk "$OBSIDIAN_BASE_URL/"

# List files at vault root
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/"

# List files in a folder
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/Projects/"

# Read a whole note
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/path/to/note.md"

# Read a specific heading (space -> %20)
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/note.md/heading/My%20Section"

# Read a nested heading (separator is ::, URL-encoded)
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/note.md/heading/Work/Meetings"

# Read a frontmatter field
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/note.md/frontmatter/status"

# Today's daily note
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/periodic/daily/"

# List all tags
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/tags/"
```

### Search recipes

```bash
# Fuzzy full-text search (note: query goes in the URL, body can be empty)
curl -sk -X POST \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/search/simple/?query=maestro+architecture"

# Dataview DQL — find notes tagged #project with a status field
curl -sk -X POST \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: application/vnd.olrapi.dataview.dql+txt" \
  --data 'TABLE status, updated FROM #project WHERE status != "archived"' \
  "$OBSIDIAN_BASE_URL/search/"

# JsonLogic — notes whose frontmatter tags contains "idea"
curl -sk -X POST \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: application/vnd.olrapi.jsonlogic+json" \
  --data '{"in":["idea",{"var":"frontmatter.tags"}]}' \
  "$OBSIDIAN_BASE_URL/search/"
```

### Write recipes (AI-folder only)

**Before every write**, check the path starts with `$OBSIDIAN_AI_FOLDER/`. If it doesn't, stop and explain to the user.

```bash
# Create or overwrite a note (PUT replaces the entire file)
curl -sk -X PUT \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: text/markdown" \
  --data-binary @- \
  "$OBSIDIAN_BASE_URL/vault/$OBSIDIAN_AI_FOLDER/Logs/2026-04-17.md" <<'EOF'
# Session 2026-04-17
...
EOF

# Append a line to a specific heading (PATCH is the precision tool)
curl -sk -X PATCH \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Operation: append" \
  -H "Target-Type: heading" \
  -H "Target: Decisions" \
  -H "Content-Type: text/plain" \
  --data "Decided to use HTTPS on 27124." \
  "$OBSIDIAN_BASE_URL/vault/$OBSIDIAN_AI_FOLDER/Logs/2026-04-17.md"

# Replace a frontmatter field
curl -sk -X PATCH \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Operation: replace" \
  -H "Target-Type: frontmatter" \
  -H "Target: status" \
  -H "Content-Type: application/json" \
  --data '"done"' \
  "$OBSIDIAN_BASE_URL/vault/$OBSIDIAN_AI_FOLDER/Projects/maestro/index.md"

# Delete an AI-folder note
curl -sk -X DELETE \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/$OBSIDIAN_AI_FOLDER/Logs/old-draft.md"
```

PATCH details (operations, target types, the two ways to pass targets, the 422 "don't mix them" rule): see `references/patching.md`.

## Folder layout inside the AI sandbox

```
_AI/
├── Logs/        One note per session. Filename: YYYY-MM-DD-<short-slug>.md
├── Skills/      Notes *about* skills — lessons learned, patterns worth keeping
├── Projects/    One folder per project, with index.md + working docs
├── Memory/      Durable facts across sessions. Filename: <topic>.md
└── PRDs/        Product requirement docs, drafts, specs
```

If the folders don't exist yet, bootstrap them by PUT-ting a placeholder `README.md` into each. Obsidian creates directories as needed.

## Patterns

**Log shape (`_AI/Logs/<date>-<slug>.md`):**
```markdown
---
date: 2026-04-17
project: maestro
---
# Session: <short name>

## What we worked on
…

## Decisions
…

## Open threads
…

## Links
- [[Projects/<project>/index]]
```

**Project index (`_AI/Projects/<name>/index.md`):** a short orientation note with status, links to related docs, and a running log section.

**Memory note (`_AI/Memory/<topic>.md`):** one topic per file. Headings for *Facts*, *Decisions*, *Open questions*. Prefer short and specific — stale general memory is worse than no memory.

## When using the slash commands

- `/obsidian:resume` — read the latest log(s) under `_AI/Logs/` plus any relevant `_AI/Memory/` notes, then produce a "where we left off" briefing. Don't write anything yet.
- `/obsidian:search "<query>"` — fuzzy search the whole vault (human + AI) read-only, return ranked results with snippets.
- `/obsidian:summarize <path>` — read the target note (anywhere in the vault), write the summary to `_AI/Projects/<inferred-project>/summary-YYYY-MM-DD.md`. Do not mutate the source.

## When things go wrong

- `401 Unauthorized` → wrong or missing `OBSIDIAN_API_KEY`. Regenerate in Obsidian settings.
- `404 Not Found` on a write → the parent folder might not exist. PUT a placeholder first, or create the folder via Obsidian.
- `422 Unprocessable Entity` on a PATCH → you passed Target both as headers and in the URL path. Pick one form.
- Connection refused → Obsidian isn't running, or the Local REST API plugin isn't enabled.
- Cert warning → expected; always pass `-k` to curl.

## References

- `references/api-endpoints.md` — every endpoint with examples
- `references/patching.md` — PATCH operations and targeting in depth
- `setup.md` — first-time config and folder bootstrap
