/* ══════════════════════════════════════════════════
   SNAKE PRO — CYBERPUNK EDITION
   script.js — Lógica Completa
══════════════════════════════════════════════════ */

'use strict';

// ── CONSTANTES ────────────────────────────────────────────────────────
const GRID      = 20;
const COLORS = {
  GREEN:   '#39ff7e',
  GREEN_H: '#a8ffcb',
  CYAN:    '#00e5ff',
  PINK:    '#ff3f6c',
  GOLD:    '#ffd700',
  PURPLE:  '#bf5fff',
  GRID:    '#13161d',
  BG:      '#12151a',
};

// ── ESTADO GLOBAL ─────────────────────────────────────────────────────
const State = {
  coins:     0,
  best:      0,
  owned:     ['skin_default'],
  equipped:  'skin_default',
  diffSpeed: 110,
};

// ── DADOS DA LOJA ─────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { id:'skin_default', name:'CLÁSSICO',   icon:'🐍', desc:'Cobra verde neon padrão.',       price:0,    type:'skin' },
  { id:'skin_cyber',  name:'CYBER',       icon:'🤖', desc:'Azul cibernético vibrante.',      price:150,  type:'skin' },
  { id:'skin_lava',   name:'LAVA',        icon:'🔥', desc:'Vermelho vulcânico flamejante.',  price:200,  type:'skin' },
  { id:'skin_ghost',  name:'FANTASMA',    icon:'👻', desc:'Roxo translúcido misterioso.',   price:250,  type:'skin' },
  { id:'pw_shield',   name:'ESCUDO',      icon:'🛡', desc:'Sobrevive 1 colisão com parede.', price:80,   type:'powerup_unlock' },
  { id:'pw_slow',     name:'CÂMERA LENTA',icon:'⏳', desc:'Reduz a velocidade por 5s.',      price:100,  type:'powerup_unlock' },
  { id:'pw_magnet',   name:'MAGNETO',     icon:'🧲', desc:'Atrai moedas próximas.',          price:120,  type:'powerup_unlock' },
];

const SKIN_COLORS = {
  skin_default: { body: COLORS.GREEN,  head: COLORS.GREEN_H, glow: COLORS.GREEN  },
  skin_cyber:   { body: COLORS.CYAN,   head: '#80ffff',      glow: COLORS.CYAN   },
  skin_lava:    { body: '#ff5f2e',     head: '#ffaa00',      glow: '#ff5f2e'     },
  skin_ghost:   { body: COLORS.PURPLE, head: '#e0aaff',      glow: COLORS.PURPLE },
};

// ── PERSISTÊNCIA ──────────────────────────────────────────────────────
function saveState() {
  localStorage.setItem('snakePro', JSON.stringify({
    coins:    State.coins,
    best:     State.best,
    owned:    State.owned,
    equipped: State.equipped,
  }));
}
function loadState() {
  try {
    const d = JSON.parse(localStorage.getItem('snakePro') || '{}');
    if (d.coins    !== undefined) State.coins    = d.coins;
    if (d.best     !== undefined) State.best     = d.best;
    if (d.owned    !== undefined) State.owned    = d.owned;
    if (d.equipped !== undefined) State.equipped = d.equipped;
  } catch(e) {}
}

