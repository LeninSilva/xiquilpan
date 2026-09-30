// Jiquilpan-specific landmarks, drawn after the photos of the town: the Parroquia de San Francisco
// (ochre with red quoins, dark cantera tower on the left), the red Santuario del Sagrado Corazón,
// the stone Portada del Bosque Juárez, the Aguadora under its tiled cupola, the white-and-maroon
// kiosco, the Palacio Municipal's column front, the Parque Zaragoza with Durenne's greyhounds, etc.
// Each sprite is drawn relative to its anchor (bottom-centre of the footprint), in 3/4 view.
import { rng, pick, shade, rgba, roundRect } from '../util.js';
import {
  shadowBlob, vgrad, wallFace, roofTop, cornice, archWindow, rectWindow, balcony, woodDoor,
  dome, cross, bellTower, flagPole, treeCanopy, trunk, text, plaque, naveRoof, cloister,
} from './art.js';
import { SPRITES, building, drawCarSide } from './landmarks.js';

// --- shared helpers --------------------------------------------------------------------------------
// Red zig-zag quoins ("sillares") on a corner, as on San Francisco and its curato.
function quoins(ctx, x, y0, y1, color = '#a3322a', w = 4, side = 1) {
  ctx.fillStyle = color;
  let i = 0;
  for (let y = y1; y > y0; y -= 3.2, i++) {
    const ww = i % 2 ? w : w * 0.62;
    ctx.fillRect(side > 0 ? x : x - ww, Math.max(y0, y - 2.7), ww, Math.min(2.7, y - y0));
  }
}
// Irregular dark volcanic stonework, as in the Portada de Juárez.
function rubble(ctx, x, y, w, h, seed, base = '#5b5048') {
  const r = rng(seed);
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  for (let yy = y; yy < y + h; yy += 2.6) for (let xx = x - r() * 3; xx < x + w; xx += 2.4 + r() * 2.6) {
    const sw = 2 + r() * 2.6, sh = 1.8 + r() * 1.2;
    ctx.fillStyle = shade(pick(r, ['#6d6158', '#51463f', '#7a6c60', '#463c36', '#63574d', '#8a7a6a']), (r() - 0.5) * 0.1);
    ctx.beginPath(); ctx.ellipse(Math.min(x + w - 1, Math.max(x + 1, xx + sw / 2)), Math.min(y + h - 0.8, yy + sh / 2), sw / 2, sh / 2, 0, 0, 7); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.4; ctx.strokeRect(x, y, w, h);
}
function ironRail(ctx, x0, x1, y, h, color = '#1e2124') {
  ctx.strokeStyle = color; ctx.lineWidth = 0.35; ctx.beginPath();
  ctx.moveTo(x0, y - h); ctx.lineTo(x1, y - h); ctx.moveTo(x0, y - 0.6); ctx.lineTo(x1, y - 0.6);
  for (let x = x0; x <= x1; x += 1.2) { ctx.moveTo(x, y); ctx.lineTo(x, y - h); }
  ctx.stroke();
  ctx.fillStyle = color; for (let x = x0; x <= x1; x += 6) { ctx.beginPath(); ctx.arc(x, y - h - 0.6, 0.6, 0, 7); ctx.fill(); }
}
function statueBase(ctx, w, h, stone = '#c8b394') {
  ctx.fillStyle = shade(stone, -0.25); ctx.fillRect(-w / 2 - 2, -3, w + 4, 3);
  ctx.fillStyle = vgrad(ctx, -h, -3, shade(stone, 0.12), shade(stone, -0.12)); ctx.fillRect(-w / 2, -h, w, h - 3);
  cornice(ctx, -w / 2 - 0.5, -h, w + 1, shade(stone, 0.05));
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(w / 2 - 1.5, -h, 1.5, h - 3);
}

// =====================================================================================================
// Parroquia de San Francisco de Asís — ochre facade, red zig-zag quoins, curvy gable outlined in red,
// cantera portal with a carved wooden door, choir window of stone, clock, Franciscan crest; the tower
// of dark red cantera stands on the left; the old convent runs to the right.
SPRITES.sanfrancisco = {
  draw(ctx, s) {
    const W = s.fw, D = s.fd, x0 = -W / 2;
    shadowBlob(ctx, 8, -1, W * 0.52, 7);
    const ochre = '#e6bf55', red = '#a3322a', cant = '#8a4336';
    // convent / sacristy on the right: tiled roof around a cloister
    cloister(ctx, 12, -D + 10, W / 2 - 14, D - 60);
    wallFace(ctx, 12, -34, W / 2 - 12, 34, ochre, red, 5);
    quoins(ctx, W / 2 - 4, -34, 0, red, 4, 1);
    for (let x = 20; x < W / 2 - 10; x += 14) { archWindow(ctx, x, -26, 6, 12, '#d8b27a', '#2b2f33'); ironRail(ctx, x - 1, x + 7, -14, 3); }
    cornice(ctx, 12, -34, W / 2 - 12, '#c79c4b');
    // nave running back, with the tiled dome over the crossing
    naveRoof(ctx, -20, -70, 60, D - 70, '#b35a3e');
    dome(ctx, -20, -D + 60, 20, '#e6bf55', '#3f7fae');
    // the facade
    const fx = -50, fw = 60, fh = 72;
    ctx.fillStyle = vgrad(ctx, -fh, 0, shade(ochre, 0.06), shade(ochre, -0.1)); ctx.fillRect(fx, -fh, fw, fh);
    quoins(ctx, fx, -fh, 0, red, 4.4, 1); quoins(ctx, fx + fw, -fh, 0, red, 4.4, -1);
    // curvy gable with a red outline
    const gy = -fh;
    const gable = () => { ctx.beginPath(); ctx.moveTo(fx, gy); ctx.quadraticCurveTo(fx + 6, gy - 1, fx + 10, gy - 7); ctx.quadraticCurveTo(fx + 14, gy - 12, fx + 20, gy - 12); ctx.quadraticCurveTo(fx + 26, gy - 12, fx + 30, gy - 22); ctx.quadraticCurveTo(fx + 34, gy - 12, fx + 40, gy - 12); ctx.quadraticCurveTo(fx + 46, gy - 12, fx + 50, gy - 7); ctx.quadraticCurveTo(fx + 54, gy - 1, fx + fw, gy); };
    ctx.fillStyle = ochre; gable(); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = red; ctx.lineWidth = 1.6; gable(); ctx.stroke();
    cross(ctx, fx + 30, gy - 23, 8, '#3a2a22');
    // clock in the gable
    ctx.fillStyle = '#f7f2e2'; ctx.beginPath(); ctx.arc(fx + 30, gy - 11, 3.4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx + 30, gy - 11); ctx.lineTo(fx + 30, gy - 13.4); ctx.moveTo(fx + 30, gy - 11); ctx.lineTo(fx + 31.8, gy - 10.4); ctx.stroke();
    cornice(ctx, fx, -fh, fw, '#c79c4b');
    // Franciscan crest (two crossed arms and the cross) under the gable
    ctx.fillStyle = '#d7c49c'; roundRect(ctx, fx + 26, -fh + 3, 8, 9, 2); ctx.fill();
    ctx.strokeStyle = '#6b4a30'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(fx + 27.5, -fh + 10); ctx.lineTo(fx + 32.5, -fh + 5); ctx.moveTo(fx + 32.5, -fh + 10); ctx.lineTo(fx + 27.5, -fh + 5); ctx.moveTo(fx + 30, -fh + 4); ctx.lineTo(fx + 30, -fh + 11); ctx.stroke();
    // stone choir window with a carved frame
    ctx.fillStyle = '#cfa56a'; roundRect(ctx, fx + 23, -fh + 15, 14, 18, 3); ctx.fill();
    archWindow(ctx, fx + 26, -fh + 18, 8, 12, '#b98c57', '#2b2f33');
    // cantera portal: pilasters, arch, entablature, niche
    const px = fx + 18, pw = 24;
    ctx.fillStyle = '#c9a26a'; ctx.fillRect(px, -36, pw, 36);
    ctx.fillStyle = '#b38b58'; for (const cx of [px + 1, px + pw - 4]) { ctx.fillRect(cx, -36, 3, 36); }
    ctx.fillStyle = '#d7b47c'; ctx.fillRect(px - 2, -39, pw + 4, 3.2);
    woodDoor(ctx, px + 6, -28, 12, 28, '#5a3218', true, '#b38b58');
    ctx.fillStyle = 'rgba(255,220,160,0.25)'; for (let yy = -24; yy < -2; yy += 4) { ctx.fillRect(px + 7.2, yy, 4.2, 0.4); ctx.fillRect(px + 12.6, yy, 4.2, 0.4); }
    // wall lamps each side of the portal
    for (const lx of [px - 4, px + pw + 4]) { ctx.fillStyle = '#1f2326'; ctx.fillRect(lx - 0.4, -30, 0.8, 4); ctx.fillStyle = '#f7e2a0'; ctx.fillRect(lx - 1.4, -34, 2.8, 4); ctx.strokeStyle = '#1f2326'; ctx.lineWidth = 0.4; ctx.strokeRect(lx - 1.4, -34, 2.8, 4); }
    // atrium steps
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#d6c3a0' : '#e6d6b8'; ctx.fillRect(fx + 14 + i * 2, -1.6 + i * 0.1, fw - 28 - i * 4, 1.4); }
    // dark red cantera bell tower on the left
    const tx = fx - 16, tw = 26;
    ctx.fillStyle = vgrad(ctx, -78, 0, shade(cant, 0.06), shade(cant, -0.12)); ctx.fillRect(tx - tw / 2, -78, tw, 78);
    ctx.strokeStyle = 'rgba(40,15,10,0.35)'; ctx.lineWidth = 0.35;
    for (let y = -76; y < 0; y += 3) for (let x = tx - tw / 2 + ((y / 3) & 1) * 2.5; x < tx + tw / 2; x += 5) ctx.strokeRect(x, y, 5, 3);
    rectWindow(ctx, tx - 2.5, -54, 5, 8, '#6d3328', '#20252a');
    bellTower(ctx, tx, -78, tw - 2, 76, cant, 2);
  },
};

// Curato de San Francisco — two storeys, ochre with red quoins, arched windows with iron grilles
// and little finials on the parapet.
SPRITES.curato = {
  draw(ctx, s) {
    const W = s.fw, D = s.fd, x = -W / 2, fh = 46;
    ctx.fillStyle = 'rgba(20,20,40,0.22)'; ctx.fillRect(x + 4, -2, W, 5);
    roofTop(ctx, x, -D, W, D - fh, '#cbbfa9');
    cloister(ctx, x + 14, -D + 12, W - 28, D - fh - 26);
    wallFace(ctx, x, -fh, W, fh, '#e6bf55', '#a3322a', 5);
    quoins(ctx, x, -fh, 0, '#a3322a', 4, 1); quoins(ctx, x + W, -fh, 0, '#a3322a', 4, -1);
    ctx.fillStyle = '#c79c4b'; ctx.fillRect(x, -24, W, 1.4);
    for (let i = 0; i < 6; i++) {
      const wx = x + 12 + i * ((W - 24) / 6) + 4;
      archWindow(ctx, wx, -42, 7, 13, '#d8b27a', '#2b2f33');
      ironRail(ctx, wx - 1, wx + 8, -29, 4);
      if (i === 2) woodDoor(ctx, wx - 1, -20, 10, 20, '#5a3218', true, '#c9a26a');
      else { archWindow(ctx, wx, -18, 7, 12, '#d8b27a', '#2b2f33'); ctx.strokeStyle = '#1e2124'; ctx.lineWidth = 0.4; for (let k = wx + 1; k < wx + 7; k += 1.4) { ctx.beginPath(); ctx.moveTo(k, -16); ctx.lineTo(k, -6); ctx.stroke(); } }
    }
    cornice(ctx, x, -fh, W, '#c79c4b');
    ctx.fillStyle = '#e6bf55';
    for (let fx2 = x + 4; fx2 <= x + W - 4; fx2 += 20) { ctx.fillRect(fx2 - 1.2, -fh - 5, 2.4, 5); ctx.beginPath(); ctx.arc(fx2, -fh - 6, 1.6, 0, 7); ctx.fill(); }
    plaque(ctx, -14, -fh + 2, 28, 3.6, 'CURATO · SAN FRANCISCO', '#6b2a20', '#f3dfae');
  },
};

// Santuario del Sagrado Corazón — twin towers of dark red brick with clocks, a pink neoclassical
// portico (columns and pediment), and a long red-brown body.
SPRITES.santuario = {
  draw(ctx, s) {
    const W = s.fw, D = s.fd;
    shadowBlob(ctx, 8, -1, W * 0.5, 7);
    const brick = '#8e3b2b', brickD = '#6d2b20', pink = '#e8b3ad', pinkD = '#cf8f88';
    // long nave (red-brown walls) with buttresses and a dome at the crossing
    naveRoof(ctx, 0, -84, 76, D - 84, '#9c4a36');
    dome(ctx, 0, -D + 60, 24, '#b6574a', '#b9463a');
    // body behind the portico
    const fx = -46, fw = 92, fh = 86;
    ctx.fillStyle = vgrad(ctx, -fh, 0, shade(brick, 0.06), shade(brick, -0.1)); ctx.fillRect(fx, -fh, fw, fh);
    ctx.strokeStyle = 'rgba(30,10,5,0.25)'; ctx.lineWidth = 0.3;
    for (let y = -fh + 2; y < 0; y += 2) { ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx + fw, y); ctx.stroke(); }
    // pink portico: four columns, entablature and pediment
    const px = -26, pw = 52, ph = 58;
    ctx.fillStyle = vgrad(ctx, -ph, 0, shade(pink, 0.05), pinkD); ctx.fillRect(px, -ph, pw, ph);
    woodDoor(ctx, -7, -30, 14, 30, '#4f2a1a', true, '#f3dcd6');
    archWindow(ctx, -4, -50, 8, 13, '#f3dcd6', '#3a3440');
    for (const cx of [-22, -12, 12, 22]) {
      ctx.fillStyle = vgrad(ctx, -ph, 0, '#faf1ec', '#e2cfc6'); ctx.fillRect(cx - 2.4, -ph + 4, 4.8, ph - 5);
      ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(cx + 0.9, -ph + 4, 1.4, ph - 5);
      ctx.fillStyle = '#fbf4ef'; ctx.fillRect(cx - 3.2, -ph + 2.4, 6.4, 2.2); ctx.fillRect(cx - 3.2, -2, 6.4, 2);
    }
    ctx.fillStyle = '#f6e4de'; ctx.fillRect(px - 3, -ph - 4, pw + 6, 6);
    text(ctx, 'SAGRADO CORAZÓN DE JESÚS', 0, -ph - 1, 3.4, '#8b4a45');
    ctx.fillStyle = pink; ctx.beginPath(); ctx.moveTo(px - 4, -ph - 4); ctx.lineTo(0, -ph - 20); ctx.lineTo(px + pw + 4, -ph - 4); ctx.fill();
    ctx.strokeStyle = '#fbf0ea'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px - 4, -ph - 4); ctx.lineTo(0, -ph - 20); ctx.lineTo(px + pw + 4, -ph - 4); ctx.stroke();
    ctx.fillStyle = '#c2413c'; ctx.beginPath(); ctx.moveTo(0, -ph - 8); ctx.bezierCurveTo(-4, -ph - 11.5, -3.5, -ph - 15, 0, -ph - 13); ctx.bezierCurveTo(3.5, -ph - 15, 4, -ph - 11.5, 0, -ph - 8); ctx.fill();
    cross(ctx, 0, -ph - 20, 7, '#3a2a22');
    // side windows in the brick body
    for (const wx of [fx + 6, fx + fw - 14]) { archWindow(ctx, wx, -60, 8, 16, '#d9a08f', '#2b2a33'); archWindow(ctx, wx, -34, 8, 16, '#d9a08f', '#2b2a33'); }
    // twin towers of dark brick, with clocks
    for (const tx of [fx - 12, fx + fw + 12]) {
      const tw = 24;
      ctx.fillStyle = vgrad(ctx, -100, 0, shade(brick, 0.04), brickD); ctx.fillRect(tx - tw / 2, -100, tw, 100);
      ctx.strokeStyle = 'rgba(30,10,5,0.3)'; ctx.lineWidth = 0.3;
      for (let y = -98; y < 0; y += 2) { ctx.beginPath(); ctx.moveTo(tx - tw / 2, y); ctx.lineTo(tx + tw / 2, y); ctx.stroke(); }
      ctx.fillStyle = pink; ctx.fillRect(tx - tw / 2, -100, 1.6, 100); ctx.fillRect(tx + tw / 2 - 1.6, -100, 1.6, 100);
      archWindow(ctx, tx - 3, -52, 6, 12, pinkD, '#241e22');
      ctx.fillStyle = '#f7f3e8'; ctx.beginPath(); ctx.arc(tx, -86, 5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#2b2320'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx, -86); ctx.lineTo(tx, -89.6); ctx.moveTo(tx, -86); ctx.lineTo(tx + 2.4, -85); ctx.stroke();
      cornice(ctx, tx - tw / 2, -100, tw, '#f0cfc9');
      bellTower(ctx, tx, -100, tw - 4, 84, brick, 2);
    }
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#e9dcd2' : '#f5ece4'; ctx.fillRect(px - 8 + i * 2, -1.8 + i * 0.3, pw + 16 - i * 4, 1.4); }
  },
};

