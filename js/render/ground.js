// Ground surfaces, baked structures and the chunk cache.
// Every texture is computed in world space (not per tile), so paving, stones and
// grass flow continuously across tile borders — no visible grid.
import { TILE, hash2, fbm, valueNoise, makeCanvas, shade, mix, rgba, clamp } from '../util.js';
import { G, ROADS } from '../world.js';
import { STRUCTURE_DRAW } from './structures.js';

export const CHUNK = 16; // tiles per chunk side

const NATURAL = new Set([G.GRASS, G.FOREST, G.SLOPE, G.FIELD, G.MEDIAN, G.CEMETERY, G.OUTFIELD, G.GARDEN]);
const NAT_COLOR = {
  [G.GRASS]: '#7cab4d', [G.FOREST]: '#6e9c47', [G.SLOPE]: '#75994a', [G.FIELD]: '#93a857', [G.MEDIAN]: '#74a94b',
  [G.CEMETERY]: '#8aa35a', [G.OUTFIELD]: '#6fae4a', [G.GARDEN]: '#6aa546',
};
const FLAT = {
  [G.DIRT]: '#b58e62', [G.DIRTROAD]: '#ae885d', [G.ROCKROAD]: '#a48a6a', [G.ROCK]: '#a09a8e', [G.SAND]: '#c8ab80',
  [G.ASPHALT]: '#303235', [G.WATER]: '#4a8fb0', [G.ROOF]: '#b5654a', [G.COURT]: '#3f8a73', [G.INFIELD]: '#c68657',
  [G.STAIRS]: '#cfc3ae', [G.WALL]: '#efe6d6', [G.VOID]: '#16171c', [G.CARPET]: '#8e2f35', [G.FLOOR_WOOD]: '#a8744a',
  [G.FLOOR_TILE]: '#e4d8c2', [G.FLOOR_STONE]: '#bfb09b', [G.MARKET]: '#cbbfa9', [G.LAJA]: '#b08472',
};

const SUB = 4; // sub-cells per tile edge for smooth colour fields

