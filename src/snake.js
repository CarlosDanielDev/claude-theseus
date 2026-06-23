const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export const INITIAL_SPEED = 150;
export const SPEED_DECREASE = 10;
export const SPEED_FLOOR = 50;
export const SPEED_EVERY = 5;

export const MIN_COLS = 20;
export const MIN_ROWS = 10;

export function createGameState(cols, rows) {
  const startX = Math.floor(cols / 2);
  const startY = Math.floor(rows / 2);
  const snake = [{ x: startX, y: startY }];
  return {
    snake,
    direction: 'right',
    food: spawnFood(cols, rows, snake),
    score: 0,
    speed: INITIAL_SPEED,
    alive: true,
    cols,
    rows,
  };
}

export function spawnFood(cols, rows, snake) {
  const occupied = new Set(snake.map((s) => s.x + ',' + s.y));
  const maxAttempts = cols * rows;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pos = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
    if (!occupied.has(pos.x + ',' + pos.y)) return pos;
  }
  return null;
}

export function tick(state) {
  if (!state.alive) return state;

  const dir = DIRECTIONS[state.direction];
  const head = state.snake[0];
  let nx = head.x + dir.x;
  let ny = head.y + dir.y;

  nx = ((nx % state.cols) + state.cols) % state.cols;
  ny = ((ny % state.rows) + state.rows) % state.rows;

  const newHead = { x: nx, y: ny };

  const ate = state.food != null && newHead.x === state.food.x && newHead.y === state.food.y;
  const newSnake = ate
    ? [newHead, ...state.snake]
    : [newHead, ...state.snake.slice(0, -1)];

  if (newSnake.slice(1).some((s) => s.x === newHead.x && s.y === newHead.y)) {
    return { ...state, alive: false };
  }

  const newScore = ate ? state.score + 1 : state.score;
  const newSpeed = ate && newScore > 0 && newScore % SPEED_EVERY === 0
    ? Math.max(SPEED_FLOOR, state.speed - SPEED_DECREASE)
    : state.speed;
  const newFood = ate ? spawnFood(state.cols, state.rows, newSnake) : state.food;

  return {
    ...state,
    snake: newSnake,
    food: newFood,
    score: newScore,
    speed: newSpeed,
    alive: true,
  };
}

export function changeDirection(state, newDir) {
  if (OPPOSITES[state.direction] !== newDir) {
    return { ...state, direction: newDir };
  }
  return state;
}

export function renderFrame(state) {
  const { snake, food, cols, rows } = state;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));

  for (const seg of snake) {
    if (seg.y >= 0 && seg.y < rows && seg.x >= 0 && seg.x < cols) {
      grid[seg.y][seg.x] = '█';
    }
  }

  if (food && food.y >= 0 && food.y < rows && food.x >= 0 && food.x < cols) {
    grid[food.y][food.x] = '●';
  }

  return grid.map((row) => row.join('')).join('\n');
}
