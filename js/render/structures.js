// Baked (flat-sorted) structures: rows of houses, road paint, courts, low walls.
// Everything here is drawn into ground chunks, in world units.
import { TILE, hash2, rng, mix, shade, rgba, pick, roundRect } from '../util.js';

export const STRUCTURE_DRAW = {};

// Palette of the Jiquilpan historic centre: white walls with an oxide-red
// guardapolvo (lower band), clay tile eaves, wooden doors, iron window grilles.
const WALLS = ['#f4efe4', '#f7f2e8', '#efe7d7', '#f2ece0'];
const OUTSKIRT_WALLS = ['#f0e4c8', '#f0a35e', '#d9e3cf', '#f1c0b0', '#e4d6ef', '#f5d36b', '#9fcbb8', '#f0efe8', '#e98f8f', '#c9dde6'];
const BANDS = ['#8e2f24', '#9b3526', '#86291f'];
const DOORS = ['#6b3f22', '#5a331d', '#7a4a28', '#4d6a4f', '#3e5670'];
const SIGNS = ['ABARROTES', 'FARMACIA', 'PAPELERÍA', 'TIENDITA', 'ESTÉTICA', 'REFACCIONES', 'CREMERÍA', 'FERRETERÍA',
  'ZAPATERÍA', 'PURIFICADORA', 'DULCERÍA', 'MISCELÁNEA', 'NOVEDADES', 'CIBER', 'CARNES', 'RECAUDERÍA', 'TLAPALERÍA',
  'MERCERÍA', 'PALETERÍA', 'ÓPTICA', 'LAVANDERÍA', 'CELULARES', 'FRUTERÍA', 'REGALOS'];

function roofTiles(ctx, x, y, w, h, color, seed) {
  // clay "tejas": rows of half-cylinders
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
  for (let j = 0; j < h; j += 3) {
    ctx.fillStyle = rgba(shade(color, -0.35), 0.5);
    ctx.fillRect(x, y + j + 2.2, w, 0.8);
    for (let i = (j / 3) % 2 ? 1.5 : 0; i < w; i += 3) {
      const v = hash2(Math.floor(x + i), Math.floor(y + j), seed);
      ctx.fillStyle = rgba(v > 0.5 ? '#ffffff' : '#000000', 0.06 + v * 0.05);
      ctx.fillRect(x + i, y + j, 1.4, 2.2);
    }
  }
}

function azotea(ctx, x, y, w, h, seed, r) {
  // flat concrete roof with parapet, water tank, sometimes clothes line
  ctx.fillStyle = mix('#cfc6b6', '#b8b0a2', r()); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + r() * w, y + r() * h, 3 + r() * 6, 2 + r() * 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2; ctx.strokeRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.6; ctx.strokeRect(x + 1.6, y + 1.6, w - 3.2, h - 3.2);
  if (w > 10 && h > 8 && r() < 0.8) { // tinaco (black water tank)
    const tx = x + 3 + r() * (w - 10), ty = y + 2 + r() * (h - 9);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(tx + 4, ty + 6.5, 4, 2, 0, 0, 7); ctx.fill();
    const beige = r() < 0.35; // Citijal tinacos: black or beige, with their blue band
    ctx.fillStyle = beige ? '#d8cda6' : '#2a2b2e'; ctx.fillRect(tx, ty + 1, 7, 5);
    ctx.fillStyle = beige ? '#ece3c4' : '#3b3c40'; ctx.beginPath(); ctx.ellipse(tx + 3.5, ty + 1, 3.5, 1.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a5ea8'; ctx.fillRect(tx, ty + 3.2, 7, 0.8);
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.ellipse(tx + 3.5, ty + 0.8, 1.2, 0.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(tx + 1, ty + 2, 1, 3.5);
  }
  if (w > 14 && r() < 0.45) { // tendedero
    const ly = y + 3 + r() * (h - 6);
    ctx.strokeStyle = 'rgba(60,60,60,0.6)'; ctx.lineWidth = 0.3;
    ctx.beginPath(); ctx.moveTo(x + 2, ly); ctx.lineTo(x + w - 2, ly); ctx.stroke();
    const cols = ['#e05a4f', '#4f7fe0', '#f5f0e6', '#f0c34a', '#6bbf7a', '#d77fd0'];
    for (let i = x + 3; i < x + w - 4; i += 2.5 + r() * 2) {
      ctx.fillStyle = pick(r, cols); ctx.fillRect(i, ly, 1.8, 2.2 + r());
    }
  }
}

function courtyardTree(ctx, cx, cy, s, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 3, s, s * 0.8, 0, 0, 7); ctx.fill();
  const greens = ['#4f8a3c', '#5e9a45', '#3f7535', '#6aa84c'];
  for (let i = 0; i < 6; i++) {
    const a = r() * 6.28, d = r() * s * 0.5;
    ctx.fillStyle = pick(r, greens);
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s * (0.45 + r() * 0.3), 0, 7); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,220,0.18)'; ctx.beginPath(); ctx.arc(cx - s * 0.3, cy - s * 0.3, s * 0.35, 0, 7); ctx.fill();
}

