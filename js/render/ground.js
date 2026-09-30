// Ground tiles, baked structures and the chunk cache.
import { TILE, hash2, fbm, makeCanvas, shade, mix, rgba, clamp } from '../util.js';
import { G, ROADS } from '../world.js';
import { STRUCTURE_DRAW } from './structures.js';

export const CHUNK = 16; // tiles per chunk side

const BASE = {
  [G.GRASS]: '#79ad4c', [G.DIRT]: '#b89063', [G.ASPHALT]: '#5d6166', [G.COBBLE]: '#8f8577',
  [G.SIDEWALK]: '#d8d0c0', [G.PLAZA]: '#dcc0a4', [G.WATER]: '#4f9fc4', [G.ROCK]: '#9a958b',
  [G.FIELD]: '#8aa653', [G.FOREST]: '#6f9f47', [G.ROOF]: '#b5654a', [G.MEDIAN]: '#72a84a',
  [G.COURT]: '#3f8a73', [G.INFIELD]: '#c68657', [G.STAIRS]: '#cfc3ae', [G.SLOPE]: '#6f9a45',
  [G.FLOOR_WOOD]: '#a8744a', [G.FLOOR_TILE]: '#e4d8c2', [G.FLOOR_STONE]: '#b9ab98', [G.WALL]: '#efe6d6',
  [G.CEMETERY]: '#8aa35a', [G.GARDEN]: '#6da243', [G.VOID]: '#1b1c22', [G.ROCKROAD]: '#a68c6c',
  [G.CARPET]: '#8e2f35', [G.MARKET]: '#cbbfa9', [G.OUTFIELD]: '#6fae4a', [G.DIRTROAD]: '#b3895c',
};

function isRoadish(g) { return ROADS.has(g); }

function speckle(ctx, x, y, seed, n, colors, size = 1.2) {
  for (let i = 0; i < n; i++) {
    const rx = hash2(x * 31 + i, y * 17 + i * 7, seed) * TILE;
    const ry = hash2(x * 13 + i * 3, y * 29 + i, seed + 5) * TILE;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x * TILE + rx, y * TILE + ry, size, size);
  }
}

