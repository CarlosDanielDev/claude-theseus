import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// The known-good Claude Code environment, captured from a working machine.
// Each item carries `selected` (default check state) so the wizard preselects
// the full setup but lets you trim.

export const marketplaces = [
  { id: 'anthropics/claude-plugins-official', label: 'claude-plugins-official', note: '200+ official plugins', selected: true },
  { id: 'anthropics/claude-code', label: 'claude-code', note: 'core', selected: true },
  { id: 'JuliusBrussee/caveman', label: 'caveman', note: 'compressed comms', selected: true },
  { id: 'nextlevelbuilder/ui-ux-pro-max-skill', label: 'ui-ux-pro-max-skill', note: 'design', selected: true },
  { id: 'DietrichGebert/ponytail', label: 'ponytail', note: 'lazy mode', selected: true },
];

// plugin id is `name@marketplace` — install verbatim.
// info: { why, who, what, goal, impact } — shown in the wizard detail panel.
export const plugins = [
  {
    id: 'superpowers@claude-plugins-official', note: 'skills + workflow discipline', selected: true,
    info: {
      why: 'Claude drifts into ad-hoc work without a process spine.',
      who: 'Any dev who wants disciplined, repeatable AI workflows.',
      what: 'Skills + enforcement: TDD, brainstorming, planning, debugging.',
      goal: 'Make Claude follow a method before writing code.',
      impact: 'Fewer rework loops — plans and tests precede implementation.',
    },
  },
  {
    id: 'caveman@caveman', note: 'compressed prose', selected: true,
    info: {
      why: 'Verbose AI prose burns tokens and attention.',
      who: 'Token-conscious users on long sessions.',
      what: 'Compressed caveman response mode + commit/review variants.',
      goal: 'Cut output tokens ~75% without losing technical content.',
      impact: 'Measured token savings per session via /caveman-stats.',
    },
  },
  {
    id: 'ponytail@ponytail', note: 'minimalism / YAGNI', selected: true,
    info: {
      why: 'Over-engineering is the default failure mode of codegen.',
      who: 'Devs fighting bloat, speculative abstractions, dep creep.',
      what: 'Laziness/YAGNI enforcement: stdlib over deps, shortest diff.',
      goal: 'Ship the minimal solution that actually works.',
      impact: 'Smaller diffs, fewer deps, less code to maintain.',
    },
  },
  {
    id: 'ui-ux-pro-max@ui-ux-pro-max-skill', note: 'UI/UX design intel', selected: true,
    info: {
      why: 'AI UIs look generic and inaccessible by default.',
      who: 'Frontend/product builders wanting distinctive, usable UI.',
      what: '50+ styles, palettes, font pairs, UX guidelines, chart types.',
      goal: 'Produce polished, accessible interfaces with intent.',
      impact: 'Higher design quality; fewer a11y and layout defects.',
    },
  },
  {
    id: 'figma@claude-plugins-official', note: 'Figma integration', selected: true,
    info: {
      why: 'Design↔code handoff loses fidelity.',
      who: 'Teams syncing Figma designs with code.',
      what: 'Figma integration: read designs, Code Connect, generate.',
      goal: 'Keep design and implementation in sync both directions.',
      impact: 'Less manual translation; fewer design-drift bugs.',
    },
  },
  {
    id: 'frontend-design@claude-plugins-official', note: 'frontend generation', selected: true,
    info: {
      why: 'Component/page generation tends toward boilerplate.',
      who: 'Web devs building components, pages, apps.',
      what: 'Production-grade frontend code generation.',
      goal: 'Generate distinctive, working UI fast.',
      impact: 'Faster scaffolds with a higher baseline quality.',
    },
  },
  {
    id: 'code-review@claude-plugins-official', note: 'PR review', selected: true,
    info: {
      why: 'Bugs and over-engineering slip through self-review.',
      who: 'Anyone merging PRs.',
      what: 'Diff review for correctness + simplification.',
      goal: 'Catch defects and cleanups before merge.',
      impact: 'Fewer post-merge bugs; smaller, cleaner diffs.',
    },
  },
  {
    id: 'security-guidance@claude-plugins-official', note: 'OWASP guidance', selected: true,
    info: {
      why: 'Codegen omits security at trust boundaries.',
      who: 'Devs handling input, auth, secrets.',
      what: 'OWASP Top 10 guidance and patterns.',
      goal: 'Build secure-by-default code paths.',
      impact: 'Reduced injection / authz / secret-leak risk.',
    },
  },
  {
    id: 'skill-creator@claude-plugins-official', note: 'author new skills', selected: true,
    info: {
      why: 'Custom workflows need first-class skills, not prompts.',
      who: 'Power users authoring their own skills.',
      what: 'Scaffold, evaluate, and optimize skills.',
      goal: 'Turn repeated prompts into reusable skills.',
      impact: 'Better trigger accuracy, measurable via evals.',
    },
  },
  {
    id: 'claude-code-setup@claude-plugins-official', note: 'automation recommender', selected: true,
    info: {
      why: 'Most setups underuse hooks/agents/skills.',
      who: 'Teams optimizing their Claude Code config.',
      what: 'Analyzes a repo, recommends automations.',
      goal: 'Right-size the Claude Code setup per project.',
      impact: 'More automation coverage; less manual repetition.',
    },
  },
  {
    id: 'firebase@claude-plugins-official', note: 'Firebase MCP + tools', selected: false,
    info: {
      why: 'Firebase ops are CLI-heavy and error-prone.',
      who: 'Devs on Firebase projects.',
      what: 'Firebase MCP + tooling (deploy, rules, config).',
      goal: 'Drive Firebase from Claude safely.',
      impact: 'Fewer console round-trips; faster deploys.',
    },
  },
  {
    id: 'rust-analyzer-lsp@claude-plugins-official', note: 'Rust LSP backend', selected: false,
    info: {
      why: 'Claude edits Rust blind without LSP signals.',
      who: 'Rust developers.',
      what: 'rust-analyzer LSP backend.',
      goal: 'Give Claude type/diagnostic awareness in Rust.',
      impact: 'Fewer compile-break edits; accurate refactors.',
    },
  },
  {
    id: 'swift-lsp@claude-plugins-official', note: 'Swift LSP backend', selected: false,
    info: {
      why: 'Swift edits lack symbol/type context.',
      who: 'iOS/macOS Swift developers.',
      what: 'Swift LSP backend (SourceKit).',
      goal: 'Type-aware Swift edits.',
      impact: 'Fewer build breaks; precise navigation.',
    },
  },
  {
    id: 'clangd-lsp@claude-plugins-official', note: 'C/C++ LSP backend', selected: false,
    info: {
      why: 'C/C++ edits need accurate symbol resolution.',
      who: 'C/C++ developers.',
      what: 'clangd LSP backend.',
      goal: 'Type-aware C/C++ edits.',
      impact: 'Fewer compile errors; better navigation.',
    },
  },
];

