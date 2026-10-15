// Interior art: room frames, patterned floors, walls (colonial, Gothic, painted with murals) and the
// furniture of churches, the library and the Ayuntamiento. Drawn in a 3/4 top-down view, with dark
// outlines and soft shading, in the spirit of the old 16-bit adventure games.
import { TILE, rng, pick, shade, mix, rgba, roundRect, hash2 } from '../util.js';
import { STRUCTURE_DRAW } from './structures.js';
import { SPRITES } from './landmarks.js';
import { shadowBlob, text } from './art.js';

const T = TILE;
const OUT = 'rgba(30,20,15,0.55)';

// ---- the room around you -------------------------------------------------------------------------
// Thick walls seen from above (instead of a black border), with a soft shadow falling onto the floor.
STRUCTURE_DRAW.roomframe = (ctx, s) => {
  const W = s.w * T, H = s.h * T, top = s.top || '#6b5a48', edge = shade(top, 0.25);
  const exits = new Set(s.exits || []);
  // left and right walls
  for (const [x0, side] of [[0, 1], [W - T, -1]]) {
    ctx.fillStyle = top; ctx.fillRect(x0, 0, T, H);
    ctx.fillStyle = edge; ctx.fillRect(side > 0 ? x0 + T - 1.6 : x0, s.rows * T, 1.6, H - s.rows * T);
    const g = ctx.createLinearGradient(side > 0 ? x0 + T : x0, 0, side > 0 ? x0 + T + 7 : x0 - 7, 0);
    g.addColorStop(0, 'rgba(25,18,12,0.32)'); g.addColorStop(1, 'rgba(25,18,12,0)');
    ctx.fillStyle = g; ctx.fillRect(side > 0 ? x0 + T : x0 - 7, s.rows * T, 7, H - (s.rows + 1) * T);
    // stone courses on the wall top
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < H; y += 6) ctx.fillRect(x0 + 2, y + ((y / 6) % 2 ? 0 : 3), T - 4, 0.6);
  }
  // bottom wall (the one nearest you), with the door gaps
  for (let x = 0; x < s.w; x++) {
    if (exits.has(x)) continue;
    ctx.fillStyle = top; ctx.fillRect(x * T, H - T, T, T);
    ctx.fillStyle = edge; ctx.fillRect(x * T, H - T, T, 1.6);
  }
  for (const x of exits) { // door jambs
    ctx.fillStyle = shade(top, -0.3); ctx.fillRect(x * T - 1.5, H - T, 1.5, T); ctx.fillRect(x * T + T, H - T, 1.5, T);
    ctx.fillStyle = 'rgba(255,240,200,0.18)'; ctx.fillRect(x * T, H - T, T, T);
  }
  // shadow under the back wall
  const g2 = ctx.createLinearGradient(0, s.rows * T, 0, s.rows * T + 9);
  g2.addColorStop(0, 'rgba(25,18,12,0.35)'); g2.addColorStop(1, 'rgba(25,18,12,0)');
  ctx.fillStyle = g2; ctx.fillRect(T, s.rows * T, W - 2 * T, 9);
};