// A facade for one lot seen from the south, `fh` units tall, occupying [x, x+w] and ending at baseY.
export function drawFacade(ctx, x, baseY, w, fh, opts, r) {
  const top = baseY - fh;
  const wall = opts.wall || (opts.centro ? pick(r, WALLS) : pick(r, opts.outskirts ? OUTSKIRT_WALLS : WALLS));
  const band = opts.band || (opts.outskirts && r() < 0.5 ? shade(wall, -0.25) : pick(r, BANDS));
  // wall body with subtle vertical gradient
  const grad = ctx.createLinearGradient(0, top, 0, baseY);
  grad.addColorStop(0, shade(wall, 0.02)); grad.addColorStop(1, shade(wall, -0.07));
  ctx.fillStyle = grad; ctx.fillRect(x, top, w, fh);
  // guardapolvo
  const bandH = Math.min(7, fh * 0.28);
  ctx.fillStyle = band; ctx.fillRect(x, baseY - bandH, w, bandH);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, baseY - bandH, w, 0.6);
  // wear stains
  ctx.fillStyle = 'rgba(120,100,70,0.08)';
  for (let i = 0; i < 3; i++) ctx.fillRect(x + r() * w, top + 4 + r() * (fh - 10), 1 + r() * 3, 3 + r() * 6);
  // lot divider pilaster
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(x, top, 0.7, fh);
  // tile eave (tejaban) on top with its shadow
  if (opts.eave !== false) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x, top, w, 2.4);
    ctx.fillStyle = opts.eaveColor || '#a9523a'; ctx.fillRect(x - 0.5, top - 2.6, w + 1, 2.8);
    ctx.fillStyle = '#c56a4c';
    for (let i = x; i < x + w; i += 2) ctx.fillRect(i, top - 2.6, 1.1, 2.4);
    // wooden vigas under the eave
    ctx.fillStyle = '#5a3a22';
    for (let i = x + 1.5; i < x + w - 1; i += 4) ctx.fillRect(i, top + 0.1, 0.9, 1.4);
  } else {
    ctx.fillStyle = shade(wall, -0.15); ctx.fillRect(x, top - 1.5, w, 1.5);
  }
  // openings
  const kind = opts.kind || (r() < 0.35 ? 'shop' : 'house');
  const doorW = opts.doorW ?? (kind === 'shop' ? Math.min(w - 4, 12 + r() * 4) : 5.5 + r() * 1.5);
  const doorX = opts.doorX ?? (kind === 'shop' ? x + (w - doorW) / 2 : x + 2 + r() * Math.max(0, w - doorW - 4));
  const doorH = Math.min(fh - 5, kind === 'shop' ? 13 : 12);
  if (kind === 'shop') {
    // roll-up metal curtain partially open, shop interior visible
    ctx.fillStyle = '#3a3129'; ctx.fillRect(doorX, baseY - doorH, doorW, doorH);
    ctx.fillStyle = '#6d5e4c';
    for (let i = 0; i < 4; i++) { ctx.fillStyle = pick(r, ['#e2b04a', '#d4553d', '#5aa0d8', '#6ec07a', '#f3eee4']); ctx.fillRect(doorX + 1 + i * (doorW - 2) / 4, baseY - doorH + 5, (doorW - 2) / 4 - 0.5, 3); }
    ctx.fillStyle = '#9ea3a8'; ctx.fillRect(doorX, baseY - doorH, doorW, 3.5);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 3.5; i += 0.9) ctx.fillRect(doorX, baseY - doorH + i, doorW, 0.3);
    // hand-painted sign
    const sign = opts.sign || pick(r, SIGNS);
    const sy = top + 2.2, sh = Math.max(4, fh - doorH - 4.5);
    if (sh > 3.5) {
      ctx.fillStyle = opts.signBg || pick(r, ['#f6f1e6', '#f3d36b', '#e8efe9', '#fbe3d6']);
      ctx.fillRect(x + 1.5, sy, w - 3, sh);
      ctx.fillStyle = opts.signFg || pick(r, ['#7a1f1a', '#1f4b7a', '#205a2e', '#222']);
      fitText(ctx, sign, x + w / 2, sy + sh / 2 + 0.3, w - 5, sh * 0.72);
    }
  } else {
    // wooden door (sometimes arched) with frame of cantera
    ctx.fillStyle = '#d7c3a5'; ctx.fillRect(doorX - 0.8, baseY - doorH - 0.8, doorW + 1.6, doorH + 0.8);
    const dc = pick(r, DOORS);
    ctx.fillStyle = dc; ctx.fillRect(doorX, baseY - doorH, doorW, doorH);
    ctx.fillStyle = shade(dc, -0.25); ctx.fillRect(doorX + doorW / 2 - 0.2, baseY - doorH, 0.4, doorH);
    ctx.fillStyle = shade(dc, 0.15);
    ctx.fillRect(doorX + 0.8, baseY - doorH + 1.5, doorW / 2 - 1.3, doorH / 2 - 2);
    ctx.fillRect(doorX + doorW / 2 + 0.5, baseY - doorH + 1.5, doorW / 2 - 1.3, doorH / 2 - 2);
    ctx.fillStyle = '#d9b24a'; ctx.fillRect(doorX + doorW / 2 + 0.6, baseY - doorH / 2, 0.7, 0.7);
    // windows with herrería
    const nw = Math.floor((w - doorW - 4) / 7);
    let wx = x + 2;
    for (let i = 0; i < nw; i++) {
      if (wx + 5 > doorX - 1 && wx < doorX + doorW + 1) wx = doorX + doorW + 1.5;
      if (wx + 5 > x + w - 1) break;
      window1(ctx, wx, baseY - doorH + 1, 5, 7, r, opts.flower, false, opts.centro);
      wx += 7;
    }
  }
  if (opts.barandal && kind === 'house') { // low iron railing (barandal) closing a narrow front patio
    ctx.fillStyle = '#1d1d1f';
    for (const [a, b] of [[x + 1, doorX - 1.2], [doorX + doorW + 1.2, x + w - 1]]) {
      if (b - a < 3) continue;
      ctx.fillRect(a, baseY - 5.2, b - a, 0.6); ctx.fillRect(a, baseY - 0.8, b - a, 0.5);
      for (let i = a; i <= b; i += 1.2) ctx.fillRect(i, baseY - 5.2, 0.3, 5);
      for (let i = a + 0.6; i < b; i += 2.4) { ctx.beginPath(); ctx.arc(i, baseY - 3.6, 0.5, 0, 7); ctx.fill(); }
    }
    ctx.fillStyle = '#2f6a2a'; for (let i = x + 2; i < x + w - 2; i += 5) { if (i > doorX - 2 && i < doorX + doorW + 1) continue; ctx.beginPath(); ctx.arc(i, baseY - 6, 1.4, 0, 7); ctx.fill(); }
  }
  if (fh > 42) { // second storey windows / balcony
    for (let wx = x + 2.5; wx + 5 < x + w - 1; wx += 8) window1(ctx, wx, top + 5, 5, 8, r, false, true, opts.centro);
  }
  if (opts.outskirts && !opts.sign && r() < 0.22) { // an unfinished second floor: bare brick, grey concrete posts, rebar
    const bh = 10;
    ctx.fillStyle = '#b8664a'; ctx.fillRect(x + 1, top - bh - 2.6, w - 2, bh);
    ctx.fillStyle = 'rgba(80,30,20,0.35)'; for (let yy = top - bh - 2; yy < top - 2.6; yy += 1.6) ctx.fillRect(x + 1, yy, w - 2, 0.3);
    ctx.fillStyle = '#9a9690'; for (const px of [x + 1, x + w - 3]) ctx.fillRect(px, top - bh - 2.6, 2, bh);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 0.3; for (const px of [x + 1.6, x + 2.4, x + w - 2.4, x + w - 1.6]) { ctx.beginPath(); ctx.moveTo(px, top - bh - 2.6); ctx.lineTo(px, top - bh - 6.5); ctx.stroke(); }
  }
  // occasional details: number plate, lamp, plants, wires
  if (r() < 0.35) { ctx.fillStyle = '#2f5d9a'; ctx.fillRect(doorX + doorW + 0.6, baseY - doorH - 2, 2.2, 1.6); ctx.fillStyle = '#fff'; ctx.fillRect(doorX + doorW + 1.1, baseY - doorH - 1.5, 1.2, 0.5); }
  if (r() < 0.25) { // potted plants by the door
    for (const px of [doorX - 3, doorX + doorW + 1]) {
      ctx.fillStyle = '#b5533a'; ctx.fillRect(px, baseY - 3, 2.2, 3);
      ctx.fillStyle = pick(r, ['#4f9a3a', '#3c7f35']); ctx.beginPath(); ctx.arc(px + 1.1, baseY - 4, 1.8, 0, 7); ctx.fill();
      if (r() < 0.6) { ctx.fillStyle = pick(r, ['#e84a6a', '#f2a93b', '#ffffff']); ctx.beginPath(); ctx.arc(px + 1.5, baseY - 4.5, 0.6, 0, 7); ctx.fill(); }
    }
  }
}

