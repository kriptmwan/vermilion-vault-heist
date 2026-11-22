// random.js — a tiny seeded RNG so a level plays the same way twice
// when it is given the same seed (screenshots and playtests stay stable).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// A short deterministic id for a run, used in the HUD and the end screen.
export function runId(seed) {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(rng() * chars.length)];
  return out;
}
