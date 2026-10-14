// Population manager: named NPCs on schedules, the crowd, traffic and animals.
import { TILE, dist, rng, pick, hash2 } from './util.js';
import { G, ROADS } from './world.js';
import { Person, Vehicle, Animal, Entity, findPath, RoadTruck, lanePath, nearestLane, COMBI_ROUTES } from './entities.js';
import { makeLook } from './render/people.js';
import { NAMED, MERCADO_VENDORS } from './data/npcs.js';
import { SPRITES } from './render/landmarks.js';
import { Dog, spawnTownDogs, dogKindness } from './dogs.js';

const R = Math.random;

// A non-moving prop owned by an NPC (e.g. a food cart) — y-sorted like any entity.
export class Prop extends Entity {
  constructor(map, x, y, spriteDef) {
    super(map, x, y);
    this.s = { ...spriteDef, x, y, w: spriteDef.w || 40, up: spriteDef.up || 50 };
    this.solid = true; this.radius = spriteDef.kind === 'carnitasTruck' ? 14 : 10;
  }
  draw(ctx, game) {
    const img = game.renderer.spriteImage(this.s);
    ctx.drawImage(img, this.x - img.w / 2, this.y - img.up, img.w, img.up + img.down);
    const def = SPRITES[this.s.kind];
    if (def && def.anim) { ctx.save(); ctx.translate(this.x, this.y); def.anim(ctx, this.s, game.clock.real, game.env.light < 0.45); ctx.restore(); }
  }
}