// Portada de Juárez (Bosque Juárez): dark volcanic rubble stone, two big arches whose frames are
// set with small grainy pebbles, a scalloped mission-style gable with a central peak and a small
// arched window, and a base of river stones.
SPRITES.portadaJuarez = {
  draw(ctx, s) {
    shadowBlob(ctx, 5, -1, 52, 7);
    const W = 96, H = 50;
    // river-stone base
    const r = rng(77);
    ctx.fillStyle = '#6f675e'; ctx.fillRect(-W / 2 - 2, -7, W + 4, 7);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = pick(r, ['#9c948a', '#b7aea2', '#857b70', '#a9a296']); ctx.beginPath(); ctx.ellipse(-W / 2 + r() * W, -1 - r() * 5.4, 1.4 + r() * 1.4, 1 + r() * 0.8, 0, 0, 7); ctx.fill(); }
    // body
    rubble(ctx, -W / 2, -H, W, H - 7, 4242);
    // scalloped gable
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-W / 2, -H); ctx.quadraticCurveTo(-W / 2 + 6, -H - 8, -W / 2 + 14, -H - 6); ctx.quadraticCurveTo(-W / 2 + 22, -H - 13, -12, -H - 12);
    ctx.quadraticCurveTo(-8, -H - 22, 0, -H - 26); ctx.quadraticCurveTo(8, -H - 22, 12, -H - 12);
    ctx.quadraticCurveTo(W / 2 - 22, -H - 13, W / 2 - 14, -H - 6); ctx.quadraticCurveTo(W / 2 - 6, -H - 8, W / 2, -H); ctx.closePath();
    ctx.clip(); rubble(ctx, -W / 2, -H - 28, W, 30, 99);
    ctx.restore();
    ctx.strokeStyle = '#3e3530'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-W / 2, -H); ctx.quadraticCurveTo(-W / 2 + 6, -H - 8, -W / 2 + 14, -H - 6); ctx.quadraticCurveTo(-W / 2 + 22, -H - 13, -12, -H - 12);
    ctx.quadraticCurveTo(-8, -H - 22, 0, -H - 26); ctx.quadraticCurveTo(8, -H - 22, 12, -H - 12);
    ctx.quadraticCurveTo(W / 2 - 22, -H - 13, W / 2 - 14, -H - 6); ctx.quadraticCurveTo(W / 2 - 6, -H - 8, W / 2, -H); ctx.stroke();
    archWindow(ctx, -2.5, -H - 16, 5, 7, '#a59a8a', '#1b1d20');
    // two big arches with pebble frames
    for (const cx of [-22, 22]) {
      const aw = 30, ah = 38, top = -7 - ah;
      ctx.fillStyle = '#b8ab98';
      ctx.beginPath(); ctx.moveTo(cx - aw / 2 - 3, -7); ctx.lineTo(cx - aw / 2 - 3, top + aw / 2); ctx.arc(cx, top + aw / 2, aw / 2 + 3, Math.PI, 0); ctx.lineTo(cx + aw / 2 + 3, -7); ctx.fill();
      const rr = rng(cx + 300);
      for (let i = 0; i < 120; i++) {
        const a = Math.PI + rr() * Math.PI, d = aw / 2 + rr() * 3;
        let px, py;
        if (rr() < 0.55) { px = cx + Math.cos(a) * d; py = top + aw / 2 + Math.sin(a) * d; }
        else { const side = rr() < 0.5 ? -1 : 1; px = cx + side * (aw / 2 + rr() * 3); py = top + aw / 2 + rr() * (ah - aw / 2); }
        ctx.fillStyle = pick(rr, ['#d6cbb8', '#9d9181', '#c4b7a2', '#8a7e6f']); ctx.fillRect(px - 0.4, py - 0.4, 0.9, 0.9);
      }
      // opening: the bosque seen through it
      ctx.fillStyle = vgrad(ctx, top, -7, '#3c4f33', '#6d7c4a');
      ctx.beginPath(); ctx.moveTo(cx - aw / 2, -7); ctx.lineTo(cx - aw / 2, top + aw / 2); ctx.arc(cx, top + aw / 2, aw / 2, Math.PI, 0); ctx.lineTo(cx + aw / 2, -7); ctx.fill();
      ctx.fillStyle = 'rgba(30,45,25,0.5)'; for (let i = 0; i < 5; i++) ctx.fillRect(cx - aw / 2 + 3 + i * 6, top + 10, 1.2, ah - 12);
      ctx.fillStyle = '#b39a74'; ctx.fillRect(cx - aw / 2, -7, aw, 7);
    }
    plaque(ctx, -13, -H + 3, 26, 5, 'BOSQUE JUÁREZ', '#3a312a', '#e8d6a8');
  },
};