// Draw one tile in world coordinates (ctx already scaled).
export function drawTile(ctx, map, tx, ty) {
  const g = map.get(tx, ty);
  const X = tx * TILE, Y = ty * TILE;
  const h = hash2(tx, ty, 7);
  let base = BASE[g] ?? '#ff00ff';
  // gentle large-scale colour variation for natural surfaces
  if (g === G.GRASS || g === G.FOREST || g === G.SLOPE || g === G.FIELD || g === G.MEDIAN || g === G.CEMETERY || g === G.OUTFIELD) {
    const n = fbm(tx * 0.08, ty * 0.08, 3, 3);
    base = mix(base, n > 0.5 ? '#8fb652' : '#5f8f40', Math.min(0.12, Math.abs(n - 0.5) * 0.35));
    if (map.dry) base = mix(base, '#b9a868', map.dry);
  }
  ctx.fillStyle = base;
  ctx.fillRect(X, Y, TILE + 0.5, TILE + 0.5);

  switch (g) {
    case G.GRASS: case G.MEDIAN: case G.GARDEN: case G.CEMETERY: case G.OUTFIELD: case G.SLOPE: {
      // blades
      ctx.strokeStyle = rgba(shade(base, -0.25), 0.55); ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const bx = X + hash2(tx * 5 + i, ty, 11) * TILE, by = Y + hash2(tx, ty * 5 + i, 12) * TILE;
        ctx.moveTo(bx, by); ctx.lineTo(bx + (hash2(i, tx, 3) - 0.5) * 1.6, by - 2.2);
      }
      ctx.stroke();
      ctx.strokeStyle = rgba(shade(base, 0.25), 0.5);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const bx = X + hash2(tx * 7 + i, ty, 21) * TILE, by = Y + hash2(tx, ty * 7 + i, 22) * TILE;
        ctx.moveTo(bx, by); ctx.lineTo(bx + 0.8, by - 1.8);
      }
      ctx.stroke();
      if (g === G.OUTFIELD && ((tx >> 1) & 1)) { ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.fillRect(X, Y, TILE, TILE); }
      if ((g === G.GRASS || g === G.GARDEN) && h > 0.88) { // wildflowers
        const cols = ['#f4e36a', '#ffffff', '#e889b8', '#f29a4a'];
        for (let i = 0; i < 3; i++) {
          const fx = X + 3 + hash2(tx + i, ty, 40) * 10, fy = Y + 3 + hash2(tx, ty + i, 41) * 10;
          ctx.fillStyle = cols[Math.floor(hash2(tx, ty, 42 + i) * 4)];
          ctx.beginPath(); ctx.arc(fx, fy, 1, 0, 7); ctx.fill();
        }
      }
      if (g === G.GARDEN) { // planter curb
        ctx.strokeStyle = '#cdbfa6'; ctx.lineWidth = 1.2;
        edgeLines(ctx, map, tx, ty, t => t !== G.GARDEN, X, Y);
      }
      if (g === G.MEDIAN) {
        ctx.strokeStyle = '#e8e1d2'; ctx.lineWidth = 1.6;
        edgeLines(ctx, map, tx, ty, t => t !== G.MEDIAN, X, Y);
      }
      if (g === G.CEMETERY && h > 0.6) { ctx.fillStyle = 'rgba(120,90,60,0.35)'; ctx.fillRect(X + 3, Y + 2, 10, 12); }
      break;
    }
    case G.FOREST: {
      speckle(ctx, tx, ty, 5, 10, ['#4d7434', '#86a052', '#a07a45', '#6b8a3d'], 1.4);
      break;
    }
    case G.FIELD: {
      ctx.strokeStyle = 'rgba(90,70,40,0.35)'; ctx.lineWidth = 1;
      for (let i = 2; i < TILE; i += 4) { ctx.beginPath(); ctx.moveTo(X, Y + i); ctx.lineTo(X + TILE, Y + i); ctx.stroke(); }
      speckle(ctx, tx, ty, 9, 6, ['#a6c45d', '#6c8d3a']);
      break;
    }
    case G.ASPHALT: {
      speckle(ctx, tx, ty, 3, 14, ['#6c7075', '#4f5256', '#777a7e'], 0.9);
      // patches and cracks
      if (h < 0.03) { ctx.fillStyle = 'rgba(70,72,76,0.45)'; ctx.beginPath(); ctx.ellipse(X + 8, Y + 8, 6, 4, h * 40, 0, 7); ctx.fill(); }
      if (h > 0.7 && h < 0.78) {
        ctx.strokeStyle = 'rgba(30,30,32,0.55)'; ctx.lineWidth = 0.6; ctx.beginPath();
        ctx.moveTo(X + 2, Y + 5); ctx.lineTo(X + 7, Y + 8); ctx.lineTo(X + 9, Y + 13); ctx.lineTo(X + 14, Y + 12); ctx.stroke();
      }
      if (map.potholes && h > 0.955) pothole(ctx, X, Y, tx, ty);
      curb(ctx, map, tx, ty, X, Y);
      break;
    }
    case G.COBBLE: {
      // empedrado: river stones in rows
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
        const cx = X + i * 4 + 2 + (j & 1) * 1.5 + (hash2(tx * 4 + i, ty * 4 + j, 2) - 0.5);
        const cy = Y + j * 4 + 2 + (hash2(tx * 4 + i, ty * 4 + j, 3) - 0.5);
        const v = hash2(tx * 4 + i, ty * 4 + j, 4);
        ctx.fillStyle = mix('#7d7466', '#b4a893', v);
        ctx.beginPath(); ctx.ellipse(cx, cy, 1.8, 1.5, v * 3, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.ellipse(cx - 0.5, cy - 0.5, 0.8, 0.6, 0, 0, 7); ctx.fill();
      }
      if (map.potholes && h > 0.965) pothole(ctx, X, Y, tx, ty);
      curb(ctx, map, tx, ty, X, Y);
      break;
    }
    case G.DIRT: case G.DIRTROAD: {
      speckle(ctx, tx, ty, 8, 9, ['#9d7650', '#cda77a', '#8b6a48'], 1.1);
      if (g === G.DIRTROAD) {
        ctx.strokeStyle = 'rgba(110,80,50,0.35)'; ctx.lineWidth = 1.2;
        const vert = isRoadish(map.get(tx, ty - 1)) && isRoadish(map.get(tx, ty + 1));
        ctx.beginPath();
        if (vert) { ctx.moveTo(X + 4, Y); ctx.lineTo(X + 4, Y + TILE); ctx.moveTo(X + 12, Y); ctx.lineTo(X + 12, Y + TILE); }
        else { ctx.moveTo(X, Y + 5); ctx.lineTo(X + TILE, Y + 5); ctx.moveTo(X, Y + 12); ctx.lineTo(X + TILE, Y + 12); }
        ctx.stroke();
        if (h > 0.93) { ctx.fillStyle = 'rgba(80,60,40,0.45)'; ctx.beginPath(); ctx.ellipse(X + 8, Y + 8, 4, 2.5, 0, 0, 7); ctx.fill(); }
      }
      break;
    }
    case G.ROCKROAD: case G.ROCK: {
      speckle(ctx, tx, ty, 8, 6, ['#9d7650', '#cda77a']);
      const n = g === G.ROCK ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const rx = X + 1 + hash2(tx * 9 + i, ty, 61) * 13, ry = Y + 1 + hash2(tx, ty * 9 + i, 62) * 13;
        const rs = 1 + hash2(tx + i, ty + i, 63) * 2.4;
        ctx.fillStyle = 'rgba(40,30,20,0.35)'; ctx.beginPath(); ctx.ellipse(rx + 0.6, ry + 0.8, rs, rs * 0.7, 0, 0, 7); ctx.fill();
        ctx.fillStyle = mix('#8a847a', '#c9c2b4', hash2(i, tx + ty, 64));
        ctx.beginPath(); ctx.ellipse(rx, ry, rs, rs * 0.75, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(rx - rs * 0.3, ry - rs * 0.3, rs * 0.4, rs * 0.3, 0, 0, 7); ctx.fill();
      }
      break;
    }
    case G.SIDEWALK: {
      ctx.strokeStyle = 'rgba(120,110,95,0.35)'; ctx.lineWidth = 0.5;
      ctx.strokeRect(X + 0.25, Y + 0.25, TILE - 0.5, TILE - 0.5);
      speckle(ctx, tx, ty, 4, 5, ['#c7bfae', '#e6dfd0']);
      if (h > 0.97) { ctx.strokeStyle = 'rgba(80,70,60,0.4)'; ctx.beginPath(); ctx.moveTo(X + 3, Y + 2); ctx.lineTo(X + 8, Y + 9); ctx.stroke(); }
      break;
    }
    case G.PLAZA: {
      // cantera slabs in a running bond with a darker border pattern
      ctx.strokeStyle = 'rgba(140,105,80,0.45)'; ctx.lineWidth = 0.5;
      const off = (ty & 1) * 4;
      ctx.beginPath();
      ctx.moveTo(X, Y + 0.25); ctx.lineTo(X + TILE, Y + 0.25);
      ctx.moveTo(X, Y + 8); ctx.lineTo(X + TILE, Y + 8);
      for (let i = off; i < TILE; i += 8) { ctx.moveTo(X + i, Y); ctx.lineTo(X + i, Y + 8); ctx.moveTo(X + ((i + 4) % 16), Y + 8); ctx.lineTo(X + ((i + 4) % 16), Y + 16); }
      ctx.stroke();
      ctx.fillStyle = rgba('#b58d6e', hash2(tx, ty, 90) * 0.18);
      ctx.fillRect(X, Y, 8, 8);
      break;
    }
    case G.MARKET: {
      ctx.strokeStyle = 'rgba(90,80,70,0.25)'; ctx.lineWidth = 0.5;
      ctx.strokeRect(X, Y, 8, 8); ctx.strokeRect(X + 8, Y + 8, 8, 8);
      break;
    }
    case G.WATER: {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 2; i++) {
        const wx = X + hash2(tx + i, ty, 70) * 12, wy = Y + hash2(tx, ty + i, 71) * 14;
        ctx.fillRect(wx, wy, 4, 0.8);
      }
      break;
    }
    case G.COURT: {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(X, Y, TILE, TILE / 2);
      break;
    }
    case G.INFIELD: {
      speckle(ctx, tx, ty, 6, 8, ['#b77a4c', '#d69a6a']);
      break;
    }
    case G.STAIRS: {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#bfb29b' : '#d8cdb8';
        ctx.fillRect(X, Y + i * 4, TILE, 4);
        ctx.fillStyle = 'rgba(70,55,40,0.45)'; ctx.fillRect(X, Y + i * 4 + 3.2, TILE, 0.8);
      }
      break;
    }
    case G.FLOOR_WOOD: {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = mix('#9a6a42', '#b98356', hash2(tx, ty * 4 + i, 5));
        ctx.fillRect(X, Y + i * 4, TILE, 4);
        ctx.fillStyle = 'rgba(60,35,20,0.35)'; ctx.fillRect(X, Y + i * 4 + 3.5, TILE, 0.5);
        ctx.fillRect(X + ((hash2(tx, ty + i, 9) * 16) | 0), Y + i * 4, 0.5, 4);
      }
      break;
    }
    case G.FLOOR_TILE: {
      const dark = (tx + ty) & 1;
      ctx.fillStyle = dark ? '#c9b89c' : '#efe5d2'; ctx.fillRect(X, Y, TILE, TILE);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.4; ctx.strokeRect(X, Y, TILE, TILE);
      if (dark) { ctx.fillStyle = 'rgba(160,70,50,0.25)'; ctx.beginPath(); ctx.moveTo(X + 8, Y + 2); ctx.lineTo(X + 14, Y + 8); ctx.lineTo(X + 8, Y + 14); ctx.lineTo(X + 2, Y + 8); ctx.fill(); }
      break;
    }
    case G.FLOOR_STONE: {
      ctx.strokeStyle = 'rgba(90,75,60,0.35)'; ctx.lineWidth = 0.5; ctx.strokeRect(X, Y, TILE, TILE);
      speckle(ctx, tx, ty, 4, 6, ['#a89a86', '#cabca8']);
      break;
    }
    case G.CARPET: {
      ctx.strokeStyle = 'rgba(230,190,90,0.5)'; ctx.lineWidth = 0.8;
      edgeLines(ctx, map, tx, ty, t => t !== G.CARPET, X, Y, 2);
      break;
    }
    case G.WALL: {
      ctx.fillStyle = '#e9dfcc'; ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = '#b9ab93'; ctx.fillRect(X, Y + TILE - 3, TILE, 3);
      break;
    }
    case G.VOID: {
      ctx.fillStyle = '#16171c'; ctx.fillRect(X, Y, TILE, TILE); break;
    }
  }
}

