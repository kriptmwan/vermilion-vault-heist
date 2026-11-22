// main.js — the game loop and the screens around it.
// Delta-time requestAnimationFrame loop, clamped so a slow frame never
// teleports the thief. Screens: title, playing, level complete, caught,
// won. Staged screenshots (?shot=...) pose the room, run it a few
// seconds, then freeze and raise window.__shotReady for the capture.

import { World } from './world.js';
import { Renderer, computeView, screenToWorld } from './render.js';
import { Input } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const world = new World();

let screen = 'title'; // title | playing | levelComplete | caught | won
let plan = false; // hold TAB to study the three routes
let lastTime = 0;
let shotFrozen = false;

function setScreen(next) {
  screen = next;
  const messages = {
    title: 'The Vermilion Vault. Press Enter to begin the heist.',
    playing: `Room ${world.levelIndex + 1}: ${world.level.name}. Crack the vault, then reach the exit.`,
    levelComplete: 'Clean getaway. Press Enter for the next room.',
    caught: 'Caught. Press R to try the room again.',
    won: 'The Vermilion Star is yours. Press Enter to run the heist again.',
  };
  statusEl.textContent = messages[next] ?? '';
}

input.onFirstGesture = () => world.audio.ensure();

function resize() {
  renderer.resize();
}
window.addEventListener('resize', resize);
resize();

// Staged screenshot mode: pose the room, let it run a few seconds so
// the patrols and cameras are mid-sweep, then freeze and signal ready.
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  const seconds = stageShot(world, shotName);
  // The win scene poses world.state = 'won'; the overlay is drawn from
  // the screen, so the screen must follow the posed state.
  screen = world.state === 'won' ? 'won' : 'playing';
  setScreen(screen);
  // Simulate the room with no input so the frame is alive, not posed.
  const step = 1 / 60;
  for (let t = 0; t < seconds; t += step) {
    world.update(step, input);
    input.endFrame();
  }
  // The alarm decays while the scene runs; re-apply the staged level
  // so the meter reads as posed (cover 35%, alarm 92%).
  if (world.stagedAlarm != null) world.alarm.value = world.stagedAlarm;
  shotFrozen = true;
  window.__shotReady = true;
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000 || 0, 0.05);
  lastTime = now;
  renderer.time += dt;

  const view = computeView(canvas);
  input.mouseWorld = screenToWorld(view, input.mouse.x, input.mouse.y);

  if (shotName && shotFrozen) {
    // Frozen frame: render only, the world does not advance.
    renderer.draw(world, screen, false, input);
    requestAnimationFrame(frame);
    return;
  }

  if (input.wasPressed('tab')) {
    plan = true;
  }
  if (!input.keys.has('tab')) plan = false;

  if (screen === 'title') {
    if (input.wasPressed('enter') || input.mouse.clicked) {
      world.loadLevel(0);
      setScreen('playing');
      world.audio.ensure();
      world.audio.click();
    }
  } else if (screen === 'playing') {
    world.update(dt, input);
    if (world.state === 'levelComplete') setScreen('levelComplete');
    else if (world.state === 'caught') setScreen('caught');
    else if (world.state === 'won') setScreen('won');
  } else if (screen === 'levelComplete') {
    if (input.wasPressed('enter')) {
      world.nextLevel();
      setScreen('playing');
    }
  } else if (screen === 'caught') {
    if (input.wasPressed('r') || input.wasPressed('enter')) {
      world.loadLevel(world.levelIndex);
      setScreen('playing');
    }
  } else if (screen === 'won') {
    if (input.wasPressed('enter')) {
      world.score = 0;
      world.loadLevel(0);
      setScreen('playing');
    }
  }

  renderer.draw(world, screen, plan && screen === 'playing', input);
  input.endFrame();
  requestAnimationFrame(frame);
}

// The title screen shows the first room behind it, dimmed — unless a
// staged screenshot was asked for, which already posed its own room.
if (!shotName) {
  world.loadLevel(0);
  setScreen('title');
}
requestAnimationFrame(frame);
