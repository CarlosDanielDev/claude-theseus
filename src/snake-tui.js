import React, { useState, useEffect, useRef } from 'react';
import { Text, useApp, useInput } from 'ink';
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

function getTermDims() {
  return {
    cols: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  };
}

function buildFrame(state) {
  const { score, cols } = state;
  const gameLines = renderFrame(state).split('\n');
  const lines = [];

  lines.push('Score: ' + score);
  lines.push('\u250c' + '\u2500'.repeat(cols) + '\u2510');
  for (const line of gameLines) {
    lines.push('\u2502' + line + '\u2502');
  }
  lines.push('\u2514' + '\u2500'.repeat(cols) + '\u2518');
  lines.push('Arrow keys/WASD: move | ESC/q: exit');

  return lines.join('\n');
}

export default function SnakeGame({ onExit, termCols, termRows }) {
  const { exit } = useApp();
  const stateRef = useRef(null);
  const [error, setError] = useState(null);
  const [frame, setFrame] = useState('');
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    const tc = termCols ?? getTermDims().cols;
    const tr = termRows ?? getTermDims().rows;

    if (tc < MIN_COLS || tr < MIN_ROWS) {
      setError('Terminal too small (' + tc + 'x' + tr + '). Need at least ' + MIN_COLS + 'x' + MIN_ROWS + '.');
      return;
    }

    const gameCols = tc - 2;
    const gameRows = tr - 4;

    let state = createGameState(gameCols, gameRows);
    stateRef.current = state;
    setFrame(buildFrame(state));

    let timer;
    let deathTimer;

    function scheduleTick() {
      timer = setTimeout(() => {
        state = tick(stateRef.current);
        stateRef.current = state;
        setFrame(buildFrame(state));
        if (state.alive) {
          scheduleTick();
        } else {
          deathTimer = setTimeout(() => onExitRef.current(), 1000);
        }
      }, stateRef.current.speed);
    }

    scheduleTick();

    function onResize() {
      const dims = getTermDims();
      const newCols = dims.cols - 2;
      const newRows = dims.rows - 4;

      if (stateRef.current) {
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
            ? {
                x: Math.min(Math.max(old.food.x, 0), newCols - 1),
                y: Math.min(Math.max(old.food.y, 0), newRows - 1),
              }
            : old.food,
        };
        setFrame(buildFrame(stateRef.current));
      }
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

    if (key.escape || input === 'q') {
      onExitRef.current();
      return;
    }
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (!stateRef.current || !stateRef.current.alive) return;

    let dir = null;
    if (key.upArrow || input === 'w' || input === 'W') dir = 'up';
    else if (key.downArrow || input === 's' || input === 'S') dir = 'down';
    else if (key.leftArrow || input === 'a' || input === 'A') dir = 'left';
    else if (key.rightArrow || input === 'd' || input === 'D') dir = 'right';

    if (dir) {
      stateRef.current = changeDirection(stateRef.current, dir);
    }
  });

  if (error) {
    return html`
      <${Text} color="red">${error}<//>
    `;
  }

  return html`<${Text}>${frame}<//>`;
}
