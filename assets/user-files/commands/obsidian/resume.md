---
description: Read recent AI logs and memory from Obsidian and brief me on where we left off
argument-hint: [optional project name]
---

Invoke the `obsidian-brain` skill.

Goal: produce a **"where we left off"** briefing from the AI sandbox in my Obsidian vault.

Steps:

1. Source the config: `source ~/.config/obsidian-brain/env`.
2. If `$ARGUMENTS` is non-empty, treat it as a project name/slug to focus on. Otherwise brief broadly.
3. List recent logs:
   ```bash
   curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" \
     "$OBSIDIAN_BASE_URL/vault/$OBSIDIAN_AI_FOLDER/Logs/"
   ```
4. Read the 1–3 most recent log files (by filename-date). If a project was specified, prefer logs whose frontmatter `project` matches, or whose filename contains the slug.
5. List `_AI/Memory/` and read any topic notes that look relevant to the project (or the most recently updated ones, if no project).
6. If a specific project was mentioned, also read `_AI/Projects/<project>/index.md` when it exists.
7. Produce a concise brief with these sections:
   - **Where we are** — 1–3 sentences of context
   - **Recent decisions** — bullets, pulled from the logs' *Decisions* sections
   - **Open threads** — bullets, pulled from the logs' *Open threads* sections
   - **Relevant memory** — 1–3 bullets pointing at specific Memory notes
   - **Suggested next step** — one clear action

**Do not write to the vault during resume.** This command is read-only. The user will tell you what to pick up next.

If the skill's config file doesn't exist, point them at `~/.claude/skills/obsidian-brain/setup.md`.
