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
  --load-from <dir> detect existing config against <dir> as a fake $HOME
                    instead of the real machine (point at an empty folder to
                    show a full setup — for demos/recordings). Detection only;
                    writes still go to the real targets.
  --all             include items already configured (default: skip them)
  --print-plan      print the plan and exit (no TUI, no execution)
  --yes             run the setup headlessly, no TUI
                    (combine with --dry-run to preview)
  -h, --help        this help

By default the wizard probes your current setup and patches only what's
missing. Pass --all to re-apply everything.
`);
  process.exit(0);
}

const targetDir = val('--target', process.cwd());
const dryRun = has('--dry-run');
const includeAll = has('--all');
const loadFrom = val('--load-from', undefined);

// Headless paths: no TUI, scriptable, also the smoke-test surface.
if (has('--print-plan') || has('--yes')) {
  const { marketplaces, plugins, mcpServers, userSkills, scaffold } = await import('../src/catalog.js');
  const { buildPlan, runHeadless } = await import('../src/runner.js');
  const { loadState, emptyState } = await import('../src/state.js');
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const state = includeAll ? emptyState : loadState(loadFrom);
  const take = (arr, kind) => arr.filter((x) => x.selected && !state.isPresent(kind, x));
  const plan = buildPlan({
    marketplaces: take(marketplaces, 'marketplaces').map((x) => x.id),
    plugins: take(plugins, 'plugins').map((x) => x.id),
    mcp: take(mcpServers, 'mcp'),
    userSkills: take(userSkills, 'userSkills'),
    scaffold: scaffold.filter((x) => x.selected && (includeAll || !existsSync(join(targetDir, x.path)))),
    targetDir,
  });
  if (has('--print-plan')) {
    const skipNote = includeAll ? '' : ' (already-configured items skipped; --all to include)';
    process.stdout.write(`Plan — ${plan.length} actions (target: ${targetDir})${skipNote}\n\n`);
    if (plan.length === 0) { process.stdout.write('  Nothing to patch — everything is already configured.\n'); process.exit(0); }
    for (const t of plan) {
      const argv = t.argv ? t.argv.map((a) => a.replace(/(API_KEY=)\S+/i, '$1****')) : [];
      const detail = t.kind === 'cmd' ? `claude ${argv.join(' ')}` : `write ${t.path}`;
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

const { loadState, emptyState } = await import('../src/state.js');
const state = includeAll ? emptyState : loadState(loadFrom);
const React = (await import('react')).default;
const { render } = await import('ink');
const App = (await import('../src/app.js')).default;
render(React.createElement(App, { targetDir, dryRunDefault: dryRun, state, includeAll, detectFrom: loadFrom }));