// Fuente de la Aguadora (Federico Canessi, 1930s): a cantera templete with a cupola of blue and
// yellow Talavera tiles; under it the woman carrying the cántaro on her head with a raised arm,
// over a large lobed basin.
SPRITES.aguadora = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -2, 30, 10, 0.28);
    const stone = '#d2b48c', stoneD = '#a98d69';
    // lobed basin
    const lobes = (cx, cy, R, ry) => { ctx.beginPath(); for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; const rad = R * (1 + 0.07 * Math.cos(a * 8)); const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad * ry; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); };
    ctx.fillStyle = stoneD; lobes(0, -4, 28, 0.42); ctx.fill();
    ctx.fillRect(-28, -7, 56, 3);
    ctx.fillStyle = stone; lobes(0, -7, 28, 0.42); ctx.fill();
    ctx.fillStyle = '#3f8fb4'; lobes(0, -7.6, 25, 0.4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(-8, -10, 9, 2, 0, 0, 7); ctx.fill();
    // templete: four cantera pillars on a round pedestal
    ctx.fillStyle = stoneD; ctx.beginPath(); ctx.ellipse(0, -9, 10, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = stone; ctx.fillRect(-10, -14, 20, 5); ctx.beginPath(); ctx.ellipse(0, -14, 10, 4, 0, 0, 7); ctx.fill();
    const pil = (x, y) => { ctx.fillStyle = vgrad(ctx, y - 36, y, shade(stone, 0.12), shade(stone, -0.18)); ctx.fillRect(x - 1.8, y - 36, 3.6, 36); ctx.fillStyle = stoneD; ctx.fillRect(x - 2.4, y - 37.5, 4.8, 2); ctx.fillRect(x - 2.4, y - 1.6, 4.8, 1.6); };
    pil(-9, -16); pil(9, -16);
    statueAguadora(ctx, 0, -17);
    pil(-11, -11); pil(11, -11);
    // entablature and Talavera cupola with lantern and finial
    const top = -48;
    ctx.fillStyle = stoneD; ctx.fillRect(-15, top, 30, 4);
    ctx.fillStyle = stone; ctx.fillRect(-14, top - 3, 28, 3.4);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-14, top - 3, 28, 0.8);
    const g = ctx.createRadialGradient(-4, top - 12, 1, 0, top - 6, 16);
    g.addColorStop(0, '#6fb0dc'); g.addColorStop(0.6, '#2c6ea6'); g.addColorStop(1, '#1c4c78');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-13, top - 3); ctx.bezierCurveTo(-13, top - 17, 13, top - 17, 13, top - 3); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#f2c94c';
    for (let yy = top - 16; yy < top - 2; yy += 3) for (let xx = -13 + ((yy / 3) & 1) * 1.5; xx < 13; xx += 3) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 0.8, yy + 0.8); ctx.lineTo(xx, yy + 1.6); ctx.lineTo(xx - 0.8, yy + 0.8); ctx.fill(); }
    ctx.fillStyle = '#f7f3ea'; for (let i = -3; i <= 3; i++) ctx.fillRect(i * 3.6 - 0.3, top - 17, 0.6, 15);
    ctx.restore();
    ctx.fillStyle = stone; ctx.fillRect(-2.2, top - 19, 4.4, 4); ctx.beginPath(); ctx.arc(0, top - 19, 2.2, Math.PI, 0); ctx.fill();
    ctx.fillRect(-0.4, top - 25, 0.8, 5); ctx.beginPath(); ctx.arc(0, top - 25.6, 1.1, 0, 7); ctx.fill();
    for (const px of [-13, 13]) { ctx.fillStyle = stone; ctx.beginPath(); ctx.arc(px, top - 4.5, 1.4, 0, 7); ctx.fill(); ctx.fillRect(px - 0.5, top - 4.5, 1, 1.6); }
  },
  anim(ctx, s, t) {
    ctx.strokeStyle = 'rgba(200,235,255,0.75)'; ctx.lineWidth = 0.8;
    for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(d * 9, -12); ctx.quadraticCurveTo(d * 14, -14, d * 17 + Math.sin(t * 7) * 0.3, -8); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 4; i++) { const a = (t * 1.6 + i * 0.5) % 2; ctx.globalAlpha = 1 - a / 2; ctx.beginPath(); ctx.ellipse((i % 2 ? 17 : -17), -7.6, 1 + a * 2, 0.5 + a * 0.6, 0, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  },
};
function statueAguadora(ctx, x, y) {
  // stone woman, one hand steadying the cántaro on her head, the other arm raised
  const c = '#c9b08c', d = '#a58c6a', e = '#8d7658';
  ctx.fillStyle = d; ctx.beginPath(); ctx.moveTo(x - 4.2, y); ctx.quadraticCurveTo(x - 4, y - 9, x - 2.4, y - 15); ctx.lineTo(x + 2.4, y - 15); ctx.quadraticCurveTo(x + 4, y - 9, x + 4.2, y); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 3.4, y); ctx.quadraticCurveTo(x - 3.2, y - 9, x - 2, y - 15); ctx.lineTo(x + 0.6, y - 15); ctx.quadraticCurveTo(x + 1.2, y - 8, x + 0.4, y); ctx.fill();
  ctx.strokeStyle = e; ctx.lineWidth = 0.3; for (const fx of [-2, 0, 2]) { ctx.beginPath(); ctx.moveTo(x + fx * 0.6, y - 14); ctx.lineTo(x + fx, y); ctx.stroke(); }
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 2.4, y - 15); ctx.lineTo(x - 2, y - 21.5); ctx.lineTo(x + 2, y - 21.5); ctx.lineTo(x + 2.4, y - 15); ctx.fill();
  ctx.fillStyle = d; ctx.fillRect(x - 2.4, y - 16, 4.8, 1.2);
  ctx.fillStyle = c; ctx.fillRect(x - 0.6, y - 23, 1.2, 1.6);
  ctx.beginPath(); ctx.arc(x, y - 24.6, 2, 0, 7); ctx.fill();
  ctx.fillStyle = d; ctx.beginPath(); ctx.arc(x, y - 25.2, 2, Math.PI, 0); ctx.fill();
  // arms: left up to the cántaro, right raised to the side
  ctx.strokeStyle = c; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 2, y - 21); ctx.lineTo(x - 3.6, y - 25); ctx.lineTo(x - 2.4, y - 28.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 2, y - 21); ctx.lineTo(x + 4.6, y - 24); ctx.lineTo(x + 5.6, y - 28.6); ctx.stroke();
  ctx.lineCap = 'butt';
  // the cántaro on her head
  ctx.fillStyle = '#b89572'; ctx.beginPath(); ctx.ellipse(x, y - 30, 3.2, 3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#9c7a58'; ctx.fillRect(x - 1.1, y - 34.2, 2.2, 1.6); ctx.fillRect(x - 1.6, y - 34.6, 3.2, 0.7);
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(x - 1.1, y - 31, 0.8, 1.6, 0, 0, 7); ctx.fill();
}

