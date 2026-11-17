// Starfall Harvest — world. Everything that falls, the basket, the score,
// the combo, the levels and the win/lose rules. No drawing here: render.js
// reads this state and paints it.
import { CONFIG } from './config.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(audio) {
  const state = {
    phase: 'title', // title | playing | win | lose
    score: 0,
    lives: CONFIG.startLives,
    level: 1,
    combo: 0,
    comboTimer: 0,
    multiplier: 1,
    bestCombo: 0,
    caught: 0,
    missed: 0,
    time: 0,
    spawnTimer: 0.6,
    basketX: CONFIG.width / 2,
    items: [],
    particles: [],
    flashes: [],
    message: null,
    messageTimer: 0,
    rng: Math.random,
  };

  function level() {
    return 1 + Math.floor(state.score / CONFIG.levelEvery);
  }

  function spawnItem() {
    const r = state.rng();
    let kind = 'star';
    if (r < CONFIG.odds.golden) kind = 'golden';
    else if (r < CONFIG.odds.golden + CONFIG.odds.heart) kind = 'heart';
    else if (r < CONFIG.odds.golden + CONFIG.odds.heart + CONFIG.odds.meteor) kind = 'meteor';
    const speed = Math.min(
      CONFIG.fall.baseSpeed + (state.level - 1) * CONFIG.fall.speedPerLevel + state.rng() * 60,
      CONFIG.fall.maxSpeed,
    );
    state.items.push({
      kind,
      x: 30 + state.rng() * (CONFIG.width - 60),
      y: -24,
      vy: speed,
      sway: state.rng() * Math.PI * 2,
      swaySpeed: 1 + state.rng() * 2,
      rot: state.rng() * Math.PI * 2,
      rotSpeed: (state.rng() - 0.5) * 2,
      size: kind === 'golden' ? 20 : kind === 'meteor' ? 18 : 16,
    });
  }

  function burst(x, y, color, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = state.rng() * Math.PI * 2;
      const s = 40 + state.rng() * 140;
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.5 + state.rng() * 0.4, max: 0.9, color, size: 2 + state.rng() * 3 });
    }
  }

  function flash(text, color) {
    state.message = { text, color };
    state.messageTimer = 1.1;
  }

  function start() {
    state.phase = 'playing';
    state.score = 0;
    state.lives = CONFIG.startLives;
    state.level = 1;
    state.combo = 0;
    state.multiplier = 1;
    state.bestCombo = 0;
    state.caught = 0;
    state.missed = 0;
    state.time = 0;
    state.spawnTimer = 0.6;
    state.basketX = CONFIG.width / 2;
    state.items = [];
    state.particles = [];
    state.flashes = [];
    state.message = null;
    state.rng = Math.random;
    audio.unlock();
  }

  function catchItem(item) {
    state.caught++;
    if (item.kind === 'star' || item.kind === 'golden') {
      state.combo++;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.comboTimer = CONFIG.combo.window;
      state.multiplier = Math.min(1 + Math.floor(state.combo / 4), CONFIG.combo.maxMultiplier);
      const base = item.kind === 'golden' ? CONFIG.points.golden : CONFIG.points.star;
      state.score += base * state.multiplier;
      burst(item.x, item.y, item.kind === 'golden' ? '#ffb52e' : '#ffd94d');
      if (item.kind === 'golden') { audio.catchGolden(); flash(`GOLDEN +${base * state.multiplier}`, '#ffb52e'); }
      else audio.catchStar(state.combo);
    } else if (item.kind === 'heart') {
      if (state.lives < CONFIG.maxLives) state.lives++;
      burst(item.x, item.y, '#ff6b9d');
      audio.catchHeart();
      flash('+1 LIFE', '#ff6b9d');
    } else if (item.kind === 'meteor') {
      state.lives--;
      state.combo = 0;
      state.multiplier = 1;
      burst(item.x, item.y, '#ff5a5a', 22);
      audio.hitMeteor();
      flash('OUCH! -1 LIFE', '#ff5a5a');
      if (state.lives <= 0) { endGame(false); return; }
    }
    const newLevel = level();
    if (newLevel > state.level) {
      state.level = newLevel;
      audio.levelUp();
      flash(`LEVEL ${newLevel} — FASTER!`, '#7ef0c1');
    }
    if (state.score >= CONFIG.targetScore) endGame(true);
  }

  function endGame(won) {
    state.phase = won ? 'win' : 'lose';
    state.items = [];
    if (won) audio.win(); else audio.lose();
  }

  function update(dt, input) {
    if (state.phase !== 'playing') return;
    state.time += dt;

    // Basket movement: mouse leads, keyboard nudges.
    if (input.mouseX !== null) {
      const target = Math.max(CONFIG.basket.width / 2, Math.min(CONFIG.width - CONFIG.basket.width / 2, input.mouseX));
      state.basketX += (target - state.basketX) * Math.min(1, dt * 14);
    }
    if (input.left) state.basketX -= CONFIG.basket.speed * dt;
    if (input.right) state.basketX += CONFIG.basket.speed * dt;
    state.basketX = Math.max(CONFIG.basket.width / 2, Math.min(CONFIG.width - CONFIG.basket.width / 2, state.basketX));

    // Combo decay.
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) { state.combo = 0; state.multiplier = 1; }
    }
    if (state.messageTimer > 0) state.messageTimer -= dt;

    // Spawning.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnItem();
      const interval = Math.max(
        CONFIG.spawn.baseInterval - (state.level - 1) * CONFIG.spawn.rampPerLevel,
        CONFIG.spawn.minInterval,
      );
      state.spawnTimer = interval * (0.7 + state.rng() * 0.6);
    }

    // Falling items.
    const basketTop = CONFIG.groundY - CONFIG.basket.height;
    const half = CONFIG.basket.width / 2;
    for (let i = state.items.length - 1; i >= 0; i--) {
      const it = state.items[i];
      it.y += it.vy * dt;
      it.sway += it.swaySpeed * dt;
      it.x += Math.sin(it.sway) * 18 * dt;
      it.rot += it.rotSpeed * dt;
      const caught = it.y >= basketTop - 6 && it.y <= CONFIG.groundY + 6
        && Math.abs(it.x - state.basketX) <= half + it.size * 0.4;
      if (caught) {
        state.items.splice(i, 1);
        catchItem(it);
        if (state.phase !== 'playing') return;
        continue;
      }
      if (it.y > CONFIG.height + 30) {
        state.items.splice(i, 1);
        if (it.kind === 'star' || it.kind === 'golden') {
          state.missed++;
          state.combo = 0;
          state.multiplier = 1;
        }
      }
    }

    // Particles.
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }

  // Deterministic staged scene for screenshots: real game state, seeded.
  function stageScene(kind) {
    start();
    state.rng = mulberry32(kind === 'play' ? 1234 : kind === 'win' ? 777 : 42);
    if (kind === 'start') {
      state.phase = 'title';
      return;
    }
    if (kind === 'play') {
      state.score = 230;
      state.level = 3;
      state.lives = 3;
      state.combo = 6;
      state.multiplier = 2;
      state.bestCombo = 9;
      state.caught = 31;
      state.basketX = CONFIG.width * 0.42;
      const kinds = ['star', 'star', 'golden', 'meteor', 'star', 'heart', 'star', 'meteor'];
      kinds.forEach((k, i) => {
        state.items.push({
          kind: k, x: 90 + i * 105 + state.rng() * 30, y: 120 + (i % 4) * 85,
          vy: 180, sway: i, swaySpeed: 1.5, rot: i * 0.7, rotSpeed: 0.5,
          size: k === 'golden' ? 20 : k === 'meteor' ? 18 : 16,
        });
      });
      burst(420, 300, '#ffd94d', 10);
      state.message = { text: 'COMBO x2!', color: '#7ef0c1' };
      state.messageTimer = 1;
      return;
    }
    if (kind === 'win') {
      state.score = 500;
      state.phase = 'win';
      state.level = 6;
      state.lives = 2;
      state.bestCombo = 12;
      state.caught = 58;
      return;
    }
    // lose
    state.score = 180;
    state.lives = 0;
    state.level = 2;
    state.phase = 'lose';
    state.bestCombo = 7;
    state.caught = 24;
  }

  return { state, start, update, endGame, stageScene };
}
