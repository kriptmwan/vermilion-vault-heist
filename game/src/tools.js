// tools.js — the thief's kit. Every tool costs a charge, and charges
// are scarce, so each use is a decision, not a reflex.
//   Coin lure (1) — throw a coin; its clink pulls nearby guards over.
//   Smoke vial (2) — a cloud that blinds every cone around you.
//   EMP burst (3) — freezes every camera on the floor for a while.

import { TOOLS, CAMERA, TILE } from './config.js';

export class Toolbelt {
  constructor() {
    this.coin = TOOLS.coin.start;
    this.smoke = TOOLS.smoke.start;
    this.emp = TOOLS.emp.start;
    this.coins = []; // coins in flight / lying on the floor
    this.smokeClouds = []; // {x, y, left}
    this.smokeSeconds = 5;
  }

  get counts() {
    return { coin: this.coin, smoke: this.smoke, emp: this.emp };
  }

  throwCoin(fromX, fromY, toX, toY) {
    if (this.coin <= 0) return false;
    this.coin--;
    this.coins.push({ x: toX, y: toY, landed: false, age: 0 });
    return true;
  }

  dropSmoke(x, y) {
    if (this.smoke <= 0) return false;
    this.smoke--;
    this.smokeClouds.push({ x, y, left: this.smokeSeconds });
    return true;
  }

  fireEmp(cameras) {
    if (this.emp <= 0) return false;
    this.emp--;
    for (const camera of cameras) camera.disable(CAMERA.empDisableSeconds);
    return true;
  }

  // Coins land with a clink that every guard in earshot hears.
  // Smoke clouds fade; while one covers the thief, cones cannot see in.
  update(dt, world) {
    for (const coin of this.coins) {
      if (!coin.landed) {
        coin.landed = true;
        for (const guard of world.guards) guard.hear(coin.x, coin.y);
        world.audio.clink();
      }
      coin.age += dt;
    }
    this.coins = this.coins.filter((c) => c.age < 12);
    for (const cloud of this.smokeClouds) cloud.left -= dt;
    this.smokeClouds = this.smokeClouds.filter((c) => c.left > 0);
  }

  // Is the thief standing inside a smoke cloud right now?
  thiefSmoked(x, y) {
    return this.smokeClouds.some((c) => Math.hypot(x - c.x, y - c.y) < 64);
  }

  // Where the mouse says the coin should land: clamp it to the room.
  static clampTarget(x, y, width, height) {
    return {
      x: Math.max(TILE, Math.min(width * TILE - TILE, x)),
      y: Math.max(TILE, Math.min(height * TILE - TILE, y)),
    };
  }
}
