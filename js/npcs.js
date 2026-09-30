// Population manager: named NPCs on schedules, the crowd, traffic and animals.
import { TILE, dist, rng, pick, hash2 } from './util.js';
import { G, ROADS } from './world.js';
import { Person, Vehicle, Animal, Entity, findPath } from './entities.js';
import { makeLook } from './render/people.js';
import { NAMED, MERCADO_VENDORS } from './data/npcs.js';
import { SPRITES } from './render/landmarks.js';

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
  update(dt, game) {
    this.updateAnim(dt);
    this.moving = false;
    if (this.talking) return;
    if (this.behaviour === 'sit') { this.pose = 'sit'; return; }
    if (this.behaviour === 'phone') { this.look.phone = true; }
    if (this.path) {
      const p = this.path[this.pathI];
      if (!p) { this.path = null; this.onArrive?.(game); return; }
      const tx = p[0] * TILE + 8, ty = p[1] * TILE + 10;
      const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
      if (d < 2) { this.pathI++; return; }
      const vx = dx / d * this.speed, vy = dy / d * this.speed;
      const others = game.entities;
      if (!this.tryMove(vx, vy, dt, others)) { this.stuck = (this.stuck || 0) + dt; if (this.stuck > 2) { this.path = null; this.stuck = 0; } }
      else this.stuck = 0;
      this.moving = true; this.setDirFromVec(vx, vy);
      return;
    }
    if (this.behaviour === 'wander') {
      this.wait -= dt;
      if (this.wait <= 0) {
        const r = (this.wanderR || 3) * TILE;
        const tx = this.home.x + (R() - 0.5) * 2 * r, ty = this.home.y + (R() - 0.5) * 2 * r;
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
  juarez: [[29, 70], [35, 71], [32, 62]],
  paz: [[224, 163.5], [224, 169.5], [215, 165.5], [232.5, 165.5]],
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
    const h = g.clock.hour, d = g.clock.weekday;
    for (const s of def.sched || []) {
      if (s.acts && !s.acts.includes(act)) continue;
      if (s.d && !s.d.includes(d)) continue;
      if (h < s.h[0] || h >= s.h[1]) continue;
      return s;
    }
    return null;
  }

  update(dt) {
    const g = this.game;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = 1; this.syncNamed(); }
    this.crowdTimer -= dt;
    if (this.crowdTimer <= 0) { this.crowdTimer = 1.5; this.syncCrowd(); this.syncAnimals(); }
    this.trafficTimer -= dt;
    if (this.trafficTimer <= 0) { this.trafficTimer = 1.2; this.syncTraffic(); }
    for (const n of this.named.values()) if (n.map === g.map) n.update(dt, g);
    for (const c of this.crowd) if (c.map === g.map) c.update(dt, g);
    for (const v of this.vehicles) v.update(dt, g);
    for (const a of this.animals) if (a.map === g.map) a.update(dt, g);
    this.vehicles = this.vehicles.filter(v => !v.dead || this.remove(v));
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
        const kind = s.prop.kind === 'carnitasTruck' ? 'carnitasTruck' : 'cart';
        const p = new Prop(map, tx + (s.prop.dx || 0) * TILE, ty + (s.prop.dy || 0) * TILE,
          { kind, w: kind === 'carnitasTruck' ? 60 : 40, up: 56, color: s.prop.color, sign: s.prop.sign, umbrella: s.prop.umbrella, cart: s.prop.cartKind });
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
      if (far && !c.talking) { this.remove(c); return false; }
      return true;
    });
    if (map.residents) { this.syncResidents(map); return; }
    if (map.id !== 'town') return;
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
      if (map.isSolidTile(tx, ty) || ROADS.has(gnd)) continue;
      if (g.onScreen(x, y, 20)) continue;
      const seed = this.seed++;
      const look = (CROWD[type] || CROWD.stroll)(seed);
      if (g.state.era === 'after' && R() < 0.6) look.phone = true;
      else if (look.age === 'teen' && R() < 0.4) look.phone = true;
      const npc = new NPC(map, tx * TILE + 8, ty * TILE + 10, look, { id: 'crowd' + seed, name: this.crowdName(look), role: this.crowdRole(type), persona: this.crowdPersona(type, look), crowd: true });
      npc.ctype = type; npc.behaviour = 'walk';
      npc.expire = g.clock.minutes + 60 + R() * 120;
      const [px, py] = pick(R, pois);
      const path = findPath(map, tx, ty, px + (R() - 0.5) * 3, py + (R() - 0.5) * 2);
      if (!path) continue;
      npc.path = path; npc.pathI = 1;
      if (type === 'drinker') { npc.onArrive = () => { npc.behaviour = 'stand'; npc.dir = 0; npc.home = { x: npc.x, y: npc.y }; }; this.crowd.push(npc); this.add(npc); return npc; }
      npc.onArrive = () => { npc.behaviour = R() < 0.5 ? 'stand' : 'wander'; npc.home = { x: npc.x, y: npc.y }; npc.wanderR = 3; npc.wait = 2; setTimeout(() => { if (!npc.talking && R() < 0.6) { const [qx, qy] = pick(R, pois); const p2 = findPath(npc.map, npc.x / TILE, npc.y / TILE, qx, qy); if (p2) { npc.path = p2; npc.pathI = 1; npc.behaviour = 'walk'; } } }, 15000 + R() * 30000); };
      this.crowd.push(npc); this.add(npc);
      return npc;
    }
    return null;
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
      if (v.map !== map || dist(v.x, v.y, g.player.x, g.player.y) > 34 * TILE) { v.dead = true; }
    }
    if (map.id !== 'town' || !map.laneDir) return;
    const h = g.clock.hour;
    let target = h < 6 ? 2 : h < 8 ? 6 : h < 21 ? 9 : h < 23 ? 6 : 3;
    // cruising cars in the bosque at night
    const nearBosque = g.player.y > 190 * TILE;
    if (nearBosque && (h >= 19 || h < 1)) target += 5;
    const alive = this.vehicles.filter(v => !v.dead).length;
    if (alive >= target) return;
    // Los Rinos: weekend mornings, a convoy of cyclists
    const d = g.clock.weekday;
    if ((d === 0 || d === 6) && h >= 7 && h < 10 && !this.rinosOut) { this.spawnRinos(); return; }
    const kind = pick(R, ['car', 'car', 'car', 'taxi', 'taxi', 'pickup', 'moto', 'moto', 'moto', 'bici']);
    this.spawnVehicle(kind, nearBosque && (h >= 19 || h < 1));
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
    this.vehicles.push(v); this.add(v);
  }
  spawnRinos() {
    const at = this.findLaneTile(false);
    if (!at) return;
    this.rinosOut = true;
    const map = this.game.map;
    const lead = new Vehicle(map, at[0], at[1], 'rino', this.seed++);
    lead.riderLook = makeLook(this.seed++, { uniform: 'rino' });
    lead.pickDir();
    if (lead.dir === null) return;
    this.vehicles.push(lead); this.add(lead);
    // followers spawn behind the leader
    let k = 1;
    const spawnNext = () => {
      if (k > 5) return;
      const v = new Vehicle(map, at[0], at[1], 'rino', this.seed++);
      v.riderLook = makeLook(this.seed++, { uniform: 'rino', female: R() < 0.35 });
      v.dir = lead.dir; v.speed = lead.speed;
      this.vehicles.push(v); this.add(v); k++;
      setTimeout(spawnNext, 700);
    };
    setTimeout(spawnNext, 700);
    setTimeout(() => { this.rinosOut = false; }, 1000 * 60 * 6);
    this.game.ui?.toast('¡Pasan Los Rinos pedaleando!', 'good');
  }

  // ---- animals ------------------------------------------------------------
  syncAnimals() {
    const g = this.game;
    if (this.animalsFor === g.map.id + g.state.era) return;
    for (const a of this.animals) this.remove(a);
    this.animals = [];
    this.animalsFor = g.map.id + g.state.era;
    const map = g.map;
    const add = (a) => { this.animals.push(a); this.add(a); };
    if (map.id === 'town') {
      const cows = ['negra', 'negra', 'cafe', 'cafe', 'pinta', 'pinta', 'pinta'];
      cows.forEach((v, i) => add(new Animal(map, (270 + (i % 4) * 5.5) * TILE, (33 + Math.floor(i / 4) * 4.5) * TILE, 'cow', { variant: v, r: 36 })));
      for (let i = 0; i < 5; i++) add(new Animal(map, (268 + i * 1.5) * TILE, (47.5 + (i % 2)) * TILE, 'chicken', { r: 30 }));
      for (let i = 0; i < 12; i++) add(new Animal(map, (122 + (i * 7) % 12) * TILE, (100.5 + (i * 5) % 4) * TILE, 'pigeon', { r: 30 }));
      const dogs = [[172, 111.6, '#b5854f'], [60, 111.6, '#2b2b2b'], [100, 157.6, '#d9c9a8'], [200, 62.6, '#8a5a34'], [130, 41.6, '#c9a06a'], [224, 158.4, '#e8e2d4']];
      for (const [x, y, c] of dogs) add(new Animal(map, x * TILE, y * TILE, 'dog', { color: c, r: 90 }));
    } else if (map.id === 'cerro') {
      add(new Animal(map, 43 * TILE, 81 * TILE, 'dog', { color: '#c8743a', r: 50 })); // Canelo
      for (let i = 0; i < 6; i++) add(new Animal(map, (33 + i * 2) * TILE, (84.5 + (i % 2)) * TILE, 'chicken', { r: 40 }));
      // cows and horses loose on the slopes
      const free = (x, y) => !map.isSolidTile(Math.floor(x), Math.floor(y));
      const herd = [[20, 34, 'cow'], [26, 36, 'cow'], [58, 60, 'cow'], [16, 58, 'cow'], [60, 96, 'cow'], [22, 100, 'cow'], [48, 16, 'horse'], [52, 18, 'horse'], [18, 88, 'horse'], [60, 70, 'horse']];
      herd.forEach(([x, y, k], i) => { if (!free(x, y)) return; add(new Animal(map, x * TILE, y * TILE, k, k === 'cow' ? { variant: ['negra', 'cafe', 'pinta'][i % 3], r: 70 } : { color: ['#6b4428', '#2b2420', '#8a6a4a', '#d8d0c0'][i % 4], r: 90 })); });
    } else if (['totolan', 'abadiano', 'sarabia'].includes(map.id)) {
      for (let i = 0; i < 6; i++) add(new Animal(map, (20 + i * 3) * TILE, (30 + (i % 3)) * TILE, 'chicken', { r: 50 }));
      add(new Animal(map, 30 * TILE, 34 * TILE, 'dog', { color: '#8a5a34', r: 80 }));
      for (let i = 0; i < 3; i++) add(new Animal(map, (40 + i * 4) * TILE, (12 + i * 2) * TILE, 'cow', { variant: pick(R, ['negra', 'cafe', 'pinta']), r: 50 }));
    }
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