// An inner wall: the top of a partition seen from above, with a lit edge and a shadow on the floor.
STRUCTURE_DRAW.innerwall = (ctx, s) => {
  const X = s.x * T, Y = s.y * T, W = s.w * T, H = s.h * T, top = s.top || '#6b5a48';
  ctx.fillStyle = 'rgba(25,18,12,0.28)'; ctx.fillRect(X + 2, Y + H, W, 5); ctx.fillRect(X + W, Y + 3, 4, H);
  ctx.fillStyle = top; ctx.fillRect(X, Y, W, H);
  ctx.fillStyle = shade(top, 0.25); ctx.fillRect(X, Y, W, 1.4); ctx.fillRect(X, Y, 1.4, H);
  ctx.fillStyle = shade(top, -0.3); ctx.fillRect(X, Y + H - 1.2, W, 1.2);
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = Y + 3; y < Y + H; y += 6) ctx.fillRect(X + 2, y, W - 4, 0.6);
};
// Floors laid over a rectangle of tiles.
STRUCTURE_DRAW.floorpat = (ctx, s) => {
  const X = s.x * T, Y = s.y * T, W = s.w * T, H = s.h * T, r = rng(s.seed || 5);
  ctx.save(); ctx.beginPath(); ctx.rect(X, Y, W, H); ctx.clip();
  if (s.pat === 'marble') { // checkerboard of polished marble, big tiles
    const a = s.a || '#efe6d6', b = s.b || '#a94d3a', sz = s.size || 16;
    for (let y = Y; y < Y + H; y += sz) for (let x = X; x < X + W; x += sz) {
      const k = ((x - X) / sz + (y - Y) / sz) & 1;
      ctx.fillStyle = k ? b : a; ctx.fillRect(x, y, sz, sz);
      ctx.fillStyle = k ? 'rgba(255,255,255,0.07)' : 'rgba(120,100,80,0.06)';
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(x + r() * sz, y); ctx.quadraticCurveTo(x + r() * sz, y + sz / 2, x + r() * sz, y + sz); ctx.lineWidth = 0.4; ctx.strokeStyle = ctx.fillStyle; ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 1, y + 1, sz * 0.4, 0.8);
    }
    ctx.strokeStyle = 'rgba(60,45,35,0.3)'; ctx.lineWidth = 0.4;
    for (let x = X; x <= X + W; x += sz) { ctx.beginPath(); ctx.moveTo(x, Y); ctx.lineTo(x, Y + H); ctx.stroke(); }
    for (let y = Y; y <= Y + H; y += sz) { ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + W, y); ctx.stroke(); }
  } else if (s.pat === 'barro') { // terracotta squares (colonial houses, convents)
    if (s.grout) { ctx.fillStyle = s.grout; ctx.fillRect(X, Y, W, H); }
    for (let y = Y; y < Y + H; y += 8) for (let x = X; x < X + W; x += 8) {
      ctx.fillStyle = mix(s.a || '#b8643f', s.b || '#cf7f55', hash2(x, y, 3)); ctx.fillRect(x + 0.4, y + 0.4, 7.2, 7.2);
      ctx.fillStyle = 'rgba(255,230,200,0.12)'; ctx.fillRect(x + 1, y + 1, 3, 0.7);
    }
    ctx.fillStyle = 'rgba(80,45,30,0.0)';
  } else if (s.pat === 'planks') { // old wooden floor, long boards
    for (let y = Y; y < Y + H; y += 4) {
      let x = X - (hash2(0, y, 9) * 30 | 0);
      while (x < X + W) {
        const len = 22 + hash2(x, y, 10) * 26;
        ctx.fillStyle = mix(s.a || '#7a4e2e', s.b || '#9c6a42', hash2(x, y, 11)); ctx.fillRect(x, y, len - 0.5, 3.6);
        ctx.fillStyle = 'rgba(40,20,10,0.35)'; ctx.fillRect(x + len - 0.5, y, 0.5, 3.6);
        if (hash2(x, y, 12) > 0.75) { ctx.fillStyle = 'rgba(40,20,10,0.25)'; ctx.beginPath(); ctx.ellipse(x + len * 0.4, y + 1.8, 1.2, 0.6, 0, 0, 7); ctx.fill(); }
        x += len;
      }
      ctx.fillStyle = 'rgba(30,15,8,0.3)'; ctx.fillRect(X, y + 3.6, W, 0.4);
    }
  } else if (s.pat === 'cement') { // polished cement, a bit speckled
    ctx.fillStyle = s.a || '#c9c3b8'; ctx.fillRect(X, Y, W, H);
    for (let i = 0; i < W * H / 40; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'; ctx.fillRect(X + r() * W, Y + r() * H, 1, 1); }
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 0.5;
    for (let x = X; x < X + W; x += 32) { ctx.beginPath(); ctx.moveTo(x, Y); ctx.lineTo(x, Y + H); ctx.stroke(); }
  } else if (s.pat === 'pasta') { // the cement-and-pigment tiles of old Michoacán houses
    const c1 = s.a || '#2f5d7a', c2 = s.b || '#b8543c', bg = '#ece2cf';
    for (let y = Y; y < Y + H; y += 16) for (let x = X; x < X + W; x += 16) {
      ctx.fillStyle = bg; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = c1; for (const [cx, cy] of [[0, 0], [16, 0], [0, 16], [16, 16]]) { ctx.beginPath(); ctx.arc(x + cx, y + cy, 5, 0, 7); ctx.fill(); }
      ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x + 8, y + 3); ctx.lineTo(x + 13, y + 8); ctx.lineTo(x + 8, y + 13); ctx.lineTo(x + 3, y + 8); ctx.fill();
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x + 8, y + 8, 1.6, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
};

// A raised presbytery: two steps across the room, cantera edges.
STRUCTURE_DRAW.steps = (ctx, s) => {
  const X = s.x * T, Y = s.y * T, W = s.w * T;
  for (let i = 0; i < 2; i++) {
    const y = Y + i * 5;
    ctx.fillStyle = i ? '#cdbfa6' : '#ddd0b8'; ctx.fillRect(X, y, W, 5);
    ctx.fillStyle = 'rgba(70,55,40,0.4)'; ctx.fillRect(X, y + 4.2, W, 0.8);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(X, y, W, 0.6);
  }
};

// A back wall with more architecture: cantera pilasters, a cornice, a wainscot and arched windows
// that throw a warm light; or (style 'gothic') pointed lancets of stained glass and a rose window.
STRUCTURE_DRAW.grandwall = (ctx, s) => {
  const X = s.x * T, Y = s.y * T, W = s.w * T, H = s.h * T, r = rng(s.seed || 3);
  const wall = s.color || '#efe4cf';
  const g = ctx.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, shade(wall, -0.12)); g.addColorStop(1, wall);
  ctx.fillStyle = g; ctx.fillRect(X, Y, W, H);
  if (s.style === 'gothic') {
    // ribbed vault springing from slim columns; between them, lancets of stained glass
    const n = Math.max(3, Math.floor(W / 34));
    const step = W / n;
    for (let i = 0; i <= n; i++) {
      const x = X + i * step;
      ctx.fillStyle = shade(wall, -0.18); ctx.fillRect(x - 2, Y, 4, H);
      ctx.fillStyle = shade(wall, 0.12); ctx.fillRect(x - 2, Y, 1.2, H);
    }
    for (let i = 0; i < n; i++) {
      const cx = X + (i + 0.5) * step, mid = i === Math.floor(n / 2) && n % 2 === 1;
      if (mid) { // the rose window over the altar
        const ry = Y + H * 0.36, R = Math.min(step * 0.36, H * 0.3);
        ctx.fillStyle = '#3b3346'; ctx.beginPath(); ctx.arc(cx, ry, R + 1.6, 0, 7); ctx.fill();
        const cols = ['#c8102e', '#2f5d9a', '#f2c230', '#2e7d32', '#7a3fa0'];
        for (let k = 0; k < 12; k++) { ctx.fillStyle = cols[k % 5]; ctx.beginPath(); ctx.moveTo(cx, ry); ctx.arc(cx, ry, R, k * Math.PI / 6, (k + 1) * Math.PI / 6); ctx.fill(); }
        ctx.strokeStyle = '#3b3346'; ctx.lineWidth = 0.8; for (let k = 0; k < 12; k++) { ctx.beginPath(); ctx.moveTo(cx, ry); ctx.lineTo(cx + Math.cos(k * Math.PI / 6) * R, ry + Math.sin(k * Math.PI / 6) * R); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(cx, ry, R * 0.45, 0, 7); ctx.stroke();
        ctx.fillStyle = '#f7e9a8'; ctx.beginPath(); ctx.arc(cx, ry, R * 0.22, 0, 7); ctx.fill();
        continue;
      }
      const lw = Math.min(step * 0.36, 12), top = Y + 6, bot = Y + H - 12;
      ctx.fillStyle = '#3b3346';
      ctx.beginPath(); ctx.moveTo(cx - lw / 2 - 1.2, bot + 1); ctx.lineTo(cx - lw / 2 - 1.2, top + lw * 0.9); ctx.quadraticCurveTo(cx - lw / 2, top - 1, cx, top - 3); ctx.quadraticCurveTo(cx + lw / 2, top - 1, cx + lw / 2 + 1.2, top + lw * 0.9); ctx.lineTo(cx + lw / 2 + 1.2, bot + 1); ctx.fill();
      const pal = [['#2f5d9a', '#c8102e', '#f2c230'], ['#2e7d32', '#7a3fa0', '#f2c230'], ['#c8102e', '#2f5d9a', '#e8e0c8']][i % 3];
      for (let yy = top + 2; yy < bot; yy += 3) for (let xx = cx - lw / 2; xx < cx + lw / 2; xx += 3) {
        const inArch = yy > top + lw * 0.9 || Math.hypot((xx - cx) / (lw / 2), (yy - (top + lw * 0.9)) / (lw * 0.9)) < 1.02;
        if (!inArch) continue;
        ctx.fillStyle = pick(r, pal); ctx.fillRect(xx, yy, 2.6, 2.6);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(cx - lw / 2, top + lw, 1, bot - top - lw);
    }
  } else {
    // colonial: pilasters of cantera, arched windows or niches, a cornice and a wainscot
    const n = s.bays || Math.max(2, Math.floor(W / 48));
    const step = W / n;
    for (let i = 0; i <= n; i++) {
      const x = X + i * step;
      ctx.fillStyle = s.stone || '#cdb48e'; ctx.fillRect(x - 3.5, Y, 7, H);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x - 3.5, Y, 1.4, H);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + 2.4, Y, 1.1, H);
    }
    for (let i = 0; i < n; i++) {
      const cx = X + (i + 0.5) * step, kind = (s.bayKinds || [])[i] || (s.windows ? 'window' : 'niche');
      if (kind === 'none') continue;
      const ww = Math.min(step * 0.42, 18), top = Y + 7, bot = Y + H - 14;
      ctx.fillStyle = shade(s.stone || '#cdb48e', -0.1); roundTop(ctx, cx - ww / 2 - 2, top - 2, ww + 4, bot - top + 4);
      if (kind === 'window') {
        const gl = ctx.createLinearGradient(0, top, 0, bot); gl.addColorStop(0, '#fff3cf'); gl.addColorStop(1, '#e8c98a');
        ctx.fillStyle = gl; roundTop(ctx, cx - ww / 2, top, ww, bot - top);
        ctx.strokeStyle = 'rgba(80,60,40,0.6)'; ctx.lineWidth = 0.5; for (let xx = cx - ww / 2 + 3; xx < cx + ww / 2; xx += 3) { ctx.beginPath(); ctx.moveTo(xx, top + 4); ctx.lineTo(xx, bot); ctx.stroke(); }
      } else if (kind === 'niche') {
        ctx.fillStyle = shade(wall, -0.3); roundTop(ctx, cx - ww / 2, top, ww, bot - top);
        saint(ctx, cx, bot - 1, pick(r, ['#6b4a30', '#2f5d9a', '#8e2f35', '#e8e0c8']), 0.8);
      } else if (kind === 'stations') { // Via Crucis: a small framed station
        ctx.fillStyle = '#6b4a30'; ctx.fillRect(cx - 5, top + 6, 10, 12); ctx.fillStyle = '#d9c7a8'; ctx.fillRect(cx - 4, top + 7, 8, 10);
        ctx.fillStyle = '#6b4a30'; ctx.fillRect(cx - 0.4, top + 2, 0.8, 4); ctx.fillRect(cx - 2, top + 3.2, 4, 0.8);
      }
    }
    ctx.fillStyle = s.stone || '#cdb48e'; ctx.fillRect(X, Y, W, 3.5); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(X, Y + 3.5, W, 1);
  }
  // wainscot and baseboard
  ctx.fillStyle = s.wainscot || (s.style === 'gothic' ? '#d6cfc2' : '#8e2f24'); ctx.fillRect(X, Y + H - 8, W, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(X, Y + H - 8, W, 0.8);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X, Y + H - 1.4, W, 1.4);
  for (const d of s.deco || []) wallThing(ctx, X + d.x * T, Y + H - (d.h ?? 14), d);
};
function roundTop(ctx, x, y, w, h) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.fill(); }
function saint(ctx, x, y, robe, k = 1) {
  ctx.fillStyle = robe; ctx.beginPath(); ctx.moveTo(x - 3.2 * k, y); ctx.lineTo(x - 2.2 * k, y - 10 * k); ctx.lineTo(x + 2.2 * k, y - 10 * k); ctx.lineTo(x + 3.2 * k, y); ctx.fill();
  ctx.fillStyle = '#e2b48c'; ctx.beginPath(); ctx.arc(x, y - 11.6 * k, 1.9 * k, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e8c45a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(x, y - 11.8 * k, 2.8 * k, 0, 7); ctx.stroke();
}
// Things hung on a wall: framed pictures, a clock, a chalkboard menu, a crucifix, a flag, a portrait.
function wallThing(ctx, x, y, d) {
  if (d.kind === 'board') { // chalkboard
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(x - 1, y - 26, (d.w || 30) + 2, 20); ctx.fillStyle = '#2c3a33'; ctx.fillRect(x, y - 25, d.w || 30, 18);
    ctx.fillStyle = '#f0ece0'; ctx.font = 'bold 2.9px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    (d.lines || []).forEach((l, i) => ctx.fillText(l, x + 1.6, y - 21.4 + i * 3.4));
  } else if (d.kind === 'clock') {
    ctx.fillStyle = '#5b3a22'; ctx.beginPath(); ctx.arc(x, y - 18, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#f7f3ea'; ctx.beginPath(); ctx.arc(x, y - 18, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x, y - 21); ctx.moveTo(x, y - 18); ctx.lineTo(x + 2, y - 18); ctx.stroke();
  } else if (d.kind === 'portrait') {
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(x - 6, y - 30, 12, 15); ctx.fillStyle = d.bg || '#5a6a5a'; ctx.fillRect(x - 5, y - 29, 10, 13);
    ctx.fillStyle = d.suit || '#2b2b2b'; ctx.beginPath(); ctx.moveTo(x - 4, y - 16); ctx.quadraticCurveTo(x, y - 22, x + 4, y - 16); ctx.fill();
    ctx.fillStyle = '#c69472'; ctx.beginPath(); ctx.arc(x, y - 23.5, 2.2, 0, 7); ctx.fill(); ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 2.2, y - 26, 4.4, 1.4);
    if (d.caption) { ctx.fillStyle = '#c9a54a'; ctx.fillRect(x - 6, y - 14.6, 12, 2.4); ctx.fillStyle = '#3a2a1a'; ctx.font = 'bold 1.6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(d.caption, x, y - 12.9); }
  } else if (d.kind === 'crucifix') {
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(x - 0.8, y - 34, 1.6, 22); ctx.fillRect(x - 6, y - 29, 12, 1.6);
    ctx.fillStyle = '#e8cfa8'; ctx.fillRect(x - 0.6, y - 30, 1.2, 9); ctx.fillRect(x - 5, y - 28.8, 10, 0.9);
  } else if (d.kind === 'flag') {
    ctx.fillStyle = '#c9c3b8'; ctx.fillRect(x, y - 34, 0.8, 32);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#006847', '#ffffff', '#ce1126'][i]; ctx.fillRect(x + 0.8 + i * 3.6, y - 33, 3.6, 8); }
    ctx.fillStyle = '#8a6a2f'; ctx.beginPath(); ctx.arc(x + 6.2, y - 29, 1, 0, 7); ctx.fill();
  } else if (d.kind === 'poster') {
    ctx.fillStyle = d.bg || '#f2c230'; ctx.fillRect(x, y - 28, d.w || 12, 15); ctx.fillStyle = d.fg || '#2b2b2b'; ctx.font = 'bold 2.2px sans-serif'; ctx.textAlign = 'center';
    (d.lines || []).forEach((l, i) => ctx.fillText(l, x + (d.w || 12) / 2, y - 24 + i * 3));
  } else if (d.kind === 'sign') {
    ctx.font = 'bold 3.6px sans-serif';
    const w = Math.max(d.w || 40, ctx.measureText(d.text).width + 8);
    ctx.fillStyle = d.bg || '#7a1f1a'; ctx.fillRect(x, y - 30, w, 7); ctx.fillStyle = d.fg || '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.text, x + w / 2, y - 26.5);
  } else if (d.kind === 'papel') {
    const cols = ['#e84a6a', '#f2a93b', '#2fb3a0', '#6a5acd', '#f7e36a'];
    for (let i = 0; i < (d.n || 10); i++) { ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(x + i * 7, y - 36); ctx.lineTo(x + i * 7 + 6, y - 36); ctx.lineTo(x + i * 7 + 6, y - 30); ctx.lineTo(x + i * 7 + 3, y - 28); ctx.lineTo(x + i * 7, y - 30); ctx.fill(); }
  }
}

// ---- the Gabino Ortiz: its murals, its nave, its bookcases -----------------------------------------
// The murals as the game remembers them: an original evocation, never a copy of the paintings. Orozco
// painted the side walls of the old church in 1940 in greys like smoke and soot, where the only colour
// is the red of the flags (crowds with their mouths open, horses, bodies falling), and at the end of the
// nave, under the pointed arch, an allegory in colour. Everything here is drawn on a wall 100 units
// tall, so the same painting works on a 16-pixel wall and in the full-screen viewer.
const RED = '#b3261e';
export function paintMural(ctx, x, y, w, h, seed, mode = 'color', detail = false) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.translate(x, y); ctx.scale(h / 100, h / 100);
  const L = w / (h / 100), r = rng(seed);
  if (mode === 'color') paintAllegory(ctx, L, r); else paintGrisaille(ctx, L, r, seed % 3);
  if (detail) { // up close: brush marks, hatching in the shadows, the grain of the plaster
    for (let i = 0; i < L * 9; i++) {
      const bx = r() * L, by = r() * 100, a = r() * Math.PI;
      ctx.strokeStyle = r() < 0.5 ? 'rgba(255,245,225,0.08)' : 'rgba(20,12,8,0.09)'; ctx.lineWidth = 0.15 + r() * 0.25;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * (0.8 + r() * 2), by + Math.sin(a) * (0.8 + r() * 2)); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(20,12,8,0.16)'; ctx.lineWidth = 0.12;
    for (let i = 0; i < L * 2; i++) { const hx = r() * L, hy = 50 + r() * 50; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 1.4, hy - 1.4); ctx.stroke(); }
    for (let i = 0; i < L * 20; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; ctx.fillRect(r() * L, r() * 100, 0.25, 0.25); }
  }
  ctx.restore();
}
// A body in the crowd: feet at (x,y), about 46 units tall at s=1; arms up, head thrown back, shouting.
function gFigure(ctx, x, y, s, tone, r, o = {}) {
  const face = mix(tone, '#f1ece2', 0.35), up = o.up ?? r() < 0.65;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.lean || 0); ctx.scale(o.flip ? -s : s, s);
  ctx.strokeStyle = tone; ctx.fillStyle = tone; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-2, -19); ctx.lineTo(-5 - r() * 3, 0); ctx.moveTo(2, -19); ctx.lineTo(4 + r() * 3, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6.5, -34); ctx.lineTo(6.5, -34); ctx.lineTo(4.5, -17); ctx.lineTo(-4.5, -17); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 2.8; ctx.beginPath();
  const lx = up ? -10 - r() * 3 : -8, ly = up ? -47 - r() * 4 : -21, rx = up ? 9 + r() * 4 : 8, ry = up ? -48 - r() * 5 : -20;
  ctx.moveTo(-5.5, -32); ctx.lineTo(lx, ly); ctx.moveTo(5.5, -32); ctx.lineTo(rx, ry); ctx.stroke();
  ctx.beginPath(); ctx.arc(lx, ly, 1.8, 0, 7); ctx.arc(rx, ry, 1.8, 0, 7); ctx.fill(); // fists
  if (o.hat) { ctx.beginPath(); ctx.ellipse(0, -42.5, 7.5, 1.6, 0, 0, 7); ctx.fill(); ctx.fillRect(-3, -46, 6, 3.6); }
  ctx.fillStyle = face; ctx.beginPath(); ctx.ellipse(0.5, -38.5, 3.4, 4.2, o.tilt ?? -0.35, 0, 7); ctx.fill();
  ctx.fillStyle = '#1d1a17'; ctx.beginPath(); ctx.ellipse(1.6, -37, 1, 1.6, -0.3, 0, 7); ctx.fill(); // the open mouth
  ctx.fillRect(-1.2, -40.6, 1.4, 0.6);
  ctx.fillStyle = 'rgba(245,240,230,0.32)'; ctx.fillRect(-6, -33, 2.2, 15); // light down one side
  ctx.strokeStyle = 'rgba(15,12,10,0.7)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-6.5, -34); ctx.lineTo(-4.5, -17); ctx.moveTo(6.5, -34); ctx.lineTo(4.5, -17); ctx.stroke();
  ctx.restore();
}
// A red flag on a slanted pole, snapping in the wind: the only colour on the grey walls.
function redFlag(ctx, x, y, len, ang, r) {
  const dx = Math.sin(ang), dy = -Math.cos(ang), tx = x + dx * len, ty = y + dy * len, fw = len * (0.5 + r() * 0.2), fh = len * 0.3;
  ctx.strokeStyle = '#26211d'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  const bx = tx - dx * fh, by = ty - dy * fh; // where the cloth's lower edge meets the pole
  ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(tx, ty);
  ctx.bezierCurveTo(tx + fw * 0.35, ty - 5, tx + fw * 0.65, ty + 4, tx + fw, ty - 2);
  ctx.lineTo(tx + fw * 0.92, ty + fh * 0.8);
  ctx.bezierCurveTo(tx + fw * 0.6, by + 5, bx + fw * 0.3, by - 3, bx, by); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(70,8,6,0.45)';
  for (const k of [0.3, 0.62]) { ctx.beginPath(); ctx.moveTo(tx + fw * k, ty + 1); ctx.lineTo(tx + fw * (k + 0.08), ty + 2); ctx.lineTo(tx + fw * (k + 0.02), ty + fh * 0.9); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,160,140,0.25)'; ctx.fillRect(tx + fw * 0.1, ty - 1, fw * 0.2, 1.2);
}
// A horse, rearing or charging, with its rider's sombrero and rifle.
function gHorse(ctx, x, y, s, tone, r, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(o.flip ? -s : s, s); ctx.rotate(o.rear ? -0.45 : 0);
  ctx.fillStyle = tone; ctx.strokeStyle = tone; ctx.lineCap = 'round';
  ctx.lineWidth = 3.4; ctx.beginPath(); // legs
  if (o.rear) { ctx.moveTo(-12, -14); ctx.lineTo(-14, 0); ctx.moveTo(-6, -14); ctx.lineTo(-4, 0); ctx.moveTo(10, -18); ctx.lineTo(16, -10); ctx.lineTo(14, -4); ctx.moveTo(14, -20); ctx.lineTo(21, -14); ctx.lineTo(20, -8); }
  else { ctx.moveTo(-12, -14); ctx.lineTo(-18, 0); ctx.moveTo(-7, -14); ctx.lineTo(-4, 0); ctx.moveTo(9, -14); ctx.lineTo(4, -1); ctx.moveTo(13, -15); ctx.lineTo(20, -2); }
  ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -22, 17, 8.5, -0.08, 0, 7); ctx.fill(); // barrel
  ctx.beginPath(); ctx.moveTo(10, -27); ctx.lineTo(16, -45); ctx.lineTo(23, -43); ctx.lineTo(18, -24); ctx.closePath(); ctx.fill(); // neck
  ctx.beginPath(); ctx.moveTo(15, -47); ctx.lineTo(29, -39); ctx.lineTo(28, -35); ctx.lineTo(19, -38); ctx.closePath(); ctx.fill(); // head
  ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-16, -24); ctx.quadraticCurveTo(-26, -18, -24, -6); ctx.stroke(); // tail
  ctx.strokeStyle = mix(tone, '#f1ece2', 0.5); ctx.lineWidth = 0.8; // mane, eye, the white of a wild eye
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(15 - i * 0.6, -45 + i * 4); ctx.lineTo(11 - i, -44 + i * 4); ctx.stroke(); }
  ctx.fillStyle = '#f1ece2'; ctx.beginPath(); ctx.arc(21, -42, 1.2, 0, 7); ctx.fill(); ctx.fillStyle = '#1d1a17'; ctx.beginPath(); ctx.arc(21.3, -42, 0.5, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(245,240,230,0.25)'; ctx.beginPath(); ctx.ellipse(-2, -26, 12, 2.5, -0.08, 0, 7); ctx.fill();
  if (o.rider) { // the rider leans forward, sombrero and a rifle across
    ctx.fillStyle = shade(tone, -0.25); ctx.strokeStyle = shade(tone, -0.25);
    ctx.beginPath(); ctx.moveTo(-4, -29); ctx.lineTo(4, -29); ctx.lineTo(7, -47); ctx.lineTo(-1, -48); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -52, 3.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(4, -55, 9, 2, -0.1, 0, 7); ctx.fill(); ctx.fillRect(1, -59, 6, 4);
    ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-8, -36); ctx.lineTo(22, -58); ctx.stroke();
  }
  ctx.restore();
}
function smoke(ctx, r, L, y0, y1, n, dark = 0.5) {
  for (let i = 0; i < n; i++) { const cx = r() * L, cy = y0 + r() * (y1 - y0), rad = 5 + r() * 13; ctx.fillStyle = rgba(r() < dark ? '#6f6961' : '#f3eee5', 0.16 + r() * 0.22); ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.arc(cx + rad * 0.8, cy + 2, rad * 0.7, 0, 7); ctx.fill(); }
}
function paintGrisaille(ctx, L, r, kind) {
  const bg = ctx.createLinearGradient(0, 0, 0, 100); bg.addColorStop(0, '#dcd6ca'); bg.addColorStop(0.55, '#a9a297'); bg.addColorStop(1, '#5d5851');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, L, 100);
  smoke(ctx, r, L, 4, 55, L / 7, 0.45);
  ctx.strokeStyle = 'rgba(40,36,32,0.3)'; ctx.lineCap = 'round'; // the great diagonals that move the whole wall
  for (let i = 0; i < L / 22; i++) { ctx.lineWidth = 1 + r() * 2.5; const sx = r() * L; ctx.beginPath(); ctx.moveTo(sx, 100); ctx.lineTo(sx + 26 + r() * 30, 0); ctx.stroke(); }
  const tones = ['#2e2a26', '#45403b', '#5e5852', '#7b746c'];
  if (kind === 0) { // the crowd: heads packed to the horizon, flags over them, the front row shouting
    for (let i = 0; i < L / 3.2; i++) { ctx.fillStyle = pick(r, ['#8a837a', '#9c958b', '#77706a']); ctx.beginPath(); ctx.arc(r() * L, 58 + r() * 8, 2 + r() * 1.4, 0, 7); ctx.fill(); }
    for (let i = 0; i < L / 9; i++) { ctx.strokeStyle = '#7b746c'; ctx.lineWidth = 1; const ax = r() * L; ctx.beginPath(); ctx.moveTo(ax, 60); ctx.lineTo(ax + (r() - 0.5) * 4, 48 - r() * 6); ctx.stroke(); }
    const flags = Math.max(1, Math.round(L / 55));
    for (let i = 0; i < flags; i++) redFlag(ctx, (i + 0.3 + r() * 0.4) * L / flags, 92, 62 + r() * 18, 0.12 + r() * 0.25, r);
    for (let i = 0; i < L / 14; i++) gFigure(ctx, (i + 0.5) * 14 + (r() - 0.5) * 6, 80 + r() * 4, 0.62, pick(r, tones.slice(1)), r, { lean: (r() - 0.5) * 0.3 });
    for (let i = 0; i < L / 24; i++) gFigure(ctx, (i + 0.4) * 24 + (r() - 0.5) * 8, 108, 1.15 + r() * 0.3, pick(r, tones.slice(0, 2)), r, { lean: (r() - 0.4) * 0.35, flip: r() < 0.4, hat: r() < 0.3 });
  } else if (kind === 1) { // horses and riders out of the smoke, the people on foot with rifles
    smoke(ctx, r, L, 30, 75, L / 10, 0.6);
    const n = Math.max(1, Math.round(L / 60));
    for (let i = 0; i < n; i++) gHorse(ctx, (i + 0.45) * L / n, 88 + r() * 6, 1.25 + r() * 0.2, pick(r, tones.slice(0, 3)), r, { rear: r() < 0.5, rider: true, flip: r() < 0.35 });
    redFlag(ctx, L * (0.2 + r() * 0.6), 96, 70, -0.25 + r() * 0.2, r);
    for (let i = 0; i < L / 20; i++) {
      const fx = (i + 0.5) * 20 + (r() - 0.5) * 6;
      gFigure(ctx, fx, 104, 0.95, pick(r, tones), r, { up: false, hat: true, lean: 0.15 });
      ctx.strokeStyle = '#1f1b18'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(fx - 6, 82); ctx.lineTo(fx + 12, 62); ctx.stroke(); // rifle
    }
  } else { // the fallen: bodies thrown down in the smoke, a torn flag on the ground, one figure still standing
    smoke(ctx, r, L, 20, 90, L / 5, 0.65);
    ctx.fillStyle = 'rgba(30,26,22,0.6)'; ctx.beginPath(); ctx.moveTo(L * 0.1, 100); ctx.lineTo(L * 0.55, 18); ctx.lineTo(L * 0.6, 22); ctx.lineTo(L * 0.2, 100); ctx.fill(); // a falling beam
    for (let i = 0; i < L / 16; i++) gFigure(ctx, (i + 0.5) * 16 + (r() - 0.5) * 6, 70 + r() * 30, 0.8 + r() * 0.35, pick(r, tones), r, { lean: (r() < 0.5 ? -1 : 1) * (0.9 + r() * 0.9), up: r() < 0.5 });
    redFlag(ctx, L * (0.3 + r() * 0.4), 99, 40, 1.25, r);
    gFigure(ctx, L * (0.15 + r() * 0.7), 104, 1.35, '#2e2a26', r, { up: true, tilt: -0.6 });
  }
  ctx.strokeStyle = 'rgba(18,14,12,0.5)'; ctx.lineWidth = 0.8; // nervous black contours over everything
  for (let i = 0; i < L / 18; i++) { const sx = r() * L; ctx.beginPath(); ctx.moveTo(sx, 100); ctx.bezierCurveTo(sx + (r() - 0.5) * 30, 60, sx + (r() - 0.5) * 30, 30, sx + (r() - 0.5) * 20, 0); ctx.stroke(); }
}
// The allegory under the arch: the three colours sweeping across like a flag in the wind, an eagle,
// a tall figure in a cloak the colour of fire, a crouching jaguar, three men with rifles, nopales.
function paintAllegory(ctx, L, r) {
  const c = L / 2;
  const bg = ctx.createLinearGradient(0, 0, 0, 100); bg.addColorStop(0, '#5a301d'); bg.addColorStop(0.45, '#c98f4f'); bg.addColorStop(1, '#e6d4ad');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, L, 100);
  const ribbon = (col, pts) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]); ctx.lineTo(...pts[4]); ctx.bezierCurveTo(...pts[5], ...pts[6], ...pts[7]); ctx.closePath(); ctx.fill(); };
  ribbon('#2f6b45', [[0, 54], [L * 0.22, 44], [L * 0.38, 24], [c + 14, 16], [c + 8, 0], [L * 0.36, 6], [L * 0.2, 22], [0, 28]]);
  ribbon('#ece6d6', [[0, 74], [L * 0.24, 62], [L * 0.42, 40], [c + 20, 34], [c + 14, 16], [L * 0.38, 24], [L * 0.22, 44], [0, 54]]);
  ribbon('#b8322a', [[L, 26], [L * 0.8, 36], [L * 0.62, 20], [c - 6, 6], [c - 2, 26], [L * 0.6, 40], [L * 0.78, 56], [L, 52]]);
  ctx.strokeStyle = 'rgba(30,18,10,0.3)'; ctx.lineWidth = 0.8; // folds in the cloth
  for (let i = 0; i < 6; i++) { const t = i / 6; ctx.beginPath(); ctx.moveTo(L * t * 0.4, 50 - t * 30); ctx.quadraticCurveTo(L * t * 0.4 + 8, 40 - t * 30, L * t * 0.4 + 14, 44 - t * 34); ctx.stroke(); }
  // the eagle, wings open, a serpent in its beak
  const ex = L * 0.2, ey = 34;
  ctx.fillStyle = '#3a281b';
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(ex, ey); for (let k = 0; k <= 5; k++) ctx.lineTo(ex + sd * (6 + k * 3.6), ey - 18 + k * 2.6 + (k % 2) * 3); ctx.lineTo(ex + sd * 6, ey + 6); ctx.closePath(); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(ex, ey + 4, 5, 9, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(ex + 2, ey - 7, 3.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#e0a83a'; ctx.beginPath(); ctx.moveTo(ex + 4.5, ey - 8); ctx.lineTo(ex + 8, ey - 6.5); ctx.lineTo(ex + 4.6, ey - 5.6); ctx.fill();
  ctx.strokeStyle = '#4f6a3a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(ex + 7, ey - 6); ctx.bezierCurveTo(ex + 12, ey - 1, ex + 4, ey + 2, ex + 10, ey + 8); ctx.stroke();
  ctx.fillStyle = '#c9a36a'; for (let k = 0; k < 4; k++) ctx.fillRect(ex - 4 + k * 2.4, ey + 12, 0.8, 3); // talons
  // the jaguar, crouched, low and long
  const jx = c - L * 0.2, jy = 86;
  ctx.fillStyle = '#c98a36'; ctx.beginPath(); ctx.ellipse(jx, jy - 7, 15, 6, -0.05, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(jx - 15, jy - 10, 5.2, 4.4, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(jx - 18, jy - 14); ctx.lineTo(jx - 17, jy - 17); ctx.lineTo(jx - 15, jy - 14); ctx.moveTo(jx - 14, jy - 14); ctx.lineTo(jx - 12, jy - 17); ctx.lineTo(jx - 11, jy - 13.5); ctx.fill();
  ctx.fillStyle = '#2a1a10'; for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.arc(jx - 12 + r() * 26, jy - 11 + r() * 8, 0.8 + r() * 0.6, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#f2e6c8'; ctx.beginPath(); ctx.arc(jx - 17, jy - 11, 0.8, 0, 7); ctx.fill(); ctx.fillStyle = '#7a1f1a'; ctx.fillRect(jx - 20, jy - 8.6, 3, 1);
  // the tall figure in the cloak of fire
  ctx.fillStyle = '#d1552b';
  ctx.beginPath(); ctx.moveTo(c - 4, 30); ctx.bezierCurveTo(c - 20, 44, c - 26, 74, c - 32, 96); ctx.lineTo(c + 26, 96); ctx.bezierCurveTo(c + 20, 70, c + 14, 44, c + 5, 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9e3720'; for (const k of [-14, -4, 8, 17]) { ctx.beginPath(); ctx.moveTo(c + k * 0.3, 38); ctx.lineTo(c + k + 2, 96); ctx.lineTo(c + k - 1.5, 96); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#f0a050'; ctx.beginPath(); ctx.moveTo(c - 3, 32); ctx.bezierCurveTo(c - 12, 46, c - 17, 70, c - 22, 96); ctx.lineTo(c - 19, 96); ctx.bezierCurveTo(c - 13, 70, c - 9, 46, c - 1, 33); ctx.fill();
  ctx.fillStyle = '#6b4428'; ctx.beginPath(); ctx.ellipse(c, 25, 4.6, 5.6, 0.1, 0, 7); ctx.fill();
  ctx.fillStyle = '#1d1410'; ctx.beginPath(); ctx.moveTo(c - 4.6, 23); ctx.quadraticCurveTo(c - 2, 17, c + 4, 20); ctx.quadraticCurveTo(c - 10, 22, c - 14, 36); ctx.lineTo(c - 4, 28); ctx.fill(); // hair in the wind
  ctx.strokeStyle = '#6b4428'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(c + 5, 34); ctx.lineTo(c + 13, 22); ctx.lineTo(c + 15, 12); ctx.stroke(); // the raised arm
  // three men with rifles, in white cotton, sombreros, crossed cartridge belts
  for (let i = 0; i < 3; i++) {
    const fx = L * (0.7 + i * 0.09), fy = 94 + (i % 2) * 2;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(-0.08);
    ctx.fillStyle = '#e9e3d3'; ctx.beginPath(); ctx.moveTo(-5, -30); ctx.lineTo(5, -30); ctx.lineTo(6, 0); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b9b2a2'; ctx.fillRect(-0.5, -16, 1, 16); ctx.fillRect(-6, -30, 2.4, 30);
    ctx.strokeStyle = '#3a2a1e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, -30); ctx.lineTo(5, -18); ctx.moveTo(5, -30); ctx.lineTo(-5, -18); ctx.stroke();
    ctx.fillStyle = '#6b4428'; ctx.beginPath(); ctx.arc(0, -34, 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.ellipse(0, -36.5, 8.5, 2, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -39, 3.4, 3, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#241912'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(-1 - i, -50); ctx.stroke();
    ctx.restore();
  }
  // a band of nopales along the bottom, with their tunas
  for (let i = 0; i < L / 7; i++) {
    const nx = i * 7 + r() * 3, ny = 92 + r() * 4;
    ctx.fillStyle = r() < 0.5 ? '#4f7a3a' : '#3f6a32'; ctx.beginPath(); ctx.ellipse(nx, ny, 4.4, 6.2, (r() - 0.5) * 0.8, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(160,200,110,0.4)'; ctx.beginPath(); ctx.ellipse(nx - 1.2, ny - 1.5, 1.6, 3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8e0c0'; for (let k = 0; k < 4; k++) ctx.fillRect(nx - 2 + r() * 4, ny - 3 + r() * 6, 0.4, 0.4);
    if (r() < 0.6) { ctx.fillStyle = pick(r, ['#b8326a', '#c8402a', '#d9a23a']); ctx.beginPath(); ctx.ellipse(nx + (r() - 0.5) * 4, ny - 6.4, 1.3, 1.8, 0, 0, 7); ctx.fill(); }
  }
  ctx.strokeStyle = 'rgba(20,12,8,0.45)'; ctx.lineWidth = 0.7; // contours
  for (let i = 0; i < 5; i++) { const sx = r() * L; ctx.beginPath(); ctx.moveTo(sx, 100); ctx.bezierCurveTo(sx + (r() - 0.5) * 30, 60, sx + (r() - 0.5) * 30, 30, sx + (r() - 0.5) * 20, 0); ctx.stroke(); }
}
// A pointed (Gothic) arch path, base at y0, apex at y1.
export function pointedArch(ctx, x0, x1, y0, y1, spring = 0.5) {
  const cx = (x0 + x1) / 2, ys = y0 - (y0 - y1) * spring;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, ys);
  ctx.bezierCurveTo(x0, ys - (ys - y1) * 0.6, cx - (x1 - x0) * 0.16, y1 + 3, cx, y1);
  ctx.bezierCurveTo(cx + (x1 - x0) * 0.16, y1 + 3, x1, ys - (ys - y1) * 0.6, x1, ys);
  ctx.lineTo(x1, y0); ctx.closePath();
}
function lancet(ctx, x, y0, y1, w) { // a tall narrow window full of daylight
  ctx.fillStyle = '#8a8070'; pointedArch(ctx, x - w / 2 - 1.2, x + w / 2 + 1.2, y1 + 1, y0 - 1.2, 0.7); ctx.fill();
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#f7f4e6'); g.addColorStop(1, '#bcd3dc');
  ctx.fillStyle = g; pointedArch(ctx, x - w / 2, x + w / 2, y1, y0, 0.7); ctx.fill();
  ctx.fillStyle = 'rgba(80,70,60,0.6)'; ctx.fillRect(x - 0.3, y0 + 2, 0.6, y1 - y0 - 2); ctx.fillRect(x - w / 2, (y0 + y1) / 2, w, 0.6);
}
// The end of the nave (box perspective, as in the old adventure games): the end wall is a trapezoid
// between the slanted side walls; the pointed arch holds the allegory; below it, wood paneling with doors.
STRUCTURE_DRAW.muralwall = (ctx, s) => {
  const X = s.x * T, Y = s.y * T, W = s.w * T, H = s.h * T, sd = (s.side || 1) * T;
  const bx0 = X + sd, bx1 = X + W - sd;
  ctx.fillStyle = '#d6cfc1'; ctx.fillRect(X, Y, W, H); // the side walls running into the corners
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(X + W - sd, Y, sd, H);
  const wall = s.color || '#efe9dd';
  ctx.fillStyle = wall; ctx.beginPath(); ctx.moveTo(X + T, Y); ctx.lineTo(X + W - T, Y); ctx.lineTo(bx1, Y + H); ctx.lineTo(bx0, Y + H); ctx.closePath(); ctx.fill();
  const vg = ctx.createLinearGradient(0, Y, 0, Y + 26); vg.addColorStop(0, 'rgba(60,45,30,0.35)'); vg.addColorStop(1, 'rgba(60,45,30,0)');
  ctx.fillStyle = vg; ctx.fillRect(X, Y, W, 26); // the vault's shadow
  ctx.strokeStyle = 'rgba(90,70,50,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(X + T, Y); ctx.lineTo(bx0, Y + H); ctx.moveTo(X + W - T, Y); ctx.lineTo(bx1, Y + H); ctx.stroke(); // corner seams
  // wood paneling with two doors along the bottom
  const ph = 30, py = Y + H - ph;
  ctx.fillStyle = '#4a2c1a'; ctx.fillRect(bx0, py, bx1 - bx0, ph);
  ctx.fillStyle = '#6b4126'; ctx.fillRect(bx0, py, bx1 - bx0, 2.4); ctx.fillStyle = '#2e1a0f'; ctx.fillRect(bx0, py + 2.4, bx1 - bx0, 0.8);
  const cx = X + W / 2, doors = [cx - (bx1 - bx0) * 0.3, cx + (bx1 - bx0) * 0.3];
  for (let x = bx0 + 3; x < bx1 - 10; x += 13) {
    if (doors.some(d => Math.abs(x + 5 - d) < 12)) continue;
    ctx.fillStyle = '#5a3520'; ctx.fillRect(x, py + 6, 10, ph - 10); ctx.fillStyle = 'rgba(255,220,170,0.12)'; ctx.fillRect(x, py + 6, 10, 0.8); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, py + ph - 4.8, 10, 0.8);
  }
  for (const d of doors) {
    ctx.fillStyle = '#2e1a0f'; ctx.fillRect(d - 9, py + 3, 18, ph - 3);
    ctx.fillStyle = '#5e3822'; ctx.beginPath(); ctx.moveTo(d - 8, py + ph); ctx.lineTo(d - 8, py + 8); ctx.quadraticCurveTo(d, py + 2, d + 8, py + 8); ctx.lineTo(d + 8, py + ph); ctx.fill();
    ctx.fillStyle = '#4a2c1a'; ctx.fillRect(d - 0.4, py + 6, 0.8, ph - 6);
    for (const k of [-1, 1]) { ctx.fillStyle = '#6b4126'; ctx.fillRect(d + k * 4 - 2.6, py + 10, 5.2, 7); ctx.fillRect(d + k * 4 - 2.6, py + 19, 5.2, 8); }
    ctx.fillStyle = '#d9b24a'; ctx.beginPath(); ctx.arc(d - 1.8, py + 18, 0.8, 0, 7); ctx.arc(d + 1.8, py + 18, 0.8, 0, 7); ctx.fill();
  }
  ctx.fillStyle = '#3a2214'; ctx.fillRect(cx - 14, py + 4, 28, 6); ctx.fillStyle = '#d9b24a'; ctx.font = 'bold 3px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('J. C. OROZCO · 1940', cx, py + 7.2);
  // the pointed arch with the allegory
  const aw = Math.min((bx1 - bx0) * 0.6, 210), ax0 = cx - aw / 2, ax1 = cx + aw / 2, base = py - 1, apex = Y + 5;
  ctx.save(); pointedArch(ctx, ax0, ax1, base, apex, 0.42); ctx.clip();
  paintMural(ctx, ax0, apex, aw, base - apex, s.seed || 1940, 'color');
  ctx.restore();
  ctx.strokeStyle = '#cfc4ae'; ctx.lineWidth = 3; pointedArch(ctx, ax0 - 1.5, ax1 + 1.5, base, apex - 1.5, 0.42); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,50,35,0.6)'; ctx.lineWidth = 0.7; pointedArch(ctx, ax0 - 3, ax1 + 3, base, apex - 3, 0.42); ctx.stroke();
  // lancet windows between the arch and the corners, a grisaille panel under each
  for (const [wx, side] of [[(bx0 + ax0) / 2, 0], [(ax1 + bx1) / 2, 1]]) {
    lancet(ctx, wx, Y + 10, Y + 42, 10);
    const pw = Math.min(ax0 - bx0 - 12, 34), px = wx - pw / 2;
    if (pw > 12) { paintMural(ctx, px, Y + 48, pw, py - Y - 54, (s.seed || 1940) + 7 + side, 'grisaille'); ctx.strokeStyle = '#8a8070'; ctx.lineWidth = 0.8; ctx.strokeRect(px, Y + 48, pw, py - Y - 54); }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bx0, Y + H - 1.4, bx1 - bx0, 1.4);
};
// The long side walls of the nave, seen at a slant: an outer band (the wall's thickness), then the face,
// drawn as an elevation turned on its side: tall windows up top, the grisaille murals between
// pilasters, and the old glass-fronted bookcases with turned finials standing along the floor.
STRUCTURE_DRAW.sidemural = (ctx, s) => {
  const X = s.x * T, Y = s.y * T, W = s.w * T, H = s.h * T, F = W - T, bay = (s.bay || 5) * T;
  ctx.fillStyle = s.frame || '#5e4a38'; ctx.fillRect(s.right ? X + W - T : X, Y, T, H); // the top of the wall
  ctx.save();
  // elevation coordinates: ex runs along the wall, ey from the top of the wall (0) down to the floor (F)
  if (s.right) ctx.transform(0, 1, -1, 0, X + F, Y); else ctx.transform(0, 1, 1, 0, X + T, Y);
  ctx.beginPath(); ctx.rect(0, 0, H, F); ctx.clip();
  const pg = ctx.createLinearGradient(0, 0, 0, F); pg.addColorStop(0, '#e1dbcd'); pg.addColorStop(1, '#f1ece1');
  ctx.fillStyle = pg; ctx.fillRect(0, 0, H, F);
  const winB = F * 0.2, murB = F * 0.55; // window zone, mural zone, then the bookcases to the floor
  const n = Math.ceil(H / bay);
  for (let k = 0; k < n; k++) {
    const b0 = k * bay, b1 = Math.min(H, b0 + bay), mid = (b0 + b1) / 2;
    lancet(ctx, mid, 2, winB, 7);
    const mx = b0 + 7, mw = b1 - b0 - 10;
    if (mw > 10) { paintMural(ctx, mx, winB + 2, mw, murB - winB - 3, (s.seed || 7) * 31 + k, 'grisaille'); ctx.strokeStyle = '#7a7166'; ctx.lineWidth = 0.6; ctx.strokeRect(mx, winB + 2, mw, murB - winB - 3); }
    // two bookcases per bay
    const cw = (b1 - b0 - 8) / 2;
    for (let j = 0; j < 2; j++) bookcaseElev(ctx, b0 + 6 + j * (cw + 1), murB + 3, cw - 1, F - murB - 4, rng((s.seed || 7) * 97 + k * 2 + j));
    ctx.fillStyle = '#d8cfbd'; ctx.fillRect(b0, 0, 5, F); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(b0 + 4.2, 0, 0.8, F); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(b0, 0, 0.8, F); // pilaster
    ctx.fillStyle = '#c9bfab'; ctx.fillRect(b0 - 1, winB - 1, 7, 2);
  }
  ctx.fillStyle = '#5a3a24'; ctx.fillRect(0, F - 1.6, H, 1.6); // skirting
  ctx.restore();
  ctx.fillStyle = s.right ? 'rgba(20,14,10,0.16)' : 'rgba(255,250,235,0.06)'; ctx.fillRect(s.right ? X : X + T, Y, F, H); // the right wall is in shadow
  const fx = s.right ? X : X + W; // shadow on the floor
  const g = ctx.createLinearGradient(fx, 0, s.right ? fx - 8 : fx + 8, 0); g.addColorStop(0, 'rgba(25,18,12,0.3)'); g.addColorStop(1, 'rgba(25,18,12,0)');
  ctx.fillStyle = g; ctx.fillRect(s.right ? fx - 8 : fx, Y, 8, H);
  for (const p of s.plaques || []) { // brass plaques naming each section, readable from the floor
    const py = p.y * T, cx = s.right ? X + F * 0.3 : X + W - F * 0.3;
    ctx.font = 'bold 3.2px serif'; const tw = ctx.measureText(p.text).width + 4;
    ctx.fillStyle = '#3a2214'; ctx.fillRect(cx - tw / 2 - 0.6, py - 3.2, tw + 1.2, 6.4);
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(cx - tw / 2, py - 2.6, tw, 5.2);
    ctx.fillStyle = '#3a2214'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.text, cx, py + 0.2);
  }
  if (s.light && !s.right) for (let k = 0; k < Math.ceil(H / bay); k++) { // sunlight from the high windows across the floor
    const y0 = Y + k * bay + bay * 0.35, x0 = X + W;
    ctx.fillStyle = 'rgba(255,244,214,0.07)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + bay * 0.25); ctx.lineTo(x0 + 110, y0 + bay * 0.25 + 40); ctx.lineTo(x0 + 110, y0 + 40); ctx.closePath(); ctx.fill();
  }
};
// A glass-fronted bookcase, in elevation: cornice with turned finials, two glazed doors, the books.
function bookcaseElev(ctx, x, y, w, h, r) {
  ctx.fillStyle = '#3a2214'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#5a3520'; ctx.fillRect(x - 0.8, y, w + 1.6, 2.4); // cornice
  for (const fx of [x + 1, x + w / 2, x + w - 1]) { ctx.fillStyle = '#6b4126'; ctx.beginPath(); ctx.arc(fx, y - 1.2, 1.1, 0, 7); ctx.fill(); ctx.fillRect(fx - 0.4, y - 3.4, 0.8, 2); ctx.beginPath(); ctx.arc(fx, y - 3.6, 0.6, 0, 7); ctx.fill(); }
  const gx = x + 1.2, gw = w - 2.4, gy = y + 3, gh = h - 5, rows = Math.max(2, Math.round(gh / 6));
  for (let j = 0; j < rows; j++) {
    const sy = gy + j * gh / rows, rh = gh / rows;
    let bx = gx;
    while (bx < gx + gw - 0.6) { const bw = 0.7 + r() * 0.9; ctx.fillStyle = pick(r, ['#7a1f1a', '#2f4f6f', '#3f5a2e', '#6b4a30', '#8a6a2f', '#1f2d3a', '#5a2e4a', '#a37a3a', '#d9cdb0']); ctx.fillRect(bx, sy + rh * (0.15 + r() * 0.15), Math.min(bw, gx + gw - bx), rh * 0.8); bx += bw + 0.1; }
    ctx.fillStyle = '#3a2214'; ctx.fillRect(gx, sy + rh - 0.6, gw, 0.6);
  }
  ctx.fillStyle = 'rgba(200,225,235,0.18)'; ctx.fillRect(gx, gy, gw, gh); // the glass
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(gx + gw * 0.15, gy); ctx.lineTo(gx + gw * 0.3, gy); ctx.lineTo(gx + gw * 0.1, gy + gh); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx, gy + gh * 0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2214'; ctx.fillRect(x + w / 2 - 0.4, gy, 0.8, gh); // the meeting stiles
  ctx.fillStyle = '#d9b24a'; ctx.fillRect(x + w / 2 - 1.2, gy + gh * 0.5, 0.6, 0.9); ctx.fillRect(x + w / 2 + 0.6, gy + gh * 0.5, 0.6, 0.9);
  ctx.fillStyle = '#2e1a0f'; ctx.fillRect(x, y + h - 2, w, 2); // plinth
}

// ---- churches ---------------------------------------------------------------------------------------
// The main retablo: gilded columns twisting like barley sugar, three niches of saints, a dove on top.
SPRITES.retablo = {
  draw(ctx, s) {
    const w = s.fw || 100, h = s.fh || 96, gold = '#d9b24a', dg = '#9a7426';
    shadowBlob(ctx, 2, 0, w / 2, 4, 0.2);
    ctx.fillStyle = '#5a2e1c'; ctx.fillRect(-w / 2, -h, w, h); // red-brown ground behind the gilding
    ctx.fillStyle = gold; ctx.fillRect(-w / 2, -h, w, 4); ctx.fillRect(-w / 2, -h * 0.5, w, 3); ctx.fillRect(-w / 2, -6, w, 6);
    // crest: a semicircle with rays and the Holy Spirit
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(0, -h, w * 0.22, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff7e0'; ctx.beginPath(); ctx.ellipse(0, -h - w * 0.1, 3.2, 1.6, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-1, -h - w * 0.1); ctx.lineTo(-5, -h - w * 0.1 - 2.5); ctx.lineTo(-1.5, -h - w * 0.1 + 0.6); ctx.moveTo(1, -h - w * 0.1); ctx.lineTo(5, -h - w * 0.1 - 2.5); ctx.lineTo(1.5, -h - w * 0.1 + 0.6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,180,0.7)'; ctx.lineWidth = 0.5; for (let a = Math.PI; a <= Math.PI * 2; a += 0.25) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, -h - w * 0.1 + Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * w * 0.2, -h + Math.sin(a) * w * 0.2); ctx.stroke(); }
    // salomonic columns
    for (const cx of [-w / 2 + 6, -w / 6, w / 6, w / 2 - 6]) {
      for (let y = -h + 4; y < -6; y += 2.4) { ctx.fillStyle = ((y / 2.4) | 0) % 2 ? gold : dg; ctx.beginPath(); ctx.ellipse(cx + Math.sin(y * 0.35) * 1.2, y, 3.2, 1.6, 0.4, 0, 7); ctx.fill(); }
      ctx.fillStyle = gold; ctx.fillRect(cx - 4, -h + 2, 8, 3); ctx.fillRect(cx - 4, -9, 8, 3);
    }
    // niches with saints
    const niches = [[-w / 3, '#2f5d9a', 'Virgen'], [0, '#6b4a30', 'Francisco'], [w / 3, '#8e2f35', 'Antonio']];
    for (const [cx, robe, who] of niches) {
      for (const row of [0, 1]) {
        const top = row ? -h * 0.5 + 6 : -h + 8, bot = row ? -10 : -h * 0.5 - 2, nw = cx === 0 ? 18 : 13;
        ctx.fillStyle = '#3a1d12'; roundTop(ctx, cx - nw / 2, top, nw, bot - top);
        ctx.strokeStyle = gold; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - nw / 2, bot); ctx.lineTo(cx - nw / 2, top + nw / 2); ctx.arc(cx, top + nw / 2, nw / 2, Math.PI, 0); ctx.lineTo(cx + nw / 2, bot); ctx.stroke();
        if (row === 1) saint(ctx, cx, bot - 1, robe, cx === 0 ? 1.5 : 1.15);
        else { // paintings in the upper row
          ctx.fillStyle = pick(rng(cx + 7), ['#6a4b3a', '#4a5a6a', '#7a5a3a']); ctx.fillRect(cx - nw / 2 + 2, top + nw / 2, nw - 4, bot - top - nw / 2 - 2);
          ctx.fillStyle = 'rgba(255,230,180,0.35)'; ctx.beginPath(); ctx.arc(cx, top + nw / 2 + 5, 2.2, 0, 7); ctx.fill();
        }
      }
    }
    // San Francisco's knotted cord and a little sheen
    ctx.fillStyle = '#f2e6c8'; ctx.fillRect(-0.4, -21, 0.8, 7);
    ctx.fillStyle = 'rgba(255,250,220,0.18)'; ctx.fillRect(-w / 2, -h, 3, h);
  },
  anim(ctx, s, t) { // the gold catches the candlelight
    const w = s.fw || 100, h = s.fh || 96, a = 0.06 + Math.sin(t * 1.7) * 0.03;
    ctx.fillStyle = `rgba(255,220,120,${a})`; ctx.fillRect(-w / 2, -h, w, h);
  },
};
// The altar table: white cloth with lace, six candles, flowers (nube and gladiolas), the cross.
SPRITES.altarMesa = {
  draw(ctx, s) {
    const w = s.fw || 40;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.25);
    ctx.fillStyle = s.marble || '#e9e2d4'; ctx.fillRect(-w / 2, -12, w, 12);
    ctx.fillStyle = '#f9f6ee'; ctx.fillRect(-w / 2 - 1, -14, w + 2, 6);
    for (let x = -w / 2 - 1; x < w / 2 + 1; x += 2) { ctx.fillStyle = '#f9f6ee'; ctx.beginPath(); ctx.arc(x + 1, -8, 1, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#d9b24a'; ctx.fillRect(-w / 2, -3, w, 1);
    ctx.fillStyle = '#c8102e'; ctx.fillRect(-2, -12, 4, 6); ctx.fillStyle = '#d9b24a'; ctx.fillRect(-0.4, -11.4, 0.8, 4.4); ctx.fillRect(-1.4, -10.2, 2.8, 0.8);
    for (let i = 0; i < 6; i++) { const cx = -w / 2 + 4 + i * (w - 8) / 5; ctx.fillStyle = '#d9b24a'; ctx.fillRect(cx - 0.8, -16, 1.6, 2); ctx.fillStyle = '#f7f3ea'; ctx.fillRect(cx - 0.5, -21, 1, 5); }
    ctx.fillStyle = '#d9b24a'; ctx.fillRect(-0.6, -27, 1.2, 12); ctx.fillRect(-3, -24, 6, 1.2);
    for (const fx of [-w / 2 + 6, w / 2 - 6]) { ctx.fillStyle = '#7a8a5a'; ctx.fillRect(fx - 0.5, -22, 1, 7); for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 3 ? '#ffffff' : '#f2b6c8'; ctx.beginPath(); ctx.arc(fx + (i % 3 - 1) * 1.8, -22 - (i / 3 | 0) * 1.8, 1.1, 0, 7); ctx.fill(); } }
  },
  anim(ctx, s, t) {
    const w = s.fw || 40;
    for (let i = 0; i < 6; i++) { const cx = -w / 2 + 4 + i * (w - 8) / 5, f = Math.sin(t * 9 + i * 1.7) * 0.3; ctx.fillStyle = '#ffd25a'; ctx.beginPath(); ctx.ellipse(cx + f * 0.3, -22.4, 0.7, 1.4 + f * 0.3, 0, 0, 7); ctx.fill(); }
  },
};
// The pipe organ of San Francisco: a carved case, a façade of silver pipes, the console and its bench.
SPRITES.organ = {
  draw(ctx, s) {
    const w = s.fw || 44;
    shadowBlob(ctx, 2, 0, w / 2, 4, 0.25);
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(-w / 2, -62, w, 52);
    ctx.fillStyle = '#6b3f22'; ctx.fillRect(-w / 2 + 2, -60, w - 4, 48);
    // the pipes, tallest in the middle towers
    const n = 15;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 4 + i * (w - 8) / (n - 1), mid = Math.abs(i - (n - 1) / 2), tower = i === 2 || i === n - 3 || i === (n - 1) / 2;
      const ph = 22 + (7 - mid) * 2.6 + (tower ? 8 : 0);
      const g = ctx.createLinearGradient(x - 1.2, 0, x + 1.2, 0); g.addColorStop(0, '#8a8f96'); g.addColorStop(0.45, '#eef2f5'); g.addColorStop(1, '#6e737a');
      ctx.fillStyle = g; ctx.fillRect(x - 1.2, -18 - ph, 2.4, ph);
      ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.ellipse(x, -18 - ph * 0.22, 0.9, 0.5, 0, 0, 7); ctx.fill(); // the mouth
      ctx.fillStyle = '#aeb3b9'; ctx.beginPath(); ctx.moveTo(x - 1.2, -18); ctx.lineTo(x, -14.5); ctx.lineTo(x + 1.2, -18); ctx.fill(); // foot
    }
    // carved crest and gilded trim
    ctx.fillStyle = '#d9b24a'; ctx.fillRect(-w / 2, -64, w, 2); ctx.beginPath(); ctx.moveTo(-8, -64); ctx.quadraticCurveTo(0, -74, 8, -64); ctx.fill();
    ctx.fillStyle = '#4a2a18'; ctx.beginPath(); ctx.arc(0, -66, 2, 0, 7); ctx.fill();
    // console: two manuals of keys, stops, the bench
    ctx.fillStyle = '#3a2214'; ctx.fillRect(-w / 2 + 4, -14, w - 8, 10);
    ctx.fillStyle = '#f5f0e6'; ctx.fillRect(-w / 2 + 7, -12, w - 14, 2.2); ctx.fillRect(-w / 2 + 7, -9.2, w - 14, 2.2);
    ctx.fillStyle = '#1b1b1d'; for (let x = -w / 2 + 8; x < w / 2 - 7; x += 1.8) { if ((x * 10 | 0) % 7 < 4) { ctx.fillRect(x, -12, 0.8, 1.3); ctx.fillRect(x, -9.2, 0.8, 1.3); } }
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#f5f0e6', '#c8102e', '#2b2b2b'][i % 3]; ctx.beginPath(); ctx.arc(-w / 2 + 6 + i * 2.2, -16, 0.8, 0, 7); ctx.arc(w / 2 - 6 - i * 2.2, -16, 0.8, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-10, -3, 20, 3); ctx.fillRect(-9, 0, 1.4, 3); ctx.fillRect(7.6, 0, 1.4, 3);
  },
};
// A wheezy reed harmonium (the Sagrado Corazón has no grand organ: this does the job).
SPRITES.armonio = {
  draw(ctx) {
    shadowBlob(ctx, 2, 0, 11, 3, 0.25);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-10, -22, 20, 22); ctx.fillStyle = '#6b3f22'; ctx.fillRect(-9, -21, 18, 9);
    ctx.fillStyle = '#d9c7a8'; ctx.fillRect(-7, -19, 14, 5); ctx.strokeStyle = '#5a331d'; ctx.lineWidth = 0.4; for (let x = -6; x < 7; x += 2) { ctx.beginPath(); ctx.moveTo(x, -19); ctx.lineTo(x, -14); ctx.stroke(); }
    ctx.fillStyle = '#f5f0e6'; ctx.fillRect(-8, -11, 16, 2.4); ctx.fillStyle = '#1b1b1d'; for (let x = -7.4; x < 7.6; x += 1.9) if ((x * 10 | 0) % 7 < 4) ctx.fillRect(x, -11, 0.7, 1.4);
    ctx.fillStyle = '#3a2214'; ctx.fillRect(-6, -3, 4, 3); ctx.fillRect(2, -3, 4, 3); // the bellows pedals
  },
};
// Rows of veladoras on an iron stand: light one for $5.
SPRITES.veladoras = {
  draw(ctx, s) {
    const w = s.fw || 22;
    shadowBlob(ctx, 1, 0, w / 2, 2.5, 0.2);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-w / 2, -12, w, 1.2); ctx.fillRect(-w / 2, -7, w, 1.2); ctx.fillRect(-w / 2 + 1, -12, 1, 12); ctx.fillRect(w / 2 - 2, -12, 1, 12);
    const r = rng(s.seed || 4);
    for (const y of [-12, -7]) for (let x = -w / 2 + 2; x < w / 2 - 2; x += 2.6) { ctx.fillStyle = pick(r, ['#c8102e', '#f7f3ea', '#2f5d9a', '#f2c230']); ctx.fillRect(x, y - 3, 2, 3); }
  },
  anim(ctx, s, t) {
    const w = s.fw || 22, r = rng(s.seed || 4), lit = s.lit ?? 0.7;
    for (const y of [-12, -7]) for (let x = -w / 2 + 2; x < w / 2 - 2; x += 2.6) { if (r() > lit) continue; const f = Math.sin(t * 8 + x * 3 + y) * 0.25; ctx.fillStyle = 'rgba(255,200,90,0.9)'; ctx.beginPath(); ctx.ellipse(x + 1, y - 4, 0.5, 0.9 + f, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,190,90,0.12)'; ctx.beginPath(); ctx.ellipse(0, -10, w * 0.7, 8, 0, 0, 7); ctx.fill();
  },
};
SPRITES.confesionario = {
  draw(ctx) {
    shadowBlob(ctx, 2, 0, 12, 3, 0.25);
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(-12, -30, 24, 30); ctx.fillStyle = '#6b3f22'; ctx.fillRect(-11, -28, 22, 26);
    ctx.fillStyle = '#7a1f1a'; ctx.fillRect(-10, -26, 6, 22); ctx.fillRect(4, -26, 6, 22);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = -10; x < -4; x += 1.4) ctx.fillRect(x, -26, 0.4, 22); for (let x = 4; x < 10; x += 1.4) ctx.fillRect(x, -26, 0.4, 22);
    ctx.fillStyle = '#3a2214'; ctx.fillRect(-3, -26, 6, 24); ctx.fillStyle = '#d9b24a'; ctx.fillRect(-0.5, -34, 1, 5); ctx.fillRect(-2, -32.5, 4, 1);
    ctx.beginPath(); ctx.fillStyle = '#4a2a18'; ctx.moveTo(-13, -30); ctx.lineTo(0, -35); ctx.lineTo(13, -30); ctx.fill();
  },
};
SPRITES.pila = { // holy-water font of carved cantera
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 5, 2, 0.25);
    ctx.fillStyle = '#c9b48e'; ctx.fillRect(-1.6, -8, 3.2, 8); ctx.fillRect(-3, -1.5, 6, 1.5);
    ctx.fillStyle = '#d8c6a2'; ctx.beginPath(); ctx.ellipse(0, -9, 5, 2.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#9fc6d8'; ctx.beginPath(); ctx.ellipse(0, -9.3, 3.8, 1.5, 0, 0, 7); ctx.fill();
  },
};
SPRITES.ambon = { // lectern
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 5, 2, 0.25);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-1.4, -14, 2.8, 14); ctx.fillRect(-4, -1.5, 8, 1.5);
    ctx.fillStyle = '#6b3f22'; ctx.beginPath(); ctx.moveTo(-6, -15); ctx.lineTo(6, -15); ctx.lineTo(5, -19); ctx.lineTo(-5, -19); ctx.fill();
    ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-4.4, -19.4, 8.8, 1.6); ctx.fillStyle = '#c8102e'; ctx.fillRect(1.6, -19.4, 0.6, 3);
  },
};
SPRITES.sideAltar = { // a side altar: an image in a gilded frame, flowers and candles
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 10, 3, 0.2);
    ctx.fillStyle = '#e9e2d4'; ctx.fillRect(-9, -8, 18, 8); ctx.fillStyle = '#f9f6ee'; ctx.fillRect(-10, -10, 20, 3);
    ctx.fillStyle = '#d9b24a'; ctx.fillRect(-7, -32, 14, 21);
    if (s.image === 'guadalupe') {
      ctx.fillStyle = '#7a1f2a'; ctx.fillRect(-6, -31, 12, 19);
      ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.ellipse(0, -21.5, 4.4, 8.6, 0, 0, 7); ctx.fill(); // the rays
      ctx.fillStyle = '#2e6e5a'; ctx.beginPath(); ctx.moveTo(0, -29); ctx.quadraticCurveTo(-4, -22, -2.4, -14); ctx.lineTo(2.4, -14); ctx.quadraticCurveTo(4, -22, 0, -29); ctx.fill(); // the mantle
      ctx.fillStyle = '#e8a3a8'; ctx.fillRect(-1.2, -24, 2.4, 9); ctx.fillStyle = '#c69472'; ctx.beginPath(); ctx.arc(0, -26.4, 1.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#f2f2f2'; for (let i = 0; i < 5; i++) ctx.fillRect(-2 + (i % 3), -27 + i * 2.4, 0.4, 0.4);
    } else { // Sagrado Corazón: red robe, the heart on the chest
      ctx.fillStyle = '#e8dcc6'; ctx.fillRect(-6, -31, 12, 19);
      ctx.fillStyle = '#b81d24'; ctx.beginPath(); ctx.moveTo(0, -27); ctx.lineTo(-3.5, -13); ctx.lineTo(3.5, -13); ctx.fill();
      ctx.fillStyle = '#f2ead6'; ctx.fillRect(-1.6, -26, 3.2, 8);
      ctx.fillStyle = '#e8b04b'; ctx.beginPath(); ctx.arc(0, -22, 1.8, 0, 7); ctx.fill(); ctx.fillStyle = '#b81d24'; ctx.beginPath(); ctx.arc(0, -22, 1.1, 0, 7); ctx.fill();
      ctx.fillStyle = '#c69472'; ctx.beginPath(); ctx.arc(0, -28.4, 1.4, 0, 7); ctx.fill();
    }
    for (const x of [-7.5, 7.5]) { ctx.fillStyle = '#f7f3ea'; ctx.fillRect(x - 0.5, -15, 1, 4); }
  },
  anim(ctx, s, t) { for (const x of [-7.5, 7.5]) { ctx.fillStyle = '#ffd25a'; ctx.beginPath(); ctx.ellipse(x, -16 + Math.sin(t * 9 + x) * 0.2, 0.55, 1.1, 0, 0, 7); ctx.fill(); } },
};
SPRITES.lampara = { // the red sanctuary lamp, always lit, hanging on a chain
  draw(ctx) { ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -40); ctx.stroke(); ctx.fillStyle = '#d9b24a'; ctx.beginPath(); ctx.ellipse(0, -39, 3, 1.4, 0, 0, 7); ctx.fill(); },
  anim(ctx, s, t) { ctx.fillStyle = `rgba(220,30,40,${0.75 + Math.sin(t * 5) * 0.15})`; ctx.beginPath(); ctx.arc(0, -37.4, 1.6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,60,60,0.12)'; ctx.beginPath(); ctx.arc(0, -37, 9, 0, 7); ctx.fill(); },
};
SPRITES.pewNice = { // a pew with its kneeler and carved ends
  draw(ctx, s) {
    const w = s.fw || 80;
    ctx.fillStyle = 'rgba(30,20,12,0.22)'; ctx.fillRect(-w / 2 + 2, -1, w - 2, 2.4);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-w / 2, -13, w, 3); ctx.fillStyle = '#6b3f22'; ctx.fillRect(-w / 2, -9, w, 3.4);
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(-w / 2, -4.6, w, 1.6); // the kneeler
    for (const x of [-w / 2, w / 2 - 2.4]) { ctx.fillStyle = '#4a2a18'; ctx.fillRect(x, -15, 2.4, 15); ctx.beginPath(); ctx.arc(x + 1.2, -15, 1.4, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,230,190,0.15)'; ctx.fillRect(-w / 2, -13, w, 0.8);
  },
};
// The Gothic church: slim clustered columns that hold up the ribbed vault, and its white altar of pinnacles.
SPRITES.gothicColumn = {
  draw(ctx, s) {
    const h = s.fh || 70;
    shadowBlob(ctx, 1, 0, 6, 2.2, 0.3);
    ctx.fillStyle = '#b8ae9e'; ctx.fillRect(-5, -3, 10, 3);
    for (const [x, c] of [[-3.4, '#cfc6b6'], [3.4, '#a89e8e'], [0, '#e2dbcf']]) { ctx.fillStyle = c; ctx.fillRect(x - 1.6, -h, 3.2, h - 3); }
    ctx.fillStyle = '#d6cdbd'; ctx.fillRect(-5, -h - 3, 10, 3);
    ctx.strokeStyle = 'rgba(80,70,60,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, -h - 3); ctx.quadraticCurveTo(-14, -h - 14, -26, -h - 10); ctx.moveTo(0, -h - 3); ctx.quadraticCurveTo(14, -h - 14, 26, -h - 10); ctx.stroke();
  },
};
SPRITES.gothicAltar = {
  draw(ctx, s) {
    const w = s.fw || 70;
    shadowBlob(ctx, 2, 0, w / 2, 4, 0.22);
    ctx.fillStyle = '#efeae0'; ctx.fillRect(-w / 2, -12, w, 12); ctx.fillStyle = '#f9f6ee'; ctx.fillRect(-w / 2 - 1, -14, w + 2, 4);
    // a screen of pinnacles and tracery behind
    for (let i = 0; i < 7; i++) {
      const x = -w / 2 + 5 + i * (w - 10) / 6, ph = i === 3 ? 74 : 40 + (3 - Math.abs(i - 3)) * 7;
      ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.moveTo(x - 3, -14); ctx.lineTo(x - 3, -14 - ph * 0.7); ctx.lineTo(x, -14 - ph); ctx.lineTo(x + 3, -14 - ph * 0.7); ctx.lineTo(x + 3, -14); ctx.fill();
      ctx.strokeStyle = '#c9c0b0'; ctx.lineWidth = 0.4; ctx.stroke();
      ctx.fillStyle = '#d9b24a'; ctx.beginPath(); ctx.arc(x, -14 - ph, 0.9, 0, 7); ctx.fill();
    }
    // the Sacred Heart in the tall middle niche
    ctx.fillStyle = '#c9d6e8'; ctx.beginPath(); ctx.moveTo(-6, -16); ctx.lineTo(-6, -56); ctx.lineTo(0, -64); ctx.lineTo(6, -56); ctx.lineTo(6, -16); ctx.fill();
    ctx.fillStyle = '#f2ead6'; ctx.beginPath(); ctx.moveTo(0, -55); ctx.lineTo(-4.4, -18); ctx.lineTo(4.4, -18); ctx.fill();
    ctx.fillStyle = '#b81d24'; ctx.beginPath(); ctx.moveTo(-1.4, -50); ctx.lineTo(-5, -20); ctx.lineTo(-3, -20); ctx.lineTo(0, -46); ctx.fill(); // the red mantle
    ctx.fillStyle = '#c69472'; ctx.beginPath(); ctx.arc(0, -57.4, 2, 0, 7); ctx.fill(); ctx.fillStyle = '#5a3a22'; ctx.fillRect(-2.2, -59.4, 4.4, 1.6);
    ctx.fillStyle = '#e8b04b'; ctx.beginPath(); ctx.arc(0, -44, 2.4, 0, 7); ctx.fill(); ctx.fillStyle = '#d0202a'; heartPath(ctx, 0, -44, 1.5); ctx.fill();
    ctx.fillStyle = '#c69472'; ctx.beginPath(); ctx.arc(-2.6, -42, 0.8, 0, 7); ctx.arc(2.6, -40, 0.8, 0, 7); ctx.fill();
    for (let i = 0; i < 6; i++) { const cx = -w / 2 + 4 + i * (w - 8) / 5; ctx.fillStyle = '#f7f3ea'; ctx.fillRect(cx - 0.5, -21, 1, 6); }
  },
  anim(ctx, s, t) { const w = s.fw || 70; for (let i = 0; i < 6; i++) { const cx = -w / 2 + 4 + i * (w - 8) / 5; ctx.fillStyle = '#ffd25a'; ctx.beginPath(); ctx.ellipse(cx, -22.2 + Math.sin(t * 9 + i) * 0.2, 0.6, 1.2, 0, 0, 7); ctx.fill(); } },
};
function heartPath(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y + r); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.4); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r); }