// MCP servers. `argv` is passed straight to `claude mcp add`.
// Servers needing secrets carry a `prompt` field the wizard fills in.
export const mcpServers = [
  {
    id: 'obsidian-mcp-server',
    note: 'Obsidian vault via Local REST API (stdio)',
    argv: ['mcp', 'add', 'obsidian-mcp-server', '--', 'npx', '-y', 'obsidian-mcp-server'],
    selected: true,
    info: {
      why: 'Notes and decisions live outside the repo.',
      who: 'Obsidian users wanting AI to read/write the vault.',
      what: 'Vault access via the Local REST API.',
      goal: 'Let Claude recall and update your notes.',
      impact: 'Persistent context across sessions.',
    },
  },
  {
    id: 'context7',
    note: 'library docs lookup (HTTP)',
    argv: ['mcp', 'add', '--transport', 'http', 'context7', 'https://mcp.context7.com/mcp'],
    selected: true,
    info: {
      why: 'Model docs go stale; library APIs change.',
      who: 'Devs using fast-moving libraries.',
      what: 'Live library-docs lookup.',
      goal: 'Ground answers in current library docs.',
      impact: 'Fewer hallucinated or outdated API calls.',
    },
  },
  {
    id: 'figma-remote-mcp',
    note: 'remote Figma integration (HTTP)',
    argv: ['mcp', 'add', '--transport', 'http', 'figma-remote-mcp', 'https://mcp.figma.com/mcp'],
    selected: true,
    info: {
      why: 'Design data is not in the codebase.',
      who: 'Designers and devs working in Figma.',
      what: 'Remote Figma file access.',
      goal: 'Pull live design context into Claude.',
      impact: 'Accurate design-to-code without manual specs.',
    },
  },
];

