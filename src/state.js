// Probes the current Claude Code config so the wizard can skip what's already
// there and only patch the rest. Runs `claude` read-only; tolerates its absence
// (returns empty -> everything treated as not-yet-installed).
import spawn from 'cross-spawn';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function run(args) {
  try {
    const r = spawn.sync('claude', args, { encoding: 'utf8', timeout: 20000 });
    return r.status === 0 && r.stdout ? r.stdout : '';
  } catch {
    return '';
  }
}

export function loadState() {
  const mk = run(['plugin', 'marketplace', 'list']);
  const pl = run(['plugin', 'list']);
  const mc = run(['mcp', 'list']);
  const home = homedir();
  return {
    // true if any probe returned data (i.e. claude is usable)
    ok: !!(mk || pl || mc),
    // is this catalog item already configured?
    isPresent(kind, item) {
      if (kind === 'marketplaces') return mk.includes(item.id);
      if (kind === 'plugins') return pl.includes(item.id);
      if (kind === 'mcp') return mc.includes(item.id);
      if (kind === 'userSkills') return existsSync(join(home, item.dest));
      return false;
    },
  };
}

// A no-op state: nothing is present (used with --all or when probing is off).
export const emptyState = { ok: false, isPresent: () => false };
