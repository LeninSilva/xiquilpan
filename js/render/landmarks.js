// Landmarks and props, drawn relative to their anchor (bottom-centre of the footprint).
// Each entry: draw(ctx, s) for the cached static image, optional anim(ctx, s, t, night) for live overlays.
import { rng, pick, shade, rgba, mix, roundRect, TILE } from '../util.js';
import {
  shadowBlob, vgrad, wallFace, roofTop, arcade, cornice, archWindow, rectWindow, balcony, woodDoor,
  dome, cross, bellTower, flagPole, treeCanopy, trunk, text, plaque, naveRoof, cloister,
} from './art.js';

export const SPRITES = {};
const T = TILE;

// helpers --------------------------------------------------------------
export function building(ctx, s, o) {
  // Generic 3/4 building: footprint fw x fd; front wall height fh; roof above.
  const w = s.fw, d = s.fd, fh = o.fh;
  const x = -w / 2;
  ctx.fillStyle = 'rgba(20,20,40,0.22)'; ctx.fillRect(x + 4, -2, w, 5); ctx.fillRect(w / 2, -d + 6, 5, d - 4);
  roofTop(ctx, x, -d, w, d - fh, o.roof || '#cfc6b6', o.tiled);
  const rd = d - fh;
  if (rd > 70 && w > 90 && o.patio !== false) {
    // interior courtyard (patio) typical of civic buildings: arcaded gallery around a garden
    const pw = Math.min(w * 0.5, 150), ph = rd * 0.5, px = x + (w - pw) / 2, py = -d + rd * 0.2;
    roofTop(ctx, x + 2, -d + 2, w - 4, rd - 4, '#b0583d', true);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(px - 10, py + ph + 8, pw + 20, 2);
    ctx.fillStyle = '#d9c4a4'; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px, py, pw, 5); ctx.fillRect(px, py, 3, ph);
    for (let i = px + 6; i < px + pw - 2; i += 10) { ctx.fillStyle = '#e7d7bd'; ctx.fillRect(i, py + ph - 3, 2.4, 3); ctx.fillRect(i, py + 3, 2.4, 2.5); }
    ctx.fillStyle = '#6da243'; ctx.fillRect(px + 10, py + 10, pw - 20, ph - 20);
    ctx.fillStyle = '#d9c4a4'; ctx.fillRect(px + pw / 2 - 3, py + 10, 6, ph - 20); ctx.fillRect(px + 10, py + ph / 2 - 3, pw - 20, 6);
    ctx.fillStyle = '#4b95b8'; ctx.beginPath(); ctx.arc(px + pw / 2, py + ph / 2, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#e7d7bd'; ctx.lineWidth = 1.2; ctx.stroke();
    const r2 = rng(Math.floor(w * 7 + d));
    for (const [tx, ty] of [[px + 18, py + 16], [px + pw - 18, py + ph - 16]]) treeCanopy(ctx, tx, ty, 8, ['#3f7535', '#4f8a3c', '#6aa84c'], r2, 6);
  } else if (rd > 40) {
    // tinacos and a skylight on long flat roofs
    const r2 = rng(Math.floor(w * 3 + d));
    for (let i = 0; i < Math.floor(w / 60) + 1; i++) {
      const tx = x + 12 + r2() * (w - 30), ty = -d + 8 + r2() * (rd - 24);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(tx + 4, ty + 7, 4.5, 2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2b2e'; ctx.fillRect(tx, ty + 1, 8, 5.5); ctx.fillStyle = '#3b3c40'; ctx.beginPath(); ctx.ellipse(tx + 4, ty + 1, 4, 1.8, 0, 0, 7); ctx.fill();
    }
  }
  wallFace(ctx, x, -fh, w, fh, o.wall || '#f4efe4', o.band === undefined ? '#8e2f24' : o.band, o.bandH || 6);
  cornice(ctx, x, -fh, w, o.trim || '#d9c2a3');
  return { x, w, d, fh };
}

function lamp(ctx, x, y, h = 20) { // colonial street lamp (farol)
  ctx.fillStyle = '#1f2326'; ctx.fillRect(x - 0.6, y - h, 1.2, h);
  ctx.fillRect(x - 1.6, y - 1.4, 3.2, 1.4);
  ctx.fillRect(x - 2.2, y - h - 0.6, 4.4, 0.9);
  ctx.fillStyle = '#f6e7b0'; ctx.fillRect(x - 1.7, y - h - 5.2, 3.4, 4.4);
  ctx.strokeStyle = '#1f2326'; ctx.lineWidth = 0.5; ctx.strokeRect(x - 1.7, y - h - 5.2, 3.4, 4.4);
  ctx.fillStyle = '#1f2326'; ctx.beginPath(); ctx.moveTo(x - 2.4, y - h - 5.2); ctx.lineTo(x, y - h - 7.4); ctx.lineTo(x + 2.4, y - h - 5.2); ctx.fill();
}

// ======================================================================
// Palacio Municipal / H. Ayuntamiento — two storeys, ground-floor portal of
// cantera arches, balconies above, flag and municipal crest.
SPRITES.palacio = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 46, roof: '#cdc3b1', wall: '#f5f0e6', band: null });
    const { x, w } = b;
    // upper storey
    for (let i = 0; i < 9; i++) {
      const wx = x + 8 + i * ((w - 16) / 9) + 3;
      rectWindow(ctx, wx, -40, 6, 11, '#d6bf9e', '#34444e', false);
      ctx.fillStyle = '#6b4526'; ctx.fillRect(wx + 0.4, -39.5, 2.4, 10); ctx.fillRect(wx + 3.2, -39.5, 2.4, 10);
      balcony(ctx, wx, -28.5, 6);
    }
    // parapet with central pediment and clock
    cornice(ctx, x, -46, w, '#d6bf9e');
    ctx.fillStyle = '#f5f0e6'; ctx.fillRect(-18, -56, 36, 10);
    ctx.beginPath(); ctx.moveTo(-20, -56); ctx.lineTo(0, -63); ctx.lineTo(20, -56); ctx.fill();
    cornice(ctx, -18, -56, 36, '#d6bf9e');
    ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.arc(0, -52, 3.6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(0, -52, 3.6, 0, 7); ctx.moveTo(0, -52); ctx.lineTo(0, -54.6); ctx.moveTo(0, -52); ctx.lineTo(1.8, -52); ctx.stroke();
    for (let i = x; i < x + w; i += 6) { ctx.fillStyle = '#e7dccb'; ctx.fillRect(i, -48.5, 3, 2.5); }
    // ground floor portal arcade
    arcade(ctx, x + 2, -24, w - 4, 24, 11, { stone: '#d8bf9c', inner: '#3c3027', back: '#efe6d4', doorColor: '#5d3a22' });
    plaque(ctx, -22, -31, 44, 5, 'H. AYUNTAMIENTO DE JIQUILPAN', '#3f3a33', '#f1e2b8');
    // crest
    ctx.fillStyle = '#b08d3e'; roundRect(ctx, -3.5, -46 - 9, 7, 8, 2); ctx.fill();
    ctx.fillStyle = '#2f5b8c'; ctx.fillRect(-2.3, -53.8, 4.6, 5.4);
  },
  anim(ctx, s, t) { flagPole(ctx, s.fw / 2 - 10, -46, 24, t * 3); },
};

// Mercado Municipal — long hall, big entrance, signs
SPRITES.mercado = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 34, roof: '#b9b1a3', wall: '#f1eadc' });
    const { x, w } = b;
    // saw-tooth skylights on the roof
    for (let i = x + 8; i < x + w - 12; i += 16) {
      ctx.fillStyle = '#9ea7ad'; ctx.fillRect(i, -s.fd + 6, 10, s.fd - 44);
      ctx.fillStyle = 'rgba(200,230,245,0.45)'; ctx.fillRect(i + 1, -s.fd + 7, 3, s.fd - 46);
    }
    // entrance
    ctx.fillStyle = '#2c2520'; ctx.fillRect(-14, -24, 28, 24);
    ctx.fillStyle = '#e8b04b'; ctx.fillRect(-14, -24, 28, 2);
    for (let i = -12; i < 12; i += 4) { ctx.fillStyle = pick(rng(i + 40), ['#e05a4f', '#f0c34a', '#6bbf7a', '#f5f0e6', '#d77f3a']); ctx.fillRect(i, -14, 3, 3); }
    plaque(ctx, -24, -33, 48, 7, 'MERCADO MUNICIPAL', '#1f5a3a', '#f7eed2');
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const wx = side * (22 + i * 16) - 4;
      if (Math.abs(wx) > w / 2 - 8) continue;
      rectWindow(ctx, wx, -22, 8, 12);
    }
  },
};

// Templo / Parroquia de San Francisco de Asís — single tower, tiled dome, atrium wall
SPRITES.sanfrancisco = {
  draw(ctx, s) {
    const w = s.fw, d = s.fd;
    shadowBlob(ctx, 6, -2, w * 0.55, 6);
    // nave roof running back
    naveRoof(ctx, 0, -60, 50, d - 60, '#b8664a');
    dome(ctx, 0, -d + 34, 16, '#e3d3b8', '#c9a35a');
    // facade
    const fx = -26, fw = 52;
    ctx.fillStyle = vgrad(ctx, -64, 0, '#e8d7bb', '#c8b393'); ctx.fillRect(fx, -64, fw, 64);
    // stone courses
    ctx.strokeStyle = 'rgba(120,95,70,0.25)'; ctx.lineWidth = 0.4;
    for (let y = -62; y < 0; y += 3) { ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx + fw, y); ctx.stroke(); }
    // portal with pilasters
    ctx.fillStyle = '#d9c2a3'; ctx.fillRect(-12, -36, 24, 36);
    woodDoor(ctx, -7, -26, 14, 26, '#5b3620');
    for (const px of [-11, 9]) { ctx.fillStyle = '#c3aa86'; ctx.fillRect(px, -36, 2, 36); }
    cornice(ctx, -13, -36, 26, '#cdb592');
    // choir window & niche with saint
    archWindow(ctx, -4, -52, 8, 12, '#cdb592', '#2c3942');
    ctx.fillStyle = '#b89a73'; ctx.beginPath(); ctx.arc(0, -46, 1.2, 0, 7); ctx.fill();
    // curved gable (espadaña-like) with cross
    ctx.fillStyle = '#e8d7bb';
    ctx.beginPath(); ctx.moveTo(fx, -64); ctx.quadraticCurveTo(fx + 8, -64, -12, -70); ctx.quadraticCurveTo(0, -78, 12, -70); ctx.quadraticCurveTo(fx + fw - 8, -64, fx + fw, -64); ctx.fill();
    cornice(ctx, fx, -64, fw, '#cdb592');
    cross(ctx, 0, -76, 7);
    ctx.beginPath(); ctx.arc(0, -68, 2.4, 0, 7); ctx.fillStyle = '#f4ecd8'; ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.3; ctx.stroke();
    // tower on the right
    bellTower(ctx, fx + fw + 9, 0, 18, 104, '#e3d1b3', 2);
  },
};

// Santuario del Sagrado Corazón — pink neoclassical, twin towers, columns, pediment.
SPRITES.santuario = {
  draw(ctx, s) {
    const w = s.fw, d = s.fd;
    shadowBlob(ctx, 6, -1, w * 0.55, 6);
    naveRoof(ctx, 0, -66, 56, d - 66, '#c9857e');
    dome(ctx, 0, -d + 36, 17, '#e9b8b2', '#d9a7a0');
    const pink = '#e7a7a3', pinkD = '#cf8984';
    const fx = -30, fw = 60;
    ctx.fillStyle = vgrad(ctx, -70, 0, shade(pink, 0.08), pinkD); ctx.fillRect(fx, -70, fw, 70);
    // four columns (neoclassical)
    for (const cx of [-22, -10, 10, 22]) {
      ctx.fillStyle = vgrad(ctx, -54, 0, '#f6ece6', '#e2cfc6'); ctx.fillRect(cx - 2.2, -54, 4.4, 54);
      ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(cx + 0.8, -54, 1.2, 54);
      ctx.fillStyle = '#f9f2ec'; ctx.fillRect(cx - 3, -56, 6, 2.2); ctx.fillRect(cx - 3, -1.6, 6, 1.6);
    }
    // entablature & triangular pediment
    ctx.fillStyle = '#f3e3dc'; ctx.fillRect(fx - 1, -62, fw + 2, 6);
    text(ctx, 'SAGRADO CORAZÓN DE JESÚS', 0, -59, 3.2, '#8b4a45');
    ctx.fillStyle = '#f1d4cf'; ctx.beginPath(); ctx.moveTo(fx - 2, -62); ctx.lineTo(0, -78); ctx.lineTo(fx + fw + 2, -62); ctx.fill();
    ctx.strokeStyle = '#f9efe9'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(fx - 2, -62); ctx.lineTo(0, -78); ctx.lineTo(fx + fw + 2, -62); ctx.stroke();
    // sacred heart relief
    ctx.fillStyle = '#c2413c'; ctx.beginPath(); ctx.moveTo(0, -65.5); ctx.bezierCurveTo(-4, -69, -3.5, -72.5, 0, -70.5); ctx.bezierCurveTo(3.5, -72.5, 4, -69, 0, -65.5); ctx.fill();
    ctx.fillStyle = '#f2c14e'; ctx.fillRect(-0.3, -74, 0.6, 3);
    // door & windows
    woodDoor(ctx, -6, -28, 12, 28, '#5a3320', true, '#f6e9e2');
    archWindow(ctx, -4, -48, 8, 14, '#f6e9e2', '#3a3440');
    for (const wx of [-18, 14]) archWindow(ctx, wx, -36, 4, 10, '#f6e9e2', '#3a3440');
    // twin towers
    for (const tx of [fx - 7, fx + fw + 7]) bellTower(ctx, tx, 0, 15, 108, pink, 2);
    // steps
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#e9dcd2' : '#f5ece4'; ctx.fillRect(fx - 4 + i * 2, -1 + i * 1.2 - 3, fw + 8 - i * 4, 1.4); }
  },
};

