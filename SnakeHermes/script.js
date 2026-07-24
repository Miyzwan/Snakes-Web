/**
 * HERMES ARC SNAKE — GAME ENGINE
 * Hermes Agent · Nous Research
 * Fully static — GitHub Pages ready
 */
document.addEventListener('DOMContentLoaded', () => {
  /* ─── CONFIG ─── */
  const G = 20;           // grid 20×20
  const CS = 400;         // canvas px
  const CELL = CS / G;
  const TICK = 145;       // ms
  const MIN_TICK = 65;
  const DIR = { x: 1, y: 0 };

  /* ─── DOM ─── */
  const $ = id => document.getElementById(id);
  const cnv = $('gc'), ctx = cnv.getContext('2d');
  const scoreEl = $('score'), hiEl = $('highScore');
  const finScore = $('finalScore'), finHi = $('finalHigh');
  const goReason = $('goReason'), newBadge = $('newBadge');
  const startOl = $('startOverlay'), goOl = $('goOverlay'), pauseOl = $('pauseOverlay');
  const btnStart = $('btnStart'), btnRestart = $('btnRestart'), btnResume = $('btnResume');
  const sndBtn = $('btnSound'), sndIcon = $('sndIcon'), sndLabel = $('sndLabel');
  const pauseBtn = $('btnPause'), hintEl = $('hintText');

  /* ─── STATE ─── */
  let snake, food, dir, queue;
  let score, hi, speed, timer;
  let running, paused, soundOn = true;

  hi = parseInt(localStorage.getItem('hermes_snake_hi') || '0', 10);
  hiEl.textContent = hi;

  /* ─── AUDIO ─── */
  let actx;
  function aCtx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }

  function sfx(type) {
    if (!soundOn) return;
    const a = aCtx(); if (!a) return;
    try {
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      const t = a.currentTime;
      if (type === 'eat') {
        o.type = 'sine';
        o.frequency.setValueAtTime(440, t);
        o.frequency.exponentialRampToValueAtTime(880, t + 0.08);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        o.start(t); o.stop(t + 0.08);
      } else if (type === 'over') {
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(320, t);
        o.frequency.linearRampToValueAtTime(70, t + 0.35);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        o.start(t); o.stop(t + 0.35);
      } else if (type === 'start') {
        o.type = 'triangle';
        o.frequency.setValueAtTime(262, t);
        o.frequency.setValueAtTime(330, t + 0.07);
        o.frequency.setValueAtTime(392, t + 0.14);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        o.start(t); o.stop(t + 0.22);
      }
    } catch (e) {}
  }

  /* ─── GAME ─── */
  function init() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    queue = [];
    score = 0;
    speed = TICK;
    scoreEl.textContent = '0';
    newBadge.classList.add('hidden');
    spawn();
    draw();
  }

  function spawn() {
    let x, y, ok;
    do {
      x = Math.floor(Math.random() * G);
      y = Math.floor(Math.random() * G);
      ok = !snake.some(s => s.x === x && s.y === y);
    } while (!ok);
    food = { x, y };
  }

  function tick() {
    if (!running || paused) return;

    if (queue.length) {
      const n = queue.shift();
      if (n.x !== -dir.x || n.y !== -dir.y) dir = n;
    }

    const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // wall
    if (h.x < 0 || h.x >= G || h.y < 0 || h.y >= G) return end('Menabrak dinding arena!');
    // self
    if (snake.some(s => s.x === h.x && s.y === h.y)) return end('Menabrak tubuh sendiri!');

    snake.unshift(h);

    if (h.x === food.x && h.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      sfx('eat');
      if (score > hi) {
        hi = score;
        hiEl.textContent = hi;
        localStorage.setItem('hermes_snake_hi', hi.toString());
      }
      if (score % 50 === 0 && speed > MIN_TICK) {
        speed = Math.max(MIN_TICK, speed - 12);
        resetInt();
      }
      spawn();
    } else {
      snake.pop();
    }

    draw();
  }

  function resetInt() {
    if (timer) clearInterval(timer);
    timer = setInterval(tick, speed);
  }

  function end(reason) {
    running = false;
    clearInterval(timer);
    sfx('over');
    goReason.textContent = reason;
    finScore.textContent = score;
    finHi.textContent = hi;
    if (score > 0 && score >= parseInt(localStorage.getItem('hermes_snake_hi') || '0', 10)) {
      newBadge.classList.remove('hidden');
    } else newBadge.classList.add('hidden');
    goOl.classList.remove('hidden');
    goOl.classList.add('active');
  }

  /* ─── RENDER ─── */
  function draw() {
    ctx.fillStyle = '#0c0a1c';
    ctx.fillRect(0, 0, CS, CS);

    // subtle grid
    ctx.strokeStyle = 'rgba(130, 100, 255, 0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CS; i += CELL) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CS); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CS, i); ctx.stroke();
    }

    // food: amber glow orb
    const fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2;
    const rr = CELL / 2 - 2;
    ctx.save();
    ctx.shadowBlur = 16; ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    const grd = ctx.createRadialGradient(fx - 2, fy - 2, 0, fx, fy, rr);
    grd.addColorStop(0, '#fcd34d');
    grd.addColorStop(0.6, '#f59e0b');
    grd.addColorStop(1, '#b45309');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(fx, fy, rr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(fx - 3, fy - 3, rr * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // snake
    snake.forEach((seg, i) => {
      const sx = seg.x * CELL, sy = seg.y * CELL;
      ctx.save();
      if (i === 0) {
        // head — purple glow
        ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(167, 139, 250, 0.5)';
        ctx.fillStyle = '#a78bfa';
        rnd(ctx, sx + 1, sy + 1, CELL - 2, CELL - 2, 5);
        ctx.fill();

        // eyes
        ctx.fillStyle = '#0c0a1c';
        let ex1, ey1, ex2, ey2;
        const es = 2.5;
        if (dir.x === 1) { ex1 = sx + 13; ey1 = sy + 5; ex2 = sx + 13; ey2 = sy + 13; }
        else if (dir.x === -1) { ex1 = sx + 5; ey1 = sy + 5; ex2 = sx + 5; ey2 = sy + 13; }
        else if (dir.y === -1) { ex1 = sx + 5; ey1 = sy + 5; ex2 = sx + 13; ey2 = sy + 5; }
        else { ex1 = sx + 5; ey1 = sy + 13; ex2 = sx + 13; ey2 = sy + 13; }
        ctx.beginPath(); ctx.arc(ex1, ey1, es, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey2, es, 0, Math.PI * 2); ctx.fill();
      } else {
        // body — purple→amber gradient
        const p = i / snake.length;
        const r = Math.floor(167 - p * 60);
        const g = Math.floor(139 - p * 50);
        const b = Math.floor(250 - p * 100);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.shadowBlur = 3; ctx.shadowColor = 'rgba(167, 139, 250, 0.2)';
        rnd(ctx, sx + 2, sy + 2, CELL - 4, CELL - 4, 4);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function rnd(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ─── DIRECTION ─── */
  function qDir(d) {
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (d.x !== -last.x || d.y !== -last.y) {
      if (queue.length < 3) queue.push(d);
    }
  }

  /* ─── LIFECYCLE ─── */
  function start() {
    aCtx(); sfx('start');
    startOl.classList.remove('active'); startOl.classList.add('hidden');
    goOl.classList.remove('active'); goOl.classList.add('hidden');
    pauseOl.classList.add('hidden');
    init();
    running = true; paused = false;
    resetInt();
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) { pauseOl.classList.remove('hidden'); pauseOl.classList.add('active'); }
    else { pauseOl.classList.remove('active'); pauseOl.classList.add('hidden'); }
  }

  /* ─── INPUT ─── */
  window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') { togglePause(); return; }
    if (!running || paused) return;
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': qDir({ x: 0, y: -1 }); break;
      case 'ArrowDown': case 's': case 'S': qDir({ x: 0, y: 1 }); break;
      case 'ArrowLeft': case 'a': case 'A': qDir({ x: -1, y: 0 }); break;
      case 'ArrowRight': case 'd': case 'D': qDir({ x: 1, y: 0 }); break;
    }
  });

  // swipe
  let tx = 0, ty = 0;
  cnv.addEventListener('touchstart', e => {
    if (e.touches.length) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }
  }, { passive: true });
  cnv.addEventListener('touchend', e => {
    if (!running || paused || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
    if (Math.abs(dx) > Math.abs(dy)) qDir(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
    else qDir(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
  }, { passive: true });

  // d-pad
  $('dUp').addEventListener('click', () => qDir({ x: 0, y: -1 }));
  $('dDown').addEventListener('click', () => qDir({ x: 0, y: 1 }));
  $('dLeft').addEventListener('click', () => qDir({ x: -1, y: 0 }));
  $('dRight').addEventListener('click', () => qDir({ x: 1, y: 0 }));

  // buttons
  btnStart.addEventListener('click', start);
  btnRestart.addEventListener('click', start);
  btnResume.addEventListener('click', togglePause);
  pauseBtn.addEventListener('click', togglePause);
  sndBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    sndIcon.textContent = soundOn ? '♪' : '✕';
    sndLabel.textContent = soundOn ? 'Suara' : 'Bisu';
  });

  // render initial frame
  init();
});
