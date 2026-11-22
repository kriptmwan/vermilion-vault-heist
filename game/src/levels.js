// levels.js — the five rooms of The Vermilion Vault.
// Each map is a grid of tiles, one character per tile:
//   '#' wall        '.' marble floor      ',' shadow floor (dark cover)
//   'H' statue      'P' thief start       'E' getaway door
//   'V' vault       'o' coin stack        'g' gem           'a' artifact
//   'G' guard post  'C' camera mount      '=' laser beam     'T' tripwire
// Guard patrols, camera facings and laser spans live in the metadata
// beside each map so a room reads as one design, not scattered constants.

export const TILE_LEGEND = {
  '#': 'wall',
  '.': 'floor',
  ',': 'shadow',
  H: 'statue',
  P: 'player',
  E: 'exit',
  V: 'vault',
  o: 'coins',
  g: 'gem',
  a: 'artifact',
  G: 'guard',
  C: 'camera',
  '=': 'laser',
  T: 'tripwire',
};

export const LOOT_VALUE = { o: 100, g: 250, a: 400, V: 1000 };

export const LEVELS = [
  {
    name: 'The Marble Lobby',
    subtitle: 'Learn the dark. One guard, one camera, one vault.',
    par: 75,
    seed: 11,
    map: [
      '##########################',
      '#P...#......,....#.......#',
      '#....#..o...,...#...g....#',
      '#.H..#......,....#.......#',
      '#...........,....#...C...#',
      '#....#......,....#.......#',
      '#....#..a...,...#...o....#',
      '#....#......,............#',
      '#.G..#......,....#.......#',
      '#....#......,....#...H...#',
      '#.......G...,...#...V....#',
      '#....#......,....#.......#',
      '#....#......,.........E..#',
      '#....#......,....#.......#',
      '#........................#',
      '##########################',
    ],
    guards: [
      { waypoints: [[2, 8], [2, 12], [8, 12], [8, 8]], pause: 1.2 },
      { waypoints: [[9, 10], [15, 10], [15, 4], [9, 4]], pause: 0.9 },
    ],
    cameras: [{ at: [21, 4], facing: Math.PI / 2, sweep: 0.9 }],
    lasers: [],
    tripwires: [],
  },
  {
    name: 'The Gilded Gallery',
    subtitle: 'Two ways in: the lit hall, or the dark service lane.',
    par: 90,
    seed: 22,
    map: [
      '##########################',
      '#P...#......,,,,,,#......#',
      '#....#..o...,,,,,,#.g....#',
      '#.H..#......,,,,,,.......#',
      '#....#......,,,,,,#..C...#',
      '#.......G...,,,,,,#......#',
      '#....#......,,,,,,#..o...#',
      '#....#......,,,,,,#......#',
      '#.G.........,,,,,,...a...#',
      '#....#......,,,,,,.......#',
      '#....#..o...,,,,,,#..V...#',
      '#...........,,,,,,#......#',
      '#....#..G...,,,,,,#...E..#',
      '#.C..#......,,,,,,#......#',
      '#.================.......#',
      '##########################',
    ],
    guards: [
      { waypoints: [[2, 8], [2, 4], [7, 4], [7, 8]], pause: 1.0 },
      { waypoints: [[9, 5], [15, 5], [15, 12], [9, 12]], pause: 0.8 },
      { waypoints: [[20, 9], [23, 9], [23, 12], [20, 12]], pause: 1.4 },
    ],
    cameras: [
      { at: [21, 4], facing: Math.PI / 2, sweep: 1.1 },
      { at: [2, 13], facing: 0, sweep: 0.8 },
    ],
    lasers: [{ row: 14, fromX: 2, toX: 17 }],
    tripwires: [],
  },
  {
    name: 'The Ivory Archive',
    subtitle: 'Tripwires hum in the stacks. Walk when the light is dim.',
    par: 105,
    seed: 33,
    map: [
      '##########################',
      '#P...#.....,......#......#',
      '#....#.o...,...g..#..C...#',
      '#.H..#.....,......#......#',
      '#.......G..,......#..o...#',
      '#....#.....,..T...#......#',
      '#....#..a..,.........g...#',
      '#..........,.............#',
      '#.G..#.....,......#..V...#',
      '#....#.....,..T...#......#',
      '#....#..G..,......#..a...#',
      '#..........,......#......#',
      '#..o.#.....,..........E..#',
      '#.C..#.....G......#......#',
      '#....#.....,......#......#',
      '##########################',
    ],
    guards: [
      { waypoints: [[2, 8], [2, 12], [8, 12], [8, 8]], pause: 1.0 },
      { waypoints: [[9, 4], [9, 10], [15, 10], [15, 4]], pause: 0.7 },
      { waypoints: [[20, 8], [23, 8], [23, 12], [20, 12]], pause: 1.2 },
      { waypoints: [[11, 13], [16, 13], [16, 7], [11, 7]], pause: 0.9 },
    ],
    cameras: [
      { at: [21, 2], facing: Math.PI / 2, sweep: 1.0 },
      { at: [2, 13], facing: 0, sweep: 0.7 },
    ],
    lasers: [],
    tripwires: [
      { at: [13, 5] },
      { at: [13, 9] },
    ],
  },
  {
    name: 'The Crimson Strongroom',
    subtitle: 'Lasers, tripwires and four sweeping cameras. Plan first.',
    par: 120,
    seed: 44,
    map: [
      '##########################',
      '#P...#.....,,.....#......#',
      '#....#.o...,C.g...#.C....#',
      '#.H..#.....,,.....#......#',
      '#.......G..,,.....#..o...#',
      '#....#.....,,..T..#......#',
      '#....#..a..,,........g...#',
      '#..........,,............#',
      '#.G..#.....,,.....#..V...#',
      '#....#.....,,..T..#......#',
      '#....#..G..,,.....#..a...#',
      '#..........,,.....#......#',
      '#..o.#.....,,........CE..#',
      '#.CG.#.....G,.....#......#',
      '#.================.......#',
      '##########################',
    ],
    guards: [
      { waypoints: [[2, 8], [2, 4], [7, 4], [7, 12]], pause: 0.9 },
      { waypoints: [[9, 4], [9, 11], [15, 11], [15, 4]], pause: 0.7 },
      { waypoints: [[20, 8], [23, 8], [23, 12], [20, 12]], pause: 1.1 },
      { waypoints: [[11, 13], [16, 13], [16, 7], [11, 7]], pause: 0.8 },
      { waypoints: [[3, 13], [7, 13], [7, 9], [3, 9]], pause: 1.3 },
    ],
    cameras: [
      { at: [20, 2], facing: Math.PI / 2, sweep: 1.1 },
      { at: [2, 13], facing: 0, sweep: 0.8 },
      { at: [21, 12], facing: -Math.PI / 2, sweep: 0.9 },
      { at: [12, 2], facing: Math.PI / 2, sweep: 1.2 },
    ],
    lasers: [{ row: 14, fromX: 2, toX: 17 }],
    tripwires: [
      { at: [14, 5] },
      { at: [14, 9] },
    ],
  },
  {
    name: 'The Vermilion Heart',
    subtitle: 'The Star itself. Every guard, every camera, one way out.',
    par: 150,
    seed: 55,
    map: [
      '##########################',
      '#P...#.....,,.....#......#',
      '#....#.o...,C.g...#.C....#',
      '#.H..#.....,,.....#..o...#',
      '#.......G..,,..T..#.Gg...#',
      '#....#.....,,.....#......#',
      '#..a.#..G..,,........a...#',
      '#..........,,........C...#',
      '#.G..#.....,,.....#..V...#',
      '#....#.....,,..T..#......#',
      '#....#..G..,,.....#..o...#',
      '#..........,,.....#......#',
      '#..o.#.....,,........CE..#',
      '#.CG.#.....G,.....#..g...#',
      '#.================.......#',
      '##########################',
    ],
    guards: [
      { waypoints: [[2, 8], [2, 4], [7, 4], [7, 12]], pause: 0.8 },
      { waypoints: [[9, 5], [15, 5], [15, 12], [9, 12]], pause: 0.6 },
      { waypoints: [[20, 8], [23, 8], [23, 12], [20, 12]], pause: 1.0 },
      { waypoints: [[11, 13], [16, 13], [16, 7], [11, 7]], pause: 0.7 },
      { waypoints: [[3, 13], [7, 13], [7, 9], [3, 9]], pause: 1.2 },
      { waypoints: [[20, 2], [23, 2], [23, 4], [20, 4]], pause: 0.9 },
    ],
    cameras: [
      { at: [20, 2], facing: Math.PI / 2, sweep: 1.1 },
      { at: [2, 13], facing: 0, sweep: 0.8 },
      { at: [21, 12], facing: -Math.PI / 2, sweep: 0.9 },
      { at: [12, 2], facing: Math.PI / 2, sweep: 1.2 },
    ],
    lasers: [
      { row: 14, fromX: 2, toX: 17 },
    ],
    tripwires: [
      { at: [14, 4] },
      { at: [14, 9] },
    ],
  },
];

