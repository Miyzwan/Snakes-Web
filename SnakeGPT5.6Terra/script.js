(() => {
  'use strict';

  const GRID_SIZE = 20;
  const POINTS_PER_FOOD = 10;
  const INITIAL_SPEED = 150;
  const STORAGE_KEY = 'snake-high-score';

  const canvas = document.querySelector('#game-canvas');
  const context = canvas.getContext('2d');
  const scoreElement = document.querySelector('#score');
  const highScoreElement = document.querySelector('#high-score');
  const helpElement = document.querySelector('#controls-help');
  const gameOverElement = document.querySelector('#game-over');
  const finalScoreElement = document.querySelector('#final-score');
  const finalHighScoreElement = document.querySelector('#final-high-score');
  const restartButton = document.querySelector('#restart-button');

  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };

  let snake;
  let direction;
  let pendingDirection;
  let food;
  let score;
  let highScore = getHighScore();
  let gameTimer;
  let gameOver;
  let touchStart;

  function getHighScore() {
    try {
      return Number.parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore() {
    try {
      localStorage.setItem(STORAGE_KEY, String(highScore));
    } catch {
      // Game tetap dapat dimainkan jika browser memblokir localStorage.
    }
  }

  function resetGame() {
    window.clearInterval(gameTimer);
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    direction = { x: 1, y: 0 };
    pendingDirection = direction;
    score = 0;
    food = placeFood();
    gameOver = false;
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    gameOverElement.classList.add('hidden');
    draw();
    gameTimer = window.setInterval(moveSnake, INITIAL_SPEED);
    canvas.focus({ preventScroll: true });
  }

  function placeFood() {
    const openCells = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        if (!snake.some((segment) => segment.x === x && segment.y === y)) {
          openCells.push({ x, y });
        }
      }
    }
    return openCells.length ? openCells[Math.floor(Math.random() * openCells.length)] : null;
  }

  function moveSnake() {
    if (gameOver) return;

    direction = pendingDirection;
    const head = snake[0];
    const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
    const ateFood = nextHead.x === food?.x && nextHead.y === food?.y;
    const bodyToCheck = ateFood ? snake : snake.slice(0, -1);

    if (isOutOfBounds(nextHead) || bodyToCheck.some((segment) => sameCell(segment, nextHead))) {
      endGame();
      return;
    }

    snake.unshift(nextHead);
    if (ateFood) {
      score += POINTS_PER_FOOD;
      updateScore();
      food = placeFood();
      if (!food) {
        endGame('Kamu menang!');
        return;
      }
    } else {
      snake.pop();
    }
    draw();
  }

  function updateScore() {
    scoreElement.textContent = score;
    if (score > highScore) {
      highScore = score;
      highScoreElement.textContent = highScore;
      saveHighScore();
    }
  }

  function endGame(title = 'Game Over') {
    gameOver = true;
    window.clearInterval(gameTimer);
    finalScoreElement.textContent = score;
    finalHighScoreElement.textContent = highScore;
    document.querySelector('#game-over-title').textContent = title;
    gameOverElement.classList.remove('hidden');
    restartButton.focus();
  }

  function isOutOfBounds(cell) {
    return cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE;
  }

  function sameCell(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function draw() {
    const size = canvas.width / GRID_SIZE;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#10251c';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = 'rgba(220, 244, 203, .07)';
    context.lineWidth = 1;
    for (let line = 1; line < GRID_SIZE; line += 1) {
      const offset = line * size;
      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(offset, canvas.height);
      context.moveTo(0, offset);
      context.lineTo(canvas.width, offset);
      context.stroke();
    }

    if (food) drawFood(food, size);
    snake.forEach((segment, index) => drawSnakeSegment(segment, size, index === 0));
  }

  function drawSnakeSegment(segment, size, isHead) {
    const inset = isHead ? size * 0.08 : size * 0.12;
    const x = segment.x * size + inset;
    const y = segment.y * size + inset;
    const length = size - inset * 2;
    context.fillStyle = isHead ? '#d2ff72' : '#aee63c';
    roundRect(context, x, y, length, length, size * 0.22);
    context.fill();

    if (isHead) {
      context.fillStyle = '#173122';
      const eyeSize = Math.max(2, size * 0.09);
      const eyeOffset = size * 0.25;
      const alongX = direction.x * eyeOffset;
      const alongY = direction.y * eyeOffset;
      const perpendicularX = direction.y * eyeOffset * .55;
      const perpendicularY = -direction.x * eyeOffset * .55;
      [1, -1].forEach((side) => {
        context.beginPath();
        context.arc(segment.x * size + size / 2 + alongX + perpendicularX * side, segment.y * size + size / 2 + alongY + perpendicularY * side, eyeSize, 0, Math.PI * 2);
        context.fill();
      });
    }
  }

  function drawFood(cell, size) {
    const centerX = cell.x * size + size / 2;
    const centerY = cell.y * size + size / 2;
    context.fillStyle = '#ff5e75';
    context.beginPath();
    context.arc(centerX, centerY, size * .27, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#d2ff72';
    context.fillRect(centerX + size * .06, centerY - size * .36, size * .08, size * .2);
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, safeRadius);
  }

  function setDirection(nextDirection) {
    if (gameOver) return;
    const isOpposite = nextDirection.x === -direction.x && nextDirection.y === -direction.y;
    if (!isOpposite) pendingDirection = nextDirection;
  }

  function handleKeydown(event) {
    const nextDirection = directions[event.key];
    if (!nextDirection) return;
    event.preventDefault();
    setDirection(nextDirection);
  }

  function detectControls() {
    const isTouchPrimary = window.matchMedia('(pointer: coarse)').matches;
    helpElement.textContent = isTouchPrimary
      ? 'Geser (swipe) layar ke arah yang diinginkan untuk bergerak.'
      : 'Gunakan tombol panah (↑ ↓ ← →) untuk bergerak.';
  }

  document.addEventListener('keydown', handleKeydown);
  restartButton.addEventListener('click', resetGame);
  canvas.addEventListener('pointerdown', (event) => {
    touchStart = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!touchStart) return;
    const deltaX = event.clientX - touchStart.x;
    const deltaY = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 20) return;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDirection(deltaX > 0 ? directions.ArrowRight : directions.ArrowLeft);
    } else {
      setDirection(deltaY > 0 ? directions.ArrowDown : directions.ArrowUp);
    }
  });
  canvas.addEventListener('pointercancel', () => { touchStart = null; });
  window.addEventListener('resize', detectControls);

  detectControls();
  resetGame();
})();
