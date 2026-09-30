// Frame renderer: ground chunks, y-sorted sprites & entities, light and weather.
import { TILE, makeCanvas, clamp, lerp, rgba, mix } from './util.js';
import { ChunkCache, CHUNK } from './render/ground.js';
import { SPRITES } from './render/landmarks.js';
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
    this.CS = Math.min(this.S, 4);            // cache resolution (px per unit)
    setPeopleScale(this.CS);
    this.spriteCache.clear();
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
    if (this.spriteCache.size > 320) this.spriteCache.delete(this.spriteCache.keys().next().value);
    return c;
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
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cy < 0 || cx * CHUNK >= map.w || cy * CHUNK >= map.h) continue;
      const key = cx + ',' + cy;
      let img = this.chunks.cache.get(key);
      if (!img) { if (budget-- <= 0) { ctx.fillStyle = '#7a9a5a'; ctx.fillRect(cx * csz, cy * csz, csz, csz); continue; } img = this.chunks.get(cx, cy); }
      else this.chunks.get(cx, cy);
      ctx.drawImage(img, cx * csz, cy * csz, csz + 0.3, csz + 0.3);
    }
    game.firstFrame = false;

    // ground-level effects (puddles, footprints, tianguis shade...)
    if (game.env.rainAmt > 0.2 && map.outdoor) this.drawPuddles(ctx, map, x0, y0, vw, vh, game.env);

    // y-sorted drawables
    const list = map.spritesInView(x0, y0, x0 + vw, y0 + vh);
    const items = [];
    for (const s of list) {
      if (s.hidden) continue;
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

  drawPuddles(ctx, map, x0, y0, vw, vh, env) {
    const tx0 = Math.floor(x0 / TILE), ty0 = Math.floor(y0 / TILE);
    ctx.fillStyle = `rgba(120,150,175,${0.28 * env.rainAmt})`;
    for (let ty = ty0; ty < ty0 + vh / TILE + 1; ty++) for (let tx = tx0; tx < tx0 + vw / TILE + 1; tx++) {
      const g = map.get(tx, ty);
      if (g !== 2 && g !== 3 && g !== 27 && g !== 1 && g !== 5) continue;
      const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
      if (h % 9 !== 0) continue;
      const px = tx * TILE + (h % 7) + 3, py = ty * TILE + ((h >> 3) % 7) + 4;
      ctx.beginPath(); ctx.ellipse(px, py, 4 + (h % 3), 2 + (h % 2), 0, 0, 7); ctx.fill();
      const ph = (performance.now() / 600 + (h % 10) / 10) % 1;
      ctx.strokeStyle = `rgba(230,240,255,${(1 - ph) * 0.35 * env.rainAmt})`; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.ellipse(px, py, 1 + ph * 3, 0.5 + ph * 1.5, 0, 0, 7); ctx.stroke();
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
    const lights = map.lights.filter(l => !l.acts || l.acts.includes(act)).concat(game.dynamicLights || []);
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