// Templo de las Monjas — austere stone church with espadaña and convent wall
SPRITES.monjas = {
  draw(ctx, s) {
    const w = s.fw, d = s.fd;
    shadowBlob(ctx, 6, -1, w * 0.55, 6);
    naveRoof(ctx, 0, -50, 44, d - 50, '#a9573d');
    const stone = '#c9ae8a';
    ctx.fillStyle = vgrad(ctx, -52, 0, shade(stone, 0.08), shade(stone, -0.12)); ctx.fillRect(-22, -52, 44, 52);
    ctx.strokeStyle = 'rgba(90,70,50,0.28)'; ctx.lineWidth = 0.4;
    for (let y = -50; y < 0; y += 2.8) for (let x = -22 + ((y / 2.8) & 1) * 3; x < 22; x += 6) { ctx.strokeRect(x, y, 6, 2.8); }
    woodDoor(ctx, -6, -24, 12, 24, '#4e2e1a', true, '#b99a73');
    // alfiz and window
    ctx.strokeStyle = '#a88a64'; ctx.lineWidth = 1; ctx.strokeRect(-10, -30, 20, 30);
    archWindow(ctx, -3, -44, 6, 9, '#b99a73', '#2b2f33');
    // espadaña (bell gable) with 3 bells
    ctx.fillStyle = stone; ctx.beginPath(); ctx.moveTo(-16, -52); ctx.lineTo(-16, -62); ctx.quadraticCurveTo(0, -74, 16, -62); ctx.lineTo(16, -52); ctx.fill();
    for (const bx of [-8, 0, 8]) { archWindow(ctx, bx - 2.5, -64 + (bx === 0 ? -3 : 0), 5, 7, '#b99a73', '#1c1e20'); ctx.fillStyle = '#8b6a2f'; ctx.beginPath(); ctx.arc(bx, -58.5 + (bx === 0 ? -3 : 0), 1.4, Math.PI, 0); ctx.fill(); }
    cross(ctx, 0, -70, 6);
    // convent wing (whitewashed) to the side
    wallFace(ctx, 22, -30, w / 2 - 22, 30, '#f2ece0', '#8e2f24', 6);
    for (let i = 26; i < w / 2 - 6; i += 9) rectWindow(ctx, i, -22, 4, 8);
    wallFace(ctx, -w / 2, -26, w / 2 - 22, 26, '#f2ece0', '#8e2f24', 6);
    roofTop(ctx, 22, -d + 4, w / 2 - 22, d - 34, '#b45e43', true);
    roofTop(ctx, -w / 2, -d + 4, w / 2 - 22, d - 30, '#b45e43', true);
  },
};

// Biblioteca Pública Gabino Ortiz — former temple, dome, monumental bronze door
SPRITES.biblioteca = {
  draw(ctx, s) {
    const w = s.fw, d = s.fd;
    shadowBlob(ctx, 6, -1, w * 0.55, 6);
    naveRoof(ctx, 0, -60, 52, d - 60, '#b8664a');
    dome(ctx, 0, -d + 30, 15, '#e6d8bf');
    roofTop(ctx, 26, -d + 20, w / 2 - 26, d - 46, '#b45e43', true);
    roofTop(ctx, -w / 2, -d + 20, w / 2 - 26, d - 46, '#b45e43', true);
    const stone = '#dcc7a6';
    ctx.fillStyle = vgrad(ctx, -60, 0, shade(stone, 0.05), shade(stone, -0.12)); ctx.fillRect(-26, -60, 52, 60);
    ctx.strokeStyle = 'rgba(110,85,60,0.22)'; ctx.lineWidth = 0.4;
    for (let y = -58; y < 0; y += 3) { ctx.beginPath(); ctx.moveTo(-26, y); ctx.lineTo(26, y); ctx.stroke(); }
    // bronze door with relief panels
    ctx.fillStyle = '#c9b08a'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-10, -26); ctx.arc(0, -26, 10, Math.PI, 0); ctx.lineTo(10, 0); ctx.fill();
    const g = ctx.createLinearGradient(-8, -34, 8, 0); g.addColorStop(0, '#b0823f'); g.addColorStop(0.5, '#7b5626'); g.addColorStop(1, '#5a3d1a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-8, -26); ctx.arc(0, -26, 8, Math.PI, 0); ctx.lineTo(8, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,150,0.45)'; ctx.lineWidth = 0.4;
    for (let yy = -24; yy < -1; yy += 5.5) for (const xx of [-7, 0.5]) ctx.strokeRect(xx, yy, 6.5, 4.8);
    ctx.fillStyle = 'rgba(255,230,160,0.35)';
    for (let yy = -23; yy < -1; yy += 5.5) for (const xx of [-5.2, 2.3]) { ctx.beginPath(); ctx.arc(xx + 1.5, yy + 1.8, 1.1, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#3b2a15'; ctx.fillRect(-0.3, -34, 0.6, 34);
    // coro window & gable
    archWindow(ctx, -4, -52, 8, 11, '#c9b08a', '#2b3440');
    ctx.fillStyle = stone; ctx.beginPath(); ctx.moveTo(-26, -60); ctx.lineTo(0, -72); ctx.lineTo(26, -60); ctx.fill();
    cornice(ctx, -26, -60, 52, '#c9b08a');
    plaque(ctx, -21, -40, 42, 4.5, 'BIBLIOTECA PÚBLICA GABINO ORTIZ', '#3e3226', '#f0dca8');
    // side low wing & garden wall
    wallFace(ctx, 26, -26, w / 2 - 26, 26, '#f3ede1', '#8e2f24', 6);
    wallFace(ctx, -w / 2, -26, w / 2 - 26, 26, '#f3ede1', '#8e2f24', 6);
    for (const wx of [32, -w / 2 + 6]) rectWindow(ctx, wx, -20, 5, 9);
  },
};

// Casa de la Cultura "Libertador Miguel Hidalgo" — the old Cine Hidalgo
SPRITES.casacultura = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 40, roof: '#c9c1b3', wall: '#f3ede0' });
    const { x, w } = b;
    // stepped art-deco parapet of the old cinema
    ctx.fillStyle = '#f3ede0';
    ctx.fillRect(-20, -48, 40, 8); ctx.fillRect(-12, -54, 24, 6);
    cornice(ctx, -20, -48, 40, '#d9c2a3'); cornice(ctx, -12, -54, 24, '#d9c2a3');
    plaque(ctx, -26, -38, 52, 6, 'CASA DE LA CULTURA', '#6c2a24', '#f6e7c7');
    text(ctx, '"LIBERTADOR MIGUEL HIDALGO"', 0, -29.5, 2.6, '#6c2a24');
    // three big doors
    for (const dx of [-16, -4, 8]) woodDoor(ctx, dx, -24, 8, 24, '#6b3f22', true);
    for (const wx of [x + 6, x + w - 14]) rectWindow(ctx, wx, -26, 8, 12);
    // bulletin board with workshops
    ctx.fillStyle = '#35523f'; ctx.fillRect(x + w - 26, -22, 9, 12);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#f6f1e6', '#f3d36b', '#f2a9a0', '#a9d6f2'][i]; ctx.fillRect(x + w - 25 + (i % 2) * 4, -21 + Math.floor(i / 2) * 5.5, 3.4, 4.6); }
  },
};

// Portal (arcade) for a block edge facing the plaza.
SPRITES.portal = {
  draw(ctx, s) {
    const w = s.fw, d = s.fd;
    const blue = s.blue;
    ctx.fillStyle = 'rgba(20,20,40,0.2)'; ctx.fillRect(-w / 2 + 4, -2, w, 5);
    roofTop(ctx, -w / 2, -d, w, d - 38, '#b0583d', true);
    const wall = blue ? '#2e6fb3' : '#f4efe4';
    wallFace(ctx, -w / 2, -38, w, 16, wall, null);
    // upper windows
    for (let i = -w / 2 + 6; i < w / 2 - 6; i += 12) {
      rectWindow(ctx, i, -35, 5, 9, blue ? '#e8f0f7' : '#d9c2a3', '#2c3942', false);
      ctx.fillStyle = blue ? '#f2f6fa' : '#6b4526'; ctx.fillRect(i - 1.4, -35, 1.3, 9); ctx.fillRect(i + 5.1, -35, 1.3, 9);
    }
    cornice(ctx, -w / 2, -38, w, blue ? '#e7eef6' : '#d9c2a3');
    const n = Math.max(3, Math.round(w / 12));
    arcade(ctx, -w / 2, -22, w, 22, n, {
      stone: blue ? '#3d7fc4' : '#d9c2a3', inner: '#3a2e25', back: blue ? '#e9f0f6' : '#efe6d4',
      shops: s.shops || ['#e8b04b', '#d4553d', '#5aa0d8', '#6ec07a'],
    });
    if (s.sign) plaque(ctx, -s.sign.length * 1.1, -46, s.sign.length * 2.2, 5, s.sign, blue ? '#f4f7fb' : '#3f3a33', blue ? '#1f4f8a' : '#f1e2b8');
    if (blue) { ctx.fillStyle = '#f4f7fb'; ctx.fillRect(-w / 2, -24, w, 1.6); }
  },
};

// Kiosco of the Jardín Zaragoza — octagonal on a raised cantera base with stairs,
// slender iron columns, ornamental frieze and a lead-grey cupola.
SPRITES.kiosco = {
  draw(ctx, s) {
    const R = 30;
    shadowBlob(ctx, 5, -2, R + 6, 12, 0.28);
    // base platform (octagon, seen in 3/4)
    const base = '#d8bd9c';
    ctx.fillStyle = shade(base, -0.25);
    oct(ctx, 0, -8, R + 2, (R + 2) * 0.5); ctx.fill();
    ctx.fillRect(-(R + 2) * 0.92, -8, (R + 2) * 1.84, 8);
    ctx.fillStyle = base; oct(ctx, 0, -10, R + 2, (R + 2) * 0.5); ctx.fill();
    // balustrade on the base
    ctx.fillStyle = '#efe4d2';
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2; const px = Math.cos(ang) * R, py = -10 + Math.sin(ang) * R * 0.5;
      if (Math.sin(ang) > 0.2 && Math.abs(Math.cos(ang)) < 0.35) continue; // stair opening at front
      ctx.fillRect(px - 0.6, py - 4, 1.2, 4);
    }
    // front stairs
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#cdb291' : '#e3cbab'; ctx.fillRect(-8 + i, -1 - i * 2.2 + 2, 16 - i * 2, 2.2); }
    // back columns (drawn first), roof, then front columns
    const colH = 30, top = -10 - colH;
    const cols = [];
    for (let a = 0; a < 8; a++) { const ang = (a / 8) * Math.PI * 2 + Math.PI / 8; cols.push([Math.cos(ang) * (R - 4), -10 + Math.sin(ang) * (R - 4) * 0.5, Math.sin(ang)]); }
    const drawCol = ([px, py]) => {
      ctx.fillStyle = '#2d3a3f'; ctx.fillRect(px - 0.9, py - colH, 1.8, colH);
      ctx.fillStyle = '#5c6d74'; ctx.fillRect(px - 0.9, py - colH, 0.6, colH);
      ctx.fillStyle = '#2d3a3f'; ctx.fillRect(px - 1.8, py - colH, 3.6, 1.4); ctx.fillRect(px - 1.6, py - 1.4, 3.2, 1.4);
    };
    cols.filter(c => c[2] < 0).forEach(drawCol);
    // inner floor shade & back railing
    ctx.fillStyle = 'rgba(40,30,20,0.25)'; oct(ctx, 0, -10, R - 5, (R - 5) * 0.5); ctx.fill();
    cols.filter(c => c[2] >= 0).forEach(drawCol);
    // iron railing between columns (front)
    ctx.strokeStyle = '#2d3a3f'; ctx.lineWidth = 0.4;
    for (let a = 0; a < 40; a++) {
      const ang = (a / 40) * Math.PI; const px = Math.cos(ang) * (R - 4), py = -10 + Math.sin(ang) * (R - 4) * 0.5;
      if (Math.abs(px) < 7) continue;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 6); ctx.stroke();
    }
    ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(0, -16, R - 4, (R - 4) * 0.5, 0, 0.25, Math.PI - 0.25); ctx.stroke();
    // frieze
    ctx.fillStyle = '#e9e1d3'; oct(ctx, 0, top, R, R * 0.5); ctx.fill();
    ctx.fillStyle = '#2d3a3f'; ctx.fillRect(-R * 0.93, top, R * 1.86, 3.2);
    ctx.fillStyle = '#c9a54a';
    for (let i = -R * 0.9; i < R * 0.9; i += 2.4) { ctx.beginPath(); ctx.arc(i, top + 3.2, 0.9, 0, Math.PI); ctx.fill(); }
    // cupola
    const g = ctx.createRadialGradient(-10, top - 18, 2, 0, top - 6, R * 1.1);
    g.addColorStop(0, '#9fb1b5'); g.addColorStop(0.55, '#5f777c'); g.addColorStop(1, '#34474c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-R * 0.95, top); ctx.bezierCurveTo(-R * 0.9, top - 16, -8, top - 24, 0, top - 26); ctx.bezierCurveTo(8, top - 24, R * 0.9, top - 16, R * 0.95, top); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,30,35,0.4)'; ctx.lineWidth = 0.5;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * R * 0.3, top); ctx.quadraticCurveTo(i * R * 0.12, top - 18, 0, top - 26); ctx.stroke(); }
    // lantern and finial
    ctx.fillStyle = '#e9e1d3'; ctx.fillRect(-3, top - 32, 6, 6);
    ctx.fillStyle = '#2d3a3f'; ctx.fillRect(-1, top - 31, 2, 4);
    ctx.fillStyle = '#5f777c'; ctx.beginPath(); ctx.arc(0, top - 32, 3.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(-0.4, top - 40, 0.8, 5); ctx.beginPath(); ctx.arc(0, top - 40, 1, 0, 7); ctx.fill();
  },
};
function oct(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath();
}

