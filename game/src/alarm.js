// alarm.js — the alarm meter and its three stages.
//   CALM (0-59): guards patrol, cameras sweep, the room is yours.
//   ALERT (60-89): guards converge on the thief's last seen spot.
//   LOCKDOWN (90-99): the getaway door seals, every guard hunts.
//   CAUGHT (100): the run ends.
// The meter cools when nobody can see you, so a careful thief can pull
// a room back from the edge — but every trip and sighting adds up.

import { ALARM } from './config.js';

export const ALARM_STAGE = {
  CALM: 'calm',
  ALERT: 'alert',
  LOCKDOWN: 'lockdown',
};

export class Alarm {
  constructor() {
    this.value = 0; // 0..100
    this.stage = ALARM_STAGE.CALM;
    this.onStageChange = null; // world hooks this to react
  }

  raise(amount) {
    if (amount <= 0) return;
    this.value = Math.min(100, this.value + amount);
    this.checkStage();
  }

  cool(dt) {
    if (this.value <= 0) return;
    this.value = Math.max(0, this.value - ALARM.decayPerSecond * dt);
    this.checkStage();
  }

  stageFor(value) {
    if (value >= ALARM.stageLockdown) return ALARM_STAGE.LOCKDOWN;
    if (value >= ALARM.stageAlert) return ALARM_STAGE.ALERT;
    return ALARM_STAGE.CALM;
  }

  checkStage() {
    const next = this.stageFor(this.value);
    if (next !== this.stage) {
      const prev = this.stage;
      this.stage = next;
      if (this.onStageChange) this.onStageChange(prev, next);
    }
  }

  get caught() {
    return this.value >= ALARM.catchAt;
  }

  // The meter as the HUD draws it: a 0..1 fill plus its stage name.
  get fill() {
    return this.value / 100;
  }
}