// ---- world-space patterns -------------------------------------------------------
// jittered lattice vertex, shared by all neighbouring cells => seamless mosaics
function jv(i, j, step, amt, seed) {
  return [i * step + (hash2(i, j, seed) - 0.5) * amt, j * step + (hash2(i, j, seed + 1) - 0.5) * amt];
}
function mosaic(ctx, X, Y, step, seed, colorFn, grout, inset = 0.45, amt = 0.55) {
  const i0 = Math.floor(X / step) - 1, i1 = Math.floor((X + TILE) / step) + 1;
  const j0 = Math.floor(Y / step) - 1, j1 = Math.floor((Y + TILE) / step) + 1;
  ctx.fillStyle = grout; ctx.fillRect(X, Y, TILE, TILE);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const a = jv(i, j, step, step * amt, seed), b = jv(i + 1, j, step, step * amt, seed), c = jv(i + 1, j + 1, step, step * amt, seed), d = jv(i, j + 1, step, step * amt, seed);
    const cx = (a[0] + b[0] + c[0] + d[0]) / 4, cy = (a[1] + b[1] + c[1] + d[1]) / 4;
    const k = inset / step * 2;
    ctx.fillStyle = colorFn(i, j);
    ctx.beginPath();
    for (const [n, p] of [a, b, c, d].entries()) { const px = p[0] + (cx - p[0]) * k, py = p[1] + (cy - p[1]) * k; n ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
    // soft top-left highlight gives each stone a little volume
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.moveTo(a[0] + (cx - a[0]) * k, a[1] + (cy - a[1]) * k); ctx.lineTo(b[0] + (cx - b[0]) * k, b[1] + (cy - b[1]) * k); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
  }
}
function running(ctx, X, Y, w, h, seed, colorFn, grout) { // offset slabs (cantera) in world space
  ctx.fillStyle = grout; ctx.fillRect(X, Y, TILE, TILE);
  const j0 = Math.floor(Y / h) - 1, j1 = Math.floor((Y + TILE) / h) + 1;
  for (let j = j0; j <= j1; j++) {
    const off = (hash2(0, j, seed) * w) | 0;
    const i0 = Math.floor((X - off) / w) - 1, i1 = Math.floor((X + TILE - off) / w) + 1;
    for (let i = i0; i <= i1; i++) {
      ctx.fillStyle = colorFn(i, j);
      ctx.fillRect(i * w + off + 0.3, j * h + 0.3, w - 0.6, h - 0.6);
    }
  }
}
function hexPave(ctx, X, Y, seed) { // hexagonal flagstones with small terracotta diamonds (atrium)
  const r = 5.2, hw = r * Math.sqrt(3);
  ctx.fillStyle = '#8f8a82'; ctx.fillRect(X, Y, TILE, TILE);
  const j0 = Math.floor(Y / (r * 1.5)) - 1, j1 = Math.floor((Y + TILE) / (r * 1.5)) + 1;
  for (let j = j0; j <= j1; j++) {
    const i0 = Math.floor(X / hw) - 1, i1 = Math.floor((X + TILE) / hw) + 1;
    for (let i = i0; i <= i1; i++) {
      const cx = i * hw + (j & 1 ? hw / 2 : 0), cy = j * r * 1.5;
      ctx.fillStyle = mix('#b9b3a8', '#cfc9bd', hash2(i, j, seed));
      ctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const px = cx + Math.cos(a) * (r - 0.4), py = cy + Math.sin(a) * (r - 0.4); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.fill();
      ctx.fillStyle = '#c0674a';
      ctx.beginPath(); ctx.moveTo(cx, cy - r - 0.9); ctx.lineTo(cx + 0.9, cy - r); ctx.lineTo(cx, cy - r + 0.9); ctx.lineTo(cx - 0.9, cy - r); ctx.fill();
    }
  }
}

function natColor(map, g, wx, wy) {
  let c = NAT_COLOR[g];
  const n = fbm(wx * 0.006, wy * 0.006, 3, 3);
  c = mix(c, n > 0.5 ? '#98b95a' : '#56863c', Math.min(0.22, Math.abs(n - 0.5) * 0.7));
  if (map.dry) c = mix(c, '#b9a868', map.dry);
  return c;
}