// Fuente de la Aguadora (Federico Canessi): a baldachin of stone over the figure
// of a woman carrying a cántaro on her shoulder, over a basin.
SPRITES.aguadora = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -2, 26, 9, 0.28);
    const stone = '#cdb08c';
    // basin
    ctx.fillStyle = shade(stone, -0.25); ctx.beginPath(); ctx.ellipse(0, -5, 24, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = stone; ctx.beginPath(); ctx.ellipse(0, -7, 24, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4b95b8'; ctx.beginPath(); ctx.ellipse(0, -7.5, 21, 8.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-6, -10, 8, 2, 0, 0, 7); ctx.fill();
    // four pillars of the baldachin (back two first)
    const pil = (x, y) => { ctx.fillStyle = vgrad(ctx, y - 40, y, shade(stone, 0.1), shade(stone, -0.15)); ctx.fillRect(x - 2, y - 40, 4, 40); ctx.fillStyle = shade(stone, -0.2); ctx.fillRect(x - 2.6, y - 2, 5.2, 2); ctx.fillRect(x - 2.6, y - 41, 5.2, 2); };
    pil(-13, -12); pil(13, -12);
    // pedestal and statue
    ctx.fillStyle = shade(stone, -0.1); ctx.fillRect(-4, -18, 8, 10);
    ctx.fillStyle = stone; ctx.fillRect(-4.8, -19, 9.6, 1.6);
    statueAguadora(ctx, 0, -19);
    pil(-15, -3); pil(15, -3);
    // canopy with small cupola
    const top = -45;
    ctx.fillStyle = shade(stone, -0.2); ctx.fillRect(-19, top - 1, 38, 5);
    ctx.fillStyle = stone; ctx.fillRect(-18, top - 5, 36, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-18, top - 5, 36, 1);
    ctx.fillStyle = vgrad(ctx, top - 18, top - 5, shade(stone, 0.15), shade(stone, -0.1));
    ctx.beginPath(); ctx.moveTo(-15, top - 5); ctx.quadraticCurveTo(-14, top - 17, 0, top - 19); ctx.quadraticCurveTo(14, top - 17, 15, top - 5); ctx.fill();
    ctx.fillStyle = stone; ctx.beginPath(); ctx.arc(0, top - 21, 2.4, 0, 7); ctx.fill();
    for (const px of [-17, 17]) { ctx.beginPath(); ctx.arc(px, top - 7, 1.5, 0, 7); ctx.fill(); }
  },
  anim(ctx, s, t) {
    // water pouring from the cántaro
    ctx.strokeStyle = 'rgba(200,235,255,0.75)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(4.2, -35); ctx.quadraticCurveTo(7, -30, 7.5, -9 + Math.sin(t * 8) * 0.3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2; ctx.beginPath(); ctx.ellipse(7.5, -8.5, 1 + ((a % 2) * 2), 0.5 + (a % 2) * 0.8, 0, 0, 7); ctx.globalAlpha = 1 - (a % 2) / 2; ctx.fill(); }
    ctx.globalAlpha = 1;
  },
};
function statueAguadora(ctx, x, y) {
  // stylised stone woman, cántaro on her right shoulder
  const c = '#bfa889', d = '#9d8668';
  ctx.fillStyle = d; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x - 3.5, y - 10, x - 2.2, y - 15); ctx.lineTo(x + 2.2, y - 15); ctx.quadraticCurveTo(x + 3.5, y - 10, x + 4, y); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 3.2, y); ctx.quadraticCurveTo(x - 3, y - 10, x - 1.8, y - 15); ctx.lineTo(x + 1, y - 15); ctx.quadraticCurveTo(x + 1.5, y - 9, x + 1, y); ctx.fill();
  ctx.fillStyle = c; ctx.fillRect(x - 2.2, y - 21, 4.4, 7); // torso
  ctx.beginPath(); ctx.arc(x - 0.4, y - 23.5, 2.2, 0, 7); ctx.fill(); // head
  ctx.fillStyle = d; ctx.beginPath(); ctx.arc(x - 0.8, y - 24.3, 2.2, Math.PI, 0); ctx.fill(); // hair
  ctx.strokeStyle = c; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x + 1.8, y - 20); ctx.lineTo(x + 3.2, y - 24); ctx.stroke(); // raised arm
  ctx.beginPath(); ctx.moveTo(x - 2, y - 20); ctx.quadraticCurveTo(x - 3.6, y - 16, x - 2.4, y - 14); ctx.stroke();
  // cántaro
  ctx.fillStyle = '#b8997a'; ctx.beginPath(); ctx.ellipse(x + 3.2, y - 27, 2.6, 3, -0.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#9d8668'; ctx.fillRect(x + 3.2, y - 31, 1.8, 1.6);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2.4, y - 28, 0.8, 1.4, -0.5, 0, 7); ctx.fill();
}

// The central fountain of the garden — round basin, two tiers and jets.
SPRITES.fuente = {
  draw(ctx, s) {
    shadowBlob(ctx, 3, -1, 24, 9, 0.25);
    const stone = '#d6bd9d';
    ctx.fillStyle = shade(stone, -0.3); ctx.beginPath(); ctx.ellipse(0, -4, 22, 9.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = stone; ctx.beginPath(); ctx.ellipse(0, -6, 22, 9.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4b95b8'; ctx.beginPath(); ctx.ellipse(0, -6.5, 19, 7.8, 0, 0, 7); ctx.fill();
    // octagonal decoration on the rim
    ctx.fillStyle = '#e8d7bf'; for (let a = 0; a < 12; a++) { const an = (a / 12) * 6.283; ctx.beginPath(); ctx.arc(Math.cos(an) * 20.5, -6 + Math.sin(an) * 8.6, 0.8, 0, 7); ctx.fill(); }
    // column and tiers
    ctx.fillStyle = vgrad(ctx, -26, -6, shade(stone, 0.1), shade(stone, -0.2)); ctx.fillRect(-2, -26, 4, 20);
    ctx.fillStyle = shade(stone, -0.2); ctx.beginPath(); ctx.ellipse(0, -18, 10, 3.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = stone; ctx.beginPath(); ctx.ellipse(0, -19, 10, 3.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5aa5c6'; ctx.beginPath(); ctx.ellipse(0, -19.3, 8, 2.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = shade(stone, -0.2); ctx.beginPath(); ctx.ellipse(0, -28, 5, 2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = stone; ctx.beginPath(); ctx.ellipse(0, -28.6, 5, 2, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -31, 1.6, 0, 7); ctx.fill();
  },
  anim(ctx, s, t) {
    ctx.strokeStyle = 'rgba(215,240,255,0.7)'; ctx.lineWidth = 0.7;
    const h = 7 + Math.sin(t * 5) * 0.8;
    ctx.beginPath(); ctx.moveTo(0, -32); ctx.quadraticCurveTo(0, -32 - h, 0.3, -32 - h); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2; const ex = Math.cos(a) * 9, ey = -19 + Math.sin(a) * 3.2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 5, -28 + Math.sin(a) * 2); ctx.quadraticCurveTo(Math.cos(a) * 8, -27, ex, ey); ctx.stroke();
      const ex2 = Math.cos(a) * 18, ey2 = -6 + Math.sin(a) * 7;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 9.5, -19 + Math.sin(a) * 3.4); ctx.quadraticCurveTo(Math.cos(a) * 15, -17, ex2, ey2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 6; i++) { const a = t * 2 + i; ctx.beginPath(); ctx.arc(Math.cos(a) * 12, -6 + Math.sin(a * 1.3) * 4.5, 0.8, 0, 7); ctx.fill(); }
  },
};

// Portada del Parque Juárez + escalinata
SPRITES.portadaJuarez = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -1, 30, 6);
    const stone = '#d4b894';
    for (const px of [-22, 14]) {
      ctx.fillStyle = vgrad(ctx, -44, 0, shade(stone, 0.1), shade(stone, -0.15)); ctx.fillRect(px, -44, 8, 44);
      ctx.fillStyle = shade(stone, -0.2); ctx.fillRect(px - 1, -46, 10, 2.4); ctx.fillRect(px - 1, -2.4, 10, 2.4);
      ctx.strokeStyle = 'rgba(100,80,55,0.3)'; ctx.lineWidth = 0.4;
      for (let y = -42; y < 0; y += 4) ctx.strokeRect(px, y, 8, 4);
    }
    // arch
    ctx.fillStyle = stone;
    ctx.beginPath(); ctx.moveTo(-22, -46); ctx.lineTo(22, -46); ctx.lineTo(22, -36); ctx.lineTo(14, -36); ctx.arc(0, -30, 14, -0.4, Math.PI + 0.4, true); ctx.lineTo(-14, -36); ctx.lineTo(-22, -36); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(stone, 0.1); ctx.fillRect(-24, -52, 48, 6);
    cornice(ctx, -24, -52, 48, shade(stone, -0.05));
    plaque(ctx, -16, -51, 32, 4.4, 'PARQUE JUÁREZ', '#3d3325', '#f3e1b0');
    // urns on top
    for (const ux of [-20, 20]) { ctx.fillStyle = shade(stone, -0.05); ctx.beginPath(); ctx.ellipse(ux, -55, 2.4, 3, 0, 0, 7); ctx.fill(); ctx.fillRect(ux - 1.5, -60, 3, 2); }
  },
};

// Monumento a Benito Juárez — bronze figure on a pyramidal stone base
SPRITES.monJuarez = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -1, 20, 7);
    const stone = '#c6b095';
    ctx.fillStyle = shade(stone, -0.2); ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-8, -30); ctx.lineTo(8, -30); ctx.lineTo(18, 0); ctx.fill();
    ctx.fillStyle = stone; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-8, -30); ctx.lineTo(4, -30); ctx.lineTo(6, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,50,0.3)'; ctx.lineWidth = 0.4;
    for (let y = -27; y < 0; y += 3) { const k = (y + 30) / 30; ctx.beginPath(); ctx.moveTo(-8 - k * 10, y); ctx.lineTo(8 + k * 10, y); ctx.stroke(); }
    plaque(ctx, -8, -16, 16, 5, 'JUÁREZ', '#5b4a32', '#efd79a');
    bronzeFigure(ctx, 0, -30, 1.25, 'juarez');
  },
};

function bronzeFigure(ctx, x, y, k, who) {
  const b0 = '#5a4a32', b1 = '#7d6a45', b2 = '#a18c5b';
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  // legs & long coat
  ctx.fillStyle = b0; ctx.fillRect(-2.2, -9, 1.8, 9); ctx.fillRect(0.4, -9, 1.8, 9);
  ctx.fillStyle = b1; ctx.beginPath(); ctx.moveTo(-3.6, -7); ctx.lineTo(-3, -18); ctx.lineTo(3, -18); ctx.lineTo(3.6, -7); ctx.fill();
  ctx.fillStyle = b2; ctx.fillRect(-3, -18, 1.2, 10);
  // arms
  if (who === 'cardenas') { ctx.fillStyle = b1; ctx.fillRect(3, -17.5, 1.4, 7); ctx.fillRect(-4.4, -17.5, 1.4, 7); }
  else { ctx.fillStyle = b1; ctx.beginPath(); ctx.moveTo(3, -17); ctx.lineTo(6.5, -19.5); ctx.lineTo(7, -18.4); ctx.lineTo(3.2, -15.5); ctx.fill(); ctx.fillRect(-4.2, -17, 1.4, 7); }
  // head
  ctx.fillStyle = b1; ctx.beginPath(); ctx.arc(0, -20.6, 2.4, 0, 7); ctx.fill();
  ctx.fillStyle = b0; ctx.beginPath(); ctx.arc(0, -21.4, 2.4, Math.PI * 1.05, -0.05); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,190,0.35)'; ctx.fillRect(-1.6, -21, 0.7, 1.8);
  ctx.restore();
}

// Portada del Estadio "18 de Marzo" — gate with the eagle on top.
SPRITES.portadaEstadio = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -1, 40, 7);
    const stone = '#d9c09c', wall = '#f1ebdf';
    for (const px of [-36, 24]) {
      ctx.fillStyle = vgrad(ctx, -50, 0, shade(stone, 0.1), shade(stone, -0.15)); ctx.fillRect(px, -50, 12, 50);
      ctx.strokeStyle = 'rgba(100,80,55,0.3)'; ctx.lineWidth = 0.4;
      for (let y = -48; y < 0; y += 4) for (let x = px + ((y / 4) & 1) * 3; x < px + 12; x += 6) ctx.strokeRect(x, y, 6, 4);
      // metal plaques with old maps of Jiquilpan
      ctx.fillStyle = '#7b6440'; ctx.fillRect(px + 2, -30, 8, 10);
      ctx.strokeStyle = '#c9ae6e'; ctx.lineWidth = 0.3; ctx.strokeRect(px + 2.6, -29.4, 6.8, 8.8);
      ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo(px + 3, -28 + i * 1.6); ctx.lineTo(px + 9, -27.5 + i * 1.6); } ctx.stroke();
    }
    // lintel with the name
    ctx.fillStyle = wall; ctx.fillRect(-38, -60, 76, 12);
    cornice(ctx, -38, -60, 76, stone); cornice(ctx, -38, -48, 76, stone);
    text(ctx, 'ESTADIO 18 DE MARZO', 0, -54, 6.2, '#7b2d23', 'Georgia, serif');
    // wrought iron gates
    ctx.strokeStyle = '#24292c'; ctx.lineWidth = 0.6;
    for (let x = -24; x <= 24; x += 2) { ctx.beginPath(); ctx.moveTo(x, -46); ctx.lineTo(x, -1); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-24, -24); ctx.lineTo(24, -24); ctx.moveTo(-24, -40); ctx.lineTo(24, -40); ctx.stroke();
    // plinth for the eagle
    ctx.fillStyle = stone; ctx.fillRect(-7, -66, 14, 6);
    eagle(ctx, 0, -66);
    // quote plaque of Lázaro Cárdenas
    plaque(ctx, -18, -44, 36, 4, '"...LA EXPROPIACIÓN PETROLERA..." L.C.', '#2f3a2f', '#e9dca4');
  },
};
function eagle(ctx, x, y) {
  // Mexican eagle with spread wings (bronze)
  const b0 = '#4f3f26', b1 = '#7b6440', b2 = '#b09560';
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = b1;
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(d * 8, -16, d * 16, -14); ctx.lineTo(d * 13, -11); ctx.lineTo(d * 15, -9.5); ctx.lineTo(d * 11, -8); ctx.lineTo(d * 12.5, -5.5); ctx.lineTo(d * 7, -5); ctx.quadraticCurveTo(d * 3, -3, 0, -3); ctx.fill();
    ctx.strokeStyle = b0; ctx.lineWidth = 0.4;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(d * i * 2, -6); ctx.lineTo(d * (i * 3 + 2), -11 + i * 0.5); ctx.stroke(); }
  }
  ctx.fillStyle = b0; ctx.beginPath(); ctx.ellipse(0, -5, 2.8, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = b2; ctx.beginPath(); ctx.arc(-0.6, -11, 2, 0, 7); ctx.fill();
  ctx.fillStyle = '#d6b04a'; ctx.beginPath(); ctx.moveTo(-2.5, -11.2); ctx.lineTo(-4.5, -10.5); ctx.lineTo(-2.4, -10.2); ctx.fill();
  ctx.fillStyle = b0; ctx.fillRect(-1.5, 0, 3, 1);
  ctx.restore();
}

