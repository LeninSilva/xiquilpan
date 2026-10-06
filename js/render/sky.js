// The sky over Jiquilpan, painted as a panorama: the colour of the hour, sun and moon, clouds lit
// from below by the town, stars and the Milky Way where the town's light pollution lets them through,
// the layered blue mountains of the Ciénega, and a skyline — the dome and tower of San Francisco,
// palms, jacarandas, tinacos, antennas with their red lights — or, from the cerro, the town spread
// out below like embers. Used by the title screen, by “Mirar el cielo” at the miradores, and by the
// night of the lights.
const R = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, t) => a + (b - a) * t;
function mixHex(a, b, t) {
  const p = (h) => h[0] === '#' ? [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)] : h.match(/[\d.]+/g).slice(0, 3).map(Number);
  const A = p(a), B = p(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
// palette keyframes by hour: [zenith, horizon, ground-haze]
const KEYS = [
  [0, '#060a1c', '#1c1838', '#0c0c16'], [4.8, '#0a0f26', '#2a2244', '#121220'], [5.8, '#2a2f5e', '#e08a6a', '#3a2a30'], [6.6, '#4a78b8', '#f6c08a', '#6a5a50'],
  [8, '#4f8fd6', '#cfe2ef', '#8a9aa0'], [13, '#3f86d8', '#d8ecf6', '#9aaab0'], [17.2, '#5a8ccc', '#f0d8b0', '#8a8070'], [18.4, '#4a4a8a', '#f08a4a', '#5a3a3a'],
  [19.2, '#1e2050', '#c0506a', '#2a1a2a'], [20.2, '#0c1030', '#3a2a50', '#141420'], [24, '#060a1c', '#1c1838', '#0c0c16'],
];
function palette(h) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [h0, z0, o0, g0] = KEYS[i], [h1, z1, o1, g1] = KEYS[i + 1];
    if (h >= h0 && h <= h1) { const t = (h - h0) / (h1 - h0 || 1); return [mixHex(z0, z1, t), mixHex(o0, o1, t), mixHex(g0, g1, t)]; }
  }
  return [KEYS[0][1], KEYS[0][2], KEYS[0][3]];
}
export function nightness(h) { return h >= 20.2 || h < 4.8 ? 1 : h > 19 ? (h - 19) / 1.2 : h < 5.8 ? 1 - (h - 4.8) : 0; }