// Kiosco: white octagonal base with maroon trim and oval panels, stairs, slender black iron
// columns and an ornate black railing, dark dome with a golden eave frieze.
SPRITES.kiosco = {
  draw(ctx, s) {
    const R = 30;
    shadowBlob(ctx, 5, -2, R + 6, 12, 0.28);
    const oct = (cx, cy, rx, ry) => { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); };
    // base: white walls with maroon trim, oval panels on the three visible faces
    ctx.fillStyle = '#e9e4da'; oct(0, -2, R + 2, (R + 2) * 0.5); ctx.fill();
    ctx.fillRect(-(R + 2) * 0.92, -12, (R + 2) * 1.84, 10);
    ctx.fillStyle = '#7a2626'; ctx.fillRect(-(R + 2) * 0.92, -3, (R + 2) * 1.84, 2);
    ctx.fillRect(-(R + 2) * 0.92, -12.5, (R + 2) * 1.84, 1.2);
    for (const px of [-22, -12, 12, 22]) { ctx.strokeStyle = '#7a2626'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(px, -7, 3, 2.2, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = '#f4f0e8'; oct(0, -12, R + 2, (R + 2) * 0.5); ctx.fill();
    ctx.strokeStyle = '#7a2626'; ctx.lineWidth = 0.8; oct(0, -12, R + 2, (R + 2) * 0.5); ctx.stroke();
    // stairs in front
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#d8d2c6' : '#efeae1'; ctx.fillRect(-8 + i * 0.6, 1 - i * 2.6, 16 - i * 1.2, 2.6); }
    ctx.fillStyle = '#7a2626'; ctx.fillRect(-9, -12, 1.2, 13); ctx.fillRect(7.8, -12, 1.2, 13);
    // columns
    const colH = 30, base = -12, top = base - colH;
    const cols = [];
    for (let a = 0; a < 8; a++) { const ang = (a / 8) * Math.PI * 2 + Math.PI / 8; cols.push([Math.cos(ang) * (R - 3), base + Math.sin(ang) * (R - 3) * 0.5, Math.sin(ang)]); }
    const drawCol = ([px, py]) => {
      ctx.fillStyle = '#1d1f22'; ctx.fillRect(px - 0.8, py - colH, 1.6, colH);
      ctx.fillStyle = '#4c5156'; ctx.fillRect(px - 0.8, py - colH, 0.5, colH);
      ctx.fillStyle = '#1d1f22'; ctx.fillRect(px - 1.8, py - colH, 3.6, 1.4); ctx.fillRect(px - 1.5, py - 1.6, 3, 1.6);
      ctx.strokeStyle = '#1d1f22'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(px, py - colH + 1); ctx.quadraticCurveTo(px + 3, py - colH + 1, px + 4, py - colH + 4); ctx.moveTo(px, py - colH + 1); ctx.quadraticCurveTo(px - 3, py - colH + 1, px - 4, py - colH + 4); ctx.stroke();
    };
    cols.filter(c => c[2] < 0).forEach(drawCol);
    ctx.fillStyle = 'rgba(60,40,30,0.18)'; oct(0, base, R - 5, (R - 5) * 0.5); ctx.fill();
    // back railing
    const rail = (from, to) => {
      ctx.strokeStyle = '#1d1f22'; ctx.lineWidth = 0.35;
      for (let a = from; a <= to; a += Math.PI / 48) {
        const px = Math.cos(a) * (R - 3), py = base + Math.sin(a) * (R - 3) * 0.5;
        if (Math.sin(a) > 0 && Math.abs(px) < 8) continue;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 6); ctx.stroke();
      }
      ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(0, base - 6, R - 3, (R - 3) * 0.5, 0, from, to); ctx.stroke();
      ctx.lineWidth = 0.4; ctx.beginPath(); ctx.ellipse(0, base - 3, R - 3, (R - 3) * 0.5, 0, from, to); ctx.stroke();
    };
    rail(Math.PI, Math.PI * 2);
    cols.filter(c => c[2] >= 0).forEach(drawCol);
    rail(0.3, Math.PI - 0.3);
    // ornate scrolls on the front railing
    ctx.strokeStyle = '#1d1f22'; ctx.lineWidth = 0.35;
    for (let a = 0.35; a < Math.PI - 0.3; a += Math.PI / 12) { const px = Math.cos(a) * (R - 3), py = base + Math.sin(a) * (R - 3) * 0.5; if (Math.abs(px) < 8) continue; ctx.beginPath(); ctx.arc(px, py - 4.5, 1.2, 0, 7); ctx.stroke(); }
    // eaves: golden frieze under a dark dome
    ctx.fillStyle = '#e9e4da'; oct(0, top, R + 1, (R + 1) * 0.5); ctx.fill();
    ctx.fillStyle = '#26292c'; ctx.fillRect(-(R + 1) * 0.93, top, (R + 1) * 1.86, 3);
    ctx.fillStyle = '#c9a23c';
    for (let i = -R * 0.92; i < R * 0.92; i += 2.2) { ctx.beginPath(); ctx.moveTo(i, top + 3); ctx.lineTo(i + 1.1, top + 5.4); ctx.lineTo(i + 2.2, top + 3); ctx.fill(); }
    ctx.fillRect(-(R + 1) * 0.93, top - 0.6, (R + 1) * 1.86, 0.9);
    const g = ctx.createRadialGradient(-10, top - 18, 2, 0, top - 6, R * 1.1);
    g.addColorStop(0, '#6e777d'); g.addColorStop(0.55, '#3a4146'); g.addColorStop(1, '#1f2427');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-R * 0.95, top); ctx.bezierCurveTo(-R * 0.9, top - 16, -8, top - 24, 0, top - 26); ctx.bezierCurveTo(8, top - 24, R * 0.9, top - 16, R * 0.95, top); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(201,162,60,0.55)'; ctx.lineWidth = 0.5;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * R * 0.3, top); ctx.quadraticCurveTo(i * R * 0.12, top - 18, 0, top - 26); ctx.stroke(); }
    ctx.fillStyle = '#26292c'; ctx.fillRect(-2.6, top - 32, 5.2, 6);
    ctx.fillStyle = '#c9a23c'; ctx.fillRect(-2.6, top - 32, 5.2, 0.8); ctx.fillRect(-0.4, top - 40, 0.8, 8);
    ctx.beginPath(); ctx.arc(0, top - 40.5, 1.3, 0, 7); ctx.fill();
  },
};

// Palacio Municipal — a front of paired columns (not arches) that leads into the building, the
// upper floor with balconies, the sign PALACIO MUNICIPAL over the entrance and the flag.
SPRITES.palacio = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 54, roof: '#cdc3b1', wall: '#f3eee3', band: null });
    const { x, w } = b;
    const stone = '#d8c19f';
    // upper floor windows with balconies
    for (let i = 0; i < 11; i++) {
      const wx = x + 10 + i * ((w - 20) / 11) + 4;
      rectWindow(ctx, wx, -48, 7, 12, stone, '#34444e', false);
      ctx.fillStyle = '#6b4526'; ctx.fillRect(wx + 0.4, -47.5, 2.9, 11); ctx.fillRect(wx + 3.7, -47.5, 2.9, 11);
      balcony(ctx, wx, -35.5, 7);
    }
    ctx.fillStyle = stone; ctx.fillRect(x, -31, w, 2.2);
    // ground floor: a deep colonnade (columns, not arches) in front of the doors
    ctx.fillStyle = vgrad(ctx, -29, 0, '#5b4a3c', '#8a7560'); ctx.fillRect(x + 4, -29, w - 8, 29);
    ctx.fillStyle = '#efe6d4'; ctx.fillRect(x + 4, -23, w - 8, 23);
    for (let i = 0; i < 9; i++) { const dx = x + 20 + i * ((w - 40) / 8); ctx.fillStyle = '#5d3a22'; ctx.fillRect(dx - 3, -16, 6, 16); ctx.fillStyle = 'rgba(255,230,180,0.2)'; ctx.fillRect(dx - 2.4, -15, 1, 14); }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 4, -23, w - 8, 2);
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const cx = x + 6 + i * ((w - 12) / n);
      ctx.fillStyle = vgrad(ctx, -29, 0, '#f2e8d6', '#d1bb98'); ctx.fillRect(cx - 2, -29, 4, 29);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(cx + 0.8, -29, 1.2, 29);
      ctx.fillStyle = stone; ctx.fillRect(cx - 2.8, -30, 5.6, 2); ctx.fillRect(cx - 2.8, -1.8, 5.6, 1.8);
    }
    // central entrance bay, a little taller, with the sign
    ctx.fillStyle = '#f3eee3'; ctx.fillRect(-26, -66, 52, 14);
    cornice(ctx, -26, -66, 52, stone);
    ctx.beginPath(); ctx.moveTo(-28, -66); ctx.lineTo(0, -74); ctx.lineTo(28, -66); ctx.fillStyle = '#f3eee3'; ctx.fill();
    ctx.strokeStyle = stone; ctx.lineWidth = 1; ctx.stroke();
    plaque(ctx, -24, -63, 48, 7, 'PALACIO MUNICIPAL', '#f3eee3', '#3a2f26');
    ctx.fillStyle = '#b08d3e'; roundRect(ctx, -3.5, -73, 7, 6.5, 2); ctx.fill();
    ctx.fillStyle = '#2f5b8c'; ctx.fillRect(-2.3, -72, 4.6, 4.4);
    cornice(ctx, x, -54, w, stone);
    for (let i = x; i < x + w; i += 7) { ctx.fillStyle = '#e7dccb'; ctx.fillRect(i, -57, 3.4, 3); }
    text(ctx, 'H. AYUNTAMIENTO DE JIQUILPAN DE JUÁREZ', 0, -26, 2.8, '#5a4636');
  },
};

// Portada del Estadio 18 de Marzo: twin pylons, lintel with the name, the bronze eagle on top,
// and on each side a tablet with Lázaro Cárdenas' words on the oil expropriation.
SPRITES.portadaEstadio = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -1, 46, 7);
    const stone = '#d9c09c', wall = '#f1ebdf';
    // side walls with the quote tablets
    for (const d of [-1, 1]) {
      const wx = d < 0 ? -58 : 36;
      wallFace(ctx, wx, -26, 22, 26, wall, '#8e2f24', 4);
      cornice(ctx, wx, -26, 22, stone);
      ctx.fillStyle = '#6e5a3a'; ctx.fillRect(wx + 2, -23, 18, 14);
      ctx.strokeStyle = '#c9ae6e'; ctx.lineWidth = 0.35; ctx.strokeRect(wx + 2.6, -22.4, 16.8, 12.8);
      const lines = d < 0 ? ['LOS RECURSOS NATURALES', 'DEL PAÍS DEBEN SERVIR', 'PARA SU PROPIA', 'PROSPERIDAD.'] : ['ENTREGARLOS A INTERESES', 'EXTRAÑOS ES', 'TRAICIONAR LA PATRIA.', '— LÁZARO CÁRDENAS'];
      lines.forEach((l, i) => text(ctx, l, wx + 11, -20.4 + i * 3, 1.55, '#f0dfa6'));
    }
    for (const px of [-36, 24]) {
      ctx.fillStyle = vgrad(ctx, -54, 0, shade(stone, 0.1), shade(stone, -0.15)); ctx.fillRect(px, -54, 12, 54);
      ctx.strokeStyle = 'rgba(100,80,55,0.3)'; ctx.lineWidth = 0.4;
      for (let y = -52; y < 0; y += 4) for (let x = px + ((y / 4) & 1) * 3; x < px + 12; x += 6) ctx.strokeRect(x, y, 6, 4);
    }
    ctx.fillStyle = wall; ctx.fillRect(-38, -64, 76, 12);
    cornice(ctx, -38, -64, 76, stone); cornice(ctx, -38, -52, 76, stone);
    text(ctx, 'ESTADIO 18 DE MARZO', 0, -58, 6, '#7b2d23', 'Georgia, serif');
    // open iron gates (the stadium is open)
    ctx.strokeStyle = '#24292c'; ctx.lineWidth = 0.6;
    for (const [a, b] of [[-24, -14], [14, 24]]) { for (let x = a; x <= b; x += 2) { ctx.beginPath(); ctx.moveTo(x, -48); ctx.lineTo(x, -1); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(a, -26); ctx.lineTo(b, -26); ctx.moveTo(a, -44); ctx.lineTo(b, -44); ctx.stroke(); }
    ctx.fillStyle = stone; ctx.fillRect(-8, -71, 16, 7);
    cornice(ctx, -8, -71, 16, shade(stone, -0.05));
    eagleBig(ctx, 0, -71);
  },
};
function eagleBig(ctx, x, y) {
  const b0 = '#3f3220', b1 = '#6e5a38', b2 = '#a88f5c';
  ctx.save(); ctx.translate(x, y);
  for (const d of [-1, 1]) {
    ctx.fillStyle = b1;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(d * 10, -24, d * 24, -26);
    for (let i = 0; i < 6; i++) { const t = i / 5; ctx.lineTo(d * (24 - t * 14), -26 + t * 18 + (i % 2 ? 3 : 0)); }
    ctx.quadraticCurveTo(d * 4, -3, 0, -4); ctx.fill();
    ctx.strokeStyle = b0; ctx.lineWidth = 0.45;
    for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(d * i * 1.6, -8); ctx.lineTo(d * (i * 3.4 + 3), -22 + i * 1.8); ctx.stroke(); }
    ctx.fillStyle = b2; ctx.beginPath(); ctx.moveTo(d * 2, -9); ctx.quadraticCurveTo(d * 10, -22, d * 22, -25); ctx.lineTo(d * 20, -23); ctx.quadraticCurveTo(d * 9, -19, d * 2, -8); ctx.fill();
  }
  ctx.fillStyle = b0; ctx.beginPath(); ctx.ellipse(0, -6, 3.4, 6.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = b1; ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(0, 3); ctx.lineTo(3, -1); ctx.fill();
  ctx.fillStyle = b2; ctx.beginPath(); ctx.arc(-1, -14, 2.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#d6b04a'; ctx.beginPath(); ctx.moveTo(-3.2, -14.4); ctx.quadraticCurveTo(-6.4, -14, -5.6, -12); ctx.lineTo(-3, -13); ctx.fill();
  ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(-1.8, -14.8, 0.45, 0, 7); ctx.fill();
  ctx.restore();
}

// ---- Plaza, Parque Zaragoza, bust of Diego José Abad ------------------------------------------------
// Casona of the Marín family (NW corner of the plaza): two storeys, balconies with iron railings,
// big carved door, tiled eaves.
SPRITES.casona = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 50, roof: '#c9bfae', wall: '#f1e7d2', band: '#7d2a22', bandH: 5 });
    const { x, w } = b;
    ctx.fillStyle = '#b0583d'; ctx.fillRect(x - 2, -54, w + 4, 4);
    for (let i = x - 2; i < x + w + 2; i += 2) { ctx.fillStyle = '#c56a4c'; ctx.fillRect(i, -54, 1.2, 3.6); }
    ctx.fillStyle = '#d8c3a0'; ctx.fillRect(x, -27, w, 1.6);
    for (let i = 0; i < 6; i++) {
      const wx = x + 12 + i * ((w - 24) / 6) + 4;
      rectWindow(ctx, wx, -46, 8, 15, '#d8c3a0', '#2f3a40', false);
      ctx.fillStyle = '#5b3620'; ctx.fillRect(wx + 0.4, -45.5, 3.4, 14); ctx.fillRect(wx + 4.2, -45.5, 3.4, 14);
      ctx.fillStyle = '#cdb697'; ctx.fillRect(wx - 2, -30.4, 12, 1.6);
      ironRail(ctx, wx - 2, wx + 10, -30.4, 4.4);
      if (i === 3) continue;
      rectWindow(ctx, wx, -21, 8, 13, '#d8c3a0', '#2f3a40', true);
    }
    const dx = x + 12 + 3 * ((w - 24) / 6) + 4;
    woodDoor(ctx, dx - 2, -24, 12, 24, '#4e2c18', true, '#c9ad85');
    for (let i = x + 20; i < x + w - 10; i += 38) { ctx.fillStyle = '#3f7535'; ctx.beginPath(); ctx.arc(i, -33, 2.2, 0, 7); ctx.fill(); ctx.fillStyle = '#e04d8b'; ctx.fillRect(i - 0.5, -35, 1, 1); }
    plaque(ctx, x + 8, -26, 26, 3.4, 'FAM. MARÍN', '#5b3620', '#f1e2b8');
  },
};