export class NPC extends Person {
  constructor(map, x, y, look, def) {
    super(map, x, y, look);
    this.def = def; this.name = def?.name || 'Vecino';
    this.path = null; this.pathI = 0; this.wait = 0; this.home = { x, y };
    this.behaviour = 'stand'; this.speed = 30 + R() * 10;
  }
  // Caught on something: step free, then plan a new way that avoids the tiles we could not get
  // through and whatever is standing in them (a cart, a parked car, the player, a cow). Someone who
  // keeps failing waits a moment like a real person would, and only ever jumps to their destination
  // when nobody is looking.
  recover(game) {
    this.stuck = 0; this.recoveries = (this.recoveries || 0) + 1;
    if (this.map.blocked(this.x, this.y, 4, 2.5)) this.unstick();
    const goal = this.path && this.path[this.path.length - 1];
    if (!goal) { this.path = null; return; }
    if (!game.onScreen(this.x, this.y, 30) && this.recoveries >= 2) { this.arriveAt(game, goal); return; }
    // crossing the street between cars stuck in traffic: squeeze through, like everybody does
    if ((game.hardBlockers || []).some(o => o instanceof Vehicle && !o.dead && Math.hypot(o.x - this.x, o.y - this.y) < (o.radius || 6) + 10)) {
      this.squeeze = 1.6; return;
    }
    const W = this.map.w, avoid = new Set();
    for (let k = this.pathI; k < Math.min(this.path.length - 1, this.pathI + 2); k++) avoid.add(this.path[k][1] * W + this.path[k][0]);
    for (const o of game.hardBlockers || []) {
      if (o === this || Math.hypot(o.x - this.x, o.y - this.y) > 48) continue;
      const r = Math.ceil(((o.radius || 4) + 4) / TILE);
      const ox = Math.floor(o.x / TILE), oy = Math.floor(o.y / TILE);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) avoid.add((oy + dy) * W + ox + dx);
    }
    avoid.delete(Math.floor(this.y / TILE) * W + Math.floor(this.x / TILE));
    const p = this.recoveries <= 5 && findPath(this.map, this.x / TILE, this.y / TILE, goal[0], goal[1], 6000, { avoid });
    if (p && p.length > 1) { this.path = p; this.pathI = 1; this.pause = this.recoveries > 2 ? 0.6 + R() * 0.8 : 0; return; }
    // no other way right now: wait a little and try again; after a while give up on this walk
    if (this.recoveries <= 5) { this.pause = 1 + R() * 1.5; return; }
    this.path = null; this.recoveries = 0;
    if (this.onArrive) this.onArrive(game);
  }
  arriveAt(game, goal) {
    this.x = goal[0] * TILE + 8; this.y = goal[1] * TILE + 10;
    if (this.map.blocked(this.x, this.y, 4, 2.5)) this.unstick();
    this.path = null; this.recoveries = 0; this.stuck = 0;
    if (this.onArrive) this.onArrive(game);
  }
  // Steer around hard obstacles (the player, carts, parked cars, animals) a little before reaching them.
  avoidHard(game, vx, vy) {
    const sp = Math.hypot(vx, vy); if (sp < 1) return [0, 0];
    const ux = vx / sp, uy = vy / sp;
    let ax = 0, ay = 0;
    for (const o of game.hardBlockers || []) {
      if (o === this || o.map !== this.map || o.hidden) continue;
      const dx = o.x - this.x, dy = o.y - this.y;
      const ahead = dx * ux + dy * uy;
      if (ahead <= 0 || ahead > 26) continue;
      const lat = -dx * uy + dy * ux, R0 = (o.radius || 4) + this.radius + 2;
      if (Math.abs(lat) > R0) continue;
      const side = lat >= 0 ? -1 : 1, f = (1 - ahead / 26) * (R0 - Math.abs(lat)) / R0;
      ax += -uy * side * f * sp * 1.6; ay += ux * side * f * sp * 1.6;
    }
    return [ax, ay];
  }
  // Repulsion from nearby walkers plus a sidestep to the right when someone is coming head-on.
  separation(game, vx, vy, range = 13) {
    let ax = 0, ay = 0;
    const list = game.people || game.entities;
    const sp = Math.hypot(vx, vy);
    for (const o of list) {
      if (o === this || o.map !== this.map || o.hidden || !(o instanceof Person) || o.down) continue;
      const dx = this.x - o.x, dy = (this.y - o.y) * 1.4, d2 = dx * dx + dy * dy;
      if (d2 > range * range || d2 < 0.01) { if (d2 < 0.01) { ax += (this.id % 2 ? 6 : -6); } continue; }
      const d = Math.sqrt(d2), f = (range - d) / range;
      ax += dx / d * f * 26; ay += dy / d * f * 18;
      if (sp > 1) { // head-on: both step to their right
        const ux = vx / sp, uy = vy / sp, ahead = -(dx * ux + dy * uy);
        if (ahead > 0 && ahead < range) { ax += -uy * f * 22; ay += ux * f * 22; }
      }
    }
    return [ax, ay];
  }
  // Hit by a car: lies on the ground until the ambulance takes them (see game.accidents).
  updateDown(dt, game) {
    this.pose = 'down'; this.moving = false;
    this.downT = (this.downT || 0) + dt;
  }
  update(dt, game) {
    this.updateAnim(dt);
    this.moving = false;
    if (this.down) { this.updateDown(dt, game); return; }
    if (this.talking) return;
    if (this.behaviour === 'sit') { this.pose = 'sit'; return; }
    if (this.behaviour === 'phone') { this.look.phone = true; }
    if (this.squeeze > 0) this.squeeze -= dt;
    if (this.path) {
      if (this.pause > 0) { this.pause -= dt; return; } // waiting for someone to get out of the way
      const p = this.path[this.pathI];
      if (!p) { this.path = null; this.recoveries = 0; this.onArrive?.(game); return; }
      const tx = p[0] * TILE + 8, ty = p[1] * TILE + 10;
      const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
      // a waypoint counts as reached when we are close, or when a crowd has nudged us past it
      const last = this.pathI >= this.path.length - 1;
      if (d < (last ? 2 : 5)) { this.pathI++; this.stuck = 0; this.bestD = null; this.recoveries = 0; return; }
      let vx = dx / d * this.speed, vy = dy / d * this.speed;
      // Steering: people keep a little personal space and pass each other on the right instead of
      // pushing into a knot. The player, vehicles, carts and animals are hard obstacles: we start
      // going round them before we bump into them.
      const [sx, sy] = this.separation(game, vx, vy);
      const [hx, hy] = this.avoidHard(game, vx, vy);
      // close to the waypoint the crowd matters less than getting there (no circling round a tile)
      const w = d < 10 ? 0.4 : 1;
      vx += (sx * w + hx); vy += (sy * w + hy);
      const sp = Math.hypot(vx, vy) || 1, cap = this.speed * 1.15;
      if (sp > cap) { vx *= cap / sp; vy *= cap / sp; }
      const others = game.hardBlockers || game.entities;
      const bx = this.x, by = this.y;
      this.tryMove(vx, vy, dt, others);
      // if steering made us fail, try the plain way to the waypoint
      if (this.x === bx && this.y === by) this.tryMove(dx / d * this.speed, dy / d * this.speed, dt, others);
      // stuck = not getting any closer to the waypoint for a while (a crowd can push us around, or we
      // can dither left and right of an obstacle, without getting anywhere)
      const d2 = Math.hypot(tx - this.x, ty - this.y);
      if (this.bestD == null || d2 < this.bestD - 2) { this.bestD = d2; this.stuck = 0; }
      else {
        this.stuck = (this.stuck || 0) + dt;
        // close enough to where we were going and something is in the way: we have arrived
        if (last && d2 < 12 && this.stuck > 0.4) { this.path = null; this.stuck = 0; this.bestD = null; this.recoveries = 0; this.onArrive?.(game); return; }
        if (this.stuck > 1.2) { this.bestD = null; this.recover(game); }
      }
      this.moving = Math.hypot(this.x - bx, this.y - by) > 0.05; this.setDirFromVec(vx, vy);
      return;
    }
    if ((this.behaviour === 'wander' || this.behaviour === 'walk') && this.map.blocked(this.x, this.y, 4, 2.5)) this.unstick(); // never stand inside a bush
    // never stand around in the street: cars stop for you and you wait for them, and nobody moves
    if (this.map.outdoor && !this.def?.fixed && this.behaviour !== 'vend' && this.behaviour !== 'dance' && this.behaviour !== 'sit' && ROADS.has(this.map.get(Math.floor(this.x / TILE), Math.floor(this.y / TILE)))) {
      this.offRoadT = (this.offRoadT || 0) - dt;
      if (this.offRoadT <= 0) {
        this.offRoadT = 1.5;
        const cx = Math.floor(this.x / TILE), cy = Math.floor(this.y / TILE);
        let best = null;
        for (let r = 1; r <= 5 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r; dx++) {
          const x = cx + dx, y = cy + dy;
          if (!this.map.inb(x, y) || this.map.isSolidTile(x, y) || ROADS.has(this.map.get(x, y)) || this.map.colBlock[y * this.map.w + x]) continue;
          best = [x, y]; break;
        }
        const p = best && findPath(this.map, this.x / TILE, this.y / TILE, best[0], best[1], 400);
        if (p && p.length > 1) { this.path = p; this.pathI = 1; const prev = this.onArrive; this.onArrive = (g) => { this.home = { x: this.x, y: this.y }; this.onArrive = prev; }; return; }
      }
    }
    // standing too close to someone else: drift apart a little (no more balls of people)
    if (!this.def?.fixed && this.behaviour !== 'vend' && this.behaviour !== 'sit') {
      const [sx, sy] = this.separation(game, 0, 0, 10);
      if (Math.abs(sx) + Math.abs(sy) > 4) { this.tryMove(sx * 0.5, sy * 0.5, dt, game.hardBlockers); this.home = { x: this.x, y: this.y }; }
    }
    if (this.behaviour === 'haul') { // carry things back and forth between two spots (moving tinacos, sweeping)
      this.wait -= dt;
      if (this.wait > 0) return;
      const sc = this.sched || {};
      const a = this.home, b = sc.to ? { x: sc.to[0] * TILE + 8, y: sc.to[1] * TILE + 10 } : this.home;
      this.leg = !this.leg;
      const tgt = this.leg ? b : a;
      this.look.holds = this.leg ? (sc.carry || null) : (sc.carry === 'broom' ? 'broom' : null);
      const path = findPath(this.map, this.x / TILE, this.y / TILE, tgt.x / TILE, tgt.y / TILE, 600);
      if (path && path.length > 1) { this.path = path; this.pathI = 1; this.onArrive = () => { this.wait = 2.5 + R() * 4; this.dir = sc.dir ?? 0; if (this.look.holds === 'tinaco') this.look.holds = null; }; }
      else this.wait = 3;
      return;
    }
    if (this.behaviour === 'dance') { this.pose = 'dance'; return; }
    if (this.behaviour === 'wander') {
      this.wait -= dt;
      if (this.wait <= 0) {
        const r = (this.wanderR || 3) * TILE;
        let tx = this.home.x + (R() - 0.5) * 2 * r, ty = this.home.y + (R() - 0.5) * 2 * r;
        if (this.map.blocked(tx, ty, 5, 4) || (this.map.outdoor && ROADS.has(this.map.get(Math.floor(tx / TILE), Math.floor(ty / TILE))))) { tx = this.home.x; ty = this.home.y; }
        const path = findPath(this.map, this.x / TILE, this.y / TILE, tx / TILE, ty / TILE, 400);
        if (path && path.length < 16) { this.path = path; this.pathI = 1; }
        this.wait = 2 + R() * 5;
      }
      return;
    }
    // standing: look around now and then
    this.wait -= dt;
    if (this.wait <= 0 && this.behaviour !== 'vend') { this.dir = pick(R, [0, 0, 2, 3, this.baseDir ?? 0]); this.wait = 3 + R() * 6; }
    if (this.behaviour === 'vend' && this.wait <= 0) { this.dir = R() < 0.7 ? (this.baseDir ?? 0) : pick(R, [2, 3]); this.wait = 2 + R() * 5; }
  }
}

