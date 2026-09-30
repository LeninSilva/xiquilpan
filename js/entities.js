// Moving things: people (player & NPCs), vehicles, animals.
import { TILE, clamp, dist, rng, pick, hash2 } from './util.js';
import { getFrame, drawCow, drawDog, drawBird, drawChicken, CHAR_W, CHAR_H } from './render/people.js';
import { drawCarSide } from './render/landmarks.js';
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
      const cost = gc + (ROADS.has(map.ground[ni]) ? 1.7 : 1);
      if (_stamp[ni] === _gen && _g[ni] <= cost) continue;
      _stamp[ni] = _gen; _g[ni] = cost; _came[ni] = cur;
      push(ni, cost + Math.abs(nx - tx) + Math.abs(ny - ty));
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
const CAR_COLORS = ['#c9ccd1', '#f4f4f0', '#b3201f', '#1f3f6f', '#2b2b2e', '#8a8f94', '#d8c79a', '#3e6b48', '#7a1f2b', '#e8e2d2'];
export class Vehicle extends Entity {
  constructor(map, tx, ty, kind, seed) {
    super(map, tx * TILE + 8, ty * TILE + 8);
    const r = rng(seed);
    this.kind = kind; // car, taxi, pickup, moto, bici, rino
    this.color = kind === 'taxi' ? '#f4f4f0' : pick(r, CAR_COLORS);
    this.model = kind === 'pickup' ? 'pickup' : 'tsuru';
    this.speed = kind === 'bici' || kind === 'rino' ? 34 : kind === 'moto' ? 60 : 48 + r() * 14;
    this.dir = null; this.tx = tx; this.ty = ty; this.progress = 0; this.wait = 0;
    this.solid = true; this.radius = kind === 'car' || kind === 'taxi' || kind === 'pickup' ? 12 : 6;
    this.riderLook = null;
    this.honk = 0;
    this.stuck = 0;
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
    if (this.dir === null) { this.pickDir(); if (this.dir === null) { this.dead = true; return; } }
    const [dx, dy] = dvec(this.dir);
    // anything ahead? (player, npc, other vehicle)
    const ax = this.x + dx * (this.radius + 10), ay = this.y + dy * (this.radius + 8);
    let blocked = false;
    for (const o of game.entities) {
      if (o === this || o.map !== m || o.hidden || !o.solid) continue;
      if (Math.abs(o.x - ax) < 10 && Math.abs(o.y - ay) < 9) { blocked = true; if (o === game.player && this.honk <= 0) { this.honk = 4; game.sfx?.('honk'); } break; }
    }
    this.honk -= dt;
    if (blocked) { this.stuck += dt; if (this.stuck > 8) { this.dead = true; } return; }
    this.stuck = 0;
    const sp = this.speed * (game.env.rainAmt > 0.5 ? 0.8 : 1);
    // pothole slowdown
    const g = m.get(Math.floor(this.x / TILE), Math.floor(this.y / TILE));
    const slow = (g === G.DIRTROAD || g === G.ROCKROAD) ? 0.7 : 1;
    this.progress += sp * slow * dt;
    this.x += dx * sp * slow * dt; this.y += dy * sp * slow * dt;
    if (this.progress >= TILE) {
      this.progress -= TILE;
      this.tx += dx; this.ty += dy;
      this.x = this.tx * TILE + 8 + dx * this.progress; this.y = this.ty * TILE + 8 + dy * this.progress;
      this.pickDir();
      if (this.dir === null) this.dead = true;
    }
    this.animT = (this.animT || 0) + dt;
  }
  pickDir() {
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
          if (this.laneAt(this.tx + ox + dx, this.ty + oy + dy) & this.dir) { this.tx += ox; this.ty += oy; return; }
        }
      }
      this.dir = null; return;
    }
    // keep straight most of the time
    if (this.dir && opts.includes(this.dir) && Math.random() < 0.7) return;
    this.dir = opts[Math.floor(Math.random() * opts.length)];
  }
  draw(ctx, game) {
    const d = this.dir || DIR.E;
    ctx.save(); ctx.translate(this.x, this.y + 4);
    const horiz = d === DIR.E || d === DIR.W;
    if (this.kind === 'moto' || this.kind === 'bici' || this.kind === 'rino') drawTwoWheeler(ctx, this, d, game);
    else if (horiz) drawCarSide(ctx, this.color, this.model, d === DIR.E, this.kind === 'taxi' ? '#1b7a3e' : null);
    else drawCarTop(ctx, this.color, d === DIR.N, this.kind === 'taxi', this.model);
    ctx.restore();
    if (game.env.light < 0.5 && (this.kind !== 'bici' && this.kind !== 'rino')) {
      const [dx, dy] = dvec(d);
      ctx.fillStyle = 'rgba(255,240,190,0.28)';
      ctx.beginPath(); ctx.moveTo(this.x + dx * 12, this.y + dy * 10); ctx.lineTo(this.x + dx * 48 - dy * 12, this.y + dy * 44 - dx * 8); ctx.lineTo(this.x + dx * 48 + dy * 12, this.y + dy * 44 + dx * 8); ctx.fill();
    }
  }
}
function dvec(d) { return d === DIR.N ? [0, -1] : d === DIR.S ? [0, 1] : d === DIR.E ? [1, 0] : [-1, 0]; }
function opposite(d) { return d === DIR.N ? DIR.S : d === DIR.S ? DIR.N : d === DIR.E ? DIR.W : DIR.E; }
function turnsOf(d) { return (d === DIR.N || d === DIR.S) ? (DIR.E | DIR.W) : (DIR.N | DIR.S); }

