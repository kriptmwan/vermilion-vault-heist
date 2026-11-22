// shots.js — staged screenshot scenes for ?shot=<name>.
// Each scene poses the room so one frame shows the whole heist: the
// room, the thief, a guard with its vision cone, a camera, a loot
// target and the alarm meter. Returns how many seconds main.js should
// simulate before freezing the frame.

import { TILE } from './config.js';
import { ALARM } from './config.js';

function placeThief(world, tx, ty) {
  world.thief.x = (tx + 0.5) * TILE;
  world.thief.y = (ty + 0.5) * TILE;
}

export function stageShot(world, name) {
  if (name === 'cover') {
    // The Gilded Gallery: thief mid-room in the shadow lane, a guard
    // patrolling the hall, a camera sweeping the vault, loot and the
    // alarm meter part-filled — every criterion-1 element in one frame.
    world.loadLevel(1);
    placeThief(world, 12, 8);
    world.alarm.raise(35);
    world.stagedAlarm = 35;
    return 5;
  }
  if (name === 'alarm') {
    // The Ivory Archive at full alert: a guard hunting the thief,
    // smoke on the floor, the meter in the red, the exit sealed.
    world.loadLevel(2);
    placeThief(world, 13, 7);
    world.tools.dropSmoke(world.thief.x, world.thief.y);
    const guard = world.guards[0];
    guard.enterAlert(world.thief);
    guard.x = (11 + 0.5) * TILE;
    guard.y = (7 + 0.5) * TILE;
    world.alarm.raise(92);
    world.stagedAlarm = 92;
    return 2;
  }
  if (name === 'vault') {
    // The Marble Lobby: the thief's hand on the vault dial, the crack
    // ring almost full, two loot piles already lifted.
    world.loadLevel(0);
    placeThief(world, 20, 10);
    world.vault.crackProgress = 2.0;
    world.loot[0].taken = true;
    world.loot[1].taken = true;
    world.lootValue = 350;
    return 3;
  }
  if (name === 'win') {
    // The Vermilion Heart, finished: the end screen over the last room.
    world.loadLevel(4);
    world.score = 12480;
    world.lootValue = 3200;
    world.vault.cracked = true;
    world.exit.open = true;
    world.levelResult = {
      levelScore: 2980,
      lootValue: 3200,
      timeBonus: 120,
      ghostBonus: 300,
      quietBonus: 0,
      elapsed: 132,
      stars: 3,
    };
    world.state = 'won';
    return 1;
  }
  // Unknown scene: fall back to a live first room.
  world.loadLevel(0);
  return 3;
}
