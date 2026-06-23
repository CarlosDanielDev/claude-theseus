# PATCH — Targeted Edits

The Local REST API's `PATCH` method is the most useful part of the API: it lets you edit a specific heading, block, or frontmatter field *without* fetching the whole file or stomping unrelated content. Use it in preference to GET-then-PUT whenever possible.

## Anatomy

Every PATCH request carries:

| Header | Values | Meaning |
|---|---|---|
| `Operation` | `append`, `prepend`, `replace` | What to do with the payload |
| `Target-Type` | `heading`, `block`, `frontmatter` | What kind of thing to target |
| `Target` | e.g. `My Section`, `^block-id`, `status` | Which specific target |
| `Content-Type` | `text/plain`, `text/markdown`, `application/json` | The payload format |

Plus the URL: `/vault/{path}` (or `/active/`, `/periodic/…/`).

## Two ways to specify the target

You can pass the target via **headers** OR via **URL path segments** — but not both. Mixing them returns `422 Unprocessable Entity`.

### Headers

```bash
curl -sk -X PATCH \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Operation: append" \
  -H "Target-Type: heading" \
  -H "Target: My Section" \
  -H "Content-Type: text/plain" \
  --data "New line of content" \
  "$OBSIDIAN_BASE_URL/vault/_AI/Logs/2026-04-17.md"
```

### URL path (GET, PUT, POST only — not PATCH)

For read (`GET`) and whole-target replace (`PUT`, `POST`), you can skip the headers and append `/<target-type>/<target>` to the URL:

```bash
# Read the content under "My Section"
curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  "$OBSIDIAN_BASE_URL/vault/note.md/heading/My%20Section"

# PUT new content for "My Section" (replaces it)
curl -sk -X PUT \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Content-Type: text/plain" \
  --data "Updated content" \
  "$OBSIDIAN_BASE_URL/vault/note.md/heading/My%20Section"
```

PATCH always uses headers.

## Operation × Target-Type matrix

### `Target-Type: heading`

`Target` is the heading text. For nested headings, separate levels with `::` (or `/` when in the URL path).

```bash
# Append a bullet under "Decisions"
-H "Operation: append" -H "Target-Type: heading" -H "Target: Decisions"

# Nested: append under "Work :: Meetings"
-H "Operation: append" -H "Target-Type: heading" -H "Target: Work::Meetings"

# Replace everything under that heading (keeps the heading itself)
-H "Operation: replace" -H "Target-Type: heading" -H "Target: Decisions"

# Prepend above existing content in that section
-H "Operation: prepend" -H "Target-Type: heading" -H "Target: Decisions"
```

### `Target-Type: block`

`Target` is the block reference id (the `^id` suffix Obsidian puts at the end of a paragraph).

```bash
-H "Operation: replace" -H "Target-Type: block" -H "Target: ^idea-2026-04-17"
```

Use this when you've previously tagged a specific paragraph with `^id` for stable addressing.

### `Target-Type: frontmatter`

`Target` is the frontmatter key. Payload should be JSON (`Content-Type: application/json`). `append` / `prepend` work on array fields; `replace` works on any field.

```bash
# Replace a scalar
-H "Operation: replace" -H "Target-Type: frontmatter" -H "Target: status" \
-H "Content-Type: application/json" \
--data '"done"'

# Append to a tags array
-H "Operation: append" -H "Target-Type: frontmatter" -H "Target: tags" \
-H "Content-Type: application/json" \
--data '"decided"'
```

## Common failures

- **422 Unprocessable Entity** — you passed Target as both headers AND URL path. Remove one.
- **404 Not Found** on a heading target — heading doesn't exist in the file. Either PUT the section first (PUT with `/heading/<name>` creates the section if missing in some plugin versions — check), or POST the whole file with the heading included.
- **400 Bad Request** on frontmatter — payload isn't valid JSON for the field's expected shape. Strings need quotes (`'"done"'` not `done`).
- **Wrong content merged in the middle of the section** — you used `append` when you wanted `replace`. `append` adds *under* the heading but *after* existing content.

## Patterns worth reusing

**Append to today's log:**
```bash
curl -sk -X PATCH \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Operation: append" -H "Target-Type: heading" -H "Target: Decisions" \
  -H "Content-Type: text/markdown" \
  --data "- $(date +%H:%M): decided to X because Y" \
  "$OBSIDIAN_BASE_URL/periodic/daily/"
```
(That writes to the human's daily note — only do this with explicit permission, since the daily note is the human's. Prefer `_AI/Logs/<date>.md` for autonomous logging.)

**Mark a project done:**
```bash
curl -sk -X PATCH \
  -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
  -H "Operation: replace" -H "Target-Type: frontmatter" -H "Target: status" \
  -H "Content-Type: application/json" \
  --data '"done"' \
  "$OBSIDIAN_BASE_URL/vault/_AI/Projects/maestro/index.md"
```
