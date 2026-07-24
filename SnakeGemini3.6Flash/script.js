/**
 * NEON SNAKE GAME — GAME ENGINE (VANILLA JS)
 * Fully static client-side snake game.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Config & Grid Settings
  const GRID_SIZE = 20; // 20x20 cells
  const CANVAS_SIZE = 400;
  const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // 20px per cell
  const INITIAL_SPEED = 150; // ms per tick
  const MIN_SPEED = 65; // speed cap

  // DOM Elements
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const currentScoreEl = document.getElementById('currentScore');
  const highScoreEl = document.getElementById('highScore');
  const finalScoreEl = document.getElementById('finalScore');
  const finalHighScoreEl = document.getElementById('finalHighScore');
  const newRecordBadge = document.getElementById('newRecordBadge');
  const gameOverReason = document.getElementById('gameOverReason');

  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');

  const btnStart = document.getElementById('btnStart');
  const btnRestart = document.getElementById('btnRestart');
  const btnResume = document.getElementById('btnResume');
  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');
  const btnPauseToggle = document.getElementById('btnPauseToggle');

  const btnUp = document.getElementById('btnUp');
  const btnDown = document.getElementById('btnDown');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');

  // Game State Variables
  let snake = [];
  let food = { x: 0, y: 0 };
  let direction = { x: 1, y: 0 }; // Moving right initially
  let inputQueue = []; // Queue for directional changes
  let score = 0;
  let highScore = parseInt(localStorage.getItem('snake_high_score') || '0', 10);
  let gameInterval = null;
  let isRunning = false;
  let isPaused = false;
  let currentSpeed = INITIAL_SPEED;
  let isSoundOn = true;

  // Initial High Score Display
  highScoreEl.textContent = highScore;

  // Web Audio API Synthesizer for SFX
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!isSoundOn) return;
    const ctxAudio = getAudioContext();
    if (!ctxAudio) return;

    try {
      const osc = ctxAudio.createOscillator();
      const gain = ctxAudio.createGain();
      osc.connect(gain);
      gain.connect(ctxAudio.destination);

      const now = ctxAudio.currentTime;

      if (type === 'eat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'start') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
        osc.frequency.setValueAtTime(392.00, now + 0.16); // G4
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Init Game
  function initGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    inputQueue = [];
    score = 0;
    currentSpeed = INITIAL_SPEED;
    currentScoreEl.textContent = score;
    newRecordBadge.classList.add('hidden');

    spawnFood();
    draw();
  }

  // Spawn Food in empty cell
  function spawnFood() {
    let validPosition = false;
    let newX, newY;

    while (!validPosition) {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);

      // Ensure food is not on snake body
      validPosition = !snake.some(segment => segment.x === newX && segment.y === newY);
    }

    food = { x: newX, y: newY };
  }

  // Main Game Loop Tick
  function tick() {
    if (!isRunning || isPaused) return;

    // Process Next Direction from Queue
    if (inputQueue.length > 0) {
      const nextDir = inputQueue.shift();
      // Prevent 180-degree reverse turn
      if (nextDir.x !== -direction.x || nextDir.y !== -direction.y) {
        direction = nextDir;
      }
    }

    // New Head Position
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    // Check Wall Collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      handleGameOver('Kamu menabrak dinding arena!');
      return;
    }

    // Check Self Collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      handleGameOver('Kamu menabrak tubuh sendiri!');
      return;
    }

    // Move Snake
    snake.unshift(head);

    // Check Food Collision
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      currentScoreEl.textContent = score;
      playSound('eat');

      // Update High Score Live
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('snake_high_score', highScore.toString());
      }

      // Speed Progression (Slightly faster every 50 points)
      if (score % 50 === 0 && currentSpeed > MIN_SPEED) {
        currentSpeed = Math.max(MIN_SPEED, currentSpeed - 12);
        resetGameInterval();
      }

      spawnFood();
    } else {
      snake.pop(); // Remove tail if not eating
    }

    draw();
  }

  function resetGameInterval() {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(tick, currentSpeed);
  }

  // Render Function
  function draw() {
    // Clear Canvas
    ctx.fillStyle = '#0d1118';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw Subtle Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw Food (Glowing Orb)
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = (CELL_SIZE / 2) - 2;

    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff2a6d';
    ctx.fillStyle = '#ff2a6d';
    ctx.beginPath();
    ctx.arc(foodX, foodY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Food Inner Glow Pulse
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(foodX - 2, foodY - 2, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Snake
    snake.forEach((segment, index) => {
      const segX = segment.x * CELL_SIZE;
      const segY = segment.y * CELL_SIZE;

      ctx.save();
      if (index === 0) {
        // Snake Head
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#00f2fe';
        ctx.fillStyle = '#00f2fe';

        // Rounded Head Rect
        drawRoundedRect(ctx, segX + 1, segY + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
        ctx.fill();

        // Draw Eyes on Head
        ctx.fillStyle = '#0a0c10';
        let eyeX1, eyeY1, eyeX2, eyeY2;
        const eyeSize = 3;

        if (direction.x === 1) { // Right
          eyeX1 = segX + 13; eyeY1 = segY + 5;
          eyeX2 = segX + 13; eyeY2 = segY + 13;
        } else if (direction.x === -1) { // Left
          eyeX1 = segX + 5; eyeY1 = segY + 5;
          eyeX2 = segX + 5; eyeY2 = segY + 13;
        } else if (direction.y === -1) { // Up
          eyeX1 = segX + 5; eyeY1 = segY + 5;
          eyeX2 = segX + 13; eyeY2 = segY + 5;
        } else { // Down
          eyeX1 = segX + 5; eyeY1 = segY + 13;
          eyeX2 = segX + 13; eyeY2 = segY + 13;
        }

        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Snake Body Segment with Gradient Factor
        const progress = index / snake.length;
        const greenVal = Math.floor(255 - progress * 80);
        ctx.fillStyle = `rgb(0, ${greenVal}, ${Math.floor(180 + progress * 50)})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 255, 135, 0.4)';

        drawRoundedRect(ctx, segX + 2, segY + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // Helper for Rounded Rectangles on Canvas
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Direction Control Handler
  function queueDirection(newDir) {
    const lastDir = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : direction;
    // Disallow 180 deg reverse in queue
    if (newDir.x !== -lastDir.x || newDir.y !== -lastDir.y) {
      if (inputQueue.length < 3) {
        inputQueue.push(newDir);
      }
    }
  }

  // Game Control Lifecycle
  function startGame() {
    getAudioContext();
    playSound('start');
    startOverlay.classList.remove('active');
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.remove('active');
    gameOverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');

    initGame();
    isRunning = true;
    isPaused = false;

    resetGameInterval();
  }

  function handleGameOver(reason) {
    isRunning = false;
    if (gameInterval) clearInterval(gameInterval);
    playSound('gameover');

    gameOverReason.textContent = reason;
    finalScoreEl.textContent = score;
    finalHighScoreEl.textContent = highScore;

    if (score > 0 && score >= highScore) {
      newRecordBadge.classList.remove('hidden');
    } else {
      newRecordBadge.classList.add('hidden');
    }

    gameOverOverlay.classList.remove('hidden');
    gameOverOverlay.classList.add('active');
  }

  function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;

    if (isPaused) {
      pauseOverlay.classList.remove('hidden');
      pauseOverlay.classList.add('active');
    } else {
      pauseOverlay.classList.remove('active');
      pauseOverlay.classList.add('hidden');
    }
  }

  // Event Listeners — Keyboard Controls
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault(); // Prevent page scrolling
    }

    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      togglePause();
      return;
    }

    if (!isRunning || isPaused) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        queueDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        queueDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        queueDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        queueDirection({ x: 1, y: 0 });
        break;
    }
  });

  // Touch Swipe Gesture Detection
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 30; // Minimum px distance for swipe

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (!isRunning || isPaused) return;
    if (e.changedTouches.length === 0) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.max(Math.abs(diffX), Math.abs(diffY)) > SWIPE_THRESHOLD) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal Swipe
        if (diffX > 0) queueDirection({ x: 1, y: 0 });
        else queueDirection({ x: -1, y: 0 });
      } else {
        // Vertical Swipe
        if (diffY > 0) queueDirection({ x: 0, y: 1 });
        else queueDirection({ x: 0, y: -1 });
      }
    }
  }, { passive: true });

  // On-Screen D-Pad Controls
  btnUp.addEventListener('click', () => queueDirection({ x: 0, y: -1 }));
  btnDown.addEventListener('click', () => queueDirection({ x: 0, y: 1 }));
  btnLeft.addEventListener('click', () => queueDirection({ x: -1, y: 0 }));
  btnRight.addEventListener('click', () => queueDirection({ x: 1, y: 0 }));

  // Buttons Event Listeners
  btnStart.addEventListener('click', startGame);
  btnRestart.addEventListener('click', startGame);
  btnResume.addEventListener('click', togglePause);

  btnPauseToggle.addEventListener('click', togglePause);

  btnSoundToggle.addEventListener('click', () => {
    isSoundOn = !isSoundOn;
    soundIcon.textContent = isSoundOn ? '🔊' : '🔇';
    soundText.textContent = isSoundOn ? 'Suara: ON' : 'Suara: OFF';
  });

  // Render initial frame on load
  initGame();
});
