// cameras.js — sweeping security cameras.
// A camera sits on a wall mount and swings its lens back and forth.
// Its cone is narrower than a guard's but it never blinks: stand in it
// and the alarm climbs. An EMP burst freezes it for a while.

import { CAMERA, TILE } from './config.js';
import { canSee, conePolygon } from './vision.js';

export class Camera {
  constructor(def, blocked) {
    this.blocked = blocked;
    const [tx, ty] = def.at;
    this.x = (tx + 0.5) * TILE;
    this.y = (ty + 0.5) * TILE;
    this.baseFacing = def.facing;
    this.sweep = def.sweep ?? 0.9; // radians either way
    this.period = CAMERA.sweepSeconds;
    this.phase = Math.random() * Math.PI * 2;
    this.facing = this.baseFacing;
    this.disabledLeft = 0; // EMP countdown
    this.seeLeft = 0; // how long the thief has been in frame
  }

  update(dt, thief, world) {
    if (this.disabledLeft > 0) {
      this.disabledLeft -= dt;
      return 0;
    }
    this.phase += (Math.PI * 2 * dt) / this.period;
    this.facing = this.baseFacing + Math.sin(this.phase) * this.sweep;
    const seen = canSee(
      this.blocked, this.x, this.y, this.facing,
      CAMERA.viewHalfAngle, CAMERA.viewDistance, thief.x, thief.y,
    );
    if (seen && !thief.smoked) {
      this.seeLeft += dt;
      // Fairness: the camera needs a beat to lock on before the alarm
      // climbs, so a quick dash across its arc costs almost nothing.
      if (this.seeLeft < 0.7) return 0;
      // The alarm climbs while the camera holds you in frame.
      return CAMERA.detectPerSecond * dt * 100;
    }
    this.seeLeft = Math.max(0, this.seeLeft - dt);
    return 0;
  }

  disable(seconds) {
    this.disabledLeft = Math.max(this.disabledLeft, seconds);
  }

  cone() {
    if (this.disabledLeft > 0) return null;
    return conePolygon(
      this.blocked, this.x, this.y, this.facing,
      CAMERA.viewHalfAngle, CAMERA.viewDistance,
    );
  }
}
