// Character renderer: chibi 3/4 figures in the spirit of a modern top-down RPG,
// drawn with vector shapes so they stay crisp at any zoom.
// Each look is cached per direction/frame. Directions: 0=down, 1=up, 2=left, 3=right.
import { makeCanvas, shade, rgba, mix, rng, pick, roundRect } from '../util.js';

export const CHAR_W = 32, CHAR_H = 48; // world units of a character frame (anchor at feet: 16, 44)
const AX = 16, AY = 44;
export const PEOPLE_SCALE = 0.68;
const cache = new Map();
let SCALE = 3;
export function setPeopleScale(s) { if (s !== SCALE) { SCALE = s; cache.clear(); } }

const SKINS = ['#f1c8a6', '#e3b48e', '#d19f78', '#bf8a63', '#a8744f', '#8d5f3f', '#f5d3b8'];
const HAIRS = ['#1b1512', '#2b1f18', '#3a2a1f', '#4a3424', '#6b4a2e', '#8a6a4a', '#b9b3ac', '#e7e3dd', '#2a1a14'];

// Build a random but coherent look for an NPC. `role` biases the outfit.
export function makeLook(seed, opts = {}) {
  const r = rng(seed);
  const female = opts.female ?? r() < 0.5;
  const age = opts.age || pick(r, ['kid', 'teen', 'adult', 'adult', 'adult', 'elder']);
  const skin = opts.skin || pick(r, SKINS.slice(0, 6));
  const elder = age === 'elder';
  const hairColor = opts.hairColor || (elder ? pick(r, ['#b9b3ac', '#e7e3dd', '#8f8a84']) : pick(r, HAIRS.slice(0, 6)));
  const look = {
    seed, female, age, skin, hairColor,
    hair: opts.hair || (female ? pick(r, age === 'kid' ? ['pigtails', 'braids', 'ponytail'] : ['braids', 'bun', 'long', 'ponytail', 'long', 'short_f']) : pick(r, age === 'kid' ? ['short', 'buzz', 'spiky'] : ['short', 'buzz', 'slick', 'spiky', 'short', elder ? 'bald' : 'short'])),
    beard: opts.beard ?? (!female && (age === 'adult' || elder) && r() < 0.32 ? pick(r, ['full', 'goatee', 'stubble', 'full']) : null),
    mustache: opts.mustache ?? (!female && (age === 'adult' || elder) && r() < 0.45),
    hat: opts.hat ?? (age === 'kid' ? (r() < 0.2 ? 'cap' : null) : !female && r() < 0.35 ? pick(r, ['cap', 'sombrero', 'texana', 'cap']) : null),
    top: opts.top || (female ? pick(r, age === 'teen' ? ['tshirt', 'hoodie', 'crop'] : ['blouse', 'bordado', 'tshirt', 'blouse', 'bordado']) : pick(r, age === 'teen' ? ['tshirt', 'hoodie', 'jersey'] : ['shirt', 'tshirt', 'guayabera', 'plaid', 'polo'])),
    topColor: opts.topColor || pick(r, ['#e74c3c', '#2e86de', '#27ae60', '#f5f0e6', '#8e44ad', '#f39c12', '#34495e', '#16a085', '#c0392b', '#ffffff', '#f7c6d9', '#6c5ce7', '#2d3436', '#fab1a0']),
    bottom: opts.bottom || (female ? pick(r, age === 'teen' ? ['jeans', 'jeans', 'skirt'] : ['skirt', 'longskirt', 'jeans', 'skirt']) : pick(r, age === 'kid' ? ['shorts', 'jeans'] : ['jeans', 'pants', 'jeans'])),
    bottomColor: opts.bottomColor || pick(r, ['#2f4b7c', '#1f2d4a', '#3b3b3b', '#6b5a45', '#8a6f4d', '#243b55', '#5b2c2c', '#34495e']),
    shoes: opts.shoes || pick(r, age === 'teen' || age === 'kid' ? ['sneakers', 'sneakers'] : ['boots', 'shoes', 'huaraches', 'sneakers']),
    shoeColor: opts.shoeColor || pick(r, ['#3b2618', '#1b1b1b', '#f5f5f5', '#6b4a2e', '#8b1e1e']),
    rebozo: opts.rebozo ?? (female && (age === 'adult' || elder) && r() < 0.45 ? pick(r, ['#5b3f7a', '#2f5d7a', '#7a2f3a', '#3b5b3a', '#6b5a45']) : null),
    apron: opts.apron ?? false,
    glasses: opts.glasses ?? (r() < (elder ? 0.4 : 0.12)),
    earrings: opts.earrings ?? (female && r() < 0.6),
    body: opts.body || (age === 'kid' ? 0.78 : age === 'teen' ? 0.92 : 1),
    girth: opts.girth ?? (0.9 + r() * 0.35),
    phone: !!opts.phone,
    holds: opts.holds || null,     // 'rifle', 'bag', 'cup', 'stick', 'trompo', 'lantern'...
    backpack: opts.backpack ?? ((age === 'kid' || age === 'teen') && r() < 0.35),
    uniform: opts.uniform || null, // 'taxi', 'nurse', 'office', 'padre', 'police'
    embroidery: opts.embroidery || pick(r, ['#e84a6a', '#f2a93b', '#2fb3a0', '#6a5acd', '#e53935']),
    enchilado: 0, glow: 0,
  };
  if (look.uniform === 'office') { look.top = 'shirt'; look.topColor = opts.topColor || '#f5f5f5'; look.bottom = female ? 'skirt' : 'pants'; look.bottomColor = '#2d3436'; look.shoes = 'shoes'; look.shoeColor = '#1b1b1b'; look.tie = !female; }
  if (look.uniform === 'padre') { look.top = 'cassock'; look.topColor = '#1d1d1f'; look.bottom = 'pants'; look.bottomColor = '#1d1d1f'; look.hat = null; }
  if (look.uniform === 'nurse') { look.top = 'scrubs'; look.topColor = '#7fc8c0'; look.bottom = 'pants'; look.bottomColor = '#7fc8c0'; look.shoes = 'sneakers'; look.shoeColor = '#f5f5f5'; }
  if (look.uniform === 'police') { look.top = 'shirt'; look.topColor = '#1f2d4a'; look.bottom = 'pants'; look.bottomColor = '#1f2d4a'; look.hat = 'cap'; look.capColor = '#1f2d4a'; }
  if (look.uniform === 'rino') { look.top = 'jersey'; look.topColor = '#6d6f73'; look.bottom = 'shorts'; look.bottomColor = '#1b1b1b'; look.hat = 'helmet'; look.shoes = 'sneakers'; look.shoeColor = '#e0e0e0'; }
  if (look.hat === 'cap') look.capColor = look.capColor || pick(r, ['#c0392b', '#1f4fa0', '#1b1b1b', '#f5f5f5', '#27ae60', '#f39c12']);
  if (look.hat === 'sombrero') look.hatColor = '#e8d29a';
  if (look.hat === 'texana') look.hatColor = pick(r, ['#f2ead8', '#6b4a2e', '#2b2b2b']);
  Object.assign(look, opts.extra || {});
  return look;
}

