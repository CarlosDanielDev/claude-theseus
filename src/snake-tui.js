import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Gradient from 'ink-gradient';
import htm from 'htm';
import {
  createGameState,
  tick,
  changeDirection,
  renderFrame,
  MIN_COLS,
  MIN_ROWS,
} from './snake.js';

const html = htm.bind(React.createElement);

// Cap the playfield so it stays a tight, snappy board instead of sprawling
// across a huge terminal (which left the snake a speck in a void and made Ink
// re-diff a giant tree every tick → flicker). Centered, the snake fills it.
const MAX_COLS = 44;
const MAX_ROWS = 20;
const boardCols = (termCols) => Math.max(MIN_COLS, Math.min(termCols - 2, MAX_COLS));
const boardRows = (termRows) => Math.max(MIN_ROWS, Math.min(termRows - 6, MAX_ROWS));

// Session-only high score — no persistence, resets when the process exits.
let bestScore = 0;

// Head and body share the SAME full-cell glyph so the snake never clips or
// changes size between horizontal and vertical movement (directional triangle
// glyphs had different widths → a gap that shifted when you turned). The head is
// distinguished by a brighter colour, not a different shape.
const BODY_PALETTE = ['#34d399', '#10b981', '#059669']; // brightest near the head
const HEAD_COLOR = '#d1fae5';
const DEAD_COLOR = '#f87171';

function getTermDims() {
  return { cols: process.stdout.columns || 80, rows: process.stdout.rows || 24 };
}

// Group a grid row into colored runs so each <Text> covers a run of like cells.
// Reuses renderFrame's tested glyphs ('█','●',' ') and recolors them.
function rowSpans(line, y, state, foodPulse) {
  const head = state.snake[0];
  // index of each snake segment for the body gradient
  const segIndex = new Map(state.snake.map((s, i) => [s.x + ',' + s.y, i]));
  const spans = [];
  let run = '';
  let runColor = null;
  let runBold = false;
  const flush = (key) => {
    if (!run) return;
    spans.push(html`<${Text} key=${key} color=${runColor} bold=${runBold}>${run}<//>`);
    run = '';
  };
  for (let x = 0; x < line.length; x++) {
    const c = line[x];
    let ch = c;
    let color = null;
    let bold = false;
    if (head && x === head.x && y === head.y) {
      // keep the body's '█' — same cell footprint, no clip on turns
      color = state.alive ? HEAD_COLOR : DEAD_COLOR;
      bold = true;
    } else if (c === '█') {
      const idx = segIndex.get(x + ',' + y) ?? 0;
      color = BODY_PALETTE[Math.min(idx, BODY_PALETTE.length - 1)];
    } else if (c === '●') {
      // pulse by colour only — swapping the glyph (●/◆) changed its size
      color = foodPulse ? '#fbbf24' : '#ef4444';
      bold = true;
    }
    if (color !== runColor || bold !== runBold) {
      flush('s' + x);
      runColor = color;
      runBold = bold;
    }
    run += ch;
  }
  flush('end');
  return spans;
}

function GameView({ state, frame, foodPulse }) {
  const lines = renderFrame(state).split('\n');
  const level = Math.floor(state.score / 5) + 1;
  const border = state.alive ? 'green' : 'red';
  return html`
    <${Box} flexDirection="column" alignItems="center" marginTop=${1}>
      <${Box}>
        <${Text} color="#fbbf24" bold>● ${state.score}<//>
        <${Text} dimColor>  ·  <//>
        <${Text} color="cyan">lvl ${level}<//>
        <${Text} dimColor>  ·  <//>
        <${Text} color="magenta">best ${Math.max(bestScore, state.score)}<//>
      <//>
      <${Box} flexDirection="column" borderStyle="round" borderColor=${border}>
        ${lines.map((line, y) => html`<${Box} key=${y}>${rowSpans(line, y, state, foodPulse)}<//>`)}
      <//>
      ${state.alive
        ? html`<${Text} dimColor>arrows / wasd move · esc / q exit<//>`
        : html`<${Gradient} name="passion"><${Text} bold>  GAME OVER — scored ${state.score}<//><//>`}
    <//>
  `;
}

export default function SnakeGame({ onExit, termCols, termRows }) {
  const { exit } = useApp();
  const stateRef = useRef(null);
  const [error, setError] = useState(null);
  const [frame, setFrame] = useState(0); // bump to force re-render; render reads stateRef
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    const tc = termCols ?? getTermDims().cols;
    const tr = termRows ?? getTermDims().rows;
    if (tc < MIN_COLS || tr < MIN_ROWS) {
      setError('Terminal too small (' + tc + 'x' + tr + '). Need at least ' + MIN_COLS + 'x' + MIN_ROWS + '.');
      return;
    }
    let state = createGameState(boardCols(tc), boardRows(tr));
    stateRef.current = state;
    setFrame((f) => f + 1);

    let timer;
    let deathTimer;
    function scheduleTick() {
      timer = setTimeout(() => {
        state = tick(stateRef.current);
        stateRef.current = state;
        if (state.score > bestScore) bestScore = state.score;
        setFrame((f) => f + 1);
        if (state.alive) scheduleTick();
        else deathTimer = setTimeout(() => onExitRef.current(), 1400);
      }, stateRef.current.speed);
    }
    scheduleTick();

    function onResize() {
      const dims = getTermDims();
      const newCols = boardCols(dims.cols);
      const newRows = boardRows(dims.rows);
      if (!stateRef.current) return;
      const old = stateRef.current;
      stateRef.current = {
        ...old,
        cols: newCols,
        rows: newRows,
        snake: old.snake.map((s) => ({
          x: Math.min(Math.max(s.x, 0), newCols - 1),
          y: Math.min(Math.max(s.y, 0), newRows - 1),
        })),
        food: old.food
          ? { x: Math.min(Math.max(old.food.x, 0), newCols - 1), y: Math.min(Math.max(old.food.y, 0), newRows - 1) }
          : old.food,
      };
      setFrame((f) => f + 1);
    }
    process.stdout.on('resize', onResize);
    return () => {
      clearTimeout(timer);
      clearTimeout(deathTimer);
      process.stdout.removeListener('resize', onResize);
    };
  }, []);

  useInput((input, key) => {
    if (error) {
      if (key.escape || key.return || input === 'q') onExitRef.current();
      return;
    }
    if (key.escape || input === 'q') return onExitRef.current();
    if (key.ctrl && input === 'c') return exit();
    if (!stateRef.current || !stateRef.current.alive) return;
    let dir = null;
    if (key.upArrow || input === 'w' || input === 'W') dir = 'up';
    else if (key.downArrow || input === 's' || input === 'S') dir = 'down';
    else if (key.leftArrow || input === 'a' || input === 'A') dir = 'left';
    else if (key.rightArrow || input === 'd' || input === 'D') dir = 'right';
    if (dir) stateRef.current = changeDirection(stateRef.current, dir);
  });

  if (error) return html`<${Text} color="red">${error}<//>`;
  if (!stateRef.current) return html`<${Text} dimColor>loading…<//>`;
  return html`<${GameView} state=${stateRef.current} frame=${frame} foodPulse=${frame % 2 === 0} />`;
}
