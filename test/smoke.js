// Smoke test: plan shape + real scaffold writes. No claude CLI, no network.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { marketplaces, plugins, mcpServers, userSkills, scaffold } from '../src/catalog.js';
import { buildPlan, runTask } from '../src/runner.js';

const dir = await mkdtemp(join(tmpdir(), 'theseus-'));
try {
  // plan covers every selected item
  const plan = buildPlan({
    marketplaces: marketplaces.filter((x) => x.selected).map((x) => x.id),
    plugins: plugins.filter((x) => x.selected).map((x) => x.id),
    mcp: mcpServers.filter((x) => x.selected),
    userSkills: userSkills.filter((x) => x.selected),
    scaffold: scaffold.filter((x) => x.selected),
    targetDir: dir,
  });
  const cmds = plan.filter((t) => t.kind === 'cmd');
  const writes = plan.filter((t) => t.kind === 'scaffold');
  const copies = plan.filter((t) => t.kind === 'copy');
  assert.equal(copies.length, userSkills.filter((x) => x.selected).length, 'one copy per user skill');
  // copies must NOT land under the --target dir (they go to ~)
  assert.ok(copies.every((t) => !t.path.startsWith(dir)), 'user skills bypass --target');
  assert.ok(cmds.every((t) => t.argv[0] === 'plugin' || t.argv[0] === 'mcp'), 'cmds target claude');
  assert.equal(writes.length, scaffold.filter((x) => x.selected).length, 'one write per scaffold file');

  // dry-run never touches disk
  await runTask(writes[0], { dryRun: true, onLog() {} });
  await assert.rejects(readFile(writes[0].path), 'dry-run wrote nothing');

  // live scaffold actually writes content
  for (const w of writes) {
    const { ok } = await runTask(w, { dryRun: false, onLog() {} });
    assert.ok(ok, `wrote ${w.path}`);
    const body = await readFile(w.path, 'utf8');
    assert.ok(body.length > 0, 'non-empty file');
  }
  // every real catalog arg passes the allowlist; an injected one is rejected
  for (const t of cmds) {
    const { ok } = await runTask(t, { dryRun: true, onLog() {} });
    assert.ok(ok, `catalog arg passes allowlist: ${t.label}`);
  }
  const evil = { kind: 'cmd', label: 'evil', argv: ['mcp', 'add', 'x; rm -rf ~'] };
  const r = await runTask(evil, { dryRun: false, onLog() {} });
  assert.equal(r.ok, false, 'shell-metachar arg is rejected');

  // dir-type user skill copies its whole tree
  const dirSkill = userSkills.find((x) => x.dir && x.selected);
  if (dirSkill) {
    const out = join(dir, 'skills', dirSkill.id);
    const { ok } = await runTask({ kind: 'copy', dir: true, src: dirSkill.src, path: out }, { dryRun: false, onLog() {} });
    assert.ok(ok, 'dir skill copied');
    assert.ok((await readFile(join(out, 'SKILL.md'), 'utf8')).length > 0, 'nested SKILL.md present');
  }

  console.log(`ok — ${cmds.length} cmds, ${writes.length} files, ${copies.length} copies; injection rejected`);
} finally {
  await rm(dir, { recursive: true, force: true });
}
