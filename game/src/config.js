// config.js — every tunable number of The Vermilion Vault in one place.
// Nothing here knows about the DOM; the loop, the guards and the renderer
// all read these values so a balance change is a one-line edit.

export const TILE = 32; // pixels per map tile

export const PALETTE = {
  floorLight: '#3a2f45',
  floorDark: '#2c2333',
  floorShadow: '#1d1626', // shadow floor: guards see you slower here
  wall: '#171019',
  wallTop: '#4a2b3d',
  goldTrim: '#c9a227',
  vermilion: '#b03030',
  crimson: '#7e1f2e',
  coneCalm: 'rgba(255, 196, 66, 0.20)', // guard vision, calm
  coneAlert: 'rgba(255, 64, 48, 0.30)', // guard vision, alerted
  coneCamera: 'rgba(255, 96, 96, 0.16)', // camera sweep
  lootGold: '#ffd94a',
  player: '#e8e4da',
  guard: '#ff5a4e',
  exit: '#58d68d',
  hud: '#f2ead8',
};

export const PLAYER = {
  walkSpeed: 148, // px per second
  sneakSpeed: 82,
  radius: 11,
  // How fast a guard's suspicion fills when you stand in its cone.
  // Multiplied by closeness (near = faster) and divided in shadow/sneak.
  detectPerSecond: 0.62,
  sneakDetectFactor: 0.45,
  shadowDetectFactor: 0.55,
  runDetectFactor: 1.35,
};

export const GUARD = {
  patrolSpeed: 62,
  chaseSpeed: 128,
  inspectSpeed: 88,
  viewDistance: 215,
  viewHalfAngle: 0.62, // radians either side of facing (~71 degrees total)
  hearRadius: 130, // coin clinks and sprinting are heard this far
  suspiciousSeconds: 1.1, // staring before the guard walks over to look
  searchSeconds: 4.5, // how long a guard hunts after losing you
  // Fair-caught rule: once suspicion is full the guard shouts and you get
  // this long to break line of sight before the alarm spikes and you are caught.
  warnSeconds: 0.9,
};

export const CAMERA = {
  viewDistance: 190,
  viewHalfAngle: 0.42,
  sweepDegrees: 70, // how far the head swings each way
  sweepSeconds: 3.4, // one full swing
  detectPerSecond: 0.12, // alarm points per second while it holds you
  empDisableSeconds: 8,
};

export const LASER = {
  cycleSeconds: 3.2, // on, then off, then on again
  onFraction: 0.55,
  alarmOnTrip: 26,
};

export const TRIPWIRE = {
  alarmOnTrip: 18,
  // A pulsing tripwire is safe to cross while its light is dim.
  pulseSeconds: 2.6,
  safeFraction: 0.5,
};

export const ALARM = {
  decayPerSecond: 4.5, // alarm cools when nobody sees you
  stageAlert: 60, // at this: guards converge on your last seen spot
  stageLockdown: 90, // at this: the getaway door seals for a while
  lockdownSeconds: 10,
  catchAt: 100,
};

export const TOOLS = {
  coin: { key: '1', start: 3, label: 'Coin lure' },
  smoke: { key: '2', start: 2, label: 'Smoke vial' },
  emp: { key: '3', start: 1, label: 'EMP burst' },
};

export const SCORE = {
  vaultBonus: 500,
  ghostBonus: 300, // never spotted on the level
  quietBonus: 150, // alarm never passed stageAlert
  timeParSeconds: 90, // beating par adds up to this many points
};

// Staged screenshot scenes (?shot=...). shots.js picks one of these and
// poses the level so the frame shows the whole heist at a glance.
export const SHOT_SCENES = ['cover', 'alarm', 'vault', 'win'];
