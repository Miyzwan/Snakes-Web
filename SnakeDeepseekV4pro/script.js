(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const instructions = document.getElementById('instructions');
  const instructionsText = document.getElementById('instructionsText');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const finalScoreEl = document.getElementById('finalScore');
  const finalHighScoreEl = document.getElementById('finalHighScore');
  const newRecordEl = document.getElementById('newRecord');
  const restartBtn = document.getElementById('restartBtn');

  const GRID_SIZE = 20;
  const INITIAL_SPEED = 150;
  const POINTS_PER_FOOD = 10;
  const INITIAL_LENGTH = 3;
  const HS_KEY = 'snake_highscore';

  let cellSize;
  let snake;
  let food;
  let direction;
  let nextDirection;
  let score;
  let highScore;
  let gameRunning;
  let gameLoop;
  let speed;
  let gameStarted;
  let isMobile;

  function detectMobile() {
    return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || 
           ('ontouchstart' in window && window.innerWidth < 768);
  }

  function updateInstructions() {
    if (isMobile) {
      instructionsText.textContent = 'Geser (swipe) layar ke arah yang diinginkan untuk bergerak.';
    } else {
      instructionsText.textContent = 'Gunakan tombol panah (↑ ↓ ← →) untuk bergerak.';
    }
  }

  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const size = Math.min(wrapper.clientWidth, 500);
    canvas.width = size;
    canvas.height = size;
    cellSize = size / GRID_SIZE;
  }

  function loadHighScore() {
    try {
      const stored = localStorage.getItem(HS_KEY);
      highScore = stored ? parseInt(stored, 10) : 0;
    } catch {
      highScore = 0;
    }
    highScoreEl.textContent = highScore;
  }

  function saveHighScore() {
    if (score > highScore) {
      highScore = score;
      try {
        localStorage.setItem(HS_KEY, highScore);
      } catch { /* storage full or unavailable */ }
      highScoreEl.textContent = highScore;
      return true;
    }
    return false;
  }

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function spawnFood() {
    if (snake.length >= GRID_SIZE * GRID_SIZE) return null;

    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    const free = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) {
          free.push({ x, y });
        }
      }
    }

    if (free.length === 0) return null;
    return free[randomInt(free.length)];
  }

  function initGame() {
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);

    snake = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      snake.push({ x: startX - i, y: startY });
    }

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = INITIAL_SPEED;
    gameRunning = true;
    gameStarted = false;
    food = spawnFood();

    scoreEl.textContent = '0';
    gameOverOverlay.classList.remove('active');
    instructions.classList.remove('hidden');
    updateInstructions();
    draw();
  }

  function gameOver() {
    gameRunning = false;
    clearTimeout(gameLoop);

    finalScoreEl.textContent = score;
    finalHighScoreEl.textContent = highScore;
    const isNew = score > 0 && saveHighScore();

    if (isNew) {
      newRecordEl.textContent = '🏆 Rekor Baru!';
      newRecordEl.classList.add('show');
    } else {
      newRecordEl.classList.remove('show');
    }

    gameOverOverlay.classList.add('active');
    instructions.classList.add('hidden');
  }

  function restart() {
    clearTimeout(gameLoop);
    initGame();
    draw();
  }

  function update() {
    direction = { ...nextDirection };

    const head = snake[0];
    const newHead = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };

    if (
      newHead.x < 0 || newHead.x >= GRID_SIZE ||
      newHead.y < 0 || newHead.y >= GRID_SIZE
    ) {
      gameOver();
      return;
    }

    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
        gameOver();
        return;
      }
    }

    snake.unshift(newHead);

    if (food && newHead.x === food.x && newHead.y === food.y) {
      score += POINTS_PER_FOOD;
      scoreEl.textContent = score;
      food = spawnFood();

      if (score % 50 === 0 && speed > 50) {
        speed -= 8;
      }
    } else {
      snake.pop();
    }

    draw();
    gameLoop = setTimeout(update, speed);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillStyle = '#18183a';
        } else {
          ctx.fillStyle = '#1c1c42';
        }
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const pad = 1;
      const size = cellSize - pad * 2;

      if (i === 0) {
        ctx.fillStyle = '#00e676';
      } else {
        const t = i / Math.max(snake.length - 1, 1);
        const r = Math.round(0 * (1 - t) + 40 * t);
        const g = Math.round(200 * (1 - t) + 140 * t);
        const b = Math.round(100 * (1 - t) + 40 * t);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      }

      ctx.beginPath();
      ctx.roundRect(
        seg.x * cellSize + pad,
        seg.y * cellSize + pad,
        size,
        size,
        4
      );
      ctx.fill();
    }

    if (food) {
      const fx = food.x * cellSize + cellSize / 2;
      const fy = food.y * cellSize + cellSize / 2;
      const radius = cellSize / 2 - 2;

      ctx.fillStyle = '#ff5252';
      ctx.shadowColor = '#ff5252';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(fx, fy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function setDirection(dx, dy) {
    if (dx !== 0 && dy !== 0) return;

    const opposite = direction.x + dx === 0 && direction.y + dy === 0;

    if ((dx !== 0 || dy !== 0) && !opposite) {
      nextDirection = { x: dx, y: dy };

      if (!gameStarted && gameRunning) {
        gameStarted = true;
        instructions.classList.add('hidden');
        gameLoop = setTimeout(update, speed);
      }
    }
  }

  function handleKey(e) {
    if (!gameRunning) return;
    const keyMap = {
      ArrowUp:    [0, -1],
      ArrowDown:  [0, 1],
      ArrowLeft:  [-1, 0],
      ArrowRight: [1, 0],
    };
    if (keyMap[e.key]) {
      e.preventDefault();
      setDirection(keyMap[e.key][0], keyMap[e.key][1]);
    }
  }

  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 25;

  function handleTouchStart(e) {
    if (!gameRunning) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }

  function handleTouchEnd(e) {
    if (!gameRunning) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;

    e.preventDefault();

    if (absDx > absDy) {
      setDirection(dx > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, dy > 0 ? 1 : -1);
    }
  }

  function handleTouchMove(e) {
    e.preventDefault();
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
  });

  restartBtn.addEventListener('click', restart);
  document.addEventListener('keydown', handleKey);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

  isMobile = detectMobile();
  loadHighScore();
  resizeCanvas();
  initGame();
})();