function pothole(ctx, X, Y, tx, ty) {
  const cx = X + 5 + hash2(tx, ty, 80) * 6, cy = Y + 5 + hash2(tx, ty, 81) * 6;
  const rx = 2.6 + hash2(tx, ty, 82) * 2.5;
  ctx.fillStyle = '#8a847a'; ctx.beginPath(); ctx.ellipse(cx, cy + 0.4, rx + 1, rx * 0.72 + 0.8, 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#34322f'; ctx.beginPath(); ctx.ellipse(cx, cy, rx, rx * 0.7, 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx - 0.6, cy - 0.5, rx * 0.8, rx * 0.45, 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#6d655a'; for (let i = 0; i < 3; i++) ctx.fillRect(cx - 1 + i, cy + (i - 1), 0.9, 0.9);
}

// curb: where road meets sidewalk / plaza / median draw a raised edge on the road tile
function curb(ctx, map, tx, ty, X, Y) {
  const higher = g => g === G.SIDEWALK || g === G.PLAZA || g === G.MEDIAN || g === G.GARDEN;
  if (higher(map.get(tx, ty - 1))) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(X, Y, TILE, 2); }
  if (higher(map.get(tx - 1, ty))) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(X, Y, 1.4, TILE); }
  if (higher(map.get(tx + 1, ty))) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(X + TILE - 1.2, Y, 1.2, TILE); }
  if (higher(map.get(tx, ty + 1))) { ctx.fillStyle = '#cfc6b3'; ctx.fillRect(X, Y + TILE - 1.6, TILE, 1.6); }
}