// Crowd outfits by purpose
const CROWD = {
  exercise: (seed) => makeLook(seed, { top: pick(rng(seed), ['tshirt', 'jersey', 'hoodie']), bottom: 'shorts', shoes: 'sneakers', hat: null, rebozo: null, age: pick(rng(seed + 1), ['adult', 'adult', 'teen', 'elder']) }),
  office: (seed) => makeLook(seed, { uniform: 'office', topColor: pick(rng(seed), ['#f5f5f5', '#dfe6e9', '#f7c6d9', '#a9d6f2']), age: 'adult', hat: null }),
  church: (seed) => { const r = rng(seed); const f = r() < 0.55; return makeLook(seed, { female: f, age: pick(r, ['adult', 'elder', 'elder', 'kid']), top: f ? pick(r, ['bordado', 'blouse']) : pick(r, ['shirt', 'guayabera']), bottom: f ? 'longskirt' : 'pants', shoes: 'shoes', rebozo: f && r() < 0.6 ? pick(r, ['#5b3f7a', '#2f5d7a', '#1d1d1f']) : null }); },
  student: (seed) => makeLook(seed, { age: pick(rng(seed), ['kid', 'teen']), backpack: true, top: 'polo', topColor: pick(rng(seed), ['#f5f5f5', '#dfe6e9']), bottomColor: '#1f2d4a' }),
  shopper: (seed) => makeLook(seed, { holds: 'bag' }),
  stroll: (seed) => makeLook(seed, {}),
  drinker: (seed) => makeLook(seed, { age: 'adult', holds: 'michelada', hat: pick(rng(seed), ['cap', null, 'texana']), top: pick(rng(seed + 2), ['tshirt', 'jersey', 'plaid', 'shirt']) }),
  worker: (seed) => makeLook(seed, { age: 'adult', top: pick(rng(seed), ['tshirt', 'plaid']), hat: pick(rng(seed + 3), ['cap', 'sombrero', null]), holds: pick(rng(seed + 4), [null, 'broom', 'bag']) }),
};

const POIS = {
  plaza: [[120, 101.5], [126, 106.4], [131, 101.5], [122, 107.5], [118.5, 102], [136.5, 108.8], [126, 94.4]],
  portal: [[118, 114.6], [124, 114.6], [130, 114.6], [136, 114.6], [144, 114.6]],
  mercado: [[200, 110.6], [200, 83.4]],
  palacio: [[170, 106.5], [163, 107]],
  santuario: [[64, 136.5]], sanfrancisco: [[195, 146], [200, 152]], monjas: [[86, 103]],
  bosque: [[60, 252.6], [110, 252.6], [175, 252.6], [230, 252.6], [194, 254.5]],
  juarez: [[55, 46], [55.5, 52], [54.5, 58], [50, 63], [172, 230], [168, 238]],
  paz: [[171, 51], [163, 52], [179, 52], [165, 45.2]],
  escuela: [[132, 157], [124, 157]],
  entrada: [[284, 171.6], [268, 172], [292, 171.6]],
  palmas: [[104, 28.5], [120, 22.3], [80, 38.6], [134, 16.6]],
  micheladas: [[86.5, 61.2], [163.5, 141.8], [244.5, 142], [244.5, 173], [143.5, 249.6]],
  tianguis_sab: [[189.3, 90], [189.3, 95], [200, 226.2], [230, 226.2], [175, 226.2]],
  estadio: [[170, 194.6], [180, 210], [190, 205]],
};

export class NPCManager {
  constructor(game) {
    this.game = game;
    this.named = new Map(); // def.id -> NPC
    this.props = new Map();
    this.crowd = [];
    this.vehicles = [];
    this.animals = [];
    this.timer = 0; this.crowdTimer = 0; this.trafficTimer = 0;
    this.seed = 1000;
    this.defs = NAMED.slice();
    for (const v of MERCADO_VENDORS) this.defs.push({ ...v, sched: [{ h: [7, 18], map: 'mercado', at: v.at, act: 'vend', dir: 0 }], look: v.look });
  }
  namedPresent() { return [...this.named.values()].map(n => n.def.name); }

  scheduleFor(def) {
    const g = this.game;
    const act = g.state.act, era = g.state.era;
    if (def.acts && !def.acts.includes(act)) return null;
    if (def.eras && !def.eras.includes(era)) return null;
    if (g.quests.hideNPC(def.id)) return null;
    if (def.when && !def.when(g)) return null;
    if (g.state.injured && g.state.injured[def.id] > g.clock.dayIndex) return null; // in the hospital
    const h = g.clock.hour, d = g.clock.weekday;
    for (const s of def.sched || []) {
      if (s.acts && !s.acts.includes(act)) continue;
      if (s.d && !s.d.includes(d)) continue;
      if (s.when && !s.when(g)) continue;
      if (h < s.h[0] || h >= s.h[1]) continue;
      return s;
    }
    return null;
  }

