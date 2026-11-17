// Starfall Harvest — sound. Every effect is synthesized with WebAudio, so
// the game ships no audio files and makes no network request.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.16, slideTo = null, delay = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    catchStar(combo) {
      const base = 520 + Math.min(combo, 5) * 60;
      tone(base, 0.12, 'sine', 0.16, base * 1.5);
    },
    catchGolden() {
      tone(660, 0.1, 'triangle', 0.18);
      tone(880, 0.1, 'triangle', 0.18, null, 0.08);
      tone(1320, 0.16, 'triangle', 0.16, null, 0.16);
    },
    catchHeart() {
      tone(523, 0.14, 'sine', 0.16, 784);
      tone(784, 0.2, 'sine', 0.14, null, 0.12);
    },
    hitMeteor() {
      tone(180, 0.3, 'sawtooth', 0.2, 55);
      tone(90, 0.35, 'square', 0.12, 40, 0.02);
    },
    levelUp() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.15, null, i * 0.07));
    },
    win() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'triangle', 0.16, null, i * 0.1));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'sine', 0.15, null, i * 0.13));
    },
    click() { tone(700, 0.06, 'sine', 0.1); },
  };
}
