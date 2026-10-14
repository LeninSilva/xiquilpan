// People of Jiquilpan, drawn with believable anatomy in the game's 3/4 view: a head about a sixth of
// the body, shoulders, elbows, knees and ankles that bend as people walk, hands with a thumb and four
// fingers, real shoes, and faces with brows, eyelids, noses and mouths that change with the mood of
// the conversation. Volumes are shaded with soft light from the upper left (like the rest of the town).
// Every person gets a few traits of their own (nose, jaw, brows, eyes, lips, moles…) from their seed,
// so no two neighbours look alike. Frames are cached per look / direction / frame.
// Directions: 0 = toward the camera (south), 1 = away (north), 2 = left (west), 3 = right (east).
import { makeCanvas, shade, rgba, mix, rng, pick, roundRect } from '../util.js';

export const CHAR_W = 32, CHAR_H = 48; // world units of a frame (anchor at the feet: 16, 44)
const AX = 16, AY = 44;
export const PEOPLE_SCALE = 0.68;
const cache = new Map();
let SCALE = 3;
export function setPeopleScale(s) { if (s !== SCALE) { SCALE = s; cache.clear(); } }

// Skin tones of the Ciénega: mostly mestizo browns, a few fair (the Güeros) and some darker.
const SKINS = ['#e9bf98', '#d9a982', '#c8956c', '#b9835b', '#a5704a', '#8f5d3b', '#f1cfb0', '#7b4e31'];
const HAIRS = ['#16110e', '#21170f', '#2e2116', '#3b2a1c', '#57402b', '#7a5a3a', '#a7a29b', '#d9d5ce', '#24160f'];

export function makeLook(seed, opts = {}) {
  const r = rng(seed);
  const female = opts.female ?? r() < 0.5;
  const age = opts.age || pick(r, ['kid', 'teen', 'adult', 'adult', 'adult', 'elder']);
  const skin = opts.skin || pick(r, SKINS.slice(0, 6).concat(r() < 0.15 ? [SKINS[6], SKINS[7]] : []));
  const elder = age === 'elder';
  const hairColor = opts.hairColor || (elder ? pick(r, ['#b9b3ac', '#e3dfd8', '#8f8a84', '#cfcac2']) : pick(r, HAIRS.slice(0, 6)));
  const look = {
    seed, female, age, skin, hairColor,
    hair: opts.hair || (female ? pick(r, age === 'kid' ? ['pigtails', 'braids', 'ponytail'] : ['braids', 'bun', 'long', 'ponytail', 'long', 'short_f', 'wavy']) : pick(r, age === 'kid' ? ['short', 'buzz', 'spiky'] : ['short', 'buzz', 'slick', 'spiky', 'short', 'fade', 'curly', elder ? 'bald' : 'short'])),
    beard: opts.beard ?? (!female && (age === 'adult' || elder) && r() < 0.32 ? pick(r, ['full', 'goatee', 'stubble', 'full', 'chin']) : null),
    mustache: opts.mustache ?? (!female && (age === 'adult' || elder) && r() < 0.45),
    hat: opts.hat ?? (age === 'kid' ? (r() < 0.2 ? 'cap' : null) : !female && r() < 0.35 ? pick(r, ['cap', 'sombrero', 'texana', 'cap']) : null),
    top: opts.top || (female ? pick(r, age === 'teen' ? ['tshirt', 'hoodie', 'crop'] : ['blouse', 'bordado', 'tshirt', 'blouse', 'bordado']) : pick(r, age === 'teen' ? ['tshirt', 'hoodie', 'jersey'] : ['shirt', 'tshirt', 'guayabera', 'plaid', 'polo'])),
    topColor: opts.topColor || pick(r, ['#c8463a', '#2e78c4', '#2f9356', '#efe8da', '#7d4c9c', '#e0922c', '#34495e', '#1d8a76', '#a33a2e', '#f7f5f0', '#e6a9bf', '#5d55c6', '#2d3436', '#e39a86']),
    bottom: opts.bottom || (female ? pick(r, age === 'teen' ? ['jeans', 'jeans', 'skirt'] : ['skirt', 'longskirt', 'jeans', 'skirt']) : pick(r, age === 'kid' ? ['shorts', 'jeans'] : ['jeans', 'pants', 'jeans'])),
    bottomColor: opts.bottomColor || pick(r, ['#2f4b7c', '#1f2d4a', '#3b3b3b', '#6b5a45', '#8a6f4d', '#243b55', '#5b2c2c', '#34495e']),
    shoes: opts.shoes || pick(r, age === 'teen' || age === 'kid' ? ['sneakers', 'sneakers'] : ['boots', 'shoes', 'huaraches', 'sneakers']),
    shoeColor: opts.shoeColor || pick(r, ['#3b2618', '#1b1b1b', '#f5f5f5', '#6b4a2e', '#7a1e1e']),
    rebozo: opts.rebozo ?? (female && (age === 'adult' || elder) && r() < 0.45 ? pick(r, ['#5b3f7a', '#2f5d7a', '#7a2f3a', '#3b5b3a', '#6b5a45']) : null),
    apron: opts.apron ?? false,
    glasses: opts.glasses ?? (r() < (elder ? 0.4 : 0.12)),
    earrings: opts.earrings ?? (female && r() < 0.6),
    body: opts.body || (age === 'kid' ? 0.74 : age === 'teen' ? 0.94 : female ? 0.95 : 1),
    girth: opts.girth ?? (0.9 + r() * 0.35),
    phone: !!opts.phone,
    holds: opts.holds || null,
    backpack: opts.backpack ?? ((age === 'kid' || age === 'teen') && r() < 0.35),
    uniform: opts.uniform || null,
    embroidery: opts.embroidery || pick(r, ['#e84a6a', '#f2a93b', '#2fb3a0', '#6a5acd', '#e53935']),
    // facial traits: what makes each face recognisable
    nose: opts.nose || pick(r, ['straight', 'straight', 'wide', 'aquiline', 'button', 'wide']),
    jaw: opts.jaw || pick(r, female ? ['oval', 'round', 'heart', 'oval'] : ['square', 'oval', 'round', 'long', 'square']),
    eyes: opts.eyes || pick(r, ['almond', 'almond', 'round', 'narrow', 'droopy']),
    brows: opts.brows ?? (female ? 0.5 + r() * 0.2 : 0.7 + r() * 0.45),
    browArch: opts.browArch ?? (r() - 0.3) * 0.8,
    lips: opts.lips || pick(r, ['thin', 'medium', 'full']),
    ears: opts.ears ?? (0.9 + r() * 0.3),
    mole: opts.mole ?? (r() < 0.18 ? [pick(r, [-1, 1]) * (0.8 + r() * 1.4), r() * 2.4] : null),
    freckles: opts.freckles ?? (skin === SKINS[6] && r() < 0.4),
    cheeks: opts.cheeks ?? (r() < 0.5),
    eyeColor: opts.eyeColor || (r() < 0.9 ? pick(r, ['#2a1a10', '#3a2414', '#4a2e18']) : pick(r, ['#5a6a3a', '#6a5a3a'])),
    expr: opts.expr || null,
    enchilado: 0, glow: 0,
  };
  if (look.uniform === 'office') { look.top = 'shirt'; look.topColor = opts.topColor || '#f5f5f5'; look.bottom = female ? 'skirt' : 'pants'; look.bottomColor = '#2d3436'; look.shoes = 'shoes'; look.shoeColor = '#1b1b1b'; look.tie = !female; }
  if (look.uniform === 'padre') { look.top = 'cassock'; look.topColor = '#1d1d1f'; look.bottom = 'pants'; look.bottomColor = '#1d1d1f'; look.hat = null; }
  if (look.uniform === 'nurse') { look.top = 'scrubs'; look.topColor = opts.topColor || '#7fc8c0'; look.bottom = 'pants'; look.bottomColor = '#7fc8c0'; look.shoes = 'sneakers'; look.shoeColor = '#f5f5f5'; }
  if (look.uniform === 'police') { look.top = 'shirt'; look.topColor = '#1f2d4a'; look.bottom = 'pants'; look.bottomColor = '#1f2d4a'; look.hat = 'cap'; look.capColor = '#1f2d4a'; look.shoes = 'boots'; look.shoeColor = '#111'; }
  if (look.uniform === 'paramedic') { look.top = 'shirt'; look.topColor = '#f2f2f0'; look.bottom = 'pants'; look.bottomColor = '#1f2d4a'; look.hat = null; look.shoes = 'boots'; look.shoeColor = '#1b1b1b'; look.cross = true; }
  if (look.uniform === 'rino') look.uniform = 'rinos';
  if (look.uniform === 'rinos' || look.uniform === 'mamazonas' || look.uniform === 'apenitas') {
    const kit = { rinos: ['#5b2a8c', '#2a1240', '#c9b8e8'], mamazonas: ['#d6337a', '#1b1b1b', '#ffffff'], apenitas: ['#f08c00', '#ffffff', '#3a2a10'] }[look.uniform];
    look.top = 'jersey'; look.topColor = kit[0]; look.kit = kit; look.bottom = 'shorts'; look.bottomColor = kit[1]; look.hat = 'helmet'; look.helmetColor = kit[0];
    look.shoes = 'sneakers'; look.shoeColor = '#f0f0f0'; look.tight = true; look.backpack = false; look.rebozo = null; look.holds = null;
  }
  if (look.uniform === 'negrito' || look.uniform === 'cuerita') { // Danza de los Negritos: suede fringed cuera, white scarf, black mask, poinsettia crown
    look.top = 'cuera'; look.topColor = '#9a5a2e'; look.bottom = look.uniform === 'cuerita' ? 'longskirt' : 'pants'; look.bottomColor = '#2a2a2a'; look.hat = 'nochebuena'; look.mask = 'negrito'; look.shoes = 'boots'; look.shoeColor = '#2b1a10'; look.rebozo = null; look.beard = null; look.mustache = false; look.glasses = false;
  }
  if (look.hat === 'cap') look.capColor = look.capColor || opts.capColor || pick(r, ['#c0392b', '#1f4fa0', '#1b1b1b', '#f5f5f5', '#27ae60', '#f39c12']);
  if (look.hat === 'sombrero') look.hatColor = opts.hatColor || '#e5cf98';
  if (look.hat === 'texana') look.hatColor = opts.hatColor || pick(r, ['#f2ead8', '#6b4a2e', '#2b2b2b']);
  if (look.hat === 'panama') look.hatColor = opts.hatColor || '#f4f0e4';
  Object.assign(look, opts.extra || {});
  return look;
}

export function lookKey(look) {
  return [look.seed, look.hair, look.beard, look.hat, look.top, look.topColor, look.bottom, look.bottomColor, look.rebozo, look.holds,
    look.phone, look.girth.toFixed(2), look.enchilado ? 1 : 0, look.glow ? Math.round(look.glow * 3) : 0, look.dirty ? 1 : 0, look.skin, look.hairColor,
    look.mustache, look.stain ? 1 : 0, look.expr || '', look.nose, look.jaw, look.uniform || '', look.capColor || '', look.hatColor || '', look.shoes, look.age, look.female ? 1 : 0].join('|');
}

export function getFrame(look, dir, frame) {
  const k = lookKey(look) + '#' + dir + '#' + frame;
  let c = cache.get(k);
  if (c) { cache.delete(k); cache.set(k, c); return c; }
  c = makeCanvas(CHAR_W * SCALE, CHAR_H * SCALE);
  const ctx = c.getContext('2d');
  ctx.scale(SCALE, SCALE);
  drawPerson(ctx, look, dir, frame);
  cache.set(k, c);
  if (cache.size > 1100) { let n = 0; for (const key of cache.keys()) { cache.delete(key); if (++n > 300) break; } }
  return c;
}

// ---------------------------------------------------------------------------------------------
// Proportions of a body (feet at y = 0). Kids have big heads and short legs, elders stoop.
function frameOf(L) {
  const kid = L.age === 'kid', teen = L.age === 'teen', elder = L.age === 'elder';
  const g = L.girth, f = L.female;
  const legK = kid ? 0.86 : 1, torsoK = kid ? 0.92 : 1;
  const P = {
    hs: kid ? 1.32 : teen ? 1.07 : 1,          // head scale
    ankle: -1.6, knee: -11.6 * legK, hip: -21.6 * legK,
  };
  P.waist = P.hip - 4 * torsoK; P.chest = P.hip - 8.6 * torsoK; P.shoulder = P.hip - 12.2 * torsoK; P.neck = P.shoulder - 0.9;
  P.headR = 3.75 * P.hs; P.headC = P.neck - 1.4 - P.headR * 1.05;
  P.sw = (f ? 4.5 : 5.4) * (0.82 + 0.18 * g) * (kid ? 0.85 : 1);  // half shoulder width
  P.ww = (f ? 3.1 : 3.7) * g * (kid ? 0.9 : 1);                  // half waist
  P.hw = (f ? 4.4 : 3.9) * (0.88 + 0.12 * g) * (kid ? 0.9 : 1);  // half hips
  P.legW = 2.5 * Math.sqrt(g) * (kid ? 0.9 : 1); P.calfW = 1.95 * Math.sqrt(g) * (kid ? 0.9 : 1);
  P.armW = 1.85 * Math.sqrt(g); P.foreW = 1.6 * Math.sqrt(g);
  P.upper = 7 * torsoK; P.fore = 6.4 * torsoK;
  P.stoop = elder ? 1 : 0;
  return P;
}