function edgeLines(ctx, map, tx, ty, test, X, Y, inset = 0.6) {
  ctx.beginPath();
  if (test(map.get(tx, ty - 1))) { ctx.moveTo(X, Y + inset); ctx.lineTo(X + TILE, Y + inset); }
  if (test(map.get(tx, ty + 1))) { ctx.moveTo(X, Y + TILE - inset); ctx.lineTo(X + TILE, Y + TILE - inset); }
  if (test(map.get(tx - 1, ty))) { ctx.moveTo(X + inset, Y); ctx.lineTo(X + inset, Y + TILE); }
  if (test(map.get(tx + 1, ty))) { ctx.moveTo(X + TILE - inset, Y); ctx.lineTo(X + TILE - inset, Y + TILE); }
  ctx.stroke();
}

// Hillshade from elevation: light from the north-west.
function hillshade(ctx, map, x0, y0, x1, y1) {
  for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) {
    if (!map.inb(tx, ty)) continue;
    const e = map.elev[ty * map.w + tx];
    const ex = map.elevAt(tx + 1, ty) - map.elevAt(tx - 1, ty);
    const ey = map.elevAt(tx, ty + 1) - map.elevAt(tx, ty - 1);
    const s = clamp((ex + ey) * 0.09, -0.45, 0.45); // positive -> facing SE (darker)
    if (Math.abs(s) > 0.01) {
      ctx.fillStyle = s > 0 ? `rgba(20,30,50,${s * 0.7})` : `rgba(255,245,210,${-s * 0.45})`;
      ctx.fillRect(tx * TILE, ty * TILE, TILE + 0.5, TILE + 0.5);
    }
    // contour line every 20 m
    const c0 = Math.floor(e / 20), c1 = Math.floor(map.elevAt(tx + 1, ty) / 20), c2 = Math.floor(map.elevAt(tx, ty + 1) / 20);
    if (map.outdoor && (c0 !== c1 || c0 !== c2) && e > 1580) {
      ctx.fillStyle = 'rgba(60,70,30,0.10)';
      ctx.fillRect(tx * TILE, ty * TILE + (c0 !== c2 ? TILE - 1 : 0), c0 !== c1 ? 1 : TILE, c0 !== c2 ? 1 : TILE);
    }
  }
}

