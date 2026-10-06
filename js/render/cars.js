// Vehicles of the Ciénega, drawn in the same 3/4 view as the town: painted bodies with reflections,
// glass that mirrors the sky, real wheels with rims, lights and trim. Each model keeps the proportions
// of the car people actually drive around Jiquilpan: Tsurus and Versas, Marchs, the old Vocho, Toyota
// and Chevrolet pickups, the route combis, a rare Chinese or Japanese electric and, once in a long
// while, a Porsche. Images are cached per model / colour / direction / damage.
import { makeCanvas, shade, rgba, mix, roundRect } from '../util.js';

let SCALE = 3;
const cache = new Map();
export function setCarScale(s) { if (s !== SCALE) { SCALE = s; cache.clear(); } }

// L length, H body height (sill to beltline), clear ground clearance, wr wheel radius, wb wheel x,
// cab [rear, front] of the roof, roof height, rake of the pillars, W width (top view), round corner.
export const MODELS = {
  tsuru: { name: 'Nissan Tsuru', L: 30, H: 7.6, clear: 2.4, wr: 3.1, wb: [-9.6, 9.4], cab: [-7.5, 5.5], roof: 15.4, rake: [3.4, 4.6], W: 14.4, r: 1.6 },
  versa: { name: 'Nissan Versa', L: 31, H: 8, clear: 2.5, wr: 3.3, wb: [-10, 10], cab: [-7.5, 4.5], roof: 16, rake: [4.4, 6.2], W: 15, r: 2.6 },
  march: { name: 'Nissan March', L: 25.5, H: 8.2, clear: 2.5, wr: 3.1, wb: [-8.4, 8.2], cab: [-9.6, 3.4], roof: 16.6, rake: [1.4, 6], W: 14.4, r: 3, hatch: true },
  aveo: { name: 'Chevrolet Aveo', L: 29, H: 8, clear: 2.4, wr: 3.1, wb: [-9.4, 9.2], cab: [-7, 4.6], roof: 15.8, rake: [4, 5.6], W: 14.6, r: 2.2 },
  corolla: { name: 'Toyota Corolla', L: 31, H: 8, clear: 2.5, wr: 3.3, wb: [-10, 10], cab: [-7.2, 4.4], roof: 15.8, rake: [4.6, 6.4], W: 15, r: 2.6 },
  vocho: { name: 'Volkswagen Sedán', L: 25, H: 7, clear: 2.8, wr: 3, wb: [-8.4, 7.4], cab: [-6.5, 3.5], roof: 16, rake: [5, 4], W: 13.6, r: 5, beetle: true },
  leaf: { name: 'Nissan Leaf (eléctrico)', L: 28, H: 8.2, clear: 2.3, wr: 3.2, wb: [-9.4, 9.2], cab: [-9, 3.6], roof: 16.2, rake: [2.4, 6.6], W: 15, r: 3, hatch: true, ev: true },
  byd: { name: 'BYD Dolphin (eléctrico)', L: 27, H: 8.4, clear: 2.3, wr: 3.3, wb: [-9.2, 9], cab: [-8.6, 3.8], roof: 16.6, rake: [2.2, 6.8], W: 15, r: 3.4, hatch: true, ev: true },
  porsche: { name: 'Porsche 911', L: 28.5, H: 6.4, clear: 1.8, wr: 3.4, wb: [-9.2, 9.6], cab: [-6, 2.2], roof: 13.8, rake: [9, 6], W: 15.6, r: 4, porsche: true },
  tacoma: { name: 'Toyota pickup', L: 33, H: 8.6, clear: 3.4, wr: 3.5, wb: [-10.6, 10.4], cab: [-3.4, 5], roof: 18.4, rake: [0.4, 4], W: 15, r: 1.4, pickup: true },
  cheyenne: { name: 'Chevrolet pickup', L: 35, H: 9.2, clear: 3.6, wr: 3.7, wb: [-11.6, 11.2], cab: [-3, 5.6], roof: 19.4, rake: [0.4, 3.6], W: 16, r: 1.4, pickup: true },
  combi: { name: 'Combi', L: 32, H: 12, clear: 2.8, wr: 3.2, wb: [-10.6, 10], cab: [-15, 12], roof: 23.4, rake: [0.6, 2.4], W: 15.6, r: 2.4, van: true },
  ambulancia: { name: 'Ambulancia', L: 34, H: 12.4, clear: 3, wr: 3.4, wb: [-11, 10.4], cab: [-16, 12.4], roof: 25.6, rake: [0.2, 2.6], W: 16, r: 2, van: true },
  patrulla: { name: 'Patrulla', L: 34, H: 8.8, clear: 3.6, wr: 3.6, wb: [-11, 10.8], cab: [-4, 4.6], roof: 18.8, rake: [0.6, 4.2], W: 15.6, r: 1.4, pickup: true, crewcab: true },
};

