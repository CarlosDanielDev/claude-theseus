# Obsidian Local REST API — Endpoint Reference

Source: <https://coddingtonbear.github.io/obsidian-local-rest-api/>

Base URL: `https://127.0.0.1:27124` (HTTPS, self-signed cert — always use `curl -k`).
Auth: `Authorization: Bearer <OBSIDIAN_API_KEY>` on every authenticated endpoint.

## Quick sanity check

```bash
# No auth required, returns server status
curl -sk "$OBSIDIAN_BASE_URL/"
```

## Endpoint table

| Endpoint | Methods | Notes |
|---|---|---|
| `/` | GET | Server status + auth check |
| `/vault/{path}` | GET, PUT, PATCH, POST, DELETE | Any file in the vault |
| `/active/` | GET, PUT, PATCH, POST, DELETE | The note currently open in Obsidian |
| `/periodic/{period}/` | GET, PUT, PATCH, POST, DELETE | Today's periodic note. `{period}` ∈ `daily`, `weekly`, `monthly`, `quarterly`, `yearly` |
| `/periodic/{period}/{year}/{month}/{day}/` | GET, PUT, PATCH, POST, DELETE | A specific date's periodic note |
| `/search/simple/?query=...` | POST | Fuzzy full-text search (Obsidian built-in) |
| `/search/` | POST | Structured search: Dataview DQL or JsonLogic |
| `/commands/` | GET | List all available Obsidian commands |
| `/commands/{commandId}/` | POST | Execute an Obsidian command |
| `/tags/` | GET | All tags with usage counts |
| `/open/{path}` | POST | Open a file in the Obsidian UI |

## /vault/{path}

### GET — read

```bash
# Whole file
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/path/to/note.md"

# List a folder (trailing slash matters)
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/Projects/"

# Read a specific heading via URL path
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/note.md/heading/My%20Section"

# Nested heading (levels separated by ::, URL-encoded as /)
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/note.md/heading/Work/Meetings"

# Frontmatter field
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/note.md/frontmatter/status"
```

### PUT — create or overwrite

```bash
curl -sk -X PUT \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: text/markdown" \
  --data-binary @- \
  "$OBSIDIAN_BASE_URL/vault/_AI/Memory/obsidian-setup.md" <<'EOF'
# Obsidian setup

Key lives in ~/.config/obsidian-brain/env.
EOF
```

### PATCH — targeted edit

See `patching.md` for the full operation/target reference. Example:

```bash
curl -sk -X PATCH \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Operation: append" \
  -H "Target-Type: heading" \
  -H "Target: Decisions" \
  -H "Content-Type: text/plain" \
  --data "Switched MCP to HTTPS on 27124." \
  "$OBSIDIAN_BASE_URL/vault/_AI/Logs/2026-04-17.md"
```

### POST — append to whole file

```bash
curl -sk -X POST \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: text/markdown" \
  --data "Appended content" \
  "$OBSIDIAN_BASE_URL/vault/_AI/Logs/2026-04-17.md"
```

### DELETE — remove file

```bash
curl -sk -X DELETE \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/_AI/Logs/old-draft.md"
```

## /active/

Same methods as `/vault/{path}` but operates on whichever note is currently focused in Obsidian. Useful when the user says "this note" without naming it.

## /periodic/{period}/ and /periodic/{period}/{year}/{month}/{day}/

Same methods. `period` values: `daily`, `weekly`, `monthly`, `quarterly`, `yearly`. With a date, target that specific one; without, target today's.

```bash
# Today's daily note
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/periodic/daily/"

# A specific date
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/periodic/daily/2026/04/15/"
```

## /search/simple/?query=...

Fuzzy full-text search. Query is a URL parameter; body is empty.

```bash
curl -sk -X POST \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/search/simple/?query=maestro+architecture"
```

Returns an array of `{ filename, score, matches: [{ match: { start, end }, context }] }`.

## /search/ — structured

Two content types; pick one:

**Dataview DQL** (`application/vnd.olrapi.dataview.dql+txt`):
```bash
curl -sk -X POST \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: application/vnd.olrapi.dataview.dql+txt" \
  --data 'TABLE status, updated FROM #project WHERE status != "archived"' \
  "$OBSIDIAN_BASE_URL/search/"
```

**JsonLogic** (`application/vnd.olrapi.jsonlogic+json`) — evaluated per note against `{ frontmatter, tags, path, content }`:
```bash
curl -sk -X POST \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: application/vnd.olrapi.jsonlogic+json" \
  --data '{"in":["idea",{"var":"frontmatter.tags"}]}' \
  "$OBSIDIAN_BASE_URL/search/"
```

## /commands/

```bash
# List
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/commands/"

# Execute by id (e.g. open command palette)
curl -sk -X POST \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/commands/editor:toggle-source/"
```

## /tags/

```bash
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/tags/"
```

Returns `[{ name, count }, ...]`.

## /open/{path}

```bash
curl -sk -X POST \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/open/_AI/Logs/2026-04-17.md"
```

Side-effect only: brings the note into focus in the Obsidian UI.
