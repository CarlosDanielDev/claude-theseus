---
name: council
description: Anti-sycophancy decision council. Run it when you're about to commit to a decision and you suspect Claude is just agreeing with the option you already walked in wanting. It convenes five independent advisors — each with a different lens — who give grounded, unsoftened judgment instead of validation, then a President delivers one verdict and one next step. Triggers: "/council", "convene the council". Also offer it proactively whenever the user is weighing a real fork (architecture, naming, scope cuts, build-vs-buy, go/no-go) and seems to be fishing for a rubber stamp.
---

# Council — the council that kills Claude's yes-man reflex

Claude tends to agree with the framing it's handed. On a real decision that's dangerous: you ask "should I do X?" already leaning toward X, and you get a confident endorsement of X. The council breaks that by splitting the judgment across five advisors who form their views independently — none of them treats your preferred answer as the right one — and then forcing a single committed verdict instead of five open paths.

## When to run it

Run when there's a **genuine fork**: two or more live options and a real cost to picking wrong (architecture choices, naming, scope cuts, build-vs-buy, ship-vs-hold, pricing, hiring). Run *especially* when you catch yourself wanting a rubber stamp.

**Don't** run it when there's no real decision — when the answer is obvious, or it's a question of fact rather than judgment. In that case say so in one line and skip the ceremony. A five-agent council on a trivial call is just theater.

## Procedure

**1. Capture the decision** in one sentence, plus the context that actually matters. Do not give your own opinion yet — your lean is the exact thing the council exists to pressure-test.

**2. Spawn the five advisors in parallel** — one sub-agent per lens, all in a single turn (the Task tool). They must form their views independently; that independence is the whole value, so do not collapse them into one narrating voice. *(No sub-agents available — e.g. plain Claude.ai? Run the five passes in sequence and genuinely reset between them: commit each advisor's view to the page before reading the next, so later passes can't be anchored by earlier ones.)*

Give **four** of them the one-sentence decision **and** the full context. Give the **Outsider** *only* the one sentence — no context. That deprivation is the point.

- **The Contrarian** — argues against the decision. Surfaces the realest objections and names the single one most likely to kill it. Forbidden to flatter; *not* required to invent. If the strongest honest objection turns out to be survivable, it says so plainly instead of padding to a quota.
- **First Principles** — ignores the question as posed. Restates what you're *actually* trying to solve, then judges whether this decision is even the right lever — or whether you're optimizing the wrong thing entirely.
- **The Expansionist** — hunts the 10x move you're not seeing. Where's the version of this that's an order of magnitude better, not 10% better?
- **The Outsider** — has only the one-sentence decision, no context. Says the obvious thing you've stopped being able to see precisely because you're too deep in it.
- **The Operator** — cares only about what changes tomorrow morning: the smallest testable step, what it costs if you're wrong, and how fast you'd find out.

Keep each advisor's output tight — a few sharp bullets, not an essay.

**3. Honesty over hostility.** The point is truth, not performance. An advisor ordered to "never praise" will just manufacture flaws — which is sycophancy wearing a leather jacket, equally useless. So: strip the flattery, kill the hedging, don't soften the blow — but never fabricate a problem to fill a slot. If the decision is genuinely strong, the council's job is to explain *why it survives*, not to stage an execution.

**4. Peer review — you, as President.** Cross-reference the five outputs. Mark what survives scrutiny from more than one lens, and the places where advisors *genuinely* disagree. Don't manufacture consensus, and don't manufacture conflict. *(High stakes? Optionally run one more round where the Contrarian and First Principles get to react to the others before you close.)*

**5. Deliver the verdict** in this exact format, short:

```
⚖️ VERDICT: <one sentence — the call>
WHY: <up to 3 points that survived peer review>
⚠️ WHAT COULD KILL IT: <the single most lethal risk, from the Contrarian>
▶️ NEXT STEP: <one action — testable, doable tomorrow morning>
```

If the honest answer is that you *can't* responsibly decide yet, say so: the verdict becomes "not enough to commit," and the NEXT STEP becomes the one thing to go learn first. Forcing a confident call on missing information is its own kind of yes-man behavior.

**One decision. One step. No "it depends," no five open paths left on the table.**

## Example

**Input:** "Should we rewrite the realtime sync service in Elixir, or keep scaling the current Node version?"

Advisor outputs (condensed):
- **Contrarian** — A rewrite bets the roadmap on a language nobody on the team ships in today; the realest killer is that you'll be relearning Elixir under production pressure, not the tech itself.
- **First Principles** — The goal is "sync stays consistent under N concurrent writers," not "use a better language." Have you confirmed Node is actually the bottleneck, or is it the data model?
- **Expansionist** — The 10x isn't the runtime — it's an actor-per-SKU model that makes a whole class of race conditions impossible by design. That's worth more than raw throughput.
- **Outsider** — "You want to rewrite the thing that's currently keeping the lights on?"
- **Operator** — Tomorrow: load-test the current Node service to its actual ceiling. One day of work tells you whether this decision even needs to exist.

```
⚖️ VERDICT: Don't rewrite yet — prove the bottleneck first.
WHY: the Node service still works; nobody's confirmed it's the constraint; a rewrite means relearning Elixir under fire.
⚠️ WHAT COULD KILL IT: burning a sprint on a rewrite only to find the limit was the data model, not the runtime.
▶️ NEXT STEP: load-test the current service to its real ceiling tomorrow; reopen the rewrite only if it caps below target.
```