function window1(ctx, x, y, w, h, r, flower, upper, centro) {
  ctx.fillStyle = centro ? '#a64a3a' : '#d4c1a3'; ctx.fillRect(x - 0.7, y - 0.7, w + 1.4, h + 1.6);
  if (centro) { ctx.fillStyle = '#a64a3a'; ctx.fillRect(x - 1.4, y - 2.2, w + 2.8, 1.2); } // cantera lintel moulding
  ctx.fillStyle = r() < 0.5 ? '#2c3a44' : '#41505c'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(180,210,230,0.25)'; ctx.fillRect(x + 0.4, y + 0.4, w * 0.4, h - 0.8);
  // wooden shutters half open
  if (r() < 0.4) { ctx.fillStyle = '#6b4526'; ctx.fillRect(x - 1.6, y, 1.4, h); ctx.fillRect(x + w + 0.2, y, 1.4, h); }
  // iron grille
  ctx.strokeStyle = '#1d1d1f'; ctx.lineWidth = 0.35; ctx.beginPath();
  for (let i = x + 1; i < x + w; i += 1.25) { ctx.moveTo(i, y); ctx.lineTo(i, y + h); }
  ctx.moveTo(x, y + h * 0.35); ctx.lineTo(x + w, y + h * 0.35);
  ctx.stroke();
  if (upper && r() < 0.5) { // balcony rail
    ctx.fillStyle = '#1d1d1f'; ctx.fillRect(x - 1, y + h - 1, w + 2, 0.6);
    for (let i = x - 1; i <= x + w + 1; i += 1) ctx.fillRect(i, y + h - 1, 0.3, 2.5);
  }
  if (flower || r() < 0.2) {
    ctx.fillStyle = '#b5533a'; ctx.fillRect(x - 0.5, y + h, w + 1, 1.2);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = pick(r, ['#e84a6a', '#f2a93b', '#ffffff', '#4f9a3a', '#c83dab']); ctx.beginPath(); ctx.arc(x + 0.5 + i * 1.4, y + h - 0.2, 0.8, 0, 7); ctx.fill(); }
  }
}

