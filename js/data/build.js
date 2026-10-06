// Helpers used by the map builders.
import { TILE } from '../util.js';
import { G, ROADS } from '../world.js';

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
      if (edge) { if (!ROADS.has(map.get(x, yy))) map.set(x, yy, opts.walkSurface ?? G.SIDEWALK); }
      else if (!edge) {
        map.set(x, yy, surf);
        const mid = y + w / 2;
        if (opts.oneWay) { // one lane drives, the other is a parking lane
          const row = yy - y - walk; // 0 = first road row, 1 = second
          if (row === opts.park) markParking(map, x, yy, 'h');
          else map.laneDir[yy * map.w + x] |= DIR[opts.oneWay];
        } else map.laneDir[yy * map.w + x] |= (yy + 0.5 < mid ? DIR.W : DIR.E);
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
      if (edge) { if (!ROADS.has(cur)) map.set(xx, y, opts.walkSurface ?? G.SIDEWALK); }
      else {
        map.set(xx, y, surf);
        const mid = x + w / 2;
        if (opts.oneWay) {
          const col = xx - x - walk;
          if (col === opts.park) markParking(map, xx, y, 'v');
          else map.laneDir[y * map.w + xx] |= DIR[opts.oneWay];
        } else map.laneDir[y * map.w + xx] |= (xx + 0.5 < mid ? DIR.S : DIR.N);
      }
    }
  }
  map.markStreet(x, y0, w, y1 - y0, name);
}

// Parking lanes: remembered per tile ('h' along a horizontal street, 'v' along a vertical one).
function markParking(map, x, y, o) {
  if (!map.parking) map.parking = new Uint8Array(map.w * map.h);
  map.parking[y * map.w + x] = o === 'h' ? 1 : 2;
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

// Distance from point to a polyline (tile units)
export function distToPolyline(px, py, pts) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
    const d = Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
    if (d < best) best = d;
  }
  return best;
}

// A road that does not follow the grid (e.g. Av. Las Palmas). The tiles become walkable
// ground and a smooth polygon is painted over them so the edges are not jagged.
export function diagonalRoad(map, name, pts, width, opts = {}) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const pad = width;
  for (let y = Math.floor(y0 - pad); y <= y1 + pad; y++) for (let x = Math.floor(x0 - pad); x <= x1 + pad; x++) {
    if (!map.inb(x, y)) continue;
    const d = distToPolyline(x + 0.5, y + 0.5, pts);
    if (d <= width / 2 + 0.3) {
      const cur = map.get(x, y);
      if (ROADS.has(cur)) continue;
      map.setSolid(x, y, 1, 1, 0);
      // the edge band is painted by the smooth polygon; underneath it stays grass so no stair-steps show
      map.set(x, y, d < (opts.median || 0) / 2 ? G.MEDIAN : d > width / 2 - 1 ? G.GRASS : (opts.surface ?? G.ASPHALT));
      map.street[y * map.w + x] = map.addStreetName(name);
    }
  }
  map.structures.push({ kind: 'diagRoad', pts, width, median: opts.median || 0, x: Math.floor(x0 - pad), y: Math.floor(y0 - pad), w: Math.ceil(x1 - x0 + pad * 2) + 1, h: Math.ceil(y1 - y0 + pad * 2) + 1, margin: 0, layer: 1 });
}

export function river(map, name, pts, width) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0 - width); y <= y1 + width; y++) for (let x = Math.floor(x0 - width); x <= x1 + width; x++) {
    if (!map.inb(x, y)) continue;
    const d = distToPolyline(x + 0.5, y + 0.5, pts);
    if (d <= width / 2 && !ROADS.has(map.get(x, y))) { map.set(x, y, G.WATER); map.street[y * map.w + x] = map.addStreetName(name); }
    else if (d <= width / 2 + 1.2 && map.get(x, y) === G.GRASS) map.set(x, y, G.FOREST);
  }
  map.structures.push({ kind: 'river', pts, width, x: Math.floor(x0 - width - 3), y: Math.floor(y0 - width - 3), w: Math.ceil(x1 - x0 + width * 2) + 7, h: Math.ceil(y1 - y0 + width * 2) + 7, margin: 0, layer: 1 });
}
