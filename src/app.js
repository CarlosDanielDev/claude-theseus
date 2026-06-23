import React, { useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import htm from 'htm';
import { marketplaces, plugins, mcpServers, scaffold } from './catalog.js';
import { buildPlan, runTask } from './runner.js';

const html = htm.bind(React.createElement);

const clone = (arr) => arr.map((x) => ({ ...x }));
const labelOf = (key, it) =>
  key === 'marketplaces' ? it.label : key === 'scaffold' ? it.path : it.id;

const STEPS = [
  { key: 'marketplaces', title: 'Marketplaces', verb: 'register' },
  { key: 'plugins', title: 'Plugins', verb: 'install' },
  { key: 'mcp', title: 'MCP Servers', verb: 'add' },
  { key: 'scaffold', title: 'Project .claude/ scaffold', verb: 'write' },
];

export default function App({ targetDir, dryRunDefault }) {
  const { exit } = useApp();
  const [lists, setLists] = useState({
    marketplaces: clone(marketplaces),
    plugins: clone(plugins),
    mcp: clone(mcpServers),
    scaffold: clone(scaffold),
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState('select'); // select | review | run | done
  const [dryRun, setDryRun] = useState(dryRunDefault);
  const [statuses, setStatuses] = useState([]); // {label, state:'pending'|'run'|'ok'|'fail', log}

  const step = STEPS[stepIdx];
  const items = phase === 'select' ? lists[step.key] : [];

  const selectionSummary = () => ({
    marketplaces: lists.marketplaces.filter((x) => x.selected).map((x) => x.id),
    plugins: lists.plugins.filter((x) => x.selected).map((x) => x.id),
    mcp: lists.mcp.filter((x) => x.selected),
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
    if (input === 'q' || (key.ctrl && input === 'c')) return exit();
    if (input === 'd' && phase !== 'run') setDryRun((v) => !v);

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
  const header = html`
    <${Box} flexDirection="column" marginBottom=${1}>
      <${Gradient} name="atlas"><${Text} bold>  THESEUS · Claude Code Setup Wizard<//><//>
      <${Text} dimColor>  rebuild marketplaces · plugins · MCP · project scaffold<//>
    <//>
  `;

  const modeBadge = html`<${Text} color=${dryRun ? 'yellow' : 'green'}>${dryRun ? ' DRY-RUN ' : ' LIVE '}<//>`;

  if (phase === 'select') {
    const list = lists[step.key];
    const count = list.filter((x) => x.selected).length;
    return html`
      <${Box} flexDirection="column" padding=${1}>
        ${header}
        <${Box}>
          <${Text}>Step ${stepIdx + 1}/${STEPS.length} · <//>
          <${Text} bold color="cyan">${step.title}<//>
          <${Text}> · ${count}/${list.length} selected · <//>
          ${modeBadge}
        <//>
        <${Box} flexDirection="column" marginTop=${1}>
          ${list.map((it, i) => html`
            <${Box} key=${i}>
              <${Text} color=${i === cursor ? 'cyan' : undefined}>${i === cursor ? '❯ ' : '  '}<//>
              <${Text} color=${it.selected ? 'green' : 'gray'}>${it.selected ? '◆' : '◇'} <//>
              <${Text}>${labelOf(step.key, it)}<//>
              <${Text} dimColor>${it.note ? '  — ' + it.note : ''}<//>
            <//>
          `)}
        <//>
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
              <${Text} color=${t.kind === 'scaffold' ? 'magenta' : 'blue'}>${t.kind === 'scaffold' ? '✎' : '⚡'} <//>
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
    const icon = { pending: '·', run: null, ok: '✔', fail: '✗' };
    const color = { pending: 'gray', ok: 'green', fail: 'red' };
    const done = statuses.filter((s) => s.state === 'ok' || s.state === 'fail').length;
    const failed = statuses.filter((s) => s.state === 'fail').length;
    return html`
      <${Box} flexDirection="column" padding=${1}>
        ${header}
        <${Box}>
          <${Text} bold>${phase === 'done' ? 'Done' : 'Running'} — ${done}/${statuses.length}<//>
          <${Text}> · <//>${modeBadge}
          ${failed ? html`<${Text} color="red"> · ${failed} failed<//>` : ''}
        <//>
        <${Box} flexDirection="column" marginTop=${1}>
          ${statuses.map((s, i) => html`
            <${Box} key=${i}>
              ${s.state === 'run'
                ? html`<${Text} color="yellow"><${Spinner} type="dots"/> <//>`
                : html`<${Text} color=${color[s.state]}>${icon[s.state]} <//>`}
              <${Text} color=${s.state === 'fail' ? 'red' : undefined}>${s.label}<//>
              ${s.state === 'run' && s.log ? html`<${Text} dimColor>  ${s.log.slice(0, 50)}<//>` : ''}
            <//>
          `)}
        <//>
        ${phase === 'done'
          ? html`<${Box} marginTop=${1}><${Text} color=${failed ? 'yellow' : 'green'}>${failed ? 'Completed with errors. ' : 'All done. '}<//><${Text} dimColor>press enter to exit<//><//>`
          : ''}
      <//>
    `;
  }

  return null;
}
