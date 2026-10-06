// Shared drawing primitives for architecture.
import { shade, rgba, mix, roundRect } from '../util.js';

// Soft contact shadow: dense at the centre, fading out (ambient occlusion rather than a flat disc).
export function shadowBlob(ctx, x, y, rx, ry, a = 0.25) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 1.15);
  g.addColorStop(0, `rgba(20,20,35,${Math.min(0.6, a * 1.5)})`); g.addColorStop(0.6, `rgba(20,20,35,${a})`); g.addColorStop(1, 'rgba(20,20,35,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx * 1.15, 0, 7); ctx.fill();
  ctx.restore();
}

export function vgrad(ctx, y0, y1, c0, c1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
}
export function hgrad(ctx, x0, x1, c0, c1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
}

// A wall face with guardapolvo band
export function wallFace(ctx, x, y, w, h, wall = '#f4efe4', band = '#8e2f24', bandH = 6) {
  ctx.fillStyle = vgrad(ctx, y, y + h, shade(wall, 0.03), shade(wall, -0.08));
  ctx.fillRect(x, y, w, h);
  if (band) { ctx.fillStyle = band; ctx.fillRect(x, y + h - bandH, w, bandH); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, y + h - bandH, w, 0.6); }
}

// Flat roof top (azotea) or tiled roof drawn as the "top" face in 3/4 view
export function roofTop(ctx, x, y, w, h, color = '#cfc6b6', tiled = false) {
  if (tiled) {
    ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
    for (let j = 0; j < h; j += 3) {
      ctx.fillStyle = rgba(shade(color, -0.35), 0.5); ctx.fillRect(x, y + j + 2.2, w, 0.8);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let i = (j / 3) % 2 ? 1.5 : 0; i < w; i += 3) ctx.fillRect(x + i, y + j, 1.3, 2);
    }
  } else {
    ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2; ctx.strokeRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.6; ctx.strokeRect(x + 1.8, y + 1.8, w - 3.6, h - 3.6);
  }
}

// Row of arches (portal) — arcade seen from the front.
export function arcade(ctx, x, y, w, h, n, opts = {}) {
  const stone = opts.stone || '#d9c2a3';
  const inner = opts.inner || '#4a3a2e';
  const aw = w / n;
  // shadowed interior of the portal
  ctx.fillStyle = vgrad(ctx, y, y + h, shade(inner, -0.2), shade(inner, 0.25));
  ctx.fillRect(x, y, w, h);
  if (opts.back) { // back wall of portal with doors/shops
    ctx.fillStyle = opts.back; ctx.fillRect(x, y + h * 0.25, w, h * 0.75);
    for (let i = 0; i < n; i++) {
      const cx = x + aw * i + aw / 2;
      ctx.fillStyle = opts.doorColor || '#5a3a24'; ctx.fillRect(cx - aw * 0.18, y + h * 0.45, aw * 0.36, h * 0.55);
      if (opts.shops) { ctx.fillStyle = opts.shops[i % opts.shops.length]; ctx.fillRect(cx - aw * 0.18, y + h * 0.45, aw * 0.36, h * 0.12); }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y + h * 0.25, w, 2);
  }
  // arches
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.rect(x, y, w, h * 0.22);
  for (let i = 0; i <= n; i++) {
    const px = x + aw * i;
    const pw = Math.max(2.2, aw * 0.16);
    ctx.rect(px - pw / 2, y, pw, h);
  }
  ctx.fill();
  // arch curves (spandrels)
  for (let i = 0; i < n; i++) {
    const cx = x + aw * i + aw / 2, rad = aw / 2 - Math.max(1.1, aw * 0.08);
    ctx.beginPath();
    ctx.moveTo(cx - aw / 2, y + h * 0.22); ctx.lineTo(cx - aw / 2, y + h * 0.22 + rad);
    ctx.arc(cx, y + h * 0.22 + rad, rad, Math.PI, 0);
    ctx.lineTo(cx + aw / 2, y + h * 0.22); ctx.closePath(); ctx.fill();
    // voussoir lines
    ctx.strokeStyle = rgba(shade(stone, -0.35), 0.6); ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.arc(cx, y + h * 0.22 + rad, rad, Math.PI, 0); ctx.stroke();
    for (let k = 1; k < 6; k++) {
      const a = Math.PI + (k / 6) * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rad, y + h * 0.22 + rad + Math.sin(a) * rad);
      ctx.lineTo(cx + Math.cos(a) * (rad + 1.6), y + h * 0.22 + rad + Math.sin(a) * (rad + 1.6)); ctx.stroke();
    }
  }
  // capitals & bases
  ctx.fillStyle = shade(stone, -0.18);
  for (let i = 0; i <= n; i++) {
    const px = x + aw * i, pw = Math.max(2.2, aw * 0.16);
    ctx.fillRect(px - pw / 2 - 0.6, y + h * 0.22 + (aw / 2) - 1, pw + 1.2, 1);
    ctx.fillRect(px - pw / 2 - 0.6, y + h - 1.2, pw + 1.2, 1.2);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let i = 0; i <= n; i++) ctx.fillRect(x + aw * i - 0.8, y + h * 0.22, 0.6, h * 0.78);
}