// ── NAVEGAÇÃO DE TELAS ────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ══════════════════════════════════════════════════
// MENU — COBRA ANIMADA NO FUNDO
// ══════════════════════════════════════════════════
(function initBgSnake() {
  const c  = document.getElementById('bg-canvas');
  const cx = c.getContext('2d');
  let W, H, segments = [], angle = 0, t = 0;

  function resize() {
    W = c.width  = c.offsetWidth;
    H = c.height = c.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  segments = Array.from({length:30}, (_,i) => ({
    x: W/2 - i*12,
    y: H/2,
  }));

  function updateBg() {
    t += 0.025;
    angle += 0.018;
    const head = segments[0];
    head.x += Math.cos(angle + Math.sin(t)*1.2) * 2.5;
    head.y += Math.sin(angle + Math.cos(t)*1.2) * 2.5;
    head.x = ((head.x % W) + W) % W;
    head.y = ((head.y % H) + H) % H;
    for (let i = segments.length-1; i > 0; i--) {
      segments[i] = { ...segments[i-1] };
    }

    cx.clearRect(0,0,W,H);
    segments.forEach((s,i) => {
      const alpha = (1 - i/segments.length) * 0.6;
      cx.fillStyle = `rgba(57,255,126,${alpha})`;
      cx.shadowColor = COLORS.GREEN;
      cx.shadowBlur  = 8;
      cx.beginPath();
      cx.arc(s.x, s.y, 6 - i*0.15, 0, Math.PI*2);
      cx.fill();
    });
    requestAnimationFrame(updateBg);
  }
  updateBg();
})();

// ══════════════════════════════════════════════════
// LOJA
// ══════════════════════════════════════════════════
function renderShop() {
  document.getElementById('shop-coins').textContent = State.coins;
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';

  SHOP_ITEMS.forEach(item => {
    const owned    = State.owned.includes(item.id);
    const equipped = State.equipped === item.id;
    const card = document.createElement('div');
    card.className = `shop-card ${owned?'owned':''} ${equipped?'equipped':''}`;

    let btnHTML = '';
    if (item.type === 'skin') {
      if (!owned) {
        btnHTML = `<button class="shop-card-btn buy" data-id="${item.id}">🪙 ${item.price}</button>`;
      } else if (equipped) {
        btnHTML = `<button class="shop-card-btn equipped-tag">✔ EQUIPADO</button>`;
      } else {
        btnHTML = `<button class="shop-card-btn equip" data-id="${item.id}">EQUIPAR</button>`;
      }
    } else {
      // powerup_unlock: compra apenas uma vez para desbloquear no jogo
      if (!owned) {
        btnHTML = `<button class="shop-card-btn buy" data-id="${item.id}">🪙 ${item.price}</button>`;
      } else {
        btnHTML = `<button class="shop-card-btn equipped-tag">✔ DESBLOQUEADO</button>`;
      }
    }

    card.innerHTML = `
      <div class="shop-card-icon">${item.icon}</div>
      <div class="shop-card-name">${item.name}</div>
      <div class="shop-card-desc">${item.desc}</div>
      ${!owned && item.price > 0 ? `<div class="shop-card-price">🪙 ${item.price}</div>` : ''}
      ${btnHTML}
    `;
    grid.appendChild(card);
  });

  // Eventos
  grid.querySelectorAll('.shop-card-btn.buy').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = SHOP_ITEMS.find(i => i.id === btn.dataset.id);
      if (!item || State.coins < item.price) {
        btn.textContent = '✗ SEM MOEDAS';
        setTimeout(() => renderShop(), 800);
        return;
      }
      State.coins -= item.price;
      State.owned.push(item.id);
      if (item.type === 'skin') State.equipped = item.id;
      saveState();
      renderShop();
    });
  });
  grid.querySelectorAll('.shop-card-btn.equip').forEach(btn => {
    btn.addEventListener('click', () => {
      State.equipped = btn.dataset.id;
      saveState();
      renderShop();
    });
  });
}

// ══════════════════════════════════════════════════
// JOGO
// ══════════════════════════════════════════════════
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

// Elementos HUD
const scoreEl   = document.getElementById('score');
const hudCoins  = document.getElementById('hud-coins');
const levelEl   = document.getElementById('level');
const overlay   = document.getElementById('overlay');
const overPause = document.getElementById('overlay-pause');
const finalScoreEl = document.getElementById('final-score');
const finalBestEl  = document.getElementById('final-best');
const finalCoinsEl = document.getElementById('final-coins');
const pwIndicator  = document.getElementById('powerup-indicator');
const pwBar        = document.getElementById('powerup-bar');
const pwIcon       = document.getElementById('powerup-icon');

let COLS, ROWS;

// ── RESIZE CANVAS ────────────────────────────────────────────────────
function calcSize() {
  // Reserva: HUD (48px) + footer (160px) + gaps
  const avH = window.innerHeight - 48 - 168;
  const avW = window.innerWidth - 16;
  const sz  = Math.min(avH, avW, 440);
  return Math.floor(sz / GRID) * GRID;
}
function resizeCanvas() {
  const sz = calcSize();
  canvas.width = canvas.height = sz;
  COLS = ROWS = sz / GRID;
}

// ── GAME STATE ────────────────────────────────────────────────────────
let snake, dir, nextDir, food, coins, particles;
let score, sessionCoins, level, baseSpeed;
let running, paused, loopTimer;