// Colours seen on Mexican streets (lots of white, silver, grey, red, black; some strong ones)
export const PAINTS = ['#e9e9e6', '#f4f4f1', '#c3c7cc', '#9ea3a8', '#5b6066', '#2a2c30', '#b3201f', '#8a1c24', '#1f3f6f', '#2f5d8a', '#3e6b48', '#d8c79a', '#c9a227', '#7a4a2b'];

export function carSpec(model, color, opts = {}) { return { model, color, ...opts }; }

// dir: 'E','W' (side), 'N','S' (top with the visible end). Returns a cached canvas (w, up, down set).
export function carImage(spec, dir) {
  const dmg = Math.min(3, Math.floor((spec.damage || 0) / 26));
  const key = [spec.model, spec.color, dir, dmg, spec.taxi ? 1 : 0, spec.route || '', spec.text || '', spec.num || ''].join('|');
  let c = cache.get(key);
  if (c) return c;
  const M = MODELS[spec.model] || MODELS.tsuru;
  const side = dir === 'E' || dir === 'W';
  const w = side ? M.L + 10 : M.W + 10, up = side ? M.roof + 10 : M.L / 2 + 16, down = side ? 6 : M.L / 2 + 8;
  c = makeCanvas(Math.ceil(w * SCALE), Math.ceil((up + down) * SCALE));
  const ctx = c.getContext('2d');
  ctx.scale(SCALE, SCALE); ctx.translate(w / 2, up);
  if (side) { if (dir === 'W') ctx.scale(-1, 1); drawSide(ctx, M, spec, dmg); }
  else drawTop(ctx, M, spec, dir === 'S', dmg);
  c.w = w; c.up = up; c.down = down;
  cache.set(key, c);
  if (cache.size > 220) { const k = cache.keys().next().value; cache.delete(k); }
  return c;
}

export function drawCar(ctx, spec, dir) {
  const img = carImage(spec, dir);
  ctx.drawImage(img, -img.w / 2, -img.up, img.w, img.up + img.down);
}

// ---------------------------------------------------------------------------------------------
function paintGrad(ctx, y0, y1, color, dark = 0.34) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shade(color, 0.22)); g.addColorStop(0.35, shade(color, 0.06)); g.addColorStop(0.55, color); g.addColorStop(1, shade(color, -dark));
  return g;
}
function glassGrad(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#a9c2d2'); g.addColorStop(0.45, '#4f6676'); g.addColorStop(1, '#1d2a33');
  return g;
}
function wheel(ctx, x, r, M) {
  ctx.fillStyle = '#121214'; ctx.beginPath(); ctx.arc(x, -r, r, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.25, -r - r * 0.25, 0.2, x, -r, r * 0.62);
  g.addColorStop(0, '#f2f3f4'); g.addColorStop(1, M.porsche ? '#6f7377' : '#8d9298');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, -r, r * 0.58, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(40,40,45,0.7)'; ctx.lineWidth = 0.28;
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.16, -r + Math.sin(a) * r * 0.16); ctx.lineTo(x + Math.cos(a) * r * 0.54, -r + Math.sin(a) * r * 0.54); ctx.stroke(); }
  ctx.fillStyle = '#3a3d41'; ctx.beginPath(); ctx.arc(x, -r, r * 0.14, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.arc(x, -r, r * 0.88, 3.6, 4.8); ctx.stroke();
}

