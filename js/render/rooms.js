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
    for (let y = Y; y < Y + H; y += 8) for (let x = X; x < X + W; x += 8) {
      ctx.fillStyle = mix('#b8643f', '#cf7f55', hash2(x, y, 3)); ctx.fillRect(x + 0.4, y + 0.4, 7.2, 7.2);
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

// Murals in the manner of the Mexican muralists: big bodies, fire, crowds, raised arms — an
// original evocation for the game, not a copy of any painting.
export function paintMural(ctx, x, y, w, h, seed, mode = 'color', detail = false) {
  const r = rng(seed);
  const pal = mode === 'grisaille' ? ['#2b2826', '#4a4642', '#6e6964', '#98928a', '#c7c0b4', '#e6dfd2'] : ['#2b1d16', '#6b2e1f', '#a3401f', '#d9762b', '#e9b04a', '#3b3f4a', '#6e7f86', '#d9c7a8'];
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, mode === 'grisaille' ? '#bdb5a8' : '#c99a5a'); bg.addColorStop(1, mode === 'grisaille' ? '#6e6964' : '#7a3b22');
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  // fire licking up from below (the muralists' great subject)
  for (let i = 0; i < w / 6; i++) {
    const fx = x + r() * w, fh = h * (0.25 + r() * 0.45);
    ctx.fillStyle = mode === 'grisaille' ? rgba('#e6dfd2', 0.3) : rgba(pick(r, ['#e9b04a', '#d9762b', '#a3401f']), 0.6);
    ctx.beginPath(); ctx.moveTo(fx - 3, y + h); ctx.quadraticCurveTo(fx + (r() - 0.5) * 8, y + h - fh * 0.6, fx + (r() - 0.5) * 4, y + h - fh); ctx.quadraticCurveTo(fx + 2, y + h - fh * 0.5, fx + 4, y + h); ctx.fill();
  }
  // a crowd of angular figures with raised arms; a few huge ones dominate
  const n = Math.max(4, Math.floor(w / 10));
  for (let i = 0; i < n; i++) {
    const big = r() < 0.18, k = big ? h / 22 : h / (40 + r() * 16);
    const fx = x + (i + 0.5) * (w / n) + (r() - 0.5) * 6, fy = y + h - 2 - r() * h * 0.15;
    const c = pick(r, pal.slice(0, 4)), lean = (r() - 0.5) * 0.5;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(lean * 0.4); ctx.scale(k, k);
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-3, -12); ctx.lineTo(-5, -22); ctx.lineTo(5, -22); ctx.lineTo(3, -12); ctx.lineTo(4, 0); ctx.fill(); // body
    ctx.beginPath(); ctx.arc(0, -25, 3, 0, 7); ctx.fill(); // head
    ctx.lineWidth = 2.2; ctx.strokeStyle = c; ctx.lineCap = 'round';
    const up = r() < 0.6;
    ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(up ? -8 : -7, up ? -32 : -10); ctx.moveTo(4, -20); ctx.lineTo(up && r() < 0.5 ? 9 : 7, up ? -30 - r() * 6 : -9); ctx.stroke();
    if (big) { ctx.fillStyle = rgba(pal[pal.length - 1], 0.6); ctx.fillRect(-2.4, -21, 1.2, 10); } // a highlight down the torso
    ctx.restore();
  }
  // heavy dark contour strokes across everything, and a horizon line
  ctx.strokeStyle = 'rgba(20,12,8,0.55)'; ctx.lineWidth = 0.9;
  for (let i = 0; i < 7; i++) { ctx.beginPath(); const sx = x + r() * w; ctx.moveTo(sx, y + h); ctx.bezierCurveTo(sx + (r() - 0.5) * 30, y + h * 0.6, sx + (r() - 0.5) * 30, y + h * 0.3, sx + (r() - 0.5) * 20, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(20,12,8,0.25)'; ctx.fillRect(x, y + h * 0.42, w, 0.8);
  if (detail) { // up close: brush marks, hatching in the shadows, the grain of the plaster
    for (let i = 0; i < w * h / 6; i++) {
      const bx = x + r() * w, by = y + r() * h, a = r() * Math.PI;
      ctx.strokeStyle = r() < 0.5 ? 'rgba(255,245,225,0.08)' : 'rgba(20,12,8,0.09)'; ctx.lineWidth = 0.25 + r() * 0.35;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * (1 + r() * 2.5), by + Math.sin(a) * (1 + r() * 2.5)); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(20,12,8,0.18)'; ctx.lineWidth = 0.18;
    for (let i = 0; i < w * 1.2; i++) { const hx = x + r() * w, hy = y + h * (0.5 + r() * 0.5); ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 1.6, hy - 1.6); ctx.stroke(); }
    for (let i = 0; i < w * h / 3; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; ctx.fillRect(x + r() * w, y + r() * h, 0.3, 0.3); }
  }
  ctx.restore();
}
STRUCTURE_DRAW.muralwall = (ctx, s) => {
  const X = s.x * T, Y = s.y * T, W = s.w * T, H = s.h * T;
  ctx.fillStyle = s.color || '#e2d5bd'; ctx.fillRect(X, Y, W, H);
  // the great painted wall at the end of the nave, in a round-arched frame (the old apse)
  const mw = W * 0.62, mx = X + (W - mw) / 2;
  ctx.save(); ctx.beginPath(); ctx.moveTo(mx, Y + H - 8); ctx.lineTo(mx, Y + 14); ctx.quadraticCurveTo(X + W / 2, Y - 6, mx + mw, Y + 14); ctx.lineTo(mx + mw, Y + H - 8); ctx.closePath(); ctx.clip();
  paintMural(ctx, mx, Y, mw, H - 8, s.seed || 1940, 'color');
  ctx.restore();
  ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(mx, Y + H - 8); ctx.lineTo(mx, Y + 14); ctx.quadraticCurveTo(X + W / 2, Y - 6, mx + mw, Y + 14); ctx.lineTo(mx + mw, Y + H - 8); ctx.stroke();
  // grisaille panels on both sides
  for (const [px, pw] of [[X + 4, mx - X - 10], [mx + mw + 6, X + W - (mx + mw) - 10]]) { paintMural(ctx, px, Y + 8, pw, H - 18, (s.seed || 1940) + px, 'grisaille'); ctx.strokeStyle = '#6e6964'; ctx.lineWidth = 0.8; ctx.strokeRect(px, Y + 8, pw, H - 18); }
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(X, Y + H - 8, W, 8); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(X, Y + H - 8, W, 0.8);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X, Y + H - 1.4, W, 1.4);
};
// The side walls of the library, seen at a slant: painted with murals above the bookcases.
STRUCTURE_DRAW.sidemural = (ctx, s) => {
  const X = s.x * T, Y = s.y * T, W = s.w * T, H = s.h * T;
  ctx.fillStyle = '#5e4a38'; ctx.fillRect(X, Y, W, H);
  const fx = s.right ? X : X + W * 0.25, fw = W * 0.75;
  paintMural(ctx, fx, Y, fw, H, s.seed || 7, 'grisaille');
  ctx.fillStyle = s.right ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)'; ctx.fillRect(fx, Y, fw, H);
  ctx.fillStyle = '#3e3024'; ctx.fillRect(s.right ? X + W - 3 : X, Y, 3, H);
};

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
    for (const lx of [-w / 4, w / 4]) {
      ctx.fillStyle = '#c9a54a'; ctx.fillRect(lx - 0.4, -18, 0.8, 6); ctx.fillRect(lx - 2, -12.6, 4, 0.8);
      ctx.fillStyle = '#1f6a45'; ctx.beginPath(); ctx.ellipse(lx, -18.4, 3.6, 1.6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(lx - 3.6, -18.6, 7.2, 1.2);
    }
    if (s.books !== false) {
      ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-6, -13.4, 5, 2.4); ctx.fillRect(-1, -13.4, 5, 2.4); ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(-1, -13.4); ctx.lineTo(-1, -11); ctx.stroke();
      ctx.fillStyle = '#2f4f6f'; ctx.fillRect(w / 2 - 12, -14.6, 6, 1.4); ctx.fillStyle = '#7a1f1a'; ctx.fillRect(w / 2 - 11.6, -16, 5, 1.4);
    }
  },
  anim(ctx, s, t, night) { const w = s.fw || 50; for (const lx of [-w / 4, w / 4]) { ctx.fillStyle = 'rgba(255,230,150,0.16)'; ctx.beginPath(); ctx.ellipse(lx, -12, 7, 2.6, 0, 0, 7); ctx.fill(); } },
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
    if (s.sign) { ctx.fillStyle = '#f5ecd8'; ctx.fillRect(-10, -12, 20, 4.4); ctx.fillStyle = '#5a1a22'; ctx.font = 'bold 2.6px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.sign, 0, -9.8); }
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