// Power-up state
let activePow   = null;   // { type, timerMs, totalMs }
let shieldUsed  = false;
let spawnedPow  = null;   // { x, y, type } — power-up no mapa

const POW_TYPES  = ['shield', 'slow', 'magnet'];
const POW_ICONS  = { shield:'🛡', slow:'⏳', magnet:'🧲' };
const POW_COLORS = { shield: COLORS.CYAN, slow: COLORS.PURPLE, magnet: COLORS.GOLD };

function getUnlockedPowerups() {
  return POW_TYPES.filter(p => State.owned.includes('pw_' + p));
}

// ── INIT ──────────────────────────────────────────────────────────────
function initGame() {
  resizeCanvas();
  snake       = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  dir         = {x:1,y:0};
  nextDir     = {x:1,y:0};
  score       = 0;
  sessionCoins = 0;
  level       = 1;
  baseSpeed   = State.diffSpeed;
  running     = true;
  paused      = false;
  particles   = [];
  activePow   = null;
  spawnedPow  = null;
  shieldUsed  = false;

  scoreEl.textContent  = 0;
  hudCoins.textContent = 0;
  levelEl.textContent  = 1;
  overlay.classList.add('hidden');
  overPause.classList.add('hidden');
  pwIndicator.classList.remove('visible');

  food  = randomPos();
  coins = [randomPos(), randomPos()];

  clearTimeout(loopTimer);
  scheduleNext();
  draw();
}

function scheduleNext() {
  // Velocidade: diminui 3ms por nível, mínimo 40ms
  const spd = Math.max(40, baseSpeed - (level - 1) * 3);
  loopTimer = setTimeout(() => { tick(); if (running && !paused) scheduleNext(); }, spd);
}

// ── POSIÇÃO ALEATÓRIA ─────────────────────────────────────────────────
function randomPos(exclude = []) {
  const all = [...snake, ...coins, ...(food ? [food] : []), ...(spawnedPow ? [spawnedPow] : []), ...exclude];
  let pos;
  let tries = 0;
  do {
    pos = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
    tries++;
  } while (tries < 200 && all.some(s => s.x===pos.x && s.y===pos.y));
  return pos;
}

// ── TICK ──────────────────────────────────────────────────────────────
function tick() {
  if (!running || paused) return;

  dir = {...nextDir};
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Colisão parede
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    if (activePow?.type === 'shield' && !shieldUsed) {
      // Escudo absorve a colisão: teleporta para lado oposto
      shieldUsed = true;
      head.x = ((head.x % COLS) + COLS) % COLS;
      head.y = ((head.y % ROWS) + ROWS) % ROWS;
      spawnParticles(head.x * GRID + GRID/2, head.y * GRID + GRID/2, COLORS.CYAN, 12);
    } else {
      return gameOver();
    }
  }

  // Colisão corpo
  if (snake.some(s => s.x===head.x && s.y===head.y)) return gameOver();

  snake.unshift(head);
  let grew = false;

  // Comeu comida
  if (head.x===food.x && head.y===food.y) {
    grew  = true;
    score++;
    scoreEl.textContent = score;
    spawnParticles(head.x*GRID + GRID/2, head.y*GRID + GRID/2, COLORS.GREEN, 16);
    food = randomPos();

    // Sobe nível a cada 5 pontos
    const newLevel = Math.floor(score / 5) + 1;
    if (newLevel > level) {
      level = newLevel;
      levelEl.textContent = level;
      spawnParticles(canvas.width/2, canvas.height/2, COLORS.CYAN, 20);
    }
  } else {
    snake.pop();
  }

  // Comeu moeda
  coins = coins.filter(c => {
    if (c.x===head.x && c.y===head.y) {
      sessionCoins++;
      hudCoins.textContent = sessionCoins;
      spawnParticles(head.x*GRID + GRID/2, head.y*GRID + GRID/2, COLORS.GOLD, 10);
      return false;
    }
    return true;
  });
  // Magneto: atrai moedas adjacentes
  if (activePow?.type === 'magnet') {
    coins = coins.filter(c => {
      const dist = Math.abs(c.x - head.x) + Math.abs(c.y - head.y);
      if (dist <= 3) {
        sessionCoins++;
        hudCoins.textContent = sessionCoins;
        spawnParticles(c.x*GRID + GRID/2, c.y*GRID + GRID/2, COLORS.GOLD, 6);
        return false;
      }
      return true;
    });
  }
  while (coins.length < 2) coins.push(randomPos());

  // Comeu power-up do mapa
  if (spawnedPow && head.x===spawnedPow.x && head.y===spawnedPow.y) {
    activatePowerup(spawnedPow.type);
    spawnedPow = null;
  }

  // Spawn de power-up aleatório (a cada ~30 ticks com 25% chance, se desbloqueado)
  if (!spawnedPow && Math.random() < 0.012) {
    const available = getUnlockedPowerups();
    if (available.length > 0) {
      const type = available[Math.floor(Math.random()*available.length)];
      spawnedPow = { ...randomPos(), type };
    }
  }

  // Atualiza timer do power-up ativo
  if (activePow) {
    const spd = Math.max(40, baseSpeed - (level-1)*3);
    activePow.timerMs -= spd;
    const pct = Math.max(0, activePow.timerMs / activePow.totalMs * 100);
    pwBar.style.width = pct + '%';
    if (activePow.timerMs <= 0) deactivatePowerup();
  }

  updateParticles();
  draw();
}