export function lookKey(look) {
  return [look.seed, look.hair, look.beard, look.hat, look.top, look.topColor, look.bottom, look.bottomColor, look.rebozo, look.holds,
    look.phone, look.girth.toFixed(2), look.enchilado ? 1 : 0, look.glow ? Math.round(look.glow * 3) : 0, look.dirty ? 1 : 0, look.skin, look.hairColor, look.mustache, look.stain ? 1 : 0].join('|');
}

// Return a cached canvas for a frame. frame: 0..3 walk cycle, 'idle', 'sit', 'wave', 'talk'.
export function getFrame(look, dir, frame) {
  const k = lookKey(look) + '#' + dir + '#' + frame;
  let c = cache.get(k);
  if (c) return c;
  c = makeCanvas(CHAR_W * SCALE, CHAR_H * SCALE);
  const ctx = c.getContext('2d');
  ctx.scale(SCALE, SCALE);
  drawPerson(ctx, look, dir, frame);
  cache.set(k, c);
  if (cache.size > 2600) { let n = 0; for (const key of cache.keys()) { cache.delete(key); if (++n > 600) break; } }
  return c;
}

// ---------------------------------------------------------------------------
export function drawPerson(ctx, L, dir, frame) {
  const k = L.body * PEOPLE_SCALE;
  ctx.save();
  ctx.translate(AX, AY);
  ctx.scale(k, k);
  const walking = typeof frame === 'number';
  const ph = walking ? frame : 0;
  const swing = walking ? [0, 1, 0, -1][ph] : 0;
  const bob = walking ? (ph % 2 ? -0.7 : 0) : (frame === 'idle2' ? -0.35 : 0);
  const sit = frame === 'sit';
  const side = dir === 2 || dir === 3;
  const flip = dir === 3;
  if (flip) ctx.scale(-1, 1);

  // shadow
  ctx.fillStyle = 'rgba(20,20,35,0.28)';
  ctx.beginPath(); ctx.ellipse(0, 0, 7 * L.girth, 2.4, 0, 0, 7); ctx.fill();

  const g = L.girth;
  const skin = L.enchilado ? mix(L.skin, '#e0463a', 0.35) : L.skin;
  const skinD = shade(skin, -0.18);
  const legTop = -12;
  const hipW = 4.4 * g;

  ctx.translate(0, bob);

  // ---- legs & shoes ----
  const legC = L.bottom === 'shorts' ? skin : L.bottomColor;
  const drawLeg = (x, lift, back) => {
    const len = sit ? 5 : 11;
    ctx.fillStyle = back ? shade(legC, -0.15) : legC;
    ctx.fillRect(x - 1.6, legTop, 3.2, len - lift);
    if (L.bottom === 'shorts') { ctx.fillStyle = back ? shade(L.bottomColor, -0.15) : L.bottomColor; ctx.fillRect(x - 1.8, legTop, 3.6, 4); }
    // shoe
    const sc = L.shoes === 'huaraches' ? '#8a5a2b' : L.shoeColor;
    ctx.fillStyle = back ? shade(sc, -0.2) : sc;
    const sy = legTop + len - lift;
    if (side) { roundRect(ctx, x - 2, sy - 1.2, 4.6, 2.4, 1); ctx.fill(); }
    else { roundRect(ctx, x - 1.9, sy - 1.3, 3.8, 2.6, 1); ctx.fill(); }
    if (L.shoes === 'sneakers') { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1.9, sy + 0.6, 3.8, 0.6); }
    if (L.shoes === 'huaraches') { ctx.fillStyle = skin; ctx.fillRect(x - 1, sy - 1, 2, 1); }
  };
  if (L.bottom === 'longskirt' || L.top === 'cassock') {
    // skirt hides legs: only feet move
    drawLeg(-1.8, Math.max(0, swing) * 1.2, false);
    drawLeg(1.8, Math.max(0, -swing) * 1.2, false);
  } else if (side) {
    const a = swing * 2.2;
    drawLeg(-a * 0.6, 0, true);
    drawLeg(a * 0.6, 0, false);
  } else {
    drawLeg(-2, Math.max(0, swing) * 1.4, false);
    drawLeg(2, Math.max(0, -swing) * 1.4, false);
  }

  // ---- lower garment ----
  if (L.bottom === 'skirt' || L.bottom === 'longskirt') {
    const len = L.bottom === 'longskirt' ? 11 : 7;
    ctx.fillStyle = L.bottomColor;
    ctx.beginPath(); ctx.moveTo(-hipW, legTop - 1); ctx.lineTo(hipW, legTop - 1); ctx.lineTo(hipW + 2 + swing * 0.3, legTop + len); ctx.lineTo(-hipW - 2 + swing * 0.3, legTop + len); ctx.fill();
    ctx.fillStyle = shade(L.bottomColor, -0.2);
    for (let i = -hipW; i < hipW; i += 2.2) ctx.fillRect(i + 0.5, legTop + 1, 0.5, len - 1);
    if (L.bottom === 'longskirt') { ctx.fillStyle = L.embroidery; ctx.fillRect(-hipW - 2, legTop + len - 1.5, hipW * 2 + 4, 1); }
  } else if (L.top !== 'cassock') {
    ctx.fillStyle = L.bottomColor; ctx.fillRect(-hipW, legTop - 1.5, hipW * 2, 3.5);
  }

  // ---- torso ----
  const torsoTop = -24, torsoH = 12.5;
  const shW = 5.4 * g;
  const topC = L.dirty ? mix(L.topColor, '#7a6a55', 0.35) : L.topColor;
  const backArm = () => arm(ctx, L, side ? -1 : -1, swing, true, skin, topC, side, dir, frame);
  if (side) backArm();
  // body shape
  ctx.fillStyle = topC;
  if (L.top === 'cassock') {
    ctx.beginPath(); ctx.moveTo(-shW, torsoTop); ctx.lineTo(shW, torsoTop); ctx.lineTo(shW + 1.5, -1); ctx.lineTo(-shW - 1.5, -1); ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-shW, torsoTop + 1.5); ctx.quadraticCurveTo(-shW, torsoTop, -shW + 2, torsoTop);
    ctx.lineTo(shW - 2, torsoTop); ctx.quadraticCurveTo(shW, torsoTop, shW, torsoTop + 1.5);
    ctx.lineTo(hipW + 0.4, torsoTop + torsoH); ctx.lineTo(-hipW - 0.4, torsoTop + torsoH); ctx.closePath(); ctx.fill();
  }
  // belly
  if (g > 1.12 && L.top !== 'cassock') { ctx.fillStyle = shade(topC, 0.05); ctx.beginPath(); ctx.ellipse(side ? 1.5 : 0, torsoTop + 8.5, shW * 0.8, 4, 0, 0, 7); ctx.fill(); }
  // shading: left light, right dark
  ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(shW * 0.35, torsoTop, shW * 0.65, torsoH);
  ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(-shW, torsoTop + 1, 1.2, torsoH - 2);
  topDetails(ctx, L, dir, torsoTop, torsoH, shW, hipW, topC, skin);
  if (L.apron) { ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-hipW + 0.5, torsoTop + 5, hipW * 2 - 1, 14); ctx.fillStyle = L.embroidery; ctx.fillRect(-hipW + 0.5, torsoTop + 17.5, hipW * 2 - 1, 1); }
  if (L.backpack && dir === 1) { ctx.fillStyle = '#2d3a6b'; roundRect(ctx, -4, torsoTop + 1, 8, 10, 2); ctx.fill(); ctx.fillStyle = '#e1b12c'; ctx.fillRect(-3, torsoTop + 6, 6, 1); }
  if (L.backpack && dir !== 1) { ctx.fillStyle = '#2d3a6b'; ctx.fillRect(-shW + 0.5, torsoTop, 1.2, 9); ctx.fillRect(shW - 1.7, torsoTop, 1.2, 9); }
  // rebozo draped over shoulders & arms
  if (L.rebozo) rebozo(ctx, L, dir, torsoTop, shW);

  // ---- front arm ----
  arm(ctx, L, 1, -swing, false, skin, topC, side, dir, frame);
  if (!side) arm(ctx, L, -1, swing, false, skin, topC, side, dir, frame);

  // ---- head ----
  head(ctx, L, dir, torsoTop, skin, skinD, frame);

  // enchilado sweat
  if (L.enchilado) { ctx.fillStyle = 'rgba(160,210,255,0.9)'; ctx.beginPath(); ctx.ellipse(6, torsoTop - 9, 0.8, 1.3, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(-6.5, torsoTop - 6, 0.7, 1.1, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}

function topDetails(ctx, L, dir, top, h, shW, hipW, topC, skin) {
  const front = dir === 0;
  if (L.top === 'bordado') { // white blouse with embroidered yoke (like Michoacán blusas)
    if (front || dir === 2 || dir === 3) {
      ctx.fillStyle = L.embroidery;
      for (let i = -shW + 1; i < shW - 1; i += 1.6) { ctx.beginPath(); ctx.arc(i + 0.8, top + 2.4, 0.7, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#3a8a4a'; for (let i = -shW + 1.8; i < shW - 1; i += 3.2) ctx.fillRect(i, top + 3.4, 1.2, 0.6);
      ctx.fillStyle = '#f2c14e'; for (let i = -shW + 2.6; i < shW - 1; i += 3.2) { ctx.beginPath(); ctx.arc(i, top + 1.2, 0.45, 0, 7); ctx.fill(); }
      ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0, top + 0.2, 2.2, 1.2, 0, 0, 7); ctx.fill();
    }
  } else if (L.top === 'guayabera') {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    if (front) { for (const x of [-3, -2.2, 2.2, 3]) ctx.fillRect(x, top + 2, 0.4, h - 3); ctx.fillStyle = '#e8e2d2'; ctx.fillRect(-0.3, top + 1, 0.6, h - 2); }
  } else if (L.top === 'plaid') {
    ctx.strokeStyle = rgba(shade(topC, -0.35), 0.6); ctx.lineWidth = 0.5; ctx.beginPath();
    for (let x = -shW; x < shW; x += 2) { ctx.moveTo(x, top); ctx.lineTo(x, top + h); }
    for (let y = top + 1; y < top + h; y += 2) { ctx.moveTo(-shW, y); ctx.lineTo(shW, y); }
    ctx.stroke();
  } else if (L.top === 'jersey') {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-shW, top + 4, shW * 2, 1);
    if (L.uniform === 'rino') { ctx.fillStyle = '#f2c230'; ctx.fillRect(-shW, top + 5.2, shW * 2, 0.8); if (front) { ctx.fillStyle = '#1b1b1b'; ctx.font = 'bold 2.4px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('RINOS', 0, top + 9.4); } }
    else if (front) { ctx.fillStyle = '#fff'; ctx.font = 'bold 4px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(7 + (L.seed % 20)), 0, top + 10); }
  } else if (L.top === 'hoodie') {
    ctx.fillStyle = shade(topC, -0.15); ctx.fillRect(-2.6, top + 6, 5.2, 3.2);
    if (front) { ctx.strokeStyle = '#eee'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(-1, top + 1); ctx.lineTo(-1.2, top + 4); ctx.moveTo(1, top + 1); ctx.lineTo(1.2, top + 4); ctx.stroke(); }
  } else if (L.top === 'shirt' || L.top === 'polo') {
    if (front) {
      ctx.fillStyle = shade(topC, -0.12); ctx.beginPath(); ctx.moveTo(-2.5, top); ctx.lineTo(0, top + 2.5); ctx.lineTo(2.5, top); ctx.fill();
      if (L.top === 'shirt') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = top + 3; y < top + h; y += 2.4) ctx.fillRect(-0.3, y, 0.6, 0.6); }
      if (L.tie) { ctx.fillStyle = '#7a1f2b'; ctx.beginPath(); ctx.moveTo(-0.7, top + 1.5); ctx.lineTo(0.7, top + 1.5); ctx.lineTo(1, top + 8); ctx.lineTo(0, top + 9); ctx.lineTo(-1, top + 8); ctx.fill(); }
      if (L.uniform === 'taxi') { ctx.fillStyle = '#f5f5f5'; ctx.fillRect(-4, top + 3, 2.6, 1.6); }
      if (L.uniform === 'police') { ctx.fillStyle = '#e1b12c'; ctx.beginPath(); ctx.arc(-3, top + 3.8, 0.9, 0, 7); ctx.fill(); }
    }
  } else if (L.top === 'crop') {
    ctx.fillStyle = skin; ctx.fillRect(-hipW + 0.4, top + h - 3, hipW * 2 - 0.8, 2.4);
  } else if (L.top === 'scrubs') {
    if (front) { ctx.fillStyle = shade(topC, -0.15); ctx.beginPath(); ctx.moveTo(-2.2, top); ctx.lineTo(0, top + 3); ctx.lineTo(2.2, top); ctx.fill(); }
  } else if (L.top === 'cassock') {
    if (front) { ctx.fillStyle = '#f5f5f5'; ctx.fillRect(-1, top, 2, 1.2); ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let y = top + 2; y < -2; y += 2.2) ctx.fillRect(-0.3, y, 0.6, 0.6); }
  } else if (L.top === 'blouse') {
    if (front) { ctx.fillStyle = shade(topC, -0.1); ctx.beginPath(); ctx.ellipse(0, top + 0.6, 2.8, 1.4, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-shW + 0.5, top + 5, shW * 2 - 1, 0.5); }
  }
  if (L.top !== 'cassock' && L.top !== 'crop') { // belt / hem line
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-hipW, top + h - 0.8, hipW * 2, 0.8);
    if (!L.female && (L.bottom === 'jeans' || L.bottom === 'pants') && (L.top === 'shirt' || L.top === 'plaid' || L.top === 'polo')) {
      ctx.fillStyle = '#3b2618'; ctx.fillRect(-hipW, top + h - 1, hipW * 2, 1.4);
      if (dir === 0 && (L.hat === 'texana' || L.hat === 'sombrero')) { ctx.fillStyle = '#c9a54a'; ctx.fillRect(-1.4, top + h - 1.2, 2.8, 1.8); }
    }
  }
}

function rebozo(ctx, L, dir, top, shW) {
  const c = L.rebozo;
  ctx.fillStyle = c;
  if (dir === 1) { // back: full drape
    ctx.beginPath(); ctx.moveTo(-shW - 1, top - 0.5); ctx.lineTo(shW + 1, top - 0.5); ctx.lineTo(shW + 1.6, top + 11); ctx.lineTo(-shW - 1.6, top + 11); ctx.fill();
  } else { // front / side: over shoulders, ends hanging
    ctx.beginPath(); ctx.moveTo(-shW - 1, top - 0.5); ctx.lineTo(shW + 1, top - 0.5); ctx.lineTo(shW + 1.4, top + 3); ctx.lineTo(-shW - 1.4, top + 3); ctx.fill();
    ctx.fillRect(-shW - 1.4, top + 2, 2.6, 11); if (dir === 0) ctx.fillRect(shW - 1.2, top + 2, 2.6, 11);
  }
  // woven stripes
  ctx.fillStyle = rgba('#ffffff', 0.18);
  for (let y = top + 1; y < top + 12; y += 1.6) ctx.fillRect(-shW - 1.4, y, shW * 2 + 2.8, 0.4);
  ctx.fillStyle = rgba('#000000', 0.18);
  for (let x = -shW; x < shW; x += 1.8) ctx.fillRect(x, top - 0.5, 0.4, 3.5);
  // fringe (rapacejo)
  ctx.strokeStyle = shade(c, 0.2); ctx.lineWidth = 0.3;
  ctx.beginPath();
  const fy = dir === 1 ? top + 11 : top + 13;
  const xs = dir === 1 ? [-shW - 1.6, shW + 1.6] : [-shW - 1.4, dir === 0 ? shW + 1.4 : -shW + 1.2];
  for (let x = xs[0]; x < xs[1]; x += 0.6) { if (dir !== 1 && x > -shW + 1.2 && x < shW - 1.2) continue; ctx.moveTo(x, fy); ctx.lineTo(x + 0.1, fy + 1.4); }
  ctx.stroke();
}

// Arm with a hand that has a thumb and four fingers.
function arm(ctx, L, sideSign, swing, back, skin, topC, sideView, dir, frame) {
  const g = L.girth;
  const shX = sideView ? 0 : sideSign * 5.6 * g;
  const shY = -23;
  const holding = L.holds && sideSign === 1 && !back;
  let ang = swing * 0.45; // radians forward/back
  if (L.phone && sideSign === 1 && !back) ang = -0.9;
  if (holding && L.holds === 'rifle') ang = -1.1;
  if (frame === 'wave' && sideSign === 1 && !back) ang = -2.6;
  if (frame === 'talk' && sideSign === 1 && !back) ang = -0.5;
  const len = 10;
  const ex = shX + (sideView ? Math.sin(ang) * len : Math.sin(ang) * 2.5 * sideSign * 0.3);
  const ey = shY + (sideView ? Math.cos(ang) * len : Math.cos(Math.min(Math.abs(ang), 1.2)) * len);
  const sleeveC = back ? shade(topC, -0.18) : topC;
  const longSleeve = ['shirt', 'hoodie', 'plaid', 'cassock', 'guayabera'].includes(L.top) || L.rebozo;
  ctx.lineCap = 'round';
  // upper arm (sleeve)
  const midX = shX + (ex - shX) * 0.5, midY = shY + (ey - shY) * 0.5;
  ctx.strokeStyle = sleeveC; ctx.lineWidth = 3.1 * Math.min(1.2, g);
  ctx.beginPath(); ctx.moveTo(shX, shY); ctx.lineTo(midX, midY); ctx.stroke();
  // forearm
  ctx.strokeStyle = longSleeve ? sleeveC : (back ? shade(skin, -0.12) : skin);
  ctx.lineWidth = 2.6 * Math.min(1.15, g);
  ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(ex, ey); ctx.stroke();
  if (longSleeve) { ctx.strokeStyle = shade(sleeveC, -0.15); ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(ex - (ex - midX) * 0.12, ey - (ey - midY) * 0.12); ctx.lineTo(ex, ey); ctx.stroke(); }
  ctx.lineCap = 'butt';
  if (L.rebozo && !back && !sideView && dir === 0) { ctx.fillStyle = L.rebozo; ctx.fillRect(shX - 1.6, shY, 3.2, 6); }
  hand(ctx, ex, ey + 0.6, back ? shade(skin, -0.12) : skin, sideSign, sideView, dir, ang, back);
  if (holding) heldItem(ctx, L.holds, ex, ey, sideView, dir);
  if (L.phone && sideSign === 1 && !back) phone(ctx, ex, ey, sideView);
}

function hand(ctx, x, y, skin, sideSign, sideView, dir, ang, back) {
  const d = shade(skin, -0.22);
  // palm
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(x, y, 1.45, 1.6, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = d; ctx.lineWidth = 0.22; ctx.stroke();
  // four fingers
  ctx.strokeStyle = skin; ctx.lineCap = 'round'; ctx.lineWidth = 0.62;
  const dirY = Math.cos(ang) >= 0 ? 1 : -1;
  for (let i = 0; i < 4; i++) {
    const fx = x - 0.95 + i * 0.63;
    const fl = i === 1 || i === 2 ? 1.35 : 1.1;
    ctx.beginPath(); ctx.moveTo(fx, y + 0.6 * dirY); ctx.lineTo(fx + (sideView ? 0.25 : 0), y + (0.6 + fl) * dirY); ctx.stroke();
  }
  // knuckle creases
  ctx.strokeStyle = d; ctx.lineWidth = 0.14;
  for (let i = 1; i < 4; i++) { const fx = x - 0.95 + i * 0.63 - 0.31; ctx.beginPath(); ctx.moveTo(fx, y + 0.7 * dirY); ctx.lineTo(fx, y + 1.6 * dirY); ctx.stroke(); }
  // thumb (points toward the body centre when seen from the front)
  ctx.strokeStyle = skin; ctx.lineWidth = 0.7;
  const tx = sideView ? 1 : (dir === 1 ? sideSign : -sideSign);
  ctx.beginPath(); ctx.moveTo(x + tx * 0.9, y - 0.1); ctx.lineTo(x + tx * 1.8, y + 0.8 * dirY); ctx.stroke();
  ctx.lineCap = 'butt';
}

function heldItem(ctx, item, x, y, sideView, dir) {
  if (item === 'rifle') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(sideView ? -0.15 : -0.9);
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(-6, -1, 7, 2.2);
    ctx.fillStyle = '#2b2b2e'; ctx.fillRect(0, -0.8, 13, 1.1); ctx.fillRect(3, 0.2, 2, 1.4);
    ctx.restore();
  } else if (item === 'stick') {
    ctx.strokeStyle = '#7a5a36'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x - 1, y + 5); ctx.lineTo(x + 3, y - 9); ctx.stroke();
  } else if (item === 'cup') {
    ctx.fillStyle = '#f5f0e6'; ctx.fillRect(x - 1, y - 2.8, 2.2, 2.8); ctx.fillStyle = '#6b3f22'; ctx.fillRect(x - 1, y - 2.8, 2.2, 0.6);
  } else if (item === 'michelada') {
    ctx.fillStyle = '#e6c75a'; ctx.fillRect(x - 1.2, y - 4, 2.4, 4); ctx.fillStyle = '#b8322a'; ctx.fillRect(x - 1.3, y - 4.3, 2.6, 0.8);
  } else if (item === 'bag') {
    ctx.fillStyle = '#e84a6a'; roundRect(ctx, x - 2.4, y + 0.5, 4.8, 5, 1); ctx.fill(); ctx.strokeStyle = '#b8325a'; ctx.lineWidth = 0.3; ctx.strokeRect(x - 2.4, y + 0.5, 4.8, 5);
  } else if (item === 'lantern') {
    ctx.fillStyle = '#333'; ctx.fillRect(x - 1.2, y, 2.4, 3.6); ctx.fillStyle = '#ffe9a6'; ctx.fillRect(x - 0.8, y + 0.6, 1.6, 2.4);
  } else if (item === 'trompo') {
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(x - 1.5, y + 0.5); ctx.lineTo(x + 1.5, y + 0.5); ctx.lineTo(x, y + 3.5); ctx.fill();
  } else if (item === 'bread') {
    ctx.fillStyle = '#f3d9a5'; ctx.beginPath(); ctx.ellipse(x, y + 1, 2.2, 1.4, 0, 0, 7); ctx.fill();
  } else if (item === 'broom') {
    ctx.strokeStyle = '#b8935a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 8); ctx.stroke();
    ctx.fillStyle = '#d8b56a'; ctx.beginPath(); ctx.moveTo(x - 2.5, y + 12); ctx.lineTo(x + 2.5, y + 12); ctx.lineTo(x + 1, y + 7); ctx.lineTo(x - 1, y + 7); ctx.fill();
  }
}