// Monumento a Lázaro Cárdenas — figure on a tall pedestal
SPRITES.monCardenas = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -1, 16, 6);
    const stone = '#cbb79b';
    ctx.fillStyle = shade(stone, -0.2); ctx.fillRect(-12, -6, 24, 6);
    ctx.fillStyle = stone; ctx.fillRect(-12, -8, 24, 3);
    ctx.fillStyle = vgrad(ctx, -34, -8, shade(stone, 0.1), shade(stone, -0.15)); ctx.fillRect(-7, -34, 14, 26);
    cornice(ctx, -8, -34, 16, shade(stone, -0.05));
    plaque(ctx, -6, -24, 12, 7, 'L.C.', '#4c3d28', '#efd79a');
    text(ctx, '1895-1970', 0, -14, 2.2, '#5b4a32');
    bronzeFigure(ctx, 0, -34, 1.3, 'cardenas');
  },
};

// Obelisco a Rioseco y Ornelas ("el monumento de la botella")
SPRITES.obelisco = {
  draw(ctx, s) {
    shadowBlob(ctx, 5, -1, 18, 7);
    const stone = '#d8c6a8';
    ctx.fillStyle = '#6ea84a'; ctx.beginPath(); ctx.ellipse(0, -3, 26, 11, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#e8e1d2'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = shade(stone, -0.25); ctx.fillRect(-10, -8, 20, 6);
    ctx.fillStyle = stone; ctx.fillRect(-10, -10, 20, 3);
    ctx.fillStyle = shade(stone, -0.1); ctx.fillRect(-6.5, -20, 13, 10);
    cornice(ctx, -7, -20, 14, stone);
    plaque(ctx, -5.5, -17, 11, 4, 'RIOSECO', '#4c3d28', '#efd79a');
    // shaft
    ctx.fillStyle = vgrad(ctx, -84, -20, shade(stone, 0.15), shade(stone, -0.1));
    ctx.beginPath(); ctx.moveTo(-4.5, -20); ctx.lineTo(-3, -80); ctx.lineTo(0, -86); ctx.lineTo(3, -80); ctx.lineTo(4.5, -20); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.moveTo(1, -20); ctx.lineTo(1, -82); ctx.lineTo(3, -80); ctx.lineTo(4.5, -20); ctx.fill();
  },
};

// Glorieta de entrada: "JIQUILPAN" + "Pueblo Mágico" in the colourful style
SPRITES.glorietaSign = {
  draw(ctx, s) {
    // grass island of the roundabout (drawn as the sprite's base so it reads round)
    ctx.fillStyle = '#e9e3d4'; ctx.beginPath(); ctx.ellipse(0, -30, 40, 34, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6ea84a'; ctx.beginPath(); ctx.ellipse(0, -30, 37.5, 31.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(2, -26, 34, 26, 0, 0, 7); ctx.fill();
    for (let a = 0; a < 30; a++) { const an = (a / 30) * 6.283; ctx.fillStyle = ['#e84a6a', '#f2a93b', '#f7e36a', '#b44ad9'][a % 4]; ctx.beginPath(); ctx.arc(Math.cos(an) * 32, -30 + Math.sin(an) * 26, 1.5, 0, 7); ctx.fill(); }
    shadowBlob(ctx, 5, -8, 32, 5);
    // base
    ctx.fillStyle = '#a8763d'; ctx.fillRect(-34, -14, 68, 8);
    ctx.fillStyle = '#c99554'; ctx.fillRect(-34, -16, 68, 3);
    // multicolour letters JIQUILPAN
    const L = 'JIQUILPAN';
    const cols = ['#e5007e', '#ff8a00', '#00a0e3', '#8cc63f', '#ffd400', '#e5007e', '#7b3fa0', '#00a99d', '#ff4d3d'];
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < L.length; i++) {
      const x = -30 + i * 7.5;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillText(L[i], x + 1, -16 + 1);
      ctx.fillStyle = shade(cols[i], -0.35); ctx.fillText(L[i], x + 0.6, -16 + 0.6);
      ctx.fillStyle = cols[i]; ctx.fillText(L[i], x, -16);
    }
    // "Pueblo Mágico" in script
    ctx.font = 'italic bold 6.5px Georgia, serif'; ctx.fillStyle = '#fff'; ctx.fillText('Pueblo Mágico', 0, -8.2);
    ctx.fillStyle = '#e5007e'; ctx.beginPath(); ctx.arc(-24, -9.5, 1.3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(24, -9.5, 1.3, 0, 7); ctx.fill();
  },
};

// Three-dimensional white letters JIQUILPAN by the entrance
SPRITES.whiteLetters = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -1, 36, 5);
    ctx.font = 'bold 14px "Arial Black", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (let i = 3; i > 0; i--) { ctx.fillStyle = shade('#e9e9e4', -0.08 * i); ctx.fillText('JIQUILPAN', i * 0.5, -2 + i * 0.5); }
    ctx.fillStyle = '#ffffff'; ctx.fillText('JIQUILPAN', 0, -2);
  },
};

// Rooster fountains on the grass island
SPRITES.gallo = {
  draw(ctx, s) {
    shadowBlob(ctx, 3, -1, 13, 5);
    ctx.fillStyle = '#b59b7a'; ctx.beginPath(); ctx.ellipse(0, -3, 13, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4b95b8'; ctx.beginPath(); ctx.ellipse(0, -3.6, 11, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b59b7a'; ctx.fillRect(-3, -12, 6, 8);
    const k = s.flip ? -1 : 1;
    ctx.save(); ctx.translate(0, -12); ctx.scale(k, 1);
    // rooster body
    ctx.fillStyle = '#b8401f'; ctx.beginPath(); ctx.ellipse(0, -6, 6, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1f3d2a'; // tail feathers
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-4, -8); ctx.quadraticCurveTo(-10 - i, -16 + i * 2, -8 + i * 0.6, -3 + i * 0.3); ctx.lineTo(-4, -6); ctx.fill(); }
    ctx.fillStyle = '#d98a2b'; ctx.beginPath(); ctx.ellipse(4, -11, 2.6, 3.4, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#d21f1f'; ctx.beginPath(); ctx.arc(4.5, -14.6, 1.4, 0, 7); ctx.arc(3, -14.2, 1.1, 0, 7); ctx.fill();
    ctx.fillRect(6, -11.5, 1, 2.2);
    ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.moveTo(6.4, -12.5); ctx.lineTo(8.6, -12); ctx.lineTo(6.4, -11.4); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(5, -12.4, 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#d98a2b'; ctx.fillRect(-1, -2, 0.8, 3); ctx.fillRect(1, -2, 0.8, 3);
    ctx.restore();
  },
  anim(ctx, s, t) {
    const k = s.flip ? -1 : 1;
    ctx.strokeStyle = 'rgba(210,238,255,0.75)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(k * 7, -24); ctx.quadraticCurveTo(k * 11, -24 - Math.sin(t * 6) * 0.4, k * 10, -4); ctx.stroke();
  },
};

// Hotel Palmira with its neon sign
SPRITES.palmira = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 44, roof: '#c9c3b8', wall: '#efe4cf', band: '#7b4a2e' });
    const { x, w } = b;
    for (let fl = 0; fl < 2; fl++) for (let i = x + 6; i < x + w - 8; i += 11) {
      if (fl === 0 && Math.abs(i + 3) < 10) continue;
      rectWindow(ctx, i, -40 + fl * 20, 6, 9, '#d8c7a8', '#35464f', false);
      ctx.fillStyle = '#7b4a2e'; ctx.fillRect(i - 0.6, -31 + fl * 20, 7.2, 1);
    }
    ctx.fillStyle = '#2d2622'; ctx.fillRect(-7, -16, 14, 16);
    ctx.fillStyle = 'rgba(255,210,140,0.45)'; ctx.fillRect(-6, -15, 12, 14);
    ctx.fillStyle = '#7b4a2e'; ctx.fillRect(-10, -19, 20, 3);
    // neon sign pole to the side
    const sx = x + w - 4;
    ctx.fillStyle = '#3b3b40'; ctx.fillRect(sx - 1, -70, 2, 70);
    ctx.fillStyle = '#1b1b24'; roundRect(ctx, sx - 16, -84, 32, 22, 3); ctx.fill();
  },
  anim(ctx, s, t, night) {
    const sx = s.fw / 2 - 4;
    const on = night ? (Math.sin(t * 13) > -0.95 ? 1 : 0.3) : 0.35;
    ctx.save();
    ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = night ? 8 : 0;
    ctx.fillStyle = rgba('#ff5fb0', 0.35 + on * 0.65);
    ctx.font = 'italic bold 7px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Palmira', sx, -78);
    ctx.shadowColor = '#4dffb5';
    ctx.fillStyle = rgba('#58ffc0', 0.35 + on * 0.65); ctx.font = 'bold 4px sans-serif'; ctx.fillText('HOTEL', sx, -70.5);
    // neon palm
    ctx.strokeStyle = rgba('#58ffc0', 0.35 + on * 0.65); ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(sx - 12, -65); ctx.quadraticCurveTo(sx - 11, -72, sx - 10, -80);
    for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.6; ctx.moveTo(sx - 10, -80); ctx.quadraticCurveTo(sx - 10 + Math.cos(a) * 3, -80 + Math.sin(a) * 4, sx - 10 + Math.cos(a) * 5, -80 + Math.sin(a) * 2 + 2); }
    ctx.stroke();
    ctx.restore();
  },
};

// OXXO
SPRITES.oxxo = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 30, roof: '#d0cbc2', wall: '#f5f3ee', band: null });
    const { x, w } = b;
    ctx.fillStyle = '#e11b22'; ctx.fillRect(x, -30, w, 10);
    ctx.fillStyle = '#ffd200'; ctx.fillRect(x, -21, w, 1.4); ctx.fillRect(x, -30, w, 1.2);
    // logo box
    ctx.fillStyle = '#ffd200'; roundRect(ctx, -12, -29, 24, 8, 1.5); ctx.fill();
    ctx.fillStyle = '#e11b22'; roundRect(ctx, -11.2, -28.2, 22.4, 6.4, 1.2); ctx.fill();
    text(ctx, 'OXXO', 0, -24.9, 5.6, '#ffffff', 'Arial Black, Arial, sans-serif');
    // glass front
    ctx.fillStyle = '#2f4450'; ctx.fillRect(x + 3, -19, w - 6, 19);
    ctx.fillStyle = 'rgba(190,225,245,0.35)'; for (let i = x + 4; i < x + w - 4; i += 8) ctx.fillRect(i, -18, 3, 17);
    ctx.fillStyle = '#ccc'; for (let i = x + 3; i < x + w - 3; i += 8) ctx.fillRect(i, -19, 0.6, 19);
    ctx.fillStyle = '#ffd200'; ctx.fillRect(x + 6, -10, 8, 3); ctx.fillStyle = '#e11b22'; ctx.fillRect(x + w - 16, -12, 10, 4);
  },
};

// PEMEX station
SPRITES.pemex = {
  draw(ctx, s) {
    const w = s.fw;
    shadowBlob(ctx, 4, -1, w * 0.5, 6, 0.18);
    // pumps
    for (const px of [-w / 4, w / 4]) {
      ctx.fillStyle = '#d9d9d9'; ctx.fillRect(px - 6, -3, 12, 3);
      ctx.fillStyle = '#f3f3f3'; ctx.fillRect(px - 3, -16, 6, 13);
      ctx.fillStyle = '#00843d'; ctx.fillRect(px - 3, -16, 6, 3);
      ctx.fillStyle = '#1c1c1c'; ctx.fillRect(px - 2, -12, 4, 2.5);
      ctx.fillStyle = '#e4002b'; ctx.fillRect(px - 3, -6, 6, 1.2);
    }
    // canopy on columns
    for (const px of [-w / 2 + 8, w / 2 - 8]) { ctx.fillStyle = '#e8e8e8'; ctx.fillRect(px - 1.2, -34, 2.4, 34); }
    ctx.fillStyle = '#f1f1f1'; ctx.fillRect(-w / 2, -44, w, 8);
    ctx.fillStyle = '#00843d'; ctx.fillRect(-w / 2, -38, w, 3.2);
    ctx.fillStyle = '#e4002b'; ctx.fillRect(-w / 2, -35.4, w, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-w / 2, -36, w, 1);
    // PEMEX totem
    const tx = w / 2 - 2;
    ctx.fillStyle = '#e9e9e9'; ctx.fillRect(tx - 4, -60, 8, 60);
    ctx.fillStyle = '#00843d'; ctx.fillRect(tx - 4, -60, 8, 10);
    text(ctx, 'PEMEX', tx, -55, 2.6, '#ffffff', 'Arial Black, Arial, sans-serif');
    ctx.fillStyle = '#1c1c1c'; for (let i = 0; i < 3; i++) { ctx.fillRect(tx - 3.2, -47 + i * 5, 6.4, 4); }
    ctx.fillStyle = '#6fe06f'; text(ctx, '24.39', tx, -45, 2.2, '#8dff8d', 'monospace');
    text(ctx, '25.89', tx, -40, 2.2, '#ff8d8d', 'monospace');
    text(ctx, '26.49', tx, -35, 2.2, '#f0f0f0', 'monospace');
  },
};

