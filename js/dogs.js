// The street dogs of Jiquilpan: some go around in packs, some alone; they nap in the shade, drink
// from the fountain and from the trays of water the shops leave out, beg at the mercado and the taco
// stands (and sometimes get a bone), and run from cars. Feed one and pet it often enough and it
// will follow you — and help you.
import { TILE, dist, pick } from './util.js';
import { Entity, findPath, drawBubble } from './entities.js';
import { drawDog } from './render/people.js';

const R = Math.random;
const COATS = [['#b5854f', null, false], ['#2b2b2b', '#e8e2d4', false], ['#d9c9a8', null, true], ['#8a5a34', '#2b2b2b', false], ['#c9a06a', null, true], ['#e8e2d4', '#8a5a34', true], ['#5a3e2a', null, false], ['#a87d52', '#f0e8d8', false]];
export const DOG_NAMES = ['Canelo', 'Firulais', 'Manchas', 'Chato', 'La Negra', 'Güera', 'Solovino', 'Pinto', 'Capitán', 'Chispa'];

// where dogs hang out in town (tile coordinates)
const SPOTS = {
  plaza: [[120, 108.6], [133, 99.6], [126, 94.6], [137, 108.6], [118, 111.4]],
  mercado: [[198, 111.6], [203, 111.6], [200, 83.2], [192, 111.6]],
  paz: [[160, 59.4], [182, 59.4], [171, 44.6]],
  portal: [[124, 114.8], [146, 114.8]],
  tacos: [[124, 84.8], [158.4, 59.6], [101.5, 30.4]],
};
const WATER = [[131.8, 110.6, 'fountain'], [198.2, 111.1, 'tray'], [148.6, 115.6, 'tray'], [107.6, 156.2, 'tray'], [244.2, 199.6, 'tray'], [171, 53.6, 'fountain']];