// Colour of the smooth base field at a world point (natural ground, dirt and rock).
const EARTH = new Set([G.DIRT, G.DIRTROAD, G.SAND, G.ROCKROAD, G.ROCK]);
function baseColor(map, g, wx, wy) {
  if (NATURAL.has(g)) return natColor(map, g, wx, wy);
  if (g === G.DIRT || g === G.DIRTROAD || g === G.SAND) { const n = fbm(wx * 0.03, wy * 0.03, 13, 2); return mix(FLAT[g], n > 0.5 ? '#c9a57a' : '#8f6c48', Math.abs(n - 0.5) * 0.8); }
  if (g === G.ROCK || g === G.ROCKROAD) { const n = fbm(wx * 0.04, wy * 0.04, 17, 2); return mix(FLAT[g], n > 0.5 ? '#bba88c' : '#7e6c55', Math.abs(n - 0.5) * 0.8); }
  if (g === G.ASPHALT) { const n = valueNoise(wx * 0.05, wy * 0.05, 9); return n > 0.6 ? mix(FLAT[g], '#58585a', Math.min(1, (n - 0.6) * 2.2)) : FLAT[g]; }
  return FLAT[g] || '#8a8a80';
}
// A low-resolution colour field for a chunk (+1 tile margin) that is drawn with bilinear smoothing:
// natural ground blends softly from one kind to the next, with no blocks and no grid.
function baseField(map, cx, cy) {
  const n = (CHUNK + 2) * SUB, cv = makeCanvas(n, n), c = cv.getContext('2d');
  const img = c.createImageData(n, n), d = img.data, s = TILE / SUB;
  const tx0 = cx * CHUNK - 1, ty0 = cy * CHUNK - 1;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const tx = tx0 + Math.floor(i / SUB), ty = ty0 + Math.floor(j / SUB);
    const g = map.get(Math.max(0, Math.min(map.w - 1, tx)), Math.max(0, Math.min(map.h - 1, ty)));
    const col = baseColor(map, g, tx0 * TILE + (i + 0.5) * s, ty0 * TILE + (j + 0.5) * s);
    const k = (j * n + i) * 4;
    d[k] = parseInt(col.slice(1, 3), 16); d[k + 1] = parseInt(col.slice(3, 5), 16); d[k + 2] = parseInt(col.slice(5, 7), 16); d[k + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return cv;
}

// Draw one tile in world coordinates (ctx already scaled). With smooth=true the base colour of
// natural/earth tiles has already been laid down by baseField, so only their details are drawn.
export function drawTile(ctx, map, tx, ty, smooth = false) {
  const g = map.get(tx, ty);
  const X = tx * TILE, Y = ty * TILE;
  const h = hash2(tx, ty, 7);
  if (NATURAL.has(g)) {
    if (!smooth) {
      const s = TILE / SUB;
      for (let j = 0; j < SUB; j++) for (let i = 0; i < SUB; i++) {
        ctx.fillStyle = natColor(map, g, X + i * s + s / 2, Y + j * s + s / 2);
        ctx.fillRect(X + i * s, Y + j * s, s + 0.3, s + 0.3);
      }
    }
    grassDetail(ctx, map, g, tx, ty, X, Y, h);
    return;
  }
  if (smooth && EARTH.has(g)) {
    if (g === G.ROCK || g === G.ROCKROAD) pebbles(ctx, tx, ty, X, Y, g === G.ROCK ? 8 : 6, 1.2, 2.6);
    else { pebbles(ctx, tx, ty, X, Y, g === G.DIRTROAD ? 7 : 4, 0.9, 1.3); if (g === G.DIRTROAD && h > 0.94) { ctx.fillStyle = 'rgba(70,50,30,0.4)'; ctx.beginPath(); ctx.ellipse(X + 8, Y + 8, 4, 2.4, h * 9, 0, 7); ctx.fill(); } }
    return;
  }
  switch (g) {
    case G.SIDEWALK: // “Pueblo Mágico” laja: irregular stones set in mortar
      mosaic(ctx, X, Y, 5.2, 11, (i, j) => mix(mix('#a79f92', '#c8bba6', hash2(i, j, 3)), '#b98f7c', hash2(i, j, 4) > 0.82 ? 0.35 : 0), '#7d7468', 0.55, 0.6);
      break;
    case G.CANTERA: // formal sidewalks of the main avenue: cantera slabs
      running(ctx, X, Y, 9, 6, 5, (i, j) => mix('#c9b196', '#dcc6a9', hash2(i, j, 6)), '#9c8670');
      break;
    case G.PLAZA:
      running(ctx, X, Y, 8, 8, 21, (i, j) => mix('#c7b4a0', '#d8c7b3', hash2(i, j, 22)), '#a9957f');
      break;
    case G.HEX: hexPave(ctx, X, Y, 31); break;
    case G.LAJA: // Pueblo Mágico street: big irregular flagstones in pink and brown cantera, pale mortar
      mosaic(ctx, X, Y, 6.6, 77, (i, j) => { const k = hash2(i, j, 78); return mix(mix('#a2766a', '#c79d88', k), '#8d6a5e', hash2(i, j, 79) > 0.85 ? 0.4 : 0); }, '#c9b8a4', 0.5, 0.75);
      curb(ctx, map, tx, ty, X, Y);
      break;
    case G.COBBLE: // empedrado: river stones
      mosaic(ctx, X, Y, 3.4, 41, (i, j) => mix('#6f675c', '#a89c88', hash2(i, j, 42)), '#4d463e', 0.5, 0.7);
      if (isPothole(map, tx, ty)) pothole(ctx, X, Y, tx, ty, map);
      curb(ctx, map, tx, ty, X, Y);
      break;
    case G.ASPHALT: {
      // (the base colour with its worn, greyer patches comes from the smooth field)
      if (!smooth) { ctx.fillStyle = FLAT[G.ASPHALT]; ctx.fillRect(X, Y, TILE, TILE); }
      for (let k = 0; k < 16; k++) {
        const rx = hash2(tx * 31 + k, ty * 17 + k, 3) * TILE, ry = hash2(tx * 13 + k * 3, ty * 29 + k, 8) * TILE;
        ctx.fillStyle = k % 3 ? 'rgba(120,120,118,0.45)' : 'rgba(10,10,12,0.5)'; ctx.fillRect(X + rx, Y + ry, 0.8, 0.8);
      }
      if (h > 0.7 && h < 0.76) {
        ctx.strokeStyle = 'rgba(12,12,14,0.7)'; ctx.lineWidth = 0.5; ctx.beginPath();
        ctx.moveTo(X + 1, Y + 5); ctx.lineTo(X + 6, Y + 8); ctx.lineTo(X + 9, Y + 14); ctx.lineTo(X + 15, Y + 12); ctx.stroke();
      }
      if (isPothole(map, tx, ty)) pothole(ctx, X, Y, tx, ty, map);
      curb(ctx, map, tx, ty, X, Y);
      break;
    }
    case G.DIRT: case G.DIRTROAD: case G.SAND: {
      const s = TILE / SUB;
      for (let j = 0; j < SUB; j++) for (let i = 0; i < SUB; i++) {
        const n = fbm((X + i * s) * 0.03, (Y + j * s) * 0.03, 13, 2);
        ctx.fillStyle = mix(FLAT[g], n > 0.5 ? '#c9a57a' : '#8f6c48', Math.abs(n - 0.5) * 0.8);
        ctx.fillRect(X + i * s, Y + j * s, s + 0.3, s + 0.3);
      }
      pebbles(ctx, tx, ty, X, Y, g === G.DIRTROAD ? 7 : 4, 0.9, 1.3);
      if (g === G.DIRTROAD && h > 0.94) { ctx.fillStyle = 'rgba(70,50,30,0.4)'; ctx.beginPath(); ctx.ellipse(X + 8, Y + 8, 4, 2.4, h * 9, 0, 7); ctx.fill(); }
      break;
    }
    case G.ROCKROAD: case G.ROCK: {
      const s = TILE / SUB;
      for (let j = 0; j < SUB; j++) for (let i = 0; i < SUB; i++) {
        const n = fbm((X + i * s) * 0.04, (Y + j * s) * 0.04, 17, 2);
        ctx.fillStyle = mix(FLAT[g], n > 0.5 ? '#bba88c' : '#7e6c55', Math.abs(n - 0.5) * 0.8);
        ctx.fillRect(X + i * s, Y + j * s, s + 0.3, s + 0.3);
      }
      pebbles(ctx, tx, ty, X, Y, g === G.ROCK ? 8 : 6, 1.2, 2.6);
      break;
    }
    case G.WATER: {
      ctx.fillStyle = FLAT[G.WATER]; ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 2; i++) ctx.fillRect(X + hash2(tx + i, ty, 70) * 12, Y + hash2(tx, ty + i, 71) * 14, 4, 0.7);
      break;
    }
    case G.STAIRS: {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#bfb29b' : '#d4c8b2'; ctx.fillRect(X, Y + i * 4, TILE, 4);
        ctx.fillStyle = 'rgba(70,55,40,0.35)'; ctx.fillRect(X, Y + i * 4 + 3.3, TILE, 0.7);
      }
      break;
    }
    case G.FLOOR_WOOD: {
      ctx.fillStyle = FLAT[g]; ctx.fillRect(X, Y, TILE, TILE);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = mix('#9a6a42', '#b98356', hash2(Math.floor((X + (i & 1) * 8) / 24), ty * 4 + i, 5)); ctx.fillRect(X, Y + i * 4, TILE, 3.7);
        ctx.fillStyle = 'rgba(60,35,20,0.25)'; ctx.fillRect(X, Y + i * 4 + 3.7, TILE, 0.3);
      }
      break;
    }
    case G.FLOOR_TILE: { // mosaic floor (pasta tiles), no grid strokes
      const dark = (tx + ty) & 1;
      ctx.fillStyle = dark ? '#cdbb9e' : '#ece2cf'; ctx.fillRect(X, Y, TILE, TILE);
      ctx.fillStyle = dark ? 'rgba(160,70,50,0.28)' : 'rgba(47,93,154,0.14)';
      ctx.beginPath(); ctx.moveTo(X + 8, Y + 2); ctx.lineTo(X + 14, Y + 8); ctx.lineTo(X + 8, Y + 14); ctx.lineTo(X + 2, Y + 8); ctx.fill();
      break;
    }
    case G.FLOOR_STONE:
      running(ctx, X, Y, 10, 8, 51, (i, j) => mix('#b5a792', '#cbbda8', hash2(i, j, 52)), '#9d8f7b');
      break;
    case G.MARKET:
      running(ctx, X, Y, 8, 8, 61, (i, j) => mix('#c3b8a4', '#d3c9b6', hash2(i, j, 62)), '#b1a592');
      break;
    case G.CARPET: {
      ctx.fillStyle = FLAT[g]; ctx.fillRect(X, Y, TILE, TILE);
      ctx.strokeStyle = 'rgba(230,190,90,0.5)'; ctx.lineWidth = 0.8;
      edgeLines(ctx, map, tx, ty, t => t !== G.CARPET, X, Y, 2);
      break;
    }
    case G.COURT: { ctx.fillStyle = FLAT[g]; ctx.fillRect(X, Y, TILE, TILE); break; }
    case G.INFIELD: { ctx.fillStyle = FLAT[g]; ctx.fillRect(X, Y, TILE, TILE); pebbles(ctx, tx, ty, X, Y, 5, 0.6, 1); break; }
    case G.WALL: { ctx.fillStyle = '#e9dfcc'; ctx.fillRect(X, Y, TILE, TILE); break; }
    default: { ctx.fillStyle = FLAT[g] || '#777'; ctx.fillRect(X, Y, TILE, TILE); }
  }
}

