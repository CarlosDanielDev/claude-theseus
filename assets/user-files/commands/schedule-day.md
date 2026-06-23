---
description: Generate today's QRSafe 100-Days issue from the Obsidian schedule (knowledge recap + concept + hint steps, no solution code), preview, then create it on GitHub.
argument-hint: <day-number>
allowed-tools: Bash(source:*), Bash(curl:*), Bash(gh issue create:*), Bash(gh label list:*), Skill(obsidian-brain)
---

You are running the **QRSafe 100 Days of Code** daily-issue pipeline. The day number is: **$ARGUMENTS**

Carlos is learning Swift by building QRSafe (iOS QR-safety scanner; SwiftUI, MVVM, iOS 16+) in public. **Hard rule — Carlos writes ALL Swift himself.** You produce an issue that teaches and scopes the day. Never put Swift solution code in the issue; type/API names, doc links, and ordered hint steps only.

## Steps

1. **Read the schedule** from Obsidian (read-only):
   ```
   source ~/.config/obsidian-brain/env
   curl -sk -H "Authorization: Bearer $OBSIDIAN_API_KEY" "$OBSIDIAN_BASE_URL/vault/_AI/Projects/qrsafe/100-Days-Schedule.md"
   ```
   Locate the **Day $ARGUMENTS** entry: its goal sentence, the 🧠 concept(s), and the 🔗 link(s).
   Also collect every 🧠 line from Day 1 through Day ($ARGUMENTS − 1) — that's the "knowledge so far".

2. **Derive label + milestone** from the day number (Guide §9):
   - 1–12 → `phase:foundation` · `v0.1.0 Project Foundation`
   - 13–28 → `phase:scanner` · `v0.2.0 QR Scanner Core`
   - 29–50 → `phase:safety` · `v0.3.0 Safety Analysis Engine`
   - 51–66 → `phase:persistence` · `v0.4.0 Persistence & History`
   - 67–86 → `phase:polish` · `v0.5.0 Localization & Polish`
   - 87–100 → `phase:release` · `v0.6.0 Testing & Release`

3. **Write the issue body** in this exact structure (replace the `<...>` parts):

   ```markdown
   ## User story
   As a **developer learning Swift in public**, I want **<the day's title>**, so that **<benefit tied to QRSafe>**.

   ## Context
   <2-3 sentences: where this fits in the app and what already exists from previous days>

   ## Knowledge so far
   <3-5 bullets: the previously covered concepts today builds on, one line each — enough to catch back up after a break>

   ## Swift concept(s) for today
   <each 🧠 concept from the entry, explained in 2-3 plain sentences for an experienced dev new to Swift, with its doc link>

   ## Acceptance criteria
   <2-4 Given/When/Then checkboxes derived from the day's goal>
   - [ ] Builds and runs on the simulator

   ## Suggested approach
   <3-6 numbered HINT steps: which files/types/APIs to touch, in what order. Hints, not code.>

   ## Definition of Done
   - [ ] Tests written/updated and green (TDD where it fits)
   - [ ] App builds & runs
   - [ ] Notebook entry written: today's concept + learnings, in my own words
   - [ ] PR opened answering **What / Why / What I learned**, with `Closes #<this issue>`, merged
   - [ ] Codeup updated with the day's notes
   - [ ] Instagram posted

   ## Time box
   Min 1h · target ~3h

   ## Resources
   <the 🔗 links from the schedule entry>
   ```

4. **Preview** the full body to Carlos, with a one-line header showing title, labels (`100daysofcode`, the phase label), and milestone. **Ask him to confirm** before creating — do not create the issue unprompted.

5. **On confirmation**, create it:
   ```
   gh issue create -R CarlosDanielDev/qrsafe \
     --title "Day $ARGUMENTS — <title>" \
     --body "<body>" \
     --label "100daysofcode" --label "<phase label>" \
     --milestone "<milestone>"
   ```
   Report the issue URL.

## Notes
- If Day $ARGUMENTS isn't in the schedule, stop and say so.
- If the `gh` milestone/label doesn't exist yet, tell Carlos which `gh label create` / milestone step from Guide §5 to run — don't silently drop it.
- Keep "Suggested approach" as a map, not a route: enough to unblock, not enough to remove the learning.