// The nuns' little shop (el torno): a counter behind an iron grille, shelves of rompope and cajeta,
// rosaries hanging, ates and cocadas in a glass case.
SPRITES.tornoMonjas = {
  draw(ctx, s) {
    const w = s.fw || 60;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.2);
    // back shelves
    ctx.fillStyle = '#6b3f22'; ctx.fillRect(-w / 2, -44, w, 26);
    for (let j = 0; j < 3; j++) {
      ctx.fillStyle = '#8a5a34'; ctx.fillRect(-w / 2 + 1, -36 + j * 8, w - 2, 1.2);
      for (let x = -w / 2 + 3; x < w / 2 - 3; x += 3.2) {
        if (j === 0) { ctx.fillStyle = '#f2d55a'; ctx.fillRect(x, -43, 2.2, 6); ctx.fillStyle = '#f7f3ea'; ctx.fillRect(x + 0.4, -44.4, 1.4, 1.4); ctx.fillStyle = '#7a1f2a'; ctx.fillRect(x, -40, 2.2, 1.2); } // rompope
        else if (j === 1) { ctx.fillStyle = (x | 0) % 2 ? '#8a4a1a' : '#c8102e'; ctx.fillRect(x, -34.6, 2.6, 5.2); ctx.fillStyle = '#f7f3ea'; ctx.fillRect(x, -33, 2.6, 1); } // cajeta and ate
        else { ctx.strokeStyle = (x | 0) % 3 ? '#5a3a22' : '#e8e0c8'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(x + 1.2, -24, 1.6, 0, Math.PI); ctx.stroke(); ctx.fillStyle = '#d9b24a'; ctx.fillRect(x + 1, -22.4, 0.6, 1.4); } // rosaries
      }
    }
    // the counter and the grille
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-w / 2, -14, w, 14); ctx.fillStyle = '#7a4a28'; ctx.fillRect(-w / 2 - 1, -16, w + 2, 3);
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 0.6;
    for (let x = -w / 2 + 2; x < w / 2; x += 4) { ctx.beginPath(); ctx.moveTo(x, -46); ctx.lineTo(x, -17); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-w / 2, -32); ctx.lineTo(w / 2, -32); ctx.stroke();
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-8, -24, 16, 7); ctx.fillStyle = '#5a331d'; ctx.fillRect(-7, -23, 14, 6); // the window opening
    // a glass case on the counter with cocadas, obleas and galletas
    ctx.fillStyle = 'rgba(200,230,245,0.45)'; ctx.fillRect(-w / 2 + 4, -22, 18, 6); ctx.strokeStyle = '#5a331d'; ctx.strokeRect(-w / 2 + 4, -22, 18, 6);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#f3e6c4', '#e88aa8', '#f7f3ea'][i % 3]; ctx.beginPath(); ctx.arc(-w / 2 + 6 + i * 2.8, -18, 1.1, 0, 7); ctx.fill(); }
    if (s.sign) { ctx.fillStyle = '#f7f3ea'; ctx.fillRect(w / 2 - 22, -13, 20, 6); ctx.fillStyle = '#5a1a22'; ctx.font = 'bold 2.4px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.sign, w / 2 - 12, -10); }
  },
};