function grassDetail(ctx, map, g, tx, ty, X, Y, h) {
  if (g === G.FIELD) { // furrows running in world space
    ctx.strokeStyle = 'rgba(90,70,40,0.25)'; ctx.lineWidth = 1;
    for (let y = Math.ceil(Y / 4) * 4; y < Y + TILE; y += 4) { ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + TILE, y); ctx.stroke(); }
  }
  const dark = g === G.FOREST ? 'rgba(60,85,40,0.5)' : 'rgba(55,85,35,0.45)';
  ctx.strokeStyle = dark; ctx.lineWidth = 0.55; ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const bx = X + hash2(tx * 5 + i, ty, 11) * TILE, by = Y + hash2(tx, ty * 5 + i, 12) * TILE;
    ctx.moveTo(bx, by); ctx.lineTo(bx + (hash2(i, tx, 3) - 0.5) * 1.6, by - 2.2);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(190,220,120,0.4)'; ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const bx = X + hash2(tx * 7 + i, ty, 21) * TILE, by = Y + hash2(tx, ty * 7 + i, 22) * TILE;
    ctx.moveTo(bx, by); ctx.lineTo(bx + 0.8, by - 1.8);
  }
  ctx.stroke();
  if (g === G.FOREST) { // leaf litter & eucalyptus bark bits
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#8a6a3c', '#a3844f', '#5d7a38'][i % 3]; ctx.fillRect(X + hash2(tx + i, ty, 5) * 15, Y + hash2(tx, ty + i, 6) * 15, 1.4, 0.8); }
  }
  if ((g === G.GRASS || g === G.GARDEN) && h > 0.86) {
    const cols = ['#f4e36a', '#ffffff', '#e889b8', '#f29a4a'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = cols[Math.floor(hash2(tx, ty, 42 + i) * 4)];
      ctx.beginPath(); ctx.arc(X + 3 + hash2(tx + i, ty, 40) * 10, Y + 3 + hash2(tx, ty + i, 41) * 10, 1, 0, 7); ctx.fill();
    }
  }
  if (g === G.CEMETERY && h > 0.6) { ctx.fillStyle = 'rgba(120,90,60,0.3)'; ctx.fillRect(X + 3, Y + 2, 10, 12); }
  if (g === G.GARDEN) { // low cantera border of the planter + the little iron fence of the plaza
    ctx.fillStyle = '#b8a58c';
    const t = (a) => a !== G.GARDEN;
    if (t(map.get(tx, ty - 1))) ctx.fillRect(X, Y, TILE, 1.3);
    if (t(map.get(tx, ty + 1))) ctx.fillRect(X, Y + TILE - 1.3, TILE, 1.3);
    if (t(map.get(tx - 1, ty))) ctx.fillRect(X, Y, 1.3, TILE);
    if (t(map.get(tx + 1, ty))) ctx.fillRect(X + TILE - 1.3, Y, 1.3, TILE);
  }
  if (g === G.MEDIAN) {
    ctx.fillStyle = '#d9d2c2';
    const t = (a) => a !== G.MEDIAN;
    if (t(map.get(tx - 1, ty))) ctx.fillRect(X, Y, 1.6, TILE);
    if (t(map.get(tx + 1, ty))) ctx.fillRect(X + TILE - 1.6, Y, 1.6, TILE);
    if (t(map.get(tx, ty - 1))) ctx.fillRect(X, Y, TILE, 1.6);
    if (t(map.get(tx, ty + 1))) ctx.fillRect(X, Y + TILE - 1.6, TILE, 1.6);
  }
}

