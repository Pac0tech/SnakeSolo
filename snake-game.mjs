const GRID_SIZE = 16;
const INITIAL_DIRECTION = "right";
const TICK_MS = 140;

export const GAME_STATUS = {
  READY: "ready",
  RUNNING: "running",
  PAUSED: "paused",
  GAME_OVER: "game-over",
};

const CELL_TYPES = {
  empty: "empty",
  snake: "snake",
  food: "food",
};

const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function createPoint(x, y) {
  return { x, y };
}

function pointsMatch(first, second) {
  return first.x === second.x && first.y === second.y;
}

function isOppositeDirection(current, next) {
  return (
    (current === "up" && next === "down") ||
    (current === "down" && next === "up") ||
    (current === "left" && next === "right") ||
    (current === "right" && next === "left")
  );
}

function randomInt(max, randomFn = Math.random) {
  return Math.floor(randomFn() * max);
}

function listOpenCells(snake, gridSize = GRID_SIZE) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const cells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        cells.push(createPoint(x, y));
      }
    }
  }

  return cells;
}

export function placeFood(snake, gridSize = GRID_SIZE, randomFn = Math.random) {
  const available = listOpenCells(snake, gridSize);
  if (available.length === 0) {
    return null;
  }

  return available[randomInt(available.length, randomFn)];
}

export function createInitialState(randomFn = Math.random, gridSize = GRID_SIZE) {
  const center = Math.floor(gridSize / 2);
  const snake = [
    createPoint(center, center),
    createPoint(center - 1, center),
    createPoint(center - 2, center),
  ];

  return {
    gridSize,
    snake,
    direction: INITIAL_DIRECTION,
    queuedDirection: INITIAL_DIRECTION,
    food: placeFood(snake, gridSize, randomFn),
    score: 0,
    status: GAME_STATUS.READY,
    endReason: null,
  };
}

export function restartGame(state, randomFn = Math.random) {
  return createInitialState(randomFn, state.gridSize);
}

export function startGame(state) {
  if (state.status !== GAME_STATUS.READY) {
    return state;
  }

  return {
    ...state,
    status: GAME_STATUS.RUNNING,
    endReason: null,
  };
}

export function togglePause(state) {
  if (state.status === GAME_STATUS.RUNNING) {
    return { ...state, status: GAME_STATUS.PAUSED };
  }

  if (state.status === GAME_STATUS.PAUSED) {
    return { ...state, status: GAME_STATUS.RUNNING };
  }

  return state;
}

export function queueDirection(state, nextDirection) {
  if (!DIRECTION_VECTORS[nextDirection] || state.status === GAME_STATUS.GAME_OVER) {
    return state;
  }

  if (isOppositeDirection(state.direction, nextDirection)) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection,
  };
}

export function stepGame(state, randomFn = Math.random) {
  if (state.status !== GAME_STATUS.RUNNING || state.food === null) {
    return state;
  }

  const nextDirection = isOppositeDirection(state.direction, state.queuedDirection)
    ? state.direction
    : state.queuedDirection;
  const vector = DIRECTION_VECTORS[nextDirection];
  const nextHead = createPoint(state.snake[0].x + vector.x, state.snake[0].y + vector.y);

  const hitsBoundary =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize;

  if (hitsBoundary) {
    return {
      ...state,
      direction: nextDirection,
      queuedDirection: nextDirection,
      status: GAME_STATUS.GAME_OVER,
      endReason: "wall",
    };
  }

  const ateFood = pointsMatch(nextHead, state.food);
  const collisionBody = ateFood ? state.snake : state.snake.slice(0, -1);
  const hitsSelf = collisionBody.some((segment) => pointsMatch(segment, nextHead));

  if (hitsSelf) {
    return {
      ...state,
      direction: nextDirection,
      queuedDirection: nextDirection,
      status: GAME_STATUS.GAME_OVER,
      endReason: "self",
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!ateFood) {
    nextSnake.pop();
  }

  const nextFood = ateFood ? placeFood(nextSnake, state.gridSize, randomFn) : state.food;
  const boardCleared = ateFood && nextFood === null;

  return {
    ...state,
    snake: nextSnake,
    direction: nextDirection,
    queuedDirection: nextDirection,
    food: nextFood,
    score: ateFood ? state.score + 1 : state.score,
    status: boardCleared ? GAME_STATUS.GAME_OVER : GAME_STATUS.RUNNING,
    endReason: boardCleared ? "cleared" : null,
  };
}

export function getBoardCells(state) {
  const snakeCells = new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));
  const foodKey = state.food ? `${state.food.x},${state.food.y}` : "";
  const cells = [];

  for (let y = 0; y < state.gridSize; y += 1) {
    for (let x = 0; x < state.gridSize; x += 1) {
      const key = `${x},${y}`;
      let type = CELL_TYPES.empty;

      if (key === foodKey) {
        type = CELL_TYPES.food;
      } else if (snakeCells.has(key)) {
        type = CELL_TYPES.snake;
      }

      cells.push(type);
    }
  }

  return cells;
}

export function getStatusLabel(state) {
  if (state.status === GAME_STATUS.GAME_OVER) {
    return "Game Over";
  }

  return state.status.charAt(0).toUpperCase() + state.status.slice(1);
}

export function getStatusMessage(state) {
  if (state.status === GAME_STATUS.READY) {
    return "Ready to start.";
  }

  if (state.status === GAME_STATUS.RUNNING) {
    return "Running. Eat the food and avoid walls.";
  }

  if (state.status === GAME_STATUS.PAUSED) {
    return "Paused. Press Pause again to resume.";
  }

  if (state.endReason === "self") {
    return "Game over. You hit your own tail.";
  }

  if (state.endReason === "wall") {
    return "Game over. You hit the wall.";
  }

  if (state.endReason === "cleared") {
    return "Game over. Board cleared.";
  }

  return "Game over.";
}