// A tapered limb segment with rounded joints, shaded across its width (light from the upper left).
function limb(ctx, x0, y0, x1, y1, w0, w1, color, back) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const g = ctx.createLinearGradient(x0 - nx * w0, y0 - ny * w0, x0 + nx * w0, y0 + ny * w0);
  const c = back ? shade(color, -0.16) : color;
  const lightFirst = nx < 0 || (nx === 0 && ny < 0);
  g.addColorStop(0, lightFirst ? shade(c, 0.14) : shade(c, -0.24)); g.addColorStop(0.5, c); g.addColorStop(1, lightFirst ? shade(c, -0.24) : shade(c, 0.14));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); ctx.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  ctx.arc(x1, y1, w1 / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true);
  ctx.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  ctx.arc(x0, y0, w0 / 2, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true);
  ctx.closePath(); ctx.fill();
}

// ---------------------------------------------------------------------------------------------
export function drawPerson(ctx, L, dir, frame) {
  const k = L.body * PEOPLE_SCALE;
  ctx.save();
  ctx.translate(AX, AY);
  ctx.scale(k, k);
  const P = frameOf(L);
  const walking = typeof frame === 'number';
  const mount = frame === 'mount'; // on horseback: legs astride, hands forward on the reins
  const ride = typeof frame === 'string' && (frame.startsWith('ride') || mount);
  const ph = walking ? frame : ride && !mount ? +frame.slice(4) * 2 : 0;
  const sit = frame === 'sit', hurt = frame === 'hurt', dance = typeof frame === 'string' && frame.startsWith('dance');
  const side = dir === 2 || dir === 3;
  if (dir === 3) ctx.scale(-1, 1);
  if (!hurt) {
    const sg = ctx.createRadialGradient(0, 0, 0.3, 0, 0, 7.5 * L.girth);
    sg.addColorStop(0, 'rgba(18,18,30,0.42)'); sg.addColorStop(1, 'rgba(18,18,30,0)');
    ctx.save(); ctx.scale(1, 0.32); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 7.5 * L.girth, 0, 7); ctx.fill(); ctx.restore();
  }
  const bob = walking ? (ph % 2 ? -0.55 : 0.1) : frame === 'idle2' ? -0.25 : dance ? (+frame.slice(5) % 2 ? -1.2 : 0) : 0;
  ctx.translate(0, bob + (sit ? 4.2 : 0) + (ride ? 2.2 : 0));
  const skin = L.enchilado ? mix(L.skin, '#e0463a', 0.3) : L.skin;
  const C = { L, P, dir, side, frame, walking, ph, sit, ride, mount, hurt, dance, skin };
  if (side) drawSide(ctx, C); else drawFront(ctx, C, dir === 1);
  if (L.enchilado) { ctx.fillStyle = 'rgba(160,210,255,0.9)'; ctx.beginPath(); ctx.ellipse(4.2, P.headC - 2, 0.6, 1, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(-4.4, P.headC, 0.5, 0.8, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---- front / back view -----------------------------------------------------------------------
function drawFront(ctx, C, back) {
  const { L, P, walking, ph, sit, ride, dance, skin } = C;
  const swing = walking ? [0.9, 0, -0.9, 0][ph] : ride ? [0.7, -0.7][ph / 2 | 0] : dance ? [0.8, -0.8][+C.frame.slice(5) % 2] : 0;
  const legX = P.hw * 0.46;
  const long = L.bottom === 'longskirt' || L.top === 'cassock';
  const legC = L.bottom === 'shorts' || L.bottom === 'skirt' ? skin : L.bottomColor;
  for (const s of [-1, 1]) {
    const lift = Math.max(0, s * swing) * 2.2;
    const x = s * legX, kneeY = P.knee - lift * 0.6 + (sit ? 5 : 0), ankY = P.ankle - lift + (sit ? 1 : 0);
    const thighC = L.bottom === 'skirt' || L.bottom === 'longskirt' ? skin : L.bottomColor;
    if (C.mount) { // astride: thighs out over the horse's sides, shins hanging down its flanks
      const kx = s * (P.hw + 2.6), ky = P.hip + 5.5, ax = s * (P.hw + 2.9), ay = P.hip + 12.5;
      limb(ctx, x, P.hip + 1, kx, ky, P.legW, P.legW * 0.85, L.bottom === 'shorts' ? L.bottomColor : thighC, back);
      limb(ctx, kx, ky, ax, ay, P.calfW * 1.05, P.calfW * 0.72, legC, back);
      shoe(ctx, L, ax, ay + 1.2, 0, back);
      continue;
    }
    if (!long) {
      limb(ctx, x, P.hip + 1, x * 1.02, kneeY, P.legW, P.legW * 0.85, L.bottom === 'shorts' ? L.bottomColor : thighC, back);
      limb(ctx, x * 1.02, kneeY, x * 0.98, ankY, P.calfW * 1.05, P.calfW * 0.72, legC, back);
      if (L.bottom === 'jeans') { ctx.strokeStyle = rgba(shade(L.bottomColor, 0.35), 0.5); ctx.lineWidth = 0.18; ctx.beginPath(); ctx.moveTo(x + s * 0.9, P.hip + 2); ctx.lineTo(x + s * 0.7, ankY - 0.6); ctx.stroke(); }
    } else limb(ctx, x, ankY - 3, x, ankY, P.calfW * 0.8, P.calfW * 0.7, skin, back);
    shoe(ctx, L, x, ankY + 1.2, 0, back);
  }
  lowerGarment(ctx, L, P, swing, false);
  if (!back && (L.hair === 'long' || L.hair === 'wavy') && L.hat !== 'sombrero') { ctx.fillStyle = shade(L.hairColor, -0.2); roundRect(ctx, -P.headR - 0.4, P.headC, P.headR * 2 + 0.8, P.shoulder - P.headC + 6, 2.4); ctx.fill(); }
  const armPose = (s) => {
    const sx = s * (P.sw + 0.2), sy = P.shoulder + 1.2;
    let ex = s * (P.sw + 0.9), ey = sy + P.upper, hx = s * (P.sw + 0.7), hy = ey + P.fore;
    const sw = walking ? s * swing * 0.4 : 0;
    ey -= Math.abs(sw) * 0.6; hy -= Math.max(0, sw) * 1.6;
    if (ride) { ex = s * (P.sw + 0.4); ey = sy + 5.2; hx = s * (P.sw - 0.6); hy = sy + 7.4; }
    if (sit) { hx = s * (P.sw - 0.6); hy = P.hip + 1; ey = sy + 6.5; }
    const raise = (s === 1) && !back;
    if (raise && C.frame === 'wave') { ex = s * (P.sw + 2.4); ey = sy - 3; hx = s * (P.sw + 2.6); hy = sy - 9; }
    if (raise && C.frame === 'talk') { ex = s * (P.sw + 1.3); ey = sy + 6; hx = s * (P.sw - 0.4); hy = sy + 8.2; }
    if (raise && L.phone) { ex = s * (P.sw + 0.8); ey = sy + 5.8; hx = s * 1.3; hy = P.chest - 0.6; }
    if (raise && L.holds === 'toro') { ex = s * (P.sw + 2); ey = sy - 2.4; hx = s * (P.sw + 2.2); hy = sy - 8; }
    if (raise && L.holds === 'tinaco') { ex = s * (P.sw + 1.2); ey = sy - 1.5; hx = s * (P.sw - 0.2); hy = sy - 5; }
    if (dance) { const up = (+C.frame.slice(5) + (s > 0 ? 1 : 0)) % 2; ex = s * (P.sw + 2.2); ey = sy + (up ? -1.5 : 5); hx = s * (P.sw + 3.4); hy = sy + (up ? -6.5 : 9); if (raise && L.holds === 'toro') { hx = s * (P.sw + 2.6); hy = sy - 8.5; ey = sy - 2.4; } }
    return { sx, sy, ex, ey, hx, hy };
  };
  const sleeveLong = ['shirt', 'hoodie', 'plaid', 'cassock', 'guayabera', 'cuera'].includes(L.top) || (L.uniform === 'office');
  const topC = L.dirty ? mix(L.topColor, '#7a6a55', 0.35) : L.topColor;
  const drawArm = (s) => {
    const a = armPose(s);
    limb(ctx, a.sx, a.sy, a.ex, a.ey, P.armW * 1.05, P.armW * 0.9, topC, back);
    limb(ctx, a.ex, a.ey, a.hx, a.hy, P.foreW, P.foreW * 0.8, sleeveLong ? topC : skin, back);
    if (sleeveLong) limb(ctx, a.hx - (a.hx - a.ex) * 0.12, a.hy - (a.hy - a.ey) * 0.12, a.hx, a.hy, P.foreW * 1.04, P.foreW * 0.95, shade(topC, -0.12), back);
    if (L.top === 'cuera') fringe(ctx, a.ex, a.ey, a.hx, a.hy, '#7a4422');
    hand(ctx, a.hx, a.hy + 0.4, skin, s, back, false, Math.atan2(a.hy - a.ey, a.hx - a.ex));
    if (s === 1 && !back) heldItem(ctx, L, a.hx, a.hy, false);
  };
  drawArm(-1); drawArm(1);
  torso(ctx, L, P, back, topC, skin, false);
  if (L.holds === 'tinaco' && !back) heldItem(ctx, L, P.sw, P.shoulder - 1, false);
  neck(ctx, P, skin);
  head(ctx, L, P, back ? 1 : 0, C);
}

// ---- side view (drawn facing left; flipped for right) -----------------------------------------
function drawSide(ctx, C) {
  const { L, P, walking, ph, sit, ride, dance, skin } = C;
  const cyc = walking ? [1, 0, -1, 0][ph] : dance ? [0.5, -0.5][+C.frame.slice(5) % 2] : 0;
  const pass = walking && ph % 2 === 1;
  const long = L.bottom === 'longskirt' || L.top === 'cassock';
  const stoop = P.stoop;
  const legC = L.bottom === 'shorts' || L.bottom === 'skirt' ? skin : L.bottomColor;
  const thighC = L.bottom === 'skirt' || L.bottom === 'longskirt' ? skin : L.bottomColor;
  const thighL = P.knee - P.hip - 1, shinL = P.ankle - P.knee;
  const leg = (s, back) => { // s: +1 the leg reaching forward (toward -x), -1 the trailing one
    const hx = 0, hy = P.hip + 1;
    const a = cyc * s * 0.42; // thigh angle from vertical, positive = forward
    let kx = hx - Math.sin(a) * thighL, ky = hy + Math.cos(a) * thighL;
    let bend = pass && s > 0 ? 0.6 : (cyc * s < 0 ? 0.18 : 0.04);
    let sa = a - bend; // shin angle (negative = foot behind the knee)
    let ax = kx - Math.sin(sa) * shinL, ay = ky + Math.cos(sa) * shinL;
    if (sit) { kx = -6; ky = hy; ax = kx; ay = ky + 9; }
    if (ride) { const pd = (C.ph / 2 | 0) ? s : -s; kx = -4.5; ky = hy + 3 + pd * 2.4; ax = kx + 1.2; ay = ky + 8; }
    if (C.mount) { kx = -3.8 + s * 0.4; ky = hy + 3.6; ax = kx + 1.4; ay = ky + 7.4; }
    if (!long) {
      limb(ctx, hx, hy, kx, ky, P.legW, P.legW * 0.85, L.bottom === 'shorts' ? L.bottomColor : thighC, back);
      limb(ctx, kx, ky, ax, ay, P.calfW * 1.05, P.calfW * 0.72, legC, back);
    } else limb(ctx, ax + 0.4, ay - 3, ax, ay, P.calfW * 0.8, P.calfW * 0.7, skin, back);
    shoe(ctx, L, ax, ay + 1.2, -1, back);
  };
  leg(-1, true);
  const topC = L.dirty ? mix(L.topColor, '#7a6a55', 0.35) : L.topColor;
  const sleeveLong = ['shirt', 'hoodie', 'plaid', 'cassock', 'guayabera', 'cuera'].includes(L.top) || (L.uniform === 'office');
  const arm = (s, back) => {
    const sx = -stoop * 0.8, sy = P.shoulder + 1.3;
    const a = walking ? -cyc * s * 0.5 : dance ? cyc * s * 1.6 : 0;
    let ex = sx - Math.sin(a) * P.upper, ey = sy + Math.cos(a) * P.upper;
    const fa = a + (walking ? 0.35 : 0.1);
    let hx = ex - Math.sin(fa) * P.fore, hy = ey + Math.cos(fa) * P.fore;
    if (ride) { ex = sx - 3.6; ey = sy + 4.4; hx = sx - 8; hy = sy + 5.4; }
    if (sit) { ex = sx - 1; ey = sy + 6.6; hx = sx - 4.6; hy = P.hip + 1.4; }
    if (!back && L.phone) { ex = sx + 0.6; ey = sy + 6; hx = sx - 3.2; hy = P.chest - 0.8; }
    if (!back && C.frame === 'wave') { ex = sx - 2; ey = sy - 5.5; hx = sx - 3; hy = sy - 11.5; }
    if (!back && C.frame === 'talk') { ex = sx - 0.8; ey = sy + 6.4; hx = sx - 4.6; hy = sy + 5.2; }
    if (!back && L.holds === 'toro') { ex = sx - 2; ey = sy - 5; hx = sx - 2.6; hy = sy - 11; }
    if (!back && L.holds === 'tinaco') { ex = sx - 1; ey = sy - 2; hx = sx - 1.6; hy = sy - 5.6; }
    limb(ctx, sx, sy, ex, ey, P.armW * 1.05, P.armW * 0.9, topC, back);
    limb(ctx, ex, ey, hx, hy, P.foreW, P.foreW * 0.8, sleeveLong ? topC : skin, back);
    if (sleeveLong) limb(ctx, hx - (hx - ex) * 0.12, hy - (hy - ey) * 0.12, hx, hy, P.foreW * 1.04, P.foreW * 0.95, shade(topC, -0.12), back);
    if (L.top === 'cuera') fringe(ctx, ex, ey, hx, hy, '#7a4422');
    hand(ctx, hx, hy + 0.3, skin, 1, back, true, Math.atan2(hy - ey, hx - ex));
    if (!back && L.holds !== 'tinaco') heldItem(ctx, L, hx, hy, true);
  };
  arm(-1, true);
  if (!long) leg(1, false);
  lowerGarment(ctx, L, P, cyc, true);
  if (long) leg(1, false);
  torso(ctx, L, P, false, topC, skin, true);
  neck(ctx, P, skin, true);
  head(ctx, L, P, 2, C);
  arm(1, false);
  if (L.holds === 'tinaco') heldItem(ctx, L, -1, P.shoulder - 1, true);
}

function neck(ctx, P, skin, side) {
  limb(ctx, side ? -P.stoop * 1.1 : 0, P.neck + 1.4, side ? -P.stoop * 1.6 - 0.3 : 0, P.headC + P.headR * 0.6, 2.2 * P.hs, 1.9 * P.hs, shade(skin, -0.12), false);
}

function shoe(ctx, L, x, y, facing, back) {
  const c0 = L.shoes === 'huaraches' ? '#8a5a2b' : L.shoeColor;
  const c = back ? shade(c0, -0.18) : c0;
  ctx.save(); ctx.translate(x, y);
  if (facing) {
    ctx.scale(-facing, 1);
    // profile: sole, toe box, heel (boots have a riding heel and a pointed toe)
    const boots = L.shoes === 'boots';
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(-1.1, -2.6); ctx.lineTo(0.9, -2.6); ctx.lineTo(1.2, -0.9);
    ctx.quadraticCurveTo(boots ? 4.2 : 3.4, -1.1, boots ? 4.6 : 3.6, -0.1); ctx.lineTo(-1.3, 0.1); ctx.closePath(); ctx.fill();
    if (boots) { ctx.fillStyle = shade(c, -0.3); ctx.fillRect(-1.3, -4.2, 2.6, 1.8); ctx.fillStyle = '#2a1a10'; ctx.fillRect(-1.3, -0.4, 1.3, 0.8); }
    ctx.fillStyle = L.shoes === 'sneakers' ? '#f4f4f2' : shade(c, -0.35); ctx.fillRect(-1.3, -0.35, (boots ? 5.6 : 4.8), 0.55);
    if (L.shoes === 'sneakers') { ctx.strokeStyle = rgba('#ffffff', 0.8); ctx.lineWidth = 0.18; ctx.beginPath(); ctx.moveTo(0.2, -2.1); ctx.lineTo(1.8, -1.2); ctx.stroke(); }
    if (L.shoes === 'huaraches') { ctx.fillStyle = L.skin; ctx.fillRect(1.4, -1.4, 2, 0.8); ctx.strokeStyle = '#5a3a1b'; ctx.lineWidth = 0.3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-0.6 + i * 1.2, -1.6); ctx.lineTo(0.2 + i * 1.2, -0.2); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(0, -2.2, 1.6, 0.4);
  } else {
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -0.8, 1.35, 1.25, 0, 0, 7); ctx.fill();
    ctx.fillRect(-1.25, -2.4, 2.5, 1.6);
    ctx.fillStyle = L.shoes === 'sneakers' ? '#f4f4f2' : shade(c, -0.35); ctx.fillRect(-1.35, 0.1, 2.7, 0.5);
    if (L.shoes === 'huaraches') { ctx.fillStyle = L.skin; ctx.beginPath(); ctx.ellipse(0, -0.8, 1, 0.8, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#5a3a1b'; ctx.lineWidth = 0.32; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-1.2, -1.4 + i * 0.6); ctx.lineTo(1.2, -1.4 + i * 0.6); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-0.4, -1.2, 0.5, 0.35, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function lowerGarment(ctx, L, P, swing, side) {
  if (L.top === 'cassock') return;
  const c = L.bottomColor;
  if (L.bottom === 'skirt' || L.bottom === 'longskirt') {
    const len = L.bottom === 'longskirt' ? (P.ankle - P.hip) - 1.2 : (P.knee - P.hip) + 1.4;
    const w0 = P.hw + 0.3, w1 = P.hw + (L.bottom === 'longskirt' ? 2.4 : 1.8);
    const g = ctx.createLinearGradient(-w1, 0, w1, 0); g.addColorStop(0, shade(c, 0.12)); g.addColorStop(0.55, c); g.addColorStop(1, shade(c, -0.28));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-w0 * (side ? 0.8 : 1), P.waist + 0.6); ctx.lineTo(w0 * (side ? 0.8 : 1), P.waist + 0.6);
    ctx.lineTo(w1 * (side ? 0.85 : 1) + swing * 0.4, P.hip + len); ctx.quadraticCurveTo(0, P.hip + len + 0.8, -w1 * (side ? 0.85 : 1) + swing * 0.4, P.hip + len); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(shade(c, -0.35), 0.55); ctx.lineWidth = 0.22;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * w0 * 0.35, P.waist + 1.2); ctx.lineTo(i * w1 * 0.4 + swing * 0.3, P.hip + len - 0.2); ctx.stroke(); }
    if (L.bottom === 'longskirt') { ctx.fillStyle = L.embroidery; ctx.fillRect(-w1, P.hip + len - 1.6, w1 * 2, 0.7); }
  } else {
    const w = (side ? P.hw * 0.8 : P.hw) + 0.2;
    const g = ctx.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, shade(c, 0.12)); g.addColorStop(0.6, c); g.addColorStop(1, shade(c, -0.26));
    ctx.fillStyle = g; roundRect(ctx, -w, P.waist + 0.4, w * 2, P.hip - P.waist + 1.8, 1.2); ctx.fill();
    if (!side) { ctx.strokeStyle = rgba(shade(c, -0.4), 0.6); ctx.lineWidth = 0.2; ctx.beginPath(); ctx.moveTo(0, P.waist + 1); ctx.lineTo(0, P.hip + 1.6); ctx.stroke(); }
  }
}

function torso(ctx, L, P, back, topC, skin, side) {
  const st = side ? -P.stoop * 0.8 : 0;
  const sw = side ? P.sw * 0.62 : P.sw, ww = side ? P.ww * 0.72 : P.ww, hw = side ? P.hw * 0.7 : P.hw;
  const belly = Math.max(0, L.girth - 1.05) * 6;
  const top = P.shoulder, bot = (L.top === 'crop' ? P.waist - 1.4 : P.hip - 0.6) + (L.top === 'cuera' ? 3.4 : 0);
  if (L.top === 'cassock') {
    const g = ctx.createLinearGradient(-P.hw - 2, 0, P.hw + 2, 0); g.addColorStop(0, shade(topC, 0.18)); g.addColorStop(1, shade(topC, -0.2));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-sw + st, top); ctx.lineTo(sw + st, top); ctx.lineTo(P.hw + 2, P.ankle - 0.6); ctx.lineTo(-P.hw - 2, P.ankle - 0.6); ctx.closePath(); ctx.fill();
  }
  const g = ctx.createLinearGradient(-sw - belly * 0.3, 0, sw + belly * 0.3, 0);
  g.addColorStop(0, shade(topC, 0.16)); g.addColorStop(0.45, topC); g.addColorStop(1, shade(topC, -0.26));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-sw + st + 0.6, top - 0.2);
  ctx.quadraticCurveTo(-sw + st - 0.5, top + 0.4, -sw + st - 0.2, top + 2.2);
  if (side) { ctx.quadraticCurveTo(-sw - belly * 0.9 + st * 0.5, P.chest + 1.5, -ww - belly, P.waist); ctx.quadraticCurveTo(-hw - belly * 0.4, P.hip - 1, -hw, bot); }
  else { ctx.quadraticCurveTo(-sw + 0.2, P.chest, -ww - belly * 0.35, P.waist); ctx.quadraticCurveTo(-hw - 0.2, P.hip - 1.4, -hw - 0.2, bot); }
  ctx.lineTo(hw + 0.2, bot);
  if (side) { ctx.quadraticCurveTo(hw * 0.9, P.waist, sw * 0.9 + st, P.chest); ctx.quadraticCurveTo(sw + st + 0.4, top + 0.4, sw * 0.6 + st, top - 0.2); }
  else { ctx.quadraticCurveTo(hw + 0.2, P.hip - 1.4, ww + belly * 0.35, P.waist); ctx.quadraticCurveTo(sw - 0.2, P.chest, sw + st + 0.2, top + 2.2); ctx.quadraticCurveTo(sw + st + 0.5, top + 0.4, sw + st - 0.6, top - 0.2); }
  ctx.closePath(); ctx.fill();
  if (L.top === 'crop') { ctx.fillStyle = skin; ctx.fillRect(-ww, P.waist - 1.4, ww * 2, 1.9); }
  ctx.strokeStyle = rgba(shade(topC, -0.4), 0.35); ctx.lineWidth = 0.2;
  ctx.beginPath(); ctx.moveTo(-ww * 0.5, P.waist - 0.2); ctx.quadraticCurveTo(-ww * 0.2, P.waist - 1.6, ww * 0.2, P.waist - 0.6); ctx.stroke();
  if (!back && !side && L.female && L.age !== 'kid') { ctx.strokeStyle = rgba(shade(topC, -0.35), 0.35); ctx.lineWidth = 0.25; ctx.beginPath(); ctx.arc(-1.6, P.chest + 0.4, 1.6, 0.3, 2.6); ctx.arc(1.6, P.chest + 0.4, 1.6, 0.5, 2.8); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.ellipse(-sw * 0.4 + st, P.chest - 1, sw * 0.35, 2.2, 0, 0, 7); ctx.fill();
  topDetails(ctx, L, P, back, side, topC, skin, sw, ww, hw);
  if (L.apron && !back) { const ag = ctx.createLinearGradient(0, P.chest, 0, P.knee); ag.addColorStop(0, '#fbf8f1'); ag.addColorStop(1, '#e6dfd0'); ctx.fillStyle = ag; roundRect(ctx, -hw * (side ? 0.5 : 0.85) - (side ? 1.4 : 0), P.chest + 1.2, hw * (side ? 1 : 1.7), P.knee - P.chest + 1.5, 0.8); ctx.fill(); ctx.fillStyle = L.embroidery; ctx.fillRect(-hw * (side ? 0.5 : 0.85) - (side ? 1.4 : 0), P.knee + 1.6, hw * (side ? 1 : 1.7), 0.6); }
  if (L.backpack) { ctx.fillStyle = back ? '#2d3a6b' : '#22305a'; if (back) { roundRect(ctx, -sw * 0.75, top + 1.2, sw * 1.5, 7.5, 1.6); ctx.fill(); ctx.fillStyle = '#e1b12c'; ctx.fillRect(-sw * 0.5, top + 5, sw, 0.6); } else if (side) { roundRect(ctx, sw * 0.7, top + 1.2, 2.8, 7, 1.2); ctx.fill(); } else { ctx.fillRect(-sw + 0.6, top, 0.9, 7); ctx.fillRect(sw - 1.5, top, 0.9, 7); } }
  if (L.rebozo) rebozo(ctx, L, P, back, side, sw);
}

