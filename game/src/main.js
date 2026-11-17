// Starfall Harvest — main loop and state machine. Owns the canvas, the
// clock and the transitions between title, playing, win and lose. The
// `?shot=` query renders one staged scene for screenshots: it is the same
// game code drawing the same state, only entered without playing.
import { CONFIG, SHOT_PARAM } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createWorld } from './world.js';
import { createRenderer } from './render.js';

const canvas = document.getElementById('game');
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;

const audio = createAudio();
const input = createInput(canvas);
const world = createWorld(audio);
const renderer = createRenderer(canvas);
const state = world.state;

const params = new URLSearchParams(window.location.search);
const shot = params.get(SHOT_PARAM);
if (shot === 'start' || shot === 'play' || shot === 'win' || shot === 'lose') {
  world.stageScene(shot);
  renderer.render(state, 0);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.time += dt;

    if (input.consumePress('mute')) audio.toggleMute();
    if (state.phase === 'title') {
      if (input.consumePress('confirm') || input.consumeClick()) {
        audio.click();
        world.start();
      }
    } else if (state.phase === 'playing') {
      world.update(dt, input);
    } else if (input.consumePress('restart') || input.consumePress('confirm') || input.consumeClick()) {
      audio.click();
      world.start();
    }
    input.endFrame();
    renderer.render(state, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