export class Dog extends Entity {
  constructor(map, x, y, opts = {}) {
    super(map, x, y);
    const coat = opts.coat || pick(R, COATS);
    this.color = coat[0]; this.spot = coat[1]; this.floppy = coat[2];
    this.dog = true; this.kind = 'dog'; this.solid = false; this.radius = 5;
    this.dir = 2; this.animT = R() * 5; this.state = 'idle'; this.timer = 1 + R() * 4;
    this.leader = opts.leader || null; this.offset = opts.offset || [0, 0];
    this.speed = 26; this.limp = !!opts.limp; this.companion = !!opts.companion; this.name = opts.name || null;
    this.def = { id: 'dog' + this.id, name: this.name || 'Perro callejero', crowd: true, dog: true };
    this.affinity = 0;
  }
  goTo(game, tx, ty, run) {
    const p = findPath(this.map, this.x / TILE, this.y / TILE, tx, ty, 2500);
    if (p && p.length > 1) { this.path = p; this.pathI = 1; this.running = !!run; return true; }
    return false;
  }
  update(dt, game) {
    this.animT += dt;
    if (this.bubbleT > 0) this.bubbleT -= dt;
    if (this.down) return;
    const p = game.player;
    // run from a car coming fast
    const car = game.driving;
    if (car && car.map === this.map && Math.abs(car.speed) > 15 && dist(car.x, car.y, this.x, this.y) < 60 && this.state !== 'flee') {
      const ax = this.x - car.x, ay = this.y - car.y, d = Math.hypot(ax, ay) || 1;
      this.state = 'flee'; this.timer = 1.4; this.path = null; this.fx = ax / d; this.fy = ay / d;
      if (R() < 0.5) { this.bubbleT = 1.2; this.bubbleText = '¡Guau!'; }
    }
    if (this.state === 'flee') {
      this.timer -= dt; this.move(this.fx * 70, this.fy * 70, dt);
      if (this.timer <= 0) this.state = 'idle';
      return;
    }
    if (this.companion) return this.followPlayer(dt, game);
    if (this.leader && !this.leader.dead && this.leader.map === this.map) {
      const L = this.leader;
      if (L.state === 'rest' || L.state === 'drink' || L.state === 'eat') { if (this.state !== L.state) { this.state = L.state === 'eat' ? 'beg' : L.state; } this.moving = false; return; }
      const tx = L.x + this.offset[0], ty = L.y + this.offset[1];
      const d = dist(tx, ty, this.x, this.y);
      if (d > 6) { this.state = 'walk'; const sp = d > 40 ? 60 : 30; this.move((tx - this.x) / d * sp, (ty - this.y) / d * sp, dt); }
      else { this.moving = false; this.state = 'idle'; }
      return;
    }
    // follow a path if we have one
    if (this.path) { this.followPath(dt); return; }
    this.timer -= dt;
    if (this.state === 'drink' || this.state === 'eat' || this.state === 'rest' || this.state === 'beg' || this.state === 'sit') { if (this.timer > 0) return; this.state = 'idle'; }
    if (this.timer > 0) { this.moving = false; return; }
    // pick something to do
    const h = game.clock.hour, rr = R();
    if (rr < 0.18) { this.state = 'rest'; this.timer = 10 + R() * 18; return; }
    if (rr < 0.36) { // thirsty: nearest water
      let best = null, bd = 1e9;
      for (const w of WATER) { const d = dist(w[0] * TILE, w[1] * TILE, this.x, this.y); if (d < bd) { bd = d; best = w; } }
      if (best && bd < 50 * TILE && this.goTo(game, best[0], best[1])) { this.onArrive = () => { this.state = 'drink'; this.timer = 4 + R() * 3; this.dir = this.x > best[0] * TILE ? 2 : 3; }; return; }
    }
    if (rr < 0.52) { // beg where there is food
      const list = h >= 7 && h < 17 ? SPOTS.mercado : h >= 19 || h < 1 ? SPOTS.tacos : SPOTS.portal;
      const [x, y] = pick(R, list);
      if (this.goTo(game, x + (R() - 0.5) * 2, y)) { this.onArrive = () => { this.state = 'beg'; this.timer = 8 + R() * 8; }; return; }
    }
    const area = pick(R, Object.values(SPOTS)), [x, y] = pick(R, area);
    if (dist(x * TILE, y * TILE, this.x, this.y) < 45 * TILE && this.goTo(game, x + (R() - 0.5) * 3, y + (R() - 0.5) * 2)) { this.onArrive = () => { this.state = R() < 0.5 ? 'sit' : 'idle'; this.timer = 3 + R() * 6; }; return; }
    this.timer = 2;
  }
  followPath(dt) {
    const p = this.path[this.pathI];
    if (!p) { this.path = null; const cb = this.onArrive; this.onArrive = null; cb?.(); this.moving = false; return; }
    const tx = p[0] * TILE + 8, ty = p[1] * TILE + 10, dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
    if (d < 2) { this.pathI++; return; }
    const sp = this.running ? 58 : this.limp ? 18 : 28;
    this.move(dx / d * sp, dy / d * sp, dt);
    this.state = 'walk';
  }
  move(vx, vy, dt) {
    const nx = this.x + vx * dt, ny = this.y + vy * dt;
    if (!this.map.blocked(nx, ny, 4, 2.5)) { this.x = nx; this.y = ny; }
    else if (!this.map.blocked(nx, this.y, 4, 2.5)) this.x = nx;
    else if (!this.map.blocked(this.x, ny, 4, 2.5)) this.y = ny;
    else { this.path = null; }
    this.moving = true;
    if (Math.abs(vx) > 0.5) this.dir = vx < 0 ? 2 : 3;
  }
  followPlayer(dt, game) {
    const p = game.player;
    if (p.map !== this.map) return;
    const target = game.driving ? game.driving : p;
    const d = dist(target.x, target.y, this.x, this.y);
    if (d > 260) { this.x = target.x + 18; this.y = target.y + 6; this.path = null; return; } // catches up
    // sniff out things on the ground nearby
    this.sniffT = (this.sniffT || 0) - dt;
    if (this.sniffT <= 0) {
      this.sniffT = 6;
      const it = (game.itemEntities || []).find(e => e.map === this.map && dist(e.x, e.y, this.x, this.y) < 7 * TILE);
      if (it) { this.bubbleT = 2.2; this.bubbleText = '¡Guau! ¡Guau!'; this.sniffing = it; game.sfx?.('bark'); }
      else this.sniffing = null;
    }
    if (this.sniffing && dist(this.sniffing.x, this.sniffing.y, this.x, this.y) > 10) {
      const s = this.sniffing, dd = dist(s.x, s.y, this.x, this.y);
      this.move((s.x - this.x) / dd * 40, (s.y - this.y) / dd * 40, dt); return;
    }
    if (d > 26) { const sp = d > 70 ? 70 : 42; this.move((target.x - 14 - this.x) / d * sp, (target.y + 4 - this.y) / d * sp, dt); this.state = 'walk'; }
    else { this.moving = false; this.state = p.moving ? 'idle' : (this.state === 'sit' ? 'sit' : (R() < 0.005 ? 'sit' : this.state === 'walk' ? 'idle' : this.state)); }
  }
  draw(ctx, game) {
    const t = game.clock.real;
    ctx.save(); ctx.translate(this.x, this.y);
    const pose = this.down ? 'lie' : this.state === 'rest' ? 'lie' : this.state === 'drink' ? 'drink' : this.state === 'eat' ? 'drink' : null;
    const fr = this.moving ? Math.floor(this.animT * (this.state === 'flee' || this.running ? 12 : 7)) % 4 : 'idle';
    drawDog(ctx, this.color, this.dir, fr, t + this.id, { pose, floppy: this.floppy, spot: this.spot, limp: this.limp, happy: this.happyT > 0 || this.companion || this.state === 'beg', pant: this.state === 'beg' || this.state === 'flee', collar: this.companion ? '#c0392b' : null, fed: this.affinity > 2 || this.companion });
    ctx.restore();
    if (this.happyT > 0) this.happyT -= game.clock.dt || 0.016;
    if (this.state === 'eat' && Math.floor(t * 3) % 2) { ctx.fillStyle = '#efe8d6'; ctx.fillRect(this.x + (this.dir === 2 ? -11 : 8), this.y - 3, 3, 1); }
    if (this.bubbleT > 0) drawBubble(ctx, this.x, this.y - 14, this.bubbleText || '¡Guau!');
    if (this.companion && this.name && game.player.map === this.map && dist(game.player.x, game.player.y, this.x, this.y) < 30) { ctx.font = '600 4px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(this.name, this.x, this.y - 13); }
  }
}

// Spawn the town's dogs: three small packs and a few loners.
export function spawnTownDogs(map, add) {
  const dogs = [];
  const pack = (x, y, n) => {
    const lead = new Dog(map, x * TILE, y * TILE);
    add(lead); dogs.push(lead);
    for (let i = 1; i < n; i++) { const d = new Dog(map, (x + i) * TILE, (y + 0.5) * TILE, { leader: lead, offset: [(i % 2 ? -1 : 1) * (8 + i * 5), 4 + i * 3] }); add(d); dogs.push(d); }
  };
  pack(198, 111.6, 3);   // the mercado pack
  pack(126, 109, 2);     // the plaza pair
  pack(171, 59.4, 3);    // Jardín de la Paz
  for (const [x, y, limp] of [[100, 157.6, false], [224, 158.4, false], [60, 111.6, true], [150.8, 30, false], [244, 200, false]]) { const d = new Dog(map, x * TILE, y * TILE, { limp }); add(d); dogs.push(d); }
  return dogs;
}

// Now and then, someone at the mercado or a taco stand gives a dog a bone or a piece of meat.
export function dogKindness(game, dogs) {
  const h = game.clock.hour;
  for (const d of dogs) {
    if (d.state !== 'beg' || d.fedToday === game.clock.dayIndex || R() > 0.02) continue;
    let giver = null;
    for (const n of game.npcs.named.values()) if (n.map === d.map && !n.talking && dist(n.x, n.y, d.x, d.y) < 5 * TILE) { giver = n; break; }
    if (!giver) continue;
    giver.bubble = { text: pick(R, h >= 19 || h < 2 ? ['Ahí te va, firulais.', 'Ten, una tortillita.', '¡Órale, cómetelo!'] : ['Ten, perrito, un huesito.', 'Ahí te va un pedacito de carne.', 'Ya, ya, ten. Pero no le digas a nadie.']), t: 3 };
    d.state = 'eat'; d.timer = 6; d.fedToday = game.clock.dayIndex; d.happyT = 6; d.affinity++;
    giver.face(d.x, d.y);
  }
}
