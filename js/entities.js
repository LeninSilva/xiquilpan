// Moving things: people (player & NPCs), vehicles, animals.
import { TILE, clamp, dist, rng, pick, hash2 } from './util.js';
import { getFrame, drawCow, drawDog, drawBird, drawChicken, CHAR_W, CHAR_H } from './render/people.js';
import { drawCar, drawBikeSide, drawBikeTop, PAINTS, MODELS } from './render/cars.js';
import { drawHorse } from './render/jiquilpan.js';
import { DIR } from './data/build.js';
import { G, ROADS } from './world.js';

let NEXT_ID = 1;

export class Entity {
  constructor(map, x, y) { this.id = NEXT_ID++; this.map = map; this.x = x; this.y = y; this.hidden = false; }
  update() {}
  draw() {}
}

// ---------------------------------------------------------------------------
export class Person extends Entity {
  constructor(map, x, y, look) {
    super(map, x, y);
    this.look = look; this.dir = 0; this.moving = false; this.animT = Math.random() * 10;
    this.speed = 46; this.radius = 4; this.solid = true;
    this.blinkT = 2 + Math.random() * 4; this.blink = 0;
    this.pose = null; // 'sit', 'wave', 'talk'
    this.bubble = null; // {text, t}
  }
  tryMove(dx, dy, dt, others) {
    const m = this.map;
    if (m.blocked(this.x, this.y, 4, 2.5)) this.unstick();
    const nx = this.x + dx * dt, ny = this.y + dy * dt;
    let moved = false;
    if (dx !== 0 && !m.blocked(nx, this.y, 4, 2.5) && !this.bump(nx, this.y, others)) { this.x = nx; moved = true; }
    if (dy !== 0 && !m.blocked(this.x, ny, 4, 2.5) && !this.bump(this.x, ny, others)) { this.y = ny; moved = true; }
    if (!moved && (dx || dy)) moved = this.slideAround(dx, dy, dt, others);
    return moved;
  }
  // Corner assist: when walking into the edge of a wall, a tree or a bench, slip sideways around it
  // instead of getting stuck on a corner.
  slideAround(dx, dy, dt, others) {
    const m = this.map, sp = Math.hypot(dx, dy) * dt;
    const horiz = Math.abs(dx) >= Math.abs(dy);
    for (const o of [3, 6, 9, 12]) for (const sgn of [-1, 1]) {
      const ox = horiz ? 0 : sgn * o, oy = horiz ? sgn * o : 0;
      const tx = this.x + ox + (horiz ? Math.sign(dx) * sp : 0), ty = this.y + oy + (horiz ? 0 : Math.sign(dy) * sp);
      if (m.blocked(tx, ty, 4, 2.5) || m.blocked(this.x + ox, this.y + oy, 4, 2.5)) continue;
      const step = Math.min(sp, o);
      const nx = this.x + (horiz ? 0 : sgn * step), ny = this.y + (horiz ? sgn * step : 0);
      if (m.blocked(nx, ny, 4, 2.5) || this.bump(nx, ny, others)) continue;
      this.x = nx; this.y = ny; return true;
    }
    return false;
  }
  // If we ever end up inside something solid (a spawn point, a stall that appeared), step out.
  unstick() {
    const m = this.map;
    for (let r = 2; r <= 48; r += 2) for (let a = 0; a < 16; a++) {
      const x = this.x + Math.cos(a / 16 * Math.PI * 2) * r, y = this.y + Math.sin(a / 16 * Math.PI * 2) * r;
      if (!m.blocked(x, y, 4, 2.5)) { this.x = x; this.y = y; return true; }
    }
    return false;
  }
  bump(x, y, others) {
    if (!others) return false;
    for (const o of others) {
      if (o === this || !o.solid || o.map !== this.map || o.hidden) continue;
      const r = (o.radius || 4) + this.radius - 1;
      const dx = x - o.x, dy = (y - o.y) * 1.6;
      if (dx * dx + dy * dy < r * r) {
        const cur = (this.x - o.x) ** 2 + ((this.y - o.y) * 1.6) ** 2;
        if (dx * dx + dy * dy < cur) return true; // only block when getting closer
      }
    }
    return false;
  }
  face(tx, ty) {
    const dx = tx - this.x, dy = ty - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx < 0 ? 2 : 3; else this.dir = dy < 0 ? 1 : 0;
  }
  setDirFromVec(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy) * 1.1) this.dir = dx < 0 ? 2 : 3;
    else if (dy !== 0) this.dir = dy < 0 ? 1 : 0;
  }
  frame() {
    if (this.pose === 'sit') return 'sit';
    if (this.pose === 'dance') return 'dance' + (Math.floor(this.animT * 2.6 + (this.phase || 0)) % 2);
    if (this.moving) return Math.floor(this.animT * (this.running ? 11 : 7.5)) % 4;
    if (this.pose === 'talk') return Math.floor(this.animT * 5) % 2 ? 'talk' : 'idle';
    if (this.pose === 'wave') return 'wave';
    if (this.blink > 0) return 'blink';
    return Math.floor(this.animT * 1.2) % 2 ? 'idle2' : 'idle';
  }
  updateAnim(dt) {
    this.animT += dt;
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blink = 0.12; this.blinkT = 2.5 + Math.random() * 4; }
    if (this.blink > 0) this.blink -= dt;
    if (this.bubble) { this.bubble.t -= dt; if (this.bubble.t <= 0) this.bubble = null; }
  }
  draw(ctx, game) {
    if (this.down) { // lying on the ground, hurt
      const img = getFrame(this.look, 2, 'hurt');
      ctx.save(); ctx.translate(this.x, this.y - 2); ctx.rotate(-Math.PI / 2 * 0.94);
      ctx.drawImage(img, -CHAR_W / 2 - 6, -44 + 14, CHAR_W, CHAR_H); ctx.restore();
      if (this.bubble) drawBubble(ctx, this.x, this.y - 16, this.bubble.text);
      else if (Math.floor(game.clock.real / 3 + this.id) % 3 === 0) drawBubble(ctx, this.x, this.y - 16, ['Ay…', 'Mi pierna…', 'Ayúdenme…'][this.id % 3]);
      return;
    }
    const img = getFrame(this.look, this.dir, this.frame());
    const lift = this.pose === 'sit' ? 3 : 0;
    ctx.drawImage(img, this.x - CHAR_W / 2, this.y - 44 + lift, CHAR_W, CHAR_H);
    if (this.look.glow > 0.2) {
      ctx.fillStyle = `rgba(110,120,255,${0.18 * this.look.glow})`;
      ctx.beginPath(); ctx.ellipse(this.x, this.y - 18, 12, 22, 0, 0, 7); ctx.fill();
    }
    if (this.marker) drawMarker(ctx, this.x, this.y - 50 * this.look.body, this.marker, game.clock.real);
    if (this.bubble) drawBubble(ctx, this.x, this.y - 48 * this.look.body - 6, this.bubble.text);
  }
}