function topDetails(ctx, L, P, back, side, topC, skin, sw, ww, hw) {
  const front = !back && !side;
  const top = P.shoulder;
  if (L.top === 'bordado') {
    if (!back) {
      for (let i = -sw + 0.8; i < sw - 0.6; i += 1.1) { ctx.fillStyle = L.embroidery; ctx.beginPath(); ctx.arc(i, top + 1.8, 0.42, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#3a8a4a'; for (let i = -sw + 1.3; i < sw - 0.6; i += 2.2) ctx.fillRect(i, top + 2.5, 0.8, 0.35);
      ctx.fillStyle = '#f2c14e'; for (let i = -sw + 1.8; i < sw - 0.6; i += 2.2) { ctx.beginPath(); ctx.arc(i, top + 0.9, 0.3, 0, 7); ctx.fill(); }
      if (front) { ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0, top + 0.2, 1.7, 0.9, 0, 0, Math.PI); ctx.fill(); }
    }
  } else if (L.top === 'guayabera') {
    if (front) { ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = 0.25; for (const x of [-2.4, -1.8, 1.8, 2.4]) { ctx.beginPath(); ctx.moveTo(x, top + 1.5); ctx.lineTo(x, P.hip - 1); ctx.stroke(); } ctx.fillStyle = '#ece6d6'; for (let y = top + 2; y < P.hip - 1; y += 2) { ctx.beginPath(); ctx.arc(0, y, 0.22, 0, 7); ctx.fill(); } }
  } else if (L.top === 'plaid') {
    ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = shade(topC, -0.4); ctx.lineWidth = 0.35; ctx.beginPath();
    for (let x = -sw; x < sw; x += 1.5) { ctx.moveTo(x, top); ctx.lineTo(x, P.hip); }
    for (let y = top + 0.6; y < P.hip; y += 1.5) { ctx.moveTo(-sw, y); ctx.lineTo(sw, y); }
    ctx.stroke(); ctx.restore();
    if (front) collar(ctx, top, topC);
  } else if (L.top === 'jersey') {
    if (L.kit) {
      ctx.fillStyle = L.kit[1]; if (!side) { ctx.fillRect(-sw, top + 4, 1.2, P.hip - top - 4); ctx.fillRect(sw - 1.2, top + 4, 1.2, P.hip - top - 4); }
      ctx.fillStyle = L.kit[2]; ctx.fillRect(-ww, top + 3.2, ww * 2, 0.6);
      if (front) clubLogo(ctx, L.uniform, 0, P.chest + 1.2, L.kit);
      if (side) clubLogo(ctx, L.uniform, -0.4, P.chest + 1, L.kit, 0.6);
      if (back) { ctx.fillStyle = L.kit[2]; ctx.font = 'bold 1.6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText({ rinos: 'RINOS', mamazonas: 'MAMAZONAS', apenitas: 'APENITAS' }[L.uniform], 0, P.chest + 1.6); }
    } else {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-sw, top + 3, sw * 2, 0.7);
      if (front || back) { ctx.fillStyle = '#fff'; ctx.font = 'bold 3px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(7 + (L.seed % 20)), 0, P.chest + 2.4); }
    }
  } else if (L.top === 'hoodie') {
    if (front) { ctx.fillStyle = shade(topC, -0.15); roundRect(ctx, -2.2, P.waist - 2.6, 4.4, 2.4, 0.6); ctx.fill(); ctx.strokeStyle = '#eee'; ctx.lineWidth = 0.22; ctx.beginPath(); ctx.moveTo(-0.8, top + 0.6); ctx.lineTo(-0.9, top + 3.2); ctx.moveTo(0.8, top + 0.6); ctx.lineTo(0.9, top + 3.2); ctx.stroke(); }
    if (back) { ctx.fillStyle = shade(topC, -0.12); ctx.beginPath(); ctx.ellipse(0, top + 1, 2.6, 1.6, 0, 0, 7); ctx.fill(); }
  } else if (L.top === 'shirt' || L.top === 'polo') {
    if (front) {
      collar(ctx, top, topC);
      if (L.top === 'shirt') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = top + 2.4; y < P.hip - 1; y += 1.9) { ctx.beginPath(); ctx.arc(0, y, 0.2, 0, 7); ctx.fill(); } ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.15; ctx.beginPath(); ctx.moveTo(0.3, top + 1.6); ctx.lineTo(0.3, P.hip - 0.8); ctx.stroke(); }
      if (L.tie) { ctx.fillStyle = '#7a1f2b'; ctx.beginPath(); ctx.moveTo(-0.5, top + 1.3); ctx.lineTo(0.5, top + 1.3); ctx.lineTo(0.8, P.waist - 0.5); ctx.lineTo(0, P.waist + 0.4); ctx.lineTo(-0.8, P.waist - 0.5); ctx.fill(); }
      if (L.uniform === 'taxi') { ctx.fillStyle = '#f5f5f5'; ctx.fillRect(-3.4, top + 2.6, 2, 1.2); }
      if (L.uniform === 'police') { ctx.fillStyle = '#e1b12c'; ctx.beginPath(); ctx.arc(-2.6, top + 3.2, 0.7, 0, 7); ctx.fill(); ctx.fillStyle = '#c9ced6'; ctx.fillRect(1.4, top + 2.6, 2, 0.6); }
      if (L.cross) { ctx.fillStyle = '#d42a2a'; ctx.fillRect(-3, top + 2.4, 2.2, 0.7); ctx.fillRect(-2.25, top + 1.65, 0.7, 2.2); }
    }
    if (back && L.uniform === 'police') { ctx.fillStyle = '#f2f2f2'; ctx.font = 'bold 1.6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('POLICÍA', 0, P.chest + 1); }
    if (back && L.cross) { ctx.fillStyle = '#d42a2a'; ctx.fillRect(-1.4, P.chest - 0.6, 2.8, 0.9); ctx.fillRect(-0.45, P.chest - 1.6, 0.9, 2.8); }
  } else if (L.top === 'scrubs') {
    if (front) { ctx.fillStyle = shade(topC, -0.15); ctx.beginPath(); ctx.moveTo(-1.8, top); ctx.lineTo(0, top + 2.4); ctx.lineTo(1.8, top); ctx.fill(); }
  } else if (L.top === 'cassock') {
    if (front) { ctx.fillStyle = '#f5f5f5'; ctx.fillRect(-0.8, top - 0.1, 1.6, 0.9); ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let y = top + 2; y < -2; y += 1.8) { ctx.beginPath(); ctx.arc(0, y, 0.2, 0, 7); ctx.fill(); } }
  } else if (L.top === 'blouse') {
    if (front) { ctx.fillStyle = shade(topC, -0.1); ctx.beginPath(); ctx.ellipse(0, top + 0.5, 2.2, 1.1, 0, 0, Math.PI); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.2; ctx.beginPath(); ctx.moveTo(-sw + 0.6, top + 3.6); ctx.quadraticCurveTo(0, top + 4.6, sw - 0.6, top + 3.6); ctx.stroke(); }
  } else if (L.top === 'cuera') {
    ctx.strokeStyle = '#6b3a1a'; ctx.lineWidth = 0.18;
    for (let x = -hw; x <= hw; x += 0.5) { ctx.beginPath(); ctx.moveTo(x, P.hip + 2.4); ctx.lineTo(x + 0.15, P.hip + 4.6); ctx.stroke(); }
    if (!back) {
      ctx.fillStyle = '#eef3f8'; ctx.beginPath(); ctx.moveTo(-sw + 0.4, top + 0.4); ctx.lineTo(sw - 0.4, top + 0.4); ctx.lineTo(0, P.waist + 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f7f7f2'; for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(Math.cos(an) * 1, P.chest - 0.5 + Math.sin(an) * 1, 0.8, 0.5, an, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.arc(0, P.chest - 0.5, 0.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#4c8a3a'; ctx.beginPath(); ctx.ellipse(-1.8, P.chest + 0.8, 0.9, 0.4, 0.5, 0, 7); ctx.ellipse(1.8, P.chest + 0.8, 0.9, 0.4, -0.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#c8392b'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(-sw, top + 1); ctx.lineTo(hw, P.hip); ctx.stroke();
    }
  }
  if (L.top !== 'cassock' && L.top !== 'crop' && L.top !== 'cuera') {
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(-hw, P.hip - 1.2, hw * 2, 0.5);
    if (!L.female && (L.bottom === 'jeans' || L.bottom === 'pants') && ['shirt', 'plaid', 'polo'].includes(L.top)) {
      ctx.fillStyle = '#3b2618'; ctx.fillRect(-hw, P.hip - 1.4, hw * 2, 0.9);
      if (front && (L.hat === 'texana' || L.hat === 'sombrero' || L.shoes === 'boots')) { ctx.fillStyle = '#d0ad52'; roundRect(ctx, -1.1, P.hip - 1.7, 2.2, 1.4, 0.3); ctx.fill(); }
    }
  }
}
function collar(ctx, top, topC) {
  ctx.fillStyle = shade(topC, 0.08);
  ctx.beginPath(); ctx.moveTo(-2.2, top - 0.3); ctx.lineTo(0, top + 2); ctx.lineTo(-0.4, top + 2.4); ctx.lineTo(-2.6, top + 0.8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2.2, top - 0.3); ctx.lineTo(0, top + 2); ctx.lineTo(0.4, top + 2.4); ctx.lineTo(2.6, top + 0.8); ctx.fill();
  ctx.strokeStyle = rgba(shade(topC, -0.45), 0.6); ctx.lineWidth = 0.15; ctx.stroke();
}
// Club emblems: the rhino of Los Rinos, the Amazon shield of Las Mamazonas, the drop of sweat of Los Apenitas.
export function clubLogo(ctx, club, x, y, kit, sc = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  if (club === 'rinos') {
    ctx.fillStyle = kit[2];
    ctx.beginPath(); ctx.moveTo(-2.4, 0.8); ctx.quadraticCurveTo(-2.2, -1.2, 0, -1.2); ctx.lineTo(1.4, -1); ctx.lineTo(2.3, -2.4); ctx.lineTo(2.1, -0.6); ctx.lineTo(2.7, 0.2); ctx.lineTo(1.6, 0.8); ctx.lineTo(1.2, 1.4); ctx.lineTo(0.7, 0.8); ctx.lineTo(-1.2, 0.8); ctx.lineTo(-1.5, 1.4); ctx.lineTo(-2, 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = kit[1]; ctx.beginPath(); ctx.arc(1.2, -0.4, 0.2, 0, 7); ctx.fill();
  } else if (club === 'mamazonas') {
    ctx.fillStyle = kit[2]; ctx.beginPath(); ctx.moveTo(-1.4, -1.6); ctx.lineTo(1.4, -1.6); ctx.lineTo(1.4, 0); ctx.quadraticCurveTo(0, 1.8, -1.4, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = kit[0]; ctx.fillRect(-0.2, -1.4, 0.4, 2.2); ctx.fillRect(-1, -0.6, 2, 0.4);
  } else {
    ctx.fillStyle = kit[2]; ctx.beginPath(); ctx.moveTo(0, -1.8); ctx.quadraticCurveTo(1.6, 0, 0, 1.2); ctx.quadraticCurveTo(-1.6, 0, 0, -1.8); ctx.fill();
  }
  ctx.restore();
}

function rebozo(ctx, L, P, back, side, sw) {
  const c = L.rebozo, top = P.shoulder;
  ctx.fillStyle = c;
  if (back) { ctx.beginPath(); ctx.moveTo(-sw - 0.6, top - 0.3); ctx.lineTo(sw + 0.6, top - 0.3); ctx.lineTo(sw + 1.2, P.hip + 1); ctx.lineTo(-sw - 1.2, P.hip + 1); ctx.fill(); }
  else {
    ctx.beginPath(); ctx.moveTo(-sw - 0.6, top - 0.3); ctx.lineTo(sw + 0.6, top - 0.3); ctx.lineTo(sw + 0.9, top + 2.2); ctx.lineTo(-sw - 0.9, top + 2.2); ctx.fill();
    ctx.fillRect(-sw - 0.9, top + 1.4, 2, P.hip - top + 2); if (!side) ctx.fillRect(sw - 1.1, top + 1.4, 2, P.hip - top + 2);
  }
  ctx.fillStyle = rgba('#ffffff', 0.16); for (let y = top + 0.6; y < P.hip + 1; y += 1.1) ctx.fillRect(-sw - 1, y, sw * 2 + 2, 0.28);
  ctx.fillStyle = rgba('#000000', 0.16); for (let x = -sw; x < sw; x += 1.3) ctx.fillRect(x, top - 0.3, 0.28, 2.6);
  ctx.strokeStyle = shade(c, 0.22); ctx.lineWidth = 0.18; ctx.beginPath();
  const fy = P.hip + (back ? 1 : 3.4);
  for (let x = -sw - 1; x < (back ? sw + 1 : -sw + 1.2); x += 0.4) { ctx.moveTo(x, fy); ctx.lineTo(x + 0.05, fy + 1.2); }
  if (!back && !side) for (let x = sw - 1.1; x < sw + 0.9; x += 0.4) { ctx.moveTo(x, fy); ctx.lineTo(x + 0.05, fy + 1.2); }
  ctx.stroke();
}
function fringe(ctx, x0, y0, x1, y1, c) {
  ctx.strokeStyle = c; ctx.lineWidth = 0.15;
  for (let t = 0.1; t < 1; t += 0.12) { const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; ctx.beginPath(); ctx.moveTo(x + 0.6, y); ctx.lineTo(x + 1.6, y + 0.8); ctx.stroke(); }
}

// A hand: palm, four fingers with knuckle creases, a thumb.
function hand(ctx, x, y, skin, s, back, side, ang) {
  const c = back ? shade(skin, -0.12) : skin, d = shade(c, -0.25);
  ctx.save(); ctx.translate(x, y); ctx.rotate((ang || Math.PI / 2) - Math.PI / 2);
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0.2, 0.85, 1, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineWidth = 0.38;
  for (let i = 0; i < 4; i++) { const fx = -0.6 + i * 0.4, fl = i === 1 || i === 2 ? 1.05 : 0.85; ctx.beginPath(); ctx.moveTo(fx, 0.8); ctx.lineTo(fx * 1.05, 0.8 + fl); ctx.stroke(); }
  ctx.strokeStyle = d; ctx.lineWidth = 0.08;
  for (let i = 1; i < 4; i++) { const fx = -0.8 + i * 0.4; ctx.beginPath(); ctx.moveTo(fx, 0.9); ctx.lineTo(fx, 1.6); ctx.stroke(); }
  ctx.strokeStyle = c; ctx.lineWidth = 0.42;
  const tx = side ? -1 : (s > 0 ? -1 : 1);
  ctx.beginPath(); ctx.moveTo(tx * 0.6, 0); ctx.lineTo(tx * 1.2, 0.8); ctx.stroke();
  ctx.lineCap = 'butt'; ctx.restore();
}

function heldItem(ctx, L, x, y, side) {
  const it = L.holds;
  if (L.phone) { ctx.fillStyle = '#1b1b1f'; roundRect(ctx, x - 0.8, y - 2.4, 1.6, 2.8, 0.3); ctx.fill(); ctx.fillStyle = '#86d3ff'; ctx.fillRect(x - 0.6, y - 2.2, 1.2, 2.2); }
  if (!it) return;
  if (it === 'rifle') { ctx.save(); ctx.translate(x, y); ctx.rotate(side ? -0.15 : -0.9); ctx.fillStyle = '#5a3a22'; ctx.fillRect(-5, -0.8, 6, 1.7); ctx.fillStyle = '#2b2b2e'; ctx.fillRect(0, -0.6, 11, 0.9); ctx.restore(); }
  else if (it === 'stick') { ctx.strokeStyle = '#7a5a36'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 1, y + 4); ctx.lineTo(x + 2, y - 8); ctx.stroke(); }
  else if (it === 'cup') { ctx.fillStyle = '#f5f0e6'; ctx.fillRect(x - 0.8, y - 2.2, 1.7, 2.2); ctx.fillStyle = '#6b3f22'; ctx.fillRect(x - 0.8, y - 2.2, 1.7, 0.5); }
  else if (it === 'michelada') { ctx.fillStyle = '#e6c75a'; ctx.fillRect(x - 0.9, y - 3, 1.8, 3); ctx.fillStyle = '#b8322a'; ctx.fillRect(x - 1, y - 3.3, 2, 0.6); }
  else if (it === 'bag') { ctx.fillStyle = '#e84a6a'; roundRect(ctx, x - 1.8, y + 0.4, 3.6, 3.8, 0.8); ctx.fill(); ctx.strokeStyle = '#b8325a'; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.arc(x, y + 0.6, 1, Math.PI, 0); ctx.stroke(); }
  else if (it === 'lantern') { ctx.fillStyle = '#333'; ctx.fillRect(x - 0.9, y, 1.8, 2.8); ctx.fillStyle = '#ffe9a6'; ctx.fillRect(x - 0.6, y + 0.5, 1.2, 1.8); }
  else if (it === 'trompo') { ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(x - 1.1, y + 0.4); ctx.lineTo(x + 1.1, y + 0.4); ctx.lineTo(x, y + 2.6); ctx.fill(); }
  else if (it === 'bread') { ctx.fillStyle = '#f3d9a5'; ctx.beginPath(); ctx.ellipse(x, y + 0.8, 1.6, 1, 0, 0, 7); ctx.fill(); }
  else if (it === 'broom') { ctx.strokeStyle = '#b8935a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 6); ctx.stroke(); ctx.fillStyle = '#d8b56a'; ctx.beginPath(); ctx.moveTo(x - 2, y + 9.5); ctx.lineTo(x + 2, y + 9.5); ctx.lineTo(x + 0.8, y + 5.6); ctx.lineTo(x - 0.8, y + 5.6); ctx.fill(); }
  else if (it === 'toro') {
    ctx.save(); ctx.translate(x, y - 2.2);
    ctx.fillStyle = '#2b2622'; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8e2d4'; ctx.fillRect(-0.6, -1.2, 1.4, 1.4);
    ctx.fillStyle = '#2b2622'; ctx.beginPath(); ctx.ellipse(-2.6, -0.8, 1, 0.8, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#e8e2d4'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(-3.2, -1.4); ctx.lineTo(-3.8, -2.2); ctx.moveTo(-2.2, -1.4); ctx.lineTo(-1.8, -2.2); ctx.stroke();
    ctx.fillStyle = '#2b2622'; for (const lx of [-1.8, -0.6, 0.8, 1.8]) ctx.fillRect(lx, 0.8, 0.4, 1.4);
    ctx.restore();
  } else if (it === 'tinaco') { // a Citijal tinaco carried on the shoulder
    ctx.save(); ctx.translate(x, y - 3); const g = ctx.createLinearGradient(-3, 0, 3, 0); g.addColorStop(0, '#efe6c8'); g.addColorStop(1, '#bfb48e');
    ctx.fillStyle = g; roundRect(ctx, -3, -4.4, 6, 8.4, 1.8); ctx.fill(); ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-1.2, -5.2, 2.4, 1); ctx.fillStyle = '#2a5ea8'; ctx.fillRect(-2.2, -1, 4.4, 1); ctx.restore();
  } else if (it === 'charola') { for (let i = -1; i <= 1; i++) { ctx.fillStyle = ['#f2c94c', '#e74c3c', '#f5f0e6'][i + 1]; ctx.beginPath(); ctx.arc(x + i * 1.6, y - 1.4, 0.8, 0, 7); ctx.fill(); } ctx.fillStyle = '#c9ccd1'; ctx.beginPath(); ctx.ellipse(x, y - 0.6, 3, 0.9, 0, 0, 7); ctx.fill(); }
  else if (it === 'hueso') { ctx.fillStyle = '#efe8d6'; ctx.fillRect(x - 1.4, y - 0.3, 2.8, 0.6); for (const sx of [-1.4, 1.4]) { ctx.beginPath(); ctx.arc(x + sx, y - 0.4, 0.45, 0, 7); ctx.arc(x + sx, y + 0.4, 0.45, 0, 7); ctx.fill(); } }
}

// ---- heads and faces ---------------------------------------------------------------------------
// view: 0 front, 1 back, 2 side (facing left)
function head(ctx, L, P, view, C) {
  const hc = L.hairColor, R = P.headR;
  const cx = view === 2 ? -P.stoop * 1.8 : 0, cy = P.headC + (view === 2 ? P.stoop * 0.6 : 0);
  ctx.save(); ctx.translate(cx, cy);
  const expr = C.hurt ? 'hurt' : C.walking ? 'neutral' : (L.expr || 'neutral');
  if (L.mask !== 'negrito' && view !== 1 && (L.hair === 'long' || L.hair === 'wavy') && L.hat !== 'sombrero') { ctx.fillStyle = shade(hc, -0.22); ctx.beginPath(); ctx.ellipse(view === 2 ? 1 : 0, 1.5, R * 1.08, R * 1.3, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = shade(L.skin, -0.06);
  if (view !== 2) for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * R * 0.94, 0.5, 0.75 * L.ears, 1.15 * L.ears, s * 0.2, 0, 7); ctx.fill(); ctx.fillStyle = shade(L.skin, -0.2); ctx.beginPath(); ctx.ellipse(s * R * 0.96, 0.6, 0.35 * L.ears, 0.65 * L.ears, 0, 0, 7); ctx.fill(); ctx.fillStyle = shade(L.skin, -0.06); }
  const skin = C.skin;
  const g = ctx.createRadialGradient(-R * 0.35, -R * 0.45, R * 0.15, 0, 0, R * 1.3);
  g.addColorStop(0, shade(skin, 0.12)); g.addColorStop(0.65, skin); g.addColorStop(1, shade(skin, -0.22));
  ctx.fillStyle = g;
  facePath(ctx, L, R, view); ctx.fill();
  if (L.mask === 'negrito') { negritoMask(ctx, R, view); hat(ctx, L, R, view); ctx.restore(); return; }
  if (view === 2) {
    ctx.fillStyle = shade(skin, -0.05); ctx.beginPath(); ctx.ellipse(R * 0.25, 0.4, 0.85 * L.ears, 1.25 * L.ears, 0.15, 0, 7); ctx.fill();
    ctx.fillStyle = shade(skin, -0.22); ctx.beginPath(); ctx.ellipse(R * 0.25, 0.5, 0.38, 0.7, 0, 0, 7); ctx.fill();
  }
  if (L.earrings && view !== 1) { ctx.fillStyle = '#e8c35a'; const ex = view === 2 ? R * 0.25 : R * 0.95; ctx.beginPath(); ctx.arc(ex, 1.9, 0.38, 0, 7); ctx.fill(); if (view === 0) { ctx.beginPath(); ctx.arc(-ex, 1.9, 0.38, 0, 7); ctx.fill(); } }
  if (view !== 1) face(ctx, L, R, view, expr, C.frame);
  hairTop(ctx, L, R, view, hc);
  hat(ctx, L, R, view);
  ctx.restore();
}

function facePath(ctx, L, R, view) {
  const jaw = L.jaw;
  const w = R * (jaw === 'long' ? 0.88 : jaw === 'round' ? 1 : 0.95), chin = R * (jaw === 'long' ? 1.22 : jaw === 'round' ? 1.02 : 1.12);
  ctx.beginPath();
  if (view === 2) {
    ctx.moveTo(R * 0.9, -R * 0.2);
    ctx.bezierCurveTo(R * 0.9, -R * 1.1, -R * 0.6, -R * 1.25, -R * 0.82, -R * 0.35);
    const nose = L.nose === 'aquiline' ? 1.25 : L.nose === 'button' ? 0.7 : L.nose === 'wide' ? 0.95 : 1;
    ctx.lineTo(-R * 0.95, -R * 0.05);
    ctx.lineTo(-R * (0.95 + 0.32 * nose), R * 0.32);
    ctx.lineTo(-R * 0.92, R * 0.45);
    ctx.quadraticCurveTo(-R * 0.98, R * 0.62, -R * 0.9, R * 0.72);
    ctx.quadraticCurveTo(-R * 0.96, chin * 0.92, -R * 0.62, chin);
    ctx.quadraticCurveTo(R * 0.2, chin * 0.96, R * 0.55, R * 0.55);
    ctx.quadraticCurveTo(R * 0.95, R * 0.2, R * 0.9, -R * 0.2);
  } else {
    ctx.moveTo(-w, -R * 0.15);
    ctx.bezierCurveTo(-w, -R * 1.35, w, -R * 1.35, w, -R * 0.15);
    if (jaw === 'square') { ctx.quadraticCurveTo(w * 1.02, R * 0.75, w * 0.62, chin * 0.92); ctx.quadraticCurveTo(0, chin * 1.04, -w * 0.62, chin * 0.92); ctx.quadraticCurveTo(-w * 1.02, R * 0.75, -w, -R * 0.15); }
    else if (jaw === 'heart') { ctx.quadraticCurveTo(w * 0.95, R * 0.6, w * 0.3, chin * 0.95); ctx.quadraticCurveTo(0, chin * 1.05, -w * 0.3, chin * 0.95); ctx.quadraticCurveTo(-w * 0.95, R * 0.6, -w, -R * 0.15); }
    else { ctx.quadraticCurveTo(w * 0.98, R * 0.8, 0, chin); ctx.quadraticCurveTo(-w * 0.98, R * 0.8, -w, -R * 0.15); }
  }
  ctx.closePath();
}

function face(ctx, L, R, view, expr, frame) {
  const side = view === 2;
  const blink = frame === 'blink' || expr === 'hurt';
  const eyeY = -R * 0.02, eyeX = R * 0.42;
  const eyesAt = side ? [-R * 0.55] : [-eyeX, eyeX];
  const ew = 0.82 * (L.eyes === 'round' ? 0.92 : L.eyes === 'narrow' ? 1.05 : 1), eh = (L.eyes === 'round' ? 0.62 : L.eyes === 'narrow' ? 0.36 : 0.5) * (expr === 'surprised' ? 1.45 : expr === 'happy' ? 0.75 : expr === 'angry' ? 0.8 : 1);
  const skin = L.skin, dk = shade(skin, -0.3);
  ctx.fillStyle = rgba(shade(skin, -0.25), 0.28);
  for (const ex of eyesAt) { ctx.beginPath(); ctx.ellipse(ex, eyeY - 0.1, ew * 1.25, eh * 1.6 + 0.2, 0, 0, 7); ctx.fill(); }
  for (const [i, ex] of eyesAt.entries()) {
    const s = side ? -1 : (i === 0 ? -1 : 1);
    if (blink) { ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 0.22; ctx.beginPath(); ctx.moveTo(ex - ew, eyeY); ctx.quadraticCurveTo(ex, eyeY + (expr === 'hurt' ? -0.35 : 0.3), ex + ew, eyeY); ctx.stroke(); continue; }
    const droop = L.eyes === 'droopy' ? 0.15 * s : 0;
    ctx.fillStyle = '#f7f4ee';
    ctx.beginPath(); ctx.moveTo(ex - ew * (side ? 0.6 : 1), eyeY + droop); ctx.quadraticCurveTo(ex, eyeY - eh * 1.25, ex + ew, eyeY - droop); ctx.quadraticCurveTo(ex, eyeY + eh * 1.05, ex - ew * (side ? 0.6 : 1), eyeY + droop); ctx.fill();
    const ix = ex + (side ? -0.32 : 0);
    ctx.fillStyle = L.eyeColor; ctx.beginPath(); ctx.arc(ix, eyeY + 0.02, Math.min(0.42, eh * 0.95), 0, 7); ctx.fill();
    ctx.fillStyle = '#0c0907'; ctx.beginPath(); ctx.arc(ix, eyeY + 0.03, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ix - 0.15, eyeY - 0.15, 0.1, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = L.female ? 0.26 : 0.18;
    ctx.beginPath(); ctx.moveTo(ex - ew * (side ? 0.6 : 1), eyeY + droop); ctx.quadraticCurveTo(ex, eyeY - eh * 1.3, ex + ew, eyeY - droop); ctx.stroke();
    if (L.age === 'elder' || expr === 'happy') { ctx.strokeStyle = rgba(dk, 0.5); ctx.lineWidth = 0.12; ctx.beginPath(); ctx.moveTo(ex + s * ew * 1.05, eyeY + 0.1); ctx.lineTo(ex + s * ew * 1.5, eyeY + 0.5); ctx.moveTo(ex + s * ew * 1.05, eyeY - 0.1); ctx.lineTo(ex + s * ew * 1.5, eyeY - 0.35); ctx.stroke(); }
    if (L.age === 'elder') { ctx.strokeStyle = rgba(dk, 0.35); ctx.lineWidth = 0.12; ctx.beginPath(); ctx.moveTo(ex - ew * 0.7, eyeY + eh + 0.35); ctx.quadraticCurveTo(ex, eyeY + eh + 0.65, ex + ew * 0.7, eyeY + eh + 0.35); ctx.stroke(); }
  }
  // eyebrows: thickness, arch and mood
  const browY = eyeY - R * 0.36, bw = L.brows;
  ctx.strokeStyle = L.age === 'elder' ? shade(L.hairColor, 0.05) : shade(L.hairColor === '#d9d5ce' ? '#8a8580' : L.hairColor, -0.05);
  ctx.lineCap = 'round';
  for (const [i, ex] of eyesAt.entries()) {
    const s = side ? -1 : (i === 0 ? -1 : 1);
    let inner = 0, outer = 0, mid = -L.browArch * 0.35;
    if (expr === 'angry') { inner = 0.45; outer = -0.25; }
    if (expr === 'sad') { inner = -0.45; outer = 0.2; }
    if (expr === 'surprised') { inner = -0.5; outer = -0.5; mid -= 0.25; }
    if (expr === 'happy') { inner = -0.12; outer = -0.1; }
    if (expr === 'hurt') { inner = -0.35; outer = 0.25; }
    ctx.lineWidth = 0.22 + bw * 0.42;
    const xi = ex - s * ew * 0.95, xo = ex + s * ew * 1.15;
    ctx.beginPath(); ctx.moveTo(xi, browY + inner); ctx.quadraticCurveTo(ex, browY + mid + (inner + outer) / 2 - 0.25, xo, browY + outer + 0.15); ctx.stroke();
  }
  ctx.lineCap = 'butt';
  if (side) {
    ctx.strokeStyle = rgba(dk, 0.6); ctx.lineWidth = 0.16; ctx.beginPath(); ctx.moveTo(-R * 1.12, R * 0.38); ctx.quadraticCurveTo(-R * 1.0, R * 0.42, -R * 0.98, R * 0.32); ctx.stroke();
  } else {
    const nw = L.nose === 'wide' ? 0.95 : L.nose === 'button' ? 0.5 : L.nose === 'aquiline' ? 0.6 : 0.68;
    const ny = R * 0.36;
    ctx.fillStyle = rgba(dk, 0.32); ctx.beginPath(); ctx.moveTo(0.15, eyeY + 0.2); ctx.quadraticCurveTo(0.5, ny - 0.6, nw * 0.8, ny); ctx.lineTo(0.2, ny); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(shade(skin, 0.18), 0.6); ctx.beginPath(); ctx.ellipse(-0.1, ny - 0.4, 0.25, 0.55, 0, 0, 7); ctx.fill();
    ctx.fillStyle = rgba(dk, 0.75); ctx.beginPath(); ctx.ellipse(-nw * 0.48, ny + 0.12, 0.26, 0.16, 0.3, 0, 7); ctx.ellipse(nw * 0.48, ny + 0.12, 0.26, 0.16, -0.3, 0, 7); ctx.fill();
    ctx.strokeStyle = rgba(dk, 0.45); ctx.lineWidth = 0.12; ctx.beginPath(); ctx.arc(0, ny - 0.1, nw, 0.35, Math.PI - 0.35); ctx.stroke();
  }
  if (L.cheeks || L.enchilado || expr === 'happy') { ctx.fillStyle = rgba('#d8645a', L.enchilado ? 0.5 : expr === 'happy' ? 0.22 : 0.14); for (const ex of (side ? [-R * 0.45] : [-R * 0.58, R * 0.58])) { ctx.beginPath(); ctx.ellipse(ex, R * 0.32, 0.9, 0.55, 0, 0, 7); ctx.fill(); } }
  if (L.freckles) { ctx.fillStyle = rgba('#8a5a3a', 0.45); for (let i = 0; i < 8; i++) { const fx = ((i * 37) % 10 - 5) * 0.3 * (side ? 0.5 : 1) + (side ? -R * 0.4 : 0), fy = R * 0.15 + ((i * 13) % 5) * 0.12; ctx.fillRect(fx, fy, 0.14, 0.14); } }
  if (L.mole && !side) { ctx.fillStyle = '#3b2416'; ctx.beginPath(); ctx.arc(L.mole[0], R * 0.25 + L.mole[1] * 0.3, 0.14, 0, 7); ctx.fill(); }
  const my = R * 0.66, mx = side ? -R * 0.82 : 0, mw = side ? 0.55 : (L.lips === 'full' ? 1.05 : 0.95);
  const lipC = mix(skin, '#a8433b', L.female ? 0.55 : 0.32), lipD = mix(skin, '#5a2420', 0.5);
  ctx.lineCap = 'round';
  const talking = frame === 'talk';
  if (expr === 'surprised' || (talking && expr !== 'angry')) {
    const oh = expr === 'surprised' ? 0.65 : 0.42;
    ctx.fillStyle = '#4a1a18'; ctx.beginPath(); ctx.ellipse(mx, my + 0.12, mw * (expr === 'surprised' ? 0.55 : 0.75), oh, 0, 0, 7); ctx.fill();
    if (expr !== 'surprised') { ctx.fillStyle = '#f2ece2'; ctx.fillRect(mx - mw * 0.5, my - 0.22, mw, 0.22); }
    ctx.strokeStyle = lipC; ctx.lineWidth = 0.2; ctx.stroke();
  } else if (expr === 'happy') {
    ctx.fillStyle = '#4a1a18'; ctx.beginPath(); ctx.moveTo(mx - mw, my - 0.15); ctx.quadraticCurveTo(mx, my + 0.95, mx + mw, my - 0.15); ctx.quadraticCurveTo(mx, my + 0.2, mx - mw, my - 0.15); ctx.fill();
    ctx.fillStyle = '#f4efe6'; ctx.beginPath(); ctx.moveTo(mx - mw * 0.75, my - 0.05); ctx.quadraticCurveTo(mx, my + 0.3, mx + mw * 0.75, my - 0.05); ctx.quadraticCurveTo(mx, my + 0.12, mx - mw * 0.75, my - 0.05); ctx.fill();
    ctx.strokeStyle = rgba(dk, 0.5); ctx.lineWidth = 0.12; ctx.beginPath(); ctx.moveTo(mx - mw - 0.3, my - 0.5); ctx.quadraticCurveTo(mx - mw - 0.5, my, mx - mw - 0.1, my + 0.3); ctx.moveTo(mx + mw + 0.3, my - 0.5); ctx.quadraticCurveTo(mx + mw + 0.5, my, mx + mw + 0.1, my + 0.3); ctx.stroke();
  } else {
    const curve = expr === 'sad' || expr === 'hurt' ? -0.4 : expr === 'angry' ? -0.15 : 0.12;
    ctx.strokeStyle = lipD; ctx.lineWidth = 0.2;
    ctx.beginPath(); ctx.moveTo(mx - mw, my - curve * 0.5); ctx.quadraticCurveTo(mx, my + curve, mx + mw, my - curve * 0.5); ctx.stroke();
    if (L.lips !== 'thin') { ctx.fillStyle = rgba(lipC, 0.9); ctx.beginPath(); ctx.ellipse(mx, my + 0.32, mw * 0.65, L.lips === 'full' ? 0.32 : 0.2, 0, 0, 7); ctx.fill(); }
    if (L.female && L.age !== 'kid') { ctx.fillStyle = rgba(lipC, 0.7); ctx.beginPath(); ctx.ellipse(mx - mw * 0.3, my - 0.18, mw * 0.32, 0.16, 0, 0, 7); ctx.ellipse(mx + mw * 0.3, my - 0.18, mw * 0.32, 0.16, 0, 0, 7); ctx.fill(); }
  }
  ctx.lineCap = 'butt';
  if (L.age === 'elder') { ctx.strokeStyle = rgba(dk, 0.35); ctx.lineWidth = 0.12; if (!side) { ctx.beginPath(); ctx.moveTo(-0.9, R * 0.42); ctx.quadraticCurveTo(-1.3, my, -1.05, my + 0.6); ctx.moveTo(0.9, R * 0.42); ctx.quadraticCurveTo(1.3, my, 1.05, my + 0.6); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-R * 0.45, -R * 0.62); ctx.lineTo(R * 0.45, -R * 0.62); ctx.moveTo(-R * 0.35, -R * 0.74); ctx.lineTo(R * 0.35, -R * 0.74); ctx.stroke(); }
  if (L.glasses) {
    ctx.strokeStyle = '#26221e'; ctx.lineWidth = 0.2;
    for (const ex of eyesAt) { roundRect(ctx, ex - ew * 1.35, eyeY - 0.95, ew * 2.7, 1.8, 0.45); ctx.stroke(); }
    if (!side) { ctx.beginPath(); ctx.moveTo(-eyeX + ew * 1.35, eyeY - 0.3); ctx.quadraticCurveTo(0, eyeY - 0.6, eyeX - ew * 1.35, eyeY - 0.3); ctx.stroke(); }
    ctx.fillStyle = 'rgba(210,235,255,0.2)'; for (const ex of eyesAt) ctx.fillRect(ex - ew * 1.2, eyeY - 0.85, ew * 2.4, 1.6);
  }
  if (L.beard) beard(ctx, L, R, side);
  if (L.mustache) mustache(ctx, L, R, side);
}

function beardColor(L) { return L.beardColor || (L.age === 'elder' ? mix(L.hairColor, '#e8e4dc', 0.3) : L.hairColor); }
function beard(ctx, L, R, side) {
  const c = beardColor(L), dark = shade(c, -0.3), light = shade(c, 0.25);
  const cx = side ? -R * 0.35 : 0;
  ctx.save();
  if (L.beard === 'stubble') {
    ctx.fillStyle = rgba(c, 0.32);
    ctx.beginPath(); if (side) ctx.ellipse(-R * 0.3, R * 0.62, R * 0.62, R * 0.48, 0, 0, Math.PI * 2); else { ctx.moveTo(-R * 0.9, R * 0.1); ctx.quadraticCurveTo(-R * 0.85, R * 1.15, 0, R * 1.12); ctx.quadraticCurveTo(R * 0.85, R * 1.15, R * 0.9, R * 0.1); ctx.quadraticCurveTo(0, R * 0.55, -R * 0.9, R * 0.1); }
    ctx.fill();
    ctx.fillStyle = rgba(dark, 0.45); for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI, rr = R * (0.55 + ((i * 7) % 5) / 14); ctx.fillRect(cx + Math.cos(a) * rr * (side ? 0.6 : 1), R * 0.45 + Math.sin(a) * R * 0.5, 0.12, 0.12); }
    ctx.restore(); return;
  }
  const full = L.beard === 'full', chin = L.beard === 'chin' || L.beard === 'goatee';
  const w = chin ? R * 0.32 : (side ? R * 0.7 : R * 0.92);
  const top = chin ? R * 0.72 : R * 0.08, bot = chin ? R * 1.32 : R * 1.42;
  ctx.fillStyle = c;
  ctx.beginPath();
  if (side && !chin) { ctx.moveTo(R * 0.4, top); ctx.quadraticCurveTo(R * 0.3, bot * 0.9, -R * 0.55, bot); ctx.quadraticCurveTo(-R * 1.0, bot * 0.8, -R * 0.88, R * 0.78); ctx.quadraticCurveTo(-R * 0.4, R * 0.65, -R * 0.15, R * 0.35); ctx.closePath(); }
  else {
    ctx.moveTo(cx - w, top); ctx.bezierCurveTo(cx - w, bot - 0.8, cx - w * 0.5, bot, cx, bot + 0.2); ctx.bezierCurveTo(cx + w * 0.5, bot, cx + w, bot - 0.8, cx + w, top);
    if (full) { ctx.lineTo(cx + w * 0.55, top + 0.2); ctx.quadraticCurveTo(cx + 1.3, R * 0.5, cx, R * 0.5); ctx.quadraticCurveTo(cx - 1.3, R * 0.5, cx - w * 0.55, top + 0.2); }
    ctx.closePath();
  }
  ctx.fill();
  if (full && !side) { ctx.fillStyle = mix(L.skin, '#a8433b', 0.35); ctx.beginPath(); ctx.ellipse(cx, R * 0.74, 0.75, 0.3, 0, 0, 7); ctx.fill(); }
  ctx.lineCap = 'round';
  const n = chin ? 22 : 70;
  for (let i = 0; i < n; i++) {
    const t = ((i * 37) % 100) / 100, u = ((i * 61) % 100) / 100;
    const px = cx - w * 0.9 + t * w * 1.8 - (side && !chin ? R * 0.2 : 0), py = top + 0.4 + u * (bot - top - 0.4);
    ctx.strokeStyle = i % 3 === 0 ? light : i % 3 === 1 ? dark : c; ctx.lineWidth = 0.14;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + (px < cx ? -0.15 : 0.15), py + 0.4, px, py + 0.75); ctx.stroke();
  }
  ctx.lineCap = 'butt';
  ctx.restore();
}
function mustache(ctx, L, R, side) {
  const c = beardColor(L), dark = shade(c, -0.35);
  const cx = side ? -R * 0.82 : 0, y = R * 0.5;
  ctx.fillStyle = c;
  ctx.beginPath();
  if (side) { ctx.moveTo(cx - 0.3, y + 0.05); ctx.quadraticCurveTo(cx + 0.6, y - 0.4, cx + 1.4, y + 0.1); ctx.quadraticCurveTo(cx + 0.6, y + 0.45, cx - 0.3, y + 0.35); }
  else { ctx.moveTo(cx - 1.55, y + 0.65); ctx.quadraticCurveTo(cx - 1.1, y - 0.45, cx, y - 0.1); ctx.quadraticCurveTo(cx + 1.1, y - 0.45, cx + 1.55, y + 0.65); ctx.quadraticCurveTo(cx + 0.8, y + 0.32, cx, y + 0.42); ctx.quadraticCurveTo(cx - 0.8, y + 0.32, cx - 1.55, y + 0.65); }
  ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth = 0.1;
  for (let i = -1.3; i <= 1.3; i += 0.3) { if (side && i > 0.3) break; ctx.beginPath(); ctx.moveTo(cx + i, y - 0.1 + Math.abs(i) * 0.08); ctx.lineTo(cx + i * 1.08, y + 0.42); ctx.stroke(); }
}

function negritoMask(ctx, R, view) {
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, 0.2, 0, 0, R * 1.2); g.addColorStop(0, '#3a3a3e'); g.addColorStop(1, '#0d0d10');
  if (view === 1) { ctx.fillStyle = '#f2f2ee'; ctx.beginPath(); ctx.ellipse(0, R * 0.6, R * 1.05, R * 0.9, 0, 0, 7); ctx.fill(); return; }
  ctx.fillStyle = g;
  facePath(ctx, { jaw: 'oval', nose: 'straight' }, R, view); ctx.fill();
  ctx.strokeStyle = '#f4f2ea'; ctx.lineWidth = 0.32; ctx.lineCap = 'round';
  const eyes = view === 2 ? [-R * 0.55] : [-R * 0.42, R * 0.42];
  for (const ex of eyes) {
    ctx.beginPath(); ctx.ellipse(ex, 0, 0.9, 0.42, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = '#0b0b0d'; ctx.beginPath(); ctx.arc(ex, 0, 0.22, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ex - 1.1, -R * 0.38); ctx.lineTo(ex + 1.1, -R * 0.38); ctx.stroke();
  }
  ctx.beginPath(); if (view === 2) { ctx.moveTo(-R * 1, R * 0.6); ctx.lineTo(-R * 0.6, R * 0.6); } else { ctx.moveTo(-1.2, R * 0.6); ctx.lineTo(1.2, R * 0.6); ctx.moveTo(-1, R * 0.82); ctx.lineTo(1, R * 0.82); } ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#ecebe6'; for (let a = -0.3; a < Math.PI + 0.3; a += 0.25) { const x = Math.cos(a) * R * 1.05, y = R * 0.15 + Math.sin(a) * R * 1.0; if (view === 2 && x < -R * 0.4) continue; ctx.beginPath(); ctx.arc(x, y, 0.65, 0, 7); ctx.fill(); }
}

function hairTop(ctx, L, R, view, hc) {
  if (L.hat === 'sombrero' || L.hat === 'helmet' || L.hat === 'nochebuena') {
    if (L.hair !== 'bald' && L.hat !== 'nochebuena') { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(view === 2 ? R * 0.3 : 0, -R * 0.45, R * 0.98, R * 0.42, 0, 0, Math.PI); ctx.fill(); }
    return;
  }
  const h = L.hair, hcD = shade(hc, -0.28), hcL = shade(hc, 0.24);
  if (h === 'bald') {
    ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(view === 2 ? R * 0.35 : 0, 0.1, R * 1.02, R * 0.55, 0, Math.PI * 0.95, Math.PI * 2.05, true); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(-R * 0.3, -R * 0.75, R * 0.45, R * 0.22, -0.3, 0, 7); ctx.fill();
    return;
  }
  const g = ctx.createLinearGradient(-R, -R * 1.3, R, 0); g.addColorStop(0, hcL); g.addColorStop(0.5, hc); g.addColorStop(1, hcD);
  ctx.fillStyle = g;
  ctx.beginPath();
  if (view === 1) {
    ctx.ellipse(0, -R * 0.1, R * 1.06, R * 1.12, 0, 0, 7);
  } else if (view === 2) {
    const fr = h === 'buzz' || h === 'fade' ? -R * 0.7 : -R * 0.42;
    ctx.moveTo(R * 0.98, R * 0.35); ctx.bezierCurveTo(R * 1.15, -R * 1.25, -R * 0.75, -R * 1.42, -R * 0.88, fr);
    ctx.quadraticCurveTo(-R * 0.3, -R * 0.75, R * 0.05, -R * 0.55); ctx.quadraticCurveTo(R * 0.35, -R * 0.05, R * 0.55, R * 0.4); ctx.closePath();
  } else {
    const fr = h === 'buzz' || h === 'fade' ? -R * 0.78 : h === 'slick' ? -R * 0.7 : -R * 0.5;
    ctx.moveTo(-R * 1.03, R * 0.15);
    ctx.bezierCurveTo(-R * 1.2, -R * 1.45, R * 1.2, -R * 1.45, R * 1.03, R * 0.15);
    ctx.lineTo(R * 0.92, -R * 0.15); ctx.quadraticCurveTo(R * 0.45, fr - R * 0.1, 0, fr); ctx.quadraticCurveTo(-R * 0.55, fr + R * 0.12, -R * 0.92, -R * 0.15);
    ctx.closePath();
  }
  ctx.fill();
  if (view === 1 && (h === 'buzz' || h === 'fade')) { ctx.fillStyle = rgba(L.skin, 0.35); ctx.fillRect(-R, R * 0.4, R * 2, R * 0.6); }
  if (h === 'curly') {
    for (let i = 0; i < 26; i++) { const a = Math.PI + (i / 26) * Math.PI, rr = R * (0.95 + ((i * 7) % 3) * 0.06); ctx.fillStyle = i % 2 ? hc : hcD; ctx.beginPath(); ctx.arc(Math.cos(a) * rr * (view === 2 ? 0.95 : 1) + (view === 2 ? R * 0.1 : 0), -R * 0.25 + Math.sin(a) * rr * 0.95, 0.55, 0, 7); ctx.fill(); }
    ctx.strokeStyle = hcL; ctx.lineWidth = 0.12; for (let i = 0; i < 18; i++) { const x = ((i * 37) % 17 - 8) / 8 * R * 0.8, y = -R * (0.55 + ((i * 13) % 7) / 14); ctx.beginPath(); ctx.arc(x, y, 0.35, 0, 5); ctx.stroke(); }
  } else {
    ctx.strokeStyle = hcL; ctx.lineWidth = 0.16; ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * R * 0.24, -R * 1.05); ctx.quadraticCurveTo(i * R * 0.28 - R * 0.12, -R * 0.75, i * R * 0.3 - R * 0.05, -R * 0.42); ctx.stroke(); }
    ctx.strokeStyle = hcD; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * R * 0.24 + R * 0.12, -R * 1.0); ctx.quadraticCurveTo(i * R * 0.28, -R * 0.7, i * R * 0.3 + R * 0.08, -R * 0.45); ctx.stroke(); }
    ctx.lineCap = 'butt';
  }
  if (h === 'fade' && view !== 1) { ctx.fillStyle = rgba(L.skin, 0.4); ctx.fillRect(view === 2 ? R * 0.2 : -R * 1.05, -R * 0.2, view === 2 ? R * 0.8 : R * 0.3, R * 0.5); if (view === 0) ctx.fillRect(R * 0.75, -R * 0.2, R * 0.3, R * 0.5); }
  if (h === 'spiky') { ctx.fillStyle = hc; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * R * 0.28 - R * 0.16, -R * 0.95); ctx.lineTo(i * R * 0.28 + R * 0.05, -R * 1.42); ctx.lineTo(i * R * 0.28 + R * 0.18, -R * 0.95); ctx.fill(); } }
  if (h === 'bun') { ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(view === 2 ? R * 0.7 : 0, -R * 1.15, R * 0.48, 0, 7); ctx.fill(); ctx.fillStyle = hcL; ctx.beginPath(); ctx.arc((view === 2 ? R * 0.7 : 0) - R * 0.15, -R * 1.28, R * 0.15, 0, 7); ctx.fill(); }
  if (h === 'ponytail' && view !== 0) { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(view === 1 ? 0 : R * 1.05, R * 0.6, R * 0.32, R * 1.05, view === 1 ? 0 : -0.25, 0, 7); ctx.fill(); ctx.fillStyle = L.embroidery; ctx.fillRect((view === 1 ? 0 : R * 0.95) - 0.5, -R * 0.35, 1, 0.5); }
  if (h === 'braids') {
    for (const s of view === 2 ? [1] : [-1, 1]) {
      const bx = s * R * 0.85 + (view === 2 ? R * 0.2 : 0);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? hcD : hc; ctx.beginPath(); ctx.ellipse(bx, R * 0.35 + k * R * 0.38, R * 0.24, R * 0.22, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = L.embroidery; ctx.fillRect(bx - R * 0.22, R * 2.6, R * 0.44, R * 0.22);
    }
  }
  if (h === 'pigtails') for (const s of [-1, 1]) { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(s * R * 1.12, R * 0.15, R * 0.3, R * 0.55, 0, 0, 7); ctx.fill(); ctx.fillStyle = L.embroidery; ctx.fillRect(s * R * 1.12 - 0.4, -R * 0.42, 0.8, 0.45); }
  if ((h === 'long' || h === 'wavy') && view !== 1) {
    ctx.fillStyle = hc; ctx.fillRect(-R * 1.14, -R * 0.2, R * 0.3, R * 1.6); if (view === 0) ctx.fillRect(R * 0.84, -R * 0.2, R * 0.3, R * 1.6);
    if (h === 'wavy') { ctx.strokeStyle = hcL; ctx.lineWidth = 0.15; for (const x of [-R * 0.9, R * 0.85]) { ctx.beginPath(); for (let y = 0; y < R * 1.3; y += 0.5) ctx.lineTo(x + Math.sin(y * 2) * 0.2, y); ctx.stroke(); } }
  }
  if (h === 'short_f' && view !== 1) { ctx.fillStyle = hc; ctx.fillRect(-R * 1.12, -R * 0.2, R * 0.3, R * 0.8); if (view === 0) ctx.fillRect(R * 0.82, -R * 0.2, R * 0.3, R * 0.8); }
}