// Bronze statue of General Ignacio Zaragoza (uniform, kepi, spectacles) on a stone pedestal.
SPRITES.zaragoza = {
  draw(ctx, s) {
    shadowBlob(ctx, 4, -1, 16, 6);
    statueBase(ctx, 16, 30);
    plaque(ctx, -6, -20, 12, 6, 'ZARAGOZA', '#4c3d28', '#efd79a');
    const b0 = '#46503f', b1 = '#65705a', b2 = '#8e9a7e';
    ctx.save(); ctx.translate(0, -30); ctx.scale(1.3, 1.3);
    ctx.fillStyle = b0; ctx.fillRect(-2.2, -9, 1.8, 9); ctx.fillRect(0.4, -9, 1.8, 9);
    ctx.fillStyle = b1; ctx.beginPath(); ctx.moveTo(-3.8, -6); ctx.lineTo(-3, -18); ctx.lineTo(3, -18); ctx.lineTo(3.8, -6); ctx.fill();
    ctx.fillStyle = b2; ctx.fillRect(-0.3, -18, 0.6, 12); for (let i = 0; i < 4; i++) ctx.fillRect(-1.3, -16.5 + i * 2.6, 0.7, 0.7);
    ctx.fillStyle = b1; ctx.fillRect(3, -17.5, 1.4, 7); ctx.beginPath(); ctx.moveTo(-3, -17); ctx.lineTo(-6, -12); ctx.lineTo(-5, -11.5); ctx.lineTo(-2.6, -15); ctx.fill();
    ctx.strokeStyle = b0; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-5.5, -11.8); ctx.lineTo(-7, -1); ctx.stroke(); // sword
    ctx.fillStyle = b2; ctx.fillRect(-3.4, -18.6, 1.6, 1); ctx.fillRect(1.8, -18.6, 1.6, 1); // epaulettes
    ctx.fillStyle = b1; ctx.beginPath(); ctx.arc(0, -20.4, 2.3, 0, 7); ctx.fill();
    ctx.fillStyle = b0; ctx.fillRect(-2.2, -24, 4.4, 2.6); ctx.fillRect(-2.8, -21.8, 5, 0.7); // kepi
    ctx.strokeStyle = b2; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.arc(-0.9, -20.4, 0.6, 0, 7); ctx.arc(0.9, -20.4, 0.6, 0, 7); ctx.stroke(); // spectacles
    ctx.restore();
  },
};

// One of the two cast-iron hunting dogs (greyhounds) by Antoine Durenne; faces east unless flip.
SPRITES.galgo = {
  draw(ctx, s) {
    shadowBlob(ctx, 2, -1, 12, 4);
    statueBase(ctx, 22, 8, '#cbb89a');
    ctx.save(); ctx.translate(0, -8); if (s.flip) ctx.scale(-1, 1);
    const c0 = '#2d3033', c1 = '#474c50', c2 = '#6b7277';
    ctx.fillStyle = c0; ctx.fillRect(-7, -6, 1.2, 6); ctx.fillRect(-5, -6, 1.2, 6); ctx.fillRect(5, -6, 1.2, 6); ctx.fillRect(7, -5.5, 1.2, 5.5);
    ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(-8.5, -10.5, -4, -10.5); ctx.quadraticCurveTo(0, -8, 3, -9); ctx.quadraticCurveTo(7, -11, 8.5, -8); ctx.lineTo(8, -5.5); ctx.quadraticCurveTo(2, -4.2, -4, -6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6.5, -9.5); ctx.lineTo(9, -15); ctx.lineTo(10.6, -14.2); ctx.lineTo(9, -9); ctx.fill(); // neck
    ctx.beginPath(); ctx.ellipse(11.4, -15, 3, 1.4, 0.15, 0, 7); ctx.fill(); // head (long snout)
    ctx.fillStyle = c0; ctx.beginPath(); ctx.moveTo(9.6, -16); ctx.lineTo(8.6, -17.6); ctx.lineTo(10.4, -16.4); ctx.fill(); // ear
    ctx.strokeStyle = c1; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.quadraticCurveTo(-11, -6, -10, -2); ctx.stroke(); // tail
    ctx.fillStyle = c2; ctx.fillRect(-3, -10.2, 6, 0.6);
    ctx.restore();
  },
};

// Bust of Diego José Abad (1727–1779), Jesuit poet born in Jiquilpan; a gift from Bologna.
SPRITES.bustoAbad = {
  draw(ctx, s) {
    shadowBlob(ctx, 2, -1, 8, 3);
    const stone = '#cfc3ad';
    ctx.fillStyle = shade(stone, -0.2); ctx.fillRect(-6, -3, 12, 3);
    ctx.fillStyle = vgrad(ctx, -24, -3, shade(stone, 0.1), shade(stone, -0.15)); ctx.fillRect(-4, -24, 8, 21);
    cornice(ctx, -5, -24, 10, stone);
    plaque(ctx, -3.4, -16, 6.8, 4, 'ABAD', '#4b4035', '#ecdcae');
    const b = '#6b5a3c', bl = '#8f7a52';
    ctx.fillStyle = b; ctx.beginPath(); ctx.moveTo(-5, -25); ctx.quadraticCurveTo(-5, -30, 0, -30.5); ctx.quadraticCurveTo(5, -30, 5, -25); ctx.fill();
    ctx.fillStyle = '#e8e2d4'; ctx.fillRect(-1.2, -30.4, 2.4, 1.2); // collar
    ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(0, -33, 2.6, 0, 7); ctx.fill();
    ctx.fillStyle = b; ctx.beginPath(); ctx.arc(0, -33.8, 2.6, Math.PI, 0); ctx.fill();
  },
};

SPRITES.flagpole = {
  draw(ctx) {
    shadowBlob(ctx, 2, -1, 6, 2);
    ctx.fillStyle = '#cdbb9b'; ctx.fillRect(-5, -4, 10, 4); ctx.fillStyle = '#b6a282'; ctx.fillRect(-5, -1.2, 10, 1.2);
    ctx.fillStyle = '#9da3a8'; ctx.fillRect(-0.5, -58, 1, 54);
    ctx.fillStyle = '#c9a54a'; ctx.beginPath(); ctx.arc(0, -58.5, 0.9, 0, 7); ctx.fill();
  },
  anim(ctx, s, t) { flagPole(ctx, 0, -12, 46, t * 3); },
};

// Commemorative plaque on a small cantera stele.
const PLAQUES = {
  ocaranza: ['RAMÓN MARTÍNEZ', 'OCARANZA', 'POETA · 1915-1982'],
  canessi: ['FEDERICO', 'CANESSI', 'ESCULTOR'],
  gabino: ['GABINO ORTIZ', 'BIBLIOTECA', '1940'],
  cardenas: ['CASA DE', 'LÁZARO CÁRDENAS', '1895-1970'],
  quote: ['...TRAICIONAR', 'LA PATRIA', 'L. CÁRDENAS'],
  bejar: ['FELICIANO', 'BÉJAR', 'PINTOR · 1920'],
  abad: ['DIEGO JOSÉ', 'ABAD', '1727-1779'],
};
SPRITES.plaque = {
  draw(ctx, s) {
    shadowBlob(ctx, 1, -1, 5, 1.6);
    ctx.fillStyle = '#b7a283'; ctx.fillRect(-4.6, -9.5, 9.2, 9.5);
    ctx.fillStyle = '#cdb898'; ctx.fillRect(-5.2, -10.5, 10.4, 1.4);
    ctx.fillStyle = '#6b5530'; ctx.fillRect(-3.8, -8.6, 7.6, 6.2);
    ctx.strokeStyle = '#caa964'; ctx.lineWidth = 0.25; ctx.strokeRect(-3.5, -8.3, 7, 5.6);
    const L = PLAQUES[s.who] || ['', '', ''];
    L.forEach((l, i) => text(ctx, l, 0, -7.4 + i * 1.8, 0.95, '#f0dfa6'));
  },
};