export function cornice(ctx, x, y, w, color = '#d8c3a5') {
  ctx.fillStyle = shade(color, -0.25); ctx.fillRect(x - 1, y + 1.2, w + 2, 1.2);
  ctx.fillStyle = color; ctx.fillRect(x - 1.5, y - 0.6, w + 3, 1.9);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - 1.5, y - 0.6, w + 3, 0.5);
}

export function archWindow(ctx, x, y, w, h, frame = '#d9c2a3', glass = '#2c3942') {
  ctx.fillStyle = frame;
  ctx.beginPath(); ctx.moveTo(x - 1, y + h + 1); ctx.lineTo(x - 1, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2 + 1, Math.PI, 0); ctx.lineTo(x + w + 1, y + h + 1); ctx.fill();
  ctx.fillStyle = glass;
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.fill();
  ctx.fillStyle = 'rgba(160,200,230,0.22)'; ctx.fillRect(x + 0.5, y + w / 2, w * 0.35, h - w / 2 - 0.5);
}

export function rectWindow(ctx, x, y, w, h, frame = '#d9c2a3', glass = '#2c3942', grille = true) {
  ctx.fillStyle = frame; ctx.fillRect(x - 0.9, y - 0.9, w + 1.8, h + 2);
  ctx.fillStyle = glass; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(160,200,230,0.22)'; ctx.fillRect(x + 0.4, y + 0.4, w * 0.35, h - 0.8);
  if (grille) {
    ctx.strokeStyle = '#161618'; ctx.lineWidth = 0.35; ctx.beginPath();
    for (let i = x + 1.1; i < x + w; i += 1.3) { ctx.moveTo(i, y); ctx.lineTo(i, y + h); }
    ctx.stroke();
  }
}

export function balcony(ctx, x, y, w) {
  ctx.fillStyle = '#cdb697'; ctx.fillRect(x - 1, y, w + 2, 1.4);
  ctx.fillStyle = '#18181a'; ctx.fillRect(x - 1, y - 4, w + 2, 0.6);
  for (let i = x - 1; i <= x + w + 1; i += 1.1) ctx.fillRect(i, y - 4, 0.3, 4);
}

export function woodDoor(ctx, x, y, w, h, color = '#6b3f22', arched = true, frame = '#d9c2a3') {
  ctx.fillStyle = frame;
  if (arched) { ctx.beginPath(); ctx.moveTo(x - 1.2, y + h); ctx.lineTo(x - 1.2, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2 + 1.2, Math.PI, 0); ctx.lineTo(x + w + 1.2, y + h); ctx.fill(); }
  else ctx.fillRect(x - 1.2, y - 1.2, w + 2.4, h + 1.2);
  ctx.fillStyle = color;
  if (arched) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.fill(); }
  else ctx.fillRect(x, y, w, h);
  ctx.fillStyle = shade(color, -0.3); ctx.fillRect(x + w / 2 - 0.25, y + (arched ? w / 4 : 0), 0.5, h - (arched ? w / 4 : 0));
  ctx.fillStyle = shade(color, 0.15);
  const py = y + (arched ? w / 2 : 1.5);
  for (const px of [x + 1, x + w / 2 + 0.8]) {
    ctx.fillRect(px, py, w / 2 - 1.8, (h - (py - y)) * 0.4);
    ctx.fillRect(px, py + (h - (py - y)) * 0.48, w / 2 - 1.8, (h - (py - y)) * 0.4);
  }
  ctx.fillStyle = '#c9a54a'; ctx.beginPath(); ctx.arc(x + w / 2 - 1, y + h * 0.6, 0.45, 0, 7); ctx.arc(x + w / 2 + 1, y + h * 0.6, 0.45, 0, 7); ctx.fill();
}