// Loose user-global skills — not from any marketplace, vendored in assets/.
// Copied into ~/.claude/skills/ (home-relative, independent of --target).
export const userSkills = [
  {
    id: 'council',
    note: 'anti-sycophancy decision council',
    src: join(root, 'assets/user-skills/council/SKILL.md'),
    dest: '.claude/skills/council/SKILL.md',
    selected: true,
    info: {
      why: 'Claude tends to rubber-stamp the option you walked in with.',
      who: 'Anyone facing a real fork (architecture, build-vs-buy, go/no-go).',
      what: 'Five independent advisors + a President verdict.',
      goal: 'Kill the yes-man reflex on real decisions.',
      impact: 'Surfaces risks a single agreeable answer would hide.',
    },
  },
  {
    id: 'obsidian-brain',
    note: 'read/write Obsidian vault via Local REST API',
    src: join(root, 'assets/user-skills/obsidian-brain'),
    dest: '.claude/skills/obsidian-brain',
    dir: true,
    selected: true,
    info: {
      why: 'Vault knowledge and decisions are stranded outside chat.',
      who: 'Obsidian users who want Claude to read and extend notes.',
      what: 'Skill bundle: search, daily notes, memory, vault patching.',
      goal: 'Resume context and persist memory in your vault.',
      impact: 'Continuity across sessions; less re-explaining.',
    },
  },
];

// Project-local .claude/ scaffold. Each entry is one file written into the
// target project. Content is intentionally terse-but-real (Maestro-style).
export const scaffold = [
  {
    path: '.claude/skills/project-patterns/SKILL.md',
    selected: true,
    content: `---
name: project-patterns
description: Use when working in this project — ratatui TUI, tokio async, stream-json parsing conventions.
---

# Project Patterns

- TUI: ratatui + crossterm. Keep render pure; mutate state in the update step.
- Async: tokio. One runtime, spawn tasks; never block the reactor.
- IO: parse Claude stream-json line-by-line; tolerate partial frames.
- Errors: \`anyhow\` at boundaries, \`thiserror\` for typed domain errors.
`,
  },
  {
    path: '.claude/skills/api-contract-validation/SKILL.md',
    selected: true,
    content: `---
name: api-contract-validation
description: Use before sending requests to a model/provider — prevents client/model field mismatches.
---

# API Contract Validation

Validate request/response shapes against the provider contract before shipping.
Mismatched field names and enum values are the top source of silent failures.
`,
  },
  {
    path: '.claude/skills/security-patterns/SKILL.md',
    selected: true,
    content: `---
name: security-patterns
description: Use when handling input, auth, or secrets — OWASP Top 10 quick guidance.
---

# Security Patterns

- Validate at trust boundaries. Never trust client input.
- Secrets via env, never committed. Rotate on leak.
- Parameterize queries; escape output by context.
`,
  },
  {
    path: '.claude/commands/auto.md',
    selected: true,
    content: `---
description: Autonomous loop for one issue — implement, simplify, pushup.
---

Run the full loop for the referenced issue: implement -> simplify -> pushup.
One \`/auto\` per issue (branch lock). Stop on red tests or manual-QA gate.
`,
  },
  {
    path: '.claude/commands/implement.md',
    selected: true,
    content: `---
description: Implement a single issue with the full subagent sequence.
---

Implement the referenced issue TDD-first: RED -> GREEN -> REFACTOR.
Subagents are consultive; the orchestrator writes all non-doc code.
`,
  },
  {
    path: '.claude/commands/plan-feature.md',
    selected: true,
    content: `---
description: Plan a multi-issue feature, API contracts first.
---

Decompose the feature into issues. Define API contracts before implementation.
`,
  },
  {
    path: '.claude/agents/gatekeeper.md',
    selected: true,
    content: `---
name: gatekeeper
description: Blocks unready issues (Definition of Ready enforcement).
---

You are the gatekeeper. Reject issues missing acceptance criteria, scope, or
test plan. Consultive only — report, do not edit code.
`,
  },
  {
    path: '.claude/agents/architect.md',
    selected: true,
    content: `---
name: architect
description: Designs implementation strategy and flags architectural trade-offs.
---

You are the architect. Produce a step plan and name the critical files.
Consultive only.
`,
  },
  {
    path: '.claude/agents/qa.md',
    selected: true,
    content: `---
name: qa
description: Manual QA gate for UI changes — blocks PR until the matrix is run.
---

You are QA. For UI changes, produce a manual test matrix and block merge until
a human confirms it passes.
`,
  },
];