function pebbles(ctx, tx, ty, X, Y, n, r0, r1) {
  for (let i = 0; i < n; i++) {
    const rx = X + 1 + hash2(tx * 9 + i, ty, 61) * 14, ry = Y + 1 + hash2(tx, ty * 9 + i, 62) * 14;
    const rs = r0 + hash2(tx + i, ty + i, 63) * (r1 - r0);
    ctx.fillStyle = 'rgba(40,30,20,0.3)'; ctx.beginPath(); ctx.ellipse(rx + 0.4, ry + 0.6, rs, rs * 0.7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = mix('#8a847a', '#c9c2b4', hash2(i, tx + ty, 64));
    ctx.beginPath(); ctx.ellipse(rx, ry, rs, rs * 0.75, 0, 0, 7); ctx.fill();
  }
}

// Potholes only in the driving lanes of streets (not on plazas or atriums).
export function isPothole(map, tx, ty) {
  if (!map.potholes || !map.laneDir || !map.laneDir[ty * map.w + tx]) return false;
  const g = map.get(tx, ty), h = hash2(tx, ty, 7);
  return (g === G.ASPHALT && h > 0.955) || (g === G.COBBLE && h > 0.978);
}
export function potholeGeom(tx, ty) {
  const X = tx * TILE, Y = ty * TILE;
  const cx = X + 5 + hash2(tx, ty, 80) * 6, cy = Y + 5 + hash2(tx, ty, 81) * 6;
  const rx = 2.4 + hash2(tx, ty, 82) * 3.2;
  const pts = [];
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2, j = 0.7 + hash2(tx * 7 + k, ty * 3 + k, 83) * 0.55;
    pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * rx * 0.68 * j]);
  }
  return { cx, cy, rx, pts };
}
function pothole(ctx, X, Y, tx, ty, map) {
  const { cx, cy, rx, pts } = potholeGeom(tx, ty);
  const path = (k) => { ctx.beginPath(); pts.forEach(([x, y], i) => { const px = cx + (x - cx) * k, py = cy + (y - cy) * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath(); };
  // crumbled rim of broken asphalt, then the hole: dark, with gravel at the bottom and a shadowed upper lip
  ctx.fillStyle = '#4a4843'; path(1.28); ctx.fill();
  ctx.fillStyle = '#6a655b'; path(1.08); ctx.fill();
  ctx.fillStyle = '#2a2622'; path(1); ctx.fill();
  ctx.fillStyle = '#3b352d'; ctx.beginPath(); ctx.ellipse(cx + 0.4, cy + rx * 0.18, rx * 0.72, rx * 0.36, 0, 0, 7); ctx.fill();
  for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 3 ? '#7b7466' : '#958c7c'; ctx.fillRect(cx - rx * 0.6 + hash2(tx + i, ty, 84) * rx * 1.2, cy - rx * 0.1 + hash2(tx, ty + i, 85) * rx * 0.5, 0.7, 0.6); }
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(cx, cy - rx * 0.42, rx * 0.8, rx * 0.2, 0, 0, 7); ctx.fill();
  // loose chunks around it
  for (let i = 0; i < 4; i++) { const a = hash2(tx, ty, 90 + i) * 6.28, d = rx * (1.35 + hash2(tx, ty, 95 + i) * 0.5); ctx.fillStyle = '#55524b'; ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 1.1, 0.8); }
}

