// lasers.js — timed laser grids and pulsing tripwires.
// Both are fair hazards: they telegraph their rhythm, so crossing them
// is a timing puzzle, not a lottery. Lasers blink on and off on a fixed
// cycle; tripwires pulse bright and dim, and are safe to cross while dim.

import { LASER, TRIPWIRE, TILE } from './config.js';

export class LaserGrid {
  constructor(def) {
    this.row = def.row;
    this.fromX = def.fromX;
    this.toX = def.toX;
    this.cycle = LASER.cycleSeconds;
    this.onFraction = LASER.onFraction;
    this.time = Math.random() * this.cycle;
    this.tripped = false; // true the frame the beam catches someone
  }

  get on() {
    return (this.time % this.cycle) < this.cycle * this.onFraction;
  }

  get y() {
    return (this.row + 0.5) * TILE;
  }

  get x0() {
    return this.fromX * TILE;
  }

  get x1() {
    return (this.toX + 1) * TILE;
  }

  // True while the beam is live and the thief's feet cross its line.
  update(dt, thief) {
    this.time += dt;
    this.tripped = false;
    if (!this.on) return false;
    const crosses = thief.y > this.y - 6 && thief.y < this.y + 6
      && thief.x > this.x0 && thief.x < this.x1;
    if (crosses) {
      this.tripped = true;
      return true;
    }
    return false;
  }
}

export class Tripwire {
  constructor(def) {
    const [tx, ty] = def.at;
    this.x = (tx + 0.5) * TILE;
    this.y = (ty + 0.5) * TILE;
    this.tx = tx;
    this.ty = ty;
    this.pulse = TRIPWIRE.pulseSeconds;
    this.safeFraction = TRIPWIRE.safeFraction;
    this.time = Math.random() * this.pulse;
    this.tripped = false;
  }

  // The wire is safe to step over while its light is dim.
  get safe() {
    return (this.time % this.pulse) > this.pulse * this.safeFraction;
  }

  update(dt, thief) {
    this.time += dt;
    this.tripped = false;
    if (this.safe) return false;
    const near = Math.hypot(thief.x - this.x, thief.y - this.y) < 18;
    // Sneaking over a live wire is careful enough to pass unharmed.
    if (near && !thief.sneaking) {
      this.tripped = true;
      return true;
    }
    return false;
  }
}