export function drawMarker(ctx, x, y, kind, t) {
  const b = Math.sin(t * 4) * 1.5;
  ctx.save(); ctx.translate(x, y + b);
  const c = kind === 'main' ? '#f2c230' : kind === 'side' ? '#5ec8f2' : kind === 'shop' ? '#7be07b' : '#ffffff';
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0.6, 0.8, 4, 4.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 4, 4.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1b1b1f'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(kind === 'shop' ? '$' : kind === 'talk' ? '…' : '!', 0, 0.4);
  ctx.restore();
}

export function drawBubble(ctx, x, y, text) {
  ctx.save();
  ctx.font = '600 5.2px system-ui, sans-serif';
  const w = Math.min(90, ctx.measureText(text).width + 8);
  ctx.fillStyle = 'rgba(255,253,246,0.95)';
  ctx.strokeStyle = 'rgba(40,30,20,0.4)'; ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 10, w, 9, 3) : ctx.rect(x - w / 2, y - 10, w, 9); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 2, y - 1.2); ctx.lineTo(x, y + 1.6); ctx.lineTo(x + 2, y - 1.2); ctx.fill();
  ctx.fillStyle = '#2a2420'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let t = text; while (ctx.measureText(t).width > w - 6 && t.length > 4) t = t.slice(0, -2);
  if (t !== text) t = t.slice(0, -1) + '…';
  ctx.fillText(t, x, y - 5.4);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// A* over the tile grid (4-neighbour), bounded, with a binary heap.
