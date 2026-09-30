// Helpers used by the map builders.
import { TILE } from '../util.js';
import { G } from '../world.js';

export const DIR = { N: 1, E: 2, S: 4, W: 8 };

export function ensureLanes(map) {
  if (!map.laneDir) map.laneDir = new Uint8Array(map.w * map.h);
}

// A horizontal street: sidewalk rows on both sides, road rows in the middle.
// Right-hand traffic: the northern half runs west, the southern half east.
export function hStreet(map, name, x0, x1, y, w = 4, opts = {}) {
  ensureLanes(map);
  const surf = opts.surface ?? G.ASPHALT;
  const walk = opts.sidewalk === false ? 0 : 1;
  for (let x = x0; x < x1; x++) {
    for (let j = 0; j < w; j++) {
      const yy = y + j;
      const edge = walk && (j === 0 || j === w - 1);
      if (opts.median && (j === Math.floor(w / 2) - 1 || j === Math.floor(w / 2))) { map.set(x, yy, G.MEDIAN); continue; }
      if (edge && !(opts.keepExisting && map.get(x, yy) !== G.GRASS)) { if (map.get(x, yy) !== G.ASPHALT && map.get(x, yy) !== G.COBBLE) map.set(x, yy, G.SIDEWALK); }
      else if (!edge) {
        map.set(x, yy, surf);
        const mid = y + w / 2;
        map.laneDir[yy * map.w + x] |= (yy + 0.5 < mid ? DIR.W : DIR.E);
      }
    }
  }
  map.markStreet(x0, y, x1 - x0, w, name);
}

export function vStreet(map, name, x, y0, y1, w = 4, opts = {}) {
  ensureLanes(map);
  const surf = opts.surface ?? G.ASPHALT;
  const walk = opts.sidewalk === false ? 0 : 1;
  for (let y = y0; y < y1; y++) {
    for (let i = 0; i < w; i++) {
      const xx = x + i;
      const edge = walk && (i === 0 || i === w - 1);
      if (opts.median && (i === Math.floor(w / 2) - 1 || i === Math.floor(w / 2))) { map.set(xx, y, G.MEDIAN); continue; }
      const cur = map.get(xx, y);
      if (edge) { if (cur !== G.ASPHALT && cur !== G.COBBLE && cur !== G.DIRTROAD) map.set(xx, y, G.SIDEWALK); }
      else {
        map.set(xx, y, surf);
        const mid = x + w / 2;
        map.laneDir[y * map.w + xx] |= (xx + 0.5 < mid ? DIR.S : DIR.N);
      }
    }
  }
  map.markStreet(x, y0, w, y1 - y0, name);
}

// Lay a one-lane path of lane directions along a polyline (used by one-way loops).
export function laneLoop(map, pts, surface = G.DIRTROAD, name) {
  ensureLanes(map);
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
    const dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
    const d = dx > 0 ? DIR.E : dx < 0 ? DIR.W : dy > 0 ? DIR.S : DIR.N;
    let x = ax, y = ay;
    while (x !== bx || y !== by) {
      map.set(x, y, surface); map.laneDir[y * map.w + x] |= d;
      // widen the road visually by one tile to the right-hand side
      const ox = dy !== 0 ? (dy > 0 ? -1 : 1) : 0, oy = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
      if (map.get(x + ox, y + oy) !== surface) map.set(x + ox, y + oy, surface);
      x += dx; y += dy;
    }
    if (name) map.markStreet(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1, name);
  }
}

export function sprite(map, kind, tx, ty, props = {}) {
  const s = { kind, x: tx * TILE, y: ty * TILE, ...props };
  map.sprites.push(s);
  return s;
}

// A building sprite occupying a tile rectangle; anchored at bottom-centre.
export function building(map, kind, x, y, w, h, props = {}) {
  map.fill(x, y, w, h, props.ground ?? G.ROOF);
  map.setSolid(x, y, w, h, 1);
  const s = sprite(map, kind, x + w / 2, y + h, { fw: w * TILE, fd: h * TILE, w: w * TILE + 80, up: h * TILE + (props.tall || 90), building: true, ...props });
  s.rect = { x, y, w, h };
  return s;
}

export function block(map, x, y, w, h, props = {}) {
  map.fill(x, y, w, h, G.ROOF);
  map.setSolid(x, y, w, h, 1);
  map.structures.push({ kind: 'block', x, y, w, h, seed: x * 7919 + y * 104729, margin: 1, layer: 2, ...props });
}

export function tree(map, tx, ty, kind, props = {}) {
  const size = props.size ?? (0.85 + ((tx * 13 + ty * 7) % 10) / 30);
  return sprite(map, 'tree', tx, ty, {
    tree: kind, seed: tx * 31 + ty * 17, size, w: 44 * size, up: 60 * size,
    collide: kind === 'palma' ? [-2.5, -3, 5, 4] : [-3, -3, 6, 4], ...props,
  });
}

export function door(map, x, y, to, label, extra = {}) {
  map.doors.push({ x, y, w: 1, h: 1, to, label, ...extra });
}

export function area(map, name, x, y, w, h, kind = 'place', extra = {}) {
  map.areas.push({ name, x, y, w, h, kind, ...extra });
}

export function light(map, tx, ty, r = 70, color = '#ffd9a0', kind = 'lamp') {
  map.lights.push({ x: tx * TILE, y: ty * TILE, r, color, kind });
}