// Deterministic list of the street-facing lots of a block (shared by the renderer and
// by the map builder, which puts a door on every lot).
export const SURNAMES = ['Farías', 'Betancourt', 'Valencia', 'Moreno', 'Cárdenas', 'Silva', 'Martínez', 'Flores', 'Núñez', 'Grimaldo', 'Méndez', 'Mendoza', 'Ochoa', 'Coit', 'Ceja', 'Villaseñor', 'Zepeda', 'Manzo', 'Arteaga', 'Sánchez', 'Barragán', 'Amezcua', 'Ortiz', 'Pulido', 'Chávez'];
const pickNot = (r, list, not) => { let v = pick(r, list); if (v === not) v = list[(list.indexOf(v) + 1) % list.length]; return v; };
// Sign lettering that always stays inside its board (it used to spill onto the neighbour's facade).
export function fitText(ctx, str, cx, cy, maxW, maxH, color) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let size = maxH;
  ctx.font = `bold ${size}px "Trebuchet MS", sans-serif`;
  const w = ctx.measureText(str).width;
  if (w > maxW) { size = size * maxW / w; ctx.font = `bold ${size}px "Trebuchet MS", sans-serif`; }
  if (color) ctx.fillStyle = color;
  ctx.fillText(str, cx, cy);
}
export function blockLots(s) {
  if (s._lots) return s._lots;
  const X = s.x * TILE, W = s.w * TILE;
  const r = rng((s.seed || 1) * 3 + 17);
  const fh = s.facadeH ?? 36;
  const out = [];
  let x = X;
  while (x < X + W - 0.1) {
    let lw = (4 + Math.floor(r() * 4)) * 8 + 8;
    if (X + W - x < lw + 20) lw = X + W - x;
    const lr = rng(Math.floor(x * 13 + (s.seed || 1)));
    const kind = s.allHouses ? 'house' : (lr() < (s.outskirts ? 0.22 : 0.42) ? 'shop' : 'house');
    const doorW = kind === 'shop' ? Math.min(lw - 4, 12 + lr() * 4) : 5.5 + lr() * 1.5;
    const doorX = kind === 'shop' ? x + (lw - doorW) / 2 : x + 2 + lr() * Math.max(0, lw - doorW - 4);
    const tall = !s.outskirts && lr() < (s.centro ? 0.5 : 0.2);
    out.push({ x, w: lw, kind, doorW, doorX, fh: fh + (tall ? 8 : 0), barandal: kind === 'house' && lr() < 0.35, ocote: kind === 'house' && lr() < 0.12,
      sign: pickNot(lr, SIGNS, out.length ? out[out.length - 1].sign : null), surname: pick(lr, SURNAMES), seed: Math.floor(x * 13 + (s.seed || 1)) });
    x += lw;
  }
  s._lots = out;
  return out;
}