// curb: where the road meets a raised surface, draw the cantera curb and its shadow
const RAISED = new Set([G.SIDEWALK, G.CANTERA, G.PLAZA, G.MEDIAN, G.GARDEN, G.HEX]);
function curb(ctx, map, tx, ty, X, Y) {
  if (RAISED.has(map.get(tx, ty - 1))) { ctx.fillStyle = '#b3a590'; ctx.fillRect(X, Y, TILE, 1.4); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X, Y + 1.4, TILE, 1.2); }
  if (RAISED.has(map.get(tx - 1, ty))) { ctx.fillStyle = '#b3a590'; ctx.fillRect(X, Y, 1.3, TILE); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(X + 1.3, Y, 1, TILE); }
  if (RAISED.has(map.get(tx + 1, ty))) { ctx.fillStyle = '#b3a590'; ctx.fillRect(X + TILE - 1.3, Y, 1.3, TILE); }
  if (RAISED.has(map.get(tx, ty + 1))) { ctx.fillStyle = '#cdbfaa'; ctx.fillRect(X, Y + TILE - 2, TILE, 2); }
}

function edgeLines(ctx, map, tx, ty, test, X, Y, inset = 0.6) {
  ctx.beginPath();
  if (test(map.get(tx, ty - 1))) { ctx.moveTo(X, Y + inset); ctx.lineTo(X + TILE, Y + inset); }
  if (test(map.get(tx, ty + 1))) { ctx.moveTo(X, Y + TILE - inset); ctx.lineTo(X + TILE, Y + TILE - inset); }
  if (test(map.get(tx - 1, ty))) { ctx.moveTo(X + inset, Y); ctx.lineTo(X + inset, Y + TILE); }
  if (test(map.get(tx + 1, ty))) { ctx.moveTo(X + TILE - inset, Y); ctx.lineTo(X + TILE - inset, Y + TILE); }
  ctx.stroke();
}

