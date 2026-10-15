// The equipment of the shops in town: every place has its own things.
import { rng, pick, shade, mix, rgba, roundRect } from '../util.js';
import { SPRITES } from './landmarks.js';
import { shadowBlob } from './art.js';

// ---- La Cochera: the espresso machine, the grinder, the cake case ----------------------------------
SPRITES.espresso = {
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 11, 3, 0.25);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-14, -8, 28, 8); // counter piece under it
    const g = ctx.createLinearGradient(-10, 0, 10, 0); g.addColorStop(0, '#9aa1a8'); g.addColorStop(0.5, '#f1f4f6'); g.addColorStop(1, '#7c838a');
    ctx.fillStyle = g; roundRect(ctx, -10, -22, 20, 14, 2); ctx.fill();
    ctx.fillStyle = '#b8261f'; ctx.fillRect(-10, -22, 20, 3); // red top, Italian style
    ctx.fillStyle = '#2b2b2b'; for (const x of [-5, 5]) { ctx.fillRect(x - 2, -10.6, 4, 1.4); ctx.fillRect(x - 0.6, -9.2, 1.2, 1.6); } // group heads + portafilters
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-1.2, -18, 2.4, 2.4); ctx.fillStyle = '#e8e6e0'; ctx.beginPath(); ctx.arc(0, -16.8, 0.9, 0, 7); ctx.fill(); // pressure gauge
    ctx.fillStyle = '#c9ccd1'; ctx.fillRect(8, -16, 0.8, 6); // steam wand
    ctx.fillStyle = '#f7f3ea'; for (let i = 0; i < 5; i++) ctx.fillRect(-9 + i * 4, -24.6, 2.6, 2.4); // cups warming on top
    // the grinder
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(11.5, -14, 4, 6); ctx.fillStyle = 'rgba(200,220,235,0.6)'; ctx.beginPath(); ctx.moveTo(11.5, -14); ctx.lineTo(15.5, -14); ctx.lineTo(16.5, -20); ctx.lineTo(10.5, -20); ctx.fill(); ctx.fillStyle = '#5a3a22'; ctx.fillRect(11.2, -18, 5.6, 2.4);
  },
  anim(ctx, s, t) { if (Math.sin(t * 0.7) > 0.3) for (let i = 0; i < 3; i++) { const p = (t * 0.7 + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - p)})`; ctx.beginPath(); ctx.arc(8.4 + Math.sin(t * 3 + i) * 1.4, -16 - p * 10, 1 + p * 2, 0, 7); ctx.fill(); } },
};
SPRITES.pasteles = { // a lit glass case: tres leches, chocolate, cheesecake, conchas, galletas, rol de canela
  draw(ctx, s) {
    const w = s.fw || 40;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.22);
    ctx.fillStyle = '#2b2420'; ctx.fillRect(-w / 2, -10, w, 10);
    ctx.fillStyle = 'rgba(210,235,245,0.5)'; ctx.fillRect(-w / 2, -24, w, 14); ctx.strokeStyle = '#8a8478'; ctx.lineWidth = 0.5; ctx.strokeRect(-w / 2, -24, w, 14);
    ctx.fillStyle = '#c9c3b8'; ctx.fillRect(-w / 2 + 1, -17, w - 2, 0.7);
    const cakes = [['#f7efe0', '#e8b04b'], ['#5a2e1c', '#3a1d12'], ['#f2e6c4', '#d9a066'], ['#f7d6e0', '#c8102e']];
    cakes.forEach(([a, b], i) => { const x = -w / 2 + 4 + i * (w - 8) / 4; ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(x, -18); ctx.lineTo(x + 6, -18); ctx.lineTo(x + 6, -21.6); ctx.lineTo(x + 1.6, -22.8); ctx.fill(); ctx.fillStyle = b; ctx.fillRect(x, -21.6, 6, 0.9); if (i === 3) { ctx.fillStyle = '#c8102e'; ctx.beginPath(); ctx.arc(x + 2.4, -23.4, 0.9, 0, 7); ctx.fill(); } });
    for (let i = 0; i < 7; i++) { const x = -w / 2 + 3 + i * (w - 6) / 7; ctx.fillStyle = ['#e8b86b', '#f3d9a5', '#c98a4a'][i % 3]; ctx.beginPath(); ctx.ellipse(x + 2, -11.8, 2.2, 1.3, 0, 0, 7); ctx.fill(); if (i % 3 === 0) { ctx.strokeStyle = '#f7efe0'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(x + 0.6, -12.4); ctx.lineTo(x + 3.4, -11.2); ctx.moveTo(x + 3.4, -12.4); ctx.lineTo(x + 0.6, -11.2); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-w / 2 + 2, -23.4, 1, 12);
  },
  anim(ctx, s) { const w = s.fw || 40; ctx.fillStyle = 'rgba(255,240,200,0.12)'; ctx.fillRect(-w / 2, -24, w, 14); },
};
SPRITES.cafeTable = { // a small round café table with two chairs and somebody's laptop
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 9, 3, 0.2);
    for (const x of [-7, 7]) { ctx.fillStyle = '#2b2420'; ctx.fillRect(x - 2, -9, 4, 1.6); ctx.fillRect(x - 1.6, -7.4, 0.8, 7.4); ctx.fillRect(x + 0.8, -7.4, 0.8, 7.4); ctx.fillRect(x - 2, -13, 4, 4); }
    ctx.fillStyle = '#e9d7b0'; ctx.beginPath(); ctx.ellipse(0, -10, 6, 2.6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2b2420'; ctx.fillRect(-0.5, -9, 1, 9);
    ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-3, -11.4, 1.8, 1.6); ctx.fillStyle = '#6b3f22'; ctx.fillRect(-2.8, -11.2, 1.4, 0.6);
    if (s.laptop) { ctx.fillStyle = '#c9ccd1'; ctx.fillRect(0, -11, 4.4, 1.4); ctx.fillStyle = '#3a6a8a'; ctx.fillRect(0.4, -14.6, 3.6, 3.4); }
  },
};

// ---- micheladas: only micheladas -------------------------------------------------------------------
// The bar where they are made: the escarchado plates (chile en polvo and chamoy), the salsas
// (Valentina, Maggi, salsa inglesa, Clamato), a bowl of limes, the giant cups and the ice tubs.
SPRITES.micheBar = {
  draw(ctx, s) {
    const w = s.fw || 64;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.22);
    ctx.fillStyle = s.color || '#c0392b'; ctx.fillRect(-w / 2, -13, w, 13); ctx.fillStyle = shade(s.color || '#c0392b', -0.25); ctx.fillRect(-w / 2, -3, w, 3);
    ctx.fillStyle = '#e8e2d2'; ctx.fillRect(-w / 2 - 1, -15, w + 2, 3);
    // the escarchado plates
    ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.ellipse(-w / 2 + 6, -15.6, 3.6, 1.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a1f2a'; ctx.beginPath(); ctx.ellipse(-w / 2 + 14, -15.6, 3.6, 1.4, 0, 0, 7); ctx.fill();
    // salsas
    const bottles = [['#b81d24', '#f2c230'], ['#3a1d12', '#f2c230'], ['#2b1a12', '#f7f3ea'], ['#c62828', '#2e7d32'], ['#e86a2b', '#f7f3ea']];
    bottles.forEach(([c, cap], i) => { const x = -w / 2 + 20 + i * 3.6; ctx.fillStyle = c; ctx.fillRect(x, -21, 2.6, 6); ctx.fillStyle = cap; ctx.fillRect(x + 0.6, -22.4, 1.4, 1.4); });
    // limes
    ctx.fillStyle = '#e8e2d2'; ctx.beginPath(); ctx.ellipse(w / 2 - 22, -15.8, 4.4, 1.6, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#8cc63f' : '#6aa832'; ctx.beginPath(); ctx.arc(w / 2 - 25 + i * 1.3, -16.6 - (i % 2), 0.9, 0, 7); ctx.fill(); }
    // stacks of big plastic cups
    for (const x of [w / 2 - 14, w / 2 - 10]) for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(240,245,250,0.85)'; ctx.beginPath(); ctx.moveTo(x - 1.6, -16 - k * 1.2); ctx.lineTo(x + 1.6, -16 - k * 1.2); ctx.lineTo(x + 2, -18 - k * 1.2); ctx.lineTo(x - 2, -18 - k * 1.2); ctx.fill(); }
    // a finished michelada with its chile rim and a straw
    const mx = w / 2 - 5;
    ctx.fillStyle = 'rgba(220,150,60,0.9)'; ctx.beginPath(); ctx.moveTo(mx - 2, -16); ctx.lineTo(mx + 2, -16); ctx.lineTo(mx + 2.6, -22); ctx.lineTo(mx - 2.6, -22); ctx.fill();
    ctx.fillStyle = '#b81d24'; ctx.fillRect(mx - 2.8, -22.8, 5.6, 1.2); ctx.fillStyle = '#f7f3ea'; ctx.fillRect(mx + 0.6, -26, 0.5, 4);
  },
};
SPRITES.cubetaHielo = { // a tub of ice full of beer bottles
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 7, 2.4, 0.22);
    ctx.fillStyle = s.color || '#2f5d9a'; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.fill();
    ctx.fillStyle = '#dff0f6'; ctx.beginPath(); ctx.ellipse(0, -8, 6, 2, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#7a4a1a' : '#e6c75a'; ctx.fillRect(-4 + i * 2, -12 - (i % 2), 1.2, 4.4); ctx.fillStyle = '#f2c230'; ctx.fillRect(-4 + i * 2, -12.6 - (i % 2), 1.2, 0.8); }
  },
};

// ---- the nevería: nieve de garrafa, made by hand in tubs of ice and salt ------------------------------
SPRITES.garrafas = {
  draw(ctx, s) {
    const n = s.n || 4, flavors = s.flavors || ['#f7f3ea', '#b4e37a', '#f7c6d9', '#6a1fa0', '#f2c230'];
    shadowBlob(ctx, 2, 0, n * 6, 3, 0.2);
    ctx.fillStyle = '#6b3f22'; ctx.fillRect(-n * 6 - 2, -10, n * 12 + 4, 10); ctx.fillStyle = '#8a5a34'; ctx.fillRect(-n * 6 - 2, -11.6, n * 12 + 4, 2);
    for (let i = 0; i < n; i++) {
      const x = -n * 6 + 6 + i * 12;
      ctx.fillStyle = '#7a4a28'; ctx.beginPath(); ctx.ellipse(x, -12, 5.2, 2.2, 0, 0, 7); ctx.fill(); // the wooden tub
      ctx.fillStyle = '#e8f2f6'; ctx.beginPath(); ctx.ellipse(x, -12.2, 4.4, 1.7, 0, 0, 7); ctx.fill(); // ice and salt
      ctx.fillStyle = '#c9ccd1'; ctx.beginPath(); ctx.ellipse(x, -12.4, 2.8, 1.1, 0, 0, 7); ctx.fill(); // the metal garrafa
      ctx.fillStyle = flavors[i % flavors.length]; ctx.beginPath(); ctx.ellipse(x, -12.5, 2.2, 0.8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#8a8f96'; ctx.fillRect(x + 1.6, -16, 0.6, 3.6); // the paddle
    }
  },
};
SPRITES.conos = { // cones in a rack, cups, and the price board
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 6, 2, 0.2);
    ctx.fillStyle = '#c9ccd1'; ctx.fillRect(-6, -10, 12, 1.2);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.moveTo(-5 + i * 2.4, -10); ctx.lineTo(-4.2 + i * 2.4, -5); ctx.lineTo(-3.4 + i * 2.4, -10); ctx.fill(); }
    ctx.fillStyle = '#c9ccd1'; ctx.fillRect(-0.5, -9, 1, 9);
  },
};
SPRITES.congelador = { // the paletas freezer, with its sliding glass lids
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 12, 3, 0.2);
    ctx.fillStyle = '#f2f2ef'; ctx.fillRect(-12, -12, 24, 12); ctx.fillStyle = s.color || '#c8102e'; ctx.fillRect(-12, -6, 24, 3);
    ctx.fillStyle = 'rgba(200,230,245,0.55)'; ctx.fillRect(-11, -14.6, 22, 3); ctx.strokeStyle = '#9aa1a8'; ctx.lineWidth = 0.4; ctx.strokeRect(-11, -14.6, 22, 3);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#f2c230', '#c8102e', '#8cc63f', '#f7c6d9', '#6a1fa0', '#f28c28'][i % 6]; ctx.fillRect(-10 + i * 2.3, -14, 1.6, 1.8); }
    if (s.brand) { ctx.fillStyle = '#fff'; ctx.font = 'bold 2.4px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.brand, 0, -4.4); }
  },
};

// ---- José Luis's bike shop --------------------------------------------------------------------------
function bikeSide(ctx, x, y, k, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(-7, -5, 4.6, 0, 7); ctx.arc(7, -5, 4.6, 0, 7); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,200,200,0.6)'; ctx.lineWidth = 0.25; for (let a = 0; a < 6.28; a += 0.8) { ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(-7 + Math.cos(a) * 4.4, -5 + Math.sin(a) * 4.4); ctx.moveTo(7, -5); ctx.lineTo(7 + Math.cos(a) * 4.4, -5 + Math.sin(a) * 4.4); ctx.stroke(); }
  ctx.strokeStyle = color; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(-1, -5); ctx.lineTo(4, -12); ctx.lineTo(-3, -12); ctx.lineTo(-7, -5); ctx.moveTo(-1, -5); ctx.lineTo(-3, -13.5); ctx.moveTo(4, -12); ctx.lineTo(7, -5); ctx.moveTo(4, -12); ctx.lineTo(5, -15); ctx.stroke();
  ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-5, -14.4, 4, 1.2); ctx.fillRect(3.6, -15.6, 3.4, 0.9);
  ctx.restore();
}
SPRITES.bikeStand = { // a bike up on the repair stand, a wheel off, tools on the floor
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 12, 3, 0.22);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-0.6, -16, 1.2, 16); ctx.fillRect(-6, -1, 12, 1); ctx.fillRect(-1.6, -17, 3.2, 2);
    bikeSide(ctx, 0, -6, 0.95, s.color || '#2f9e44');
    ctx.fillStyle = '#8a8f96'; ctx.fillRect(6, -1.2, 3, 0.8); ctx.fillStyle = '#c8102e'; ctx.fillRect(-9, -1.4, 3.6, 1);
  },
};
SPRITES.ruedasPared = { // rims and tyres hanging on the wall, inner tubes on hooks
  draw(ctx, s) {
    const w = s.fw || 40;
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(-w / 2, -34, w, 1.4);
    for (let i = 0; i < 4; i++) { const x = -w / 2 + 6 + i * (w - 12) / 3; ctx.strokeStyle = i % 2 ? '#1b1b1b' : '#9aa1a8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, -24, 5.6, 0, 7); ctx.stroke(); ctx.fillStyle = '#5a5a5a'; ctx.beginPath(); ctx.arc(x, -24, 0.9, 0, 7); ctx.fill(); ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 0.4, -34, 0.8, 4.4); }
    ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 0.8; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-w / 2 + 8 + i * 6, -12, 2.4, 5, 0, 0, 7); ctx.stroke(); }
  },
};
SPRITES.bicisVenta = { // bikes for sale in a row
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 18, 3, 0.2);
    const cols = s.colors || ['#c8102e', '#1f4fa0', '#f2c230'];
    cols.forEach((c, i) => bikeSide(ctx, -12 + i * 12, -1 - i * 1.5, 0.8, c));
    ctx.fillStyle = '#f7f3ea'; ctx.fillRect(10, -20, 9, 4); ctx.fillStyle = '#c8102e'; ctx.font = 'bold 2.2px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$2,800', 14.5, -18);
  },
};
SPRITES.banco = { // a workbench with a vise, tins of parts and a compressor hose
  draw(ctx, s) {
    const w = s.fw || 36;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.22);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-w / 2 + 2, -8, 2, 8); ctx.fillRect(w / 2 - 4, -8, 2, 8);
    ctx.fillStyle = '#7a4a28'; ctx.fillRect(-w / 2, -12, w, 4); ctx.fillStyle = '#6b3f22'; ctx.fillRect(-w / 2 + 2, -5, w - 4, 1.4);
    ctx.fillStyle = '#4a5a6a'; ctx.fillRect(-w / 2 + 3, -16, 6, 4); ctx.fillRect(-w / 2 + 5, -18, 2, 2);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#c9ccd1', '#c8102e', '#2f5d9a', '#f2c230'][i]; ctx.fillRect(-2 + i * 3.4, -14.4, 2.6, 2.4); }
    ctx.fillStyle = s.accent || '#e8b04b'; ctx.fillRect(w / 2 - 8, -17, 5, 5);
  },
};
SPRITES.pegboard = { // tools on a pegboard
  draw(ctx, s) {
    const w = s.fw || 30;
    ctx.fillStyle = '#c9a77a'; ctx.fillRect(-w / 2, -36, w, 20);
    ctx.fillStyle = 'rgba(80,50,30,0.3)'; for (let y = -34; y < -17; y += 2.4) for (let x = -w / 2 + 1.5; x < w / 2; x += 2.4) ctx.fillRect(x, y, 0.5, 0.5);
    const r = rng(s.seed || 3);
    for (let i = 0; i < 9; i++) { const x = -w / 2 + 3 + (i % 5) * (w - 6) / 5, y = -33 + (i / 5 | 0) * 8; ctx.fillStyle = pick(r, ['#5a5a5a', '#c8102e', '#2f5d9a', '#8a8f96', '#f2c230']); ctx.fillRect(x, y, 1.2, 5 + r() * 2); ctx.fillRect(x - 1, y, 3.2, 1.2); }
  },
};

// ---- the bookshop on the plaza ----------------------------------------------------------------------
SPRITES.mesaNovedades = { // a table of new books in stacks, a few standing open
  draw(ctx, s) {
    const w = s.fw || 34, r = rng(s.seed || 2);
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.2);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-w / 2 + 1, -7, 1.6, 7); ctx.fillRect(w / 2 - 2.6, -7, 1.6, 7);
    ctx.fillStyle = '#7a4a28'; ctx.fillRect(-w / 2, -10, w, 3.4);
    for (let i = 0; i < 5; i++) {
      const x = -w / 2 + 3 + i * (w - 6) / 5, n = 2 + (r() * 3 | 0);
      for (let k = 0; k < n; k++) { ctx.fillStyle = pick(r, ['#c8102e', '#f2c230', '#2f5d9a', '#2e7d32', '#f7f3ea', '#1b1b1b', '#e86a2b']); ctx.fillRect(x - 0.4 * k, -11.2 - k * 1.3, 5, 1.2); }
      if (i % 2 === 0) { ctx.fillStyle = pick(r, ['#7a1f1a', '#2f4f6f', '#e8b04b']); ctx.fillRect(x + 0.8, -18 - n * 1.3, 3.4, 5); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x + 1.4, -16.6 - n * 1.3, 2.2, 0.5); }
    }
  },
};
SPRITES.carritoLibros = { // the wheeled cart the bookseller's wife pushes around, half full
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 8, 2.4, 0.22);
    ctx.fillStyle = '#2b2b2b'; for (const x of [-5, 5]) { ctx.beginPath(); ctx.arc(x, -1.2, 1.2, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#8a8f96'; ctx.fillRect(-7, -12, 14, 1); ctx.fillRect(-7, -6, 14, 1); ctx.fillRect(-7, -12, 1, 11); ctx.fillRect(6, -12, 1, 11); ctx.fillRect(6, -15, 1, 3);
    const r = rng(s.seed || 8);
    for (const y of [-12, -6]) for (let x = -6; x < 5; x += 1.6) if (r() < 0.75) { ctx.fillStyle = pick(r, ['#c8102e', '#2f5d9a', '#2e7d32', '#f2c230', '#6b4a30', '#f7f3ea']); ctx.fillRect(x, y - 4.4, 1.4, 4.4); }
  },
};
SPRITES.escaleraCerrada = { // stairs to the upper floor, closed with a rope and a sign
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 10, 3, 0.2);
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#7a4a28' : '#8a5a34'; ctx.fillRect(-9, -i * 5 - 5, 18, 5); ctx.fillStyle = 'rgba(30,15,8,0.4)'; ctx.fillRect(-9, -i * 5 - 0.6, 18, 0.6); }
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(-10, -38, 1.4, 38); ctx.fillRect(8.6, -38, 1.4, 38);
    ctx.strokeStyle = '#c8102e'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-9.4, -8); ctx.quadraticCurveTo(0, -4, 9.4, -8); ctx.stroke();
    ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-6, -10, 12, 5); ctx.fillStyle = '#c8102e'; ctx.font = 'bold 1.9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.text || 'SÓLO PERSONAL', 0, -7.5);
  },
};
SPRITES.caja = { // a cash register on a counter
  draw(ctx, s) {
    const w = s.fw || 30;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.22);
    ctx.fillStyle = s.color || '#5a331d'; ctx.fillRect(-w / 2, -12, w, 12); ctx.fillStyle = shade(s.color || '#5a331d', 0.2); ctx.fillRect(-w / 2 - 1, -14, w + 2, 3);
    ctx.fillStyle = '#3a3a3e'; ctx.fillRect(w / 2 - 11, -19, 8, 5); ctx.fillStyle = '#7fd08a'; ctx.fillRect(w / 2 - 10, -18.4, 6, 1.6);
    ctx.fillStyle = '#c9ccd1'; for (let i = 0; i < 6; i++) ctx.fillRect(w / 2 - 10.4 + (i % 3) * 2.2, -16.4 + (i / 3 | 0) * 1.3, 1.6, 0.9);
    ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-w / 2 + 3, -15.4, 6, 1.4); // bags
    if (s.sign) { ctx.fillStyle = '#f5ecd8'; ctx.fillRect(-w / 2 + 2, -10, w - 4, 4); ctx.fillStyle = '#3a2a1a'; ctx.font = 'bold 2.3px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.sign, 0, -8); }
  },
};

// ---- Casa de la Cultura: dance, ceramics, painting, music ---------------------------------------------
SPRITES.barra = { // ballet barre in front of a mirror
  draw(ctx, s) {
    const w = s.fw || 60;
    ctx.fillStyle = 'rgba(200,225,240,0.55)'; ctx.fillRect(-w / 2, -34, w, 26); ctx.strokeStyle = '#9aa1a8'; ctx.lineWidth = 0.6; ctx.strokeRect(-w / 2, -34, w, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = -w / 2 + 6; x < w / 2; x += 14) { ctx.beginPath(); ctx.moveTo(x, -34); ctx.lineTo(x + 6, -34); ctx.lineTo(x - 4, -8); ctx.lineTo(x - 10, -8); ctx.fill(); }
    ctx.fillStyle = '#c9a77a'; ctx.fillRect(-w / 2, -20, w, 1.4); ctx.fillStyle = '#8a8f96'; for (let x = -w / 2 + 3; x < w / 2; x += 12) ctx.fillRect(x, -20, 0.8, 20);
  },
};
SPRITES.torno = { // a potter's wheel with a pot taking shape, and a bucket of slip
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 7, 2.4, 0.22);
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(-6, -6, 12, 6); ctx.fillStyle = '#8a8f96'; ctx.beginPath(); ctx.ellipse(0, -6.4, 5.4, 1.8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b8643f'; ctx.beginPath(); ctx.moveTo(-2.4, -7); ctx.quadraticCurveTo(-3.8, -10, -1.6, -13); ctx.lineTo(1.6, -13); ctx.quadraticCurveTo(3.8, -10, 2.4, -7); ctx.fill();
    ctx.fillStyle = '#8a4a2a'; ctx.fillRect(7, -4, 3.6, 4); ctx.fillStyle = '#c99a7a'; ctx.beginPath(); ctx.ellipse(8.8, -4, 1.8, 0.7, 0, 0, 7); ctx.fill();
  },
};
SPRITES.horno = { // the kiln
  draw(ctx) {
    shadowBlob(ctx, 2, 0, 9, 3, 0.25);
    ctx.fillStyle = '#7a6a5a'; ctx.fillRect(-9, -18, 18, 18); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-9, -18, 18, 2);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-4, -12, 8, 7); ctx.fillStyle = 'rgba(255,140,40,0.6)'; ctx.fillRect(-3, -11, 6, 5);
    ctx.fillStyle = '#9aa1a8'; ctx.fillRect(-1, -24, 2, 6);
  },
  anim(ctx, s, t) { ctx.fillStyle = `rgba(255,150,50,${0.25 + Math.sin(t * 3) * 0.1})`; ctx.beginPath(); ctx.ellipse(0, -8, 8, 4, 0, 0, 7); ctx.fill(); },
};
SPRITES.repisaBarro = { // shelves of pots drying: ollas, cántaros, jarritos
  draw(ctx, s) {
    const w = s.fw || 36, r = rng(s.seed || 6);
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(-w / 2, -30, 1.4, 30); ctx.fillRect(w / 2 - 1.4, -30, 1.4, 30);
    for (const y of [-28, -18, -8]) { ctx.fillStyle = '#8a6444'; ctx.fillRect(-w / 2, y, w, 1.2); for (let x = -w / 2 + 3; x < w / 2 - 3; x += 4.6) { const c = pick(r, ['#b8643f', '#a3542f', '#c97a4a', '#d9c7a8']); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + 1.6, y - 2.4, 1.8, 2.2, 0, 0, 7); ctx.fill(); ctx.fillRect(x + 0.8, y - 5.4, 1.6, 1.2); } }
  },
};
SPRITES.caballete = { // an easel with a painting in progress
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 5, 2, 0.2);
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(0, -22); ctx.lineTo(4, 0); ctx.moveTo(0, -22); ctx.lineTo(0, 0); ctx.stroke();
    ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-6, -21, 12, 10);
    const r = rng(s.seed || 4); for (let i = 0; i < 6; i++) { ctx.fillStyle = pick(r, ['#e84a6a', '#f2a93b', '#2fb3a0', '#6a5acd', '#2f5d9a', '#3f7a38']); ctx.fillRect(-5 + r() * 9, -20 + r() * 8, 2 + r() * 3, 1 + r() * 2); }
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(-6.4, -11.4, 12.8, 1);
  },
};
SPRITES.guitarras = { // guitars on a wall rack, music stands in front
  draw(ctx, s) {
    const n = s.n || 4;
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(-n * 5, -30, n * 10, 1.2);
    for (let i = 0; i < n; i++) {
      const x = -n * 5 + 5 + i * 10;
      ctx.fillStyle = '#2b1a10'; ctx.fillRect(x - 0.6, -29, 1.2, 9);
      ctx.fillStyle = i % 2 ? '#c98a4a' : '#a86a32'; ctx.beginPath(); ctx.ellipse(x, -17, 3.2, 3.6, 0, 0, 7); ctx.ellipse(x, -12, 4, 4.2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b1a10'; ctx.beginPath(); ctx.arc(x, -15, 1.2, 0, 7); ctx.fill(); ctx.fillRect(x - 1.6, -10.8, 3.2, 0.8);
    }
  },
};
SPRITES.atril = { // music stand with a sheet
  draw(ctx) { shadowBlob(ctx, 1, 0, 3, 1.2); ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-0.4, -13, 0.8, 13); ctx.fillRect(-3, -0.8, 6, 0.8); ctx.fillRect(-4, -17, 8, 4); ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-3.4, -18.6, 6.8, 4.6); ctx.fillStyle = '#2b2b2b'; for (let y = -18; y < -14.5; y += 1) ctx.fillRect(-3, y, 6, 0.15); },
};
SPRITES.sillasCirculo = { // chairs in a circle for a class
  draw(ctx, s) {
    const n = s.n || 8, R = s.r || 14;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const x = Math.cos(a) * R, y = Math.sin(a) * R * 0.5 - 6; ctx.fillStyle = '#2f5d9a'; ctx.fillRect(x - 2, y, 4, 1.4); ctx.fillRect(x - 2, y - 3.4, 4, 1.2); ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 1.6, y + 1.4, 0.6, 2.6); ctx.fillRect(x + 1, y + 1.4, 0.6, 2.6); }
  },
};
SPRITES.pizarron = { // a whiteboard on wheels with the day's lesson
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 10, 2, 0.2);
    ctx.fillStyle = '#8a8f96'; ctx.fillRect(-10, -26, 20, 1); ctx.fillRect(-9.4, -26, 0.8, 26); ctx.fillRect(8.6, -26, 0.8, 26);
    ctx.fillStyle = '#f7f7f4'; ctx.fillRect(-10, -26, 20, 14); ctx.strokeStyle = '#9aa1a8'; ctx.lineWidth = 0.5; ctx.strokeRect(-10, -26, 20, 14);
    ctx.fillStyle = s.ink || '#1f4fa0'; ctx.font = 'bold 2.1px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    (s.lines || []).forEach((l, i) => ctx.fillText(l, -8.6, -22.4 + i * 2.8));
  },
};
SPRITES.tablero = { // a cork board with the class schedule
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 8, 2, 0.2);
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-9, -24, 18, 13); ctx.fillStyle = '#c9a77a'; ctx.fillRect(-8, -23, 16, 11);
    const r = rng(s.seed || 5); for (let i = 0; i < 7; i++) { ctx.fillStyle = pick(r, ['#f7f3ea', '#f2e27a', '#f7c6d9', '#b4e37a']); ctx.fillRect(-7.4 + (i % 4) * 3.8, -22.4 + (i / 4 | 0) * 5, 3.2, 4); ctx.fillStyle = '#c8102e'; ctx.fillRect(-6 + (i % 4) * 3.8, -22.4 + (i / 4 | 0) * 5, 0.6, 0.6); }
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-0.5, -11, 1, 11);
  },
};

// ---- the last huarachería -------------------------------------------------------------------------
SPRITES.maquinaPoste = { // an old industrial post-bed sewing machine, cast iron and black enamel
  draw(ctx) {
    shadowBlob(ctx, 2, 0, 12, 3, 0.25);
    ctx.fillStyle = '#3a2214'; ctx.fillRect(-12, -14, 24, 3); // table
    ctx.fillStyle = '#2b2b2e'; ctx.fillRect(-10, -11, 1.6, 11); ctx.fillRect(8.4, -11, 1.6, 11); ctx.fillRect(-10, -3, 20, 1); // iron legs
    ctx.strokeStyle = '#2b2b2e'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(-5, -6, 3.6, 0, 7); ctx.stroke(); // treadle wheel
    ctx.fillStyle = '#1b1b1d'; ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(-8, -24); ctx.quadraticCurveTo(-7, -27, -2, -27); ctx.lineTo(8, -27); ctx.lineTo(8, -22); ctx.lineTo(-3, -22); ctx.lineTo(-3, -14); ctx.fill(); // the arm
    ctx.fillStyle = '#1b1b1d'; ctx.fillRect(4.4, -22, 2.4, 8); // the post
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(-6, -25.4, 9, 0.6); // the gilt decal, worn off
    ctx.fillStyle = '#8a8f96'; ctx.beginPath(); ctx.arc(-8, -21, 2.2, 0, 7); ctx.fill(); ctx.fillStyle = '#5a5a5a'; ctx.beginPath(); ctx.arc(-8, -21, 0.8, 0, 7); ctx.fill(); // hand wheel
    ctx.fillStyle = '#c9ccd1'; ctx.fillRect(6, -25, 0.5, 4); ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-1, -14.8, 6, 0.8); // needle, leather strip
  },
};
SPRITES.troqueladora = { // the die-cutting press: a heavy iron lever and a block of hard wood
  draw(ctx) {
    shadowBlob(ctx, 2, 0, 10, 3, 0.25);
    ctx.fillStyle = '#4a4f55'; ctx.fillRect(-8, -6, 16, 6); ctx.fillStyle = '#6b4a30'; ctx.fillRect(-7, -9, 14, 3);
    ctx.fillStyle = '#3a3e44'; ctx.fillRect(4, -28, 3, 22); ctx.fillRect(-6, -28, 13, 3);
    ctx.save(); ctx.translate(-5, -27); ctx.rotate(-0.5); ctx.fillStyle = '#2b2b2e'; ctx.fillRect(-12, -1, 14, 2); ctx.fillStyle = '#c8102e'; ctx.fillRect(-14, -1.4, 3, 2.8); ctx.restore();
    ctx.fillStyle = '#8a8f96'; ctx.fillRect(-4, -12, 6, 3); ctx.fillStyle = '#b07a4a'; ctx.beginPath(); ctx.ellipse(-1, -9.6, 3.4, 1.1, 0, 0, 7); ctx.fill(); // the sole being cut
  },
};
SPRITES.hormas = { // wooden lasts on a shelf, sizes chalked on them
  draw(ctx, s) {
    const w = s.fw || 32;
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-w / 2, -24, w, 1.2); ctx.fillRect(-w / 2, -14, w, 1.2); ctx.fillRect(-w / 2, -24, 1.2, 24); ctx.fillRect(w / 2 - 1.2, -24, 1.2, 24);
    for (const y of [-24, -14]) for (let x = -w / 2 + 3; x < w / 2 - 3; x += 4) { ctx.fillStyle = '#c99a5a'; ctx.beginPath(); ctx.ellipse(x + 1.4, y - 1.6, 1.8, 1.4, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f7f3ea'; ctx.fillRect(x + 0.8, y - 2, 1.2, 0.5); }
  },
};
SPRITES.pieles = { // hides hanging from a pole: vaqueta, natural and dyed
  draw(ctx, s) {
    const w = s.fw || 34;
    ctx.fillStyle = '#5a331d'; ctx.fillRect(-w / 2, -32, w, 1.4); ctx.fillRect(-w / 2, -32, 1.2, 32); ctx.fillRect(w / 2 - 1.2, -32, 1.2, 32);
    const cols = ['#b07a4a', '#7a4a28', '#c99a5a', '#3a2214', '#8a2f24'];
    for (let i = 0; i < 4; i++) { const x = -w / 2 + 4 + i * (w - 8) / 4; ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(x, -31); ctx.lineTo(x + 6.4, -31); ctx.quadraticCurveTo(x + 7.4, -20, x + 5.6, -10); ctx.quadraticCurveTo(x + 3, -8, x + 0.8, -10); ctx.quadraticCurveTo(x - 1, -20, x, -31); ctx.fill(); }
  },
};
SPRITES.huarachesPared = { // finished huaraches hanging in pairs, the woven ones and the plain ones
  draw(ctx, s) {
    const w = s.fw || 40, r = rng(s.seed || 11);
    ctx.fillStyle = '#c9a77a'; ctx.fillRect(-w / 2, -36, w, 22);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) {
      const x = -w / 2 + 4 + i * (w - 8) / 5, y = -34 + j * 10, c = pick(r, ['#b07a4a', '#7a4a28', '#3a2214', '#c99a5a']);
      for (const dx of [0, 3]) { ctx.fillStyle = '#2b1a10'; ctx.fillRect(x + dx, y + 6.6, 2.4, 1); ctx.fillStyle = c; ctx.fillRect(x + dx, y, 2.4, 6.6); ctx.strokeStyle = shade(c, -0.4); ctx.lineWidth = 0.25; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x + dx, y + k); ctx.lineTo(x + dx + 2.4, y + k + (k % 2 ? 0.4 : -0.4)); ctx.stroke(); } }
    }
  },
};
SPRITES.bancoZapatero = { // the cobbler's low bench: awl, hammer, a pot of glue, cut straps
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 9, 2.5, 0.22);
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(-9, -7, 18, 3); ctx.fillRect(-8, -4, 1.4, 4); ctx.fillRect(6.6, -4, 1.4, 4);
    ctx.fillStyle = '#3a2214'; ctx.fillRect(-6, -8.6, 4, 1.4); ctx.fillStyle = '#8a8f96'; ctx.fillRect(-2, -9, 3, 0.8); ctx.fillStyle = '#c8b48a'; ctx.beginPath(); ctx.ellipse(4, -8, 1.8, 1, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b07a4a'; for (let i = 0; i < 4; i++) ctx.fillRect(-8 + i * 1.6, -2.4 + (i % 2) * 0.6, 4, 0.5);
  },
};

// ---- the butcher's: grinder and bone saw ---------------------------------------------------------------
SPRITES.molino = { // a stainless meat grinder
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 5, 2, 0.22);
    ctx.fillStyle = '#c9ccd1'; ctx.fillRect(-4, -8, 8, 8); ctx.fillStyle = '#e8eaec'; ctx.fillRect(-3, -14, 6, 6); ctx.beginPath(); ctx.ellipse(0, -14, 4, 1.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a8f96'; ctx.fillRect(3, -11, 4, 2.4); ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.ellipse(7.4, -9.6, 1.4, 1, 0, 0, 7); ctx.fill();
  },
};
SPRITES.sierra = { // the band saw for bones
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 6, 2, 0.22);
    ctx.fillStyle = '#e8eaec'; ctx.fillRect(-5, -26, 10, 26); ctx.fillStyle = '#c9ccd1'; ctx.fillRect(-5, -14, 10, 2); ctx.fillStyle = '#8a8f96'; ctx.fillRect(-0.4, -14, 0.8, 4);
    ctx.fillStyle = '#c62828'; ctx.fillRect(-4, -24, 3, 1.6);
  },
};
