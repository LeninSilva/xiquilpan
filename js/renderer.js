// Frame renderer: ground chunks, y-sorted sprites & entities, light and weather.
import { TILE, makeCanvas, clamp, lerp, rgba, mix, hash2, roundRect } from './util.js';
import { G, ROADS } from './world.js';
import { ChunkCache, CHUNK, isPothole, potholeGeom } from './render/ground.js';
import { SPRITES } from './render/landmarks.js';
import './render/jiquilpan.js';
import { setPeopleScale } from './render/people.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.chunks = new ChunkCache();
    this.spriteCache = new Map();
    this.light = makeCanvas(4, 4);
    this.lctx = this.light.getContext('2d');
    this.rain = [];
    this.blob = makeCanvas(128, 128);
    { const b = this.blob.getContext('2d'); const g = b.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); b.fillStyle = g; b.fillRect(0, 0, 128, 128); }
    this.glowCache = new Map();
    this.clouds = [];
    for (let i = 0; i < 7; i++) this.clouds.push({ x: Math.random() * 2000, y: Math.random() * 2000, r: 160 + Math.random() * 220, s: 0.4 + Math.random() * 0.6 });
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    this.cssW = w; this.cssH = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    // show roughly 12-13 tiles across the short side of the screen
    const zoom = clamp(Math.min(w, h) / (15 * TILE), 1.4, 4) * (this.zoomMul || 1);
    this.zoom = zoom;
    this.S = zoom * dpr;                      // screen px per world unit
    this.CS = Math.min(this.S, 3.2);          // cache resolution (px per unit); capped to stay within mobile canvas memory
    setPeopleScale(this.CS);
    this.spriteCache.clear(); this.spritePx = 0;
    this.chunks.scale = -1; // force reset
    this.light.width = Math.ceil(this.canvas.width / 2); this.light.height = Math.ceil(this.canvas.height / 2);
  }
  get viewW() { return this.canvas.width / this.S; }
  get viewH() { return this.canvas.height / this.S; }

  spriteImage(s) {
    if (!s.cacheKey) {
      const o = {};
      for (const k in s) if (!['x', 'y', 'rect', 'cacheKey', 'collide', 'interact', 'vendor', 'sitio', 'seat'].includes(k)) o[k] = s[k];
      s.cacheKey = JSON.stringify(o);
    }
    let c = this.spriteCache.get(s.cacheKey);
    if (c) { this.spriteCache.delete(s.cacheKey); this.spriteCache.set(s.cacheKey, c); return c; }
    const def = SPRITES[s.kind];
    const sc = s.scale || 1;
    const w = (s.w || 32) * sc, up = (s.up || 64) * sc, down = 14 * sc;
    const CS = this.CS;
    c = makeCanvas(w * CS, (up + down) * CS);
    const ctx = c.getContext('2d');
    ctx.scale(CS, CS); ctx.translate(w / 2, up); ctx.scale(sc, sc);
    if (def) { try { def.draw(ctx, s); } catch (e) { console.warn('sprite draw failed', s.kind, e); } }
    c.w = w; c.up = up; c.down = down;
    this.spriteCache.set(s.cacheKey, c);
    this.spritePx = (this.spritePx || 0) + c.width * c.height;
    while ((this.spritePx > 22e6 || this.spriteCache.size > 260) && this.spriteCache.size > 1) {
      const k = this.spriteCache.keys().next().value, old = this.spriteCache.get(k);
      this.spriteCache.delete(k); this.spritePx -= old.width * old.height;
    }
    return c;
  }

  // Ocote fires outside some houses: only in the evening/night and not while it pours.
  firesOn(game) {
    const h = game.clock.hour;
    return (h >= 19.5 || h < 1.5) && (game.env.rainAmt || 0) < 0.25;
  }

  // env: {time (minutes), light (0 night..1 day), weather, rainAmt, cloud, bloom}
  draw(game) {
    const { ctx, canvas } = this;
    const map = game.map;
    const cam = game.camera;
    const S = this.S;
    if (this.chunks.scale !== this.CS || this.chunks.map !== map || this.chunks.version !== map.version) this.chunks.reset(map, this.CS);
    const vw = this.viewW, vh = this.viewH;
    const x0 = cam.x - vw / 2, y0 = cam.y - vh / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = map.interior ? '#14151a' : '#6f9a45';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.setTransform(S, 0, 0, S, -x0 * S, -y0 * S);

    // ground chunks (limit how many new chunks get rendered per frame)
    const csz = CHUNK * TILE;
    let budget = game.firstFrame ? 999 : 3;
    const cx0 = Math.floor(x0 / csz), cy0 = Math.floor(y0 / csz), cx1 = Math.floor((x0 + vw) / csz), cy1 = Math.floor((y0 + vh) / csz);
    // chunks are blitted at whole-pixel screen positions so neighbours meet exactly (no seams)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cy < 0 || cx * CHUNK >= map.w || cy * CHUNK >= map.h) continue;
      const sx0 = Math.round((cx * csz - x0) * S), sy0 = Math.round((cy * csz - y0) * S);
      const sx1 = Math.round(((cx + 1) * csz - x0) * S), sy1 = Math.round(((cy + 1) * csz - y0) * S);
      const key = cx + ',' + cy;
      let img = this.chunks.cache.get(key);
      if (!img) { if (budget-- <= 0) { ctx.fillStyle = map.interior ? '#14151a' : '#7a9a5a'; ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0); continue; } img = this.chunks.get(cx, cy); }
      else this.chunks.get(cx, cy);
      ctx.drawImage(img, sx0, sy0, sx1 - sx0, sy1 - sy0);
    }
    ctx.setTransform(S, 0, 0, S, -x0 * S, -y0 * S);
    game.firstFrame = false;

    // ground-level effects (puddles, footprints, tianguis shade...)
    if ((game.env.wetness || 0) > 0.05 && map.outdoor) this.drawWater(ctx, map, x0, y0, vw, vh, game.env, game.clock.real);

    // y-sorted drawables
    const list = map.spritesInView(x0, y0, x0 + vw, y0 + vh);
    const items = [];
    const fires = this.firesOn(game);
    for (const s of list) {
      if (s.hidden) continue;
      if (s.nightOnly && !fires) continue;
      if (s.acts && !s.acts.includes(game.state.act)) continue;
      if (s.bloomOnly && !game.env.bloom) continue;
      items.push({ y: s.y + (s.sortOffset || 0), s });
    }
    for (const e of game.entities) {
      if (e.map !== map || e.hidden) continue;
      if (e.x < x0 - 48 || e.x > x0 + vw + 48 || e.y < y0 - 16 || e.y > y0 + vh + 80) continue;
      items.push({ y: e.y + (e.sortOffset || 0), e });
    }
    items.sort((a, b) => a.y - b.y);
    const t = game.clock.real;
    const night = game.env.light < 0.45;
    for (const it of items) {
      if (it.s) {
        const s = it.s;
        const img = this.spriteImage(s);
        if (s.kind === 'tree' && s.tree === 'jacaranda' && game.env.bloom !== !!s.bloom) { s.bloom = game.env.bloom; s.cacheKey = null; }
        let sway = 0;
        if (s.kind === 'tree' && map.outdoor) sway = Math.sin(t * 1.3 + s.x * 0.05) * (0.6 + game.env.wind * 1.4);
        if (sway) {
          ctx.save(); ctx.translate(s.x, s.y); ctx.transform(1, 0, sway * 0.012, 1, 0, 0);
          ctx.drawImage(img, -img.w / 2, -img.up, img.w, img.up + img.down); ctx.restore();
        } else ctx.drawImage(img, s.x - img.w / 2, s.y - img.up, img.w, img.up + img.down);
        const def = SPRITES[s.kind];
        if (def && def.anim) { ctx.save(); ctx.translate(s.x, s.y); if (s.scale) ctx.scale(s.scale, s.scale); def.anim(ctx, s, t, night); ctx.restore(); }
      } else it.e.draw(ctx, game);
    }

    // ghost of the player on top, so you never lose them behind the kiosco or a church tower
    if (game.player && game.player.map === map && !game.player.hidden) {
      ctx.save(); ctx.globalAlpha = 0.28; game.player.draw(ctx, game); ctx.restore();
    }
    // overhead effects in world space
    for (const fx of game.effects) if (fx.map === map) fx.draw(ctx, game);

    // day/night tint + lights
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (map.outdoor) this.drawSky(ctx, game, x0, y0);
    else if (map.dim) { ctx.fillStyle = `rgba(20,15,30,${map.dim})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    this.drawLights(ctx, game, map, x0, y0);
    if (map.outdoor) this.drawWeather(ctx, game, x0, y0);
    if (game.frozen) { ctx.fillStyle = 'rgba(40,40,140,0.28)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    if (game.status && game.status.buzz > 45) { ctx.fillStyle = `rgba(255,200,120,${(game.status.buzz - 45) / 500})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  }

  glowSprite(color) {
    let c = this.glowCache.get(color);
    if (c) return c;
    c = makeCanvas(96, 96); const g2 = c.getContext('2d');
    const g = g2.createRadialGradient(48, 48, 0, 48, 48, 48); g.addColorStop(0, rgba(color, 1)); g.addColorStop(1, rgba(color, 0));
    g2.fillStyle = g; g2.fillRect(0, 0, 96, 96);
    this.glowCache.set(color, c); return c;
  }

  // Rain water: potholes and dips fill up, gutters run downhill, low gardens flood.
  drawWater(ctx, map, x0, y0, vw, vh, env, t) {
    const wet = env.wetness;
    const tx0 = Math.floor(x0 / TILE) - 1, ty0 = Math.floor(y0 / TILE) - 1, tx1 = tx0 + Math.ceil(vw / TILE) + 2, ty1 = ty0 + Math.ceil(vh / TILE) + 2;
    if (!map.flowDir) computeFlow(map);
    for (let ty = ty0; ty < ty1; ty++) for (let tx = tx0; tx < tx1; tx++) {
      if (!map.inb(tx, ty)) continue;
      const g = map.get(tx, ty);
      const h = hash2(tx, ty, 7);
      const X = tx * TILE, Y = ty * TILE;
      // potholes become little ponds
      if (isPothole(map, tx, ty)) {
        const pg = potholeGeom(tx, ty), cx = pg.cx, cy = pg.cy, rx = pg.rx * (0.6 + wet * 0.5);
        ctx.fillStyle = `rgba(110,130,150,${0.75 * Math.min(1, wet * 1.5)})`;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, rx * 0.7, 0.3, 0, 7); ctx.fill();
        ctx.fillStyle = `rgba(220,235,255,${0.25 * wet})`; ctx.fillRect(cx - rx * 0.5, cy - rx * 0.3, rx * 0.6, 0.5);
        if (env.rainAmt > 0.1) { const ph = (t * 1.6 + h * 10) % 1; ctx.strokeStyle = `rgba(230,240,255,${(1 - ph) * 0.4})`; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.ellipse(cx, cy, 0.6 + ph * rx * 0.8, 0.3 + ph * rx * 0.5, 0, 0, 7); ctx.stroke(); }
      } else if ((g === G.DIRT || g === G.DIRTROAD || g === G.PLAZA || g === G.CANTERA) && h < 0.07 * wet) {
        ctx.fillStyle = `rgba(120,140,160,${0.35 * wet})`;
        ctx.beginPath(); ctx.ellipse(X + 8, Y + 9, 5 + h * 30, 2.5 + h * 12, 0, 0, 7); ctx.fill();
      }
      // running water along the gutters (only next to the curb), following the slope of the street
      const f = map.flowDir[ty * map.w + tx];
      if (f && wet > 0.25) {
        const dx = f === 1 ? 1 : f === 2 ? -1 : 0, dy = f === 3 ? 1 : f === 4 ? -1 : 0;
        const a = Math.min(0.6, (wet - 0.25) * 1.2);
        const road = (x, y) => ROADS.has(map.get(x, y));
        const sides = dx ? [[!road(tx, ty - 1), Y + 1.8], [!road(tx, ty + 1), Y + TILE - 1.8]] : [[!road(tx - 1, ty), X + 1.8], [!road(tx + 1, ty), X + TILE - 1.8]];
        for (const [curbSide, l] of sides) {
          if (!curbSide) continue;
          const bw = 1.6 + wet * 1.6;
          ctx.fillStyle = `rgba(120,150,178,${a * 0.55})`;
          if (dx) ctx.fillRect(X, l - bw / 2, TILE, bw); else ctx.fillRect(l - bw / 2, Y, bw, TILE);
          ctx.strokeStyle = `rgba(215,232,245,${a})`; ctx.lineWidth = 0.45; ctx.beginPath();
          for (let k = 0; k < 3; k++) {
            const p = ((t * 26 + k * 5.3 + h * 16) % TILE);
            const w = (hash2(tx + k, ty, 3) - 0.5) * bw * 0.6;
            if (dx) { const px = dx > 0 ? X + p : X + TILE - p; ctx.moveTo(px, l + w); ctx.lineTo(px + dx * 2.2, l + w); }
            else { const py = dy > 0 ? Y + p : Y + TILE - p; ctx.moveTo(l + w, py); ctx.lineTo(l + w, py + dy * 2.2); }
          }
          ctx.stroke();
        }
      }
    }
    // flooding: the Jardín de la Paz sits in a dip and fills with muddy water in a downpour
    const flood = env.flood || 0;
    if (flood > 0) for (const z of map.floodZones || []) {
      const X = z.x * TILE, Y = z.y * TILE, W = z.w * TILE, H = z.h * TILE;
      if (X > x0 + vw || X + W < x0 || Y > y0 + vh || Y + H < y0) continue;
      const grow = 0.3 + flood * 0.7, ix = W / 2 * (1 - grow), iy = H / 2 * (1 - grow);
      const g = ctx.createLinearGradient(0, Y + iy, 0, Y + H - iy);
      g.addColorStop(0, `rgba(135,160,175,${0.75 * flood})`); g.addColorStop(1, `rgba(110,105,80,${0.78 * flood})`);
      ctx.fillStyle = g; roundRect(ctx, X + ix - 4, Y + iy - 3, W - ix * 2 + 8, H - iy * 2 + 6, 18 * grow + 6); ctx.fill();
      ctx.strokeStyle = `rgba(235,240,235,${0.35 * flood})`; ctx.lineWidth = 0.8; roundRect(ctx, X + ix - 4, Y + iy - 3, W - ix * 2 + 8, H - iy * 2 + 6, 18 * grow + 6); ctx.stroke();
      ctx.strokeStyle = `rgba(230,240,245,${0.35 * flood})`; ctx.lineWidth = 0.45;
      const n = 14 + Math.floor(env.rainAmt * 20);
      for (let i = 0; i < n; i++) {
        const ph = (t * 1.3 + i * 0.37) % 1, rx = X + ix + hash2(i, Math.floor(t * 1.3 + i * 0.37), 5) * (W - ix * 2), ry = Y + iy + hash2(Math.floor(t * 1.3 + i * 0.37), i, 6) * (H - iy * 2);
        ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(rx, ry, 0.6 + ph * 4, 0.3 + ph * 2, 0, 0, 7); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,255,255,${0.12 * flood})`; ctx.fillRect(X + ix + 10, Y + iy + 6, (W - ix * 2) * 0.4, 1.2);
    }
  }

  drawSky(ctx, game, x0, y0) {
    const { canvas } = this;
    const env = game.env;
    // colour grading by time of day
    const L = env.light;
    let tint;
    if (L > 0.85) tint = null;
    else if (env.dusk) tint = rgba('#ff8a3d', (0.85 - L) * 0.35);
    else if (env.dawn) tint = rgba('#ffb38a', (0.85 - L) * 0.3);
    if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    // cloud shadows drifting over the town
    if (env.cloud > 0.15) {
      const S = this.S;
      for (const c of this.clouds) {
        const cx = ((c.x + game.clock.real * 6 * c.s) % 3000) - x0 - 500, cy = ((c.y + game.clock.real * 2) % 2600) - y0 - 400;
        ctx.globalAlpha = 0.14 * env.cloud;
        ctx.drawImage(this.glowSprite('#1e283c'), cx * S - c.r * S, cy * S - c.r * S, c.r * 2 * S, c.r * 2 * S);
        ctx.globalAlpha = 1;
      }
    }
    if (env.overcast) { ctx.fillStyle = `rgba(70,80,100,${env.overcast * 0.22})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  }

  drawLights(ctx, game, map, x0, y0) {
    const env = game.env;
    const dark = map.outdoor ? clamp(1 - env.light, 0, 0.82) : (map.dark || 0);
    if (dark < 0.03 && !game.ufoGlow) return;
    const l = this.light, lc = this.lctx, S = this.S / 2;
    lc.globalCompositeOperation = 'source-over';
    lc.clearRect(0, 0, l.width, l.height);
    lc.fillStyle = `rgba(8,12,34,${dark})`;
    lc.fillRect(0, 0, l.width, l.height);
    lc.globalCompositeOperation = 'destination-out';
    const act = game.state.act;
    const fires = this.firesOn(game);
    const lights = map.lights.filter(l => (!l.acts || l.acts.includes(act)) && (!l.nightOnly || fires)).concat(game.dynamicLights || []);
    for (const li of lights) {
      const sx = (li.x - x0) * S, sy = (li.y - y0) * S, r = li.r * S;
      if (sx < -r || sy < -r || sx > l.width + r || sy > l.height + r) continue;
      lc.globalAlpha = li.power ?? 0.95;
      lc.drawImage(this.blob, sx - r, sy - r, r * 2, r * 2);
    }
    lc.globalAlpha = 1;
    ctx.drawImage(l, 0, 0, this.canvas.width, this.canvas.height);
    // warm additive glow
    if (dark > 0.25) {
      ctx.globalCompositeOperation = 'lighter';
      for (const li of lights) {
        const sx = (li.x - x0) * this.S, sy = (li.y - y0) * this.S, r = li.r * this.S * 0.45;
        if (sx < -r || sy < -r || sx > this.canvas.width + r || sy > this.canvas.height + r) continue;
        ctx.globalAlpha = 0.22 * dark;
        ctx.drawImage(this.glowSprite(li.color || '#ffd9a0'), sx - r, sy - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  drawWeather(ctx, game, x0, y0) {
    const env = game.env, { canvas } = this;
    const want = Math.floor(env.rainAmt * 260);
    while (this.rain.length < want) this.rain.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, v: 0.8 + Math.random() * 0.6 });
    if (this.rain.length > want) this.rain.length = want;
    if (want) {
      ctx.strokeStyle = 'rgba(200,215,235,0.55)'; ctx.lineWidth = 1 * this.dpr;
      ctx.beginPath();
      const dt = game.clock.dt;
      for (const d of this.rain) {
        d.y += 900 * d.v * dt * this.dpr; d.x += 120 * dt * this.dpr * env.wind;
        if (d.y > canvas.height) { d.y = -20; d.x = Math.random() * canvas.width; }
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 3 * env.wind * this.dpr, d.y + 14 * this.dpr);
      }
      ctx.stroke();
      ctx.fillStyle = `rgba(60,70,90,${0.12 * env.rainAmt})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (env.lightning > 0) { ctx.fillStyle = `rgba(235,240,255,${env.lightning})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  }
}

// For every road tile, which neighbouring road tile is downhill (1 E, 2 W, 3 S, 4 N, 0 none).
function computeFlow(map) {
  // Water follows the street it is on: along a horizontal street it runs east or west, along a vertical
  // one north or south, downhill over a few tiles (so tiny bumps don't make it zig-zag).
  const f = new Uint8Array(map.w * map.h);
  const E = (x, y) => map.elevAt(clamp(x, 0, map.w - 1), clamp(y, 0, map.h - 1));
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const g = map.get(x, y);
    if (!ROADS.has(g)) continue;
    const ld = map.laneDir ? map.laneDir[y * map.w + x] : 0;
    const horiz = ld & 10, vert = ld & 5;
    const dh = E(x - 3, y) - E(x + 3, y), dv = E(x, y - 3) - E(x, y + 3);
    let best = 0;
    if (horiz && (!vert || Math.abs(dh) >= Math.abs(dv))) { if (dh > 0.05) best = 1; else if (dh < -0.05) best = 2; }
    else if (vert || !ld) { if (dv > 0.05) best = 3; else if (dv < -0.05) best = 4; else if (!ld) { if (dh > 0.05) best = 1; else if (dh < -0.05) best = 2; } }
    f[y * map.w + x] = best;
  }
  map.flowDir = f;
}
