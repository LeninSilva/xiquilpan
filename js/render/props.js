// What you see inside the shops of Jiquilpan: chips racks, soda and beer fridges, the butcher's
// counter with its cuts, hooks and scale, crates of beer at the Modelorama, Citijal tinacos…
import { shade, rgba, rng, pick, roundRect } from '../util.js';
import { shadowBlob, vgrad, text } from './art.js';
import { SPRITES } from './landmarks.js';

const label = (ctx, str, x, y, size, color, w) => {
  ctx.font = `bold ${size}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (w) { const tw = ctx.measureText(str).width; if (tw > w) ctx.font = `bold ${size * w / tw}px "Trebuchet MS", sans-serif`; }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
};

// Wire rack of chips bags (the kind every tiendita has by the door)
SPRITES.snackRack = {
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 10, 2.5, 0.22);
    ctx.strokeStyle = '#8f9499'; ctx.lineWidth = 0.6; ctx.strokeRect(-9, -36, 18, 36);
    ctx.fillStyle = '#d42a2a'; ctx.fillRect(-9.5, -39, 19, 4); label(ctx, s.brand || 'SABRITAS', 0, -37, 2.4, '#fff', 17);
    const bags = [['SABRITAS', '#f2c230', '#d42a2a'], ['DORITOS', '#d42a2a', '#111'], ['CHEETOS', '#f08c00', '#fff'], ['RUFFLES', '#2a5ea8', '#fff'], ['TAKIS', '#6a1fa0', '#f2c230'], ['PAKETAXO', '#2f9e44', '#fff'], ['FRITOS', '#f2c230', '#2a5ea8']];
    const r = rng(s.seed || 5);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) {
      const [n, bg, fg] = pick(r, bags), x = -7.6 + i * 5.4, y = -33 + j * 8.2;
      ctx.fillStyle = bg; roundRect(ctx, x, y, 4.8, 6.6, 0.8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x + 0.4, y + 0.4, 1, 5.6);
      label(ctx, n, x + 2.4, y + 3.3, 1.1, fg, 4.4);
    }
  },
};

// Glass-door fridge: bottles of Coca-Cola (600 ml and the litro), Fanta, Sprite, 7UP, Pepsi…
SPRITES.sodaFridge = {
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 9, 2.5, 0.22);
    const c = s.color || '#c8102e';
    ctx.fillStyle = vgrad(ctx, -40, 0, shade(c, 0.12), shade(c, -0.2)); ctx.fillRect(-8, -40, 16, 40);
    label(ctx, s.brand || 'Coca-Cola', 0, -37.4, 3, '#fff', 14);
    ctx.fillStyle = 'rgba(200,228,245,0.5)'; ctx.fillRect(-6.6, -34.5, 13.2, 29);
    const drinks = s.beer
      ? [['#f2d24a', '#1f3f8f'], ['#f6e27a', '#1f4fa0'], ['#2b1a12', '#c9a227'], ['#c9a227', '#5b2a1a'], ['#e8e8e8', '#1f6fb3'], ['#f2c230', '#b3201f']] // Modelo, Corona, Negra, Bohemia, Ultra, Victoria
      : [['#3a1a10', '#d42a2a'], ['#f08c00', '#1f4fa0'], ['#9fd36a', '#1f7a3a'], ['#c8e6a0', '#2f9e44'], ['#24324f', '#1e88e5'], ['#3a1a10', '#d42a2a']];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) {
      const [liq, cap] = drinks[(i + j * 2) % drinks.length], x = -5.8 + i * 2.6, y = -33.4 + j * 7;
      const big = !s.beer && j === 3;
      ctx.fillStyle = liq; roundRect(ctx, x, y + (big ? 0 : 1.2), big ? 2.2 : 1.8, big ? 5.6 : 4.4, 0.5); ctx.fill();
      ctx.fillStyle = cap; ctx.fillRect(x + 0.3, y + (big ? -0.4 : 0.8), big ? 1.6 : 1.2, 0.6);
      ctx.fillStyle = s.beer ? '#f5f0e6' : '#d42a2a'; ctx.fillRect(x, y + (big ? 2 : 2.8), big ? 2.2 : 1.8, 0.9);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-6, -34, 1.2, 28);
    ctx.fillStyle = '#8f9499'; ctx.fillRect(5.4, -24, 0.8, 6);
    if (s.beer) label(ctx, 'MODELO · CORONA · NEGRA · BOHEMIA · ULTRA', 0, -2.6, 1.2, '#fff', 15);
  },
};

// Shelves of groceries: cans, Maseca, oil, eggs, piloncillo
SPRITES.groceryShelf = {
  draw(ctx, s) {
    const w = s.fw || 34; const r = rng(s.seed || 12);
    shadowBlob(ctx, 1, 0, w / 2, 2.5, 0.2);
    ctx.fillStyle = vgrad(ctx, -32, 0, '#7a5a3a', '#5b4128'); ctx.fillRect(-w / 2, -32, w, 32);
    const goods = [['#d42a2a', 'can'], ['#f2c230', 'box'], ['#2f9e44', 'box'], ['#f5f0e6', 'box'], ['#e6b33a', 'bottle'], ['#2a5ea8', 'can'], ['#f08c00', 'box'], ['#8a5a2e', 'cone']];
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = '#9a7650'; ctx.fillRect(-w / 2 + 1, -31 + j * 7.6 + 6.2, w - 2, 1);
      for (let x = -w / 2 + 1.6; x < w / 2 - 2.2; x += 2.6) {
        const [c, k] = pick(r, goods), y = -31 + j * 7.6;
        ctx.fillStyle = c;
        if (k === 'can') { ctx.fillRect(x, y + 2.6, 2, 3.6); ctx.fillStyle = '#d0d4d8'; ctx.fillRect(x, y + 2.4, 2, 0.4); }
        else if (k === 'bottle') { ctx.fillRect(x + 0.4, y + 1.2, 1.4, 5); ctx.fillRect(x + 0.8, y + 0.4, 0.6, 1); }
        else if (k === 'cone') { ctx.beginPath(); ctx.moveTo(x, y + 6.2); ctx.lineTo(x + 2.2, y + 6.2); ctx.lineTo(x + 1.1, y + 3); ctx.fill(); }
        else { ctx.fillRect(x, y + 1, 2.2, 5.2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 0.3, y + 2.4, 1.6, 0.8); }
      }
    }
    if (s.eggs) { ctx.fillStyle = '#c9b48a'; ctx.fillRect(-w / 2 + 2, -6, 8, 3); ctx.fillStyle = '#f2e8d4'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-w / 2 + 3 + i * 2, -6.2, 0.8, 1, 0, 0, 7); ctx.fill(); } }
  },
};

// Butcher's display case with the cuts of the day
SPRITES.meatCase = {
  draw(ctx, s) {
    const w = s.fw || 60;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.22);
    ctx.fillStyle = vgrad(ctx, -14, 0, '#f2f2f0', '#cfd3d6'); ctx.fillRect(-w / 2, -14, w, 14);
    ctx.fillStyle = '#a01818'; ctx.fillRect(-w / 2, -3, w, 1.4);
    ctx.fillStyle = 'rgba(205,232,245,0.7)'; ctx.beginPath(); ctx.moveTo(-w / 2, -14); ctx.lineTo(w / 2, -14); ctx.lineTo(w / 2 - 3, -22); ctx.lineTo(-w / 2 + 3, -22); ctx.fill();
    const cuts = [['BISTEC', '#b8322a'], ['CHULETA', '#d4776a'], ['COSTILLA', '#a8322a'], ['CHORIZO', '#8a2a1a'], ['MOLIDA', '#c0463a'], ['ARRACHERA', '#9a2a22']];
    const n = Math.floor(w / 10);
    for (let i = 0; i < n; i++) {
      const [name, c] = cuts[i % cuts.length], x = -w / 2 + 3 + i * 10;
      ctx.fillStyle = '#f5f5f2'; ctx.fillRect(x, -13, 8, 6);
      ctx.fillStyle = c;
      if (name === 'CHORIZO') for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + 1.4 + k * 1.8, -10, 0.9, 1.8, 0.3, 0, 7); ctx.fill(); }
      else if (name === 'MOLIDA') { ctx.beginPath(); ctx.ellipse(x + 4, -10, 3.2, 1.8, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 8; k++) ctx.fillRect(x + 1.5 + (k * 7) % 5, -11 + (k % 3), 0.5, 0.5); }
      else { ctx.beginPath(); ctx.ellipse(x + 4, -10, 3.4, 2, 0.2, 0, 7); ctx.fill(); ctx.strokeStyle = '#f2e3d8'; ctx.lineWidth = 0.4; ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 1, -7.4, 6, 1.6); label(ctx, name, x + 4, -6.6, 0.9, '#a01818', 5.6);
    }
  },
};
// Hooks with hanging meat, the cleaver and the chopping block, the scale
SPRITES.meatHooks = {
  draw(ctx, s) {
    const w = s.fw || 40;
    ctx.fillStyle = '#8f9499'; ctx.fillRect(-w / 2, -40, w, 1.2);
    const r = rng(s.seed || 4);
    for (let x = -w / 2 + 4; x < w / 2 - 2; x += 7) {
      ctx.strokeStyle = '#8f9499'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(x, -39); ctx.lineTo(x, -36); ctx.arc(x + 0.8, -35.5, 0.8, Math.PI, 0.3, true); ctx.stroke();
      const g = ctx.createLinearGradient(x - 3, 0, x + 3, 0); g.addColorStop(0, '#d65a4a'); g.addColorStop(1, '#8a2018');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, -29, 2.4 + r(), 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#f2e6da'; ctx.beginPath(); ctx.ellipse(x - 0.6, -31, 1, 2.4, 0.2, 0, 7); ctx.fill();
    }
  },
};
SPRITES.chopBlock = {
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 7, 2, 0.25);
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(-6, -10, 12, 10);
    ctx.fillStyle = '#b58c5e'; ctx.beginPath(); ctx.ellipse(0, -10, 6, 2.4, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,30,0.5)'; ctx.lineWidth = 0.2; for (let r = 1; r < 6; r += 1.2) { ctx.beginPath(); ctx.ellipse(0, -10, r, r * 0.4, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = '#c9ced3'; ctx.beginPath(); ctx.moveTo(-1, -12.6); ctx.lineTo(4, -13.4); ctx.lineTo(4.2, -10.6); ctx.lineTo(-0.6, -10.4); ctx.fill();
    ctx.fillStyle = '#3a2618'; ctx.fillRect(-4.2, -12.2, 3.4, 1.2);
    ctx.fillStyle = '#b8322a'; ctx.beginPath(); ctx.ellipse(-2.4, -9.6, 2, 0.8, 0, 0, 7); ctx.fill();
  },
};
SPRITES.scale = {
  draw(ctx) {
    ctx.fillStyle = '#e8e8e6'; ctx.fillRect(-3, -6, 6, 6); ctx.fillStyle = '#c9ced3'; ctx.fillRect(-4, -7, 8, 1.2);
    ctx.fillStyle = '#2b3a3a'; ctx.fillRect(-2, -4.4, 4, 2); ctx.fillStyle = '#7cf28a'; ctx.fillRect(-1.6, -4, 3.2, 1.2);
  },
};

// Beer crates stacked on the sidewalk (Modelorama)
SPRITES.beerCrates = {
  draw(ctx, s) {
    const n = s.n || 6, r = rng(s.seed || 2);
    shadowBlob(ctx, 2, 0, 12, 3, 0.25);
    const kinds = [['CORONA', '#f2d24a', '#1f3f8f'], ['MODELO', '#1f3f8f', '#c9a227'], ['VICTORIA', '#c8102e', '#f2c230'], ['NEGRA', '#2b1a12', '#c9a227']];
    for (let i = 0; i < n; i++) {
      const [name, bg, fg] = pick(r, kinds), x = -10 + (i % 3) * 7, y = -5 - Math.floor(i / 3) * 5;
      ctx.fillStyle = shade(bg, -0.2); ctx.fillRect(x, y, 6.6, 5);
      ctx.fillStyle = bg; ctx.fillRect(x, y, 6.6, 1.4);
      label(ctx, name, x + 3.3, y + 3, 1.3, fg, 6);
    }
  },
};
// A stack of tinacos (Citijal) waiting outside the ferretería
SPRITES.tinacos = {
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 16, 4, 0.25);
    const draw = (x, y, sc) => {
      const g = ctx.createLinearGradient(x - 6 * sc, 0, x + 6 * sc, 0); g.addColorStop(0, '#f2ead0'); g.addColorStop(0.6, '#d8cda6'); g.addColorStop(1, '#a89c74');
      ctx.fillStyle = g; roundRect(ctx, x - 6 * sc, y - 16 * sc, 12 * sc, 16 * sc, 3 * sc); ctx.fill();
      ctx.strokeStyle = 'rgba(120,100,60,0.35)'; ctx.lineWidth = 0.3; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 6 * sc, y - k * 4 * sc); ctx.lineTo(x + 6 * sc, y - k * 4 * sc); ctx.stroke(); }
      ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.ellipse(x, y - 16 * sc, 2.4 * sc, 1 * sc, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a5ea8'; ctx.fillRect(x - 4.6 * sc, y - 9 * sc, 9.2 * sc, 2.6 * sc);
      label(ctx, 'CITIJAL', x, y - 7.7 * sc, 1.8 * sc, '#fff', 8.6 * sc);
    };
    draw(-8, 0, 1); draw(6, 0, 1); draw(-1, -2, 0.9); draw(13, 1, 0.7);
  },
};
// Black rooftop tinaco with the Citijal band (used on azoteas)
export function rooftopTinaco(ctx, x, y, s = 1, beige = false) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + 4 * s, y + 7 * s, 4.6 * s, 2 * s, 0, 0, 7); ctx.fill();
  const g = ctx.createLinearGradient(x, 0, x + 8 * s, 0); g.addColorStop(0, beige ? '#efe5c4' : '#4a4b50'); g.addColorStop(1, beige ? '#b8ad86' : '#1c1d20');
  ctx.fillStyle = g; ctx.fillRect(x, y + 1, 8 * s, 5.5 * s);
  ctx.fillStyle = beige ? '#f6efd8' : '#55565b'; ctx.beginPath(); ctx.ellipse(x + 4 * s, y + 1, 4 * s, 1.8 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2a5ea8'; ctx.fillRect(x, y + 3.2 * s, 8 * s, 1 * s);
}
// A tray of water left out for the street dogs
SPRITES.waterTray = {
  draw(ctx) {
    ctx.fillStyle = '#8f9499'; ctx.beginPath(); ctx.ellipse(0, -1, 4.4, 1.8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6fa8c9'; ctx.beginPath(); ctx.ellipse(0, -1.3, 3.6, 1.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-2, -1.8, 1.6, 0.4);
  },
};