function createCellElements(documentRef, board, gridSize) {
  const cells = [];
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  for (let index = 0; index < gridSize * gridSize; index += 1) {
    const cell = documentRef.createElement("div");
    cell.className = "snake-cell snake-cell-empty";
    board.appendChild(cell);
    cells.push(cell);
  }

  return cells;
}

export function mountSnakeGame(options = {}) {
  const {
    randomFn = Math.random,
    tickMs = TICK_MS,
    documentRef = typeof document !== "undefined" ? document : null,
    windowRef = typeof window !== "undefined" ? window : null,
  } = options;

  if (!documentRef || !windowRef) {
    return null;
  }

  const board = documentRef.getElementById("snakeBoard");
  const status = documentRef.getElementById("snakeStatus");
  const score = documentRef.getElementById("snakeScore");
  const stateLabel = documentRef.getElementById("snakeState");
  const startButton = documentRef.getElementById("snakeStartButton");
  const pauseButton = documentRef.getElementById("snakePauseButton");
  const restartButton = documentRef.getElementById("snakeRestartButton");
  const controlButtons = [
    documentRef.getElementById("snakeControlUp"),
    documentRef.getElementById("snakeControlLeft"),
    documentRef.getElementById("snakeControlRight"),
    documentRef.getElementById("snakeControlDown"),
  ].filter(Boolean);

  if (!board || !status || !score || !stateLabel || !startButton || !pauseButton || !restartButton) {
    return null;
  }

  let state = createInitialState(randomFn);
  let intervalId = null;
  let cellNodes = createCellElements(documentRef, board, state.gridSize);

  function stopLoop() {
    if (intervalId !== null) {
      windowRef.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function ensureLoop() {
    if (intervalId !== null || state.status !== GAME_STATUS.RUNNING) {
      return;
    }

    intervalId = windowRef.setInterval(() => {
      state = stepGame(state, randomFn);
      render();
      if (state.status !== GAME_STATUS.RUNNING) {
        stopLoop();
      }
    }, tickMs);
  }

  function resetToReady() {
    state = restartGame(state, randomFn);
    stopLoop();
    render();
  }

  function startRound() {
    if (state.status === GAME_STATUS.GAME_OVER) {
      state = createInitialState(randomFn, state.gridSize);
    }

    state = startGame(state);
    render();
    ensureLoop();
  }

  function togglePauseAction() {
    state = togglePause(state);
    render();

    if (state.status === GAME_STATUS.RUNNING) {
      ensureLoop();
    } else {
      stopLoop();
    }
  }

  function renderBoard() {
    const cells = getBoardCells(state);
    if (cellNodes.length !== cells.length) {
      cellNodes = createCellElements(documentRef, board, state.gridSize);
    }

    for (let index = 0; index < cells.length; index += 1) {
      cellNodes[index].className = `snake-cell snake-cell-${cells[index]}`;
    }
  }

  function render() {
    renderBoard();
    score.textContent = String(state.score);
    stateLabel.textContent = getStatusLabel(state);
    status.textContent = getStatusMessage(state);
    startButton.disabled = state.status === GAME_STATUS.RUNNING;
    pauseButton.disabled = state.status === GAME_STATUS.READY || state.status === GAME_STATUS.GAME_OVER;
    pauseButton.textContent = state.status === GAME_STATUS.PAUSED ? "Resume" : "Pause";
  }

  function applyDirection(direction) {
    state = queueDirection(state, direction);
    render();
  }

  function isFormField(target) {
    return (
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
    );
  }

  startButton.addEventListener("click", () => {
    startRound();
  });

  pauseButton.addEventListener("click", () => {
    togglePauseAction();
  });

  restartButton.addEventListener("click", () => {
    resetToReady();
  });

  controlButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyDirection(button.dataset.direction);
    });
  });

  windowRef.addEventListener("keydown", (event) => {
    if (isFormField(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();
    const directionByKey = {
      arrowup: "up",
      w: "up",
      arrowdown: "down",
      s: "down",
      arrowleft: "left",
      a: "left",
      arrowright: "right",
      d: "right",
    };

    if (directionByKey[key]) {
      event.preventDefault();
      applyDirection(directionByKey[key]);
      return;
    }

    if (key === " " || key === "spacebar") {
      if (state.status === GAME_STATUS.RUNNING || state.status === GAME_STATUS.PAUSED) {
        event.preventDefault();
        togglePauseAction();
      }
      return;
    }

    if (key === "enter" && (state.status === GAME_STATUS.READY || state.status === GAME_STATUS.GAME_OVER)) {
      event.preventDefault();
      startRound();
    }
  });

  render();

  return {
    getState: () => state,
    startRound,
    togglePauseAction,
    resetToReady,
    applyDirection,
    stepOnce: () => {
      state = stepGame(state, randomFn);
      render();
      return state;
    },
    destroy: () => {
      stopLoop();
    },
  };
}

if (typeof window !== "undefined") {
  window.SnakeGameSolo = {
    GAME_STATUS,
    createInitialState,
    restartGame,
    startGame,
    togglePause,
    queueDirection,
    stepGame,
    placeFood,
    getBoardCells,
    getStatusLabel,
    getStatusMessage,
    mountSnakeGame,
  };

  mountSnakeGame();
}