  update(dt) {
    const g = this.game;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = 1; this.syncNamed(); this.refreshObstacles(); }
    this.crowdTimer -= dt;
    if (this.crowdTimer <= 0) { this.crowdTimer = 1.5; this.syncCrowd(); this.syncAnimals(); }
    this.trafficTimer -= dt;
    if (this.trafficTimer <= 0) { this.trafficTimer = 1.2; this.syncTraffic(); }
    for (const n of this.named.values()) if (n.map === g.map) n.update(dt, g);
    for (const c of this.crowd) {
      if (c.map !== g.map) continue;
      c.update(dt, g);
      if (c.rewalkAt && g.clock.real > c.rewalkAt && !c.path && !c.talking) {
        c.rewalkAt = null;
        if (R() < 0.6) { const [qx, qy] = this.freeSpot(c.map, pick(R, c.rewalkPois)); const p2 = findPath(c.map, c.x / TILE, c.y / TILE, qx, qy); if (p2) { c.path = p2; c.pathI = 1; c.behaviour = 'walk'; } }
      }
    }
    for (const v of this.vehicles) {
      v.update(dt, g);
      if (v.route && v.parked && !v.dead) { // a combi at its stop: shout the route, then go on
        v.waitStop = (v.waitStop ?? 5) - dt;
        if (!v.bubble && v.waitStop > 3.5) v.bubble = { text: '¡' + COMBI_ROUTES[v.route].text.replace(' · ', ', ') + '!', t: 2.5 };
        if (v.waitStop <= 0) { v.waitStop = null; v.stopI = (v.stopI + 1) % g.map.combiRoutes[v.route].length; this.planCombi(v); }
      }
      if (v.bubble) { v.bubble.t -= dt; if (v.bubble.t <= 0) v.bubble = null; }
    }
    for (const a of this.animals) if (a.map === g.map) a.update(dt, g);
    this.kindT = (this.kindT || 0) - dt;
    if (this.kindT <= 0) { this.kindT = 2; dogKindness(g, this.dogs || []); this.syncCompanion(); }
    this.vehicles = this.vehicles.filter(v => !v.dead || this.remove(v));
  }
  // Carts, food trucks and parked cars are routed around; people standing still make a tile costlier
  // to walk through, so walkers go round a group instead of through it.
  refreshObstacles() {
    const g = this.game, map = g.map;
    if (!map.dynBlock) return;
    const boxes = [];
    for (const e of g.entities) {
      if (e.map !== map || e.hidden || !e.solid) continue;
      if (e instanceof Prop || (e instanceof Vehicle && e.parked) || e === g.car) {
        const r = e.radius || 10;
        boxes.push({ x0: e.x - r, y0: e.y - r * 0.6, x1: e.x + r, y1: e.y + r * 0.4 });
      }
    }
    map.setDynamic(boxes);
    map.occ.fill(0);
    for (const e of g.people || []) {
      if (e.path || e.moving || e === g.player) continue;
      const tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE);
      if (map.inb(tx, ty)) map.occ[ty * map.w + tx] = 1;
    }
  }
  remove(e) { const i = this.game.entities.indexOf(e); if (i >= 0) this.game.entities.splice(i, 1); return false; }
  add(e) { this.game.entities.push(e); return e; }

  lookFor(def) {
    if (!def._look) {
      def._look = makeLook(2000 + [...def.id].reduce((a, c) => a + c.charCodeAt(0), 0), def.look || {});
    }
    return def._look;
  }

  syncNamed() {
    const g = this.game;
    for (const def of this.defs) {
      const s = this.scheduleFor(def);
      let npc = this.named.get(def.id);
      if (!s) { if (npc && !npc.talking) { this.remove(npc); this.named.delete(def.id); this.dropProp(def.id); } continue; }
      const map = g.getMap(s.map, true);
      if (!map) continue;
      const tx = s.at[0] * TILE, ty = s.at[1] * TILE;
      const look = this.lookFor(def);
      look.phone = s.act === 'phone' || !!def.look?.phone || (g.state.era === 'after' && def.phoneAfter);
      if (!npc) {
        npc = new NPC(map, tx, ty, look, def);
        npc.behaviour = s.act; npc.baseDir = s.dir ?? 0; npc.dir = s.dir ?? 0; npc.wanderR = s.r;
        npc.sched = s;
        this.named.set(def.id, npc); this.add(npc);
      } else if (npc.sched !== s && !npc.talking) {
        npc.sched = s; npc.behaviour = s.act; npc.baseDir = s.dir ?? 0; npc.wanderR = s.r; npc.pose = null;
        const visible = npc.map === g.map && g.onScreen(npc.x, npc.y) && map === npc.map;
        if (visible && dist(npc.x, npc.y, tx, ty) < 30 * TILE) {
          const path = findPath(map, npc.x / TILE, npc.y / TILE, s.at[0], s.at[1]);
          if (path) { npc.path = path; npc.pathI = 1; npc.onArrive = () => { npc.dir = s.dir ?? 0; }; }
          else { npc.map = map; npc.x = tx; npc.y = ty; }
        } else { npc.map = map; npc.x = tx; npc.y = ty; npc.path = null; npc.dir = s.dir ?? 0; }
        npc.home = { x: tx, y: ty };
        this.dropProp(def.id);
      }
      npc.marker = g.quests.markerFor(def.id);
      if (s.prop && !this.props.has(def.id)) {
        const kind = s.prop.sprite || (s.prop.kind === 'carnitasTruck' ? 'carnitasTruck' : 'cart');
        const p = new Prop(map, tx + (s.prop.dx || 0) * TILE, ty + (s.prop.dy || 0) * TILE,
          { kind, w: kind === 'carnitasTruck' ? 60 : kind === 'tacoStand' ? 48 : 40, up: 56, color: s.prop.color, sign: s.prop.sign, umbrella: s.prop.umbrella, cart: s.prop.cartKind, tarp: s.prop.tarp });
        p.owner = npc; npc.prop = p;
        this.props.set(def.id, p); this.add(p);
      }
    }
  }
  dropProp(id) { const p = this.props.get(id); if (p) { this.remove(p); this.props.delete(id); } }

  // ---- crowd ------------------------------------------------------------
  crowdPlan() {
    const g = this.game, h = g.clock.hour, d = g.clock.weekday, after = g.state.era === 'after';
    const plan = [];
    const add = (type, n, pois) => plan.push({ type, n, pois });
    if (h >= 5.8 && h < 9.5) { add('exercise', 6, [...POIS.bosque, ...POIS.juarez, ...POIS.palmas]); }
    if (d >= 1 && d <= 5 && h >= 7.3 && h < 8.8) add('office', 6, POIS.palacio);
    if (d >= 1 && d <= 5 && ((h >= 7 && h < 8) || (h >= 13.3 && h < 14.5))) add('student', 6, [...POIS.escuela, ...POIS.plaza]);
    if (d === 0 && h >= 8 && h < 13) add('church', 12, [...POIS.santuario, ...POIS.sanfrancisco, ...POIS.monjas, ...POIS.plaza]);
    if (h >= 9 && h < 15) add('shopper', 7, [...POIS.mercado, ...POIS.plaza, ...POIS.paz]);
    if (h >= 9 && h < 18) add('worker', 4, [...POIS.plaza, ...POIS.mercado, ...POIS.palmas, ...POIS.entrada]);
    if (h >= 13 && h < 23.5) add('drinker', (d === 5 || d === 6) ? 8 : 4, POIS.micheladas);
    let strollers = h >= 17 && h < 22.5 ? 10 : h >= 11 && h < 17 ? 5 : h >= 22.5 || h < 1 ? 2 : 1;
    if (d === 5 && h >= 17) strollers += 16; // Friday nights: the plaza fills up
    if (d === 6 && h >= 17) strollers += 8;
    if (d === 5 && h >= 9 && h < 15) add('shopper', 8, POIS.paz);           // Friday tianguis
    if (d === 6 && h >= 8 && h < 15) add('shopper', 10, POIS.tianguis_sab); // Saturday tianguis
    if (h >= 16 && h < 20.5) add('exercise', d === 0 ? 4 : 6, POIS.estadio);  // basketball & baseball in the stadium
    if (after) strollers = Math.round(strollers * 0.5);
    if (g.env.rainAmt > 0.4) { strollers = Math.round(strollers * 0.3); for (const p of plan) p.n = Math.round(p.n * 0.4); }
    add('stroll', strollers, [...POIS.plaza, ...POIS.plaza, ...POIS.portal, ...POIS.paz]);
    return plan;
  }
  syncCrowd() {
    const g = this.game;
    const map = g.map;
    // despawn far or wrong-map walkers
    this.crowd = this.crowd.filter(c => {
      const far = c.map !== map || dist(c.x, c.y, g.player.x, g.player.y) > 40 * TILE || c.expire < g.clock.minutes;
      if (far && !c.talking && !c.down) { this.remove(c); return false; }
      return true;
    });
    if (map.residents) { this.syncResidents(map); return; }
    if (map.id !== 'town') return;
    this.syncDancers();
    const plan = this.crowdPlan();
    for (const p of plan) {
      const have = this.crowd.filter(c => c.ctype === p.type).length;
      // only spawn if some destination is reasonably near the player
      const near = p.pois.filter(([x, y]) => dist(x * TILE, y * TILE, g.player.x, g.player.y) < 34 * TILE);
      const want = near.length ? p.n : Math.ceil(p.n / 4);
      for (let i = have; i < want && i < have + 2; i++) this.spawnWalker(p.type, near.length ? near : p.pois);
    }
  }
  spawnWalker(type, pois) {
    const g = this.game, map = g.map;
    // find a walkable spot off-screen but within ~22 tiles of the player
    for (let tries = 0; tries < 12; tries++) {
      const a = R() * Math.PI * 2, d = (13 + R() * 9) * TILE;
      const x = g.player.x + Math.cos(a) * d, y = g.player.y + Math.sin(a) * d * 0.8;
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      const gnd = map.get(tx, ty);
      if (map.isSolidTile(tx, ty) || ROADS.has(gnd) || map.blocked(tx * TILE + 8, ty * TILE + 10, 5, 4)) continue;
      if (g.onScreen(x, y, 20)) continue;
      const seed = this.seed++;
      const look = (CROWD[type] || CROWD.stroll)(seed);
      if (g.state.era === 'after' && R() < 0.6) look.phone = true;
      else if (look.age === 'teen' && R() < 0.4) look.phone = true;
      const npc = new NPC(map, tx * TILE + 8, ty * TILE + 10, look, { id: 'crowd' + seed, name: this.crowdName(look), role: this.crowdRole(type), persona: this.crowdPersona(type, look), crowd: true });
      npc.ctype = type; npc.behaviour = 'walk';
      npc.expire = g.clock.minutes + 60 + R() * 120;
      const [px, py] = this.freeSpot(map, pick(R, pois));
      const path = findPath(map, tx, ty, px, py);
      if (!path) continue;
      npc.path = path; npc.pathI = 1;
      if (type === 'drinker') { npc.onArrive = () => { npc.behaviour = 'stand'; npc.dir = 0; npc.home = { x: npc.x, y: npc.y }; }; this.crowd.push(npc); this.add(npc); return npc; }
      // after a while there, most people stroll on to somewhere else (in game time, so a paused game stays paused)
      npc.onArrive = () => { npc.behaviour = R() < 0.5 ? 'stand' : 'wander'; npc.home = { x: npc.x, y: npc.y }; npc.wanderR = 3; npc.wait = 2; npc.rewalkAt = g.clock.real + 15 + R() * 30; npc.rewalkPois = pois; };
      this.crowd.push(npc); this.add(npc);
      return npc;
    }
    return null;
  }
  pathFor(npc, tx, ty) { return findPath(npc.map, npc.x / TILE, npc.y / TILE, tx, ty, 3000); }
  // La Danza de los Negritos: Sunday noon in the plaza, and every day of the December–January fiestas.
  syncDancers() {
    const g = this.game, h = g.clock.hour, d = g.clock.weekday, mo = g.clock.month, day = g.clock.date.getUTCDate();
    const fiesta = (mo === 11 && day >= 12) || (mo === 0 && day <= 12);
    const on = (d === 0 && h >= 11 && h < 14) || (fiesta && h >= 10 && h < 20);
    const have = this.crowd.filter(c => c.ctype === 'negrito');
    if (!on) { for (const c of have) { if (!c.talking) { this.remove(c); c.expire = -1; } } this.crowd = this.crowd.filter(c => c.ctype !== 'negrito' || c.talking); return; }
    if (have.length || dist(g.player.x, g.player.y, 126 * TILE, 106 * TILE) > 30 * TILE) return;
    const spots = [[123, 105.4], [124.8, 105.4], [126.6, 105.4], [128.4, 105.4], [123, 107.2], [124.8, 107.2], [126.6, 107.2], [128.4, 107.2]];
    spots.forEach(([x, y], i) => {
      const cuerita = i === 4;
      const look = makeLook(7000 + i * 17, { uniform: cuerita ? 'cuerita' : 'negrito', female: cuerita, age: i === 7 ? 'teen' : 'adult', holds: i % 3 === 0 ? 'toro' : null });
      const npc = new NPC(g.map, x * TILE, y * TILE, look, { id: 'negrito' + i, name: cuerita ? 'La Cuerita' : 'Negrito', role: 'Danza de los Negritos', crowd: true, fixed: true,
        persona: 'Uno de los danzantes de la Danza de los Negritos de Jiquilpan: máscara negra con rasgos blancos, corona de flores de nochebuena, mascada blanca pintada con flores y cuera de gamuza con flecos. Bailan para el Niño Dios en las fiestas de diciembre y enero; algunos alzan un torito de madera. Habla poco mientras baila, con orgullo de la tradición que heredó de su abuelo.' });
      npc.ctype = 'negrito'; npc.behaviour = 'dance'; npc.phase = i % 2; npc.expire = g.clock.minutes + 600; npc.dir = 0;
      this.crowd.push(npc); this.add(npc);
    });
    if (!this.dancersTold || this.dancersTold !== g.clock.dayIndex) { this.dancersTold = g.clock.dayIndex; g.ui?.toast('En la plaza bailan los Negritos: máscaras negras, coronas de nochebuena y cueras con flecos.', 'good'); }
  }
  // A walkable spot near a point of interest that nobody else is standing on or heading to.
  freeSpot(map, [px, py]) {
    const g = this.game;
    for (let k = 0; k < 14; k++) {
      const x = px + (R() - 0.5) * (4 + k * 0.6), y = py + (R() - 0.5) * (3 + k * 0.4);
      if (map.isSolidTile(Math.floor(x), Math.floor(y)) || map.blocked(x * TILE, y * TILE, 5, 4)) continue;
      if (ROADS.has(map.get(Math.floor(x), Math.floor(y)))) continue;
      let taken = false;
      for (const c of this.crowd.concat([...this.named.values()])) {
        const gx = c.path ? c.path[c.path.length - 1] : null;
        const cx = gx ? gx[0] + 0.5 : c.x / TILE, cy = gx ? gx[1] + 0.5 : c.y / TILE;
        if (Math.abs(cx - x) < 1.6 && Math.abs(cy - y) < 1.2) { taken = true; break; }
      }
      if (!taken) return [x, y];
    }
    return [px + (R() - 0.5) * 3, py + (R() - 0.5) * 2];
  }
  // The family at home (or the shopkeeper) in the generic houses and shops of town.
  syncResidents(map) {
    const g = this.game, res = map.residents;
    if (this.crowd.some(c => c.map === map)) return;
    const h = g.clock.hour;
    if (!res.shopkeeper && (h < 6.5 || h >= 23)) return; // everybody is asleep
    const r = rng(res.seed * 7 + 3);
    const FIRST_F = ['Doña Chayo', 'Lupita', 'Doña Mago', 'Rocío', 'Doña Chelo', 'Ximena', 'Doña Licha', 'Paty', 'Doña Tina', 'Fer'];
    const FIRST_M = ['Don Chuy', 'Toñito', 'Don Pancho', 'Iván', 'Don Goyo', 'Beto', 'Don Chencho', 'Emilio', 'Don Rigo', 'Santi'];
    const n = res.shopkeeper ? 1 : res.n;
    for (let i = 0; i < n; i++) {
      const female = r() < 0.55, age = res.shopkeeper ? 'adult' : pick(r, ['elder', 'adult', 'adult', 'teen', 'kid']);
      const look = makeLook(res.seed * 13 + i * 7, { female, age, apron: res.shopkeeper || (female && age !== 'kid' && r() < 0.3) });
      if (g.state.era === 'after' && age !== 'elder' && r() < 0.6) look.phone = true;
      const first = age === 'kid' ? pick(r, ['Dany', 'Mateo', 'Camila', 'Regina', 'Leo', 'Axel']) : pick(r, female ? FIRST_F : FIRST_M);
      const name = res.shopkeeper ? first : `${first} ${res.surname}`;
      const role = res.shopkeeper ? `atiende la ${res.sign.toLowerCase()}` : `de la familia ${res.surname}`;
      const persona = `${female ? 'Una mujer' : 'Un hombre'} de Jiquilpan (${age === 'kid' ? 'niño' : age === 'teen' ? 'joven' : age === 'elder' ? 'persona mayor' : 'adulto'}), ${res.shopkeeper ? `que atiende su negocio (${res.sign.toLowerCase()})` : `de la familia ${res.surname}, en su propia casa, recibiendo una visita inesperada`}. Amable pero curioso de por qué entraste.`;
      let x, y;
      if (res.shopkeeper) { x = 7 * TILE; y = 4.3 * TILE; }
      else {
        for (let k = 0; k < 20; k++) { x = (2 + r() * (map.w - 4)) * TILE; y = (4 + r() * (map.h - 6)) * TILE; if (!map.blocked(x, y, 5, 4)) break; }
      }
      const npc = new NPC(map, x, y, look, { id: 'res' + res.seed + '_' + i, name, role, persona, crowd: true, resident: true });
      npc.behaviour = res.shopkeeper ? 'stand' : pick(r, ['stand', 'wander', 'sit']);
      if (npc.behaviour === 'sit' && age !== 'elder') npc.behaviour = 'stand';
      npc.wanderR = 2; npc.expire = g.clock.minutes + 600; npc.ctype = 'resident';
      this.crowd.push(npc); this.add(npc);
    }
  }
  crowdName(look) {
    const r = R;
    const f = ['Doña Chayito', 'Marisol', 'Lucía', 'Doña Mago', 'Ximena', 'Paola', 'Doña Tina', 'Rocío', 'Fátima', 'Doña Licha', 'Valeria', 'Guadalupe', 'Itzel', 'Doña Chelo', 'Ana Karen'];
    const m = ['Don Jacinto', 'Toñito', 'El Güicho', 'Don Pancho', 'Iván', 'Kevin', 'Don Rigo', 'El Chuy', 'Alan', 'Don Beto', 'Emilio', 'Don Chencho', 'Jonathan', 'El Flaco', 'Don Goyo'];
    const kids = ['Santi', 'Dany', 'Mateo', 'Camila', 'Regina', 'Fernanda', 'Leo', 'Axel'];
    if (look.age === 'kid') return pick(r, kids);
    return pick(r, look.female ? f : m);
  }
  crowdRole(type) {
    return { drinker: 'se toma una michelada', exercise: 'sale a hacer ejercicio', office: 'trabaja en el Ayuntamiento', church: 'viene de misa', student: 'estudiante', shopper: 'anda de compras', stroll: 'vecino del centro', worker: 'trabajador' }[type] || 'vecino';
  }
  crowdPersona(type, look) {
    const age = { kid: 'un niño de 9 años', teen: 'un joven de 17 años', adult: 'un adulto de unos 40 años', elder: 'una persona mayor de más de 70 años' }[look.age] || 'un vecino';
    const what = { drinker: 'que está tomando micheladas con sus amigos afuera del puesto, platicador y alegre', exercise: 'que sale a correr o caminar por las mañanas al bosque', office: 'que trabaja en el Ayuntamiento y va con prisa', church: 'que viene de misa, muy arreglado', student: 'que va o viene de la escuela', shopper: 'que anda haciendo el mandado en el mercado o el tianguis', stroll: 'que pasea por la plaza', worker: 'que anda trabajando en la calle' }[type];
    return `${look.female ? (look.age === 'kid' ? 'Una niña' : 'Una mujer') : 'Un hombre'}, ${age}, de Jiquilpan, ${what}. ${look.phone ? 'Está algo distraído con su celular.' : ''}`;
  }

  // ---- traffic ------------------------------------------------------------
  syncTraffic() {
    const g = this.game, map = g.map;
    for (const v of this.vehicles) {
      if (v.map !== map || (!v.emergency && dist(v.x, v.y, g.player.x, g.player.y) > 34 * TILE)) { v.dead = true; }
    }
    if (map.id === 'cerro') { // no cars on the stone path; only in the pueblito, which they reach by the back road
      if (g.player.y > 80 * TILE && g.player.y < 112 * TILE && this.vehicles.filter(v => !v.dead).length < 1 && Math.random() < 0.05) this.spawnVehicle(pick(R, ['pickup', 'car', 'moto']), false);
      return;
    }
    if (map.id !== 'town' || !map.laneDir) return;
    const h = g.clock.hour;
    if (h >= 6 && h < 22) this.syncCombis();
    let target = h < 6 ? 2 : h < 8 ? 6 : h < 21 ? 9 : h < 23 ? 6 : 3;
    // cruising cars in the bosque at night
    const nearBosque = g.player.y > 190 * TILE;
    if (nearBosque && (h >= 19 || h < 1)) target += 5;
    const alive = this.vehicles.filter(v => !v.dead && !v.emergency).length;
    if (alive >= target) return;
    // Los Rinos: weekend mornings, a convoy of cyclists
    const d = g.clock.weekday;
    if (!this.rinosOut && (((d === 0 || d === 6) && h >= 7 && h < 11 && R() < 0.5) || (h >= 6 && h < 8 && R() < 0.08))) { this.spawnRinos(); return; }
    if (h >= 13 && h < 17 && !this.vehicles.some(v => v.delivery && !v.dead) && R() < 0.25) { // La Chata delivering buckets of beer
      const at = this.findLaneTile(false);
      if (at) { const v = new Vehicle(map, at[0], at[1], 'moto', this.seed++); v.color = '#c0392b'; v.basket = true; v.delivery = true; v.riderLook = this.lookFor(this.defs.find(d => d.id === 'chata')); v.fleet = this.vehicles; this.vehicles.push(v); this.add(v); v.bubble = { text: '¡Cubetazo a domicilio!', t: 3 }; return; }
    }
    const kind = pick(R, ['car', 'car', 'car', 'car', 'taxi', 'taxi', 'pickup', 'moto', 'moto', 'moto', 'bici', 'bici']);
    this.spawnVehicle(kind, nearBosque && (h >= 19 || h < 1));
  }
  // One combi per route around you, driving from stop to stop.
  syncCombis() {
    const g = this.game, map = g.map;
    for (const [route, stops] of Object.entries(map.combiRoutes || {})) {
      if (this.vehicles.some(v => !v.dead && v.route === route)) continue;
      if (R() > 0.3) continue;
      const near = stops.map((st, i) => [st, i]).filter(([st]) => dist(st[0] * TILE, st[1] * TILE, g.player.x, g.player.y) < 28 * TILE);
      if (!near.length) continue;
      const at = this.findLaneTile(false);
      if (!at) continue;
      const v = new Vehicle(map, at[0], at[1], 'combi', this.seed++);
      v.setRoute(route); v.stopI = pick(R, near)[1];
      v.fleet = this.vehicles; this.vehicles.push(v); this.add(v);
      this.planCombi(v);
    }
  }
  planCombi(v) {
    const map = v.map, stops = map.combiRoutes[v.route];
    for (let k = 0; k < stops.length; k++) {
      const st = stops[v.stopI], goal = nearestLane(map, st[0], st[1], 4);
      const plan = goal && lanePath(map, v.tx, v.ty, goal[0], goal[1], 1);
      if (plan && plan.length > 1) { v.plan = plan; v.planI = 0; v.parked = false; v.dir = null; v.onArrive = () => { v.waitStop = 5; }; v.pickDir(); return; }
      v.stopI = (v.stopI + 1) % stops.length;
    }
    v.plan = null; v.parked = false; v.pickDir();
  }
  findLaneTile(preferBosque) {
    const g = this.game, map = g.map;
    for (let tries = 0; tries < 30; tries++) {
      const a = R() * Math.PI * 2, d = (12 + R() * 12) * TILE;
      const x = Math.floor((g.player.x + Math.cos(a) * d) / TILE), y = Math.floor((g.player.y + Math.sin(a) * d * 0.8) / TILE);
      if (preferBosque && y < 204) continue;
      if (!map.inb(x, y)) continue;
      const i = y * map.w + x;
      if (!map.laneDir[i] || !ROADS.has(map.ground[i]) || (map.closed && map.closed[i])) continue;
      if (g.onScreen(x * TILE, y * TILE, 30)) continue;
      if (this.vehicles.some(v => !v.dead && Math.abs(v.tx - x) + Math.abs(v.ty - y) < 3)) continue;
      return [x, y];
    }
    return null;
  }
  spawnVehicle(kind, bosque) {
    const at = this.findLaneTile(bosque);
    if (!at) return;
    const v = new Vehicle(this.game.map, at[0], at[1], kind, this.seed++);
    if (kind === 'moto' || kind === 'bici') v.riderLook = makeLook(this.seed++, { age: pick(R, ['teen', 'adult', 'adult']), hat: kind === 'moto' ? pick(R, ['cap', null, 'helmet']) : 'cap', rebozo: null, holds: null });
    if (kind === 'moto') v.color = pick(R, ['#c0392b', '#1f4fa0', '#1b1b1b', '#f39c12', '#e0e0e0']); // Italika colours
    v.fleet = this.vehicles; this.vehicles.push(v); this.add(v);
  }
  // Cycling clubs of the Ciénega: Los Rinos de Jiquilpan (purple, a rhino on the chest), Las
  // Mamazonas de Zamora and Los Apenitas — they ride from Zamora to San Pedro Caro and back.
  spawnRinos(team = pick(R, ['rinos', 'rinos', 'mamazonas', 'apenitas'])) {
    const at = this.findLaneTile(false);
    if (!at) return;
    this.rinosOut = true;
    const map = this.game.map;
    const kit = { rinos: '#b9b4c9', mamazonas: '#1b1b1b', apenitas: '#f08c00' }[team];
    const lead = new Vehicle(map, at[0], at[1], 'rino', this.seed++);
    lead.riderLook = makeLook(this.seed++, { uniform: team, age: 'adult', female: team === 'mamazonas' });
    lead.teamBike = kit; lead.team = team;
    lead.pickDir();
    if (lead.dir === null) return;
    lead.fleet = this.vehicles; this.vehicles.push(lead); this.add(lead);
    let k = 1;
    const n = 3 + Math.floor(R() * 4);
    const spawnNext = () => {
      if (k > n || lead.dead) return;
      const v = new Vehicle(map, at[0], at[1], 'rino', this.seed++);
      v.riderLook = makeLook(this.seed++, { uniform: team, age: pick(R, ['adult', 'adult', 'teen', 'elder']), female: team === 'mamazonas' ? R() < 0.9 : R() < 0.3 });
      v.teamBike = kit; v.team = team;
      v.dir = lead.dir; v.speed = lead.speed; v.fleet = this.vehicles;
      this.vehicles.push(v); this.add(v); k++;
      setTimeout(spawnNext, 650);
    };
    setTimeout(spawnNext, 650);
    setTimeout(() => { this.rinosOut = false; }, 1000 * 60 * 4);
    const names = { rinos: '¡Pasan Los Rinos de Jiquilpan pedaleando!', mamazonas: 'Pasan Las Mamazonas, el club de Zamora, de regreso de San Pedro Caro.', apenitas: 'Pasan Los Apenitas… apenitas, pero pasan.' };
    this.game.ui?.toast(names[team], 'good');
  }

  // ---- animals ------------------------------------------------------------
  syncAnimals() {
    const g = this.game;
    if (this.animalsFor === g.map.id + g.state.era) return;
    for (const a of this.animals) this.remove(a);
    this.animals = [];
    this.animalsFor = g.map.id + g.state.era;
    this.dogs = [];
    const map = g.map;
    const add = (a) => { this.animals.push(a); this.add(a); };
    if (map.id === 'town') {
      const cows = ['negra', 'negra', 'cafe', 'cafe', 'pinta', 'pinta', 'pinta'];
      cows.forEach((v, i) => add(new Animal(map, (270 + (i % 4) * 5.5) * TILE, (33 + Math.floor(i / 4) * 4.5) * TILE, 'cow', { variant: v, r: 36 })));
      for (let i = 0; i < 5; i++) add(new Animal(map, (268 + i * 1.5) * TILE, (47.5 + (i % 2)) * TILE, 'chicken', { r: 30 }));
      for (let i = 0; i < 12; i++) add(new Animal(map, (122 + (i * 7) % 12) * TILE, (100.5 + (i * 5) % 4) * TILE, 'pigeon', { r: 30 }));
      this.dogs = spawnTownDogs(map, add);
      this.dogs.forEach((d, i) => { d.idx = i; d.affinity = (g.state.dogAff || {})[i] || 0; });
    } else if (map.id === 'cerro') {
      add(new Animal(map, 43 * TILE, 95 * TILE, 'dog', { color: '#c8743a', r: 50 })); // Canelo
      for (let i = 0; i < 6; i++) add(new Animal(map, (33 + i * 2) * TILE, (98.5 + (i % 2)) * TILE, 'chicken', { r: 40 }));
      // Lucero, the Salazars' runaway mare (side quest)
      if (g.quests.started('s_caballo') && !g.quests.done('s_caballo')) {
        const near = g.flags.lucero_follow;
        const h = new Animal(map, near ? g.player.x + 20 : 61 * TILE, near ? g.player.y : 36 * TILE, 'horse', { color: '#f2efe8', r: 30 });
        h.def = { id: 'lucero', name: 'Lucero', crowd: true }; h.horse = true; h.follow = near;
        add(h);
      }
      // cows and horses loose on the slopes
      const free = (x, y) => !map.isSolidTile(Math.floor(x), Math.floor(y));
      const herd = [[20, 34, 'cow'], [26, 36, 'cow'], [58, 60, 'cow'], [16, 58, 'cow'], [60, 96, 'cow'], [22, 100, 'cow'], [62, 20, 'cow'], [14, 24, 'cow'], [64, 76, 'cow'], [48, 16, 'horse'], [52, 18, 'horse'], [18, 88, 'horse'], [60, 70, 'horse'], [16, 30, 'horse'], [62, 50, 'horse']];
      herd.forEach(([x, y, k], i) => { if (!free(x, y)) return; add(new Animal(map, x * TILE, y * TILE, k, k === 'cow' ? { variant: ['negra', 'cafe', 'pinta'][i % 3], r: 70 } : { color: ['#6b4428', '#2b2420', '#8a6a4a', '#d8d0c0'][i % 4], r: 90 })); });
    } else if (map.id === 'abadiano') {
      for (let i = 0; i < 6; i++) add(new Animal(map, (20 + i * 3) * TILE, (30 + (i % 3)) * TILE, 'chicken', { r: 50 }));
      this.dogs = [new Dog(map, 33 * TILE, 25 * TILE), new Dog(map, 20 * TILE, 27 * TILE, { coat: ['#2b2b2b', '#e8e2d4', true] })]; this.dogs.forEach(add);
    } else if (['totolan', 'abadiano', 'sarabia'].includes(map.id)) {
      for (let i = 0; i < 6; i++) add(new Animal(map, (20 + i * 3) * TILE, (30 + (i % 3)) * TILE, 'chicken', { r: 50 }));
      add(new Animal(map, 30 * TILE, 34 * TILE, 'dog', { color: '#8a5a34', r: 80 }));
      for (let i = 0; i < 3; i++) add(new Animal(map, (40 + i * 4) * TILE, (12 + i * 2) * TILE, 'cow', { variant: pick(R, ['negra', 'cafe', 'pinta']), r: 50 }));
    }
  }

  // your own dog walks with you anywhere outdoors
  syncCompanion() {
    const g = this.game, st = g.state.dog;
    if (!st || !g.map.outdoor) return;
    if (this.animals.some(a => a.companion)) return;
    const d = new Dog(g.map, g.player.x - 16, g.player.y + 6, { companion: true, name: st.name, coat: st.coat });
    d.def = { id: 'mi_perro', name: st.name, crowd: true, dog: true };
    this.animals.push(d); this.add(d);
  }
  // clear everything (map change)
  clearTransient() {
    for (const c of this.crowd) this.remove(c);
    this.crowd = [];
    for (const v of this.vehicles) this.remove(v);
    this.vehicles = [];
    this.animalsFor = null;
  }
}