// Hospital (two variants)
SPRITES.hospital = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 40, roof: '#d5d2cc', wall: '#f2f4f2', band: '#2f7f7a' });
    const { x, w } = b;
    for (let fl = 0; fl < 2; fl++) for (let i = x + 5; i < x + w - 6; i += 10) {
      if (fl === 0 && Math.abs(i + 3) < 10) continue;
      rectWindow(ctx, i, -36 + fl * 18, 6, 8, '#dfe6e6', '#3d5561', false);
    }
    ctx.fillStyle = '#e8f0ef'; ctx.fillRect(-12, -22, 24, 4);
    ctx.fillStyle = '#2d3a40'; ctx.fillRect(-8, -17, 16, 17);
    ctx.fillStyle = 'rgba(190,230,240,0.4)'; ctx.fillRect(-7, -16, 6, 16); ctx.fillRect(1, -16, 6, 16);
    plaque(ctx, -w / 2 + 4, -46, w - 8, 5, s.label || 'HOSPITAL', '#2f7f7a', '#ffffff');
    ctx.fillStyle = '#d7263d'; ctx.fillRect(x + w - 12, -44, 6, 2); ctx.fillRect(x + w - 10, -46, 2, 6);
  },
};

// UNAM — Unidad Académica de Estudios Regionales
SPRITES.unam = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 42, roof: '#cfc6b6', wall: '#f3eee4' });
    const { x, w } = b;
    arcade(ctx, x + 4, -24, w - 8, 24, Math.round((w - 8) / 14), { stone: '#d9c2a3', inner: '#3c3027', back: '#f0e8da' });
    for (let i = x + 8; i < x + w - 10; i += 14) { rectWindow(ctx, i, -39, 6, 10, '#d9c2a3', '#344650', false); balcony(ctx, i, -28.2, 6); }
    ctx.fillStyle = '#003d79'; roundRect(ctx, -28, -52, 56, 10, 2); ctx.fill();
    ctx.fillStyle = '#c59d2a'; ctx.fillRect(-28, -43.4, 56, 1.2);
    text(ctx, 'UNAM', -18, -47, 5, '#c59d2a', 'Georgia, serif');
    text(ctx, 'UNIDAD ACADÉMICA DE', 7, -49, 2.4, '#ffffff');
    text(ctx, 'ESTUDIOS REGIONALES', 7, -45.5, 2.4, '#ffffff');
  },
};

// Escuela primaria
SPRITES.escuela = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 30, roof: '#cfc6b6', wall: '#f5e9c9', band: '#2c6e49' });
    const { x, w } = b;
    for (let i = x + 5; i < x + w - 8; i += 10) rectWindow(ctx, i, -24, 7, 9, '#e8dcc0', '#3a4c55');
    plaque(ctx, -24, -30, 48, 5, 'ESC. PRIM. "LÁZARO CÁRDENAS"', '#2c6e49', '#fff8e0');
    ctx.fillStyle = '#6b3f22'; ctx.fillRect(-6, -13, 12, 13);
  },
  anim(ctx, s, t) { flagPole(ctx, -s.fw / 2 + 6, 0, 30, t * 3); },
};

// Mezcalería El Chamacuero — adobe, palm-roof shade, barrels, agave
SPRITES.chamacuero = {
  draw(ctx, s) {
    const w = s.fw;
    shadowBlob(ctx, 4, -1, w * 0.5, 7);
    wallFace(ctx, -w / 2, -26, w, 26, '#c9a27a', '#8c5d3b', 5);
    ctx.strokeStyle = 'rgba(90,60,40,0.3)'; ctx.lineWidth = 0.4;
    for (let y = -24; y < -5; y += 4) for (let x = -w / 2 + ((y / 4) & 1) * 5; x < w / 2; x += 10) ctx.strokeRect(x, y, 10, 4);
    roofTop(ctx, -w / 2, -s.fd, w, s.fd - 26, '#9c5a3c', true);
    woodDoor(ctx, -5, -18, 10, 18, '#5b3a22', false, '#a8825c');
    plaque(ctx, -18, -30, 36, 5.5, 'MEZCAL EL CHAMACUERO', '#3a2616', '#f0cf7a');
    // barrels
    for (const bx of [-w / 2 + 6, w / 2 - 10]) {
      ctx.fillStyle = '#7a4a26'; roundRect(ctx, bx, -9, 7, 9, 2); ctx.fill();
      ctx.fillStyle = '#3b3b3b'; ctx.fillRect(bx, -7.5, 7, 0.8); ctx.fillRect(bx, -2.5, 7, 0.8);
    }
  },
};

// Pajarete corral: shade, table with jarros, wooden fence (fence baked separately)
SPRITES.corralShade = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -1, 26, 8);
    for (const px of [-22, 22]) { ctx.fillStyle = '#6b4a30'; ctx.fillRect(px - 1.2, -26, 2.4, 26); }
    ctx.fillStyle = '#b89a5a'; ctx.beginPath(); ctx.moveTo(-28, -26); ctx.lineTo(28, -26); ctx.lineTo(24, -34); ctx.lineTo(-24, -34); ctx.fill();
    ctx.strokeStyle = '#8c7340'; ctx.lineWidth = 0.4; for (let i = -26; i < 26; i += 2) { ctx.beginPath(); ctx.moveTo(i, -26); ctx.lineTo(i * 0.86, -34); ctx.stroke(); }
    // table with jarros and a bottle of alcohol / chocolate
    ctx.fillStyle = '#7a5434'; ctx.fillRect(-12, -9, 24, 3); ctx.fillRect(-11, -6, 1.6, 6); ctx.fillRect(9.4, -6, 1.6, 6);
    for (let i = -9; i < 9; i += 3.2) { ctx.fillStyle = '#b5623e'; ctx.beginPath(); ctx.ellipse(i, -10.5, 1.2, 1.6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8f4a2c'; ctx.fillRect(i - 1.2, -12, 2.4, 0.6); }
    ctx.fillStyle = '#e8e6d8'; ctx.fillRect(9, -15, 2, 5); ctx.fillStyle = '#5b3a22'; ctx.fillRect(4, -13, 3.2, 3);
    plaque(ctx, -12, -40, 24, 4.4, 'PAJARETES', '#5b3a22', '#fff0cc');
  },
};

// Chapels (San Cayetano, San Francisco on the hill, Panteón)
SPRITES.capilla = {
  draw(ctx, s) {
    const w = s.fw, d = s.fd;
    shadowBlob(ctx, 4, -1, w * 0.5, 6);
    roofTop(ctx, -w / 2 + 3, -d, w - 6, d - 30, '#b45e43', true);
    const c = s.color || '#f2ece0';
    ctx.fillStyle = vgrad(ctx, -34, 0, shade(c, 0.04), shade(c, -0.1)); ctx.fillRect(-w / 2 + 3, -34, w - 6, 34);
    ctx.fillStyle = s.band || '#8e2f24'; ctx.fillRect(-w / 2 + 3, -6, w - 6, 6);
    woodDoor(ctx, -5, -20, 10, 20, '#5b3620', true);
    archWindow(ctx, -2, -30, 4, 6, '#d9c2a3', '#2b2f33');
    // espadaña
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-10, -34); ctx.lineTo(-10, -42); ctx.quadraticCurveTo(0, -52, 10, -42); ctx.lineTo(10, -34); ctx.fill();
    archWindow(ctx, -2.5, -46, 5, 7, '#d9c2a3', '#1c1e20');
    ctx.fillStyle = '#8b6a2f'; ctx.beginPath(); ctx.arc(0, -40.5, 1.4, Math.PI, 0); ctx.fill();
    cross(ctx, 0, -50, 5);
    if (s.label) plaque(ctx, -16, -38, 32, 3.6, s.label, '#3f3a33', '#f1e2b8');
  },
};

// Billiards hall entrance
SPRITES.billar = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 32, roof: '#bdb5a6', wall: '#f0e7d8', band: '#1f5a3a' });
    ctx.fillStyle = '#1f2a22'; ctx.fillRect(-8, -18, 16, 18);
    ctx.fillStyle = '#1f7a45'; ctx.fillRect(-7, -12, 14, 5);
    plaque(ctx, -18, -29, 36, 7, 'BILLAR', '#10331f', '#f7f1d0');
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-14, -25.5, 1.3, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(14, -25.5, 1.3, 0, 7); ctx.fill();
    text(ctx, '8', 14, -25.4, 1.5, '#fff');
  },
};

// Panadería Mendoza (ground) with the billiards upstairs
SPRITES.panaderia = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 48, roof: '#c7bfb0', wall: '#f5eee2' });
    const { x, w } = b;
    // upstairs billiards: windows with green light
    for (let i = x + 4; i < x + w - 6; i += 10) { rectWindow(ctx, i, -44, 6, 9, '#d9c2a3', '#29402f', false); }
    plaque(ctx, -w / 2 + 3, -33, w - 6, 5, 'BILLAR  ↑', '#1f5a3a', '#f6f0d2');
    // bakery front
    ctx.fillStyle = '#e7c58a'; ctx.fillRect(x + 2, -24, w - 4, 3);
    plaque(ctx, -w / 2 + 3, -27, w - 6, 5.5, 'PANADERÍA MENDOZA', '#7a3e1d', '#fff1d0');
    ctx.fillStyle = '#3a2a1f'; ctx.fillRect(x + 4, -20, w - 8, 20);
    // display of pan dulce: conchas, orejas, cuernos
    for (let i = 0; i < 6; i++) {
      const px = x + 7 + i * ((w - 14) / 6);
      ctx.fillStyle = ['#f3d9a5', '#e8b86b', '#c98a4a', '#f7e7c9', '#d9a066', '#f5c6a0'][i];
      ctx.beginPath(); ctx.ellipse(px, -13, 2.2, 1.5, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px + 1, -8, 2, 1.3, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,230,180,0.18)'; ctx.fillRect(x + 4, -20, w - 8, 20);
  },
};

// Generic small eatery/bar front with sign — micheladas, tacos, café
SPRITES.shopfront = {
  draw(ctx, s) {
    const o = s.style || {};
    const b = building(ctx, s, { fh: o.fh || 32, roof: o.roof || '#c9c1b3', wall: o.wall || '#f4efe4', band: o.band === undefined ? '#8e2f24' : o.band });
    const { x, w } = b;
    ctx.fillStyle = o.inside || '#3a2f27'; ctx.fillRect(x + 4, -19, w - 8, 19);
    if (o.awning) {
      for (let i = x + 2; i < x + w - 2; i += 4) { ctx.fillStyle = (((i - x) / 4) | 0) % 2 ? o.awning : '#f7f3ea'; ctx.beginPath(); ctx.moveTo(i, -22); ctx.lineTo(i + 4, -22); ctx.lineTo(i + 4, -18); ctx.quadraticCurveTo(i + 2, -16.4, i, -18); ctx.fill(); }
    }
    plaque(ctx, -w / 2 + 3, -(o.fh || 32) + 3, w - 6, 6, s.sign || 'TIENDA', o.signBg || '#7a1f1a', o.signFg || '#fff4d8');
    if (o.neon) { ctx.fillStyle = o.neon; ctx.fillRect(x + 4, -19, w - 8, 0.8); }
    if (o.items) {
      for (let i = 0; i < 6; i++) { ctx.fillStyle = o.items[i % o.items.length]; ctx.fillRect(x + 6 + i * ((w - 12) / 6), -12, 3, 5); }
    }
  },
};

// Taxi rank booth ("SITIO")
SPRITES.sitio = {
  draw(ctx, s) {
    shadowBlob(ctx, 3, -1, 9, 3);
    ctx.fillStyle = '#e9e4d8'; ctx.fillRect(-7, -16, 14, 16);
    ctx.fillStyle = '#2e3a40'; ctx.fillRect(-5, -13, 10, 6);
    ctx.fillStyle = '#18794e'; ctx.fillRect(-8, -20, 16, 4);
    text(ctx, 'SITIO', 0, -18, 3, '#fff');
    ctx.fillStyle = '#c9b89a'; ctx.fillRect(-7, -2, 14, 2);
  },
};

// Casa de la abuela: small house with bougainvillea
SPRITES.casaAbuela = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 30, roof: '#b0583d', wall: '#f6efe3', tiled: true });
    const { x, w } = b;
    woodDoor(ctx, -5, -16, 10, 16, '#2f5a4a', false);
    rectWindow(ctx, x + 6, -22, 7, 9);
    rectWindow(ctx, x + w - 13, -22, 7, 9);
    // bugambilia falling over the wall
    const r = rng(33);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = pick(r, ['#c2185b', '#d81b60', '#e04d8b', '#3c7a2e']);
      ctx.beginPath(); ctx.arc(x + w - 4 - r() * 18, -30 + r() * 14 * r(), 1 + r(), 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#2f5d9a'; ctx.fillRect(6.5, -14, 3, 2); text(ctx, '27', 8, -13, 1.4, '#fff');
  },
};