// Side view, front of the car toward +x.
function drawSide(ctx, M, spec, dmg) {
  const color = spec.color, L = M.L, x0 = -L / 2, x1 = L / 2;
  const sill = -M.clear, belt = -(M.clear + M.H), roofY = -M.roof;
  const [c0, c1] = M.cab, [rk0, rk1] = M.rake;
  // contact shadow
  const sg = ctx.createRadialGradient(0, 0, 1, 0, 0, L * 0.62);
  sg.addColorStop(0, 'rgba(15,15,25,0.45)'); sg.addColorStop(1, 'rgba(15,15,25,0)');
  ctx.save(); ctx.scale(1, 0.18); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(1, 2, L * 0.62, 0, 7); ctx.fill(); ctx.restore();
  // tyres behind the body
  for (const wx of M.wb) wheel(ctx, wx, M.wr, M);
  // ---- body (lower) with wheel arches
  ctx.save();
  ctx.beginPath();
  if (M.beetle) {
    ctx.moveTo(x0 + 1, sill); ctx.quadraticCurveTo(x0 - 0.6, belt + 1, x0 + 4, belt - 0.6);
    ctx.lineTo(x1 - 6, belt + 0.4); ctx.quadraticCurveTo(x1 + 0.4, belt + 1.6, x1, sill); ctx.closePath();
  } else if (M.porsche) {
    ctx.moveTo(x0 + 0.8, sill); ctx.quadraticCurveTo(x0 - 0.4, belt + 1.4, x0 + 5, belt); ctx.lineTo(x1 - 7, belt + 0.6);
    ctx.quadraticCurveTo(x1, belt + 1.6, x1, sill - 0.6); ctx.closePath();
  } else {
    roundRect(ctx, x0, belt, L, sill - belt, M.r);
  }
  ctx.fillStyle = paintGrad(ctx, belt, sill, color); ctx.fill();
  ctx.restore();
  // arches (the tyres show through)
  for (const wx of M.wb) {
    ctx.fillStyle = '#18191b'; ctx.beginPath(); ctx.arc(wx, -M.wr, M.wr + 0.9, Math.PI, 0); ctx.lineTo(wx + M.wr + 0.9, sill + 0.01); ctx.lineTo(wx - M.wr - 0.9, sill + 0.01); ctx.fill();
    wheel(ctx, wx, M.wr, M);
    ctx.strokeStyle = shade(color, -0.45); ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(wx, -M.wr, M.wr + 1, Math.PI * 1.02, -0.02); ctx.stroke();
  }
  // pickup bed (open box behind the cab)
  if (M.pickup && !M.crewcab) {
    ctx.fillStyle = shade(color, -0.5); ctx.fillRect(x0 + 1, belt - 1.6, c0 - rk0 - x0 - 1.6, 1.8);
    ctx.fillStyle = shade(color, 0.18); ctx.fillRect(x0 + 0.6, belt - 0.4, c0 - rk0 - x0 - 1, 0.6);
  }
  // ---- greenhouse
  const ga = c0 - rk0, gb = c1 + rk1;
  ctx.beginPath();
  if (M.beetle) { ctx.moveTo(ga - 2, belt); ctx.bezierCurveTo(ga, roofY - 1, gb - 4, roofY - 1, gb + 1, belt); ctx.closePath(); }
  else if (M.porsche) { ctx.moveTo(ga - 3, belt); ctx.bezierCurveTo(c0 - 3, roofY - 0.6, c1 - 1, roofY - 0.6, gb, belt); ctx.closePath(); }
  else { ctx.moveTo(ga, belt); ctx.lineTo(c0, roofY + (M.hatch ? 0.4 : 0)); ctx.lineTo(c1, roofY); ctx.lineTo(gb, belt); ctx.closePath(); }
  ctx.fillStyle = paintGrad(ctx, roofY, belt, color, 0.15); ctx.fill();
  // windows (inset), with a pillar between front and rear doors
  ctx.save(); ctx.clip();
  const inset = 1;
  ctx.beginPath();
  ctx.moveTo(ga + 1.6, belt - 0.4); ctx.lineTo(c0 + 0.8, roofY + inset + 0.2); ctx.lineTo(c1 - 0.6, roofY + inset); ctx.lineTo(gb - 1.8, belt - 0.4); ctx.closePath();
  ctx.fillStyle = glassGrad(ctx, roofY, belt); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(c0 + 2, roofY + 1.4); ctx.lineTo(c0 + 4.4, roofY + 1.4); ctx.lineTo(c0 + 0.6, belt - 0.6); ctx.lineTo(c0 - 1.8, belt - 0.6); ctx.fill();
  if (!M.van || M.L < 34) { const px = M.van ? c1 - 9 : (c0 + c1) / 2 + 0.4; ctx.fillStyle = shade(color, -0.25); ctx.fillRect(px - 0.6, roofY, 1.2, belt - roofY); }
  if (M.van) for (const px of [c0 + 6, c0 + 13]) { ctx.fillStyle = shade(color, -0.2); ctx.fillRect(px - 0.6, roofY, 1.2, belt - roofY); }
  if (spec.model === 'ambulancia') { ctx.fillStyle = paintGrad(ctx, roofY, belt, color, 0.12); ctx.fillRect(c0 - 2, roofY - 1, c1 - 8 - c0, belt - roofY + 1); }
  ctx.restore();
  // roof top seen from above (3/4 view)
  ctx.fillStyle = shade(color, 0.28);
  ctx.beginPath(); ctx.moveTo(c0 + 0.6, roofY); ctx.lineTo(c1 - 0.6, roofY); ctx.lineTo(c1 - 1.6, roofY - 1.6); ctx.lineTo(c0 + 1.6, roofY - 1.6); ctx.closePath(); ctx.fill();
  // hood and trunk tops
  ctx.fillStyle = shade(color, 0.2);
  ctx.beginPath(); ctx.moveTo(gb, belt); ctx.lineTo(x1 - M.r, belt); ctx.lineTo(x1 - M.r - 1, belt - 1.2); ctx.lineTo(gb - 0.4, belt - 1.2); ctx.fill();
  if (!M.van && !M.pickup) { ctx.beginPath(); ctx.moveTo(x0 + M.r, belt); ctx.lineTo(ga, belt); ctx.lineTo(ga + 0.4, belt - 1.2); ctx.lineTo(x0 + M.r + 1, belt - 1.2); ctx.fill(); }
  // shoulder highlight and lower crease
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.45;
  ctx.beginPath(); ctx.moveTo(x0 + 2, belt + 1.2); ctx.lineTo(x1 - 2, belt + 1.2); ctx.stroke();
  ctx.strokeStyle = rgba(shade(color, -0.4), 0.6); ctx.lineWidth = 0.3;
  ctx.beginPath(); ctx.moveTo(x0 + 2, sill - 1.6); ctx.lineTo(x1 - 2, sill - 1.6); ctx.stroke();
  // door seams and handles
  const doors = M.van ? [c1 - 9, c1 - 1] : M.pickup && !M.crewcab ? [c0 - rk0 + 0.2, c1 + 0.6] : [c0 - 1.4, (c0 + c1) / 2 + 0.4, c1 + 1.2];
  ctx.strokeStyle = rgba(shade(color, -0.5), 0.8); ctx.lineWidth = 0.28;
  for (const dx of doors) { ctx.beginPath(); ctx.moveTo(dx, belt + 0.3); ctx.lineTo(dx, sill - 0.6); ctx.stroke(); }
  ctx.fillStyle = 'rgba(30,30,30,0.6)'; for (let i = 0; i < doors.length - 1; i++) ctx.fillRect(doors[i + 1] - 2.6, belt + 2, 1.6, 0.5);
  // mirror
  ctx.fillStyle = M.porsche ? color : '#1d1e20'; ctx.fillRect(c1 + 0.2, belt - 2.2, 1.6, 1.4);
  // lights, bumpers
  ctx.fillStyle = '#2a2b2e'; roundRect(ctx, x1 - 1.4, sill - 3.2, 1.8, 2.6, 0.6); ctx.fill(); roundRect(ctx, x0 - 0.4, sill - 3.2, 1.8, 2.6, 0.6); ctx.fill();
  const hl = ctx.createLinearGradient(x1 - 3, 0, x1, 0); hl.addColorStop(0, '#fff8d8'); hl.addColorStop(1, '#ffffff');
  ctx.fillStyle = hl; ctx.beginPath(); ctx.ellipse(x1 - 1.4, belt + 1.8, M.porsche ? 1.3 : 1.6, 1.1, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8a33a'; ctx.fillRect(x1 - 1.2, belt + 3.2, 1, 0.8);
  ctx.fillStyle = '#c8261f'; ctx.fillRect(x0 - 0.2, belt + 0.8, 1.6, 2.2);
  ctx.fillStyle = '#ff6a5c'; ctx.fillRect(x0 + 0.2, belt + 1.1, 0.6, 0.8);
  if (!M.ev) { ctx.fillStyle = '#4b4d50'; ctx.fillRect(x0 - 0.8, sill - 0.8, 2, 0.8); }
  // body-specific trim
  if (M.porsche) { ctx.fillStyle = '#1a1a1c'; ctx.fillRect(x0 + 2, belt - 0.8, 4, 0.8); }
  if (M.ev) { ctx.fillStyle = '#3aa0e6'; ctx.fillRect(c1 + 3.2, belt + 2.2, 1.6, 0.6); }
  if (M.beetle) { ctx.fillStyle = shade(color, -0.2); for (const wx of M.wb) { ctx.beginPath(); ctx.ellipse(wx, belt + 1.4, M.wr + 1.6, 2.2, 0, Math.PI, 0); ctx.fill(); } }
  // liveries
  if (spec.taxi) {
    ctx.fillStyle = '#1b7a3e'; ctx.fillRect(x0 + 1, sill - 2.8, L - 2, 1.1);
    ctx.fillStyle = '#fff'; roundRect(ctx, (c0 + c1) / 2 - 3.2, roofY - 3.6, 6.4, 2.2, 0.6); ctx.fill();
    ctx.strokeStyle = '#1b7a3e'; ctx.lineWidth = 0.25; ctx.stroke();
    label(ctx, 'TAXI', (c0 + c1) / 2, roofY - 2.5, 1.5, '#1b5e20');
    label(ctx, spec.num || '07', (c0 + c1) / 2 + 0.4, belt + 3.6, 1.8, '#1b5e20');
  }
  if (M.van && spec.route) { // combi: route band and name board
    const rc = spec.route === 'verde' ? '#ffffff' : spec.route === 'amarilla' ? '#1b1b1b' : '#ffffff';
    ctx.fillStyle = rgba(rc, 0.85); ctx.fillRect(x0 + 1, belt + 3, L - 2, 1.1);
    label(ctx, spec.text || 'RUTA', 0, belt + 5.6, 2, rc);
    ctx.fillStyle = '#f2f2ec'; ctx.fillRect(x0 + 1, roofY - 1.6, L - 2, 1.4);
  }
  if (spec.model === 'ambulancia') {
    ctx.fillStyle = '#d42a2a'; ctx.fillRect(x0 + 1, belt + 2.2, L - 2, 1.6);
    label(ctx, 'AMBULANCIA', -3, belt + 5.4, 2, '#d42a2a');
    ctx.fillStyle = '#d42a2a'; ctx.fillRect(-9.6, roofY + 4, 3.6, 1.2); ctx.fillRect(-8.4, roofY + 2.8, 1.2, 3.6);
    lightbar(ctx, (c0 + c1) / 2 + 6, roofY - 1.8, 7);
  }
  if (spec.model === 'patrulla') {
    ctx.fillStyle = '#1f3f8f'; ctx.fillRect(c0 - 2, belt + 0.8, c1 - c0 + 4, sill - belt - 2);
    label(ctx, 'POLICÍA', (c0 + c1) / 2, belt + 4.4, 2.1, '#ffffff');
    lightbar(ctx, (c0 + c1) / 2, roofY - 1.8, 7);
  }
  damageSide(ctx, M, dmg, belt, sill, roofY);
}

function lightbar(ctx, x, y, w) {
  ctx.fillStyle = '#26282b'; ctx.fillRect(x - w / 2, y + 0.6, w, 0.8);
  ctx.fillStyle = '#d4262a'; roundRect(ctx, x - w / 2, y - 0.8, w / 2, 1.5, 0.5); ctx.fill();
  ctx.fillStyle = '#2257d4'; roundRect(ctx, x, y - 0.8, w / 2, 1.5, 0.5); ctx.fill();
}
function label(ctx, str, x, y, size, color) {
  ctx.font = `bold ${size}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(str, x, y);
}
function damageSide(ctx, M, dmg, belt, sill, roofY) {
  if (!dmg) return;
  ctx.fillStyle = 'rgba(30,25,20,0.35)';
  for (let i = 0; i < dmg * 2; i++) { const x = (-0.4 + ((i * 37) % 10) / 12) * M.L, y = belt + 1 + ((i * 13) % 5); ctx.beginPath(); ctx.ellipse(x, y, 1.6 + dmg * 0.4, 0.9, 0.3, 0, 7); ctx.fill(); }
  ctx.strokeStyle = 'rgba(240,240,240,0.55)'; ctx.lineWidth = 0.25;
  for (let i = 0; i < dmg * 3; i++) { const x = (-0.45 + ((i * 29) % 11) / 12) * M.L, y = belt + 2 + ((i * 7) % 4); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 0.6); ctx.stroke(); }
  if (dmg >= 2) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.22; const cx = M.cab[1] + 1.4, cy = (roofY + belt) / 2; for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 3, cy + Math.sin(a * 1.7) * 3); ctx.stroke(); } }
  if (dmg >= 3) { ctx.fillStyle = '#1a1a1a'; ctx.fillRect(M.L / 2 - 2, sill - 3.4, 2.4, 2.8); }
}

// Top view (the car runs north–south); `front` = the front faces the camera (driving south).
function drawTop(ctx, M, spec, front, dmg) {
  const color = spec.color, L = M.L, W = M.W, hw = W / 2;
  const yTop = -L / 2 - 2, yBot = L / 2 - 2; // body extent on the ground
  const f = front ? 1 : -1; // +1: the front is at the bottom (toward the camera)
  const sg = ctx.createRadialGradient(0, 1, 1, 0, 1, L * 0.62);
  sg.addColorStop(0, 'rgba(15,15,25,0.42)'); sg.addColorStop(1, 'rgba(15,15,25,0)');
  ctx.save(); ctx.scale(0.62, 1); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 1, L * 0.6, 0, 7); ctx.fill(); ctx.restore();
  // tyres peeking at the sides
  ctx.fillStyle = '#121214';
  for (const wy of M.wb) { const y = -2 + wy * f; ctx.fillRect(-hw - 0.6, y - M.wr * 0.9, 1.6, M.wr * 1.8); ctx.fillRect(hw - 1, y - M.wr * 0.9, 1.6, M.wr * 1.8); }
  // body
  const g = ctx.createLinearGradient(-hw, 0, hw, 0);
  g.addColorStop(0, shade(color, 0.2)); g.addColorStop(0.35, shade(color, 0.05)); g.addColorStop(0.75, color); g.addColorStop(1, shade(color, -0.32));
  ctx.fillStyle = g; roundRect(ctx, -hw, yTop, W, L, M.beetle ? 6 : M.r + 1.4); ctx.fill();
  // cabin: windshield toward the front, roof, rear glass
  const cabFront = -2 + (M.cab[1] + M.rake[1] * 0.6) * f, cabRear = -2 + (M.cab[0] - M.rake[0] * 0.6) * f;
  const rf = -2 + M.cab[1] * f, rr = -2 + M.cab[0] * f;
  const glass = (ya, yb, wa, wb) => { ctx.beginPath(); ctx.moveTo(-wa, ya); ctx.lineTo(wa, ya); ctx.lineTo(wb, yb); ctx.lineTo(-wb, yb); ctx.closePath(); ctx.fillStyle = glassGrad(ctx, Math.min(ya, yb), Math.max(ya, yb)); ctx.fill(); };
  glass(cabFront, rf, hw - 2.2, hw - 3); // windshield
  if (!M.pickup || M.crewcab || true) glass(rr, cabRear, hw - 3, hw - 2.6); // rear window
  // side windows
  ctx.fillStyle = '#2d3c47'; ctx.fillRect(-hw + 0.8, Math.min(rf, rr), 1.2, Math.abs(rf - rr)); ctx.fillRect(hw - 2, Math.min(rf, rr), 1.2, Math.abs(rf - rr));
  // roof panel
  const rg = ctx.createLinearGradient(-hw, 0, hw, 0); rg.addColorStop(0, shade(color, 0.32)); rg.addColorStop(1, shade(color, -0.12));
  ctx.fillStyle = spec.model === 'combi' && spec.route ? '#f2f2ec' : rg; roundRect(ctx, -hw + 2.2, Math.min(rf, rr), W - 4.4, Math.abs(rf - rr), 1.4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-hw + 3, Math.min(rf, rr) + 0.8, 1.2, Math.abs(rf - rr) - 1.6);
  // pickup bed
  if (M.pickup && !M.crewcab) {
    const b0 = rr - 1.4 * f, b1 = (front ? yTop : yBot) + 1.4 * -f;
    ctx.fillStyle = shade(color, -0.55); ctx.fillRect(-hw + 1.4, Math.min(b0, b1), W - 2.8, Math.abs(b1 - b0));
    ctx.strokeStyle = shade(color, -0.25); ctx.lineWidth = 0.35; for (let x = -hw + 3; x < hw - 2; x += 2.2) { ctx.beginPath(); ctx.moveTo(x, Math.min(b0, b1) + 0.6); ctx.lineTo(x, Math.max(b0, b1) - 0.6); ctx.stroke(); }
  }
  // hood crease lines
  ctx.strokeStyle = rgba(shade(color, -0.35), 0.5); ctx.lineWidth = 0.3;
  const hoodEnd = front ? yBot : yTop;
  for (const x of [-hw * 0.45, hw * 0.45]) { ctx.beginPath(); ctx.moveTo(x, cabFront + 1 * f); ctx.lineTo(x * 0.9, hoodEnd - 2 * f); ctx.stroke(); }
  // mirrors
  ctx.fillStyle = M.porsche ? color : '#1d1e20'; ctx.fillRect(-hw - 1.2, rf - 0.8 * f, 1.4, 1.2); ctx.fillRect(hw - 0.2, rf - 0.8 * f, 1.4, 1.2);
  // the end facing the camera: front (grille, headlights) or rear (tail lights, plate)
  const ey = yBot;
  ctx.fillStyle = shade(color, -0.25); roundRect(ctx, -hw, ey - 1, W, 4.4, 1.4); ctx.fill();
  ctx.fillStyle = '#26272a'; ctx.fillRect(-hw + 1, ey + 2.2, W - 2, 1.4); // bumper
  if (front) {
    ctx.fillStyle = '#1b1c1e'; roundRect(ctx, -3.4, ey - 0.2, 6.8, 2, 0.6); ctx.fill();
    ctx.fillStyle = '#fffbe6'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * (hw - 2.4), ey + 0.6, M.porsche ? 1.6 : 2, 1.1, 0, 0, 7); ctx.fill(); }
    if (M.ev) { ctx.fillStyle = '#3aa0e6'; ctx.fillRect(-1, ey + 0.2, 2, 0.6); }
  } else {
    ctx.fillStyle = '#c8261f'; for (const s of [-1, 1]) ctx.fillRect(s > 0 ? hw - 4 : -hw + 1, ey, 3, 1.6);
    ctx.fillStyle = '#f0efe6'; ctx.fillRect(-2.4, ey + 0.4, 4.8, 1.8); ctx.fillStyle = '#334'; ctx.fillRect(-1.8, ey + 1, 3.6, 0.5);
  }
  // liveries on the roof
  if (spec.taxi) { ctx.fillStyle = '#fff'; ctx.fillRect(-2.6, (rf + rr) / 2 - 1.2, 5.2, 2.4); ctx.fillStyle = '#1b7a3e'; ctx.fillRect(-hw, -2, 0.8, 6); ctx.fillRect(hw - 0.8, -2, 0.8, 6); }
  if (spec.model === 'ambulancia' || spec.model === 'patrulla') { lightbar(ctx, 0, (rf + rr) / 2 + (front ? 4 : -4), 8); }
  if (spec.model === 'ambulancia') { ctx.fillStyle = '#d42a2a'; ctx.fillRect(-1, (rf + rr) / 2 - 3, 2, 6); ctx.fillRect(-3, (rf + rr) / 2 - 1, 6, 2); }
  if (spec.model === 'patrulla') { ctx.fillStyle = '#1f3f8f'; ctx.fillRect(-hw + 0.4, rf - 3, 1, 6); ctx.fillRect(hw - 1.4, rf - 3, 1, 6); }
  if (spec.model === 'combi' && spec.route) label(ctx, spec.text || '', 0, (rf + rr) / 2, 2, '#333');
  // body highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-hw + 1, yTop + 3); ctx.lineTo(-hw + 1, yBot - 3); ctx.stroke();
  if (dmg) {
    ctx.fillStyle = 'rgba(30,25,20,0.35)'; for (let i = 0; i < dmg * 2; i++) { ctx.beginPath(); ctx.ellipse(((i * 37) % 10 - 5) * 1.1, yTop + 4 + ((i * 13) % 20), 1.8, 1, 0, 0, 7); ctx.fill(); }
    if (dmg >= 2) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.22; const cy = (cabFront + rf) / 2; for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(Math.cos(a) * 4, cy + Math.sin(a * 1.7) * 2); ctx.stroke(); } }
  }
}

// Bicycles and motorcycles: frame, spokes, chain; the rider is drawn by the caller.
export function drawBikeSide(ctx, kind, color, t) {
  const moto = kind === 'moto';
  const r = moto ? 3.4 : 3.6;
  ctx.save();
  const sg = ctx.createRadialGradient(0, 0, 0.5, 0, 0, 11); sg.addColorStop(0, 'rgba(15,15,25,0.35)'); sg.addColorStop(1, 'rgba(15,15,25,0)');
  ctx.scale(1, 0.22); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 1, 11, 0, 7); ctx.fill(); ctx.restore();
  for (const wx of [-6.4, 6.4]) {
    ctx.strokeStyle = '#141414'; ctx.lineWidth = moto ? 1.5 : 0.75; ctx.beginPath(); ctx.arc(wx, -r, r, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,200,205,0.75)'; ctx.lineWidth = 0.14;
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI + t * 9; ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * r, -r + Math.sin(a) * r); ctx.lineTo(wx - Math.cos(a) * r, -r - Math.sin(a) * r); ctx.stroke(); }
    ctx.fillStyle = '#9aa0a5'; ctx.beginPath(); ctx.arc(wx, -r, 0.5, 0, 7); ctx.fill();
  }
  if (moto) {
    const g = ctx.createLinearGradient(0, -10, 0, -4); g.addColorStop(0, shade(color, 0.25)); g.addColorStop(1, shade(color, -0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-6.4, -6.6); ctx.quadraticCurveTo(-3, -9.6, 1.6, -8.6); ctx.lineTo(4.6, -9.4); ctx.lineTo(6.4, -5); ctx.lineTo(-1, -4.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1c1c1e'; roundRect(ctx, -5.6, -10.2, 6.4, 1.6, 0.6); ctx.fill(); // seat
    ctx.fillStyle = '#5a5d61'; ctx.fillRect(-2, -5.4, 4, 2.2); // engine
    ctx.strokeStyle = '#8b8f94'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-1.4, -3.6); ctx.lineTo(-7.6, -3.2); ctx.stroke(); // exhaust
    ctx.strokeStyle = '#1c1c1e'; ctx.lineWidth = 0.55; ctx.beginPath(); ctx.moveTo(6.4, -r); ctx.lineTo(4.4, -11.4); ctx.lineTo(3, -12); ctx.stroke();
    ctx.fillStyle = '#fff8d8'; ctx.beginPath(); ctx.arc(5.6, -10, 0.8, 0, 7); ctx.fill();
  } else {
    ctx.strokeStyle = color; ctx.lineWidth = 0.6; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-6.4, -r); ctx.lineTo(-1, -r); ctx.lineTo(-2.4, -10); ctx.lineTo(4.6, -10); ctx.lineTo(-1, -r); ctx.moveTo(4.6, -10); ctx.lineTo(6.4, -r); ctx.moveTo(-2.4, -10); ctx.lineTo(-6.4, -r); ctx.stroke();
    ctx.strokeStyle = '#1c1c1e'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-3.4, -11.2); ctx.lineTo(-1.6, -11.2); ctx.moveTo(4.6, -10); ctx.lineTo(4.2, -12.2); ctx.lineTo(5.6, -12); ctx.stroke();
    ctx.strokeStyle = '#6b6e72'; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.arc(-1, -r, 1.3, 0, 7); ctx.moveTo(-1, -r - 1.3); ctx.lineTo(-6.4, -r - 0.4); ctx.moveTo(-1, -r + 1.3); ctx.lineTo(-6.4, -r + 0.4); ctx.stroke();
  }
}
export function drawBikeTop(ctx, kind, color) {
  const moto = kind === 'moto';
  ctx.fillStyle = 'rgba(15,15,25,0.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#141414'; ctx.fillRect(-0.8, -12, 1.6, 5.4); ctx.fillRect(-0.8, 2, 1.6, 5.4);
  ctx.fillStyle = moto ? color : '#8a8f94'; ctx.fillRect(moto ? -1.6 : -0.6, -7, moto ? 3.2 : 1.2, 9.6);
  ctx.strokeStyle = '#1c1c1e'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-3.4, -9); ctx.lineTo(3.4, -9); ctx.stroke();
}

// Draw straight into a context (used by static sprites, which are cached by the renderer).
export function paintCar(ctx, spec, dir) {
  const M = MODELS[spec.model] || MODELS[spec.model === 'pickup' ? 'tacoma' : 'tsuru'];
  const dmg = Math.min(3, Math.floor((spec.damage || 0) / 26));
  ctx.save();
  if (dir === 'E' || dir === 'W') { if (dir === 'W') ctx.scale(-1, 1); drawSide(ctx, M, spec, dmg); }
  else drawTop(ctx, M, spec, dir === 'S', dmg);
  ctx.restore();
}