// Dome with lantern, 3/4 view. (cx, baseY) bottom centre of drum.
export function dome(ctx, cx, baseY, r, color = '#d9c2a3', tiles = null) {
  // drum
  ctx.fillStyle = shade(color, -0.05); ctx.fillRect(cx - r, baseY - r * 0.55, r * 2, r * 0.55);
  for (let i = -2; i <= 2; i++) { ctx.fillStyle = '#2e3a40'; ctx.fillRect(cx + i * r * 0.36 - 0.8, baseY - r * 0.45, 1.6, r * 0.3); }
  ctx.fillStyle = shade(color, -0.25); ctx.fillRect(cx - r - 0.8, baseY - r * 0.58, r * 2 + 1.6, 1);
  // cupola
  const top = baseY - r * 0.55;
  const g = ctx.createRadialGradient(cx - r * 0.35, top - r * 0.6, r * 0.1, cx, top - r * 0.2, r * 1.2);
  const c = tiles || color;
  g.addColorStop(0, shade(c, 0.35)); g.addColorStop(0.6, c); g.addColorStop(1, shade(c, -0.35));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(cx - r, top); ctx.bezierCurveTo(cx - r, top - r * 1.2, cx + r, top - r * 1.2, cx + r, top); ctx.closePath(); ctx.fill();
  // ribs
  ctx.strokeStyle = rgba(shade(c, -0.4), 0.5); ctx.lineWidth = 0.5;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * r / 3.4, top);
    ctx.quadraticCurveTo(cx + i * r / 5, top - r * 0.8, cx, top - r * 0.9); ctx.stroke();
  }
  if (tiles) { // talavera-like zig-zag
    ctx.strokeStyle = 'rgba(255,230,120,0.5)'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let x = cx - r * 0.9; x < cx + r * 0.9; x += 2) { ctx.lineTo(x, top - r * 0.3 - ((x / 2) % 2 ? 1 : 0)); }
    ctx.stroke();
  }
  // lantern
  const lt = top - r * 0.9;
  ctx.fillStyle = color; ctx.fillRect(cx - r * 0.18, lt - r * 0.35, r * 0.36, r * 0.35);
  ctx.fillStyle = '#2e3a40'; ctx.fillRect(cx - r * 0.07, lt - r * 0.3, r * 0.14, r * 0.2);
  ctx.fillStyle = shade(color, -0.2); ctx.beginPath(); ctx.arc(cx, lt - r * 0.35, r * 0.2, Math.PI, 0); ctx.fill();
  cross(ctx, cx, lt - r * 0.55, r * 0.35);
}

export function cross(ctx, x, y, s, color = '#2b2b2b') {
  ctx.fillStyle = color;
  ctx.fillRect(x - s * 0.08, y - s, s * 0.16, s);
  ctx.fillRect(x - s * 0.32, y - s * 0.72, s * 0.64, s * 0.14);
}

// Bell tower: stacked cubes with arched belfries
export function bellTower(ctx, cx, baseY, w, h, color = '#d9c2a3', levels = 2) {
  const bodyH = h * 0.45;
  ctx.fillStyle = vgrad(ctx, baseY - bodyH, baseY, shade(color, 0.05), shade(color, -0.1));
  ctx.fillRect(cx - w / 2, baseY - bodyH, w, bodyH);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(cx + w / 2 - 2, baseY - bodyH, 2, bodyH);
  let y = baseY - bodyH;
  let lw = w;
  const lvlH = (h - bodyH) / (levels + 0.6);
  for (let i = 0; i < levels; i++) {
    cornice(ctx, cx - lw / 2, y, lw, shade(color, -0.05));
    lw *= 0.84;
    const top = y - lvlH;
    ctx.fillStyle = vgrad(ctx, top, y, shade(color, 0.08), shade(color, -0.08));
    ctx.fillRect(cx - lw / 2, top, lw, lvlH);
    // belfry openings
    const ow = lw * 0.36;
    archWindow(ctx, cx - ow / 2, top + lvlH * 0.18, ow, lvlH * 0.7, shade(color, -0.1), '#1e2226');
    if (i === 0) { // bell
      ctx.fillStyle = '#9b7a35';
      ctx.beginPath(); ctx.moveTo(cx - ow * 0.28, top + lvlH * 0.75); ctx.quadraticCurveTo(cx - ow * 0.25, top + lvlH * 0.4, cx, top + lvlH * 0.38);
      ctx.quadraticCurveTo(cx + ow * 0.25, top + lvlH * 0.4, cx + ow * 0.28, top + lvlH * 0.75); ctx.fill();
    }
    // pilasters
    ctx.fillStyle = shade(color, -0.12);
    ctx.fillRect(cx - lw / 2, top, 1.2, lvlH); ctx.fillRect(cx + lw / 2 - 1.2, top, 1.2, lvlH);
    // finials
    ctx.fillStyle = shade(color, -0.05);
    for (const fx of [cx - lw / 2 + 0.6, cx + lw / 2 - 0.6]) { ctx.beginPath(); ctx.arc(fx, top - 1.2, 1, 0, 7); ctx.fill(); ctx.fillRect(fx - 0.4, top - 1.2, 0.8, 1.2); }
    y = top;
  }
  cornice(ctx, cx - lw / 2, y, lw, shade(color, -0.05));
  // cupolin
  const r = lw * 0.42;
  ctx.fillStyle = vgrad(ctx, y - r, y, shade(color, 0.2), shade(color, -0.15));
  ctx.beginPath(); ctx.moveTo(cx - r, y); ctx.quadraticCurveTo(cx - r, y - r * 1.3, cx, y - r * 1.4); ctx.quadraticCurveTo(cx + r, y - r * 1.3, cx + r, y); ctx.fill();
  cross(ctx, cx, y - r * 1.4, r * 0.9);
}

