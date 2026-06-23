---
description: Fuzzy-search my Obsidian vault (both human and AI notes) and summarize the hits
argument-hint: <query>
---

Invoke the `obsidian-brain` skill.

Goal: run a full-text search across the vault and present the most relevant notes with context.

Query: `$ARGUMENTS`

Steps:

1. Source the config: `source ~/.config/obsidian-brain/env`.
2. If `$ARGUMENTS` is empty, ask the user for a query and stop.
3. URL-encode the query (spaces → `+`) and call:
   ```bash
   curl -sk -X POST \
     -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
     "$OBSIDIAN_BASE_URL/search/simple/?query=<encoded>"
   ```
4. Parse the response — it's an array of `{ filename, score, matches: [...] }`.
5. Present the top 5–10 hits, grouped by whether they're in the AI sandbox (`$OBSIDIAN_AI_FOLDER/…`) or the human's notes. For each hit show:
   - the file path as a clickable-looking reference
   - the score
   - 1–2 snippets with the match highlighted in context
6. Suggest 1–2 follow-up queries if the results look thin.
7. If the user asks "read that note", follow up by GET-ing `/vault/<path>`.

**Read-only.** Do not write to the vault from this command.