export class ChunkCache {
  constructor() { this.map = null; this.scale = 1; this.cache = new Map(); this.max = 22; }
  reset(map, scale) {
    if (map !== this.map || scale !== this.scale || (map && map.version !== this.version)) {
      this.cache.clear(); this.map = map; this.scale = scale; this.version = map ? map.version : 0;
    }
  }
  get(cx, cy) {
    const key = cx + ',' + cy;
    let c = this.cache.get(key);
    if (c) { this.cache.delete(key); this.cache.set(key, c); return c; }
    c = this.render(cx, cy);
    this.cache.set(key, c);
    if (this.cache.size > this.max) this.cache.delete(this.cache.keys().next().value);
    return c;
  }
  // Render a single chunk — used lazily; at most a couple per frame.
  render(cx, cy) {
    const map = this.map, S = this.scale;
    const size = CHUNK * TILE;
    const cv = makeCanvas(size * S, size * S);
    const ctx = cv.getContext('2d');
    ctx.scale(S, S);
    ctx.translate(-cx * size, -cy * size);
    const x0 = cx * CHUNK, y0 = cy * CHUNK;
    for (let ty = y0; ty < y0 + CHUNK; ty++) for (let tx = x0; tx < x0 + CHUNK; tx++) drawTile(ctx, map, tx, ty);
    if (map.outdoor) hillshade(ctx, map, x0, y0, x0 + CHUNK, y0 + CHUNK);
    // baked structures (house blocks, road markings, low walls...) — clipped to the chunk
    ctx.save();
    ctx.beginPath(); ctx.rect(cx * size, cy * size, size, size); ctx.clip();
    const X0 = cx * size, Y0 = cy * size, X1 = X0 + size, Y1 = Y0 + size;
    for (const s of map.structures) {
      const m = (s.margin ?? 2) * TILE;
      if (s.x * TILE - m > X1 || (s.x + s.w) * TILE + m < X0 || s.y * TILE - m > Y1 || (s.y + s.h) * TILE + m < Y0) continue;
      const fn = STRUCTURE_DRAW[s.kind];
      if (fn) fn(ctx, s, map);
    }
    ctx.restore();
    return cv;
  }
}