// ---- the avenue: La Tipo, Casa de Lázaro Cárdenas -----------------------------------------------------
SPRITES.escuelaTipo = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 42, roof: '#c9c1b3', wall: '#f2ede2', band: '#3d6b4a', bandH: 5 });
    const { x, w } = b;
    // two storeys of classroom windows, central entrance with the name
    ctx.fillStyle = '#d9c9a8'; ctx.fillRect(x, -22, w, 1.6);
    for (let wx = x + 8; wx < x + w - 12; wx += 14) {
      if (Math.abs(wx + 4) < 26) continue;
      rectWindow(ctx, wx, -38, 9, 11, '#d9c9a8', '#35505e', false);
      ctx.fillStyle = '#e8eef0'; ctx.fillRect(wx + 4.2, -38, 0.6, 11);
      rectWindow(ctx, wx, -17, 9, 10, '#d9c9a8', '#35505e', true);
    }
    ctx.fillStyle = '#f2ede2'; ctx.fillRect(-26, -52, 52, 12);
    cornice(ctx, -26, -52, 52, '#d9c9a8');
    plaque(ctx, -24, -50, 48, 6, 'ESCUELA “LA TIPO”', '#2f5b3f', '#f4ecd0');
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(-10, -24, 20, 24);
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 0.5; for (let i = -9; i < 10; i += 1.6) { ctx.beginPath(); ctx.moveTo(i, -24); ctx.lineTo(i, 0); ctx.stroke(); }
    // murals of kids' drawings along the lower wall
    const r = rng(12);
    for (let i = x + 4; i < x + w - 4; i += 3) { if (Math.abs(i) < 14) continue; ctx.fillStyle = pick(r, ['#e05a4f', '#f0c34a', '#6bbf7a', '#5aa0d8', '#b88be0']); ctx.fillRect(i, -4.4, 2, 1.8); }
    flagPole(ctx, x + w - 16, -42, 20, 0.6);
  },
};

SPRITES.casaCardenas = {
  draw(ctx, s) {
    const b = building(ctx, s, { fh: 34, roof: '#b35a3e', wall: '#f3ecdc', band: '#8e2f24', bandH: 6, tiled: true, patio: true });
    const { x, w } = b;
    ctx.fillStyle = '#b0583d'; ctx.fillRect(x - 2, -38, w + 4, 4);
    for (let i = x - 2; i < x + w + 2; i += 2) { ctx.fillStyle = '#c56a4c'; ctx.fillRect(i, -38, 1.2, 3.6); }
    for (let wx = x + 14; wx < x + w - 14; wx += 22) {
      if (Math.abs(wx + 5) < 18) continue;
      ctx.fillStyle = '#d8c19f'; ctx.fillRect(wx - 2, -28, 14, 20);
      rectWindow(ctx, wx, -26, 10, 16, '#c9ad85', '#2f3a40', true);
      ctx.fillStyle = '#cdb697'; ctx.fillRect(wx - 2, -9.5, 14, 1.4);
    }
    ctx.fillStyle = '#c9ad85'; ctx.fillRect(-12, -30, 24, 30);
    woodDoor(ctx, -8, -26, 16, 26, '#4e2c18', false, '#b39570');
    plaque(ctx, -26, -35.6, 52, 4, 'CASA DE LÁZARO CÁRDENAS', '#4a3b2a', '#f1dfa8');
  },
};

// ---- the stadium's palenque, a round arena --------------------------------------------------------------
SPRITES.palenque = {
  draw(ctx, s) {
    const W = s.fw, D = s.fd;
    shadowBlob(ctx, 6, -2, W * 0.5, 9);
    const cx = 0, cy = -D / 2, rx = W / 2 - 4, ry = D / 2 - 4;
    // round wall
    ctx.fillStyle = '#d9cfbd'; ctx.beginPath(); ctx.ellipse(cx, cy + 22, rx, ry, 0, 0, Math.PI); ctx.lineTo(-rx, cy); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); ctx.fill();
    ctx.fillStyle = '#9b2b24'; ctx.beginPath(); ctx.ellipse(cx, cy + 22, rx, ry, 0, 0, Math.PI); ctx.lineTo(-rx, cy + 18); ctx.ellipse(cx, cy + 18, rx, ry, 0, Math.PI, 0, true); ctx.fill();
    // conical sheet roof
    const g = ctx.createRadialGradient(-rx * 0.3, cy - 20, 4, 0, cy, rx);
    g.addColorStop(0, '#c9ced1'); g.addColorStop(1, '#7d8589');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx + 3, ry + 2, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(40,40,45,0.35)'; ctx.lineWidth = 0.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) { ctx.beginPath(); ctx.moveTo(cx, cy - 16); ctx.lineTo(cx + Math.cos(a) * (rx + 3), cy + Math.sin(a) * (ry + 2)); ctx.stroke(); }
    ctx.fillStyle = '#e8ebec'; ctx.beginPath(); ctx.ellipse(cx, cy - 16, 8, 4, 0, 0, 7); ctx.fill();
    // entrance and sign
    ctx.fillStyle = '#2b2320'; ctx.fillRect(-9, -20, 18, 20);
    plaque(ctx, -22, -30, 44, 7, 'PALENQUE', '#9b2b24', '#f7e7c0');
    for (const px of [-40, 40]) { ctx.fillStyle = '#f2c230'; ctx.fillRect(px - 8, -18, 16, 10); text(ctx, px < 0 ? 'PELEAS' : 'BAILE', px, -13, 3, '#1b1b1b'); }
  },
};

// ---- small things -----------------------------------------------------------------------------------------
SPRITES.fuenteChica = {
  draw(ctx) {
    shadowBlob(ctx, 2, -1, 14, 5);
    ctx.fillStyle = '#b9a27f'; ctx.beginPath(); ctx.ellipse(0, -3, 13, 5.4, 0, 0, 7); ctx.fill(); ctx.fillRect(-13, -5, 26, 2);
    ctx.fillStyle = '#d4bf9c'; ctx.beginPath(); ctx.ellipse(0, -5, 13, 5.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4b95b8'; ctx.beginPath(); ctx.ellipse(0, -5.4, 11, 4.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#d4bf9c'; ctx.fillRect(-1.5, -14, 3, 9); ctx.beginPath(); ctx.ellipse(0, -14, 4, 1.6, 0, 0, 7); ctx.fill();
  },
  anim(ctx, s, t) {
    ctx.strokeStyle = 'rgba(210,238,255,0.7)'; ctx.lineWidth = 0.6;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 3, -14.5); ctx.quadraticCurveTo(d * 6, -17 - Math.sin(t * 6) * 0.3, d * 8, -6); ctx.stroke(); }
  },
};

SPRITES.trash = {
  draw(ctx, s) {
    const r = rng((s.seed || 0) + 5);
    shadowBlob(ctx, 1, 0, 5, 1.8);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = pick(r, ['#1f1f22', '#2c2f33', '#e8e8e2', '#3a5f9a']);
      const x = (r() - 0.5) * 6, h = 3 + r() * 3;
      ctx.beginPath(); ctx.ellipse(x, -h / 2, 2.4 + r(), h / 2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x - 1, -h + 0.6, 0.6, h * 0.5);
    }
    if (r() < 0.5) { ctx.fillStyle = '#c28a2c'; ctx.fillRect(2, -1.6, 1.2, 1.6); ctx.fillStyle = '#e04d4d'; ctx.fillRect(-3, -1, 2, 1); }
  },
};

SPRITES.casitaPiedra = {
  draw(ctx, s) {
    const W = s.fw, D = s.fd, x = -W / 2, fh = 30;
    ctx.fillStyle = 'rgba(20,20,40,0.22)'; ctx.fillRect(x + 4, -2, W, 5);
    // two-slope tiled roof
    ctx.fillStyle = '#a9553b'; ctx.fillRect(x - 4, -D, W + 8, D - fh + 4);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = -D + 3; y < -fh + 4; y += 3) ctx.fillRect(x - 4, y, W + 8, 0.7);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = x - 4; i < x + W + 4; i += 3) ctx.fillRect(i, -D, 1.3, D - fh + 4);
    ctx.fillStyle = '#7e3c28'; ctx.fillRect(x - 4, -(D + fh) / 2 - 1, W + 8, 2);
    rubble(ctx, x, -fh, W, fh, 1313, '#8a7a68');
    ctx.fillStyle = '#b99a74'; ctx.fillRect(-9, -22, 18, 22);
    woodDoor(ctx, -6, -19, 12, 19, '#5a3620', false, '#8e6a44');
    for (const wx of [x + 14, x + W - 26]) { rectWindow(ctx, wx, -20, 12, 10, '#8e6a44', '#2f3a40', true); }
    // rebozos hanging by the door
    const cols = ['#2b3f8f', '#5b3f7a', '#8e2f24', '#1f6b5a', '#c28a2c'];
    cols.forEach((c, i) => { const px = x + 30 + i * 6; ctx.fillStyle = c; ctx.fillRect(px, -26, 4.2, 14); ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 4; k++) ctx.fillRect(px, -24 + k * 3, 4.2, 0.4); ctx.fillStyle = c; for (let k = 0; k < 4; k++) ctx.fillRect(px + k, -12, 0.4, 2); });
    plaque(ctx, -20, -29, 40, 4.4, 'LA CASITA DE PIEDRA', '#3f2f22', '#efd9a8');
  },
};