function phone(ctx, x, y, sideView) {
  ctx.fillStyle = '#1b1b1f'; roundRect(ctx, x - 1.3, y - 3, 2.6, 4.2, 0.5); ctx.fill();
  ctx.fillStyle = '#7fd0ff'; ctx.fillRect(x - 0.9, y - 2.6, 1.8, 3.2);
}

function head(ctx, L, dir, torsoTop, skin, skinD, frame) {
  const hy = torsoTop - 7.8; // head centre
  const R = 7.2;
  // neck
  ctx.fillStyle = skinD; ctx.fillRect(-1.6, torsoTop - 2.4, 3.2, 3);
  // back hair (behind head)
  const hc = L.hairColor, hcD = shade(hc, -0.25), hcL = shade(hc, 0.22);
  if (['long', 'braids', 'pigtails'].includes(L.hair) || (L.hair === 'ponytail' && dir !== 0)) {
    ctx.fillStyle = hcD;
    if (L.hair === 'long') { roundRect(ctx, -R + 0.5, hy - 2, R * 2 - 1, R + 9, 3); ctx.fill(); }
  }
  // ears
  ctx.fillStyle = skin;
  if (dir === 0 || dir === 1) { ctx.beginPath(); ctx.ellipse(-R + 0.3, hy + 0.8, 1.3, 1.9, 0, 0, 7); ctx.ellipse(R - 0.3, hy + 0.8, 1.3, 1.9, 0, 0, 7); ctx.fill(); }
  // head shape
  const grad = ctx.createRadialGradient(-2.2, hy - 2.6, 1, 0, hy, R * 1.2);
  grad.addColorStop(0, shade(skin, 0.1)); grad.addColorStop(0.7, skin); grad.addColorStop(1, skinD);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(0, hy, R, R * 0.95, 0, 0, 7); ctx.fill();
  if (dir === 2 || dir === 3) { ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(1.5, hy + 0.8, 1.3, 1.9, 0, 0, 7); ctx.fill(); ctx.fillStyle = skinD; ctx.beginPath(); ctx.arc(1.5, hy + 0.8, 0.5, 0, 7); ctx.fill(); }
  if (L.earrings && dir !== 1) { ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(dir === 0 ? -R + 0.4 : 1.5, hy + 3, 0.6, 0, 7); ctx.fill(); if (dir === 0) { ctx.beginPath(); ctx.arc(R - 0.4, hy + 3, 0.6, 0, 7); ctx.fill(); } }

  // face
  if (dir !== 1) {
    const fx = dir === 0 ? 0 : -2.6; // face offset for side view (drawn facing left, flipped for right)
    const eyeY = hy + 1.2;
    const eyes = dir === 0 ? [-2.6, 2.6] : [-4.4];
    const blink = frame === 'blink';
    for (const ex of eyes) {
      if (blink) { ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(ex - 1, eyeY); ctx.lineTo(ex + 1, eyeY); ctx.stroke(); continue; }
      ctx.fillStyle = '#fbfaf7'; ctx.beginPath(); ctx.ellipse(ex, eyeY, 1.25, 1.55, 0, 0, 7); ctx.fill();
      ctx.fillStyle = L.eyeColor || '#3a2616'; ctx.beginPath(); ctx.ellipse(ex + (dir === 0 ? 0 : -0.3), eyeY + 0.2, 0.85, 1.15, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#0d0a08'; ctx.beginPath(); ctx.arc(ex + (dir === 0 ? 0 : -0.3), eyeY + 0.3, 0.45, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex - 0.35, eyeY - 0.35, 0.3, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(40,25,15,0.55)'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.ellipse(ex, eyeY, 1.25, 1.55, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
    // eyebrows
    ctx.strokeStyle = shade(hc, L.age === 'elder' ? 0.1 : -0.1); ctx.lineWidth = L.female ? 0.45 : 0.7; ctx.lineCap = 'round';
    for (const ex of eyes) { ctx.beginPath(); ctx.moveTo(ex - 1.2, eyeY - 2.3); ctx.quadraticCurveTo(ex, eyeY - 2.9, ex + 1.2, eyeY - 2.4); ctx.stroke(); }
    ctx.lineCap = 'butt';
    // nose
    ctx.fillStyle = skinD;
    if (dir === 0) { ctx.beginPath(); ctx.ellipse(0, hy + 3.2, 0.7, 0.5, 0, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(-6.4, hy + 1.8); ctx.lineTo(-7.6, hy + 3.6); ctx.lineTo(-6.2, hy + 3.8); ctx.fill(); }
    // cheeks
    ctx.fillStyle = rgba('#e0706a', L.enchilado ? 0.55 : 0.2);
    for (const ex of (dir === 0 ? [-3.8, 3.8] : [-4.6])) { ctx.beginPath(); ctx.ellipse(ex, hy + 3.4, 1.3, 0.8, 0, 0, 7); ctx.fill(); }
    // mouth
    const mx = dir === 0 ? 0 : -4.8, my = hy + 5.1;
    ctx.strokeStyle = '#7a3b2e'; ctx.lineWidth = 0.45; ctx.lineCap = 'round';
    ctx.beginPath();
    if (frame === 'talk') { ctx.fillStyle = '#5a2320'; ctx.ellipse(mx, my, 1, 0.8, 0, 0, 7); ctx.fill(); }
    else { ctx.moveTo(mx - 1.2, my - 0.1); ctx.quadraticCurveTo(mx, my + 0.6, mx + 1.2, my - 0.1); ctx.stroke(); }
    ctx.lineCap = 'butt';
    // elder wrinkles
    if (L.age === 'elder') { ctx.strokeStyle = rgba(shade(skin, -0.35), 0.5); ctx.lineWidth = 0.25; for (const ex of eyes) { ctx.beginPath(); ctx.moveTo(ex + 1.6, eyeY + 0.2); ctx.lineTo(ex + 2.4, eyeY + 0.8); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-2, hy - 4); ctx.lineTo(2, hy - 4); ctx.stroke(); }
    // glasses
    if (L.glasses) {
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 0.4;
      for (const ex of eyes) { roundRect(ctx, ex - 1.8, eyeY - 1.6, 3.6, 3, 0.8); ctx.stroke(); }
      if (dir === 0) { ctx.beginPath(); ctx.moveTo(-0.8, eyeY - 0.4); ctx.lineTo(0.8, eyeY - 0.4); ctx.stroke(); }
      ctx.fillStyle = 'rgba(200,230,255,0.18)'; for (const ex of eyes) ctx.fillRect(ex - 1.6, eyeY - 1.4, 3.2, 2.6);
    }
    // facial hair: solid mass + strand texture, fully opaque (never see-through)
    if (L.beard) beard(ctx, L, dir, hy, R, hc);
    if (L.mustache) mustache(ctx, dir, hy, hc);
    if (L.stain) { ctx.fillStyle = 'rgba(70,70,190,0.0)'; }
  } else if (L.beard === 'full') {
    ctx.fillStyle = hc; ctx.fillRect(-R + 1.2, hy + 2.5, 1.5, 3); ctx.fillRect(R - 2.7, hy + 2.5, 1.5, 3);
  }
  hairTop(ctx, L, dir, hy, R, hc, hcD, hcL);
  hat(ctx, L, dir, hy, R);
}

function beard(ctx, L, dir, hy, R, hc) {
  const base = shade(hc, -0.05), dark = shade(hc, -0.35), light = shade(hc, 0.25);
  ctx.save();
  if (L.beard === 'stubble') {
    ctx.fillStyle = rgba(hc, 0.35);
    ctx.beginPath();
    if (dir === 0) ctx.ellipse(0, hy + 4, R * 0.78, 3.2, 0, 0, Math.PI); else ctx.ellipse(-2.5, hy + 4, R * 0.65, 3, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = rgba(dark, 0.5);
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI, rr = R * 0.7 * (0.6 + ((i * 7) % 5) / 12); ctx.fillRect((dir === 0 ? 0 : -2.5) + Math.cos(a) * rr, hy + 4 + Math.sin(a) * 2.8, 0.25, 0.25); }
    ctx.restore(); return;
  }
  const cx = dir === 0 ? 0 : -2.4;
  const w = L.beard === 'goatee' ? 2.2 : (dir === 0 ? R * 0.92 : R * 0.72);
  const top = hy + (L.beard === 'goatee' ? 4.6 : 1.6), bottom = hy + (L.beard === 'goatee' ? 8.3 : 9.8);
  // solid base shape
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(cx - w, top);
  ctx.bezierCurveTo(cx - w, bottom - 1.5, cx - w * 0.5, bottom, cx, bottom + 0.4);
  ctx.bezierCurveTo(cx + w * 0.5, bottom, cx + w, bottom - 1.5, cx + w, top);
  if (L.beard === 'full') {
    // open around the mouth
    ctx.lineTo(cx + w * 0.55, top + 0.4);
    ctx.quadraticCurveTo(cx + 1.8, hy + 4.4, cx, hy + 4.3);
    ctx.quadraticCurveTo(cx - 1.8, hy + 4.4, cx - w * 0.55, top + 0.4);
  }
  ctx.closePath(); ctx.fill();
  // under-shade for depth
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(cx, bottom - 1.2, w * 0.7, 1.4, 0, 0, Math.PI); ctx.fill();
  // lower lip showing through the beard
  if (L.beard === 'full') { ctx.fillStyle = '#b8665a'; ctx.beginPath(); ctx.ellipse(cx, hy + 5.4, 1.1, 0.5, 0, 0, 7); ctx.fill(); }
  // strands: dense, short curved hairs in two tones
  ctx.lineCap = 'round';
  const n = L.beard === 'goatee' ? 26 : 90;
  for (let i = 0; i < n; i++) {
    const t = ((i * 37) % 100) / 100, u = ((i * 61) % 100) / 100;
    const px = cx - w * 0.9 + t * w * 1.8;
    const py = top + 0.6 + u * (bottom - top - 0.8);
    // keep strands inside the silhouette
    const edge = Math.abs(px - cx) / w; if (edge > 0.95 - (py - top) / (bottom - top) * 0.4) continue;
    if (L.beard === 'full' && Math.abs(px - cx) < 1.6 && py < hy + 5.8) continue;
    ctx.strokeStyle = i % 3 === 0 ? light : i % 3 === 1 ? dark : base;
    ctx.lineWidth = 0.28;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + (px < cx ? -0.3 : 0.3), py + 0.7, px + (px < cx ? 0.1 : -0.1), py + 1.3); ctx.stroke();
  }
  // outline so it never blends into the skin
  ctx.strokeStyle = rgba(dark, 0.8); ctx.lineWidth = 0.3;
  ctx.beginPath(); ctx.moveTo(cx - w, top); ctx.bezierCurveTo(cx - w, bottom - 1.5, cx - w * 0.5, bottom, cx, bottom + 0.4); ctx.bezierCurveTo(cx + w * 0.5, bottom, cx + w, bottom - 1.5, cx + w, top); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();
}

function mustache(ctx, dir, hy, hc) {
  const cx = dir === 0 ? 0 : -4.6, y = hy + 4.2;
  const base = shade(hc, -0.05), dark = shade(hc, -0.35);
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(cx - 2.6, y + 1.1); ctx.quadraticCurveTo(cx - 1.8, y - 0.8, cx, y - 0.2); ctx.quadraticCurveTo(cx + 1.8, y - 0.8, cx + 2.6, y + 1.1);
  ctx.quadraticCurveTo(cx + 1.3, y + 0.6, cx, y + 0.8); ctx.quadraticCurveTo(cx - 1.3, y + 0.6, cx - 2.6, y + 1.1); ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth = 0.22;
  for (let i = -2.2; i <= 2.2; i += 0.45) { ctx.beginPath(); ctx.moveTo(cx + i, y - 0.2 + Math.abs(i) * 0.1); ctx.lineTo(cx + i * 1.08, y + 0.7); ctx.stroke(); }
}

function hairTop(ctx, L, dir, hy, R, hc, hcD, hcL) {
  if (L.hat === 'sombrero' || L.hat === 'helmet') { // hair only peeks under the brim
    if (L.hair !== 'bald') { ctx.fillStyle = hc; ctx.fillRect(-R + 0.8, hy - 3.2, R * 2 - 1.6, 2.4); }
    return;
  }
  const h = L.hair;
  ctx.fillStyle = hc;
  if (h === 'bald') {
    ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(0, hy + 0.6, R + 0.1, 3, 0, Math.PI * 1.02, Math.PI * 1.98, true); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-2, hy - 4.6, 2.2, 1.2, -0.3, 0, 7); ctx.fill();
    return;
  }
  // cap of hair
  ctx.beginPath();
  if (dir === 1) { ctx.ellipse(0, hy - 0.5, R + 0.6, R * 0.98, 0, 0, 7); }
  else {
    ctx.moveTo(-R - 0.4, hy + 1.5);
    ctx.bezierCurveTo(-R - 0.6, hy - R * 1.25, R + 0.6, hy - R * 1.25, R + 0.4, hy + 1.5);
    if (dir === 0) {
      // fringe line across the forehead
      const fr = h === 'buzz' ? hy - 3.6 : h === 'slick' ? hy - 3.4 : hy - 2.2;
      ctx.lineTo(R - 0.6, hy - 0.6); ctx.quadraticCurveTo(R * 0.4, fr - 0.6, 0, fr); ctx.quadraticCurveTo(-R * 0.5, fr + 0.8, -R + 0.6, hy - 0.6);
    } else {
      ctx.lineTo(R - 0.2, hy + 2.5); ctx.lineTo(1.5, hy - 0.6); ctx.quadraticCurveTo(-3, hy - 3.4, -R + 0.8, hy - 2.2);
    }
    ctx.closePath();
  }
  ctx.fill();
  // strands / highlights
  ctx.strokeStyle = hcL; ctx.lineWidth = 0.35; ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 1.6, hy - R * 0.9); ctx.quadraticCurveTo(i * 1.9 - 0.8, hy - R * 0.55, i * 2.1 - 0.3, hy - 3); ctx.stroke(); }
  ctx.strokeStyle = hcD;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 1.6 + 0.8, hy - R * 0.85); ctx.quadraticCurveTo(i * 1.9, hy - R * 0.5, i * 2.1 + 0.5, hy - 3.2); ctx.stroke(); }
  ctx.lineCap = 'butt';
  if (h === 'spiky') { ctx.fillStyle = hc; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 2 - 1.2, hy - R + 1); ctx.lineTo(i * 2 + 0.4, hy - R - 2); ctx.lineTo(i * 2 + 1.2, hy - R + 1); ctx.fill(); } }
  if (h === 'bun') { ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(0, hy - R - 1.2, 2.8, 0, 7); ctx.fill(); ctx.fillStyle = hcL; ctx.beginPath(); ctx.arc(-0.8, hy - R - 2, 0.9, 0, 7); ctx.fill(); }
  if (h === 'ponytail' && dir !== 0) {
    ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(dir === 1 ? 0 : 5.5, hy + 3, 1.8, 5, dir === 1 ? 0 : -0.3, 0, 7); ctx.fill();
    ctx.fillStyle = L.embroidery; ctx.fillRect((dir === 1 ? 0 : 5) - 1, hy - 2, 2, 1);
  }
  if (h === 'braids') { // two trenzas with ribbons (listones)
    for (const s of dir === 0 ? [-1, 1] : dir === 1 ? [-1, 1] : [1]) {
      const bx = s * (R - 1.2) + (dir >= 2 ? 3 : 0);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? hcD : hc; ctx.beginPath(); ctx.ellipse(bx, hy + 3 + k * 2.2, 1.4, 1.3, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = L.embroidery; ctx.fillRect(bx - 1.2, hy + 13.4, 2.4, 1.2);
    }
  }
  if (h === 'pigtails') { for (const s of [-1, 1]) { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(s * (R + 0.8), hy + 1, 2, 3.4, 0, 0, 7); ctx.fill(); ctx.fillStyle = L.embroidery; ctx.fillRect(s * (R + 0.8) - 0.8, hy - 2.4, 1.6, 1); } }
  if (h === 'long' && dir !== 1) { ctx.fillStyle = hc; ctx.fillRect(-R - 0.3, hy - 1, 2.2, 10); if (dir === 0) ctx.fillRect(R - 1.9, hy - 1, 2.2, 10); }
  if (h === 'short_f' && dir !== 1) { ctx.fillStyle = hc; ctx.fillRect(-R - 0.3, hy - 1, 2, 5); if (dir === 0) ctx.fillRect(R - 1.7, hy - 1, 2, 5); }
}

