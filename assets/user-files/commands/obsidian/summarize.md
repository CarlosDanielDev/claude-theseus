---
description: Read one or more Obsidian notes and save a summary into the AI sandbox
argument-hint: <note-path> [more paths...]
---

Invoke the `obsidian-brain` skill.

Goal: read target notes (anywhere in the vault, including the human's personal notes) and write a **summary into the AI sandbox only**. Never mutate the source notes.

Targets: `$ARGUMENTS` (one or more vault-relative paths, space-separated).

Steps:

1. Source the config: `source ~/.config/obsidian-brain/env`.
2. If `$ARGUMENTS` is empty, ask the user which notes to summarize.
3. For each target path:
   ```bash
   curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
     "$OBSIDIAN_BASE_URL/vault/<path>"
   ```
4. Infer a project slug:
   - If all targets share a top-level folder, use that as the slug
   - Otherwise, ask the user or use `misc`
5. Compose a summary note with these sections:
   - `## Sources` — list of source paths as `[[links]]`
   - `## TL;DR` — 2–4 sentences
   - `## Key points` — bullets
   - `## Questions / gaps` — anything unclear or missing
   - `## Next actions` — only if the sources imply them
6. Write to `$OBSIDIAN_AI_FOLDER/Projects/<slug>/summary-YYYY-MM-DD.md` via PUT:
   ```bash
   curl -sk -X PUT \
     -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
     -H "Content-Type: text/markdown" \
     --data-binary @- \
     "$OBSIDIAN_BASE_URL/vault/$OBSIDIAN_AI_FOLDER/Projects/<slug>/summary-<date>.md" <<EOF
   ...
   EOF
   ```
7. **Before the write, verify the destination path starts with `$OBSIDIAN_AI_FOLDER/`.** If not, abort and explain.
8. Confirm back to the user: summary path + 1-line preview.

**Hard rules:**
- Never write outside `$OBSIDIAN_AI_FOLDER/`.
- Never modify the source notes — not even to add a backlink.
- If the user asks you to edit a source note, refuse politely and offer to draft the edit in the AI sandbox for them to apply manually.
