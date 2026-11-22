// world.js — the room itself: it loads a level, moves the thief,
// updates every guard, camera, laser and tripwire, and keeps the score.
// The world owns no pixels and no sound; it reports events and the
// renderer and the sound bank turn them into a picture and a noise.

import { LEVELS, LOOT_VALUE, findTile } from './levels.js';
import { TILE, PLAYER, ALARM, LASER, TRIPWIRE, SCORE } from './config.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { LaserGrid, Tripwire } from './lasers.js';
import { Loot, Vault, Exit } from './loot.js';
import { Alarm, ALARM_STAGE } from './alarm.js';
import { Toolbelt } from './tools.js';
import { SoundBank } from './audio.js';
import { findRoutes } from './routes.js';

export class World {
  constructor() {
    this.audio = new SoundBank();
    this.levelIndex = 0;
    this.level = null;
    this.width = 0;
    this.height = 0;
    this.tiles = [];
    this.thief = null;
    this.guards = [];
    this.cameras = [];
    this.lasers = [];
    this.tripwires = [];
    this.loot = [];
    this.vault = null;
    this.exit = null;
    this.alarm = new Alarm();
    this.tools = new Toolbelt();
    this.routes = [];
    this.score = 0;
    this.lootValue = 0;
    this.elapsed = 0;
    this.spotted = false; // any guard ever reached full suspicion
    this.alarmMax = 0;
    this.state = 'playing'; // playing | levelComplete | caught | won
    this.caughtReason = '';
    this.events = [];
    this.stepAcc = 0;
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    const rows = this.level.map;
    this.height = rows.length;
    this.width = rows[0].length;
    this.tiles = rows.map((row) => row.split(''));
    this.thief = this.makeThief(findTile(rows, 'P'));
    this.exit = new Exit(...findTile(rows, 'E'));
    this.vault = new Vault(...findTile(rows, 'V'));
    this.loot = [];
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === 'o' || ch === 'g' || ch === 'a') this.loot.push(new Loot(ch, x, y));
      }
    });
    this.guards = this.level.guards.map(
      (g) => new Guard(g, this.isWalkable.bind(this), this.isBlocked.bind(this), this.width, this.height),
    );
    this.cameras = this.level.cameras.map((c) => new Camera(c, this.isBlocked.bind(this)));
    this.lasers = this.level.lasers.map((l) => new LaserGrid(l));
    this.tripwires = this.level.tripwires.map((t) => new Tripwire(t));
    const hazards = new Set();
    for (const l of this.level.lasers) {
      for (let x = l.fromX; x <= l.toX; x++) hazards.add(`${x},${l.row}`);
    }
    for (const t of this.level.tripwires) hazards.add(`${t.at[0]},${t.at[1]}`);
    this.routes = findRoutes(
      this.isWalkable.bind(this),
      (y) => this.tiles[y],
      this.level.guards,
      hazards,
      this.width, this.height,
      findTile(rows, 'P'), findTile(rows, 'V'),
    );
    this.alarm = new Alarm();
    this.alarm.onStageChange = (prev, next) => this.onAlarmStage(prev, next);
    this.tools = new Toolbelt();
    this.elapsed = 0;
    this.spotted = false;
    this.alarmMax = 0;
    this.state = 'playing';
    this.caughtReason = '';
    this.events = [];
  }

  makeThief([tx, ty]) {
    return {
      x: (tx + 0.5) * TILE,
      y: (ty + 0.5) * TILE,
      sneaking: false,
      inShadow: false,
      smoked: false,
      facing: 0,
      moving: false,
    };
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return '#';
    return this.tiles[ty][tx];
  }

  isBlocked(tx, ty) {
    const ch = this.tileAt(tx, ty);
    return ch === '#' || ch === 'H';
  }

  isWalkable(tx, ty) {
    return !this.isBlocked(tx, ty);
  }

  onAlarmStage(prev, next) {
    if (next === ALARM_STAGE.ALERT) {
      // Guards converge on the last place anyone saw the thief.
      const spot = this.lastSeenSpot();
      if (spot) for (const g of this.guards) g.convergeOn(spot.x, spot.y);
      this.events.push({ type: 'alarm-alert' });
      this.audio.spotted();
    }
    if (next === ALARM_STAGE.LOCKDOWN) {
      this.exit.seal(ALARM.lockdownSeconds);
      this.events.push({ type: 'alarm-lockdown' });
    }
  }

  lastSeenSpot() {
    for (const g of this.guards) {
      if (g.lastSeen) return g.lastSeen;
    }
    return { x: this.thief.x, y: this.thief.y };
  }

  moveThief(dt, input) {
    const v = input.moveVector();
    const speed = input.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    const t = this.thief;
    t.sneaking = input.sneaking;
    t.moving = v.x !== 0 || v.y !== 0;
    if (!t.moving) return;
    const nx = t.x + v.x * speed * dt;
    const ny = t.y + v.y * speed * dt;
    // Move one axis at a time so the thief slides along walls.
    if (!this.circleHitsWall(nx, t.y)) t.x = nx;
    if (!this.circleHitsWall(t.x, ny)) t.y = ny;
    t.facing = Math.atan2(v.y, v.x);
    this.stepAcc += speed * dt;
    if (this.stepAcc > 46) {
      this.stepAcc = 0;
      if (!t.sneaking) this.audio.step();
    }
  }

  circleHitsWall(x, y) {
    const r = PLAYER.radius;
    const x0 = Math.floor((x - r) / TILE);
    const x1 = Math.floor((x + r) / TILE);
    const y0 = Math.floor((y - r) / TILE);
    const y1 = Math.floor((y + r) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.isBlocked(tx, ty)) continue;
        const cx = Math.max(tx * TILE, Math.min(x, (tx + 1) * TILE));
        const cy = Math.max(ty * TILE, Math.min(y, (ty + 1) * TILE));
        if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
      }
    }
    return false;
  }

  update(dt, input) {
    if (this.state !== 'playing') return;
    this.elapsed += dt;
    this.events = [];
    this.moveThief(dt, input);
    const t = this.thief;
    const tile = this.tileAt(Math.floor(t.x / TILE), Math.floor(t.y / TILE));
    t.inShadow = tile === ',';
    t.smoked = this.tools.thiefSmoked(t.x, t.y);
    this.tools.update(dt, this);

    // Tools: 1 coin, 2 smoke, 3 EMP, click to throw a coin at the mouse.
    const mouse = input.mouseWorld || input.mouse;
    if (input.wasPressed('1') || input.mouse.clicked) {
      const target = Toolbelt.clampTarget(mouse.x, mouse.y, this.width, this.height);
      if (this.tools.throwCoin(t.x, t.y, target.x, target.y)) this.audio.clink();
    }
    if (input.wasPressed('2')) {
      if (this.tools.dropSmoke(t.x, t.y)) this.audio.clink();
    }
    if (input.wasPressed('3')) {
      if (this.tools.fireEmp(this.cameras)) this.events.push({ type: 'emp' });
    }

    // Guards see, chase and catch.
    for (const guard of this.guards) {
      const ev = guard.update(dt, t, this);
      if (guard.suspicion >= 1) this.spotted = true;
      if (ev.caught) {
        this.endCaught('A guard caught you in the open.');
        return;
      }
    }

    // Cameras raise the alarm while they hold you in frame.
    for (const camera of this.cameras) {
      const rise = camera.update(dt, t, this);
      if (rise > 0) this.alarm.raise(rise);
    }

    // Lasers and tripwires trip the alarm when crossed live.
    for (const laser of this.lasers) {
      if (laser.update(dt, t)) {
        this.alarm.raise(LASER.alarmOnTrip);
        this.events.push({ type: 'laser-trip' });
        this.audio.laserTrip();
      }
    }
    for (const wire of this.tripwires) {
      if (wire.update(dt, t)) {
        this.alarm.raise(TRIPWIRE.alarmOnTrip);
        this.events.push({ type: 'tripwire-trip' });
        this.audio.laserTrip();
      }
    }

    // Loot, vault and the getaway door.
    for (const item of this.loot) {
      const value = item.tryTake(t);
      if (value > 0) {
        this.lootValue += value;
        this.events.push({ type: 'loot', value });
        this.audio.pickup();
      }
    }
    const vaultValue = this.vault.update(dt, t);
    if (vaultValue > 0) {
      this.lootValue += vaultValue;
      this.exit.open = true;
      this.events.push({ type: 'vault', value: vaultValue });
      this.audio.vaultCrack();
    }
    this.exit.update(dt);
    if (this.exit.tryLeave(t)) {
      this.finishLevel();
      return;
    }

    // The alarm cools when nobody is watching.
    const watched = this.guards.some((g) => g.suspicion > 0.05)
      || this.cameras.some((c) => c.seeLeft > 0);
    if (!watched) this.alarm.cool(dt);
    this.alarmMax = Math.max(this.alarmMax, this.alarm.value);
    if (this.alarm.caught) {
      this.endCaught('The alarm hit the roof and the room locked down on you.');
    }
  }

  finishLevel() {
    const par = this.level.par;
    const timeBonus = Math.max(0, Math.round((par - this.elapsed) * 2));
    const ghostBonus = this.spotted ? 0 : SCORE.ghostBonus;
    const quietBonus = this.alarmMax < ALARM.stageAlert ? SCORE.quietBonus : 0;
    const levelScore = this.lootValue + SCORE.vaultBonus + ghostBonus + quietBonus + timeBonus;
    this.score += levelScore;
    this.levelResult = {
      levelScore,
      lootValue: this.lootValue,
      timeBonus,
      ghostBonus,
      quietBonus,
      elapsed: this.elapsed,
      stars: this.spotted ? 1 : (this.elapsed <= par ? 3 : 2),
    };
    this.audio.success();
    if (this.levelIndex >= LEVELS.length - 1) {
      this.state = 'won';
    } else {
      this.state = 'levelComplete';
    }
  }

  endCaught(reason) {
    this.state = 'caught';
    this.caughtReason = reason;
    this.audio.caught();
  }

  nextLevel() {
    this.loadLevel(this.levelIndex + 1);
  }

  get totalLoot() {
    return this.loot.reduce((sum, item) => sum + (item.taken ? 0 : item.value), 0)
      + (this.vault.cracked ? 0 : LOOT_VALUE.V);
  }
}