// A little ocote fire outside a house at night: split pine sticks in a tin can on three stones.
SPRITES.ocote = {
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 6, 2);
    ctx.fillStyle = '#6d6a64'; for (const [x, y] of [[-3.4, -1], [3.4, -1], [0, 0.6]]) { ctx.beginPath(); ctx.ellipse(x, y, 2, 1.2, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#4a4744'; ctx.fillRect(-3, -5, 6, 4.4); ctx.fillStyle = '#6a6560'; ctx.fillRect(-3, -5.2, 6, 0.8);
    ctx.strokeStyle = '#6b3f1e'; ctx.lineWidth = 0.8;
    for (const a of [-0.4, 0, 0.35]) { ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(Math.sin(a) * 5, -4 - Math.cos(a) * 5); ctx.stroke(); }
  },
  anim(ctx, s, t, night) {
    const f = Math.sin(t * 13 + s.x) * 0.6 + Math.sin(t * 7.3) * 0.4;
    ctx.fillStyle = 'rgba(255,140,40,0.85)'; ctx.beginPath(); ctx.moveTo(-2.6, -6); ctx.quadraticCurveTo(-2 + f * 0.4, -11, 0, -14 - f); ctx.quadraticCurveTo(2 + f * 0.4, -11, 2.6, -6); ctx.fill();
    ctx.fillStyle = 'rgba(255,225,120,0.9)'; ctx.beginPath(); ctx.moveTo(-1.3, -6); ctx.quadraticCurveTo(-0.8, -9, 0, -11 - f * 0.6); ctx.quadraticCurveTo(0.8, -9, 1.3, -6); ctx.fill();
    ctx.fillStyle = 'rgba(90,90,95,0.25)'; for (let i = 0; i < 3; i++) { const k = (t * 0.7 + i / 3) % 1; ctx.beginPath(); ctx.arc(Math.sin(t + i) * 2 * k, -15 - k * 14, 1.5 + k * 2.5, 0, 7); ctx.fill(); }
  },
};

