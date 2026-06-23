// Builds the task list from selections and executes it (or prints it on dry-run).
// Tasks are either a `claude` subprocess or a local file-scaffold action.
import spawn from 'cross-spawn';
import { writeFile, mkdir, readFile, cp } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

// Find the Obsidian Local REST API key WITHOUT generating one (the plugin mints
// it in-app; there's no CLI for that). We only detect and reuse an existing key.
// Runtime-only — the key is never written to the repo. Result is cached.
let _obs;
export function resolveObsidian() {
  if (_obs) return _obs;
  const rel = ['.obsidian', 'plugins', 'obsidian-local-rest-api', 'data.json'];
  if (process.env.OBSIDIAN_API_KEY) {
    return (_obs = {
      found: true, source: 'env',
      key: process.env.OBSIDIAN_API_KEY,
      baseUrl: process.env.OBSIDIAN_BASE_URL || 'https://127.0.0.1:27124',
    });
  }
  const home = homedir();
  const roots = [process.env.OBSIDIAN_VAULT, join(home, 'Documents'), home].filter(Boolean);
  const candidates = [];
  for (const r of roots) {
    candidates.push(join(r, ...rel)); // r itself a vault
    try {
      for (const d of readdirSync(r, { withFileTypes: true }))
        if (d.isDirectory()) candidates.push(join(r, d.name, ...rel)); // one level down
    } catch { /* unreadable root, skip */ }
  }
  for (const c of candidates) {
    if (!existsSync(c)) continue;
    try {
      const data = JSON.parse(readFileSync(c, 'utf8'));
      if (data.apiKey) {
        return (_obs = { found: true, source: c, key: data.apiKey, baseUrl: `https://127.0.0.1:${data.port || 27124}` });
      }
    } catch { /* malformed, keep looking */ }
  }
  return (_obs = { found: false });
}

function obsidianArgv(o) {
  return [
    'mcp', 'add', 'obsidian-mcp-server',
    '-e', `OBSIDIAN_API_KEY=${o.key}`,
    '-e', `OBSIDIAN_BASE_URL=${o.baseUrl}`,
    '-e', 'OBSIDIAN_VERIFY_SSL=false',
    '-e', 'OBSIDIAN_ENABLE_CACHE=true',
    '--', 'npx', '-y', 'obsidian-mcp-server',
  ];
}

const maskKey = (a) => a.replace(/(API_KEY=)\S+/i, '$1****');

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
    let { argv } = s;
    let suffix = '';
    if (s.obsidianKey) {
      const o = resolveObsidian();
      if (o.found) { argv = obsidianArgv(o); suffix = ' (key detected)'; }
      else suffix = ' (no key — set OBSIDIAN_API_KEY or enable the Local REST API plugin)';
    }
    tasks.push({ kind: 'cmd', label: `mcp add ${s.id}${suffix}`, argv });
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
    const preview = task.kind === 'cmd' ? `claude ${task.argv.map(maskKey).join(' ')}`
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