export function flagPole(ctx, x, baseY, h, t = 0) {
  ctx.fillStyle = '#9da3a8'; ctx.fillRect(x - 0.4, baseY - h, 0.8, h);
  const fw = h * 0.36, fh = h * 0.22, y = baseY - h + 0.5;
  const cols = ['#006847', '#ffffff', '#ce1126'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = cols[i];
    ctx.beginPath();
    const x0 = x + 0.4 + (fw / 3) * i, x1 = x0 + fw / 3;
    const w0 = Math.sin(t + i) * 0.8, w1 = Math.sin(t + i + 1) * 0.8;
    ctx.moveTo(x0, y + w0); ctx.lineTo(x1, y + w1); ctx.lineTo(x1, y + fh + w1); ctx.lineTo(x0, y + fh + w0); ctx.fill();
  }
  ctx.fillStyle = '#8a6a2f'; ctx.beginPath(); ctx.arc(x + 0.4 + fw / 2, y + fh / 2, fh * 0.16, 0, 7); ctx.fill();
}

// Tree types -----------------------------------------------------------------
// Foliage rendered in volumes: a dark occluded core, leaf masses shaded with soft radial light from
// the upper left, a cool rim on the shadow side, and small sunlit leaf clusters on top.
export function treeCanopy(ctx, cx, cy, r, palette, rnd, blobs = 9) {
  const [dark, mid, light] = palette;
  ctx.fillStyle = shade(dark, -0.25); ctx.beginPath(); ctx.ellipse(cx + r * 0.08, cy + r * 0.15, r * 0.9, r * 0.75, 0, 0, 7); ctx.fill();
  const blob = (x, y, br, c0, c1) => {
    const g = ctx.createRadialGradient(x - br * 0.35, y - br * 0.4, br * 0.1, x, y, br * 1.05);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, br, 0, 7); ctx.fill();
  };
  for (let i = 0; i < blobs; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * r * 0.55, br = r * (0.38 + rnd() * 0.3);
    blob(cx + Math.cos(a) * d + br * 0.12, cy + Math.sin(a) * d * 0.8 + br * 0.18, br, dark, shade(dark, -0.3));
  }
  for (let i = 0; i < blobs; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * r * 0.5, br = r * (0.3 + rnd() * 0.25);
    blob(cx + Math.cos(a) * d - r * 0.08, cy + Math.sin(a) * d * 0.8 - r * 0.1, br, mid, dark);
  }
  for (let i = 0; i < blobs / 2; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * r * 0.35, br = r * (0.16 + rnd() * 0.16);
    blob(cx - r * 0.25 + Math.cos(a) * d, cy - r * 0.3 + Math.sin(a) * d, br, shade(light, 0.12), mid);
  }
  // leaf texture: tiny clusters, brighter toward the light
  for (let i = 0; i < blobs * 7; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r * 0.85;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.78;
    const lit = (cx - x) + (cy - y) > 0;
    ctx.fillStyle = lit ? rgba(light, 0.75) : rgba(shade(dark, -0.2), 0.5);
    ctx.beginPath(); ctx.ellipse(x, y, 0.9 + rnd() * 0.9, 0.6 + rnd() * 0.6, rnd() * 3, 0, 7); ctx.fill();
  }
  // cool sky bounce on the lower right edge
  ctx.strokeStyle = 'rgba(160,190,210,0.18)'; ctx.lineWidth = r * 0.08;
  ctx.beginPath(); ctx.arc(cx + r * 0.05, cy + r * 0.05, r * 0.82, 0.1, 1.5); ctx.stroke();
}

