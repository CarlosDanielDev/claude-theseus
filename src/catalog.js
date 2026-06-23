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
export const plugins = [
  { id: 'superpowers@claude-plugins-official', note: 'skills + workflow discipline', selected: true },
  { id: 'caveman@caveman', note: 'compressed prose', selected: true },
  { id: 'ponytail@ponytail', note: 'minimalism / YAGNI', selected: true },
  { id: 'ui-ux-pro-max@ui-ux-pro-max-skill', note: 'UI/UX design intel', selected: true },
  { id: 'figma@claude-plugins-official', note: 'Figma integration', selected: true },
  { id: 'frontend-design@claude-plugins-official', note: 'frontend generation', selected: true },
  { id: 'code-review@claude-plugins-official', note: 'PR review', selected: true },
  { id: 'security-guidance@claude-plugins-official', note: 'OWASP guidance', selected: true },
  { id: 'skill-creator@claude-plugins-official', note: 'author new skills', selected: true },
  { id: 'claude-code-setup@claude-plugins-official', note: 'automation recommender', selected: true },
  { id: 'firebase@claude-plugins-official', note: 'Firebase MCP + tools', selected: false },
  { id: 'rust-analyzer-lsp@claude-plugins-official', note: 'Rust LSP backend', selected: false },
  { id: 'swift-lsp@claude-plugins-official', note: 'Swift LSP backend', selected: false },
  { id: 'clangd-lsp@claude-plugins-official', note: 'C/C++ LSP backend', selected: false },
];

// MCP servers. `argv` is passed straight to `claude mcp add`.
// Servers needing secrets carry a `prompt` field the wizard fills in.
export const mcpServers = [
  {
    id: 'obsidian-mcp-server',
    note: 'Obsidian vault via Local REST API (stdio)',
    argv: ['mcp', 'add', 'obsidian-mcp-server', '--', 'npx', '-y', 'obsidian-mcp-server'],
    selected: true,
  },
  {
    id: 'context7',
    note: 'library docs lookup (HTTP)',
    argv: ['mcp', 'add', '--transport', 'http', 'context7', 'https://mcp.context7.com/mcp'],
    selected: true,
  },
  {
    id: 'figma-remote-mcp',
    note: 'remote Figma integration (HTTP)',
    argv: ['mcp', 'add', '--transport', 'http', 'figma-remote-mcp', 'https://mcp.figma.com/mcp'],
    selected: true,
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
