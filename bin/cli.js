#!/usr/bin/env node
import process from 'node:process';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

if (has('-h') || has('--help')) {
  process.stdout.write(`theseus — Claude Code setup wizard

Usage: claude-theseus [options]

  (no options)      launch the interactive TUI wizard
  --dry-run         start the wizard in dry-run mode (preview commands)
  --target <dir>    where to scaffold .claude/ files (default: cwd)
  --print-plan      print the full default plan and exit (no TUI, no execution)
  --yes             run the full default setup headlessly, no TUI
                    (combine with --dry-run to preview)
  -h, --help        this help
`);
  process.exit(0);
}

const targetDir = val('--target', process.cwd());
const dryRun = has('--dry-run');

// Headless paths: no TUI, scriptable, also the smoke-test surface.
if (has('--print-plan') || has('--yes')) {
  const { marketplaces, plugins, mcpServers, userSkills, scaffold } = await import('../src/catalog.js');
  const { buildPlan, runHeadless } = await import('../src/runner.js');
  const plan = buildPlan({
    marketplaces: marketplaces.filter((x) => x.selected).map((x) => x.id),
    plugins: plugins.filter((x) => x.selected).map((x) => x.id),
    mcp: mcpServers.filter((x) => x.selected),
    userSkills: userSkills.filter((x) => x.selected),
    scaffold: scaffold.filter((x) => x.selected),
    targetDir,
  });
  if (has('--print-plan')) {
    process.stdout.write(`Default plan — ${plan.length} actions (target: ${targetDir})\n\n`);
    for (const t of plan) {
      const detail = t.kind === 'cmd' ? `claude ${t.argv.join(' ')}` : `write ${t.path}`;
      process.stdout.write(`  ${t.kind === 'cmd' ? '⚡' : '✎'} ${detail}\n`);
    }
    process.exit(0);
  }
  process.exit(await runHeadless(plan, { dryRun }));
}

if (!process.stdin.isTTY) {
  process.stderr.write('No TTY. Use --print-plan or --yes for non-interactive runs.\n');
  process.exit(2);
}

const React = (await import('react')).default;
const { render } = await import('ink');
const App = (await import('../src/app.js')).default;
render(React.createElement(App, { targetDir, dryRunDefault: dryRun }));
