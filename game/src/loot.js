// loot.js — everything worth stealing: coin stacks, gems, artifacts,
// the vault itself, and the getaway door that only opens once the vault
// is cracked. Loot sparkles so the eye finds it; the vault is the big
// golden target every room is built around.

import { TILE } from './config.js';
import { LOOT_VALUE } from './levels.js';

export class Loot {
  constructor(kind, tx, ty) {
    this.kind = kind; // 'o' coins, 'g' gem, 'a' artifact
    this.x = (tx + 0.5) * TILE;
    this.y = (ty + 0.5) * TILE;
    this.value = LOOT_VALUE[kind];
    this.taken = false;
    this.phase = Math.random() * Math.PI * 2;
  }

  // True the frame the thief's hand closes on it.
  tryTake(thief) {
    if (this.taken) return 0;
    if (Math.hypot(thief.x - this.x, thief.y - this.y) < 24) {
      this.taken = true;
      return this.value;
    }
    return 0;
  }
}

export class Vault {
  constructor(tx, ty) {
    this.x = (tx + 0.5) * TILE;
    this.y = (ty + 0.5) * TILE;
    this.value = LOOT_VALUE.V;
    this.cracked = false;
    this.crackProgress = 0; // hold near the vault to crack it
    this.crackSeconds = 2.5;
  }

  // Stand beside the vault and it cracks open. Returns the payout once.
  update(dt, thief) {
    if (this.cracked) return 0;
    const near = Math.hypot(thief.x - this.x, thief.y - this.y) < 44;
    if (near) {
      this.crackProgress += dt;
      if (this.crackProgress >= this.crackSeconds) {
        this.cracked = true;
        return this.value;
      }
    } else {
      this.crackProgress = Math.max(0, this.crackProgress - dt);
    }
    return 0;
  }
}

export class Exit {
  constructor(tx, ty) {
    this.x = (tx + 0.5) * TILE;
    this.y = (ty + 0.5) * TILE;
    this.open = false; // opens when the vault is cracked
    this.sealedLeft = 0; // lockdown seals it for a while
  }

  get sealed() {
    return this.sealedLeft > 0;
  }

  update(dt) {
    if (this.sealedLeft > 0) this.sealedLeft -= dt;
  }

  seal(seconds) {
    this.sealedLeft = Math.max(this.sealedLeft, seconds);
  }

  // True the frame the thief steps through an open, unsealed door.
  tryLeave(thief) {
    if (!this.open || this.sealed) return false;
    return Math.hypot(thief.x - this.x, thief.y - this.y) < 26;
  }
}