// Copper cazo for weekend carnitas and chicharrones on a street corner.
SPRITES.cazo = {
  draw(ctx) {
    shadowBlob(ctx, 2, 0, 13, 4);
    ctx.fillStyle = '#3a3a3c'; for (const x of [-7, 7]) ctx.fillRect(x - 0.6, -7, 1.2, 7);
    ctx.fillStyle = '#b8b8bc'; ctx.fillRect(-8, -3, 16, 1);
    const g = ctx.createLinearGradient(-10, 0, 10, 0); g.addColorStop(0, '#8a4a22'); g.addColorStop(0.4, '#d7894a'); g.addColorStop(1, '#7a3c1a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-10, -12); ctx.quadraticCurveTo(-9, -4, 0, -4); ctx.quadraticCurveTo(9, -4, 10, -12); ctx.fill();
    ctx.fillStyle = '#6b3a1a'; ctx.beginPath(); ctx.ellipse(0, -12, 10, 3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#a4642c'; ctx.beginPath(); ctx.ellipse(0, -12, 8.6, 2.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#c98a4a'; for (const [x, y] of [[-4, -12.4], [1, -11.6], [4, -12.6], [-1, -13]]) { ctx.beginPath(); ctx.ellipse(x, y, 1.6, 0.9, 0, 0, 7); ctx.fill(); }
    // table with tortillas and salsa
    ctx.fillStyle = '#8b6a45'; ctx.fillRect(11, -8, 12, 2); ctx.fillRect(12, -6, 1, 6); ctx.fillRect(21, -6, 1, 6);
    ctx.fillStyle = '#efe2b8'; ctx.beginPath(); ctx.ellipse(14.5, -8.6, 2.4, 0.9, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b3261e'; ctx.beginPath(); ctx.arc(19.5, -8.8, 1.2, 0, 7); ctx.fill();
  },
  anim(ctx, s, t) {
    ctx.fillStyle = 'rgba(245,245,245,0.28)';
    for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i / 4) % 1; ctx.beginPath(); ctx.arc(Math.sin(t * 1.3 + i * 2) * 3 * k, -14 - k * 18, 1.6 + k * 3.4, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,120,30,0.55)'; ctx.beginPath(); ctx.ellipse(0, -3.4, 5 + Math.sin(t * 11) * 0.6, 1, 0, 0, 7); ctx.fill();
  },
};

// Pushable stone on the cerro (drawn a bit rounder than the scenery rocks).
SPRITES.boulder = {
  draw(ctx, s) {
    const k = s.size || 1;
    shadowBlob(ctx, 2 * k, 0, 9 * k, 3 * k, 0.3);
    ctx.fillStyle = '#7f786d'; ctx.beginPath(); ctx.moveTo(-8 * k, 0); ctx.quadraticCurveTo(-9 * k, -8 * k, -2 * k, -10 * k); ctx.quadraticCurveTo(7 * k, -10 * k, 8 * k, -3 * k); ctx.lineTo(7 * k, 0); ctx.fill();
    ctx.fillStyle = '#a39c8f'; ctx.beginPath(); ctx.moveTo(-6 * k, -6 * k); ctx.quadraticCurveTo(-4 * k, -9.5 * k, 1 * k, -9 * k); ctx.lineTo(0, -5 * k); ctx.fill();
    ctx.fillStyle = 'rgba(80,110,60,0.5)'; ctx.fillRect(-7 * k, -1.2 * k, 5 * k, 1.2 * k);
  },
};

// La Piedrita: a little waterfall over dark rock into a pool.
SPRITES.piedrita = {
  draw(ctx) {
    shadowBlob(ctx, 3, -1, 34, 8);
    const r = rng(808);
    ctx.fillStyle = '#4f4a44'; ctx.beginPath(); ctx.moveTo(-36, -4); ctx.lineTo(-30, -40); ctx.lineTo(-10, -52); ctx.lineTo(12, -50); ctx.lineTo(32, -36); ctx.lineTo(36, -4); ctx.fill();
    for (let i = 0; i < 40; i++) { ctx.fillStyle = pick(r, ['#5d5750', '#6b645b', '#3f3a35', '#77705f']); ctx.beginPath(); ctx.ellipse(-30 + r() * 60, -46 + r() * 40, 3 + r() * 5, 2 + r() * 3, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(90,130,60,0.7)'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(-34 + r() * 68, -48 + r() * 30, 1.5 + r() * 2.5, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#35607a'; ctx.beginPath(); ctx.ellipse(0, -4, 24, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4b89a8'; ctx.beginPath(); ctx.ellipse(-2, -5, 20, 5, 0, 0, 7); ctx.fill();
  },
  anim(ctx, s, t) {
    ctx.fillStyle = 'rgba(215,240,255,0.75)';
    for (let i = 0; i < 5; i++) { const x = -5 + i * 2.2; ctx.fillRect(x, -48 + ((t * 30 + i * 7) % 6), 1.1, 42); }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 6; i++) { const a = (t * 2 + i) % 3; ctx.beginPath(); ctx.ellipse(0 + (i - 3) * 2, -6, 2 + a * 2, 0.6 + a * 0.4, 0, 0, 7); ctx.globalAlpha = 1 - a / 3; ctx.fill(); }
    ctx.globalAlpha = 1;
  },
};

// Giant maguey of the cerro.
SPRITES.maguey = {
  draw(ctx, s) {
    const k = s.size || 1.6, r = rng(s.seed || 4);
    shadowBlob(ctx, 3 * k, 0, 12 * k, 4 * k);
    for (let i = 0; i < 15; i++) {
      const a = Math.PI + 0.1 + (i / 14) * (Math.PI - 0.2) + (r() - 0.5) * 0.1;
      const L = (11 + r() * 5) * k;
      ctx.fillStyle = i % 3 === 0 ? '#5d8a80' : i % 3 === 1 ? '#76a497' : '#8fb8a8';
      ctx.beginPath(); ctx.moveTo(-1.8 * k, 0); ctx.quadraticCurveTo(Math.cos(a) * L * 0.5, Math.sin(a) * L * 0.6 - 2, Math.cos(a) * L, Math.sin(a) * L * 1.1); ctx.lineTo(1.8 * k, 0); ctx.fill();
      ctx.fillStyle = '#c7b35a'; ctx.fillRect(Math.cos(a) * L - 0.3, Math.sin(a) * L * 1.1 - 0.3, 0.7, 0.7);
    }
    if (s.quiote) { ctx.strokeStyle = '#8a7a4a'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(0, -4 * k); ctx.lineTo(1.5 * k, -40 * k); ctx.stroke(); ctx.fillStyle = '#d8c25a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(1.3 * k + (i % 2 ? 3 : -3) * k, (-26 - i * 3) * k, 1.8 * k, 0, 7); ctx.fill(); } }
  },
};

// Ficus trimmed into a box, with a whitewashed trunk (plaza style).
export function drawFicus(ctx, s) {
  const k = s.size || 1, r = rng(s.seed || 7);
  shadowBlob(ctx, 5 * k, 0, 15 * k, 5 * k, 0.3);
  ctx.fillStyle = '#6b4a30'; ctx.fillRect(-2 * k, -18 * k, 4 * k, 18 * k);
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(-2.2 * k, -9 * k, 4.4 * k, 9 * k);
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0.6 * k, -9 * k, 1.6 * k, 9 * k);
  const x = -15 * k, y = -44 * k, w = 30 * k, h = 26 * k;
  ctx.fillStyle = '#2f5e2e'; roundRect(ctx, x, y + 3 * k, w, h, 4 * k); ctx.fill();
  ctx.fillStyle = '#3f7a38'; roundRect(ctx, x, y, w, h - 3 * k, 4 * k); ctx.fill();
  ctx.fillStyle = '#56914a'; roundRect(ctx, x + 1 * k, y, w - 2 * k, 7 * k, 3 * k); ctx.fill();
  for (let i = 0; i < 40; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(20,50,20,0.35)' : 'rgba(140,200,110,0.3)'; ctx.fillRect(x + r() * w, y + r() * (h - 2 * k), 1.2 * k, 1.2 * k); }
}
const baseTree = SPRITES.tree.draw;
SPRITES.tree.draw = function (ctx, s) {
  if (s.tree === 'ficus') return drawFicus(ctx, s);
  baseTree.call(this, ctx, s);
  if (s.tree === 'jacaranda' && s.bloom) { // a wider carpet of fallen flowers under the tree
    const r = rng((s.seed || 1) + 91), k = s.size || 1;
    for (let i = 0; i < 70; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(154,123,208,0.9)' : 'rgba(185,160,230,0.9)'; const a = r() * 6.283, d = Math.sqrt(r()) * 26 * k; ctx.fillRect(Math.cos(a) * d, Math.sin(a) * d * 0.4, 1.3, 1.1); }
  }
};

// Portal columns seen from the street: cantera columns joined by arches under a tiled eave; the
// Portal Azul's are painted blue and white. Each sprite draws its column and the arch to the next one.
SPRITES.portalCol.draw = function (ctx, s) {
  const blue = s.blue, span = s.span || 32, H = 30;
  const stone = blue ? '#f2f5f8' : '#e6d2b3', stoneD = blue ? '#d4dde6' : '#c9b08e', trim = blue ? '#2e6fb3' : '#bfa47f';
  ctx.fillStyle = 'rgba(20,20,40,0.18)'; ctx.fillRect(-2, -1, span, 2);
  // arch spandrel to the next column
  ctx.fillStyle = blue ? '#2e6fb3' : '#dcc4a0';
  ctx.beginPath(); ctx.moveTo(0, -H - 8); ctx.lineTo(span, -H - 8); ctx.lineTo(span, -H + 4);
  ctx.arc(span / 2, -H + 4, span / 2 - 2.2, 0, Math.PI, true); ctx.lineTo(0, -H + 4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = blue ? '#f4f7fb' : 'rgba(120,90,60,0.45)'; ctx.lineWidth = blue ? 0.9 : 0.5;
  ctx.beginPath(); ctx.arc(span / 2, -H + 4, span / 2 - 2.2, Math.PI, 0); ctx.stroke();
  // eave: cornice and clay tiles
  ctx.fillStyle = blue ? '#f4f7fb' : '#cdb592'; ctx.fillRect(-2, -H - 10, span + 1, 2.4);
  ctx.fillStyle = '#b0583d'; ctx.fillRect(-2, -H - 16, span + 1, 6);
  ctx.fillStyle = '#c56a4c'; for (let i = -2; i < span - 1; i += 2) ctx.fillRect(i, -H - 16, 1.1, 5.6);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-2, -H - 10.6, span + 1, 0.6);
  // column
  ctx.fillStyle = vgrad(ctx, -H, 0, stone, stoneD); ctx.fillRect(-2, -H + 2, 4, H - 2);
  ctx.fillStyle = trim; ctx.fillRect(-3, -2, 6, 2); ctx.fillRect(-3, -H + 0.5, 6, 2.2);
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-1.6, -H + 3, 0.8, H - 6);
};

// Horses for the cerro (drawn as sprites by the animal entity).
export function drawHorse(ctx, dir, t, color = '#6b4428', moving = false) {
  const leg = moving ? Math.sin(t * 9) * 2 : 0;
  ctx.save(); if (dir < 0) ctx.scale(-1, 1);
  shadowBlob(ctx, 0, 0, 13, 3.5, 0.25);
  ctx.fillStyle = shade(color, -0.25);
  ctx.fillRect(-9 + leg * 0.4, -10, 1.8, 10); ctx.fillRect(6 - leg * 0.4, -10, 1.8, 10);
  ctx.fillStyle = color;
  ctx.fillRect(-7 - leg * 0.4, -10, 1.8, 10); ctx.fillRect(8 + leg * 0.4, -10, 1.8, 10);
  ctx.beginPath(); ctx.ellipse(0, -13, 11, 5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7, -15); ctx.lineTo(12, -24); ctx.lineTo(15, -22); ctx.lineTo(11, -12); ctx.fill();
  ctx.beginPath(); ctx.ellipse(15.4, -22.6, 4.2, 2, 0.5, 0, 7); ctx.fill();
  ctx.fillStyle = shade(color, -0.45); ctx.beginPath(); ctx.moveTo(7, -16); ctx.lineTo(11.6, -25); ctx.lineTo(10, -17); ctx.fill();
  ctx.strokeStyle = shade(color, -0.45); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-10.5, -14); ctx.quadraticCurveTo(-14, -10, -12.6, -5); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(15.5, -23.6, 0.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8e2d4'; if (color === '#8a6a4a') ctx.fillRect(16, -23, 3, 0.8);
  ctx.restore();
}

// ---- interior furniture ----------------------------------------------------------------------------
SPRITES.wheelchair = {
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 9, 2.5);
    ctx.strokeStyle = '#2b2f33'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(-3, -6, 6, 0, 7); ctx.stroke();
    ctx.lineWidth = 0.3; for (let a = 0; a < 6.28; a += 0.8) { ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(-3 + Math.cos(a) * 6, -6 + Math.sin(a) * 6); ctx.stroke(); }
    ctx.fillStyle = '#2b2f33'; ctx.beginPath(); ctx.arc(6, -1.6, 1.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#3d5a80'; ctx.fillRect(-4, -12, 9, 2.4); ctx.fillRect(-5, -22, 2.4, 11);
    ctx.fillStyle = '#9aa3aa'; ctx.fillRect(4, -10, 0.8, 8); ctx.fillRect(-5, -23, 0.8, 22);
  },
};
SPRITES.telar = { // backstrap loom: warp threads tied to a post, the weaver kneels in front
  draw(ctx, s) {
    shadowBlob(ctx, 2, 0, 16, 3);
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(-16, -26, 2.4, 26);
    const cols = ['#2b3f8f', '#f5f0e6', '#2b3f8f', '#1d1d1f', '#2b3f8f'];
    for (let i = 0; i < 22; i++) { ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.moveTo(-14, -22 + i * 0.4); ctx.lineTo(10, -8 + i * 0.25); ctx.stroke(); }
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(9, -12, 1.4, 10); ctx.fillRect(-2, -18, 1, 8);
    ctx.fillStyle = '#2b3f8f'; ctx.fillRect(2, -13, 7, 5); ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 6; i++) ctx.fillRect(2.5 + i, -12 + (i % 2), 0.5, 0.5);
  },
};
SPRITES.rebozoRack = {
  draw(ctx, s) {
    const r = rng(s.seed || 3);
    shadowBlob(ctx, 1, 0, 16, 2.5);
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(-16, -30, 1.4, 30); ctx.fillRect(14.6, -30, 1.4, 30); ctx.fillRect(-16, -30, 32, 1.4);
    for (let i = 0; i < 6; i++) {
      const c = pick(r, ['#2b3f8f', '#5b3f7a', '#8e2f24', '#1f6b5a', '#1d1d1f', '#6d4c2f', '#c28a2c']);
      const x = -14 + i * 5;
      ctx.fillStyle = c; ctx.fillRect(x, -29, 4.4, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let k = 0; k < 8; k++) ctx.fillRect(x + (k % 2) * 2, -27 + k * 2.2, 0.6, 0.6);
      ctx.fillStyle = c; for (let k = 0; k < 5; k++) ctx.fillRect(x + k * 0.9, -9, 0.35, 3);
    }
  },
};
SPRITES.ruedo = { // cockfight pit: round sand ring, low wall, benches around
  draw(ctx) {
    shadowBlob(ctx, 0, 0, 44, 16, 0.2);
    ctx.fillStyle = '#7a2626'; ctx.beginPath(); ctx.ellipse(0, -8, 40, 16, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#d9c29a'; ctx.beginPath(); ctx.ellipse(0, -10, 36, 13.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(120,90,50,0.25)'; for (let i = 0; i < 30; i++) ctx.fillRect(-30 + (i * 37) % 60, -18 + (i * 13) % 16, 1, 0.6);
    ctx.strokeStyle = '#f7f1e3'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-4, -10); ctx.moveTo(4, -10); ctx.lineTo(8, -10); ctx.stroke();
  },
};
SPRITES.pupitre = {
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 6, 2);
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(-5, -9, 10, 2); ctx.fillStyle = '#5b5f63'; ctx.fillRect(-4.4, -7, 0.8, 7); ctx.fillRect(3.6, -7, 0.8, 7);
    ctx.fillStyle = '#6b8a9a'; ctx.fillRect(-4, -5, 8, 1.4);
  },
};
SPRITES.ropero = {
  draw(ctx, s) {
    shadowBlob(ctx, 1, 0, 10, 2.5);
    ctx.fillStyle = '#6b4226'; ctx.fillRect(-10, -34, 20, 34);
    ctx.fillStyle = '#7d5031'; ctx.fillRect(-9, -32, 8.6, 26); ctx.fillRect(0.4, -32, 8.6, 26);
    ctx.fillStyle = 'rgba(200,220,235,0.45)'; ctx.fillRect(-7.6, -30, 5.6, 16);
    ctx.fillStyle = '#c9a54a'; ctx.fillRect(-1.4, -20, 0.8, 2); ctx.fillRect(0.6, -20, 0.8, 2);
    ctx.fillStyle = '#5b3620'; ctx.fillRect(-10, -5, 20, 5); ctx.fillStyle = '#c9a54a'; ctx.fillRect(-1, -3, 2, 0.8);
  },
};
SPRITES.baul = {
  draw(ctx) {
    shadowBlob(ctx, 1, 0, 9, 2);
    ctx.fillStyle = '#6d4c2f'; ctx.fillRect(-9, -9, 18, 9);
    ctx.fillStyle = '#7f5a38'; ctx.beginPath(); ctx.moveTo(-9, -9); ctx.quadraticCurveTo(0, -14, 9, -9); ctx.fill();
    ctx.fillStyle = '#3b3b3b'; ctx.fillRect(-7, -12, 1, 12); ctx.fillRect(6, -12, 1, 12); ctx.fillStyle = '#c9a54a'; ctx.fillRect(-1, -8, 2, 2);
  },
};
SPRITES.maceta = {
  draw(ctx, s) {
    const r = rng(s.seed || 2);
    shadowBlob(ctx, 1, 0, 5, 1.6);
    ctx.fillStyle = '#b5583a'; ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(4, -7); ctx.lineTo(3, 0); ctx.lineTo(-3, 0); ctx.fill();
    treeCanopy(ctx, 0, -11, 5, ['#2f6a34', '#4c8f45', r() < 0.5 ? '#e0457b' : '#f2c230'], r, 6);
  },
};
SPRITES.toolWall = {
  draw(ctx, s) {
    const w = s.fw || 40, r = rng(s.seed || 8);
    ctx.fillStyle = '#9a8a70'; ctx.fillRect(-w / 2, -30, w, 26);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let x = -w / 2 + 2; x < w / 2; x += 2.2) for (let y = -28; y < -6; y += 2.2) ctx.fillRect(x, y, 0.5, 0.5);
    for (let i = 0; i < 12; i++) { ctx.fillStyle = pick(r, ['#c0392b', '#2b2b2b', '#f2c230', '#1f6fb3', '#9aa3aa', '#e8e2d4']); ctx.fillRect(-w / 2 + 3 + r() * (w - 8), -28 + r() * 18, 2 + r() * 3, 1 + r() * 5); }
    ctx.fillStyle = '#6b5a45'; ctx.fillRect(-w / 2, -4, w, 4);
  },
};

// A parked car on the gravity hill that slowly rolls "uphill" (south) by itself, then fades.
SPRITES.rollingCar = {
  draw() {},
  anim(ctx, s, t) {
    const k = (t * 0.08) % 1, a = k < 0.1 ? k / 0.1 : k > 0.85 ? (1 - k) / 0.15 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(0, k * 110); drawCarSide(ctx, '#8a1f1f', 'tsuru', false); ctx.restore();
  },
};