// Validate a level map: rectangular, known tiles, exactly one player start,
// one exit and one vault, and every loot reachable from the start on foot.
export function validateLevel(level) {
  const errors = [];
  const rows = level.map;
  const w = rows[0].length;
  let p = 0;
  let e = 0;
  let v = 0;
  const loot = [];
  rows.forEach((row, y) => {
    if (row.length !== w) errors.push(`row ${y} is ${row.length} wide, expected ${w}`);
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (!(ch in TILE_LEGEND)) errors.push(`unknown tile '${ch}' at ${x},${y}`);
      if (ch === 'P') p++;
      if (ch === 'E') e++;
      if (ch === 'V') v++;
      if (ch === 'o' || ch === 'g' || ch === 'a') loot.push([x, y]);
    }
  });
  if (p !== 1) errors.push(`expected 1 player start, found ${p}`);
  if (e !== 1) errors.push(`expected 1 exit, found ${e}`);
  if (v !== 1) errors.push(`expected 1 vault, found ${v}`);
  if (errors.length) return { ok: false, errors };
  // Flood fill from the player start over walkable tiles.
  const walkable = (ch) => ch !== '#' && ch !== 'H';
  const start = findTile(rows, 'P');
  const seen = new Set([start.join(',')]);
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || ny >= rows.length || nx >= w || seen.has(key)) continue;
      if (!walkable(rows[ny][nx])) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  for (const [x, y] of loot) {
    if (!seen.has(`${x},${y}`)) errors.push(`loot at ${x},${y} unreachable`);
  }
  const exit = findTile(rows, 'E');
  const vault = findTile(rows, 'V');
  if (!seen.has(exit.join(','))) errors.push('exit unreachable');
  if (!seen.has(vault.join(','))) errors.push('vault unreachable');
  return { ok: errors.length === 0, errors, loot: loot.length };
}

export function findTile(rows, ch) {
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y].indexOf(ch);
    if (x !== -1) return [x, y];
  }
  return null;
}
