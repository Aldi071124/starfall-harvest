// Starfall Harvest — input. Keyboard (arrows / A-D to move, Enter or Space
// to start, R to restart, M to mute) and mouse (move the basket, click to
// start or restart). One object, read once per frame by the world.
export function createInput(canvas) {
  const keys = new Set();
  let mouseX = null;
  let clicked = false;
  let pressed = new Set();

  function keyName(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') return 'left';
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') return 'right';
    if (e.key === 'Enter' || e.key === ' ') return 'confirm';
    if (e.key === 'r' || e.key === 'R') return 'restart';
    if (e.key === 'm' || e.key === 'M') return 'mute';
    return null;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (!k) return;
    if (['left', 'right', 'confirm'].includes(k)) e.preventDefault();
    if (!e.repeat) pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => {
    const k = keyName(e);
    if (k) keys.delete(k);
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
  });
  canvas.addEventListener('mousedown', () => { clicked = true; });
  canvas.addEventListener('touchmove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.touches[0].clientX - r.left) / r.width) * canvas.width;
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchstart', () => { clicked = true; }, { passive: true });

  return {
    get left() { return keys.has('left'); },
    get right() { return keys.has('right'); },
    get mouseX() { return mouseX; },
    consumeClick() { const c = clicked; clicked = false; return c; },
    consumePress(name) {
      const hit = pressed.has(name);
      if (hit) pressed.delete(name);
      return hit;
    },
    endFrame() { pressed.clear(); },
  };
}
