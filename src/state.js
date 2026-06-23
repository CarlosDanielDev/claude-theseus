// Probes the current Claude Code config so the wizard can skip what's already
// there and only patch the rest. Runs `claude` read-only; tolerates its absence
// (returns empty -> everything treated as not-yet-installed).
//
// homeBase: optional fake-$HOME for detection (the --load-from flag). Point it
// at an empty folder to make everything read as not-configured — handy for
// demos/recordings. It only affects DETECTION; write targets are unchanged.
import spawn from 'cross-spawn';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function loadState(homeBase) {
  const env = homeBase ? { ...process.env, CLAUDE_CONFIG_DIR: join(homeBase, '.claude') } : process.env;
  const run = (args) => {
    try {
      const r = spawn.sync('claude', args, { encoding: 'utf8', timeout: 20000, env });
      return r.status === 0 && r.stdout ? r.stdout : '';
    } catch {
      return '';
    }
  };
  const mk = run(['plugin', 'marketplace', 'list']);
  const pl = run(['plugin', 'list']);
  const mc = run(['mcp', 'list']);
  const base = homeBase || homedir();
  return {
    ok: !!(mk || pl || mc),
    source: homeBase || null,
    isPresent(kind, item) {
      if (kind === 'marketplaces') return mk.includes(item.id);
      if (kind === 'plugins') return pl.includes(item.id);
      if (kind === 'mcp') return mc.includes(item.id);
      if (kind === 'userSkills') return existsSync(join(base, item.dest));
      return false;
    },
  };
}

// A no-op state: nothing is present (used with --all or when probing is off).
export const emptyState = { ok: false, source: null, isPresent: () => false };
