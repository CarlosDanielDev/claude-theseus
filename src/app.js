import React, { useState, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import htm from 'htm';
import { existsSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { marketplaces, plugins, mcpServers, userSkills, scaffold } from './catalog.js';
import { buildPlan, runTask } from './runner.js';
import { emptyState } from './state.js';
import { createKonamiDetector } from './konami.js';
import SnakeGame from './snake-tui.js';

const html = htm.bind(React.createElement);

const clone = (arr) => arr.map((x) => ({ ...x }));

const INFO_ROWS = [
  ['Why', 'why'],
  ['For who', 'who'],
  ['What', 'what'],
  ['Goal', 'goal'],
  ['Impact', 'impact'],
];

function infoPanel(item) {
  if (!item || !item.info) return null;
  return html`
    <${Box} flexDirection="column" marginTop=${1} paddingX=${1} borderStyle="round" borderColor="gray">
      <${Text} bold color="cyan">${item.id || item.label}<//>
      ${INFO_ROWS.map(([heading, key], i) => html`
        <${Box} key=${i}>
          <${Box} width=${9}><${Text} color="yellow">${heading}<//><//>
          <${Text}>${item.info[key]}<//>
        <//>
      `)}
    <//>
  `;
}
const labelOf = (key, it) =>
  key === 'marketplaces' ? it.label : key === 'scaffold' ? it.path : it.id;

const STEPS = [
  { key: 'marketplaces', title: 'Marketplaces', verb: 'register' },
  { key: 'plugins', title: 'Plugins', verb: 'install' },
  { key: 'mcp', title: 'MCP Servers', verb: 'add' },
  { key: 'userSkills', title: 'User files (~/.claude: skills, commands, agents)', verb: 'copy' },
  { key: 'scaffold', title: 'Project .claude/ scaffold', verb: 'write' },
];

export default function App({ targetDir, dryRunDefault, state = emptyState, includeAll = false, detectFrom = null }) {
  const { exit } = useApp();
  // Mark already-configured items and deselect them by default (skip to patch
  // only the rest). --all (includeAll) keeps the original selections.
  const init = (arr, kind) =>
    arr.map((x) => {
      const present = state.isPresent(kind, x);
      return { ...x, present, selected: includeAll ? x.selected : x.selected && !present };
    });
  const [lists, setLists] = useState({
    marketplaces: init(marketplaces, 'marketplaces'),
    plugins: init(plugins, 'plugins'),
    mcp: init(mcpServers, 'mcp'),
    userSkills: init(userSkills, 'userSkills'),
    scaffold: scaffold.map((x) => {
      const present = existsSync(pjoin(targetDir, x.path));
      return { ...x, present, selected: includeAll ? x.selected : x.selected && !present };
    }),
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState('select'); // select | review | run | done
  const [dryRun, setDryRun] = useState(dryRunDefault);
  const [statuses, setStatuses] = useState([]); // {label, state:'pending'|'run'|'ok'|'fail', log}
  const [snakeActive, setSnakeActive] = useState(false);
  const konamiRef = useRef(createKonamiDetector());

  const step = STEPS[stepIdx];
  const items = phase === 'select' ? lists[step.key] : [];

  const selectionSummary = () => ({
    marketplaces: lists.marketplaces.filter((x) => x.selected).map((x) => x.id),
    plugins: lists.plugins.filter((x) => x.selected).map((x) => x.id),
    mcp: lists.mcp.filter((x) => x.selected),
    userSkills: lists.userSkills.filter((x) => x.selected),
    scaffold: lists.scaffold.filter((x) => x.selected),
    targetDir,
  });

  const plan = phase !== 'select' ? buildPlan(selectionSummary()) : [];

  async function execute() {
    const tasks = plan;
    const init = tasks.map((t) => ({ label: t.label, state: 'pending', log: '' }));
    setStatuses(init);
    setPhase('run');
    for (let i = 0; i < tasks.length; i++) {
      setStatuses((s) => s.map((x, j) => (j === i ? { ...x, state: 'run' } : x)));
      // eslint-disable-next-line no-await-in-loop
      const { ok } = await runTask(tasks[i], {
        dryRun,
        onLog: (line) =>
          setStatuses((s) => s.map((x, j) => (j === i ? { ...x, log: line } : x))),
      });
      setStatuses((s) => s.map((x, j) => (j === i ? { ...x, state: ok ? 'ok' : 'fail' } : x)));
    }
    setPhase('done');
  }

  useInput((input, key) => {
    if (key.ctrl && input === 'c') return exit();

    if (snakeActive) return;

    if (input === 'q' && !snakeActive) return exit();
    if (input === 'd' && phase !== 'run') setDryRun((v) => !v);

    // Konami detection — works in select, review, and done phases
    if (phase !== 'run') {
      let arrowDir = null;
      if (key.upArrow) arrowDir = 'up';
      else if (key.downArrow) arrowDir = 'down';
      else if (key.leftArrow) arrowDir = 'left';
      else if (key.rightArrow) arrowDir = 'right';

      if (arrowDir && konamiRef.current(arrowDir)) {
        if (process.stdin.isTTY) {
          setSnakeActive(true);
          return;
        }
      }
    }

    if (phase === 'select') {
      const list = lists[step.key];
      if (key.upArrow) setCursor((c) => (c - 1 + list.length) % list.length);
      if (key.downArrow) setCursor((c) => (c + 1) % list.length);
      if (input === ' ')
        setLists((L) => ({
          ...L,
          [step.key]: L[step.key].map((it, i) => (i === cursor ? { ...it, selected: !it.selected } : it)),
        }));
      if (input === 'a')
        setLists((L) => ({ ...L, [step.key]: L[step.key].map((it) => ({ ...it, selected: true })) }));
      if (input === 'n')
        setLists((L) => ({ ...L, [step.key]: L[step.key].map((it) => ({ ...it, selected: false })) }));
      if (key.leftArrow && stepIdx > 0) { setStepIdx((s) => s - 1); setCursor(0); }
      if (key.rightArrow || key.return) {
        if (stepIdx < STEPS.length - 1) { setStepIdx((s) => s + 1); setCursor(0); }
        else setPhase('review');
      }
    } else if (phase === 'review') {
      if (key.leftArrow || input === 'b') { setPhase('select'); setStepIdx(STEPS.length - 1); }
      if (key.return || input === 'r') execute();
    } else if (phase === 'done') {
      if (key.return || input === 'q') exit();
    }
  });

  // ---- render ----
  if (snakeActive) {
    return html`<${SnakeGame} onExit=${() => setSnakeActive(false)} />`;
  }

  const header = html`
    <${Box} flexDirection="column" marginBottom=${1}>
      <${Gradient} name="atlas"><${Text} bold>  THESEUS · Claude Code Setup Wizard<//><//>
      <${Text} dimColor>  rebuild marketplaces · plugins · MCP · project scaffold<//>
      ${detectFrom ? html`<${Text} color="magenta">  demo: detecting against ${detectFrom} (writes go to real targets)<//>` : ''}
    <//>
  `;

  const modeBadge = html`<${Text} color=${dryRun ? 'yellow' : 'green'}>${dryRun ? ' DRY-RUN ' : ' LIVE '}<//>`;

  if (phase === 'select') {
    const list = lists[step.key];
    const count = list.filter((x) => x.selected).length;
    const configured = list.filter((x) => x.present).length;
    return html`
      <${Box} flexDirection="column" padding=${1}>
        ${header}
        <${Box}>
          <${Text}>Step ${stepIdx + 1}/${STEPS.length} · <//>
          <${Text} bold color="cyan">${step.title}<//>
          <${Text}> · ${count}/${list.length} selected<//>
          ${configured ? html`<${Text} color="green"> · ${configured} configured<//>` : ''}
          <${Text}> · <//>${modeBadge}
        <//>
        <${Box} flexDirection="column" marginTop=${1}>
          ${list.map((it, i) => html`
            <${Box} key=${i}>
              <${Text} color=${i === cursor ? 'cyan' : undefined}>${i === cursor ? '❯ ' : '  '}<//>
              <${Text} color=${it.selected ? 'green' : 'gray'}>${it.selected ? '◆' : '◇'} <//>
              <${Text} dimColor=${it.present && !it.selected}>${labelOf(step.key, it)}<//>
              ${it.present ? html`<${Text} color="green"> ✓ configured<//>` : ''}
              <${Text} dimColor>${it.note ? '  — ' + it.note : ''}<//>
            <//>
          `)}
        <//>
        ${infoPanel(list[cursor])}
        <${Box} marginTop=${1}>
          <${Text} dimColor>↑↓ move · space toggle · a all · n none · → next · ← back · d dry-run · q quit<//>
        <//>
      <//>
    `;
  }

  if (phase === 'review') {
    return html`
      <${Box} flexDirection="column" padding=${1}>
        ${header}
        <${Box}><${Text} bold>Review — ${plan.length} actions · <//>${modeBadge}<//>
        <${Box} flexDirection="column" marginTop=${1}>
          ${plan.map((t, i) => html`
            <${Box} key=${i}>
              <${Text} color=${t.kind === 'cmd' ? 'blue' : 'magenta'}>${t.kind === 'cmd' ? '⚡' : '✎'} <//>
              <${Text}>${t.label}<//>
            <//>
          `)}
        <//>
        <${Box} marginTop=${1} flexDirection="column">
          <${Text} dimColor>target dir: ${targetDir}<//>
          <${Text} dimColor>enter/r run · d toggle dry-run · b back · q quit<//>
        <//>
      <//>
    `;
  }

  if (phase === 'run' || phase === 'done') {
    const icon = { pending: '○', run: null, ok: '✔', fail: '✗' };
    const color = { pending: 'gray', ok: 'green', fail: 'red' };
    const total = statuses.length;
    const done = statuses.filter((s) => s.state === 'ok' || s.state === 'fail').length;
    const failed = statuses.filter((s) => s.state === 'fail').length;

    // progress bar
    const W = 28;
    const fill = total ? Math.round((W * done) / total) : 0;
    const pct = total ? Math.round((100 * done) / total) : 0;
    const barColor = failed ? 'yellow' : phase === 'done' ? 'green' : 'cyan';
    const bar = html`
      <${Text} color=${barColor}>${'▰'.repeat(fill)}<//><${Text} dimColor>${'▱'.repeat(W - fill)}<//>
    `;

    return html`
      <${Box} flexDirection="column" padding=${1}>
        ${header}
        <${Box}>
          <${Text} bold>${phase === 'done' ? 'Finished' : 'Applying'}<//>
          <${Text}> · <//>${modeBadge}
          <${Text}> · ${done}/${total}<//>
          ${failed ? html`<${Text} color="red"> · ${failed} failed<//>` : ''}
        <//>
        <${Box} marginTop=${1}>
          ${bar}<${Text} bold color=${barColor}>  ${pct}%<//>
        <//>
        <${Box} flexDirection="column" marginTop=${1}>
          ${statuses.map((s, i) => html`
            <${Box} key=${i}>
              ${s.state === 'run'
                ? html`<${Text} color="cyan"><${Spinner} type="dots"/> <//>`
                : html`<${Text} color=${color[s.state]}>${icon[s.state]} <//>`}
              <${Text} color=${s.state === 'fail' ? 'red' : s.state === 'run' ? 'cyan' : s.state === 'ok' ? 'green' : 'gray'} bold=${s.state === 'run'}>${s.label}<//>
              ${s.state === 'run' && s.log ? html`<${Text} dimColor>  ${s.log.slice(0, 50)}<//>` : ''}
            <//>
          `)}
        <//>
        ${phase === 'done'
          ? html`
            <${Box} marginTop=${1} flexDirection="column">
              <${Gradient} name=${failed ? 'morning' : 'cristal'}>
                <${Text} bold>${failed ? `  ⚠  DONE WITH ${failed} ERROR${failed > 1 ? 'S' : ''}` : '  ✓  ALL DONE — environment rebuilt'}<//>
              <//>
              <${Text} dimColor>  ${total - failed}/${total} applied${dryRun ? ' (dry-run — nothing changed)' : ''} · press enter to exit<//>
            <//>`
          : ''}
      <//>
    `;
  }

  return null;
}