function drawCarTop(ctx, color, north, taxi, model) {
  ctx.fillStyle = 'rgba(20,20,35,0.28)'; ctx.beginPath(); ctx.ellipse(1, 2, 8, 14, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-7.6, -10, 2, 5); ctx.fillRect(5.6, -10, 2, 5); ctx.fillRect(-7.6, 5, 2, 5); ctx.fillRect(5.6, 5, 2, 5);
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-6.6, -14, 13.2, 26, 3) : ctx.rect(-6.6, -14, 13.2, 26); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(3.5, -13, 3, 24);
  ctx.fillStyle = '#30414d';
  const f = north ? -1 : 1;
  ctx.fillRect(-5, f * 3 - (north ? 5 : 0), 10, 5);
  ctx.fillRect(-5, -f * 7 - (north ? 0 : 3), 10, 3);
  if (model === 'pickup') { ctx.fillStyle = '#3a3a3a'; ctx.fillRect(-5, -f * 12 - (north ? 0 : 7), 10, 7); }
  ctx.fillStyle = color; ctx.fillRect(-5, -2, 10, 4);
  if (taxi) { ctx.fillStyle = '#fff'; ctx.fillRect(-2.5, -1.5, 5, 3); ctx.fillStyle = '#1b7a3e'; ctx.fillRect(-6.6, -2, 1, 4); ctx.fillRect(5.6, -2, 1, 4); }
  ctx.fillStyle = '#ffe9a6'; ctx.fillRect(-5, f * 13 - 0.5, 2.4, 1.2); ctx.fillRect(2.6, f * 13 - 0.5, 2.4, 1.2);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(-5, -f * 13.6, 2.4, 1); ctx.fillRect(2.6, -f * 13.6, 2.4, 1);
}

function drawTwoWheeler(ctx, v, d, game) {
  const horiz = d === DIR.E || d === DIR.W;
  const t = v.animT || 0;
  ctx.fillStyle = 'rgba(20,20,35,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, horiz ? 10 : 3.5, horiz ? 2.4 : 7, 0, 0, 7); ctx.fill();
  if (horiz) {
    ctx.save(); if (d === DIR.W) ctx.scale(-1, 1);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = v.kind === 'moto' ? 1.6 : 0.8;
    ctx.beginPath(); ctx.arc(-6, -3.5, 3.4, 0, 7); ctx.arc(6, -3.5, 3.4, 0, 7); ctx.stroke();
    if (v.kind === 'moto') { ctx.fillStyle = v.color; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(4, -7); ctx.lineTo(6, -4); ctx.lineTo(-4, -3); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(-4, -9, 6, 2); }
    else { ctx.strokeStyle = v.kind === 'rino' ? '#e0e0e0' : v.color; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-6, -3.5); ctx.lineTo(-1, -9); ctx.lineTo(5, -9); ctx.lineTo(6, -3.5); ctx.moveTo(-1, -9); ctx.lineTo(0, -3.5); ctx.lineTo(-6, -3.5); ctx.stroke(); }
    ctx.restore();
  } else {
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-0.9, -12, 1.8, 6); ctx.fillRect(-0.9, 2, 1.8, 6);
    ctx.fillStyle = v.kind === 'moto' ? v.color : '#888'; ctx.fillRect(-1.6, -7, 3.2, 10);
  }
  // rider
  if (v.riderLook) {
    const dir = d === DIR.N ? 1 : d === DIR.S ? 0 : d === DIR.W ? 2 : 3;
    const pedal = v.kind === 'moto' ? 'sit' : Math.floor(t * 8) % 4;
    const img = getFrame(v.riderLook, dir, pedal);
    ctx.drawImage(img, -CHAR_W / 2, -44 - 6, CHAR_W, CHAR_H);
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
    if (this.wait > 0) { this.wait -= dt; this.moving = false; return; }
    if (!this.target) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * this.home.r;
      this.target = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r * 0.7 };
    }
    const dx = this.target.x - this.x, dy = this.target.y - this.y, d = Math.hypot(dx, dy);
    if (d < 2) { this.target = null; this.wait = 1 + Math.random() * (this.kind === 'cow' ? 8 : 4); this.moving = false; return; }
    const vx = dx / d * this.speed, vy = dy / d * this.speed;
    const nx = this.x + vx * dt, ny = this.y + vy * dt;
    if (this.map.blocked(nx, ny, 5, 3)) { this.target = null; this.wait = 1; return; }
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
