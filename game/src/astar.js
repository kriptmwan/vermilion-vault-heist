// astar.js — A* pathfinding over the tile grid, 4-directional.
// Guards patrol and chase along these paths; the world hands in a
// `walkable(x, y)` test so the search never learns the map's shape itself.

// Find a path from (sx, sy) to (tx, ty). Returns an array of tile
// coordinates, start included, or null when no route exists.
export function findPath(walkable, width, height, sx, sy, tx, ty) {
  if (!walkable(tx, ty)) return null;
  if (sx === tx && sy === ty) return [[sx, sy]];
  const key = (x, y) => y * width + x;
  const open = [{ x: sx, y: sy, g: 0, f: 0, parent: null }];
  const best = new Map([[key(sx, sy), 0]]);
  const closed = new Set();
  const heuristic = (x, y) => Math.abs(x - tx) + Math.abs(y - ty);
  while (open.length) {
    // The open list stays tiny on these rooms; a linear scan is fine.
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
      const g = node.g + 1;
      if (best.has(key(nx, ny)) && best.get(key(nx, ny)) <= g) continue;
      best.set(key(nx, ny), g);
      open.push({ x: nx, y: ny, g, f: g + heuristic(nx, ny), parent: node });
    }
  }
  return null;
}

// Walk a path at a speed in pixels per second. Keeps a position in pixel
// space and advances it along tile centres; returns the tile it stands on.
export function createPathWalker(tileSize) {
  return {
    path: null,
    index: 0,
    x: 0,
    y: 0,
    setPath(path, px, py) {
      this.path = path;
      this.index = 0;
      this.x = px;
      this.y = py;
    },
    // Advance dt seconds toward the next tile centre. True while moving.
    step(dt, speed) {
      if (!this.path || this.index >= this.path.length) return false;
      const [tx, ty] = this.path[this.index];
      const cx = (tx + 0.5) * tileSize;
      const cy = (ty + 0.5) * tileSize;
      const dx = cx - this.x;
      const dy = cy - this.y;
      const dist = Math.hypot(dx, dy);
      const move = speed * dt;
      if (dist <= move) {
        this.x = cx;
        this.y = cy;
        this.index++;
        return this.index < this.path.length;
      }
      this.x += (dx / dist) * move;
      this.y += (dy / dist) * move;
      return true;
    },
    tile() {
      return [Math.floor(this.x / tileSize), Math.floor(this.y / tileSize)];
    },
  };
}
