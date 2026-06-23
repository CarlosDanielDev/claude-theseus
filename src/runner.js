// Builds the task list from selections and executes it (or prints it on dry-run).
// Tasks are either a `claude` subprocess or a local file-scaffold action.
import spawn from 'cross-spawn';
import { writeFile, mkdir, readFile, cp } from 'node:fs/promises';
import { homedir } from 'node:os';
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
  for (const u of sel.userSkills || []) {
    const dest = join(homedir(), u.dest);
    tasks.push({ kind: 'copy', label: `user skill ${u.id} -> ~/${u.dest}`, src: u.src, path: dest, dir: !!u.dir });
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
    const preview = task.kind === 'cmd' ? `claude ${task.argv.join(' ')}`
      : task.kind === 'copy' ? `copy ${task.dir ? 'dir ' : ''}${task.src} -> ${task.path}`
      : `write -> ${task.path}`;
    onLog?.(`[dry-run] ${preview}`);
    return Promise.resolve({ ok: true, code: 0 });
  }
  if (task.kind === 'copy' && task.dir) {
    const full = resolve(task.path);
    return cp(task.src, full, { recursive: true })
      .then(() => ({ ok: true, code: 0 }))
      .catch((err) => { onLog?.(String(err.message || err)); return { ok: false, code: 1 }; });
  }
  if (task.kind === 'scaffold' || task.kind === 'copy') {
    const full = resolve(task.path);
    const body = task.kind === 'copy' ? readFile(task.src) : Promise.resolve(task.content);
    return body
      .then((content) => mkdir(dirname(full), { recursive: true }).then(() => writeFile(full, content)))
      .then(() => ({ ok: true, code: 0 }))
      .catch((err) => {
        onLog?.(String(err.message || err));
        return { ok: false, code: 1 };
      });
  }
  // Defense-in-depth: catalog is user-editable, so reject any arg with shell
  // metacharacters before it reaches the process (cross-spawn never invokes a
  // shell, but this keeps the contract explicit if that ever changes).
  const bad = task.argv.find((a) => !/^[\w.:/@=-]+$/.test(a));
  if (bad !== undefined) {
    onLog?.(`rejected unsafe argument: ${bad}`);
    return Promise.resolve({ ok: false, code: 1 });
  }
  return new Promise((res) => {
    // cross-spawn resolves the claude.cmd/.ps1 shim on Windows without a shell.
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
