// guards.js — the guard finite state machine.
//   PATROL  — walk the waypoints, pausing at each, cone sweeping.
//   SUSPICIOUS — something caught the eye: stare at it, then walk over.
//   INSPECT — reached the spot, look around, then give up and go back.
//   ALERT — the thief is seen: shout, chase, and raise the alarm.
//   SEARCH — lost the thief: sweep the last seen spot, then return.
// The machine never decides the alarm on its own; it reports what it
// sees and the world turns that into suspicion and alarm.

import { GUARD, PLAYER, TILE } from './config.js';
import { canSee, conePolygon } from './vision.js';
import { findPath, createPathWalker } from './astar.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  INSPECT: 'inspect',
  ALERT: 'alert',
  SEARCH: 'search',
  RETURN: 'return',
};

export class Guard {
  constructor(def, walkable, blocked, width, height) {
    this.walkable = walkable;
    this.blocked = blocked;
    this.width = width;
    this.height = height;
    this.waypoints = def.waypoints;
    this.pauseSeconds = def.pause ?? 1;
    const [sx, sy] = def.waypoints[0];
    this.x = (sx + 0.5) * TILE;
    this.y = (sy + 0.5) * TILE;
    this.facing = 0;
    this.state = GUARD_STATE.PATROL;
    this.waypointIndex = 1 % def.waypoints.length;
    this.pauseLeft = 0;
    this.suspicion = 0; // 0..1, fills while the thief is in the cone
    this.stareLeft = 0;
    this.searchLeft = 0;
    this.warnLeft = 0; // fair-caught grace: shout first, catch later
    this.lastSeen = null; // {x, y} in pixels
    this.walker = createPathWalker(TILE);
    this.walker.setPath(null, this.x, this.y);
    this.heard = null; // a noise the guard is walking toward
    this.patrolPath = null;
    this.startPatrolLeg();
  }

  tile() {
    return [Math.floor(this.x / TILE), Math.floor(this.y / TILE)];
  }

  startPatrolLeg() {
    const [tx, ty] = this.waypoints[this.waypointIndex];
    const [sx, sy] = this.tile();
    const path = findPath(this.walkable, this.width, this.height, sx, sy, tx, ty);
    if (path) {
      this.patrolPath = path;
      this.walker.setPath(path, this.x, this.y);
      this.walker.index = 1;
    } else {
      this.patrolPath = null;
    }
  }

  // The thief's position, sneak/shadow state and the world's hearing.
  // Returns events the world should act on: { saw, lost, caught }.
  update(dt, thief, world) {
    const events = { saw: false, lost: false, caught: false };
    // Smoke blinds the cone entirely: a thief inside a smoke cloud
    // cannot be seen at all, and the guard loses the trail.
    const seen = !thief.smoked && canSee(
      this.blocked, this.x, this.y, this.facing,
      GUARD.viewHalfAngle, GUARD.viewDistance, thief.x, thief.y,
    );
    // Suspicion fills faster up close and slower when the thief sneaks
    // or hides in shadow; it drains when the thief is out of sight.
    if (seen) {
      let rate = PLAYER.detectPerSecond;
      const dist = Math.hypot(thief.x - this.x, thief.y - this.y);
      rate *= 1.5 - (dist / GUARD.viewDistance) * 0.9; // near = faster
      if (thief.sneaking) rate *= PLAYER.sneakDetectFactor;
      if (thief.inShadow) rate *= PLAYER.shadowDetectFactor;
      if (thief.smoked) rate = 0; // smoke blinds the cone entirely
      this.suspicion = Math.min(1, this.suspicion + rate * dt);
      if (this.suspicion >= 1 && this.state !== GUARD_STATE.ALERT) {
        this.enterAlert(thief);
      }
      this.lastSeen = { x: thief.x, y: thief.y };
    } else if (this.state !== GUARD_STATE.ALERT) {
      this.suspicion = Math.max(0, this.suspicion - 0.25 * dt);
    }

    switch (this.state) {
      case GUARD_STATE.PATROL:
        this.updatePatrol(dt, world);
        if (this.suspicion >= 0.55) this.enterSuspicious(thief);
        break;
      case GUARD_STATE.SUSPICIOUS:
        this.faceToward(thief.x, thief.y, dt);
        this.stareLeft -= dt;
        if (this.stareLeft <= 0) {
          this.state = GUARD_STATE.INSPECT;
          this.walkTo(thief.x, thief.y, GUARD.inspectSpeed);
        }
        break;
      case GUARD_STATE.INSPECT:
        if (!this.walkStep(dt, GUARD.inspectSpeed)) {
          this.state = GUARD_STATE.SEARCH;
          this.searchLeft = GUARD.searchSeconds * 0.5;
        }
        break;
      case GUARD_STATE.ALERT:
        if (seen) {
          this.lastSeen = { x: thief.x, y: thief.y };
          // Chase: re-plan only when the thief moved to a new tile,
          // then take the step — re-planning without stepping is standing still.
          const ttx = Math.floor(thief.x / TILE);
          const tty = Math.floor(thief.y / TILE);
          if (!this.chaseTarget || this.chaseTarget[0] !== ttx || this.chaseTarget[1] !== tty) {
            this.chaseTarget = [ttx, tty];
            this.walkTo(thief.x, thief.y, GUARD.chaseSpeed);
          }
          this.walkStep(dt, GUARD.chaseSpeed);
          this.faceToward(thief.x, thief.y, dt);
          if (this.warnLeft > 0) {
            this.warnLeft -= dt;
          } else if (Math.hypot(thief.x - this.x, thief.y - this.y) < 26) {
            events.caught = true; // caught, after the warning delay
          }
        } else {
          this.state = GUARD_STATE.SEARCH;
          this.searchLeft = GUARD.searchSeconds;
        }
        break;
      case GUARD_STATE.SEARCH:
        this.searchLeft -= dt;
        if (this.lastSeen) {
          if (!this.walkStep(dt, GUARD.inspectSpeed)) {
            this.faceSweep(dt);
          }
        }
        if (this.searchLeft <= 0) {
          this.state = GUARD_STATE.RETURN;
          const [sx, sy] = this.tile();
          let best = null;
          let bestDist = Infinity;
          this.waypoints.forEach(([wx, wy], i) => {
            const d = Math.abs(wx - sx) + Math.abs(wy - sy);
            if (d < bestDist) {
              bestDist = d;
              best = i;
            }
          });
          this.waypointIndex = best;
          this.startPatrolLeg();
        }
        break;
      case GUARD_STATE.RETURN:
        if (!this.walkStep(dt, GUARD.patrolSpeed)) {
          this.state = GUARD_STATE.PATROL;
          this.suspicion = 0;
        }
        break;
      default:
        break;
    }

    // A noise (a thrown coin, a sprint) pulls a patrolling guard over.
    if (this.heard && this.state === GUARD_STATE.PATROL) {
      this.state = GUARD_STATE.INSPECT;
      this.walkTo(this.heard.x, this.heard.y, GUARD.inspectSpeed);
      this.heard = null;
    }
    if (this.heard) this.heard = null;
    return events;
  }