let _g = null, _came = null, _stamp = null, _gen = 0;
export function findPath(map, sx, sy, tx, ty, maxNodes = 9000) {
  const W = map.w, N = map.w * map.h;
  if (!_g || _g.length < N) { _g = new Float32Array(N); _came = new Int32Array(N); _stamp = new Uint32Array(N); }
  _gen++;
  sx = Math.floor(sx); sy = Math.floor(sy); tx = Math.floor(tx); ty = Math.floor(ty);
  if (!map.inb(tx, ty) || !map.inb(sx, sy)) return null;
  if (map.isSolidTile(tx, ty)) {
    let found = false;
    for (let r = 1; r < 4 && !found; r++) for (let dy = -r; dy <= r && !found; dy++) for (let dx = -r; dx <= r; dx++) {
      if (!map.isSolidTile(tx + dx, ty + dy)) { tx += dx; ty += dy; found = true; break; }
    }
    if (!found) return null;
  }
  const start = sy * W + sx, goal = ty * W + tx;
  const heapI = [], heapF = [];
  const push = (i, f) => { heapI.push(i); heapF.push(f); let k = heapI.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heapF[p] <= heapF[k]) break; [heapI[p], heapI[k]] = [heapI[k], heapI[p]]; [heapF[p], heapF[k]] = [heapF[k], heapF[p]]; k = p; } };
  const pop = () => { const top = heapI[0]; const li = heapI.pop(), lf = heapF.pop(); if (heapI.length) { heapI[0] = li; heapF[0] = lf; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < heapI.length && heapF[a] < heapF[m]) m = a; if (b < heapI.length && heapF[b] < heapF[m]) m = b; if (m === k) break; [heapI[m], heapI[k]] = [heapI[k], heapI[m]]; [heapF[m], heapF[k]] = [heapF[k], heapF[m]]; k = m; } } return top; };
  _stamp[start] = _gen; _g[start] = 0; _came[start] = -1;
  push(start, Math.abs(sx - tx) + Math.abs(sy - ty));
  let n = 0;
  while (heapI.length && n++ < maxNodes) {
    const cur = pop();
    if (cur === goal) {
      const path = []; let c = cur;
      while (c !== -1) { path.push([c % W, Math.floor(c / W)]); c = _came[c]; }
      return path.reverse();
    }
    const cx = cur % W, cy = (cur - cx) / W, gc = _g[cur];
    for (let k = 0; k < 4; k++) {
      const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= W || ny >= map.h || map.isSolidTile(nx, ny)) continue;
      const ni = ny * W + nx;
      if (map.colBlock && map.colBlock[ni] && ni !== goal) continue;
      const gn = map.ground[ni];
      const cost = gc + (map.walkway && map.walkway[ni] ? 0.9 : ROADS.has(gn) ? 1.7 : (gn === G.GARDEN || gn === G.GRASS) ? 2.3 : 1);
      if (_stamp[ni] === _gen && _g[ni] <= cost) continue;
      _stamp[ni] = _gen; _g[ni] = cost; _came[ni] = cur;
      push(ni, cost + Math.abs(nx - tx) + Math.abs(ny - ty));
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// What people drive around here: mostly Nissans, Chevrolets and Toyotas, the odd Vocho, a few pickups,
// a rare Chinese or Japanese electric, and — very rarely — somebody's Porsche.
const CAR_MIX = [['tsuru', 22], ['versa', 18], ['march', 12], ['aveo', 10], ['corolla', 8], ['vocho', 6], ['tacoma', 7], ['cheyenne', 5], ['leaf', 1.4], ['byd', 1.6], ['porsche', 0.35]];
export function randomModel(r) {
  let t = r() * CAR_MIX.reduce((a, [, w]) => a + w, 0);
  for (const [m, w] of CAR_MIX) { if ((t -= w) <= 0) return m; }
  return 'tsuru';
}
export const COMBI_ROUTES = {
  verde: { color: '#2f9e44', text: 'CENTRO · ENTRADA', name: 'Ruta Verde' },
  roja: { color: '#c92a2a', text: 'CENTRO · BOSQUE', name: 'Ruta Roja' },
  amarilla: { color: '#f2c230', text: 'CENTRO · SAHUAYO', name: 'Ruta Amarilla' },
};
export class Vehicle extends Entity {
  constructor(map, tx, ty, kind, seed) {
    super(map, tx * TILE + 8, ty * TILE + 8);
    const r = rng(seed);
    this.kind = kind; // car, taxi, pickup, moto, bici, rino, combi, ambulancia, patrulla
    this.color = kind === 'taxi' ? '#f4f4f0' : pick(r, PAINTS);
    this.model = kind === 'taxi' ? pick(r, ['tsuru', 'tsuru', 'versa']) : kind === 'pickup' ? pick(r, ['tacoma', 'cheyenne']) : kind === 'car' ? randomModel(r)
      : (kind === 'combi' || kind === 'ambulancia' || kind === 'patrulla') ? (kind === 'combi' ? 'combi' : kind) : null;
    if (this.model === 'porsche') this.color = pick(r, ['#c9c9c4', '#b3201f', '#1b1b1d', '#e0c13a']);
    if (this.model === 'byd') this.color = pick(r, ['#9cc9d8', '#e8e6e0', '#f2b6a0']);
    if (kind === 'ambulancia') this.color = '#f6f6f2';
    if (kind === 'patrulla') this.color = '#f2f2f0';
    this.spec = { model: this.model, color: this.color, taxi: kind === 'taxi', num: String(10 + Math.floor(r() * 80)), damage: 0 };
    this.speed = kind === 'bici' || kind === 'rino' ? 34 : kind === 'moto' ? 60 : kind === 'combi' ? 44 : 48 + r() * 14;
    if (this.model === 'porsche') this.speed += 10;
    this.dir = null; this.tx = tx; this.ty = ty; this.progress = 0; this.wait = 0;
    this.solid = true; this.radius = this.model ? 12 : 6;
    this.riderLook = null;
    this.honk = 0;
    this.stuck = 0;
  }
  setRoute(name) {
    const R = COMBI_ROUTES[name]; this.route = name; this.color = R.color;
    this.spec = { ...this.spec, model: 'combi', color: R.color, route: name, text: R.text };
  }
  occupied(tx, ty) {
    for (const v of this.fleet || []) if (v !== this && !v.dead && v.tx === tx && v.ty === ty) return true;
    return false;
  }
  laneAt(x, y) {
    const m = this.map;
    if (!m.inb(x, y)) return 0;
    const i = y * m.w + x;
    if (!ROADS.has(m.ground[i]) || (m.closed && m.closed[i])) return 0;
    return m.laneDir[i];
  }
  update(dt, game) {
    const m = this.map;
    if (this.parked) { this.animT = (this.animT || 0) + dt; return; }
    if (this.x < -TILE || this.y < -TILE || this.x > m.w * TILE + TILE || this.y > m.h * TILE + TILE) { this.dead = true; return; }
    if (this.fading) { this.alpha = (this.alpha ?? 1) - dt * 0.8; if (this.alpha <= 0) this.dead = true; return; }
    if (this.dir === null) { this.pickDir(); if (this.dir === null) { this.giveUp(game); return; } }
    const [dx, dy] = dvec(this.dir);
    this.nx = this.tx + dx; this.ny = this.ty + dy;
    // Is anything in the box ahead of us? (people, animals, carts, other vehicles)
    const len = this.radius + 14, half = this.radius > 8 ? 7 : 4;
    const bx0 = dx ? Math.min(this.x, this.x + dx * len) : this.x - half, bx1 = dx ? Math.max(this.x, this.x + dx * len) : this.x + half;
    const by0 = dy ? Math.min(this.y, this.y + dy * len) : this.y - half, by1 = dy ? Math.max(this.y, this.y + dy * len) : this.y + half;
    let blocked = false;
    for (const o of game.entities) {
      if (o === this || o.map !== m || o.hidden || !o.solid) continue;
      const r = o instanceof Vehicle ? o.radius * 0.6 : (o.radius || 4);
      if (o.x + r > bx0 && o.x - r < bx1 && o.y + r * 0.6 > by0 && o.y - r * 0.6 < by1) {
        // a vehicle that is beside us going the same way (overtaking lane) doesn't block
        blocked = true;
        if (o === game.player && this.honk <= 0) { this.honk = 4; game.sfx?.('honk'); }
        break;
      }
    }
    // Tile reservation: never enter a tile another vehicle is in, or is about to enter ahead of us
    if (!blocked && this.progress > TILE * 0.35) {
      for (const v of game.npcs?.vehicles || []) {
        if (v === this || v.dead || v.map !== m) continue;
        if ((v.tx === this.nx && v.ty === this.ny) || (v.nx === this.nx && v.ny === this.ny && (v.progress > this.progress || (v.progress === this.progress && v.id < this.id)))) { blocked = true; break; }
      }
    }
    this.honk -= dt;
    if (blocked && this.emergency && this.stuck > 1.5) blocked = false; // everybody makes way for a siren
    if (blocked) {
      this.stuck += dt;
      if (this.emergency) return;
      if (this.stuck > 6 && !game.onScreen?.(this.x, this.y, 40)) this.dead = true; // only ever vanish off-screen
      return;
    }
    this.stuck = 0;
    const sp = this.speed * (game.env.rainAmt > 0.5 ? 0.8 : 1);
    const g = m.get(Math.floor(this.x / TILE), Math.floor(this.y / TILE));
    const slow = (g === G.DIRTROAD || g === G.ROCKROAD) ? 0.7 : g === G.LAJA || g === G.COBBLE ? 0.85 : 1;
    this.progress += sp * slow * dt;
    this.x += dx * sp * slow * dt; this.y += dy * sp * slow * dt;
    if (this.progress >= TILE) {
      this.progress -= TILE;
      this.tx += dx; this.ty += dy;
      this.x = this.tx * TILE + 8 + dx * this.progress; this.y = this.ty * TILE + 8 + dy * this.progress;
      this.pickDir();
      if (this.dir === null) this.giveUp(game);
    }
    this.animT = (this.animT || 0) + dt;
  }
  // No way forward: turn around into the opposite lane if there is one; otherwise pull over and
  // fade away. A car never leaves the road (it used to keep driving straight onto the grass).
  giveUp(game) {
    if (this.emergency) { // re-plan toward the goal, or just stop where we are
      const goal = this.goal;
      const p = goal && lanePath(this.map, this.tx, this.ty, goal[0], goal[1], 1);
      if (p && p.length > 1) { this.plan = p; this.planI = 0; this.followPlan(); return; }
      this.dir = null; this.parked = true; const cb = this.onArrive; this.onArrive = null; cb?.(this); return;
    }
    if (!game.onScreen?.(this.x, this.y, 40)) { this.dead = true; return; }
    const back = opposite(this.lastDir || DIR.E);
    for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const l = this.laneAt(this.tx + ox, this.ty + oy);
      if (!(l & back) || this.occupied(this.tx + ox, this.ty + oy)) continue;
      const [bx, by] = dvec(back);
      if (!this.laneAt(this.tx + ox + bx, this.ty + oy + by)) continue;
      this.tx += ox; this.ty += oy; this.x = this.tx * TILE + 8; this.y = this.ty * TILE + 8; this.progress = 0;
      this.dir = back; return;
    }
    this.dir = null; this.fading = true;
  }
  // Follow a planned route (combis, ambulance, police): steer toward the next tile of the plan.
  followPlan() {
    const plan = this.plan;
    let i = this.planI || 0;
    while (i < plan.length && !(plan[i][0] === this.tx && plan[i][1] === this.ty)) i++;
    if (i >= plan.length) { this.plan = null; return false; }
    this.planI = i;
    const nxt = plan[i + 1];
    if (!nxt) { const cb = this.onArrive; this.plan = null; this.dir = null; this.parked = true; cb?.(this); return true; }
    const dx = nxt[0] - this.tx, dy = nxt[1] - this.ty;
    const d = dx > 0 ? DIR.E : dx < 0 ? DIR.W : dy > 0 ? DIR.S : DIR.N;
    if (!(this.laneAt(this.tx, this.ty) & d)) {
      // lateral lane change: slide over
      this.tx = nxt[0]; this.ty = nxt[1]; this.x = this.tx * TILE + 8; this.y = this.ty * TILE + 8; this.planI = i + 1; return this.followPlan();
    }
    this.dir = d; return true;
  }
  pickDir() {
    if (this.parked) { this.dir = null; return; }
    if (this.plan && this.followPlan()) return;
    if (this.dir) { const [dx, dy] = dvec(this.dir); if (!this.map.inb(this.tx + dx, this.ty + dy)) return; } // leaving town by the highway
    const cur = this.laneAt(this.tx, this.ty);
    const opts = [];
    for (const d of [DIR.N, DIR.E, DIR.S, DIR.W]) {
      if (!(cur & d)) continue;
      if (this.dir && d === opposite(this.dir)) continue;
      const [dx, dy] = dvec(d);
      const nl = this.laneAt(this.tx + dx, this.ty + dy);
      if (nl && (nl & d || nl & turnsOf(d))) opts.push(d);
    }
    if (!opts.length) {
      // lane change sideways (to a parallel lane of the same direction)
      if (this.dir) {
        const [dx, dy] = dvec(this.dir);
        for (const s of [-1, 1]) {
          const ox = dy !== 0 ? s : 0, oy = dx !== 0 ? s : 0;
          if (this.laneAt(this.tx + ox + dx, this.ty + oy + dy) & this.dir && !this.occupied(this.tx + ox, this.ty + oy)) { this.tx += ox; this.ty += oy; this.x += ox * TILE; this.y += oy * TILE; return; }
        }
      }
      if (this.dir) this.lastDir = this.dir;
      this.dir = null; return;
    }
    // keep straight most of the time
    if (this.dir && opts.includes(this.dir) && Math.random() < 0.7) return;
    this.dir = opts[Math.floor(Math.random() * opts.length)];
  }
  draw(ctx, game) {
    const d = this.dir || this.lastDir || DIR.E;
    const L = d === DIR.N ? 'N' : d === DIR.S ? 'S' : d === DIR.W ? 'W' : 'E';
    ctx.save(); ctx.translate(this.x, this.y + 4);
    if (this.alpha != null) ctx.globalAlpha = Math.max(0, this.alpha);
    if (!this.model) drawTwoWheeler(ctx, this, d, game);
    else drawCar(ctx, this.spec, L);
    if (this.siren) { // flashing light bar
      const on = Math.floor(game.clock.real * 6) % 2;
      const horiz = L === 'E' || L === 'W', y = horiz ? -(MODELS[this.model].roof + 2.2) : -2;
      ctx.globalCompositeOperation = 'lighter';
      for (const [c, k] of [['rgba(255,40,40,0.8)', on], ['rgba(60,110,255,0.8)', 1 - on]]) { if (!k) continue; const g = ctx.createRadialGradient(0, y, 0, 0, y, 14); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, y, 14, 0, 7); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    if (this.smoke > 0) for (let i = 0; i < 4; i++) { const p = (game.clock.real * 0.8 + i / 4) % 1; ctx.fillStyle = `rgba(90,90,95,${0.4 * (1 - p)})`; ctx.beginPath(); ctx.arc(Math.sin(i * 2 + game.clock.real) * 3, -10 - p * 22, 3 + p * 6, 0, 7); ctx.fill(); }
    ctx.restore();
    if (this.bubble) drawBubble(ctx, this.x, this.y - 30, this.bubble.text);
    if (game.env.light < 0.5 && this.model) {
      const [dx, dy] = dvec(d);
      ctx.fillStyle = 'rgba(255,240,190,0.22)';
      ctx.beginPath(); ctx.moveTo(this.x + dx * 14, this.y + dy * 12); ctx.lineTo(this.x + dx * 56 - dy * 14, this.y + dy * 50 - dx * 9); ctx.lineTo(this.x + dx * 56 + dy * 14, this.y + dy * 50 + dx * 9); ctx.fill();
    }
  }
}
// Breadth-first search over the lane network (respecting one-way directions and lane changes).
// Returns a list of tiles from (sx,sy) to the first tile within `r` of (gx,gy), or null.
export function lanePath(map, sx, sy, gx, gy, r = 1, limit = 60000) {
  const W = map.w, N = W * map.h;
  if (!lanePath.prev || lanePath.prev.length < N) { lanePath.prev = new Int32Array(N); lanePath.seen = new Uint32Array(N); lanePath.gen = 0; }
  const prev = lanePath.prev, seen = lanePath.seen, gen = ++lanePath.gen;
  const lane = (x, y) => { if (!map.inb(x, y)) return 0; const i = y * W + x; if (!ROADS.has(map.ground[i]) || (map.closed && map.closed[i])) return 0; return map.laneDir[i]; };
  const q = [sy * W + sx]; seen[q[0]] = gen; prev[q[0]] = -1;
  for (let h = 0; h < q.length && h < limit; h++) {
    const c = q[h], cx = c % W, cy = (c - cx) / W;
    if (Math.abs(cx - gx) + Math.abs(cy - gy) <= r) {
      const out = []; let k = c; while (k !== -1) { out.push([k % W, Math.floor(k / W)]); k = prev[k]; }
      return out.reverse();
    }
    const l = lane(cx, cy);
    for (const d of [DIR.N, DIR.E, DIR.S, DIR.W]) {
      if (!(l & d)) continue;
      const [dx, dy] = dvec(d);
      const nl = lane(cx + dx, cy + dy);
      if (nl && (nl & d || nl & turnsOf(d))) { const ni = (cy + dy) * W + cx + dx; if (seen[ni] !== gen) { seen[ni] = gen; prev[ni] = c; q.push(ni); } }
      // lane change to a parallel lane going the same way
      for (const sgn of [-1, 1]) {
        const ox = dy ? sgn : 0, oy = dx ? sgn : 0;
        if (lane(cx + ox, cy + oy) & d) { const ni = (cy + oy) * W + cx + ox; if (seen[ni] !== gen) { seen[ni] = gen; prev[ni] = c; q.push(ni); } }
      }
    }
  }
  return null;
}
export function nearestLane(map, x, y, maxR = 8) {
  for (let r = 0; r <= maxR; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const tx = x + dx, ty = y + dy; if (!map.inb(tx, ty)) continue;
    const i = ty * map.w + tx; if (map.laneDir[i] && ROADS.has(map.ground[i])) return [tx, ty];
  }
  return null;
}
export { dvec, DIR };
function dvec(d) { return d === DIR.N ? [0, -1] : d === DIR.S ? [0, 1] : d === DIR.E ? [1, 0] : [-1, 0]; }
function opposite(d) { return d === DIR.N ? DIR.S : d === DIR.S ? DIR.N : d === DIR.E ? DIR.W : DIR.E; }
function turnsOf(d) { return (d === DIR.N || d === DIR.S) ? (DIR.E | DIR.W) : (DIR.N | DIR.S); }

function drawTwoWheeler(ctx, v, d, game) {
  const horiz = d === DIR.E || d === DIR.W;
  const t = v.animT || 0;
  const color = v.kind === 'rino' ? (v.teamBike || '#e8e8e8') : v.color;
  if (horiz) { ctx.save(); if (d === DIR.W) ctx.scale(-1, 1); drawBikeSide(ctx, v.kind === 'moto' ? 'moto' : 'bici', color, t); ctx.restore(); }
  else drawBikeTop(ctx, v.kind === 'moto' ? 'moto' : 'bici', color);
  if (v.riderLook) {
    const dir = d === DIR.N ? 1 : d === DIR.S ? 0 : d === DIR.W ? 2 : 3;
    const pedal = v.kind === 'moto' ? 'sit' : 'ride' + (Math.floor(t * 8) % 2);
    const img = getFrame(v.riderLook, dir, pedal);
    ctx.drawImage(img, -CHAR_W / 2, -44 - (horiz ? 5 : 3), CHAR_W, CHAR_H);
  }
}

// ---------------------------------------------------------------------------
export class Animal extends Entity {
  constructor(map, x, y, kind, opts = {}) {
    super(map, x, y);
    this.kind = kind; this.variant = opts.variant; this.color = opts.color || '#b5854f';
    this.home = { x, y, r: opts.r || 60 };
    this.dir = 2; this.moving = false; this.animT = Math.random() * 5; this.wait = Math.random() * 3;
    this.target = null; this.solid = kind === 'cow' || kind === 'dog' || kind === 'horse';
    this.radius = kind === 'cow' || kind === 'horse' ? 12 : 5;
    this.speed = kind === 'cow' ? 12 : kind === 'horse' ? 16 : kind === 'dog' ? 40 : 22;
    this.flyT = 0;
  }
  update(dt, game) {
    this.animT += dt;
    const p = game.player;
    if (this.kind === 'pigeon') {
      if (this.flyT > 0) { this.flyT -= dt; this.y -= 30 * dt; this.x += this.fx * dt; if (this.flyT <= 0) { this.x = this.home.x + (Math.random() - 0.5) * 80; this.y = this.home.y + (Math.random() - 0.5) * 60; } return; }
      if (p.map === this.map && dist(p.x, p.y, this.x, this.y) < 22 && p.moving) { this.flyT = 1.6; this.fx = (this.x - p.x) * 2; game.sfx?.('flap'); return; }
    }
    if (this.kind === 'dog' && p.map === this.map) {
      const d = dist(p.x, p.y, this.x, this.y);
      if (d < 60 && game.stats && game.stats.corazon < -30 && !this.barked) { this.bubbleT = 1.5; this.barked = true; game.sfx?.('bark'); }
      if (d > 120) this.barked = false;
    }
    if (this.bubbleT > 0) this.bubbleT -= dt;
    if (this.follow && p.map === this.map) { // a led horse walks a few steps behind you
      const d = dist(p.x, p.y, this.x, this.y);
      if (d > 26) { this.target = { x: p.x - Math.sign(p.x - this.x) * 18, y: p.y + 4 }; this.wait = 0; this.speed = d > 80 ? 60 : 34; }
      else { this.target = null; this.moving = false; return; }
    }
    if (this.wait > 0) { this.wait -= dt; this.moving = false; return; }
    if (!this.target) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * this.home.r;
      this.target = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r * 0.7 };
    }
    const dx = this.target.x - this.x, dy = this.target.y - this.y, d = Math.hypot(dx, dy);
    if (d < 2) { this.target = null; this.wait = 1 + Math.random() * (this.kind === 'cow' ? 8 : 4); this.moving = false; return; }
    const vx = dx / d * this.speed, vy = dy / d * this.speed;
    const nx = this.x + vx * dt, ny = this.y + vy * dt;
    if (this.map.blocked(nx, ny, 5, 3)) { if (this.follow) { this.x = nx; this.y = ny; this.moving = true; return; } this.target = null; this.wait = 1; return; }
    this.x = nx; this.y = ny; this.moving = true;
    if (Math.abs(vx) > 0.1) this.dir = vx < 0 ? 2 : 3;
  }
  draw(ctx, game) {
    const t = game.clock.real;
    ctx.save(); ctx.translate(this.x, this.y);
    const fr = this.moving ? Math.floor(this.animT * 6) % 4 : 'idle';
    if (this.kind === 'cow') drawCow(ctx, this.variant, this.dir, fr, t + this.id);
    else if (this.kind === 'dog') drawDog(ctx, this.color, this.dir, fr, t);
    else if (this.kind === 'pigeon') drawBird(ctx, t + this.id, this.flyT > 0);
    else if (this.kind === 'chicken') drawChicken(ctx, t + this.id, this.dir);
    else if (this.kind === 'horse') drawHorse(ctx, this.dir === 2 ? -1 : 1, t + this.id, this.color, this.moving);
    ctx.restore();
    if (this.bubbleT > 0) drawBubble(ctx, this.x, this.y - 14, '¡Guau! ¡Guau!');
  }
}