// ---------------------------------------------------------------------
// A full city block ("manzana"): roofs, a south row of facades, courtyard.
STRUCTURE_DRAW.block = (ctx, s) => {
  const r = rng(s.seed || (s.x * 928371 + s.y * 1237));
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  const fh = s.facadeH ?? 36; // facade height in world units
  const outskirts = !!s.outskirts;
  // cast shadow to the south-east
  ctx.fillStyle = 'rgba(20,20,40,0.22)';
  ctx.fillRect(X + 4, Y + H, W, 3); ctx.fillRect(X + W, Y + 5, 4, H - 2);
  // roofs: split the block into lots along each edge
  const roofBottom = Y + H - fh;
  // back rows (north)
  let x = X;
  while (x < X + W - 0.1) {
    const lw = Math.min(X + W - x, (3 + Math.floor(r() * 4)) * TILE / 2 + 16);
    const depth = Math.min(H - fh, (roofBottom - Y) * (0.35 + r() * 0.2));
    if (!outskirts && r() < 0.45) roofTiles(ctx, x, Y, lw, depth, pick(r, ['#b0583d', '#a24f37', '#bd6446']), s.seed);
    else azotea(ctx, x, Y, lw, depth, s.seed, r);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + lw - 0.6, Y, 0.6, depth);
    x += lw;
  }
  // courtyard / middle
  const midY = Y + (roofBottom - Y) * 0.5, midH = Math.max(0, (roofBottom - Y) * 0.2);
  if (midH > 4) {
    ctx.fillStyle = outskirts ? '#9a8a6a' : '#b7a58a'; ctx.fillRect(X + 6, midY, W - 12, midH);
    if (W > 80) courtyardTree(ctx, X + W * (0.3 + r() * 0.4), midY + midH / 2, 8 + r() * 5, r);
  }
  // front rows (south) roofs just above the facades
  const specs = fh > 0 ? blockLots(s) : [];
  const lots = specs.map(l => [l.x, l.w, l]);
  for (const [x, lw] of lots) {
    const depth = (roofBottom - Y) * (0.3 + r() * 0.15);
    const ry = roofBottom - depth;
    if (!outskirts && r() < 0.55) roofTiles(ctx, x, ry, lw, depth, pick(r, ['#b0583d', '#a24f37', '#bd6446', '#b86a4c']), s.seed + 3);
    else azotea(ctx, x, ry, lw, depth, s.seed + 1, r);
  }
  // side lots (east / west edges)
  for (const side of [0, 1]) {
    const sx = side ? X + W - 14 : X;
    let y = Y + 4;
    while (y < roofBottom - 10) {
      const lh = 20 + r() * 20;
      const h2 = Math.min(lh, roofBottom - y - 4);
      if (h2 < 6) break;
      if (!outskirts && r() < 0.5) roofTiles(ctx, sx, y, 14, h2, '#ab5a3f', s.seed + 9); else azotea(ctx, sx, y, 14, h2, s.seed + 2, r);
      y += lh;
    }
  }
  // outline
  ctx.strokeStyle = 'rgba(40,25,20,0.35)'; ctx.lineWidth = 0.8; ctx.strokeRect(X + 0.4, Y + 0.4, W - 0.8, roofBottom - Y);
  // facades
  const overrides = s.facades || [];
  const exact = overrides.filter(o => o.exact);
  for (const [lx, lw, spec] of lots) {
    if (exact.some(o => o.x * TILE < lx + lw - 2 && (o.x + o.w) * TILE > lx + 2)) {
      // partially covered lot: draw only the uncovered part as plain wall
      const ranges = [];
      let cur = lx;
      for (const o of exact.slice().sort((a, b) => a.x - b.x)) {
        const ox0 = o.x * TILE, ox1 = (o.x + o.w) * TILE;
        if (ox1 <= lx || ox0 >= lx + lw) continue;
        if (ox0 > cur) ranges.push([cur, ox0 - cur]);
        cur = Math.max(cur, ox1);
      }
      if (cur < lx + lw) ranges.push([cur, lx + lw - cur]);
      for (const [rx, rw] of ranges) if (rw > 6) drawFacade(ctx, rx, Y + H, rw, fh, { outskirts, kind: 'house' }, rng(Math.floor(rx * 13 + s.seed)));
      continue;
    }
    const ov = overrides.find(o => !o.exact && o.x * TILE >= lx - 1 && o.x * TILE < lx + lw);
    const lotR = rng(spec.seed + 5);
    drawFacade(ctx, lx, Y + H, lw, spec.fh, { outskirts, centro: s.centro, kind: spec.kind, doorX: spec.doorX, doorW: spec.doorW, barandal: spec.barandal, sign: spec.sign, ...(ov || {}) }, lotR);
  }
  // named overrides that carry their own exact position (e.g. famous shops)
  for (const o of overrides) {
    if (o.exact) drawFacade(ctx, o.x * TILE, Y + H, o.w * TILE, o.fh || fh, { ...o, outskirts }, rng(o.x * 7 + 1));
  }
};

// Road paint --------------------------------------------------------
STRUCTURE_DRAW.laneH = (ctx, s) => { // dashed centre line along a horizontal street
  ctx.fillStyle = s.color || 'rgba(245,215,90,0.85)';
  const y = (s.y + s.h / 2) * TILE - 0.5;
  for (let x = s.x * TILE; x < (s.x + s.w) * TILE; x += 10) ctx.fillRect(x, y, 5, 1);
};
STRUCTURE_DRAW.laneV = (ctx, s) => {
  ctx.fillStyle = s.color || 'rgba(245,215,90,0.85)';
  const x = (s.x + s.w / 2) * TILE - 0.5;
  for (let y = s.y * TILE; y < (s.y + s.h) * TILE; y += 10) ctx.fillRect(x, y, 1, 5);
};
STRUCTURE_DRAW.zebra = (ctx, s) => {
  ctx.fillStyle = 'rgba(245,242,230,0.8)';
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  if (s.vertical) for (let y = Y + 1; y < Y + H; y += 3.2) ctx.fillRect(X + 1, y, W - 2, 1.6);
  else for (let x = X + 1; x < X + W; x += 3.2) ctx.fillRect(x, Y + 1, 1.6, H - 2);
};
STRUCTURE_DRAW.tope = (ctx, s) => { // speed bump, yellow & black
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE;
  for (let x = X; x < X + W; x += 4) { ctx.fillStyle = ((x - X) / 4) % 2 ? '#1d1d1d' : '#f1c232'; ctx.fillRect(x, Y + 6, 4, 3); }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X, Y + 9, W, 1);
};