export function paintSky(ctx, W, H, o = {}) {
  const h = o.hour ?? 21, t = o.t ?? 0, cloud = o.cloud ?? 0.3, view = o.view || 'town';
  const night = nightness(h), m = Math.min(W, H);
  const horizon = H * (view === 'cerro' ? 0.5 : 0.74);
  const [zen, hor, haze] = palette(h);
  // sky gradient
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, zen); g.addColorStop(0.75, mixHex('#000000', '#000000', 0) === '' ? hor : hor); g.addColorStop(1, hor);
  ctx.fillStyle = zen; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 2);
  // light pollution: a warm dome over the town (stronger from the cerro, looking down at it)
  const lp = night * (view === 'cerro' ? 0.55 : 0.4);
  if (lp > 0) {
    const lg = ctx.createRadialGradient(W * 0.5, horizon, 0, W * 0.5, horizon, W * 0.75);
    lg.addColorStop(0, `rgba(255,150,70,${lp})`); lg.addColorStop(0.35, `rgba(200,110,80,${lp * 0.45})`); lg.addColorStop(1, 'rgba(120,60,90,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, horizon);
  }
  // stars and the Milky Way, fading toward the glowing horizon
  if (night > 0.05) {
    const n = Math.floor(1400 * night);
    for (let i = 0; i < n; i++) {
      const x = R(i) * W, y = Math.pow(R(i + 0.5), 1.4) * horizon;
      const fadeLP = 1 - Math.max(0, (y / horizon - 0.45) / 0.55) * (0.6 + lp);
      const tw = 0.6 + 0.4 * Math.sin(t * (1 + R(i + 2) * 3) + i);
      const a = night * fadeLP * tw * (0.35 + R(i + 3) * 0.65);
      if (a <= 0.02) continue;
      const s = R(i + 4) < 0.04 ? 2.2 : R(i + 4) < 0.25 ? 1.4 : 0.9;
      ctx.fillStyle = R(i + 5) < 0.15 ? `rgba(255,220,190,${a})` : R(i + 5) < 0.3 ? `rgba(190,210,255,${a})` : `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, s * (m / 700), s * (m / 700));
    }
    // the Milky Way: a soft diagonal band with dust lanes and dense faint stars
    ctx.save(); ctx.translate(W * 0.55, horizon * 0.42); ctx.rotate(-0.55);
    const mw = ctx.createLinearGradient(0, -m * 0.12, 0, m * 0.12);
    mw.addColorStop(0, 'rgba(200,190,255,0)'); mw.addColorStop(0.45, `rgba(210,200,240,${0.16 * night * (1 - lp * 0.6)})`); mw.addColorStop(0.5, `rgba(240,225,220,${0.22 * night * (1 - lp * 0.6)})`); mw.addColorStop(0.55, `rgba(210,200,240,${0.16 * night * (1 - lp * 0.6)})`); mw.addColorStop(1, 'rgba(200,190,255,0)');
    ctx.fillStyle = mw; ctx.fillRect(-W, -m * 0.12, W * 2, m * 0.24);
    for (let i = 0; i < 900 * night; i++) { const x = (R(i + 50) - 0.5) * W * 2, y = (R(i + 51) - 0.5) * m * 0.18 * (0.5 + R(i + 52)); ctx.fillStyle = `rgba(255,250,240,${0.25 * night * R(i + 53)})`; ctx.fillRect(x, y, 1, 1); }
    for (let i = 0; i < 9; i++) { const ex = (R(i + 70) - 0.5) * W * 1.4, ey = (R(i + 71) - 0.5) * m * 0.04, er = m * (0.06 + R(i + 72) * 0.08); const dg = ctx.createRadialGradient(ex, ey, 0, ex, ey, er); dg.addColorStop(0, `rgba(14,12,30,${0.16 * night})`); dg.addColorStop(1, 'rgba(14,12,30,0)'); ctx.save(); ctx.translate(ex, ey); ctx.scale(1, 0.18); ctx.translate(-ex, -ey); ctx.fillStyle = dg; ctx.fillRect(ex - er, ey - er, er * 2, er * 2); ctx.restore(); }
    ctx.restore();
    // a shooting star now and then
    const st = (t * 0.13) % 1;
    if (st < 0.05) { const p = st / 0.05, sx = W * (0.2 + R(Math.floor(t * 0.13)) * 0.6), sy = horizon * 0.2; ctx.strokeStyle = `rgba(255,255,255,${1 - p})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx + p * 120, sy + p * 50); ctx.lineTo(sx + p * 120 - 40, sy + p * 50 - 16); ctx.stroke(); }
  }
  // the sun or the moon
  const day = 1 - night;
  if (h > 5.6 && h < 19.4) {
    const p = (h - 6) / 12.6, sx = W * (0.12 + p * 0.76), sy = horizon - Math.sin(Math.min(1, Math.max(0, p)) * Math.PI) * horizon * 0.8;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, m * 0.22); sg.addColorStop(0, 'rgba(255,250,225,0.95)'); sg.addColorStop(0.08, 'rgba(255,236,190,0.75)'); sg.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = sg; ctx.fillRect(sx - m * 0.22, sy - m * 0.22, m * 0.44, m * 0.44);
    ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(sx, sy, m * 0.022, 0, 7); ctx.fill();
  } else {
    const p = ((h + 24 - 19.5) % 24) / 11, mx = W * (0.15 + p * 0.7), my = horizon - Math.sin(Math.min(1, Math.max(0, p)) * Math.PI) * horizon * 0.75;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, m * 0.16); mg.addColorStop(0, 'rgba(220,230,255,0.35)'); mg.addColorStop(1, 'rgba(220,230,255,0)');
    ctx.fillStyle = mg; ctx.fillRect(mx - m * 0.16, my - m * 0.16, m * 0.32, m * 0.32);
    ctx.fillStyle = '#f2efe4'; ctx.beginPath(); ctx.arc(mx, my, m * 0.026, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(160,160,170,0.35)'; for (const [dx, dy, r] of [[-0.3, -0.2, 0.25], [0.25, 0.1, 0.18], [-0.05, 0.35, 0.14], [0.35, -0.35, 0.1]]) { ctx.beginPath(); ctx.arc(mx + dx * m * 0.026, my + dy * m * 0.026, r * m * 0.026, 0, 7); ctx.fill(); }
  }
  // clouds: lit by the sun by day, pink at dusk, orange from below at night (the town's glow)
  if (cloud > 0.05) {
    for (let i = 0; i < 6 + cloud * 10; i++) {
      const cx = ((R(i + 90) * 1.4 + t * 0.004 * (1 + R(i))) % 1.4 - 0.2) * W, cy = horizon * (0.15 + R(i + 91) * 0.55), cw = m * (0.12 + R(i + 92) * 0.22);
      const lit = night > 0.5 ? `rgba(110,72,88,${0.3 * cloud})` : h > 17.5 || h < 7 ? `rgba(240,160,150,${0.5 * cloud})` : `rgba(255,255,255,${0.6 * cloud})`;
      const sh = night > 0.5 ? `rgba(40,30,50,${0.18 * cloud})` : `rgba(170,178,196,${0.3 * cloud})`;
      for (let k = 0; k < 7; k++) {
        const bx = cx + (R(i * 7 + k) - 0.5) * cw, by = cy + (R(i * 7 + k + 3) - 0.5) * cw * 0.14, br = cw * (0.2 + R(i * 7 + k + 5) * 0.18);
        ctx.save(); ctx.translate(bx, by); ctx.scale(1, 0.55);
        const pg = ctx.createRadialGradient(0, -br * 0.15, 0, 0, 0, br); pg.addColorStop(0, lit); pg.addColorStop(0.5, sh); pg.addColorStop(1, sh.replace(/[\d.]+\)$/, '0)'));
        ctx.fillStyle = pg; ctx.fillRect(-br, -br, br * 2, br * 2); ctx.restore();
      }
      if (night > 0.5 && lp > 0) { ctx.fillStyle = `rgba(255,140,70,${lp * 0.25 * cloud})`; ctx.beginPath(); ctx.ellipse(cx, cy + cw * 0.12, cw * 0.6, cw * 0.08, 0, 0, 7); ctx.fill(); }
    }
  }
  // the mountains of the Ciénega in layers, bluer and paler with distance
  const ridge = (base, amp, seed, col, peaks) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += W / 120) {
      let y = base;
      for (const [px, pw, ph] of peaks) y -= ph * Math.exp(-((((x / W) - px) / pw) ** 2));
      y -= Math.sin(x / W * 13 + seed) * amp * 0.25 + Math.sin(x / W * 31 + seed * 2) * amp * 0.08;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  };
  const far = mixHex('#7d8fb0', hor, 0.35);
  ridge(horizon - m * 0.02, m * 0.04, 1, night ? 'rgb(24,26,48)' : far, [[0.72, 0.09, m * 0.17], [0.25, 0.12, m * 0.07]]);   // the far volcanic cone and hills
  ridge(horizon + m * 0.01, m * 0.05, 3, night ? 'rgb(18,18,34)' : mixHex('#5f7090', '#7a8aa0', 0.3), [[0.1, 0.14, m * 0.1], [0.45, 0.2, m * 0.06]]);
  if (view === 'cerro') {
    // from the cerro: the valley below with the town's lights like embers, and Sahuayo further off
    ctx.fillStyle = night ? '#0d0d16' : mixHex('#556a4a', haze, 0.4); ctx.fillRect(0, horizon + m * 0.02, W, H);
    // Jiquilpan: a dense centre thinning out along its streets, foreshortened; Sahuayo a smaller smear further off
    const gauss = (i) => (R(i) + R(i + 0.37) + R(i + 0.71) - 1.5) / 1.5;
    for (let i = 0; i < 1400; i++) {
      const far = i % 4 === 0;
      let u = gauss(i + 200) * (far ? 0.1 : 0.26), v = gauss(i + 300) * (far ? 0.012 : 0.05);
      if (!far && R(i + 207) < 0.35) { const st = Math.floor(R(i + 208) * 5); if (st < 3) v = (st - 1) * 0.03 + gauss(i + 209) * 0.004; else u = (st - 3.5) * 0.12 + gauss(i + 209) * 0.008; } // lights along the streets
      const x = ((far ? 0.8 : 0.42) + u) * W, y = (far ? horizon / H + 0.04 : horizon / H + 0.15) * H + v * H * (far ? 1 : 1.6);
      if (y < horizon + m * 0.025) continue;
      if (night < 0.1) { if (i % 7) continue; ctx.fillStyle = 'rgba(240,235,225,0.55)'; ctx.fillRect(x, y, far ? 1.2 : 2, 1.2); continue; }
      const warm = R(i + 204) < 0.75, sz = far ? 1.1 : 1.2 + R(i + 210) * 1.2;
      ctx.fillStyle = warm ? `rgba(255,${170 + R(i + 205) * 60},90,${night * (0.45 + R(i + 206) * 0.55)})` : `rgba(220,235,255,${night * 0.7})`;
      ctx.fillRect(x, y, sz, sz);
    }
    if (night > 0.3) { const ty0 = horizon + H * 0.15; const tg = ctx.createRadialGradient(W * 0.42, ty0, 0, W * 0.42, ty0, m * 0.45); tg.addColorStop(0, `rgba(255,150,70,${0.25 * night})`); tg.addColorStop(1, 'rgba(255,150,70,0)'); ctx.fillStyle = tg; ctx.fillRect(0, horizon, W, H - horizon); }
    // the cross and the rocks in the foreground
    ctx.fillStyle = night ? '#07070c' : '#3a3a2a';
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.86); ctx.quadraticCurveTo(W * 0.3, H * 0.8, W * 0.55, H * 0.88); ctx.quadraticCurveTo(W * 0.8, H * 0.92, W, H * 0.85); ctx.lineTo(W, H); ctx.fill();
    ctx.fillRect(W * 0.78, H * 0.6, m * 0.012, H * 0.3); ctx.fillRect(W * 0.78 - m * 0.04, H * 0.66, m * 0.092, m * 0.012);
  } else {
    // the town's skyline seen from the plaza / La Trasquila
    const base = horizon + m * 0.06, dark = night > 0.5;
    const roofC = dark ? '#0e0d14' : mixHex('#6a5a4a', haze, 0.25), wallC = dark ? '#16141c' : mixHex('#c9b8a0', haze, 0.2);
    ctx.fillStyle = wallC; ctx.fillRect(0, base, W, H - base);
    for (let i = 0; i < 26; i++) { // low houses with flat roofs and tinacos
      const x = (i / 26) * W, w = W / 26 + 2, hh = m * (0.03 + R(i + 300) * 0.05);
      ctx.fillStyle = R(i + 301) < 0.5 ? roofC : wallC; ctx.fillRect(x, base - hh, w, hh + 2);
      if (R(i + 302) < 0.5) { ctx.fillStyle = dark ? '#09090e' : '#2a2b2e'; ctx.fillRect(x + w * 0.3, base - hh - m * 0.016, m * 0.016, m * 0.016); }
      if (dark) for (let k = 0; k < 2; k++) if (R(i * 3 + k + 303) < 0.55) { ctx.fillStyle = R(i + k) < 0.7 ? 'rgba(255,200,120,0.85)' : 'rgba(200,220,255,0.7)'; ctx.fillRect(x + w * (0.2 + k * 0.4), base - hh * 0.6, m * 0.008, m * 0.01); }
    }
    // the Parroquia de San Francisco: the tower and the yellow dome with its red ribs and lantern
    const tx = W * 0.62, ty = base;
    ctx.fillStyle = dark ? '#0b0a10' : '#5a3a30'; ctx.fillRect(tx - m * 0.022, ty - m * 0.22, m * 0.044, m * 0.22); // tower
    ctx.fillRect(tx - m * 0.03, ty - m * 0.23, m * 0.06, m * 0.012); ctx.beginPath(); ctx.moveTo(tx - m * 0.02, ty - m * 0.23); ctx.lineTo(tx, ty - m * 0.28); ctx.lineTo(tx + m * 0.02, ty - m * 0.23); ctx.fill();
    ctx.fillRect(tx - 1, ty - m * 0.3, 2, m * 0.03);
    const dx = tx + m * 0.08;
    ctx.fillStyle = dark ? '#100e14' : '#e8cfa8'; ctx.fillRect(dx - m * 0.05, ty - m * 0.12, m * 0.1, m * 0.12); // drum
    ctx.fillStyle = dark ? '#14121a' : '#e2bf3a'; ctx.beginPath(); ctx.ellipse(dx, ty - m * 0.12, m * 0.05, m * 0.06, 0, Math.PI, 0); ctx.fill(); // dome
    if (!dark) { ctx.strokeStyle = '#b8452f'; ctx.lineWidth = 1.5; for (const k of [-0.6, 0, 0.6]) { ctx.beginPath(); ctx.moveTo(dx + k * m * 0.05, ty - m * 0.12); ctx.quadraticCurveTo(dx + k * m * 0.03, ty - m * 0.16, dx, ty - m * 0.18); ctx.stroke(); } }
    ctx.fillStyle = dark ? '#100e14' : '#e8cfa8'; ctx.fillRect(dx - m * 0.008, ty - m * 0.2, m * 0.016, m * 0.02);
    if (dark) { const fl = ctx.createRadialGradient(dx, ty - m * 0.1, 0, dx, ty - m * 0.1, m * 0.12); fl.addColorStop(0, 'rgba(255,200,120,0.25)'); fl.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = fl; ctx.fillRect(dx - m * 0.12, ty - m * 0.22, m * 0.24, m * 0.24); }
    // palms and jacarandas
    for (const px of [0.08, 0.86, 0.94]) { ctx.strokeStyle = dark ? '#09080c' : '#3a3020'; ctx.lineWidth = m * 0.006; ctx.beginPath(); ctx.moveTo(W * px, base); ctx.quadraticCurveTo(W * px + 4, base - m * 0.08, W * px + 2, base - m * 0.16); ctx.stroke(); ctx.fillStyle = dark ? '#09080c' : '#2a4a2a'; for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(W * px + 2 + Math.cos(a) * m * 0.025, base - m * 0.16 + Math.sin(a) * m * 0.008, m * 0.028, m * 0.006, a, 0, 7); ctx.fill(); } }
    for (const [jx, jr] of [[0.25, 0.06], [0.4, 0.045], [0.75, 0.055], [0.03, 0.05]]) {
      const cx0 = W * jx, cy0 = base - m * 0.045;
      ctx.fillStyle = dark ? '#0b0a10' : '#4a3a28'; ctx.fillRect(cx0 - m * 0.004, cy0, m * 0.008, base - cy0);
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + jx * 9, rr = m * jr * (0.42 + R(k + jx * 100) * 0.25);
        ctx.fillStyle = dark ? (k % 3 ? '#0c0a12' : '#110e18') : (k % 3 ? '#8e6cc4' : '#a487d6');
        ctx.beginPath(); ctx.arc(cx0 + Math.cos(a) * m * jr * 0.55, cy0 - m * jr * 0.25 + Math.sin(a) * m * jr * 0.32, rr, 0, 7); ctx.fill(); }
    }
    // antennas with their red lights
    for (const ax of [0.3, 0.83]) { ctx.strokeStyle = dark ? '#16141c' : '#7a7a80'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W * ax - 4, base); ctx.lineTo(W * ax, base - m * 0.19); ctx.lineTo(W * ax + 4, base); ctx.stroke(); if (Math.floor(t * 1.2 + ax * 10) % 2) { ctx.fillStyle = '#ff3a2a'; ctx.beginPath(); ctx.arc(W * ax, base - m * 0.19, 2.2, 0, 7); ctx.fill(); } }
    // the street in front: the cantera sidewalk edge, a few faroles and their pools of light
    const sy = base + m * 0.02;
    ctx.fillStyle = dark ? '#0b0a0f' : mixHex('#5a5048', haze, 0.2); ctx.fillRect(0, sy, W, H - sy);
    ctx.fillStyle = dark ? '#16131a' : '#8a7a68'; ctx.fillRect(0, sy, W, m * 0.008);
    for (const lx of [0.14, 0.47, 0.9]) {
      const x = lx * W, top = sy - m * 0.11;
      ctx.fillStyle = dark ? '#050507' : '#2a2620'; ctx.fillRect(x - m * 0.003, top, m * 0.006, sy - top + m * 0.03);
      ctx.fillRect(x - m * 0.012, top - m * 0.012, m * 0.024, m * 0.014);
      if (night > 0.2) {
        const lg = ctx.createRadialGradient(x, top - m * 0.005, 0, x, top, m * 0.09); lg.addColorStop(0, `rgba(255,224,160,${0.9 * night})`); lg.addColorStop(0.12, `rgba(255,200,120,${0.4 * night})`); lg.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = lg; ctx.fillRect(x - m * 0.09, top - m * 0.09, m * 0.18, m * 0.18);
        const pg = ctx.createRadialGradient(x, sy + m * 0.05, 0, x, sy + m * 0.05, m * 0.16); pg.addColorStop(0, `rgba(255,200,130,${0.22 * night})`); pg.addColorStop(1, 'rgba(255,200,130,0)');
        ctx.save(); ctx.translate(x, sy + m * 0.05); ctx.scale(1, 0.3); ctx.translate(-x, -(sy + m * 0.05)); ctx.fillStyle = pg; ctx.fillRect(x - m * 0.16, sy + m * 0.05 - m * 0.16, m * 0.32, m * 0.32); ctx.restore();
      }
    }
  }
  // the lights of the cerro (the night they come)
  if (o.ufo) {
    for (let i = 0; i < 3; i++) {
      const ux = W * (0.5 + Math.sin(t * 0.6 + i * 2.1) * 0.12), uy = horizon * (0.42 + Math.sin(t * 0.8 + i) * 0.06);
      const ug = ctx.createRadialGradient(ux, uy, 0, ux, uy, m * 0.06); ug.addColorStop(0, 'rgba(220,235,255,0.95)'); ug.addColorStop(0.25, 'rgba(120,140,255,0.6)'); ug.addColorStop(1, 'rgba(60,60,200,0)');
      ctx.fillStyle = ug; ctx.fillRect(ux - m * 0.06, uy - m * 0.06, m * 0.12, m * 0.12);
    }
  }
  // atmospheric haze at the horizon
  const hz = ctx.createLinearGradient(0, horizon - m * 0.1, 0, horizon + m * 0.06);
  hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, night > 0.5 ? `rgba(60,40,60,${0.3})` : 'rgba(230,225,215,0.25)');
  ctx.fillStyle = hz; ctx.fillRect(0, horizon - m * 0.1, W, m * 0.16);
}

// Full-screen “Mirar el cielo”: stays until you tap. Live with the game clock.
export function skyView(game, view = 'town', opts = {}) {
  return new Promise(resolve => {
    const el = document.createElement('div'); el.className = 'skyview';
    const cv = document.createElement('canvas'); el.appendChild(cv);
    const cap = document.createElement('div'); cap.className = 'skyview-cap'; cap.textContent = opts.caption || 'Toca para volver'; el.appendChild(cap);
    document.body.appendChild(el);
    const dpr = Math.min(2, devicePixelRatio || 1);
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    resize();
    const ctx = cv.getContext('2d');
    let done = false; const t0 = performance.now();
    const close = () => { if (done) return; done = true; el.classList.add('out'); setTimeout(() => { el.remove(); resolve(); }, 600); };
    el.addEventListener('click', close); window.addEventListener('keydown', function k(e) { if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') { window.removeEventListener('keydown', k); close(); } });
    if (opts.duration) setTimeout(close, opts.duration);
    const loop = (now) => {
      if (done) return;
      paintSky(ctx, cv.width, cv.height, { hour: game.clock.hour, cloud: game.env.cloud ?? 0.2, view, t: (now - t0) / 1000, ufo: opts.ufo });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}