// Panteón gate
SPRITES.panteonGate = {
  draw(ctx, s) {
    shadowBlob(ctx, 3, -1, 24, 5);
    ctx.fillStyle = '#e9e2d4'; ctx.fillRect(-24, -30, 10, 30); ctx.fillRect(14, -30, 10, 30);
    ctx.fillStyle = '#e9e2d4'; ctx.beginPath(); ctx.moveTo(-24, -30); ctx.lineTo(24, -30); ctx.lineTo(24, -36); ctx.quadraticCurveTo(0, -46, -24, -36); ctx.fill();
    text(ctx, 'PANTEÓN MUNICIPAL', 0, -33, 3, '#4a4038');
    cross(ctx, 0, -44, 6);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 0.6; for (let x = -13; x <= 13; x += 2) { ctx.beginPath(); ctx.moveTo(x, -28); ctx.lineTo(x, 0); ctx.stroke(); }
  },
};

// Bleachers of the stadium
SPRITES.gradas = {
  draw(ctx, s) {
    const w = s.fw;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#c9c3b7' : '#dcd6ca'; ctx.fillRect(-w / 2, -i * 4 - 4, w, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-w / 2, -i * 4 - 0.8, w, 0.8);
    }
    ctx.fillStyle = '#9aa0a5'; ctx.fillRect(-w / 2, -30, 1.4, 30); ctx.fillRect(w / 2 - 1.4, -30, 1.4, 30);
    ctx.fillStyle = '#e9e9e9'; ctx.fillRect(-w / 2, -32, w, 3);
  },
};

// Basketball hoop
SPRITES.hoop = {
  draw(ctx, s) {
    ctx.fillStyle = '#394046'; ctx.fillRect(-0.8, -34, 1.6, 34);
    ctx.fillStyle = '#f5f5f5'; ctx.fillRect(-6, -40, 12, 8); ctx.strokeStyle = '#d33'; ctx.lineWidth = 0.5; ctx.strokeRect(-2.5, -37, 5, 4);
    ctx.strokeStyle = '#e25b1f'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(0, -31.5, 2.6, 1, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.3; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i, -31); ctx.lineTo(i * 0.6, -28); ctx.stroke(); }
  },
};

// Streetlamp
SPRITES.lamp = { draw(ctx) { shadowBlob(ctx, 1, 0, 3, 1.2); lamp(ctx, 0, 0, 22); } };

// Park bench (banca de hierro)
SPRITES.bench = {
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 9, 2);
    ctx.fillStyle = '#1f3a2b'; ctx.fillRect(-8, -3, 1, 3); ctx.fillRect(7, -3, 1, 3);
    ctx.fillStyle = '#7a5434'; ctx.fillRect(-8.5, -4, 17, 1.6); ctx.fillRect(-8.5, -8.5, 17, 1.2); ctx.fillRect(-8.5, -6.6, 17, 1.2);
    ctx.fillStyle = '#1f3a2b'; ctx.fillRect(-8.5, -9, 1, 6); ctx.fillRect(7.5, -9, 1, 6);
  },
};

// Trees -----------------------------------------------------------------
const TREE_PALETTES = {
  jacaranda: ['#6d4f9e', '#8e6cc4', '#b89be0'],
  jacarandaGreen: ['#3f6f33', '#56893f', '#78a656'],
  laurel: ['#2f5e2e', '#3f7a38', '#5d9a4a'],
  fresno: ['#3c6d34', '#548c42', '#7aae5a'],
  pino: ['#2c4f33', '#3b6641', '#517f52'],
  encino: ['#4a6a36', '#62843f', '#86a456'],
  eucalipto: ['#5f7f63', '#7d9c7c', '#a1bca0'],
  huizache: ['#5c7a34', '#789a41', '#a7c35b'],
};
SPRITES.tree = {
  draw(ctx, s) {
    const r = rng(s.seed || 1);
    const k = s.size || 1;
    let kind = s.tree || 'laurel';
    if (kind === 'jacaranda' && !s.bloom) kind = 'jacarandaGreen';
    shadowBlob(ctx, 6 * k, 0, 16 * k, 6 * k, 0.28);
    if (kind === 'palma') { palm(ctx, k, r); return; }
    if (kind === 'pino') { pine(ctx, k, r); return; }
    trunk(ctx, 0, 0, 4 * k, 18 * k, kind === 'eucalipto' ? '#b9ad9a' : '#6b4a30');
    // branches
    ctx.strokeStyle = '#5b3f28'; ctx.lineWidth = 1.4 * k;
    ctx.beginPath(); ctx.moveTo(0, -14 * k); ctx.lineTo(-6 * k, -22 * k); ctx.moveTo(0, -16 * k); ctx.lineTo(5 * k, -24 * k); ctx.stroke();
    treeCanopy(ctx, 0, -30 * k, 17 * k, TREE_PALETTES[kind] || TREE_PALETTES.laurel, r, 10);
    if (s.tree === 'jacaranda' && s.bloom) { // fallen petals
      for (let i = 0; i < 18; i++) { ctx.fillStyle = r() < 0.5 ? '#9a7bd0' : '#b9a0e6'; ctx.fillRect((r() - 0.5) * 34 * k, (r() - 0.5) * 10 * k, 1, 1); }
    }
  },
};
function palm(ctx, k, r) {
  ctx.strokeStyle = '#8a6d4c'; ctx.lineWidth = 2.6 * k; ctx.lineCap = 'round';
  const lean = (r() - 0.5) * 8 * k;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(lean * 0.3, -24 * k, lean, -46 * k); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,40,20,0.4)'; ctx.lineWidth = 0.5;
  for (let y = -4; y > -44 * k; y -= 2.5 * k) { ctx.beginPath(); ctx.moveTo(-1.3 * k + lean * (-y / (46 * k)), y); ctx.lineTo(1.3 * k + lean * (-y / (46 * k)), y - 0.6); ctx.stroke(); }
  const tx = lean, ty = -46 * k;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + r() * 0.3;
    const len = (13 + r() * 4) * k;
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + 4 * k;
    ctx.strokeStyle = i % 2 ? '#3f7a38' : '#5d9a4a'; ctx.lineWidth = 1.6 * k;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + ex) / 2, ty - 5 * k, ex, ey); ctx.stroke();
    ctx.lineWidth = 0.5;
    for (let j = 0.3; j < 1; j += 0.14) {
      const px = tx + (ex - tx) * j, py = ty + (ey - ty) * j - 3 * k * Math.sin(j * Math.PI);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a + 1.2) * 3 * k, py + 2.5 * k); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a - 1.2) * 3 * k, py + 2.5 * k); ctx.stroke();
    }
  }
  ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.arc(tx - 1, ty + 2, 1.4 * k, 0, 7); ctx.arc(tx + 1.4, ty + 2.4, 1.3 * k, 0, 7); ctx.fill();
  ctx.lineCap = 'butt';
}
function pine(ctx, k, r) {
  trunk(ctx, 0, 0, 3 * k, 12 * k, '#5b3d27');
  const P = TREE_PALETTES.pino;
  for (let i = 0; i < 5; i++) {
    const y = -10 * k - i * 8 * k, w = (16 - i * 2.6) * k;
    ctx.fillStyle = P[0]; ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(0, y - 14 * k); ctx.lineTo(w, y); ctx.fill();
    ctx.fillStyle = P[1]; ctx.beginPath(); ctx.moveTo(-w * 0.9, y - 1); ctx.lineTo(0, y - 14 * k); ctx.lineTo(w * 0.2, y - 1); ctx.fill();
    ctx.fillStyle = P[2]; ctx.beginPath(); ctx.moveTo(-w * 0.6, y - 3); ctx.lineTo(-w * 0.1, y - 11 * k); ctx.lineTo(-w * 0.2, y - 3); ctx.fill();
  }
}

// Agave, nopal, bushes, rocks
SPRITES.agave = {
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 8, 3);
    for (let i = 0; i < 11; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      ctx.fillStyle = i % 2 ? '#5f8f86' : '#77a59a';
      ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 12); ctx.lineTo(1.5, 0); ctx.fill();
    }
  },
};
SPRITES.nopal = {
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 7, 2.5);
    const pads = [[0, -5, 3.5, 5], [-4, -11, 3, 4.2], [3.5, -12, 3, 4.4], [0, -17, 2.6, 3.8]];
    for (const [x, y, rx, ry] of pads) { ctx.fillStyle = '#4f8a3e'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#6aa653'; ctx.beginPath(); ctx.ellipse(x - 0.8, y - 0.8, rx * 0.5, ry * 0.6, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#d63d6b'; ctx.beginPath(); ctx.arc(0, -21, 1, 0, 7); ctx.fill();
  },
};
SPRITES.bush = {
  draw(ctx, s) {
    const r = rng(s.seed || 3);
    shadowBlob(ctx, 2, 0, 9, 3);
    treeCanopy(ctx, 0, -5, 7, s.flowers ? ['#3f7a38', '#5d9a4a', '#e04d8b'] : ['#3f7a38', '#5d9a4a', '#86b565'], r, 6);
  },
};
SPRITES.rock = {
  draw(ctx, s) {
    const k = s.size || 1;
    shadowBlob(ctx, 2 * k, 0, 8 * k, 3 * k);
    ctx.fillStyle = '#8f8a80'; ctx.beginPath(); ctx.moveTo(-8 * k, 0); ctx.lineTo(-6 * k, -6 * k); ctx.lineTo(0, -9 * k); ctx.lineTo(7 * k, -5 * k); ctx.lineTo(8 * k, 0); ctx.fill();
    ctx.fillStyle = '#b3aea2'; ctx.beginPath(); ctx.moveTo(-6 * k, -6 * k); ctx.lineTo(0, -9 * k); ctx.lineTo(2 * k, -3 * k); ctx.lineTo(-4 * k, -2 * k); ctx.fill();
  },
};

// Market / tianguis stall with a coloured tarp ("lona")
SPRITES.stall = {
  draw(ctx, s) {
    const r = rng(s.seed || 5);
    const w = s.fw || 28;
    const tarp = s.tarp || pick(r, ['#e0457b', '#2f7fd8', '#f2a93b', '#41b37a', '#e4572e', '#7a5cc8']);
    shadowBlob(ctx, 3, 0, w / 2, 4, 0.2);
    // table with goods
    ctx.fillStyle = '#8a6a48'; ctx.fillRect(-w / 2 + 2, -9, w - 4, 3);
    ctx.fillRect(-w / 2 + 3, -6, 1.2, 6); ctx.fillRect(w / 2 - 4.2, -6, 1.2, 6);
    const goods = s.goods || pick(r, ['fruit', 'veg', 'clothes', 'toys', 'dvd', 'shoes', 'pots']);
    const palettes = {
      fruit: ['#f28c28', '#e53935', '#ffd54f', '#7cb342', '#ff7043', '#c62828'],
      veg: ['#43a047', '#e53935', '#8d6e63', '#fdd835', '#2e7d32', '#ef6c00'],
      clothes: ['#1e88e5', '#d81b60', '#fdd835', '#ffffff', '#43a047', '#6d4c41'],
      toys: ['#e53935', '#1e88e5', '#fdd835', '#8e24aa', '#43a047', '#fb8c00'],
      dvd: ['#212121', '#424242', '#e53935', '#1e88e5'],
      shoes: ['#4e342e', '#212121', '#795548', '#f5f5f5'],
      pots: ['#b5623e', '#a0522d', '#c9744c', '#8d4f2c'],
      pan: ['#f3d9a5', '#e8b86b', '#c98a4a', '#f7e7c9'],
    };
    const pal = palettes[goods] || palettes.fruit;
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = pick(r, pal);
      const gx = -w / 2 + 3 + r() * (w - 6), gy = -10.5 - r() * 2;
      if (goods === 'clothes') ctx.fillRect(gx, gy - 2, 2.4, 3); else { ctx.beginPath(); ctx.arc(gx, gy, 1.1, 0, 7); ctx.fill(); }
    }
    // poles & tarp
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-w / 2 + 1, -24, 0.8, 24); ctx.fillRect(w / 2 - 1.8, -24, 0.8, 24);
    ctx.fillStyle = tarp; ctx.beginPath(); ctx.moveTo(-w / 2 - 2, -22); ctx.lineTo(w / 2 + 2, -22); ctx.lineTo(w / 2, -28); ctx.lineTo(-w / 2, -28); ctx.fill();
    ctx.fillStyle = shade(tarp, -0.2); ctx.fillRect(-w / 2 - 2, -22, w + 4, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-w / 2, -28, w, 1.2);
    if (s.sign) { ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2 + 2, -20.5, w - 4, 4); text(ctx, s.sign, 0, -18.4, Math.min(3, (w - 5) / (s.sign.length * 0.62)), '#7a1f1a'); }
  },
};