STRUCTURE_DRAW.basketball = (ctx, s) => {
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  ctx.fillStyle = '#2a6e52'; ctx.fillRect(X, Y, W, H);
  ctx.fillStyle = '#34875f'; ctx.fillRect(X + 4, Y + 4, W - 8, H - 8);
  ctx.strokeStyle = '#f5f0e2'; ctx.lineWidth = 0.9;
  ctx.strokeRect(X + 4, Y + 4, W - 8, H - 8);
  ctx.beginPath(); ctx.moveTo(X + 4, Y + H / 2); ctx.lineTo(X + W - 4, Y + H / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(X + W / 2, Y + H / 2, 10, 0, 7); ctx.stroke();
  for (const top of [true, false]) {
    const by = top ? Y + 4 : Y + H - 4, d = top ? 1 : -1;
    ctx.strokeRect(X + W / 2 - 9, top ? by : by - 30, 18, 30);
    ctx.beginPath(); ctx.arc(X + W / 2, by + d * 30, 9, top ? 0 : Math.PI, top ? Math.PI : Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(X + W / 2, by + d * 6, 38, top ? 0.15 : Math.PI + 0.15, top ? Math.PI - 0.15 : Math.PI * 2 - 0.15); ctx.stroke();
  }
};

STRUCTURE_DRAW.diamond = (ctx, s) => {
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  const hx = X + W / 2, hy = Y + H - 14; // home plate
  const d = Math.min(W, H) * 0.34;
  ctx.fillStyle = '#c68657';
  ctx.beginPath(); ctx.moveTo(hx, hy + 8); ctx.lineTo(hx + d * 1.1, hy - d * 0.9); ctx.arc(hx, hy - d * 0.9, d * 1.1, 0, Math.PI, true); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6fae4a';
  ctx.beginPath(); ctx.moveTo(hx, hy - 6); ctx.lineTo(hx + d * 0.62, hy - d * 0.66); ctx.lineTo(hx, hy - d * 1.32); ctx.lineTo(hx - d * 0.62, hy - d * 0.66); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c68657'; ctx.beginPath(); ctx.arc(hx, hy - d * 0.66, 5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#f7f3ea'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + W * 0.5, hy - W * 0.5); ctx.moveTo(hx, hy); ctx.lineTo(hx - W * 0.5, hy - W * 0.5); ctx.stroke();
  ctx.fillStyle = '#fff';
  for (const [bx, by] of [[hx + d * 0.62, hy - d * 0.66], [hx, hy - d * 1.32], [hx - d * 0.62, hy - d * 0.66]]) ctx.fillRect(bx - 1.5, by - 1.5, 3, 3);
  ctx.beginPath(); ctx.moveTo(hx - 1.6, hy); ctx.lineTo(hx + 1.6, hy); ctx.lineTo(hx + 1.6, hy + 1.2); ctx.lineTo(hx, hy + 2.4); ctx.lineTo(hx - 1.6, hy + 1.2); ctx.fill();
};

STRUCTURE_DRAW.wall = (ctx, s) => { // low stone / adobe wall seen from above
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  const c = s.color || '#cbb89a';
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(X + 1.5, Y + 2, W, H);
  ctx.fillStyle = shade(c, -0.2); ctx.fillRect(X, Y + H * 0.35, W, H * 0.65);
  ctx.fillStyle = c; ctx.fillRect(X, Y, W, H * 0.6);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = X; x < X + W; x += 5) ctx.fillRect(x, Y + H * 0.35, 0.5, H * 0.65);
};

STRUCTURE_DRAW.fence = (ctx, s) => { // wire / wood fence line
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 0.8;
  ctx.beginPath();
  if (W >= H) { ctx.moveTo(X, Y + H / 2 - 2); ctx.lineTo(X + W, Y + H / 2 - 2); ctx.moveTo(X, Y + H / 2 + 1); ctx.lineTo(X + W, Y + H / 2 + 1); }
  else { ctx.moveTo(X + W / 2, Y); ctx.lineTo(X + W / 2, Y + H); }
  ctx.stroke();
  ctx.fillStyle = '#6b5236';
  if (W >= H) for (let x = X; x <= X + W; x += 8) ctx.fillRect(x - 0.8, Y + H / 2 - 5, 1.6, 7);
  else for (let y = Y; y <= Y + H; y += 8) ctx.fillRect(X + W / 2 - 0.8, y - 5, 1.6, 7);
};

STRUCTURE_DRAW.tomb = (ctx, s) => {
  const r = rng(s.seed || s.x * 31 + s.y);
  const X = s.x * TILE, Y = s.y * TILE;
  for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
    if (r() < 0.25) continue;
    const x = X + i * TILE + 3, y = Y + j * TILE + 2;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 1.5, y + 2, 10, 11);
    const c = pick(r, ['#e8e2d6', '#d8d0c4', '#c9d6de', '#f0d7d7', '#dfe8d5']);
    ctx.fillStyle = shade(c, -0.15); ctx.fillRect(x, y + 3, 10, 10);
    ctx.fillStyle = c; ctx.fillRect(x, y, 10, 9);
    ctx.fillStyle = '#6b6b6b'; ctx.fillRect(x + 4.5, y - 5, 1, 6); ctx.fillRect(x + 2.8, y - 3.5, 4.4, 1);
    if (r() < 0.6) { ctx.fillStyle = pick(r, ['#f28c28', '#e84a6a', '#ffd84a', '#ffffff']); ctx.beginPath(); ctx.arc(x + 2 + r() * 6, y + 7, 1.2, 0, 7); ctx.fill(); }
  }
};

// Tianguis ground: tarps drawn as sprites; this bakes the chalk stall marks
STRUCTURE_DRAW.stallMarks = (ctx, s) => {
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.5;
  for (let x = s.x * TILE; x < (s.x + s.w) * TILE; x += 32) ctx.strokeRect(x + 1, s.y * TILE + 1, 30, s.h * TILE - 2);
};

// generic painted text on ground (e.g. "ALTO")
STRUCTURE_DRAW.paint = (ctx, s) => {
  ctx.fillStyle = 'rgba(245,242,230,0.8)'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(s.text, (s.x + s.w / 2) * TILE, (s.y + s.h / 2) * TILE + 2.5);
};

