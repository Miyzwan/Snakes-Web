(() => {
  'use strict';

  const G = 20;             // grid size
  const PTS = 10;           // points per food
  const BASE_SPEED = 150;
  const MIN_SPEED = 70;
  const SPEED_STEP = 8;
  const LVL_EVERY = 50;
  const SWIPE = 24;
  const KEY = 'kimi3-high';

  const $ = s => document.querySelector(s);
  const canvas = $('#gameCanvas');
  const ctx = canvas.getContext('2d');
  const arena = $('#arena');
  const scoreEl = $('#score');
  const hiEl = $('#highScore');
  const stOver = $('#startOverlay');
  const goOver = $('#gameOverOverlay');
  const stBtn = $('#startBtn');
  const reBtn = $('#restartBtn');
  const finalS = $('#finalScore');
  const finalH = $('#finalHighScore');
  const newRec = $('#newRec');
  const ctrlHint = $('#ctrlHint');
  const footerTip = $('#footerTip');

  let cell, snake, dir, q, food, score, hi, running, lastTick, raf, paused;

  hi = (() => { try { return parseInt(localStorage.getItem(KEY)) || 0; } catch { return 0; } })();
  hiEl.textContent = hi;

  function saveHi() {
    try { localStorage.setItem(KEY, String(hi)); } catch {}
  }

  function speed() {
    return Math.max(MIN_SPEED, BASE_SPEED - Math.floor(score / LVL_EVERY) * SPEED_STEP);
  }

  function reset() {
    const m = G >> 1;
    snake = [];
    for (let i = 0; i < 3; i++) snake.push({ x: m - i, y: m });
    dir = { x: 1, y: 0 };
    q = [];
    score = 0;
    scoreEl.textContent = '0';
    spawnFood();
  }

  function spawnFood() {
    const free = [];
    for (let y = 0; y < G; y++)
      for (let x = 0; x < G; x++)
        if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
    food = free.length ? free[Math.random() * free.length | 0] : null;
  }

  function step() {
    if (q.length) dir = q.shift();
    const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (h.x < 0 || h.x >= G || h.y < 0 || h.y >= G) return end();
    const eat = food && h.x === food.x && h.y === food.y;
    const body = eat ? snake : snake.slice(0, -1);
    if (body.some(s => s.x === h.x && s.y === h.y)) return end();
    snake.unshift(h);
    if (eat) { score += PTS; scoreEl.textContent = score; spawnFood(); }
    else snake.pop();
  }

  function end() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    const nr = score > hi;
    if (nr) { hi = score; saveHi(); hiEl.textContent = hi; }
    finalS.textContent = score;
    finalH.textContent = hi;
    newRec.classList.toggle('hidden', !nr);
    goOver.classList.remove('hidden');
  }

  function draw() {
    const s = canvas.width / G;
    ctx.fillStyle = '#0e0c22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid
    ctx.strokeStyle = 'rgba(168, 130, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < G; i++) {
      const p = i * s;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(canvas.width, p); ctx.stroke();
    }

    // food — pulsing berry
    if (food) {
      const cx = food.x * s + s / 2, cy = food.y * s + s / 2;
      const r = s * 0.35 + Math.sin(Date.now() / 200) * s * 0.04;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, '#f472b6');
      grad.addColorStop(1, '#ec4899');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      // glow
      ctx.shadowColor = '#ec4899'; ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // snake
    snake.forEach((seg, i) => {
      const ratio = 1 - i / snake.length;
      const x = seg.x * s, y = seg.y * s;
      const inset = i === 0 ? s * 0.04 : s * 0.08;
      const sz = s - inset * 2;
      if (i === 0) {
        // head — gradient
        const grd = ctx.createLinearGradient(x + inset, y + inset, x + inset + sz, y + inset + sz);
        grd.addColorStop(0, '#a78bfa');
        grd.addColorStop(1, '#7c3aed');
        ctx.fillStyle = grd;
        ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 14;
        roundRect(ctx, x + inset, y + inset, sz, sz, s * 0.18);
        ctx.fill();
        ctx.shadowBlur = 0;
        // eyes
        ctx.fillStyle = '#0c0b1a';
        const es = Math.max(2, s * 0.08);
        const eo = s * 0.22;
        const ax = dir.x * eo, ay = dir.y * eo;
        const px = dir.y * eo * 0.5, py = -dir.x * eo * 0.5;
        [-1, 1].forEach(side => {
          ctx.beginPath();
          ctx.arc(x + s / 2 + ax + px * side, y + s / 2 + ay + py * side, es, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // body — gradient tail
        const l = 40 + ratio * 25;
        ctx.fillStyle = `hsl(264, ${65 + ratio * 15}%, ${l}%)`;
        roundRect(ctx, x + inset, y + inset, sz, sz, s * 0.15);
        ctx.fill();
      }
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function loop(ts) {
    if (!running) return;
    if (!paused && ts - lastTick >= speed()) { lastTick = ts; step(); }
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function start() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    reset();
    stOver.classList.add('hidden');
    goOver.classList.add('hidden');
    paused = false;
    running = true;
    lastTick = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function queue(d) {
    const l = q.length ? q[q.length - 1] : dir;
    if (d.x === -l.x && d.y === -l.y) return;
    if (d.x === l.x && d.y === l.y) return;
    if (q.length < 3) q.push(d);
  }

  const MAP = {
    ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
    a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
  };

  document.addEventListener('keydown', e => {
    const d = MAP[e.key];
    if (d) { e.preventDefault(); if (running) queue(d); return; }
    if (e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      if (!stOver.classList.contains('hidden') || !goOver.classList.contains('hidden')) return;
      paused = !paused;
      if (!paused) { lastTick = performance.now(); raf = requestAnimationFrame(loop); }
      footerTip.textContent = paused ? '⏸️ Di-pause — Spasi untuk lanjut' : '↑ ↓ ← →  —  Spasi untuk pause';
    }
    if (e.key === 'Enter') {
      if (!stOver.classList.contains('hidden')) { e.preventDefault(); start(); }
      else if (!goOver.classList.contains('hidden')) { e.preventDefault(); start(); }
    }
  });

  // touch
  let tx = 0, ty = 0;
  arena.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    tx = t.clientX; ty = t.clientY;
  }, { passive: true });
  arena.addEventListener('touchend', e => {
    if (!running || paused) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return;
    if (Math.abs(dx) > Math.abs(dy)) queue({ x: dx > 0 ? 1 : -1, y: 0 });
    else queue({ x: 0, y: dy > 0 ? 1 : -1 });
  }, { passive: true });

  stBtn.addEventListener('click', start);
  reBtn.addEventListener('click', start);

  // detect device input
  if (window.matchMedia('(pointer: coarse)').matches) {
    ctrlHint.textContent = 'Geser layar untuk bergerak';
    footerTip.textContent = 'Geser layar — sentuh 2x untuk pause';
  }

  function resize() {
    const sz = arena.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = sz * dpr;
    canvas.height = sz * dpr;
    cell = canvas.width / G;
    draw();
  }
  window.addEventListener('resize', resize);

  reset();
  resize();
})();