  enterSuspicious(thief) {
    this.state = GUARD_STATE.SUSPICIOUS;
    this.stareLeft = GUARD.suspiciousSeconds;
    this.faceToward(thief.x, thief.y, 10); // snap to face the glimpse
  }

  enterAlert(thief) {
    this.state = GUARD_STATE.ALERT;
    this.warnLeft = GUARD.warnSeconds; // shout first: the catch is fair
    this.lastSeen = { x: thief.x, y: thief.y };
  }

  // Called by the world when the alarm stage rises: every guard on the
  // floor converges on the thief's last seen spot.
  convergeOn(x, y) {
    if (this.state === GUARD_STATE.ALERT) return;
    this.lastSeen = { x, y };
    this.state = GUARD_STATE.SEARCH;
    this.searchLeft = GUARD.searchSeconds;
    this.walkTo(x, y, GUARD.inspectSpeed);
  }

  hear(x, y) {
    const dist = Math.hypot(x - this.x, y - this.y);
    if (dist < GUARD.hearRadius) this.heard = { x, y };
  }

  walkTo(px, py, speed) {
    const [sx, sy] = this.tile();
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    const path = findPath(this.walkable, this.width, this.height, sx, sy, tx, ty);
    if (path) {
      this.walker.setPath(path, this.x, this.y);
      this.walker.index = 1;
      this.walkSpeed = speed;
    }
  }

  walkStep(dt, speed) {
    const moving = this.walker.step(dt, speed);
    // The walker owns the feet: copy its position back onto the guard.
    this.x = this.walker.x;
    this.y = this.walker.y;
    if (moving) {
      const [tx, ty] = this.walker.path[this.walker.index] ?? this.walker.path[this.walker.path.length - 1];
      this.faceToward((tx + 0.5) * TILE, (ty + 0.5) * TILE, dt);
    }
    return moving;
  }

  updatePatrol(dt, world) {
    if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      this.faceSweep(dt);
      return;
    }
    if (!this.walkStep(dt, GUARD.patrolSpeed)) {
      this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
      this.pauseLeft = this.pauseSeconds;
      this.startPatrolLeg();
    }
  }

  faceToward(px, py, dt) {
    const target = Math.atan2(py - this.y, px - this.x);
    let diff = target - this.facing;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const turn = Math.min(Math.abs(diff), 6 * dt);
    this.facing += Math.sign(diff) * turn;
  }

  faceSweep(dt) {
    this.facing += 0.6 * dt; // idle guards glance around while they wait
  }

  cone() {
    return conePolygon(
      this.blocked, this.x, this.y, this.facing,
      GUARD.viewHalfAngle, GUARD.viewDistance,
    );
  }
}