// Water feature ground (pond / fountain basin viewed flat)
STRUCTURE_DRAW.pond = (ctx, s) => {
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  ctx.fillStyle = '#a89a86'; roundRect(ctx, X, Y, W, H, 8); ctx.fill();
  ctx.fillStyle = '#3f8fb5'; roundRect(ctx, X + 3, Y + 3, W - 6, H - 6, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(X + 8, Y + 8, W * 0.3, 1);
};

// Smooth diagonal avenue (Las Palmas): sidewalks, asphalt and planted median as strokes.
STRUCTURE_DRAW.diagRoad = (ctx, s) => {
  const pts = s.pts.map(([x, y]) => [x * TILE, y * TILE]);
  const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
  ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  path(); ctx.strokeStyle = '#a79f92'; ctx.lineWidth = s.width * TILE; ctx.stroke();
  path(); ctx.strokeStyle = '#8c8376'; ctx.lineWidth = s.width * TILE - 3; ctx.setLineDash([2.5, 1.2]); ctx.stroke(); ctx.setLineDash([]);
  path(); ctx.strokeStyle = '#b3a590'; ctx.lineWidth = (s.width - 2) * TILE + 3; ctx.stroke();
  path(); ctx.strokeStyle = '#303235'; ctx.lineWidth = (s.width - 2) * TILE; ctx.stroke();
  // aggregate speckles & potholes along the avenue
  const r = rng(s.x * 7 + s.y);
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    const nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (let d = 0; d < L; d += 3) {
      const t = d / L, o = (r() - 0.5) * (s.width - 2) * TILE;
      ctx.fillStyle = r() < 0.5 ? 'rgba(120,120,118,0.45)' : 'rgba(10,10,12,0.5)';
      ctx.fillRect(ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o, 0.8, 0.8);
      if (r() < 0.03) { const px = ax + (bx - ax) * t + nx * o * 0.7, py = ay + (by - ay) * t + ny * o * 0.7; ctx.fillStyle = '#1a1917'; ctx.beginPath(); ctx.ellipse(px, py, 3, 2, 0.4, 0, 7); ctx.fill(); }
    }
  }
  if (s.median) {
    path(); ctx.strokeStyle = '#d9d2c2'; ctx.lineWidth = s.median * TILE + 2; ctx.stroke();
    path(); ctx.strokeStyle = '#6fa647'; ctx.lineWidth = s.median * TILE - 1; ctx.stroke();
  }
};

STRUCTURE_DRAW.river = (ctx, s) => {
  // A natural stream: the control points are densified and nudged so the course meanders, the width
  // breathes, and the banks are earth, stones and reeds — no straight edges, nothing road-like.
  const r = rng(Math.floor(s.pts[0][0] * 31 + s.pts[0][1] * 7));
  const raw = s.pts.map(([x, y]) => [x * TILE, y * TILE]);
  const pts = [];
  for (let i = 0; i < raw.length - 1; i++) {
    const [ax, ay] = raw[i], [bx, by] = raw[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(L / 10));
    const nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (let k = 0; k < n; k++) { const t = k / n, wob = Math.sin((i * n + k) * 0.55) * 5 + (r() - 0.5) * 3; pts.push([ax + (bx - ax) * t + nx * wob, ay + (by - ay) * t + ny * wob]); }
  }
  pts.push(raw[raw.length - 1]);
  const W = s.width * TILE;
  const along = (fn) => { for (let i = 0; i < pts.length; i++) fn(pts[i][0], pts[i][1], i); };
  // banks: damp earth and grass edge built from overlapping blobs of varying radius
  along((x, y, i) => { const w = W * (0.62 + 0.18 * Math.sin(i * 0.37)); ctx.fillStyle = '#6f8f4a'; ctx.beginPath(); ctx.ellipse(x, y, w + 7, (w + 7) * 0.92, 0, 0, 7); ctx.fill(); });
  along((x, y, i) => { const w = W * (0.62 + 0.18 * Math.sin(i * 0.37)); ctx.fillStyle = '#8c7b58'; ctx.beginPath(); ctx.ellipse(x, y, w + 2.6, (w + 2.6) * 0.92, 0, 0, 7); ctx.fill(); });
  // water: deep centre, lighter shallows
  for (const [k, c] of [[1, '#3f6f7c'], [0.78, '#3a6674'], [0.5, '#335d6c']]) along((x, y, i) => { const w = W * (0.62 + 0.18 * Math.sin(i * 0.37)) * k; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.92, 0, 0, 7); ctx.fill(); });
  // stones and reeds on the banks, sun glints on the water
  along((x, y, i) => {
    const w = W * (0.62 + 0.18 * Math.sin(i * 0.37));
    if (r() < 0.55) { const a = r() * 6.283, d = w + 1 + r() * 3; ctx.fillStyle = r() < 0.5 ? '#a49a88' : '#8b8274'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9, 1.2 + r() * 1.6, 0.9 + r(), r(), 0, 7); ctx.fill(); }
    if (r() < 0.45) { const a = r() * 6.283, d = w + 3 + r() * 3, rx = x + Math.cos(a) * d, ry = y + Math.sin(a) * d; ctx.strokeStyle = r() < 0.5 ? '#4f7a36' : '#6d8f3c'; ctx.lineWidth = 0.5; ctx.beginPath(); for (let j = -2; j <= 2; j++) { ctx.moveTo(rx + j * 0.6, ry); ctx.quadraticCurveTo(rx + j * 0.9, ry - 3, rx + j * 1.3, ry - 4.5 - r() * 2); } ctx.stroke(); }
    if (r() < 0.5) { ctx.fillStyle = 'rgba(210,235,240,0.35)'; ctx.fillRect(x + (r() - 0.5) * w, y + (r() - 0.5) * w * 0.8, 2 + r() * 3, 0.5); }
  });
};

