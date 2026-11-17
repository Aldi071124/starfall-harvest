// Starfall Harvest — render. Every pixel the player sees, drawn on one
// canvas: the night sky, the basket, the falling things, the particles and
// the HUD, plus the title, win and game-over screens.
import { CONFIG, PALETTE } from './config.js';

function drawStarShape(ctx, x, y, r, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMeteor(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = PALETTE.meteor;
  ctx.shadowColor = PALETTE.meteor;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.8, r * 0.4);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.8, r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd2d2';
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 16, s / 16);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 5);
  ctx.fill();
  ctx.restore();
}

function drawBasket(ctx, x, groundY, w, h, tilt) {
  ctx.save();
  ctx.translate(x, groundY - h / 2);
  ctx.rotate(tilt);
  // Rim
  ctx.fillStyle = PALETTE.basketDark;
  ctx.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, 10);
  // Body
  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, PALETTE.basket);
  grad.addColorStop(1, PALETTE.basketDark);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + 6);
  ctx.lineTo(w / 2, -h / 2 + 6);
  ctx.lineTo(w / 2 - 10, h / 2);
  ctx.lineTo(-w / 2 + 10, h / 2);
  ctx.closePath();
  ctx.fill();
  // Weave lines
  ctx.strokeStyle = 'rgba(60,30,10,0.55)';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 6, i * 8);
    ctx.lineTo(w / 2 - 6, i * 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackground(ctx, width, height, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.55, PALETTE.skyMid);
  grad.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  // Twinkling background stars (fixed pseudo-random field).
  for (let i = 0; i < 90; i++) {
    const sx = (i * 173.3) % width;
    const sy = (i * 97.7) % (height * 0.62);
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.9 + i));
    ctx.fillStyle = `rgba(255,255,255,${0.25 + tw * 0.55})`;
    ctx.fillRect(sx, sy, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
  }
  // Moon
  ctx.save();
  ctx.fillStyle = '#f7f3d8';
  ctx.shadowColor = '#f7f3d8';
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(width - 110, 84, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(200,190,150,0.5)';
  ctx.beginPath();
  ctx.arc(width - 124, 74, 9, 0, Math.PI * 2);
  ctx.arc(width - 96, 96, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Rolling hills
  ctx.fillStyle = '#1a1440';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.78);
  ctx.quadraticCurveTo(width * 0.3, height * 0.68, width * 0.6, height * 0.78);
  ctx.quadraticCurveTo(width * 0.85, height * 0.86, width, height * 0.8);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  // Ground
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, CONFIG.groundY, width, height - CONFIG.groundY);
  ctx.fillStyle = 'rgba(126,240,193,0.25)';
  ctx.fillRect(0, CONFIG.groundY, width, 3);
}

function drawHud(ctx, s) {
  ctx.save();
  ctx.textBaseline = 'top';
  // Score
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${s.score}`, 18, 14);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText(`TARGET ${CONFIG.targetScore}`, 18, 50);
  // Level + combo, centered
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.accent;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(`LEVEL ${s.level}`, CONFIG.width / 2, 16);
  if (s.multiplier > 1) {
    ctx.fillStyle = '#ffb52e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`COMBO x${s.multiplier}`, CONFIG.width / 2, 44);
  }
  // Lives, right
  ctx.textAlign = 'right';
  for (let i = 0; i < CONFIG.maxLives; i++) {
    const x = CONFIG.width - 24 - i * 34;
    if (i < s.lives) drawHeart(ctx, x, 30, 13, PALETTE.heart);
    else {
      ctx.save();
      ctx.globalAlpha = 0.25;
      drawHeart(ctx, x, 30, 13, '#8a86a8');
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawMessage(ctx, s) {
  if (!s.message || s.messageTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, s.messageTimer);
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillStyle = s.message.color;
  ctx.shadowColor = s.message.color;
  ctx.shadowBlur = 16;
  ctx.fillText(s.message.text, CONFIG.width / 2, 150);
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,10,36,0.78)';
  ctx.strokeStyle = 'rgba(126,240,193,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTitle(ctx, s) {
  panel(ctx, 180, 70, 600, 360);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.star;
  ctx.shadowColor = PALETTE.star;
  ctx.shadowBlur = 22;
  ctx.font = 'bold 58px system-ui, sans-serif';
  ctx.fillText('STARFALL', CONFIG.width / 2, 132);
  ctx.fillStyle = PALETTE.accent;
  ctx.shadowColor = PALETTE.accent;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('HARVEST', CONFIG.width / 2, 192);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.text;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Catch the falling stars. Dodge the meteors.', CONFIG.width / 2, 252);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Move: mouse or ← → / A D    •    Golden stars are worth 25', CONFIG.width / 2, 282);
  ctx.fillText('Reach 500 points to win. You have 3 lives.', CONFIG.width / 2, 306);
  ctx.fillStyle = PALETTE.accent;
  ctx.font = 'bold 22px system-ui, sans-serif';
  const pulse = 0.7 + 0.3 * Math.sin(s.time * 4);
  ctx.globalAlpha = pulse;
  ctx.fillText('▶  CLICK OR PRESS ENTER TO PLAY', CONFIG.width / 2, 356);
  ctx.restore();
}

function drawEnd(ctx, s, won) {
  panel(ctx, 210, 80, 540, 330);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? PALETTE.accent : PALETTE.meteor;
  ctx.shadowColor = won ? PALETTE.accent : PALETTE.meteor;
  ctx.shadowBlur = 20;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText(won ? 'YOU WIN!' : 'GAME OVER', CONFIG.width / 2, 150);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.text;
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(`Score: ${s.score}   •   Best combo: x${Math.min(s.bestCombo, 99)}`, CONFIG.width / 2, 222);
  ctx.fillText(`Stars caught: ${s.caught}   •   Level reached: ${s.level}`, CONFIG.width / 2, 258);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(won ? 'The harvest is complete. The sky is yours!' : 'The meteors won this round. Try again!', CONFIG.width / 2, 296);
  ctx.fillStyle = PALETTE.accent;
  ctx.font = 'bold 21px system-ui, sans-serif';
  const pulse = 0.7 + 0.3 * Math.sin(s.time * 4);
  ctx.globalAlpha = pulse;
  ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', CONFIG.width / 2, 344);
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let tilt = 0;
  let lastX = CONFIG.width / 2;

  function render(s, dt) {
    tilt += ((s.basketX - lastX) * 0.002 - tilt) * Math.min(1, dt * 10);
    lastX = s.basketX;
    drawBackground(ctx, CONFIG.width, CONFIG.height, s.time);
    // Falling items
    for (const it of s.items) {
      if (it.kind === 'star') drawStarShape(ctx, it.x, it.y, it.size, it.rot, PALETTE.star);
      else if (it.kind === 'golden') drawStarShape(ctx, it.x, it.y, it.size, it.rot, PALETTE.golden);
      else if (it.kind === 'meteor') drawMeteor(ctx, it.x, it.y, it.size, it.rot);
      else drawHeart(ctx, it.x, it.y, it.size, PALETTE.heart);
    }
    // Particles
    for (const p of s.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
    // Basket (hidden on title screen until play starts)
    if (s.phase !== 'title') {
      drawBasket(ctx, s.basketX, CONFIG.groundY, CONFIG.basket.width, CONFIG.basket.height, tilt);
    }
    drawHud(ctx, s);
    drawMessage(ctx, s);
    if (s.phase === 'title') drawTitle(ctx, s);
    if (s.phase === 'win') drawEnd(ctx, s, true);
    if (s.phase === 'lose') drawEnd(ctx, s, false);
  }

  return { render };
}