// ── POWER-UPS ─────────────────────────────────────────────────────────
function activatePowerup(type) {
  const durations = { shield: 8000, slow: 5000, magnet: 6000 };
  activePow  = { type, timerMs: durations[type], totalMs: durations[type] };
  shieldUsed = false;
  pwIndicator.classList.add('visible');
  pwIcon.textContent = POW_ICONS[type];
  pwBar.style.background = POW_COLORS[type];
  pwBar.style.boxShadow  = `0 0 6px ${POW_COLORS[type]}`;

  // Câmera lenta
  if (type === 'slow') {
    baseSpeed = State.diffSpeed * 2.2;
  }
  spawnParticles(canvas.width/2, canvas.height/2, POW_COLORS[type], 18);
}

function deactivatePowerup() {
  if (activePow?.type === 'slow') baseSpeed = State.diffSpeed;
  activePow = null;
  pwIndicator.classList.remove('visible');
}

// ── PARTÍCULAS ────────────────────────────────────────────────────────
function spawnParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.04 + Math.random() * 0.04,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vx   *= 0.92;
    p.vy   *= 0.92;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ── DRAW ──────────────────────────────────────────────────────────────
function draw() {
  // Fundo
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grade
  ctx.strokeStyle = COLORS.GRID;
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x*GRID,0); ctx.lineTo(x*GRID,canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0,y*GRID); ctx.lineTo(canvas.width,y*GRID); ctx.stroke();
  }

  // Partículas
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });

  // Cobra
  const skin = SKIN_COLORS[State.equipped] || SKIN_COLORS.skin_default;
  const hasShield = activePow?.type === 'shield';

  snake.forEach((seg, i) => {
    const isHead = i === 0;
    const m = isHead ? 1 : 2;
    ctx.fillStyle   = isHead ? skin.head : skin.body;
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur  = isHead ? 20 : 8;

    // Efeito escudo no contorno
    if (hasShield && isHead) {
      ctx.strokeStyle = COLORS.CYAN;
      ctx.lineWidth   = 2;
      ctx.shadowColor = COLORS.CYAN;
      ctx.shadowBlur  = 16;
    }

    ctx.beginPath();
    ctx.roundRect(seg.x*GRID+m, seg.y*GRID+m, GRID-m*2, GRID-m*2, isHead ? 5 : 3);
    ctx.fill();
    if (hasShield && isHead) ctx.stroke();
  });

  // Comida
  drawGlowCircle(food.x*GRID+GRID/2, food.y*GRID+GRID/2, GRID/2-3, COLORS.PINK, 20);

  // Moedas
  coins.forEach(c => {
    ctx.save();
    ctx.shadowColor = COLORS.GOLD;
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = COLORS.GOLD;
    ctx.font        = `${GRID-4}px serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText('🪙', c.x*GRID+GRID/2, c.y*GRID+GRID/2);
    ctx.restore();
  });

  // Power-up no mapa
  if (spawnedPow) {
    const pw = spawnedPow;
    const pcolor = POW_COLORS[pw.type];
    const pulseFactor = 0.85 + Math.sin(Date.now()*0.006)*0.15;

    ctx.save();
    ctx.shadowColor = pcolor;
    ctx.shadowBlur  = 18 * pulseFactor;
    ctx.globalAlpha = pulseFactor;
    ctx.font        = `${GRID-2}px serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(POW_ICONS[pw.type], pw.x*GRID+GRID/2, pw.y*GRID+GRID/2);
    ctx.restore();

    // Pede re-render para animação de pulso
    if (running && !paused) requestAnimationFrame(() => draw());
  }

  ctx.shadowBlur = 0;
}