// Low stone kerb/iron fence around the plaza gardens (per garden rectangle)
STRUCTURE_DRAW.ironFence = (ctx, s) => {
  // low cantera kerb with a black wrought-iron fence: rails, round loops and spear finials (like the plaza's)
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  ctx.fillStyle = '#a99a83'; ctx.fillRect(X - 1.2, Y - 1.2, W + 2.4, 2); ctx.fillRect(X - 1.2, Y + H - 0.8, W + 2.4, 2); ctx.fillRect(X - 1.2, Y - 1.2, 2, H + 2.4); ctx.fillRect(X + W - 0.8, Y - 1.2, 2, H + 2.4);
  ctx.fillStyle = '#cdbfa6'; ctx.fillRect(X - 1.2, Y + H - 0.8, W + 2.4, 0.6);
  const I = '#141516';
  ctx.strokeStyle = I; ctx.fillStyle = I; ctx.lineWidth = 0.32;
  const run = (x0, y0, x1, y1, hgt) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 1.5));
    ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(x0, y0 - hgt); ctx.lineTo(x1, y1 - hgt); ctx.moveTo(x0, y0 - 0.8); ctx.lineTo(x1, y1 - 0.8); ctx.stroke();
    ctx.lineWidth = 0.28;
    for (let k = 0; k <= n; k++) {
      const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - hgt - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 0.4, y - hgt - 0.8); ctx.lineTo(x, y - hgt - 1.8); ctx.lineTo(x + 0.4, y - hgt - 0.8); ctx.fill();
      if (k < n) { ctx.beginPath(); ctx.arc(x + (x1 - x0) / n / 2, y + (y1 - y0) / n / 2 - hgt * 0.55, 0.55, 0, 6.28); ctx.stroke(); }
    }
  };
  run(X, Y + 0.4, X + W, Y + 0.4, 2.6);
  run(X, Y, X, Y + H, 2.8); run(X + W, Y, X + W, Y + H, 2.8);
  run(X, Y + H, X + W, Y + H, 3.2);
};

// Walks of the Jardín de la Paz: the perimeter where people do laps, an X of diagonal walks and the
// ring around Lucía de la Paz, all in cantera slabs with a darker kerb, merging smoothly into the lawn.
STRUCTURE_DRAW.pazPaths = (ctx, s) => {
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE, cx = s.cx * TILE + 8, cy = s.cy * TILE + 8;
  ctx.save(); ctx.beginPath(); ctx.rect(X, Y, W, H); ctx.clip();
  const shapes = (lw) => {
    ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(X + 16, Y + 16); ctx.lineTo(X + W - 16, Y + H - 16); ctx.moveTo(X + W - 16, Y + 16); ctx.lineTo(X + 16, Y + H - 16); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, 5.6 * TILE, 5.6 * TILE / 1.25, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.rect(X + lw / 2 - 2, Y + lw / 2 - 2, W - lw + 4, H - lw + 4); ctx.stroke();
  };
  // soft worn grass edge, kerb, slabs
  ctx.strokeStyle = 'rgba(120,110,80,0.35)'; shapes(30);
  ctx.strokeStyle = '#a8977d'; shapes(25);
  ctx.strokeStyle = '#d9c9ae'; shapes(22);
  ctx.fillStyle = '#a8977d'; ctx.beginPath(); ctx.ellipse(cx, cy, 3 * TILE + 2, (3 * TILE + 2) / 1.2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ddcdb2'; ctx.beginPath(); ctx.ellipse(cx, cy, 3 * TILE, 3 * TILE / 1.2, 0, 0, 7); ctx.fill();
  // radial slab joints around the centre, a compass rose in darker stone
  ctx.strokeStyle = 'rgba(120,100,70,0.35)'; ctx.lineWidth = 0.4;
  for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * 12, cy + Math.sin(an) * 10); ctx.lineTo(cx + Math.cos(an) * 46, cy + Math.sin(an) * 38); ctx.stroke(); }
  for (const rr of [20, 34]) { ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr / 1.2, 0, 0, 7); ctx.stroke(); }
  ctx.fillStyle = 'rgba(150,110,80,0.35)';
  for (let a = 0; a < 4; a++) { const an = a * Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * 30, cy + Math.sin(an) * 25); ctx.lineTo(cx + Math.cos(an + 0.25) * 18, cy + Math.sin(an + 0.25) * 15); ctx.lineTo(cx + Math.cos(an - 0.25) * 18, cy + Math.sin(an - 0.25) * 15); ctx.fill(); }
  ctx.restore();
};

// The tricolor stairs of La Trasquila: each riser painted green, white or red, worn in the middle.
STRUCTURE_DRAW.tricolorSteps = (ctx, s) => {
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  const cols = ['#1f7a45', '#f2efe6', '#c3262f'];
  const step = 4;
  for (let i = 0, y = Y; y < Y + H; y += step, i++) {
    ctx.fillStyle = '#b9ad98'; ctx.fillRect(X, y, W, step); // the tread
    ctx.fillStyle = cols[i % 3]; ctx.fillRect(X, y + step - 1.6, W, 1.6); // the painted riser
    ctx.fillStyle = 'rgba(80,60,40,0.18)'; ctx.fillRect(X + W * 0.3, y + 0.4, W * 0.4, step - 2); // worn by footsteps
  }
  ctx.fillStyle = '#8f8574'; ctx.fillRect(X - 1.5, Y, 1.5, H); ctx.fillRect(X + W, Y, 1.5, H);
};
