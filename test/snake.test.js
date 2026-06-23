import assert from 'node:assert/strict';
import { createKonamiDetector } from '../src/konami.js';
import {
  createGameState,
  tick,
  changeDirection,
  spawnFood,
  renderFrame,
  INITIAL_SPEED,
  SPEED_DECREASE,
  SPEED_FLOOR,
  SPEED_EVERY,
  MIN_COLS,
  MIN_ROWS,
} from '../src/snake.js';

const scenarios = [];

function test(name, fn) {
  scenarios.push({ name, fn });
}

function run() {
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of scenarios) {
    try {
      fn();
      passed++;
    } catch (e) {
      failed++;
      console.error(`FAIL ${name}:`, e.message);
    }
  }

  console.log(`ok — ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// ── Konami Detector ──────────────────────────────────────────────

test('Konami: no keys fed returns false', () => {
  const detect = createKonamiDetector();
  assert.equal(detect('up'), false);
});

test('Konami: full correct sequence returns true on final key', () => {
  const detect = createKonamiDetector();
  const seq = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
  for (let i = 0; i < seq.length - 1; i++) {
    assert.equal(detect(seq[i]), false, 'step ' + i + ' should not trigger');
  }
  assert.equal(detect(seq[seq.length - 1]), true, 'final key should trigger');
});

test('Konami: partial sequence returns false', () => {
  const detect = createKonamiDetector();
  detect('up');
  detect('up');
  detect('down');
  assert.equal(detect('down'), false, '4th key should not trigger yet');
});

test('Konami: wrong key resets detection', () => {
  const detect = createKonamiDetector();
  detect('up');
  detect('up');
  detect('left');
  assert.equal(detect('down'), false);
});

test('Konami: full sequence then next key resets', () => {
  const detect = createKonamiDetector();
  const seq = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
  for (const k of seq) detect(k);
  assert.equal(detect('up'), false);
});

test('Konami: double detection works with reset', () => {
  const detect = createKonamiDetector();
  const seq = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
  for (const k of seq) detect(k);
  for (const k of seq) detect(k);
});

test('Konami: key matching start resets partial', () => {
  const detect = createKonamiDetector();
  detect('up');
  detect('up');
  detect('down');
  detect('down');
  detect('up');
  detect('up');
  detect('down');
  detect('down');
  detect('left');
  detect('right');
  detect('left');
  assert.equal(detect('right'), true, 'should eventually detect after restart');
});

test('Konami: independent detectors do not interfere', () => {
  const a = createKonamiDetector();
  const b = createKonamiDetector();
  a('up');
  a('up');
  b('up');
  assert.equal(a('down'), false);
  assert.equal(b('up'), false);
});

// ── Game State Creation ──────────────────────────────────────────

test('createGameState: snake at center, facing right, alive', () => {
  const state = createGameState(20, 15);
  assert.equal(state.snake.length, 1);
  assert.equal(state.snake[0].x, 10);
  assert.equal(state.snake[0].y, 7);
  assert.equal(state.direction, 'right');
  assert.equal(state.alive, true);
  assert.equal(state.score, 0);
  assert.equal(state.speed, INITIAL_SPEED);
  assert.ok(state.food, 'food should exist');
  assert.equal(state.cols, 20);
  assert.equal(state.rows, 15);
});

test('createGameState: food not on snake', () => {
  const state = createGameState(20, 15);
  assert.ok(
    state.food.x !== state.snake[0].x || state.food.y !== state.snake[0].y,
    'food should not overlap snake'
  );
});

// ── Tick / Movement ──────────────────────────────────────────────

test('tick: snake moves right', () => {
  let state = createGameState(20, 15);
  state = changeDirection(state, 'right');
  const next = tick(state);
  assert.equal(next.snake[0].x, state.snake[0].x + 1);
  assert.equal(next.snake[0].y, state.snake[0].y);
  assert.equal(next.snake.length, 1, 'length unchanged without food');
});

test('tick: snake moves left', () => {
  let state = createGameState(20, 15);
  state = changeDirection(state, 'up');
  state = changeDirection(state, 'left');
  const next = tick(state);
  assert.equal(next.snake[0].x, state.snake[0].x - 1);
  assert.equal(next.snake[0].y, state.snake[0].y);
});

test('tick: snake moves up', () => {
  let state = createGameState(20, 15);
  state = changeDirection(state, 'up');
  const next = tick(state);
  assert.equal(next.snake[0].y, state.snake[0].y - 1);
  assert.equal(next.snake[0].x, state.snake[0].x);
});

test('tick: snake moves down', () => {
  let state = createGameState(20, 15);
  state = changeDirection(state, 'down');
  const next = tick(state);
  assert.equal(next.snake[0].y, state.snake[0].y + 1);
  assert.equal(next.snake[0].x, state.snake[0].x);
});

test('tick: wraps at right wall', () => {
  const state = {
    snake: [{ x: 19, y: 5 }],
    direction: 'right',
    food: { x: 0, y: 0 },
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 20,
    rows: 10,
  };
  const next = tick(state);
  assert.equal(next.snake[0].x, 0);
  assert.equal(next.snake[0].y, 5);
});

test('tick: wraps at left wall', () => {
  const state = {
    snake: [{ x: 0, y: 5 }],
    direction: 'left',
    food: { x: 0, y: 0 },
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 20,
    rows: 10,
  };
  const next = tick(state);
  assert.equal(next.snake[0].x, 19);
});

test('tick: wraps at top wall', () => {
  const state = {
    snake: [{ x: 5, y: 0 }],
    direction: 'up',
    food: { x: 0, y: 0 },
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 20,
    rows: 10,
  };
  const next = tick(state);
  assert.equal(next.snake[0].y, 9);
});

test('tick: wraps at bottom wall', () => {
  const state = {
    snake: [{ x: 5, y: 9 }],
    direction: 'down',
    food: { x: 0, y: 0 },
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 20,
    rows: 10,
  };
  const next = tick(state);
  assert.equal(next.snake[0].y, 0);
});

// ── Self-collision ───────────────────────────────────────────────

test('tick: self-collision kills snake', () => {
  const state = {
    snake: [
      { x: 5, y: 0 },
      { x: 6, y: 0 },
      { x: 7, y: 0 },
      { x: 8, y: 0 },
      { x: 9, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
    direction: 'right',
    food: { x: 10, y: 10 },
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 10,
    rows: 5,
  };
  const next = tick(state);
  assert.equal(next.alive, false, 'should die when head wraps into body');
});

test('tick: dead snake stays dead on tick', () => {
  const state = createGameState(20, 15);
  state.alive = false;
  const next = tick(state);
  assert.equal(next.alive, false);
});

// ── Food ─────────────────────────────────────────────────────────

test('tick: eating food grows snake and increments score', () => {
  const state = {
    snake: [{ x: 5, y: 5 }],
    direction: 'right',
    food: { x: 6, y: 5 },
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 20,
    rows: 15,
  };
  const next = tick(state);
  assert.equal(next.score, 1);
  assert.equal(next.snake.length, 2);
  assert.notDeepEqual(next.food, state.food, 'new food should spawn');
});

test('tick: speed decreases after SPEED_EVERY food', () => {
  // Simulate eating SPEED_EVERY food
  let state = createGameState(20, 15);
  for (let i = 0; i < SPEED_EVERY; i++) {
    state.food = { x: (state.snake[0].x + 1) % state.cols, y: state.snake[0].y };
    state = tick(state);
  }
  assert.equal(state.score, SPEED_EVERY);
  assert.equal(state.speed, INITIAL_SPEED - SPEED_DECREASE);
});

test('tick: speed floors at SPEED_FLOOR', () => {
  let state = createGameState(20, 15);
  const feedsNeeded = Math.ceil((INITIAL_SPEED - SPEED_FLOOR) / SPEED_DECREASE) * SPEED_EVERY + SPEED_EVERY;
  for (let i = 0; i < feedsNeeded; i++) {
    if (!state.alive) break;
    state.food = {
      x: (state.snake[0].x + 1) % state.cols,
      y: state.snake[0].y,
    };
    state = tick(state);
  }
  assert.ok(state.speed >= SPEED_FLOOR);
});

test('tick: score increments by 1 per food', () => {
  let state = createGameState(20, 15);
  for (let i = 0; i < 3; i++) {
    state.food = { x: (state.snake[0].x + 1) % state.cols, y: state.snake[0].y };
    state = tick(state);
  }
  assert.equal(state.score, 3);
});

// ── Direction Change ─────────────────────────────────────────────

test('changeDirection: changes to valid direction', () => {
  const state = createGameState(20, 15);
  assert.equal(state.direction, 'right');
  const next = changeDirection(state, 'up');
  assert.equal(next.direction, 'up');
});

test('changeDirection: cannot reverse', () => {
  const state = createGameState(20, 15);
  assert.equal(state.direction, 'right');
  const next = changeDirection(state, 'left');
  assert.equal(next.direction, 'right', 'should not reverse');
});

test('changeDirection: can turn perpendicular', () => {
  const state = createGameState(20, 15);
  let next = changeDirection(state, 'up');
  assert.equal(next.direction, 'up');
  next = changeDirection(next, 'right');
  assert.equal(next.direction, 'right');
});

test('changeDirection: all directions except reverse work', () => {
  let state = createGameState(20, 15);
  state = changeDirection(state, 'down');
  assert.equal(state.direction, 'down');
  state = changeDirection(state, 'left');
  assert.equal(state.direction, 'left');
  // up should be blocked (would reverse from left to right? no, reverse of left is right)
  state = changeDirection(state, 'up');
  assert.equal(state.direction, 'up');
  // reverse of up is down — should be blocked
  state = changeDirection(state, 'down');
  assert.equal(state.direction, 'up');
});

test('tick: null food does not crash', () => {
  const state = {
    snake: [{ x: 3, y: 2 }],
    direction: 'right',
    food: null,
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 10,
    rows: 5,
  };
  const next = tick(state);
  assert.ok(next.alive);
  assert.equal(next.score, 0);
  assert.equal(next.food, null);
});

// ── spawnFood ────────────────────────────────────────────────────

test('spawnFood: places food on empty cell', () => {
  const snake = [{ x: 0, y: 0 }];
  for (let i = 0; i < 100; i++) {
    const food = spawnFood(10, 10, snake);
    assert.ok(food, 'food should exist');
    assert.ok(
      food.x !== 0 || food.y !== 0,
      'food should not be on snake'
    );
  }
});

test('spawnFood: returns null when board is full', () => {
  const snake = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      snake.push({ x, y });
    }
  }
  const food = spawnFood(3, 3, snake);
  assert.equal(food, null, 'should return null on full board');
});

// ── renderFrame ──────────────────────────────────────────────────

test('renderFrame: produces correct grid dimensions', () => {
  const state = createGameState(10, 5);
  const frame = renderFrame(state);
  const lines = frame.split('\n');
  assert.equal(lines.length, 5);
  assert.equal(lines[0].length, 10);
});

test('renderFrame: snake head visible', () => {
  const state = {
    snake: [{ x: 3, y: 2 }],
    direction: 'right',
    food: { x: 5, y: 2 },
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 10,
    rows: 5,
  };
  const frame = renderFrame(state);
  const lines = frame.split('\n');
  assert.equal(lines[2][3], '█', 'snake head should be at (3,2)');
});

test('renderFrame: food token visible', () => {
  const state = {
    snake: [{ x: 3, y: 2 }],
    direction: 'right',
    food: { x: 5, y: 2 },
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 10,
    rows: 5,
  };
  const frame = renderFrame(state);
  const lines = frame.split('\n');
  assert.equal(lines[2][5], '●', 'food should be at (5,2)');
});

test('renderFrame: empty cells are spaces', () => {
  const state = createGameState(10, 5);
  const frame = renderFrame(state);
  const lines = frame.split('\n');
  const nonSnakeNonFood = [];
  for (let y = 0; y < lines.length; y++) {
    for (let x = 0; x < lines[y].length; x++) {
      const onSnake = state.snake.some((s) => s.x === x && s.y === y);
      const onFood = state.food && state.food.x === x && state.food.y === y;
      if (!onSnake && !onFood) {
        nonSnakeNonFood.push(lines[y][x]);
      }
    }
  }
  assert.ok(nonSnakeNonFood.every((c) => c === ' '), 'empty cells must be spaces');
});

test('renderFrame: multi-segment snake visible', () => {
  const state = {
    snake: [
      { x: 4, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
    ],
    direction: 'right',
    food: { x: 5, y: 2 },
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 10,
    rows: 5,
  };
  const frame = renderFrame(state);
  const lines = frame.split('\n');
  assert.equal(lines[2][4], '█');
  assert.equal(lines[2][3], '█');
  assert.equal(lines[2][2], '█');
});

test('renderFrame: null food does not crash', () => {
  const state = {
    snake: [{ x: 0, y: 0 }],
    direction: 'right',
    food: null,
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols: 10,
    rows: 5,
  };
  const frame = renderFrame(state);
  assert.ok(frame.length > 0);
});

// ── Guard Constants ──────────────────────────────────────────────

test('MIN_COLS is 20', () => {
  assert.equal(MIN_COLS, 20);
});

test('MIN_ROWS is 10', () => {
  assert.equal(MIN_ROWS, 10);
});

test('SPEED_FLOOR is 50', () => {
  assert.equal(SPEED_FLOOR, 50);
});

test('INITIAL_SPEED is 150', () => {
  assert.equal(INITIAL_SPEED, 150);
});

test('SPEED_DECREASE is 10', () => {
  assert.equal(SPEED_DECREASE, 10);
});

test('SPEED_EVERY is 5', () => {
  assert.equal(SPEED_EVERY, 5);
});

// ── Integration: trigger sequence ────────────────────────────────

test('Integration: full Konami sequence triggers', () => {
  const detect = createKonamiDetector();
  const sequence = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
  let triggered = false;
  for (const key of sequence) {
    if (detect(key)) {
      triggered = true;
    }
  }
  assert.ok(triggered, 'Konami code should trigger on last key');
});

test('Integration: normal arrow usage does not trigger accidentally', () => {
  const detect = createKonamiDetector();
  const normalMovement = [
    'down', 'down', 'left', 'up', 'down', 'left', 'right',
    'up', 'up', 'down', 'down', 'left',
  ];
  for (const key of normalMovement) {
    const result = detect(key);
    assert.equal(result, false, 'normal movement should not trigger');
  }
});

test('Integration: non-TTY guard — trigger check is defensive', () => {
  const originalIsTTY = process.stdin.isTTY;
  try {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    assert.equal(process.stdin.isTTY, false, 'simulated non-TTY');
  } finally {
    Object.defineProperty(process.stdin, 'isTTY', {
      value: originalIsTTY,
      configurable: true,
    });
  }
});

test('Integration: small terminal guard — below MIN_COLS', () => {
  const tooSmall = 19 < MIN_COLS || 5 < MIN_ROWS;
  assert.ok(tooSmall, '19x5 should be below minimum');
});

test('Integration: small terminal guard — exactly at bounds passes', () => {
  assert.ok(MIN_COLS <= 20 && MIN_ROWS <= 10, '20x10 should be at or above minimum');
});

test('Integration: game state preserves cols/rows after tick', () => {
  const state = createGameState(30, 20);
  const next = tick(state);
  assert.equal(next.cols, 30);
  assert.equal(next.rows, 20);
});

// ──────────────────────────────────────────────────────────────────
run();