// A pickup that very rarely drives up or down the rocky road of the cerro, following waypoints.
export class RoadTruck extends Entity {
  constructor(map, pts, color) {
    super(map, pts[0][0] * TILE + 8, pts[0][1] * TILE + 8);
    this.pts = pts; this.i = 1; this.color = color; this.speed = 26; this.solid = true; this.radius = 12; this.dir = DIR.S; this.honk = 0;
  }
  update(dt, game) {
    const t = this.pts[this.i]; if (!t) { this.dead = true; return; }
    const tx = t[0] * TILE + 8, ty = t[1] * TILE + 8, dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
    if (d < 2) { this.i++; return; }
    const p = game.player, ux = dx / d, uy = dy / d;
    if (p.map === this.map && dist(p.x, p.y, this.x + ux * 22, this.y + uy * 22) < 16) { if ((this.honk -= dt) <= 0) { this.honk = 4; game.sfx?.('honk'); } return; }
    this.x += ux * this.speed * dt; this.y += uy * this.speed * dt;
    this.dir = Math.abs(ux) > Math.abs(uy) ? (ux > 0 ? DIR.E : DIR.W) : (uy > 0 ? DIR.S : DIR.N);
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y + 4);
    drawCar(ctx, { model: 'tacoma', color: this.color }, this.dir === DIR.E ? 'E' : this.dir === DIR.W ? 'W' : this.dir === DIR.N ? 'N' : 'S');
    ctx.restore();
  }
}