// Food cart (tacos, fruta, elotes, churros...)
SPRITES.cart = {
  draw(ctx, s) {
    const c = s.color || '#d8d8d8';
    shadowBlob(ctx, 3, 0, 12, 3);
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(-7, -2, 2.2, 0, 7); ctx.arc(7, -2, 2.2, 0, 7); ctx.fill();
    ctx.fillStyle = shade(c, -0.2); ctx.fillRect(-11, -12, 22, 9);
    ctx.fillStyle = c; ctx.fillRect(-11, -14, 22, 3);
    ctx.fillStyle = '#c9ccd0'; ctx.fillRect(-10, -15, 20, 1.2);
    if (s.cart === 'tacos') { ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.ellipse(-3, -16, 5, 1.6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd08a'; ctx.fillRect(4, -18, 4, 3); }
    if (s.cart === 'fruta') { for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#f28c28', '#e53935', '#ffd54f', '#7cb342', '#ff7043', '#fff176'][i]; ctx.fillRect(-9 + i * 3, -17, 2.4, 3); } }
    if (s.cart === 'churros') { ctx.strokeStyle = '#c98a4a'; ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 2, -15); ctx.lineTo(-7 + i * 2, -21); ctx.stroke(); } }
    if (s.cart === 'garbanzo') { ctx.fillStyle = '#d9b36a'; ctx.beginPath(); ctx.ellipse(0, -16, 6, 2, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#777'; ctx.fillRect(5, -22, 1, 6); }
    if (s.cart === 'cafe') { ctx.fillStyle = '#c0c4c8'; ctx.fillRect(-6, -21, 5, 6); ctx.fillRect(1, -20, 4, 5); ctx.fillStyle = '#6b3f22'; ctx.fillRect(-5, -16.5, 3, 0.8); }
    if (s.cart === 'gelatinas') { for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#ffe9a8', '#ff8fb1', '#b4e37a', '#ffd166', '#f7f3e3', '#c79bf2'][i]; ctx.beginPath(); ctx.arc(-8 + i * 3.2, -16, 1.3, Math.PI, 0); ctx.fill(); } }
    if (s.umbrella) {
      ctx.fillStyle = '#888'; ctx.fillRect(-0.4, -34, 0.8, 20);
      const u = s.umbrella; ctx.fillStyle = u; ctx.beginPath(); ctx.moveTo(-14, -30); ctx.quadraticCurveTo(0, -42, 14, -30); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(-5, -32); ctx.quadraticCurveTo(0, -40, 5, -32); ctx.fill();
    }
    if (s.sign) { ctx.fillStyle = '#fff8e0'; ctx.fillRect(-10, -10.5, 20, 4); text(ctx, s.sign, 0, -8.4, Math.min(3, 19 / (s.sign.length * 0.62)), '#7a1f1a'); }
  },
  anim(ctx, s, t, night) {
    if (s.cart === 'tacos' && night) { ctx.fillStyle = 'rgba(255,240,180,0.9)'; ctx.beginPath(); ctx.arc(8, -26, 1.2, 0, 7); ctx.fill(); ctx.fillStyle = '#444'; ctx.fillRect(7.6, -26, 0.8, 8); }
    if (s.cart === 'tacos' || s.cart === 'garbanzo' || s.cart === 'churros') {
      ctx.fillStyle = 'rgba(240,240,240,0.35)';
      for (let i = 0; i < 3; i++) { const p = ((t * 0.6 + i / 3) % 1); ctx.beginPath(); ctx.arc(-3 + Math.sin(p * 6 + i) * 2, -18 - p * 12, 1.5 + p * 2, 0, 7); ctx.globalAlpha = 1 - p; ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  },
};

// Plastic tables & chairs (Corona style) with umbrellas outside micheladas spots
SPRITES.mesas = {
  draw(ctx, s) {
    const r = rng(s.seed || 9);
    const brand = s.color || pick(r, ['#1f4fa0', '#d4302b', '#f2c230']);
    for (const dx of [-10, 10]) {
      shadowBlob(ctx, dx + 2, 0, 8, 3, 0.18);
      ctx.fillStyle = '#f5f5f5'; ctx.fillRect(dx - 6, -8, 12, 2); ctx.fillRect(dx - 0.6, -6, 1.2, 6);
      ctx.fillStyle = shade(brand, 0.1); ctx.fillRect(dx - 9, -6, 2.5, 5); ctx.fillRect(dx + 6.5, -6, 2.5, 5);
      ctx.fillStyle = '#e6c75a'; ctx.fillRect(dx - 2, -11, 1.6, 3); // michelada glass
      ctx.fillStyle = '#b8322a'; ctx.fillRect(dx - 2.1, -11.3, 1.8, 0.7);
      ctx.fillStyle = '#6b3f22'; ctx.fillRect(dx + 1, -11, 1.2, 3.2);
    }
    ctx.fillStyle = '#aaa'; ctx.fillRect(-0.4, -30, 0.8, 26);
    ctx.fillStyle = brand; ctx.beginPath(); ctx.moveTo(-18, -26); ctx.quadraticCurveTo(0, -38, 18, -26); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-6, -30, 12, 2.2);
  },
};

// Red carnitas truck
SPRITES.carnitasTruck = {
  draw(ctx, s) {
    shadowBlob(ctx, 3, 0, 22, 5);
    ctx.fillStyle = '#222'; for (const wx of [-12, 12]) { ctx.beginPath(); ctx.arc(wx, -3, 3.2, 0, 7); ctx.fill(); ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(wx, -3, 1.3, 0, 7); ctx.fill(); ctx.fillStyle = '#222'; }
    ctx.fillStyle = '#b3201f'; roundRect(ctx, -20, -16, 26, 12, 2); ctx.fill();
    ctx.fillStyle = '#d42f2b'; roundRect(ctx, 5, -18, 14, 14, 2); ctx.fill();
    ctx.fillStyle = '#3a4852'; ctx.fillRect(8, -16, 9, 5);
    ctx.fillStyle = '#c0c4c8'; ctx.fillRect(-18, -20, 20, 5); // cazo
    ctx.fillStyle = '#9a5a2a'; ctx.beginPath(); ctx.ellipse(-8, -20, 8, 1.8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff8e0'; ctx.fillRect(-19, -13, 22, 4); text(ctx, 'CARNITAS', -8, -10.9, 3, '#b3201f');
  },
};

// Parked car (static prop)
SPRITES.parkedCar = {
  draw(ctx, s) { drawCarSide(ctx, s.color || '#c9ccd1', s.model || 'tsuru', !!s.flip, s.taxi); },
};
export function drawCarSide(ctx, color, model, flip, taxi) {
  ctx.save(); if (flip) ctx.scale(-1, 1);
  shadowBlob(ctx, 2, 0, 16, 4);
  const L = model === 'pickup' ? 36 : 30;
  ctx.fillStyle = '#1a1a1a'; for (const wx of [-L / 2 + 6, L / 2 - 6]) { ctx.beginPath(); ctx.arc(wx, -3, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#9aa0a5'; ctx.beginPath(); ctx.arc(wx, -3, 1.2, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; }
  ctx.fillStyle = shade(color, -0.25); roundRect(ctx, -L / 2, -10, L, 7, 2); ctx.fill();
  ctx.fillStyle = color; roundRect(ctx, -L / 2, -11, L, 6, 2); ctx.fill();
  if (model === 'pickup') {
    ctx.fillStyle = color; roundRect(ctx, -2, -18, 14, 8, 2); ctx.fill();
    ctx.fillStyle = '#30414d'; ctx.fillRect(1, -16.5, 9, 5);
  } else {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-L / 2 + 6, -11); ctx.lineTo(-L / 2 + 10, -18); ctx.lineTo(L / 2 - 9, -18); ctx.lineTo(L / 2 - 4, -11); ctx.fill();
    ctx.fillStyle = '#30414d'; ctx.beginPath(); ctx.moveTo(-L / 2 + 8, -11.5); ctx.lineTo(-L / 2 + 11, -17); ctx.lineTo(-1, -17); ctx.lineTo(-1, -11.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, -11.5); ctx.lineTo(1, -17); ctx.lineTo(L / 2 - 9.5, -17); ctx.lineTo(L / 2 - 6, -11.5); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-L / 2 + 2, -10.5, L - 4, 0.7);
  ctx.fillStyle = '#ffe9a6'; ctx.fillRect(L / 2 - 1.5, -9, 1.5, 1.8);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(-L / 2, -9, 1.2, 1.8);
  if (taxi) { ctx.fillStyle = '#fff'; ctx.fillRect(-3, -20.5, 6, 2.4); text(ctx, 'TAXI', 0, -19.2, 1.8, '#1b5e20'); ctx.fillStyle = taxi; ctx.fillRect(-L / 2, -8, L, 1.2); }
  ctx.restore();
}

// Sign post (street name / direction)
SPRITES.signpost = {
  draw(ctx, s) {
    ctx.fillStyle = '#5a5f63'; ctx.fillRect(-0.6, -22, 1.2, 22);
    const t = s.text || '';
    const w = Math.max(18, t.length * 2.1);
    ctx.fillStyle = s.bg || '#1f5fa8'; roundRect(ctx, -w / 2, -28, w, 6, 1); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.4; roundRect(ctx, -w / 2 + 0.6, -27.4, w - 1.2, 4.8, 0.8); ctx.stroke();
    text(ctx, t, 0, -24.9, 3, '#fff');
  },
};

// Chapel cross on the Cerro summit; campfire; tents
SPRITES.summitCross = {
  draw(ctx) { shadowBlob(ctx, 2, 0, 6, 2); ctx.fillStyle = '#e9e5dc'; ctx.fillRect(-1.4, -40, 2.8, 40); ctx.fillRect(-9, -32, 18, 2.8); ctx.fillStyle = '#b8b0a2'; ctx.fillRect(-4, -3, 8, 3); },
};
SPRITES.tent = {
  draw(ctx, s) {
    shadowBlob(ctx, 3, 0, 14, 4);
    const c = s.color || '#d8792e';
    ctx.fillStyle = shade(c, -0.25); ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, -18); ctx.lineTo(14, 0); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, -18); ctx.lineTo(2, 0); ctx.fill();
    ctx.fillStyle = '#2a1e16'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(0, -10); ctx.lineTo(3, 0); ctx.fill();
  },
};
SPRITES.campfire = {
  draw(ctx) {
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; ctx.fillStyle = '#8f8a80'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 6, Math.sin(a) * 3 - 1, 2, 1.4, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#5b3a22'; ctx.save(); ctx.rotate(0.4); ctx.fillRect(-5, -2, 10, 1.6); ctx.restore(); ctx.save(); ctx.rotate(-0.4); ctx.fillRect(-5, -1, 10, 1.6); ctx.restore();
  },
  anim(ctx, s, t) {
    for (let i = 0; i < 5; i++) {
      const p = (t * 1.6 + i * 0.21) % 1;
      ctx.fillStyle = `rgba(255,${150 + (1 - p) * 90},40,${0.9 - p * 0.8})`;
      ctx.beginPath(); ctx.ellipse(Math.sin(t * 7 + i) * 1.6, -2 - p * 10, 2.6 * (1 - p) + 0.4, 3.6 * (1 - p) + 0.4, 0, 0, 7); ctx.fill();
    }
  },
};

// Water tank on a tower ("tanque elevado") and phone antenna — both typical skyline items
SPRITES.antenna = {
  draw(ctx) {
    ctx.strokeStyle = '#8a8f94'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -80); ctx.lineTo(5, 0);
    for (let y = -6; y > -78; y -= 6) { const w = 5 * (1 + y / 80); ctx.moveTo(-w, y); ctx.lineTo(w, y - 6); ctx.moveTo(w, y); ctx.lineTo(-w, y - 6); }
    ctx.stroke();
    ctx.fillStyle = '#d33'; ctx.beginPath(); ctx.arc(0, -81, 1, 0, 7); ctx.fill();
  },
};

// Sign with text on a wall (used for landmarks' names on the map)
SPRITES.label = { draw() {} };

// Interior furniture (used by interior maps) ---------------------------
SPRITES.counter = {
  draw(ctx, s) {
    const w = s.fw || 48;
    shadowBlob(ctx, 2, 0, w / 2, 3, 0.18);
    ctx.fillStyle = s.color || '#8a5a34'; ctx.fillRect(-w / 2, -12, w, 12);
    ctx.fillStyle = shade(s.color || '#8a5a34', 0.2); ctx.fillRect(-w / 2 - 1, -14, w + 2, 3);
    if (s.goods) {
      const r = rng(s.seed || 11);
      for (let i = 0; i < w / 3; i++) { ctx.fillStyle = pick(r, s.goods); ctx.beginPath(); ctx.arc(-w / 2 + 2 + i * 3, -15.5 - r() * 1.5, 1.3, 0, 7); ctx.fill(); }
    }
    if (s.sign) plaque(ctx, -w / 2 + 2, -8, w - 4, 4.4, s.sign, s.signBg || '#fff5d8', s.signFg || '#7a1f1a');
  },
};
SPRITES.shelf = {
  draw(ctx, s) {
    const w = s.fw || 40; const r = rng(s.seed || 12);
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(-w / 2, -30, w, 30);
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = '#8a6444'; ctx.fillRect(-w / 2 + 1, -28 + j * 7 + 5, w - 2, 1.2);
      for (let i = -w / 2 + 2; i < w / 2 - 2; i += 2.2) { ctx.fillStyle = pick(r, s.goods || ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#fb8c00', '#f5f5f5', '#8e24aa']); ctx.fillRect(i, -28 + j * 7 + 1, 1.8, 4); }
    }
  },
};
SPRITES.table = {
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 10, 3, 0.2);
    ctx.fillStyle = s.color || '#8a5a34'; ctx.fillRect(-9, -9, 18, 3); ctx.fillRect(-8, -6, 1.4, 6); ctx.fillRect(6.6, -6, 1.4, 6);
    if (s.cloth) { ctx.fillStyle = s.cloth; ctx.fillRect(-9.5, -10, 19, 4); }
    if (s.items) { ctx.fillStyle = '#f5f0e6'; ctx.beginPath(); ctx.ellipse(-3, -11, 2.4, 0.9, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e6c75a'; ctx.fillRect(3, -13, 1.6, 3); }
  },
};
SPRITES.billiardTable = {
  draw(ctx) {
    shadowBlob(ctx, 3, 0, 22, 5, 0.25);
    ctx.fillStyle = '#4a2a18'; roundRect(ctx, -22, -24, 44, 22, 3); ctx.fill();
    ctx.fillStyle = '#1e7a46'; ctx.fillRect(-19, -21, 38, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(-19, -21, 38, 5);
    ctx.fillStyle = '#111'; for (const [x, y] of [[-19, -21], [0, -21], [19, -21], [-19, -5], [0, -5], [19, -5]]) { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 7); ctx.fill(); }
    const balls = ['#f5d90a', '#1e4fd8', '#d8261e', '#6a1fa0', '#f07c1b', '#1b8a3e', '#7a1f1a', '#111'];
    balls.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(6 + (i % 4) * 2.2, -15 + Math.floor(i / 4) * 2.2, 1, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-10, -13, 1, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a2a18'; ctx.fillRect(-20, -2, 3, 2); ctx.fillRect(17, -2, 3, 2);
  },
  anim(ctx, s, t, night) { ctx.fillStyle = 'rgba(255,245,200,0.12)'; ctx.beginPath(); ctx.ellipse(0, -14, 24, 12, 0, 0, 7); ctx.fill(); },
};
SPRITES.pew = {
  draw(ctx, s) {
    const w = s.fw || 40;
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(-w / 2, -10, w, 3); ctx.fillRect(-w / 2, -6, w, 2);
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(-w / 2, -10, 1.4, 10); ctx.fillRect(w / 2 - 1.4, -10, 1.4, 10);
  },
};
SPRITES.altar = {
  draw(ctx, s) {
    const w = s.fw || 60;
    // retablo / mural behind the altar
    const g = ctx.createLinearGradient(0, -70, 0, -14);
    g.addColorStop(0, s.mural1 || '#e0b54a'); g.addColorStop(1, s.mural2 || '#a8662e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w / 2, -14); ctx.lineTo(-w / 2, -58); ctx.quadraticCurveTo(0, -78, w / 2, -58); ctx.lineTo(w / 2, -14); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = -w / 2 + 6; i < w / 2; i += 10) ctx.fillRect(i, -56, 2, 40);
    ctx.fillStyle = '#f6efe3'; ctx.beginPath(); ctx.arc(0, -46, 8, 0, 7); ctx.fill();
    ctx.fillStyle = '#c2413c'; ctx.beginPath(); ctx.moveTo(0, -42); ctx.bezierCurveTo(-5, -46, -4, -51, 0, -48.6); ctx.bezierCurveTo(4, -51, 5, -46, 0, -42); ctx.fill();
    ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-16, -14, 32, 12); ctx.fillStyle = '#d9b24a'; ctx.fillRect(-16, -14, 32, 1.4);
    for (const cx of [-10, 10]) { ctx.fillStyle = '#f6eed9'; ctx.fillRect(cx - 0.6, -21, 1.2, 7); ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); ctx.ellipse(cx, -22.4, 0.8, 1.4, 0, 0, 7); ctx.fill(); }
  },
};
SPRITES.mural = { // abstract homage — bold figures and fire colours on a wall
  draw(ctx, s) {
    const w = s.fw || 80, h = s.fh || 40; const r = rng(s.seed || 21);
    ctx.fillStyle = '#e8dcc6'; ctx.fillRect(-w / 2, -h, w, h);
    const pal = s.palette || ['#7a2e1f', '#c4622d', '#e9b04a', '#3b3f4a', '#6e7f86', '#d9c7a8'];
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = pick(r, pal);
      ctx.beginPath(); const x = -w / 2 + r() * w, y = -h + r() * h;
      ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 30, y + r() * 20); ctx.lineTo(x + (r() - 0.5) * 30, y + r() * 20); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(30,20,20,0.55)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); const x = -w / 2 + 8 + i * (w - 16) / 5; ctx.moveTo(x, -4); ctx.quadraticCurveTo(x + (r() - 0.5) * 16, -h * 0.6, x + (r() - 0.5) * 10, -h + 4); ctx.stroke(); }
    ctx.strokeStyle = '#6b4a30'; ctx.lineWidth = 1.2; ctx.strokeRect(-w / 2, -h, w, h);
  },
};
SPRITES.jeep = { // Lázaro Cárdenas' jeep on display
  draw(ctx) {
    shadowBlob(ctx, 3, 0, 22, 5, 0.3);
    ctx.fillStyle = '#1b1b1b'; for (const wx of [-13, 13]) { ctx.beginPath(); ctx.arc(wx, -4, 4.4, 0, 7); ctx.fill(); ctx.fillStyle = '#4b5320'; ctx.beginPath(); ctx.arc(wx, -4, 2, 0, 7); ctx.fill(); ctx.fillStyle = '#1b1b1b'; }
    ctx.fillStyle = '#4b5320'; ctx.fillRect(-20, -14, 40, 8);
    ctx.fillStyle = '#5c6528'; ctx.fillRect(-20, -15, 40, 2);
    ctx.fillStyle = '#3d441a'; ctx.fillRect(12, -22, 1, 8); ctx.fillStyle = 'rgba(180,210,230,0.5)'; ctx.fillRect(6, -22, 7, 6);
    ctx.fillStyle = '#2e2e2e'; ctx.fillRect(-12, -18, 6, 4); ctx.fillRect(-2, -18, 6, 4);
    ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(19, -12, 1.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(-18, -9, 2, 2);
    ctx.fillStyle = '#b8a888'; ctx.fillRect(-24, 0, 48, 2); // platform
  },
};
SPRITES.vitrina = {
  draw(ctx, s) {
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(-10, -8, 20, 8);
    ctx.fillStyle = 'rgba(200,230,245,0.35)'; ctx.fillRect(-10, -20, 20, 12);
    ctx.strokeStyle = '#5b3a22'; ctx.lineWidth = 0.6; ctx.strokeRect(-10, -20, 20, 12);
    ctx.fillStyle = s.item || '#c9a54a'; ctx.fillRect(-4, -14, 8, 5);
  },
};
SPRITES.bookshelf = {
  draw(ctx, s) {
    const w = s.fw || 32; const r = rng(s.seed || 5);
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(-w / 2, -32, w, 32);
    for (let j = 0; j < 4; j++) for (let i = -w / 2 + 1.5; i < w / 2 - 1.5; i += 1.4 + r() * 0.6) {
      ctx.fillStyle = pick(r, ['#7a1f1a', '#1f4b7a', '#205a2e', '#8a6a2f', '#3b2a4a', '#c9b48a']);
      ctx.fillRect(i, -30 + j * 8, 1.2, 6 + r());
    }
  },
};
SPRITES.fridge = {
  draw(ctx, s) {
    ctx.fillStyle = s.color || '#c8102e'; ctx.fillRect(-7, -30, 14, 30);
    ctx.fillStyle = 'rgba(210,235,250,0.55)'; ctx.fillRect(-5.5, -27, 11, 20);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#8b0000', '#f5c518', '#2e7d32', '#e65100'][(i + j) % 4]; ctx.fillRect(-5 + i * 2.7, -26 + j * 5, 1.8, 3.6); }
    text(ctx, s.brand || 'COCA-COLA', 0, -3.5, 2, '#fff');
  },
};
SPRITES.bed = {
  draw(ctx, s) {
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(-12, -22, 24, 22);
    ctx.fillStyle = s.color || '#e9d7c0'; ctx.fillRect(-11, -20, 22, 19);
    ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-9, -20, 18, 5);
    ctx.fillStyle = s.blanket || '#b33a3a'; ctx.fillRect(-11, -12, 22, 11);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let i = -10; i < 11; i += 3) ctx.fillRect(i, -12, 1, 11);
  },
};
SPRITES.altarCasa = { // home altar with Virgin of Guadalupe, candles & photos
  draw(ctx) {
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(-10, -12, 20, 12);
    ctx.fillStyle = '#f3ecd9'; ctx.fillRect(-10, -13, 20, 2);
    ctx.fillStyle = '#1d6b50'; ctx.beginPath(); ctx.ellipse(0, -21, 4, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.ellipse(0, -21, 5, 8, 0, 0, 7); ctx.lineWidth = 0.6; ctx.strokeStyle = '#f2c14e'; ctx.stroke();
    ctx.fillStyle = '#e2a39a'; ctx.beginPath(); ctx.arc(0, -25, 1.2, 0, 7); ctx.fill();
    for (const x of [-7, -4, 4, 7]) { ctx.fillStyle = '#f6f1e2'; ctx.fillRect(x - 0.6, -17, 1.2, 4); ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); ctx.ellipse(x, -17.8, 0.6, 1, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ddd'; ctx.fillRect(-9, -11, 4, 3); ctx.fillRect(5, -11, 4, 3);
  },
};

// "Los tubos": a pergola of painted steel pipes by the Casa de la Cultura
SPRITES.tubos = {
  draw(ctx) {
    shadowBlob(ctx, 3, 0, 14, 4, 0.2);
    ctx.strokeStyle = '#3d4a52'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (const x of [-11, -4, 4, 11]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -26); ctx.stroke(); }
    ctx.strokeStyle = '#e25b1f'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-13, -24 - i * 1.4); ctx.lineTo(13, -26 - i * 1.4); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.5;
    for (const x of [-11, -4, 4, 11]) { ctx.beginPath(); ctx.moveTo(x - 0.4, -1); ctx.lineTo(x - 0.4, -25); ctx.stroke(); }
    ctx.lineCap = 'butt';
  },
};

// Column of the portal (seen from the plaza side)
SPRITES.portalCol = {
  draw(ctx) {
    ctx.fillStyle = 'rgba(20,20,40,0.2)'; ctx.fillRect(-1, -1, 6, 2);
    ctx.fillStyle = vgrad(ctx, -34, 0, '#e6d2b3', '#c9b08e'); ctx.fillRect(-2, -34, 4, 34);
    ctx.fillStyle = '#bfa47f'; ctx.fillRect(-3, -2, 6, 2); ctx.fillRect(-3, -36, 6, 2.4);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-1.6, -33, 0.8, 30);
    ctx.fillStyle = '#b0583d'; ctx.fillRect(-16, -40, 32, 4);
    ctx.fillStyle = '#c56a4c'; for (let i = -16; i < 16; i += 2) ctx.fillRect(i, -40, 1.1, 3.6);
  },
};

