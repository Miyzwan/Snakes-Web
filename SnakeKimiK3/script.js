(() => {
  "use strict";

  const GRID_SIZE = 20;
  const INITIAL_LENGTH = 3;
  const INITIAL_SPEED_MS = 150;
  const MIN_SPEED_MS = 70;
  const SPEED_STEP_MS = 8;
  const SPEED_INCREASE_EVERY = 50;
  const POINTS_PER_FOOD = 10;
  const HIGH_SCORE_KEY = "snakeGameHighScore";
  const SWIPE_THRESHOLD = 24;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const arenaWrapper = document.getElementById("arenaWrapper");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("highScore");
  const startOverlay = document.getElementById("startOverlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const finalScoreEl = document.getElementById("finalScore");
  const finalHighScoreEl = document.getElementById("finalHighScore");
  const newRecordEl = document.getElementById("newRecord");
  const controlInstructionEl = document.getElementById("controlInstruction");
  const footerHintEl = document.getElementById("footerHint");

  let cellSize = 0;
  let snake = [];
  let direction = { x: 1, y: 0 };
  let directionQueue = [];
  let food = null;
  let score = 0;
  let highScore = loadHighScore();
  let running = false;
  let lastStepTime = 0;
  let animationId = null;

  function loadHighScore() {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore(value) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch {
      // localStorage tidak tersedia (mis. mode privat) — skor hanya bertahan di sesi ini
    }
  }

  function currentSpeed() {
    const level = Math.floor(score / SPEED_INCREASE_EVERY);
    return Math.max(MIN_SPEED_MS, INITIAL_SPEED_MS - level * SPEED_STEP_MS);
  }

  function resetState() {
    const mid = Math.floor(GRID_SIZE / 2);
    snake = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      snake.push({ x: mid - i, y: mid });
    }
    direction = { x: 1, y: 0 };
    directionQueue = [];
    score = 0;
    scoreEl.textContent = "0";
    spawnFood();
  }

  function spawnFood() {
    const emptyCells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!snake.some((seg) => seg.x === x && seg.y === y)) {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length === 0) {
      food = null;
      return;
    }
    food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  function step() {
    if (directionQueue.length > 0) {
      direction = directionQueue.shift();
    }

    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame();
      return;
    }

    const willEat = food !== null && head.x === food.x && head.y === food.y;
    const bodyToCheck = willEat ? snake : snake.slice(0, -1);
    if (bodyToCheck.some((seg) => seg.x === head.x && seg.y === head.y)) {
      endGame();
      return;
    }

    snake.unshift(head);

    if (willEat) {
      score += POINTS_PER_FOOD;
      scoreEl.textContent = String(score);
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function endGame() {
    running = false;
    const isNewRecord = score > highScore;
    if (isNewRecord) {
      highScore = score;
      saveHighScore(highScore);
      highScoreEl.textContent = String(highScore);
    }
    finalScoreEl.textContent = String(score);
    finalHighScoreEl.textContent = String(highScore);
    newRecordEl.classList.toggle("hidden", !isNewRecord);
    gameOverOverlay.classList.remove("hidden");
  }

  function draw() {
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID_SIZE; i++) {
      const pos = i * cellSize;
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
    }
    ctx.stroke();

    if (food) {
      const cx = food.x * cellSize + cellSize / 2;
      const cy = food.y * cellSize + cellSize / 2;
      ctx.fillStyle = "#f87171";
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    snake.forEach((seg, i) => {
      const ratio = 1 - i / Math.max(snake.length, 1);
      const lightness = 45 + ratio * 20;
      ctx.fillStyle = i === 0 ? "#4ade80" : `hsl(142, 65%, ${lightness}%)`;
      const inset = i === 0 ? cellSize * 0.05 : cellSize * 0.08;
      ctx.fillRect(
        seg.x * cellSize + inset,
        seg.y * cellSize + inset,
        cellSize - inset * 2,
        cellSize - inset * 2
      );
    });
  }

  function loop(timestamp) {
    if (!running) return;
    if (timestamp - lastStepTime >= currentSpeed()) {
      lastStepTime = timestamp;
      step();
    }
    draw();
    if (running) {
      animationId = requestAnimationFrame(loop);
    }
  }

  function startGame() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    resetState();
    startOverlay.classList.add("hidden");
    gameOverOverlay.classList.add("hidden");
    running = true;
    lastStepTime = performance.now();
    animationId = requestAnimationFrame(loop);
  }

  function queueDirection(dir) {
    const last = directionQueue.length > 0
      ? directionQueue[directionQueue.length - 1]
      : direction;
    const isOpposite = dir.x === -last.x && dir.y === -last.y;
    const isSame = dir.x === last.x && dir.y === last.y;
    if (!isOpposite && !isSame && directionQueue.length < 3) {
      directionQueue.push(dir);
    }
  }

  const KEY_DIRECTIONS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };

  document.addEventListener("keydown", (event) => {
    const dir = KEY_DIRECTIONS[event.key];
    if (dir) {
      event.preventDefault();
      if (running) {
        queueDirection(dir);
      }
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (!startOverlay.classList.contains("hidden")) {
        event.preventDefault();
        startGame();
      } else if (!gameOverOverlay.classList.contains("hidden")) {
        event.preventDefault();
        startGame();
      }
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;

  arenaWrapper.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  arenaWrapper.addEventListener("touchend", (event) => {
    if (!running) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    } else {
      queueDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    }
  }, { passive: true });

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);

  function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  function applyDeviceInstructions() {
    if (isTouchDevice()) {
      controlInstructionEl.textContent =
        "Geser (swipe) layar ke arah yang diinginkan untuk bergerak.";
      footerHintEl.textContent = "Geser layar untuk bergerak";
    } else {
      controlInstructionEl.textContent =
        "Gunakan tombol panah (↑ ↓ ← →) untuk bergerak.";
      footerHintEl.textContent = "Tekan tombol panah untuk bergerak";
    }
  }

  function resizeCanvas() {
    const size = arenaWrapper.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    cellSize = canvas.width / GRID_SIZE;
    draw();
  }

  window.addEventListener("resize", resizeCanvas);

  highScoreEl.textContent = String(highScore);
  applyDeviceInstructions();
  resetState();
  resizeCanvas();
})();