export function trunk(ctx, x, y, w, h, color = '#6b4a30') {
  const g = ctx.createLinearGradient(x - w * 0.7, 0, x + w * 0.7, 0);
  g.addColorStop(0, shade(color, 0.12)); g.addColorStop(0.45, color); g.addColorStop(1, shade(color, -0.35));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - w * 0.75, y); ctx.quadraticCurveTo(x - w * 0.42, y - h * 0.4, x - w * 0.38, y - h); ctx.lineTo(x + w * 0.38, y - h); ctx.quadraticCurveTo(x + w * 0.42, y - h * 0.4, x + w * 0.75, y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(shade(color, -0.4), 0.45); ctx.lineWidth = Math.max(0.2, w * 0.06);
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * w * 0.22, y - 0.5); ctx.quadraticCurveTo(x + i * w * 0.15 + w * 0.05, y - h * 0.5, x + i * w * 0.12, y - h); ctx.stroke(); }
}

export function text(ctx, str, x, y, size, color = '#222', font = '"Trebuchet MS", sans-serif', weight = 'bold', align = 'center') {
  ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function plaque(ctx, x, y, w, h, str, bg = '#2f4f3f', fg = '#e8d9a8') {
  ctx.fillStyle = shade(bg, -0.3); roundRect(ctx, x - 0.5, y - 0.5, w + 1, h + 1, 1); ctx.fill();
  ctx.fillStyle = bg; roundRect(ctx, x, y, w, h, 1); ctx.fill();
  let size = h * 0.62;
  ctx.font = `bold ${size}px "Trebuchet MS", sans-serif`;
  const tw = ctx.measureText(str).width;
  if (tw > w - 1.5) size *= (w - 1.5) / tw;
  text(ctx, str, x + w / 2, y + h / 2 + 0.2, size, fg);
}

export { mix, shade, rgba };

// Gabled nave roof seen from the front-above: two slopes with a ridge, running back from `front` for `len` units.
export function naveRoof(ctx, cx, front, w, len, color = '#b45e43') {
  const top = front - len;
  // left (lit) slope
  ctx.fillStyle = shade(color, 0.08); ctx.fillRect(cx - w / 2, top, w / 2, len);
  // right (shaded) slope
  ctx.fillStyle = shade(color, -0.18); ctx.fillRect(cx, top, w / 2, len);
  // tile courses running down each slope
  for (let x = cx - w / 2 + 1.5; x < cx + w / 2; x += 3) {
    ctx.fillStyle = x < cx ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, top, 1.2, len);
  }
  for (let y = top + 3; y < front; y += 4) { ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(cx - w / 2, y, w, 0.6); }
  // ridge and eaves
  ctx.fillStyle = shade(color, -0.35); ctx.fillRect(cx - 0.8, top, 1.6, len);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(cx - w / 2 - 1, top, 1.2, len); ctx.fillRect(cx + w / 2 - 0.2, top, 1.2, len);
  ctx.fillStyle = 'rgba(20,20,40,0.22)'; ctx.fillRect(cx + w / 2 + 1, top + 4, 5, len - 4);
}

// A cloister / garden patio seen from above
export function cloister(ctx, x, y, w, h) {
  ctx.fillStyle = '#b45e43'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = x; i < x + w; i += 3) ctx.fillRect(i, y, 1.2, h);
  const m = 9;
  ctx.fillStyle = '#d9c4a4'; ctx.fillRect(x + m, y + m, w - 2 * m, h - 2 * m);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + m, y + m, w - 2 * m, 3);
  ctx.fillStyle = '#6da243'; ctx.fillRect(x + m + 5, y + m + 5, w - 2 * m - 10, h - 2 * m - 10);
  ctx.fillStyle = '#d9c4a4'; ctx.fillRect(x + w / 2 - 2, y + m + 5, 4, h - 2 * m - 10); ctx.fillRect(x + m + 5, y + h / 2 - 2, w - 2 * m - 10, 4);
  ctx.fillStyle = '#4b95b8'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 3.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#e7d7bd'; for (let i = x + m + 3; i < x + w - m; i += 7) { ctx.fillRect(i, y + h - m - 2, 1.6, 2); ctx.fillRect(i, y + m, 1.6, 2); }
}