// Smooth hill shading from the elevation field (bilinear, sub-tile), light from the north-west.
function elevAtW(map, wx, wy) {
  const fx = wx / TILE - 0.5, fy = wy / TILE - 0.5;
  const x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0;
  const e = (x, y) => map.elevAt(x, y);
  return (e(x0, y0) * (1 - u) + e(x0 + 1, y0) * u) * (1 - v) + (e(x0, y0 + 1) * (1 - u) + e(x0 + 1, y0 + 1) * u) * v;
}
// Relief shading as a smooth low-resolution alpha field (no per-cell rectangles, so no seams).
function hillshade(ctx, map, x0, y0, x1, y1) {
  const s = TILE / SUB, n = (x1 - x0 + 2) * SUB, m = (y1 - y0 + 2) * SUB;
  const cv = makeCanvas(n, m), c = cv.getContext('2d'), img = c.createImageData(n, m), d = img.data;
  const ox = (x0 - 1) * TILE, oy = (y0 - 1) * TILE;
  let any = false;
  for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
    const wx = ox + (i + 0.5) * s, wy = oy + (j + 0.5) * s;
    const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    if (!map.inb(tx, ty)) continue;
    const g = map.get(tx, ty);
    const flatSurface = !NATURAL.has(g) && !EARTH.has(g);
    const ex = elevAtW(map, wx + s, wy) - elevAtW(map, wx - s, wy);
    const ey = elevAtW(map, wx, wy + s) - elevAtW(map, wx, wy - s);
    const sh = clamp((ex + ey) * 0.55, -0.4, 0.4) * (flatSurface ? 0.4 : 1);
    const k = (j * n + i) * 4;
    if (sh > 0) { d[k] = 25; d[k + 1] = 30; d[k + 2] = 55; d[k + 3] = Math.round(sh * 0.75 * 255); }
    else { d[k] = 255; d[k + 1] = 244; d[k + 2] = 205; d[k + 3] = Math.round(-sh * 0.5 * 255); }
    if (d[k + 3] > 2) any = true;
  }
  if (!any) return;
  c.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(cv, ox, oy, (x1 - x0 + 2) * TILE, (y1 - y0 + 2) * TILE);
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
  render(cx, cy) {
    const map = this.map, S = this.scale;
    const size = CHUNK * TILE;
    const cv = makeCanvas(Math.round(size * S), Math.round(size * S));
    const ctx = cv.getContext('2d');
    ctx.scale(cv.width / size, cv.height / size);
    ctx.translate(-cx * size, -cy * size);
    const x0 = cx * CHUNK, y0 = cy * CHUNK;
    ctx.fillStyle = map.interior ? '#14151a' : '#6f7a58'; ctx.fillRect(cx * size, cy * size, size, size);
    const smooth = !map.interior;
    if (smooth) {
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      // sub-cell centres line up with the field's pixel centres; the half-subcell offset is built in
      ctx.drawImage(baseField(map, cx, cy), (cx * CHUNK - 1) * TILE, (cy * CHUNK - 1) * TILE, (CHUNK + 2) * TILE, (CHUNK + 2) * TILE);
    }
    // draw one tile of margin all round (clipped) so nothing ends exactly at the chunk edge
    ctx.save(); ctx.beginPath(); ctx.rect(cx * size, cy * size, size, size); ctx.clip();
    for (let ty = y0; ty < y0 + CHUNK; ty++) for (let tx = x0; tx < x0 + CHUNK; tx++) {
      // the clip overlaps its neighbours slightly: anti-aliased clip edges would otherwise leave
      // half-transparent seams between tiles (the textures are world-space, so the overlap is invisible)
      const o = 1 / S;
      ctx.save(); ctx.beginPath(); ctx.rect(tx * TILE - o, ty * TILE - o, TILE + 2 * o, TILE + 2 * o); ctx.clip();
      drawTile(ctx, map, tx, ty, smooth);
      ctx.restore();
    }
    if (map.outdoor) hillshade(ctx, map, x0, y0, x0 + CHUNK, y0 + CHUNK);
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