function hat(ctx, L, dir, hy, R) {
  if (!L.hat) return;
  if (L.hat === 'cap') {
    const c = L.capColor || '#c0392b';
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, hy - 3, R + 0.4, R * 0.72, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(-R - 0.4, hy - 3.2, R * 2 + 0.8, 1.2);
    ctx.fillStyle = shade(c, -0.25);
    if (dir === 0) { ctx.beginPath(); ctx.ellipse(0, hy - 2.2, R * 0.75, 1.6, 0, 0, Math.PI); ctx.fill(); }
    else if (dir !== 1) { ctx.beginPath(); ctx.ellipse(-R + 0.4, hy - 2.6, 3.6, 1.2, 0, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = '#fff'; ctx.fillRect(-1, hy - 3.2, 2, 1); }
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(-2, hy - 6.5, 2.2, 1, -0.2, 0, 7); ctx.fill();
  } else if (L.hat === 'sombrero' || L.hat === 'texana') {
    const c = L.hatColor || '#e8d29a';
    const brim = L.hat === 'sombrero' ? R + 5 : R + 3;
    ctx.fillStyle = shade(c, -0.15); ctx.beginPath(); ctx.ellipse(0, hy - 2.5, brim, 3.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, hy - 3, brim, 2.8, 0, 0, 7); ctx.fill();
    if (L.hat === 'texana') { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(-brim + 0.6, hy - 3.8, 1.6, 1.2, 0, 0, 7); ctx.ellipse(brim - 0.6, hy - 3.8, 1.6, 1.2, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = shade(c, -0.05); roundRect(ctx, -R * 0.62, hy - 9.5, R * 1.24, 7, 2.4); ctx.fill();
    ctx.fillStyle = shade(c, -0.3); ctx.fillRect(-R * 0.62, hy - 4.2, R * 1.24, 1.2);
    if (L.hat === 'sombrero') { ctx.strokeStyle = rgba(shade(c, -0.3), 0.5); ctx.lineWidth = 0.25; for (let a = 0; a < 16; a++) { const an = (a / 16) * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(an) * R * 0.7, hy - 3 + Math.sin(an) * 1.4); ctx.lineTo(Math.cos(an) * brim, hy - 3 + Math.sin(an) * 2.6); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-R * 0.62, hy - 9.5, 1.4, 5);
  } else if (L.hat === 'helmet') {
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.ellipse(0, hy - 3.6, R + 0.8, R * 0.72, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#1b1b1b'; for (const x of [-3, 0, 3]) ctx.fillRect(x - 0.6, hy - 9.4, 1.2, 4);
    ctx.fillStyle = '#6d6f73'; ctx.fillRect(-R - 0.8, hy - 3.8, R * 2 + 1.6, 1);
  }
}

// Large portrait (dialogue box): just head and shoulders, drawn bigger.
export function drawPortrait(ctx, look, size, talking) {
  ctx.save();
  ctx.clearRect(0, 0, size, size);
  const k = size / 26;
  ctx.scale(k, k);
  ctx.translate(13, 36 + look.body * 0 + 6);
  const L = { ...look, body: 1 };
  ctx.save();
  ctx.translate(-16, -44);
  // draw the upper part only: reuse drawPerson (the canvas clip hides legs)
  drawPerson(ctx, L, 0, talking ? 'talk' : 'idle');
  ctx.restore();
  ctx.restore();
}

// Animals ---------------------------------------------------------------
export function drawCow(ctx, kind, dir, frame, t = 0) {
  // kind: 'negra', 'cafe', 'pinta'
  const base = kind === 'negra' ? '#262322' : kind === 'cafe' ? '#7a4a2a' : '#f3efe6';
  const spot = kind === 'pinta' ? '#1f1c1b' : kind === 'cafe' ? '#f3efe6' : '#3a3634';
  ctx.save();
  if (dir === 3) ctx.scale(-1, 1);
  ctx.fillStyle = 'rgba(20,20,35,0.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 4, 0, 0, 7); ctx.fill();
  const step = typeof frame === 'number' ? [0, 1, 0, -1][frame] : 0;
  // legs
  ctx.fillStyle = shade(base, -0.2);
  for (const [lx, o] of [[-9, step], [-5, -step], [6, -step], [10, step]]) { ctx.fillRect(lx - 1.1, -9, 2.2, 9 - Math.max(0, o)); ctx.fillStyle = '#2b2118'; ctx.fillRect(lx - 1.2, -1.2 - Math.max(0, o), 2.4, 1.2); ctx.fillStyle = shade(base, -0.2); }
  // body
  ctx.fillStyle = base; ctx.beginPath(); ctx.ellipse(0, -13, 13.5, 6.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = spot;
  if (kind === 'pinta') { ctx.beginPath(); ctx.ellipse(-4, -15, 4, 3, 0.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(5, -12, 3.2, 2.4, -0.3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(-9, -11, 2, 1.8, 0, 0, 7); ctx.fill(); }
  if (kind === 'cafe') { ctx.beginPath(); ctx.ellipse(2, -9, 6, 1.6, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(-3, -17, 8, 2, 0, 0, 7); ctx.fill();
  // udder
  ctx.fillStyle = '#e8a7a0'; ctx.beginPath(); ctx.ellipse(4, -7.4, 2.6, 1.6, 0, 0, 7); ctx.fill();
  // tail
  ctx.strokeStyle = shade(base, -0.2); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(13, -16); ctx.quadraticCurveTo(15 + Math.sin(t * 3) * 1.5, -10, 14 + Math.sin(t * 3) * 2, -6); ctx.stroke();
  ctx.fillStyle = '#2b2118'; ctx.beginPath(); ctx.ellipse(14 + Math.sin(t * 3) * 2, -5.5, 0.9, 1.4, 0, 0, 7); ctx.fill();
  // head
  const hx = -14, hy = -15 + Math.sin(t * 1.2) * 0.4;
  ctx.fillStyle = base; ctx.beginPath(); ctx.ellipse(hx, hy, 4.2, 4.8, 0.3, 0, 7); ctx.fill();
  if (kind !== 'negra') { ctx.fillStyle = '#f3efe6'; ctx.beginPath(); ctx.ellipse(hx - 0.6, hy - 0.6, 1.6, 3, 0.3, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#d99a8c'; ctx.beginPath(); ctx.ellipse(hx - 1.2, hy + 3.6, 3, 2.1, 0.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#6b3a30'; ctx.beginPath(); ctx.arc(hx - 2.2, hy + 3.8, 0.5, 0, 7); ctx.arc(hx - 0.2, hy + 4, 0.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(hx - 2.6, hy - 1.2, 0.7, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx - 2.8, hy - 1.4, 0.25, 0, 7); ctx.fill();
  ctx.fillStyle = base; ctx.beginPath(); ctx.ellipse(hx + 2.6, hy - 3.2, 2.4, 1, -0.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8e2d2'; ctx.beginPath(); ctx.moveTo(hx + 0.5, hy - 4); ctx.quadraticCurveTo(hx + 1.2, hy - 7.5, hx + 3, hy - 7); ctx.lineTo(hx + 1.6, hy - 4.2); ctx.fill();
  ctx.restore();
}

export function drawDog(ctx, color, dir, frame, t = 0) {
  ctx.save(); if (dir === 3) ctx.scale(-1, 1);
  ctx.fillStyle = 'rgba(20,20,35,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 2, 0, 0, 7); ctx.fill();
  const step = typeof frame === 'number' ? [0, 1, 0, -1][frame] : 0;
  ctx.fillStyle = shade(color, -0.15);
  for (const [lx, o] of [[-4, step], [-2, -step], [3, -step], [5, step]]) ctx.fillRect(lx - 0.6, -4.5, 1.2, 4.5 - Math.max(0, o) * 0.8);
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, -6, 6, 2.8, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-6.5, -8, 2.6, 2.3, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-8.4, -7.2, 1.6, 1.1, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-9.6, -7.4, 0.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(-7.4, -8.6, 0.4, 0, 7); ctx.fill();
  ctx.fillStyle = shade(color, -0.3); ctx.beginPath(); ctx.ellipse(-5.4, -9.6, 1, 1.8, 0.5, 0, 7); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(5.6, -7); ctx.quadraticCurveTo(8, -9 + Math.sin(t * 10) * 1.5, 8.5, -10 + Math.sin(t * 10) * 2); ctx.stroke();
  ctx.restore();
}

export function drawBird(ctx, t, flying) {
  ctx.fillStyle = 'rgba(20,20,35,0.2)'; if (!flying) { ctx.beginPath(); ctx.ellipse(0, 0, 2.4, 0.8, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#8d8f99'; ctx.beginPath(); ctx.ellipse(0, -2.4, 2.4, 1.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#6d6f79'; ctx.beginPath(); ctx.arc(-2, -3.6, 1.1, 0, 7); ctx.fill();
  ctx.fillStyle = '#6fbf9a'; ctx.fillRect(-2.2, -2.9, 1.2, 0.5);
  if (flying) { ctx.fillStyle = '#9ea0aa'; const w = Math.sin(t * 20) * 2.5; ctx.beginPath(); ctx.moveTo(-0.5, -3); ctx.lineTo(1, -3 - 3 - w); ctx.lineTo(2, -3); ctx.fill(); }
  ctx.fillStyle = '#e39b3c'; ctx.fillRect(-3.2, -3.6, 0.6, 0.4);
}

export function drawChicken(ctx, t, dir) {
  ctx.save(); if (dir === 3) ctx.scale(-1, 1);
  ctx.fillStyle = 'rgba(20,20,35,0.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 3, 1, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8c07a'; ctx.fillRect(-1, -2, 0.5, 2); ctx.fillRect(0.6, -2, 0.5, 2);
  ctx.fillStyle = '#c56a2c'; ctx.beginPath(); ctx.ellipse(0, -4, 3, 2.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2f2b2a'; ctx.beginPath(); ctx.moveTo(2, -5); ctx.lineTo(4.2, -8); ctx.lineTo(3.4, -4); ctx.fill();
  const peck = Math.sin(t * 4) > 0.7 ? 1.5 : 0;
  ctx.fillStyle = '#c56a2c'; ctx.beginPath(); ctx.arc(-2.6, -6 + peck, 1.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#d21f1f'; ctx.fillRect(-3.2, -7.8 + peck, 1.2, 0.8);
  ctx.fillStyle = '#f2c14e'; ctx.fillRect(-4.4, -6 + peck, 1, 0.5);
  ctx.restore();
}