// ---- the library --------------------------------------------------------------------------------------
// An old wooden bookcase with a carved crest and a brass plaque naming its section.
SPRITES.estante = {
  draw(ctx, s) {
    const w = s.fw || 44, h = s.fh || 44, r = rng(s.seed || 9);
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.25);
    ctx.fillStyle = '#3e2414'; ctx.fillRect(-w / 2, -h, w, h);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-w / 2 + 1.5, -h + 4, w - 3, h - 6);
    // carved crest
    ctx.fillStyle = '#4a2a18'; ctx.beginPath(); ctx.moveTo(-w / 2, -h); ctx.quadraticCurveTo(0, -h - 7, w / 2, -h); ctx.fill();
    ctx.fillStyle = '#6b3f22'; ctx.beginPath(); ctx.arc(0, -h - 2, 2, 0, 7); ctx.fill();
    const rows = 5, rh = (h - 8) / rows;
    for (let j = 0; j < rows; j++) {
      const y = -h + 5 + j * rh;
      let x = -w / 2 + 2.4;
      while (x < w / 2 - 3) {
        const bw = 1.2 + r() * 1.6, bh = rh - 1.4 - r() * 2.2;
        if (r() < 0.06) { x += 2.5; continue; } // a gap
        const col = pick(r, s.palette || ['#7a1f1a', '#2f4f6f', '#3f5a2e', '#6b4a30', '#8a6a2f', '#1f2d3a', '#5a2e4a', '#a37a3a', '#e8dcc0']);
        ctx.fillStyle = col; ctx.fillRect(x, y + rh - 1.2 - bh, bw, bh);
        ctx.fillStyle = 'rgba(255,230,160,0.45)'; ctx.fillRect(x, y + rh - 1.2 - bh + 1.2, bw, 0.4); ctx.fillRect(x, y + rh - 3, bw, 0.4);
        x += bw + 0.15;
        if (r() < 0.05 && x < w / 2 - 6) { ctx.save(); ctx.translate(x + 1, y + rh - 1.2); ctx.rotate(-0.35); ctx.fillStyle = pick(r, ['#7a1f1a', '#2f4f6f', '#6b4a30']); ctx.fillRect(0, -bh + 1, 1.8, bh - 1); ctx.restore(); x += 3; }
      }
      ctx.fillStyle = '#3e2414'; ctx.fillRect(-w / 2 + 1.5, y + rh - 1.2, w - 3, 1.2);
    }
    if (s.section) { // brass plaque
      const pw = Math.min(w - 6, s.section.length * 2.2 + 6);
      ctx.fillStyle = '#c9a54a'; ctx.fillRect(-pw / 2, -h + 0.6, pw, 3.4); ctx.fillStyle = '#3e2414'; ctx.font = 'bold 2.4px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.section, 0, -h + 2.4);
    }
    if (s.ladder) { ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(w / 2 - 8, 0); ctx.lineTo(w / 2 - 5, -h + 2); ctx.moveTo(w / 2 - 3, 0); ctx.lineTo(w / 2, -h + 2); ctx.stroke(); for (let y = -4; y > -h + 4; y -= 5) { ctx.beginPath(); ctx.moveTo(w / 2 - 8 + (-y / h) * 3, y); ctx.lineTo(w / 2 - 3 + (-y / h) * 3, y); ctx.stroke(); } }
  },
};
// A long reading table with green banker's lamps and a couple of open books.
SPRITES.mesaLectura = {
  draw(ctx, s) {
    const w = s.fw || 50;
    shadowBlob(ctx, 2, 0, w / 2, 4, 0.22);
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(-w / 2 + 2, -8, 2, 8); ctx.fillRect(w / 2 - 4, -8, 2, 8);
    ctx.fillStyle = '#6b3f22'; ctx.fillRect(-w / 2, -12, w, 5); ctx.fillStyle = '#8a5a34'; ctx.fillRect(-w / 2, -12, w, 1.4);
    if (s.green) { // the Gabino Ortiz's tables: green leather inlaid in the wood, worn pale where elbows rest
      ctx.fillStyle = '#4a2a18'; ctx.fillRect(-w / 2, -16, w, 9); ctx.fillStyle = '#2f5a40'; ctx.fillRect(-w / 2 + 1.4, -15.2, w - 2.8, 6.4);
      ctx.fillStyle = 'rgba(200,230,200,0.12)'; for (const k of [-0.3, 0, 0.3]) ctx.fillRect(k * w - 4, -13.6, 8, 3);
      ctx.fillStyle = '#5a3520'; ctx.fillRect(-w / 2, -7.4, w, 1.6);
      for (const [lx, ly] of [[-w / 2 + 2, -6], [w / 2 - 4, -6]]) { ctx.fillStyle = '#3a2214'; ctx.fillRect(lx, ly, 2, 6); }
    }
    for (const lx of (s.lamps || [-w / 4, w / 4])) {
      ctx.fillStyle = '#c9a54a'; ctx.fillRect(lx - 0.4, -18, 0.8, 6); ctx.fillRect(lx - 2, -12.6, 4, 0.8);
      ctx.fillStyle = '#1f6a45'; ctx.beginPath(); ctx.ellipse(lx, -18.4, 3.6, 1.6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(lx - 3.6, -18.6, 7.2, 1.2);
    }
    if (s.books !== false) {
      ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-6, -13.4, 5, 2.4); ctx.fillRect(-1, -13.4, 5, 2.4); ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(-1, -13.4); ctx.lineTo(-1, -11); ctx.stroke();
      ctx.fillStyle = '#2f4f6f'; ctx.fillRect(w / 2 - 12, -14.6, 6, 1.4); ctx.fillStyle = '#7a1f1a'; ctx.fillRect(w / 2 - 11.6, -16, 5, 1.4);
    }
  },
  anim(ctx, s, t, night) { const w = s.fw || 50; for (const lx of (s.lamps || [-w / 4, w / 4])) { ctx.fillStyle = 'rgba(255,230,150,0.16)'; ctx.beginPath(); ctx.ellipse(lx, -12, 7, 2.6, 0, 0, 7); ctx.fill(); } },
};
// A carved wooden chair with a tall back. back:'up' — its back to the wall at the top (you see the
// seat and the carving); back:'down' — its back to you, drawn over whoever sits in it.
SPRITES.sillaTallada = {
  draw(ctx, s) {
    const wood = '#5a331d', dark = '#3a2214';
    shadowBlob(ctx, 1, 0, 5, 1.8, 0.2);
    if (s.back === 'down') {
      ctx.fillStyle = dark; ctx.fillRect(-4.6, -4, 1.4, 4); ctx.fillRect(3.2, -4, 1.4, 4);
      ctx.fillStyle = wood; ctx.fillRect(-4.6, -14, 9.2, 10.4); ctx.fillStyle = dark; ctx.fillRect(-3.2, -12.4, 6.4, 7);
      ctx.fillStyle = '#6b4126'; ctx.fillRect(-1, -12.4, 2, 7); // the carved splat
      ctx.fillStyle = wood; ctx.beginPath(); ctx.moveTo(-5, -14); ctx.quadraticCurveTo(0, -17.6, 5, -14); ctx.fill();
      ctx.fillStyle = '#8a5a34'; ctx.beginPath(); ctx.arc(-4.4, -14.6, 0.9, 0, 7); ctx.arc(4.4, -14.6, 0.9, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = wood; ctx.fillRect(-4.6, -18, 9.2, 10); ctx.fillStyle = '#6b4126'; ctx.fillRect(-3.4, -16.4, 6.8, 7);
      ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, -13, 2, 0, 7); ctx.fill(); ctx.fillStyle = '#8a5a34'; ctx.beginPath(); ctx.arc(0, -13, 1, 0, 7); ctx.fill();
      ctx.fillStyle = wood; ctx.beginPath(); ctx.moveTo(-5, -18); ctx.quadraticCurveTo(0, -21.6, 5, -18); ctx.fill();
      ctx.fillStyle = '#6b4126'; ctx.fillRect(-4.6, -8, 9.2, 4); ctx.fillStyle = dark; ctx.fillRect(-4.6, -4, 1.4, 4); ctx.fillRect(3.2, -4, 1.4, 4);
    }
  },
};
// The front desk: card catalogue drawers, the date stamp and a tired computer.
SPRITES.mostrador = {
  draw(ctx, s) {
    const w = s.fw || 50;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.25);
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(-w / 2, -13, w, 13); ctx.fillStyle = '#6b3f22'; ctx.fillRect(-w / 2 - 1, -15, w + 2, 3);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#5a331d'; ctx.fillRect(-w / 2 + 3 + i * (w - 6) / 4, -11, (w - 6) / 4 - 1, 9); ctx.fillStyle = '#c9a54a'; ctx.fillRect(-w / 2 + 3 + i * (w - 6) / 4 + (w - 6) / 8 - 1.2, -7, 2.4, 0.8); }
    ctx.fillStyle = '#d9d3c4'; ctx.fillRect(w / 2 - 14, -24, 10, 8); ctx.fillStyle = '#3a6a8a'; ctx.fillRect(w / 2 - 13, -23, 8, 6); ctx.fillStyle = '#bdb6a6'; ctx.fillRect(w / 2 - 11, -16, 4, 1.4);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-w / 2 + 6, -17.6, 2.6, 2.6); ctx.fillStyle = '#7a1f1a'; ctx.fillRect(-w / 2 + 10, -16.4, 4, 1.4);
    if (s.sign) { ctx.font = 'bold 2.6px serif'; const tw = Math.min(w - 4, ctx.measureText(s.sign).width + 4); ctx.fillStyle = '#f5ecd8'; ctx.fillRect(-tw / 2, -12, tw, 4.4); ctx.fillStyle = '#5a1a22'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.sign, 0, -9.8, tw - 2); }
  },
};
SPRITES.fichero = { // the card catalogue
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 8, 2.5, 0.25);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-8, -18, 16, 18);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#6b3f22'; ctx.fillRect(-7 + i * 5, -17 + j * 4.2, 4.4, 3.6); ctx.fillStyle = '#c9a54a'; ctx.fillRect(-5.4 + i * 5, -15.6 + j * 4.2, 1.2, 0.7); ctx.fillStyle = '#f2ead6'; ctx.fillRect(-6.4 + i * 5, -16.6 + j * 4.2, 3, 0.8); }
  },
};
SPRITES.globo = { draw(ctx) { shadowBlob(ctx, 1, 0, 4, 1.6); ctx.fillStyle = '#5a331d'; ctx.fillRect(-0.6, -10, 1.2, 10); ctx.fillRect(-3, -1, 6, 1); ctx.fillStyle = '#4f8ab0'; ctx.beginPath(); ctx.arc(0, -13, 4.4, 0, 7); ctx.fill(); ctx.fillStyle = '#8fb25a'; ctx.beginPath(); ctx.ellipse(-1.4, -14, 1.6, 2.4, 0.3, 0, 7); ctx.ellipse(2, -11.6, 1.2, 1.4, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#c9a54a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(0, -13, 5.2, -2.2, 1.2); ctx.stroke(); } };

// ---- the Ayuntamiento ---------------------------------------------------------------------------------
SPRITES.arcadeColumn = { // a stone column of the patio's arcade
  draw(ctx, s) {
    const h = s.fh || 40;
    shadowBlob(ctx, 1, 0, 5, 2, 0.28);
    ctx.fillStyle = '#c9b48e'; ctx.fillRect(-4.5, -3, 9, 3); ctx.fillRect(-4.5, -h - 3, 9, 3);
    const g = ctx.createLinearGradient(-3, 0, 3, 0); g.addColorStop(0, '#bfa983'); g.addColorStop(0.5, '#e0cfab'); g.addColorStop(1, '#a8926c');
    ctx.fillStyle = g; ctx.fillRect(-3, -h, 6, h - 3);
  },
};
SPRITES.ventanilla = { // a service window with its sign (Registro Civil, Tesorería…)
  draw(ctx, s) {
    const w = s.fw || 34;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.2);
    ctx.fillStyle = '#d8d2c4'; ctx.fillRect(-w / 2, -26, w, 26);
    ctx.fillStyle = 'rgba(200,230,245,0.55)'; ctx.fillRect(-w / 2 + 3, -22, w - 6, 9); ctx.strokeStyle = '#8a8478'; ctx.lineWidth = 0.6; ctx.strokeRect(-w / 2 + 3, -22, w - 6, 9);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-3, -13.6, 6, 1.2);
    ctx.fillStyle = '#9a8a6a'; ctx.fillRect(-w / 2 - 1, -12, w + 2, 2.4);
    ctx.fillStyle = s.signBg || '#3f3a33'; ctx.fillRect(-w / 2 + 1, -26, w - 2, 4); ctx.fillStyle = s.signFg || '#f1e2b8'; ctx.font = 'bold 2.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.sign || 'VENTANILLA', 0, -24);
    ctx.fillStyle = '#f5f0e6'; ctx.fillRect(w / 2 - 9, -8, 5, 3); ctx.fillRect(-w / 2 + 4, -7, 6, 2); // papers
  },
};
SPRITES.escalera = { // a grand stair with a wrought-iron rail; the label says where it goes
  draw(ctx, s) {
    const w = s.fw || 32, h = s.fh || 40, up = s.dir !== 'down';
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.2);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const y = -(i + 1) * (h / n) * (up ? 1 : 0.5);
      ctx.fillStyle = i % 2 ? '#cdbfa6' : '#ddd0b8'; ctx.fillRect(-w / 2, y, w, h / n + 0.5);
      ctx.fillStyle = 'rgba(70,55,40,0.4)'; ctx.fillRect(-w / 2, y + h / n - 0.6, w, 0.6);
    }
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 0.7;
    for (const x of [-w / 2, w / 2]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -h * (up ? 1 : 0.5) - 6); ctx.stroke(); for (let y = -2; y > -h * (up ? 1 : 0.5); y -= 3) { ctx.beginPath(); ctx.arc(x, y - 1.2, 1, 0, 7); ctx.stroke(); } }
    if (s.label) { ctx.fillStyle = '#3f3a33'; ctx.fillRect(-14, -h * (up ? 1 : 0.5) - 12, 28, 5); ctx.fillStyle = '#f1e2b8'; ctx.font = 'bold 2.6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.label, 0, -h * (up ? 1 : 0.5) - 9.5); }
  },
};
SPRITES.mesaCabildo = { // the long council table with its chairs and little flags
  draw(ctx, s) {
    const w = s.fw || 90;
    shadowBlob(ctx, 3, 0, w / 2, 5, 0.22);
    for (let x = -w / 2 + 6; x < w / 2 - 4; x += 10) { ctx.fillStyle = '#3a2214'; ctx.fillRect(x - 2.6, -20, 5.2, 4); ctx.fillRect(x - 2.6, 1, 5.2, 3); }
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-w / 2, -16, w, 14); ctx.fillStyle = '#7a4a28'; ctx.fillRect(-w / 2, -16, w, 2);
    ctx.fillStyle = '#1f5a3a'; ctx.fillRect(-w / 2 + 3, -13, w - 6, 8);
    for (let x = -w / 2 + 6; x < w / 2 - 4; x += 10) { ctx.fillStyle = '#f5f0e6'; ctx.fillRect(x - 2, -11, 4, 3); ctx.fillStyle = '#9fc6d8'; ctx.fillRect(x + 2.6, -11.6, 1.2, 2.4); }
    ctx.fillStyle = '#c9c3b8'; ctx.fillRect(-0.3, -24, 0.6, 9); for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#006847', '#ffffff', '#ce1126'][i]; ctx.fillRect(0.3 + i * 1.6, -24, 1.6, 3.4); }
  },
};
SPRITES.escritorio = { // the Presidente's desk: carved, with a leather chair, a phone, papers and a nameplate
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 18, 4, 0.25);
    ctx.fillStyle = '#4a2414'; ctx.fillRect(-7, -30, 14, 14); ctx.fillStyle = '#5a2e1c'; ctx.fillRect(-6, -29, 12, 10); // chair back
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(-18, -16, 36, 16); ctx.fillStyle = '#6b3f22'; ctx.fillRect(-19, -18, 38, 4);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-15, -12, 10, 9); ctx.fillRect(5, -12, 10, 9); ctx.fillStyle = '#c9a54a'; ctx.fillRect(-11, -8, 2, 0.8); ctx.fillRect(9, -8, 2, 0.8);
    ctx.fillStyle = '#f5f0e6'; ctx.fillRect(-12, -20, 8, 3); ctx.fillRect(-11, -21, 8, 3); ctx.fillStyle = '#1b1b1b'; ctx.fillRect(8, -21, 5, 3); ctx.fillRect(9, -22.4, 3, 1.4);
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(-6, -19.6, 12, 2.6); ctx.fillStyle = '#3a2a1a'; ctx.font = 'bold 1.6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.plate || 'PRESIDENTE MUNICIPAL', 0, -18.3);
  },
};