function drawGlowCircle(x, y, r, color, glow) {
  ctx.fillStyle   = color;
  ctx.shadowColor = color;
  ctx.shadowBlur  = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ── GAME OVER ─────────────────────────────────────────────────────────
function gameOver() {
  running = false;
  clearTimeout(loopTimer);

  if (score > State.best) State.best = score;
  State.coins += sessionCoins;
  saveState();

  finalScoreEl.textContent = score;
  finalBestEl.textContent  = State.best;
  finalCoinsEl.textContent = '+' + sessionCoins;
  overlay.classList.remove('hidden');

  updateMenuStats();
}

// ── PAUSA ─────────────────────────────────────────────────────────────
function togglePause() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    overPause.classList.remove('hidden');
    clearTimeout(loopTimer);
  } else {
    overPause.classList.add('hidden');
    scheduleNext();
  }
}

// ── INPUT TECLADO ─────────────────────────────────────────────────────
const KEY_MAP = {
  ArrowUp:    {x:0,  y:-1},
  ArrowDown:  {x:0,  y:1 },
  ArrowLeft:  {x:-1, y:0 },
  ArrowRight: {x:1,  y:0 },
  w: {x:0,y:-1}, s: {x:0,y:1}, a: {x:-1,y:0}, d: {x:1,y:0},
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' || e.key === 'p') { togglePause(); return; }
  const d = KEY_MAP[e.key];
  if (!d || !running) return;
  if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
  e.preventDefault();
});

// ── DPAD ──────────────────────────────────────────────────────────────
function setDir(d) {
  if (!running || paused) return;
  if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
}
const DPAD_MAP = {
  'btn-up':    {x:0,y:-1},
  'btn-down':  {x:0,y:1},
  'btn-left':  {x:-1,y:0},
  'btn-right': {x:1,y:0},
};
Object.entries(DPAD_MAP).forEach(([id, d]) => {
  const btn = document.getElementById(id);
  btn.addEventListener('touchstart', e => { e.preventDefault(); setDir(d); }, {passive:false});
  btn.addEventListener('click', () => setDir(d));
});

// ── SWIPE ─────────────────────────────────────────────────────────────
let touchStart = null;
canvas.addEventListener('touchstart', e => {
  touchStart = {x: e.touches[0].clientX, y: e.touches[0].clientY};
}, {passive:true});
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? {x:1,y:0} : {x:-1,y:0});
  else setDir(dy > 0 ? {x:0,y:1} : {x:0,y:-1});
  touchStart = null;
}, {passive:true});

// ── BOTÕES UI ─────────────────────────────────────────────────────────
document.getElementById('btn-play').addEventListener('click', () => {
  showScreen('screen-game');
  initGame();
});
document.getElementById('btn-shop').addEventListener('click', () => {
  renderShop();
  showScreen('screen-shop');
});
document.getElementById('btn-back-shop').addEventListener('click', () => {
  showScreen('screen-menu');
  updateMenuStats();
});
document.getElementById('btn-restart').addEventListener('click', () => initGame());
document.getElementById('btn-menu').addEventListener('click', () => {
  running = false;
  clearTimeout(loopTimer);
  showScreen('screen-menu');
  updateMenuStats();
});
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-resume').addEventListener('click', togglePause);

// Seletor de dificuldade
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    State.diffSpeed = parseInt(btn.dataset.speed);
  });
});

// ── ATUALIZA MENU ─────────────────────────────────────────────────────
function updateMenuStats() {
  document.getElementById('menu-best').textContent  = State.best;
  document.getElementById('menu-coins').textContent = State.coins;
}

// ── RESIZE ────────────────────────────────────────────────────────────
window.addEventListener('resize', () => { resizeCanvas(); draw(); });

// ── SERVICE WORKER ────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

// ── BOOT ──────────────────────────────────────────────────────────────
loadState();
updateMenuStats();
showScreen('screen-menu');
