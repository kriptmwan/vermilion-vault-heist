// vision.js — raycast field of view: what a guard or a camera can see.
// A cone is a fan of rays from an eye; each ray walks forward in small
// steps until it hits a wall tile, so cones wrap around corners the way
// a real line of sight does. Nothing here draws anything — render.js
// takes the polygons this module returns.

import { TILE } from './config.js';

// True when the straight line from (x0, y0) to (x1, y1) in pixel space
// crosses no wall tile. `blocked(tx, ty)` answers for one tile.
export function hasLineOfSight(blocked, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return true;
  const steps = Math.ceil(dist / 6);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (blocked(tx, ty)) return false;
  }
  return true;
}

// Cast one ray from (ox, oy) along `angle` until it hits a wall or runs
// out to `maxDist`. Returns the distance the ray travelled.
export function castRay(blocked, ox, oy, angle, maxDist) {
  const step = 6;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let x = ox;
  let y = oy;
  let travelled = 0;
  while (travelled < maxDist) {
    x += dx;
    y += dy;
    travelled += step;
    if (blocked(Math.floor(x / TILE), Math.floor(y / TILE))) return travelled;
  }
  return maxDist;
}

// Build the visible polygon of a cone: the eye plus one point per ray.
// `rays` controls how smooth the cone's edge looks (24 is plenty).
export function conePolygon(blocked, ox, oy, facing, halfAngle, distance, rays = 24) {
  const points = [[ox, oy]];
  for (let i = 0; i <= rays; i++) {
    const angle = facing - halfAngle + (2 * halfAngle * i) / rays;
    const d = castRay(blocked, ox, oy, angle, distance);
    points.push([ox + Math.cos(angle) * d, oy + Math.sin(angle) * d]);
  }
  return points;
}

// Is the point (px, py) inside the watcher's cone AND visible to it?
// Distance, angle and line of sight all have to agree.
export function canSee(blocked, ox, oy, facing, halfAngle, distance, px, py) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > distance) return false;
  if (dist < 1) return true;
  const angle = Math.atan2(dy, dx);
  let diff = angle - facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > halfAngle) return false;
  return hasLineOfSight(blocked, ox, oy, px, py);
}
