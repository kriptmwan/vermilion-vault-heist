// routes.js — three named ways through every room, so the thief always
// has a choice and the choice always matters.
//   Grand Hall — the direct line, lit and watched.
//   Shadow Lane — longer, but it hugs the dark floor where cones are slow.
//   Service Lane — swings wide of the patrols and the beams.
// Each route is a real A* path under a different cost map; the world
// computes them at level load and the planning overlay draws them.

import { TILE } from './config.js';

// Weighted A*: like astar.findPath, but every tile can cost differently.
function weightedPath(walkable, cost, width, height, sx, sy, tx, ty) {
  if (!walkable(tx, ty)) return null;
  const key = (x, y) => y * width + x;
  const open = [{ x: sx, y: sy, g: 0, f: 0, parent: null }];
  const best = new Map([[key(sx, sy), 0]]);
  const closed = new Set();
  const heuristic = (x, y) => Math.abs(x - tx) + Math.abs(y - ty);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bi].f) bi = i;
    }
    const node = open.splice(bi, 1)[0];
    if (node.x === tx && node.y === ty) {
      const path = [];
      let n = node;
      while (n) {
        path.unshift([n.x, n.y]);
        n = n.parent;
      }
      return path;
    }
    closed.add(key(node.x, node.y));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = node.x + dx;
      const ny = node.y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!walkable(nx, ny)) continue;
      if (closed.has(key(nx, ny))) continue;
      const g = node.g + cost(nx, ny);
      if (best.has(key(nx, ny)) && best.get(key(nx, ny)) <= g) continue;
      best.set(key(nx, ny), g);
      open.push({ x: nx, y: ny, g, f: g + heuristic(nx, ny), parent: node });
    }
  }
  return null;
}

// Every route runs from the thief's start to the vault. `tiles(x, y)`
// reads the map character, `guards` are the patrol definitions and
// `hazards` marks laser and tripwire tiles.
export function findRoutes(walkable, tiles, guards, hazards, width, height, from, to) {
  const nearPatrol = (x, y) => {
    for (const g of guards) {
      for (const [wx, wy] of g.waypoints) {
        if (Math.abs(wx - x) + Math.abs(wy - y) <= 1) return true;
      }
    }
    return false;
  };
  const routes = [];
  const direct = weightedPath(walkable, () => 1, width, height, from[0], from[1], to[0], to[1]);
  if (direct) routes.push({ name: 'Grand Hall', color: '#ffd94a', path: direct });
  const shadow = weightedPath(
    walkable,
    (x, y) => {
      // The lane hugs the dark floor and gives patrols a wide berth:
      // a shadow tile costs a third of a lit one, a tile a guard
      // walks costs extra, so the lane bends around the patrols.
      let c = tiles(y)[x] === ',' ? 0.35 : 1;
      if (nearPatrol(x, y)) c += 1.5;
      return c;
    },
    width, height, from[0], from[1], to[0], to[1],
  );
  if (shadow) routes.push({ name: 'Shadow Lane', color: '#8f7bd8', path: shadow });
  const service = weightedPath(
    walkable,
    (x, y) => {
      let c = 1;
      if (hazards.has(`${x},${y}`)) c += 6;
      if (nearPatrol(x, y)) c += 2.5;
      return c;
    },
    width, height, from[0], from[1], to[0], to[1],
  );
  if (service) routes.push({ name: 'Service Lane', color: '#58d68d', path: service });
  // Keep only routes that genuinely differ from the direct line.
  const same = (a, b) => a.length === b.length && a.every((p, i) => p[0] === b[i][0] && p[1] === b[i][1]);
  return routes.filter((r, i) => i === 0 || !same(r.path, routes[0].path));
}

export function pathToPixels(path) {
  return path.map(([x, y]) => [(x + 0.5) * TILE, (y + 0.5) * TILE]);
}