export {};

// A little wooden plaque with a room's name (and, sometimes, CUPO LLENO on a paper taped beneath).
SPRITES.placa = {
  draw(ctx, s) {
    const t = s.text || '', w = Math.max(20, t.length * 2.3 + 6);
    ctx.fillStyle = '#5a5f63'; ctx.fillRect(-0.6, -18, 1.2, 18);
    ctx.fillStyle = '#6b3f22'; roundRect(ctx, -w / 2, -26, w, 7, 1.2); ctx.fill();
    ctx.fillStyle = '#f2e6c8'; ctx.font = 'bold 3px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, 0, -22.4);
    if (s.full) { ctx.save(); ctx.translate(0, -16); ctx.rotate(-0.08); ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-9, -2.6, 18, 5); ctx.fillStyle = '#c8102e'; ctx.font = 'bold 2.6px sans-serif'; ctx.fillText('CUPO LLENO', 0, 0); ctx.restore(); }
    if (s.open) { ctx.save(); ctx.translate(0, -16); ctx.rotate(0.06); ctx.fillStyle = '#e8f5e0'; ctx.fillRect(-10, -2.6, 20, 5); ctx.fillStyle = '#2e7d32'; ctx.font = 'bold 2.4px sans-serif'; ctx.fillText('¡HAY LUGARES!', 0, 0); ctx.restore(); }
  },
};