// Hanging sign under the portal
SPRITES.hangSign = {
  draw(ctx, s) {
    ctx.fillStyle = '#222'; ctx.fillRect(-6, -30, 0.5, 5); ctx.fillRect(5.5, -30, 0.5, 5);
    plaque(ctx, -12, -26, 24, 6, s.text || '', s.bg || '#2b2420', s.fg || '#fff');
  },
};

SPRITES.balustre = {
  draw(ctx) {
    ctx.fillStyle = '#d4b894'; ctx.fillRect(-2, -8, 4, 8);
    ctx.fillStyle = '#e6d2b3'; ctx.fillRect(-2.6, -9.5, 5.2, 1.8);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0.8, -8, 1.2, 8);
  },
};

// Fuente de los Pescados on the Las Palmas median
SPRITES.pescados = {
  draw(ctx) {
    shadowBlob(ctx, 3, 0, 15, 5);
    ctx.fillStyle = '#b8a283'; ctx.beginPath(); ctx.ellipse(0, -3, 14, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4b95b8'; ctx.beginPath(); ctx.ellipse(0, -3.6, 12, 4.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b8a283'; ctx.fillRect(-2.5, -12, 5, 9);
    // three fish arching up
    for (const [dx, a] of [[-5, -0.5], [0, 0], [5, 0.5]]) {
      ctx.save(); ctx.translate(dx, -13); ctx.rotate(a);
      ctx.fillStyle = '#6f8f92'; ctx.beginPath(); ctx.ellipse(0, -5, 2.2, 5, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2.6, 3); ctx.lineTo(2.6, 3); ctx.fill();
      ctx.fillStyle = '#9fbcbf'; ctx.beginPath(); ctx.ellipse(-0.6, -6, 0.8, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0.7, -8.4, 0.5, 0, 7); ctx.fill();
      ctx.restore();
    }
  },
  anim(ctx, s, t) {
    ctx.strokeStyle = 'rgba(210,238,255,0.7)'; ctx.lineWidth = 0.6;
    for (const [dx, a] of [[-5, -0.5], [0, 0], [5, 0.5]]) {
      const x = dx + Math.sin(a) * 11, y = -13 - Math.cos(a) * 11;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + a * 8, y - 3 - Math.sin(t * 6) * 0.4, x + a * 12 + (a === 0 ? 3 : 0), -4); ctx.stroke();
    }
  },
};

export { lamp };

SPRITES.lampHang = {
  draw(ctx) {
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -44); ctx.stroke();
    ctx.fillStyle = '#2f5d4a'; ctx.beginPath(); ctx.moveTo(-5, -40); ctx.lineTo(5, -40); ctx.lineTo(2, -44); ctx.lineTo(-2, -44); ctx.fill();
    ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.arc(0, -39.5, 1.6, 0, 7); ctx.fill();
  },
};
SPRITES.barrels = {
  draw(ctx) {
    shadowBlob(ctx, 2, 0, 14, 3);
    for (const [x, y] of [[-7, 0], [7, 0], [0, -8]]) {
      ctx.fillStyle = '#7a4a26'; roundRect(ctx, x - 6, y - 12, 12, 12, 3); ctx.fill();
      ctx.fillStyle = '#3b3b3b'; ctx.fillRect(x - 6, y - 10, 12, 1); ctx.fillRect(x - 6, y - 3, 12, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x - 4, y - 11, 2, 10);
    }
  },
};

// "SE BUSCA" poster on a post
SPRITES.poster = {
  draw(ctx) {
    ctx.fillStyle = '#6b6f73'; ctx.fillRect(-0.6, -26, 1.2, 26);
    ctx.fillStyle = '#f3efe2'; ctx.fillRect(-6, -25, 12, 15);
    ctx.fillStyle = 'rgba(120,100,60,0.25)'; ctx.fillRect(-6, -13, 12, 3);
    text(ctx, 'SE BUSCA', 0, -23, 2.2, '#b3201f');
    for (let i = -1; i <= 1; i++) { ctx.fillStyle = '#b8a888'; ctx.fillRect(i * 3.6 - 1.4, -21, 2.8, 3.4); ctx.fillStyle = '#6b5a45'; ctx.beginPath(); ctx.arc(i * 3.6, -20, 0.9, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#555'; for (let j = 0; j < 3; j++) ctx.fillRect(-5, -16 + j * 1.3, 10, 0.4);
  },
};