function hat(ctx, L, R, view) {
  if (!L.hat) return;
  const ox = view === 2 ? R * 0.15 : 0;
  if (L.hat === 'cap') {
    const c = L.capColor || '#c0392b';
    const g = ctx.createLinearGradient(-R, -R * 1.4, R, 0); g.addColorStop(0, shade(c, 0.18)); g.addColorStop(1, shade(c, -0.22));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(ox, -R * 0.42, R * 1.06, R * 0.95, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(ox - R * 1.06, -R * 0.48, R * 2.12, R * 0.22);
    ctx.fillStyle = shade(c, -0.25);
    if (view === 0) { ctx.beginPath(); ctx.ellipse(0, -R * 0.3, R * 0.8, R * 0.26, 0, 0, Math.PI); ctx.fill(); }
    else if (view === 2) { ctx.beginPath(); ctx.ellipse(-R * 1.0, -R * 0.38, R * 0.62, R * 0.17, 0, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = '#e8e8e8'; ctx.fillRect(-R * 0.2, -R * 0.46, R * 0.4, R * 0.14); }
    ctx.fillStyle = shade(c, -0.35); ctx.beginPath(); ctx.arc(ox, -R * 1.36, 0.35, 0, 7); ctx.fill();
  } else if (L.hat === 'sombrero' || L.hat === 'texana' || L.hat === 'panama') {
    const c = L.hatColor || '#e5cf98';
    const brim = L.hat === 'sombrero' ? R * 1.75 : L.hat === 'panama' ? R * 1.38 : R * 1.55;
    const by = -R * 0.38;
    ctx.fillStyle = shade(c, -0.22); ctx.beginPath(); ctx.ellipse(ox, by + 0.4, brim, R * 0.5, 0, 0, 7); ctx.fill();
    const gb = ctx.createLinearGradient(-brim, 0, brim, 0); gb.addColorStop(0, shade(c, 0.12)); gb.addColorStop(1, shade(c, -0.15));
    ctx.fillStyle = gb; ctx.beginPath(); ctx.ellipse(ox, by, brim, R * 0.44, 0, 0, 7); ctx.fill();
    if (L.hat === 'texana') { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(ox - brim + 0.5, by - 0.6, 0.9, 0.7, 0, 0, 7); ctx.ellipse(ox + brim - 0.5, by - 0.6, 0.9, 0.7, 0, 0, 7); ctx.fill(); }
    const ch = L.hat === 'panama' ? R * 0.88 : R * 1.05, cw = L.hat === 'panama' ? R * 0.82 : R * 0.72;
    const gc = ctx.createLinearGradient(-cw, 0, cw, 0); gc.addColorStop(0, shade(c, 0.1)); gc.addColorStop(1, shade(c, -0.2));
    ctx.fillStyle = gc; ctx.beginPath(); ctx.moveTo(ox - cw, by); ctx.lineTo(ox - cw * 0.9, by - ch); ctx.quadraticCurveTo(ox, by - ch - (L.hat === 'panama' ? -0.4 : 0.6), ox + cw * 0.9, by - ch); ctx.lineTo(ox + cw, by); ctx.closePath(); ctx.fill();
    if (L.hat === 'panama') { ctx.strokeStyle = shade(c, -0.25); ctx.lineWidth = 0.18; ctx.beginPath(); ctx.moveTo(ox - cw * 0.4, by - ch); ctx.lineTo(ox, by - ch + 0.6); ctx.lineTo(ox + cw * 0.4, by - ch); ctx.stroke(); }
    ctx.fillStyle = L.hat === 'panama' ? '#1b1b1d' : shade(c, -0.38); ctx.fillRect(ox - cw, by - R * 0.36, cw * 2, R * 0.24);
    if (L.hat === 'sombrero') { ctx.strokeStyle = rgba(shade(c, -0.35), 0.45); ctx.lineWidth = 0.14; for (let a = 0; a < 18; a++) { const an = (a / 18) * 6.283; ctx.beginPath(); ctx.moveTo(ox + Math.cos(an) * cw, by + Math.sin(an) * R * 0.2); ctx.lineTo(ox + Math.cos(an) * brim, by + Math.sin(an) * R * 0.42); ctx.stroke(); } }
  } else if (L.hat === 'helmet') {
    const c = L.helmetColor || '#f2c230';
    const g = ctx.createLinearGradient(-R, -R * 1.5, R, 0); g.addColorStop(0, shade(c, 0.3)); g.addColorStop(1, shade(c, -0.25));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox - R * 1.15, -R * 0.2); ctx.bezierCurveTo(ox - R * 1.25, -R * 1.6, ox + R * 1.4, -R * 1.5, ox + R * 1.2, -R * 0.15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1b1b1d'; for (const x of [-0.5, 0, 0.5]) ctx.fillRect(ox + x * R - 0.3, -R * 1.25, 0.6, R * 0.7);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 0.18; ctx.beginPath(); ctx.moveTo(ox - R * 0.9, -R * 0.2); ctx.lineTo(ox - R * 0.6, R * 0.9); ctx.stroke();
    if (view !== 1) { ctx.fillStyle = 'rgba(30,30,35,0.85)'; roundRect(ctx, view === 2 ? -R * 1.05 : -R * 0.85, -R * 0.2, view === 2 ? R * 0.6 : R * 1.7, R * 0.38, 0.3); ctx.fill(); }
  } else if (L.hat === 'nochebuena') {
    ctx.fillStyle = '#ecebe6'; ctx.beginPath(); ctx.ellipse(ox, -R * 0.65, R * 1.1, R * 0.7, 0, Math.PI, 0); ctx.fill();
    for (let i = 0; i < 22; i++) {
      const a = Math.PI + (i / 21) * Math.PI, rr = R * (1.05 + (i % 3) * 0.12);
      const x = ox + Math.cos(a) * rr * 1.05, y = -R * 1.05 + Math.sin(a) * rr * 0.75;
      ctx.fillStyle = i % 2 ? '#d01f24' : '#a81419'; ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -0.9, 0.55, 1.4, 0, 0, 7); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#e83a3a'; ctx.beginPath(); ctx.ellipse(ox, -R * 1.65, R * 0.8, R * 0.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4c8a3a'; ctx.beginPath(); ctx.ellipse(ox + R * 0.6, -R * 1.85, 0.8, 0.35, 0.4, 0, 7); ctx.fill();
  }
}

// Bust portrait for the dialogue box and the people tab: head and shoulders, big and centred.
export function drawPortrait(ctx, look, size, frame = 'idle') {
  const L = { ...look, body: 1 };
  const P = frameOf(L);
  const k = size / (P.headR * 5.4);
  ctx.save();
  ctx.translate(size / 2, size * 0.47);
  ctx.scale(k, k);
  ctx.translate(0, -P.headC - (look.hat === 'sombrero' || look.hat === 'texana' || look.hat === 'nochebuena' ? -0.8 : 0) + 0.6);
  const C = { L, P, dir: 0, side: false, frame, walking: false, ph: 0, sit: false, ride: false, hurt: frame === 'hurt', dance: false, skin: look.enchilado ? mix(look.skin, '#e0463a', 0.3) : look.skin };
  const topC = L.topColor;
  for (const s of [-1, 1]) limb(ctx, s * (P.sw + 0.2), P.shoulder + 1.2, s * (P.sw + 0.9), P.shoulder + 1.2 + P.upper, P.armW * 1.05, P.armW * 0.9, topC, false);
  torso(ctx, L, P, false, topC, C.skin, false);
  neck(ctx, P, C.skin);
  head(ctx, L, P, 0, C);
  ctx.restore();
}

// Animals ---------------------------------------------------------------
export function drawCow(ctx, kind, dir, frame, t = 0) {
  const base = kind === 'negra' ? '#262322' : kind === 'cafe' ? '#7a4a2a' : '#f3efe6';
  const spot = kind === 'pinta' ? '#1f1c1b' : kind === 'cafe' ? '#f3efe6' : '#3a3634';
  ctx.save();
  if (dir === 3) ctx.scale(-1, 1);
  const sg = ctx.createRadialGradient(0, 0, 1, 0, 0, 16); sg.addColorStop(0, 'rgba(18,18,30,0.38)'); sg.addColorStop(1, 'rgba(18,18,30,0)');
  ctx.save(); ctx.scale(1, 0.28); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill(); ctx.restore();
  const step = typeof frame === 'number' ? [0, 1, 0, -1][frame] : 0;
  for (const [lx, o] of [[-9, step], [-5, -step], [6, -step], [10, step]]) { ctx.fillStyle = shade(base, -0.2); ctx.fillRect(lx - 1.1, -9, 2.2, 9 - Math.max(0, o)); ctx.fillStyle = '#2b2118'; ctx.fillRect(lx - 1.2, -1.2 - Math.max(0, o), 2.4, 1.2); }
  const g = ctx.createLinearGradient(0, -19, 0, -7); g.addColorStop(0, shade(base, 0.15)); g.addColorStop(1, shade(base, -0.25));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -13, 13.5, 6.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = spot;
  if (kind === 'pinta') { ctx.beginPath(); ctx.ellipse(-4, -15, 4, 3, 0.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(5, -12, 3.2, 2.4, -0.3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(-9, -11, 2, 1.8, 0, 0, 7); ctx.fill(); }
  if (kind === 'cafe') { ctx.beginPath(); ctx.ellipse(2, -9, 6, 1.6, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#e8a7a0'; ctx.beginPath(); ctx.ellipse(4, -7.4, 2.6, 1.6, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = shade(base, -0.2); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(13, -16); ctx.quadraticCurveTo(15 + Math.sin(t * 3) * 1.5, -10, 14 + Math.sin(t * 3) * 2, -6); ctx.stroke();
  ctx.fillStyle = '#2b2118'; ctx.beginPath(); ctx.ellipse(14 + Math.sin(t * 3) * 2, -5.5, 0.9, 1.4, 0, 0, 7); ctx.fill();
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

// Street dogs: lean, short-haired, ears up or floppy, sometimes a limp; they can lie, drink and sit.
export function drawDog(ctx, color, dir, frame, t = 0, opts = {}) {
  ctx.save(); if (dir === 3) ctx.scale(-1, 1);
  const sg = ctx.createRadialGradient(0, 0, 0.5, 0, 0, 8); sg.addColorStop(0, 'rgba(18,18,30,0.36)'); sg.addColorStop(1, 'rgba(18,18,30,0)');
  ctx.save(); ctx.scale(1, 0.3); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill(); ctx.restore();
  const dark = shade(color, -0.28), light = shade(color, 0.18);
  const pose = opts.pose || (typeof frame === 'number' ? 'walk' : 'stand');
  if (pose === 'lie' || opts.down) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, -2.4, 6.6, 2.6, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-6.6, -3.2, 2.4, 2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(-5.8, -4.8, 0.9, 1.4, 0.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-8.6, -2.8, 0.45, 0, 7); ctx.fill();
    ctx.strokeStyle = '#1b1612'; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.moveTo(-7.4, -3.6); ctx.lineTo(-6.6, -3.6); ctx.stroke();
    ctx.fillStyle = dark; ctx.fillRect(-8.4, -1.2, 4, 0.9); ctx.fillRect(2, -1.2, 4, 0.9);
    ctx.strokeStyle = color; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(6.2, -2.6); ctx.quadraticCurveTo(8.5, -1.6, 9, -0.6); ctx.stroke();
    ctx.restore(); return;
  }
  const step = typeof frame === 'number' ? [0, 1, 0, -1][frame] : 0;
  const lower = pose === 'drink' || pose === 'eat' ? 2.4 : 0;
  for (const [lx, o, back] of [[-4.2, step, false], [-2.4, -step, true], [3.4, -step, true], [5, step, false]]) {
    ctx.fillStyle = back ? dark : shade(color, -0.12);
    const len = 5 - Math.max(0, o) * 0.9 - (opts.limp && lx === -4.2 ? 1.2 : 0);
    ctx.fillRect(lx - 0.55, -5, 1.1, len); ctx.fillStyle = shade(color, -0.35); ctx.fillRect(lx - 0.7, -5 + len - 0.5, 1.4, 0.6);
  }
  const g = ctx.createLinearGradient(0, -9, 0, -4); g.addColorStop(0, light); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-5, -8.4); ctx.quadraticCurveTo(0, -9.6, 5.6, -8); ctx.quadraticCurveTo(6.8, -5.6, 5, -4.6); ctx.quadraticCurveTo(0, -5.4, -4.4, -4.8); ctx.quadraticCurveTo(-6, -6.4, -5, -8.4); ctx.fill();
  if (!opts.fed) { ctx.strokeStyle = rgba(dark, 0.55); ctx.lineWidth = 0.18; for (let i = -3; i < 4; i += 1.4) { ctx.beginPath(); ctx.moveTo(i, -8.2); ctx.quadraticCurveTo(i + 0.3, -6.8, i, -5.4); ctx.stroke(); } }
  if (opts.spot) { ctx.fillStyle = opts.spot; ctx.beginPath(); ctx.ellipse(1.2, -7.4, 2.4, 1.4, 0.2, 0, 7); ctx.fill(); }
  const hx = -7, hy = -9.6 + lower;
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-4.4, -8.6); ctx.lineTo(hx + 0.8, hy - 0.4); ctx.lineTo(hx + 1.6, hy + 2.2); ctx.lineTo(-3.8, -5.6); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx, hy, 2.3, 1.95, 0, 0, 7); ctx.fill();
  ctx.fillStyle = shade(color, 0.05); ctx.beginPath(); ctx.ellipse(hx - 2, hy + 0.7, 1.5, 0.95, 0.15, 0, 7); ctx.fill();
  ctx.fillStyle = '#141110'; ctx.beginPath(); ctx.arc(hx - 3.4, hy + 0.5, 0.45, 0, 7); ctx.fill();
  ctx.fillStyle = '#141110'; ctx.beginPath(); ctx.arc(hx - 0.8, hy - 0.5, 0.36, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx - 0.9, hy - 0.6, 0.12, 0, 7); ctx.fill();
  ctx.fillStyle = dark;
  if (opts.floppy) { ctx.beginPath(); ctx.ellipse(hx + 1, hy + 0.4, 0.8, 1.6, 0.3, 0, 7); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(hx + 0.2, hy - 1.4); ctx.lineTo(hx + 0.9, hy - 3.6); ctx.lineTo(hx + 1.7, hy - 1.2); ctx.fill(); }
  if (pose === 'drink') { ctx.fillStyle = '#e88a8a'; ctx.fillRect(hx - 3.2, hy + 1.2, 0.8, 0.9); }
  if (opts.pant) { ctx.fillStyle = '#e88a8a'; ctx.fillRect(hx - 2.6, hy + 1.3, 0.6, 1.1); }
  ctx.strokeStyle = color; ctx.lineWidth = 0.8; ctx.lineCap = 'round'; const wag = opts.happy ? Math.sin(t * 16) * 2 : Math.sin(t * 4) * 0.8;
  ctx.beginPath(); ctx.moveTo(5.4, -7.6); ctx.quadraticCurveTo(7.6, -9 + wag, 8.2, -10.4 + wag * 1.2); ctx.stroke(); ctx.lineCap = 'butt';
  if (opts.collar) { ctx.strokeStyle = opts.collar; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-4.8, -8.8); ctx.lineTo(-4.2, -5.8); ctx.stroke(); }
  ctx.restore();
}

export function drawBird(ctx, t, flying) {
  ctx.fillStyle = 'rgba(20,20,35,0.2)'; if (!flying) { ctx.beginPath(); ctx.ellipse(0, 0, 2.4, 0.8, 0, 0, 7); ctx.fill(); }
  const g = ctx.createLinearGradient(0, -4, 0, -1); g.addColorStop(0, '#a3a6b0'); g.addColorStop(1, '#6f727c');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -2.4, 2.4, 1.6, 0, 0, 7); ctx.fill();
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
