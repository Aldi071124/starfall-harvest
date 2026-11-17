// Starfall Harvest — tuning and palette. One place for every number the
// rest of the game reads, so balancing is editing this file, not the logic.
export const CONFIG = {
  width: 960,
  height: 540,
  groundY: 496,
  targetScore: 500,
  startLives: 3,
  maxLives: 5,
  basket: { width: 110, height: 34, speed: 520 },
  spawn: { baseInterval: 0.85, minInterval: 0.34, rampPerLevel: 0.06 },
  fall: { baseSpeed: 150, speedPerLevel: 26, maxSpeed: 430 },
  odds: { golden: 0.08, heart: 0.035, meteor: 0.22 },
  points: { star: 10, golden: 25 },
  combo: { window: 4.0, maxMultiplier: 5 },
  levelEvery: 100,
};

export const PALETTE = {
  skyTop: '#0b1030',
  skyMid: '#1b2a5e',
  skyBottom: '#3b2a6b',
  ground: '#241a3d',
  star: '#ffd94d',
  golden: '#ffb52e',
  meteor: '#ff5a5a',
  heart: '#ff6b9d',
  basket: '#c98a4b',
  basketDark: '#8a5a2b',
  text: '#f5f0ff',
  dim: '#b9b3d9',
  accent: '#7ef0c1',
};

export const SHOT_PARAM = 'shot';
