// Builds the task list from selections and executes it (or prints it on dry-run).
// Tasks are either a `claude` subprocess or a local file-scaffold action.
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

// selections: { marketplaces:[id], plugins:[id], mcp:[serverObj], scaffold:[fileObj], targetDir }
// Returns ordered [{ kind:'cmd'|'scaffold', label, argv?, path?, content? }]
export function buildPlan(sel) {
  const tasks = [];
  for (const id of sel.marketplaces) {
    tasks.push({ kind: 'cmd', label: `marketplace add ${id}`, argv: ['plugin', 'marketplace', 'add', id] });
  }
  for (const id of sel.plugins) {
    tasks.push({ kind: 'cmd', label: `plugin install ${id}`, argv: ['plugin', 'install', id] });
  }
  for (const s of sel.mcp) {
    tasks.push({ kind: 'cmd', label: `mcp add ${s.id}`, argv: s.argv });
  }
  const dir = sel.targetDir || '.';
  for (const f of sel.scaffold) {
    tasks.push({ kind: 'scaffold', label: `write ${join(dir, f.path)}`, path: join(dir, f.path), content: f.content });
  }
  return tasks;
}

// Run one task. onLog(line) streams output. Resolves {ok, code}.
export function runTask(task, { dryRun, onLog }) {
  if (dryRun) {
    const preview = task.kind === 'cmd' ? `claude ${task.argv.join(' ')}` : `write -> ${task.path}`;
    onLog?.(`[dry-run] ${preview}`);
    return Promise.resolve({ ok: true, code: 0 });
  }
  if (task.kind === 'scaffold') {
    const full = resolve(task.path);
    return mkdir(dirname(full), { recursive: true })
      .then(() => writeFile(full, task.content))
      .then(() => ({ ok: true, code: 0 }))
      .catch((err) => {
        onLog?.(String(err.message || err));
        return { ok: false, code: 1 };
      });
  }
  return new Promise((res) => {
    const child = spawn('claude', task.argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    const tail = (buf) => buf.toString().split('\n').filter(Boolean).forEach((l) => onLog?.(l));
    child.stdout.on('data', tail);
    child.stderr.on('data', tail);
    child.on('error', (err) => { onLog?.(String(err.message || err)); res({ ok: false, code: 127 }); });
    child.on('close', (code) => res({ ok: code === 0, code: code ?? 1 }));
  });
}

// Headless runner for --print-plan / --yes (no TUI). Returns exit code.
export async function runHeadless(plan, { dryRun }) {
  let failures = 0;
  for (const task of plan) {
    process.stdout.write(`• ${task.label}\n`);
    const { ok } = await runTask(task, { dryRun, onLog: (l) => process.stdout.write(`    ${l}\n`) });
    if (!ok) { failures++; process.stdout.write(`    ✗ failed\n`); }
  }
  return failures === 0 ? 0 : 1;
}
