// Driving the abuelo's old Toyota, and what happens when you drive badly: people get hurt, someone
// calls the Cruz Roja, the municipal police come, and the town remembers.
import { TILE, clamp, dist, pick, lerp } from './util.js';
import { Entity, Person, Vehicle, Animal, lanePath, nearestLane } from './entities.js';
import { drawCar, MODELS } from './render/cars.js';
import { makeLook } from './render/people.js';
import { G, ROADS } from './world.js';

const R = Math.random;
const HOME = { x: 230.5, y: 156.7, angle: Math.PI }; // on the sidewalk in front of the abuela's, like everybody parks

// ---------------------------------------------------------------------------------------------
export class PlayerCar extends Entity {
  constructor(map, x, y, angle = 0, damage = 0) {
    super(map, x, y);
    this.angle = angle; this.speed = 0; this.damage = damage; this.solid = true; this.radius = 12;
    this.spec = { model: 'tacoma', color: '#9b2a22', damage };
    this.playerCar = true; this.honkT = 0; this.shake = 0; this.hitCool = 0;
    this.def = null;
  }
  get broken() { return this.damage >= 100; }
  dirLetter() {
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    return Math.abs(c) >= Math.abs(s) ? (c > 0 ? 'E' : 'W') : (s > 0 ? 'S' : 'N');
  }
  // car footprint as a box aligned with the drawing direction
  box(x = this.x, y = this.y) {
    const d = this.dirLetter(), M = MODELS.tacoma;
    return d === 'E' || d === 'W' ? { x, y: y - 3, hw: M.L / 2 - 2, hh: 5 } : { x, y: y - 2, hw: M.W / 2 - 1, hh: M.L / 2 - 3 };
  }
  hits(x, y) { const b = this.box(x, y); return this.map.blocked(b.x, b.y, b.hw, b.hh) || this.offRoadSolid(b); }
  offRoadSolid(b) { // cars don't go up the cerro path, into the river or through the closed-off tianguis
    const tx = Math.floor(b.x / TILE), ty = Math.floor(b.y / TILE);
    const g = this.map.get(tx, ty);
    return g === G.WATER || g === G.STAIRS || (this.map.closed && this.map.closed[ty * this.map.w + tx]);
  }
  update(dt, game) {
    this.spec.damage = this.damage;
    this.smoke = this.damage >= 60 ? 1 : 0;
    if (this.hitCool > 0) this.hitCool -= dt;
    if (game.driving !== this) { this.speed = 0; return; }
    const inp = game.input;
    let { x, y } = inp.enabled && !game.dialog.active ? inp.axis() : { x: 0, y: 0 };
    const mag = Math.min(1, Math.hypot(x, y));
    const g = this.map.get(Math.floor(this.x / TILE), Math.floor(this.y / TILE));
    const max = this.broken ? 0 : ROADS.has(g) ? 92 : g === G.SIDEWALK || g === G.CANTERA || g === G.PLAZA ? 55 : 42;
    if (mag > 0.15 && !this.broken) {
      const want = Math.atan2(y, x);
      let diff = want - this.angle; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > 2.4) { // pulling back: brake, then reverse
        if (this.speed > 4) this.speed -= 160 * dt; else this.speed = Math.max(-30, this.speed - 60 * dt);
      } else {
        const k = clamp(Math.abs(this.speed) / 35, 0.3, 1);
        this.angle += clamp(diff, -3.2 * dt * k, 3.2 * dt * k);
        this.speed = Math.min(max * mag, this.speed + 70 * dt);
      }
    } else this.speed *= Math.max(0, 1 - 1.8 * dt);
    if (Math.abs(this.speed) > max) this.speed = lerp(this.speed, Math.sign(this.speed) * max, 0.1);
    if (inp.run && this.honkT <= 0) { this.honkT = 1.2; game.sfx('honk'); this.scareAhead(game); }
    this.honkT -= dt;
    // move with collision against the map
    const vx = Math.cos(this.angle) * this.speed, vy = Math.sin(this.angle) * this.speed;
    const nx = this.x + vx * dt, ny = this.y + vy * dt;
    if (!this.hits(nx, ny)) { this.x = nx; this.y = ny; }
    else if (!this.hits(nx, this.y)) { this.x = nx; this.speed *= 0.9; }
    else if (!this.hits(this.x, ny)) { this.y = ny; this.speed *= 0.9; }
    else this.crash(game, Math.abs(this.speed), 'wall');
    this.collideTraffic(game);
    this.collidePeople(game);
    // can't drive out of town or up the cerro path
    const ex = this.map.exitAt?.(this.x, this.y);
    if (ex) { this.x -= vx * dt * 3; this.y -= vy * dt * 3; this.speed = 0; game.ui.toast(ex.to === 'cerro' ? 'El camino al Cerro es de piedra: ahí no sube la troca. Hay que ir a pie.' : `${ex.label}: hoy no se puede salir del pueblo.`, ''); }
    game.player.x = this.x; game.player.y = this.y;
  }
  crash(game, sp, what) {
    if (sp > 28 && this.hitCool <= 0) {
      this.hitCool = 0.6;
      this.damage = Math.min(100, this.damage + sp * 0.12);
      game.sfx('door'); game.shake = Math.min(6, sp / 18);
      if (this.broken) { game.ui.toast('La troca echó humo y se apagó. Ya no arranca.', 'bad'); }
    }
    this.speed = -this.speed * 0.25;
  }
  scareAhead(game) {
    for (const p of game.people || []) {
      if (p === game.player || p.down || dist(p.x, p.y, this.x, this.y) > 50) continue;
      if (p.bubble == null && R() < 0.6) p.bubble = { text: pick(R, ['¡Ya voy, ya voy!', '¡Qué prisa!', '¡Con calma, joven!']), t: 2 };
    }
  }
  collideTraffic(game) {
    for (const v of game.npcs.vehicles) {
      if (v.dead || v.map !== this.map || !v.model) continue;
      const d = dist(v.x, v.y, this.x, this.y);
      if (d < 20) {
        const sp = Math.abs(this.speed);
        if (sp > 20 && this.hitCool <= 0) {
          v.spec.damage = (v.spec.damage || 0) + sp * 0.4; v.honk = 3; game.sfx('honk');
          game.accidents.carCrash(v, sp);
        }
        this.crash(game, sp, 'car');
        const ux = (this.x - v.x) / (d || 1), uy = (this.y - v.y) / (d || 1);
        this.x += ux * 2; this.y += uy * 2;
      }
    }
  }
  collidePeople(game) {
    const sp = Math.abs(this.speed);
    const fx = this.x + Math.cos(this.angle) * 10 * Math.sign(this.speed || 1), fy = this.y - 2 + Math.sin(this.angle) * 8 * Math.sign(this.speed || 1);
    for (const p of game.people || []) {
      if (p === game.player || p.down || p.map !== this.map || p.hidden) continue;
      const d = Math.hypot(p.x - fx, (p.y - fy) * 1.2);
      if (d > 11) continue;
      if (sp > 30) { game.accidents.hitPerson(p, sp, this); this.speed *= 0.6; this.damage = Math.min(100, this.damage + 3); game.shake = 3; }
      else if (sp > 4) { // a nudge: the person jumps aside and complains
        const ux = (p.x - this.x) / (d || 1), uy = (p.y - this.y) / (d || 1);
        if (!this.map.blocked(p.x + ux * 8, p.y + uy * 6, 4, 2.5)) { p.x += ux * 8; p.y += uy * 6; }
        this.speed *= 0.3;
        if (!p.bubble) p.bubble = { text: pick(R, ['¡Fíjese, oiga!', '¡Casi me atropella!', '¡Ey, ey, ey!']), t: 2.2 };
        game.stats && game.addStat('fama', -1);
      }
    }
    for (const a of game.npcs.animals) {
      if (a.map !== this.map || a.down || a.kind !== 'dog') continue;
      if (dist(a.x, a.y, fx, fy) < 10 && sp > 30) game.accidents.hitDog(a, sp);
    }
  }
  draw(ctx, game) {
    ctx.save(); ctx.translate(this.x, this.y + 4);
    drawCar(ctx, this.spec, this.dirLetter());
    if (this.smoke) for (let i = 0; i < 4; i++) { const p = (game.clock.real * 0.8 + i / 4) % 1; ctx.fillStyle = `rgba(80,80,85,${0.45 * (1 - p)})`; ctx.beginPath(); ctx.arc(Math.sin(i * 2 + game.clock.real) * 3, -14 - p * 24, 3 + p * 7, 0, 7); ctx.fill(); }
    ctx.restore();
    if (game.env.light < 0.5 && !this.broken) {
      const dx = Math.cos(this.angle), dy = Math.sin(this.angle);
      ctx.fillStyle = 'rgba(255,240,190,0.25)';
      ctx.beginPath(); ctx.moveTo(this.x + dx * 14, this.y + dy * 12); ctx.lineTo(this.x + dx * 60 - dy * 16, this.y + dy * 56 - dx * 10); ctx.lineTo(this.x + dx * 60 + dy * 16, this.y + dy * 56 + dx * 10); ctx.fill();
    }
  }
}

// The truck lives in the town map; place it (from the save) whenever the town is built.
export function placeCar(game) {
  const town = game.maps.town; if (!town) return;
  const st = game.state.car || (game.state.car = { x: HOME.x * TILE, y: HOME.y * TILE, angle: HOME.angle, damage: 0 });
  if (game.car) { const i = game.entities.indexOf(game.car); if (i >= 0) game.entities.splice(i, 1); }
  game.car = new PlayerCar(town, st.x, st.y, st.angle, st.damage);
  game.entities.push(game.car);
}
export function saveCar(game) { const c = game.car; if (c) game.state.car = { x: c.x, y: c.y, angle: c.angle, damage: c.damage }; }

export function enterCar(game) {
  const c = game.car; if (!c) return;
  if (c.broken) return carMenu(game);
  if (!game.flags.troca_keys) { game.flags.troca_keys = true; game.ui.toast('Las llaves estaban puestas, como siempre. El abuelo nunca las quitaba.', 'good'); }
  game.driving = c; game.player.hidden = true; game.player.x = c.x; game.player.y = c.y;
  game.sfx('door');
  game.ui.toast('Manejando la troca del abuelo · joystick: manejar · B: claxon · A: bajarte', '');
}
export function exitCar(game) {
  const c = game.driving; if (!c) return;
  if (Math.abs(c.speed) > 18) { game.ui.toast('Frena primero.', ''); return; }
  c.speed = 0; game.driving = null;
  const p = game.player; p.hidden = false;
  // step out beside the driver's door, somewhere walkable
  for (const [ox, oy] of [[0, 14], [0, -14], [-22, 6], [22, 6], [0, 24]]) { if (!c.map.blocked(c.x + ox, c.y + oy, 4, 2.5)) { p.x = c.x + ox; p.y = c.y + oy; break; } }
  saveCar(game); game.save();
}
export function carMenu(game) {
  const c = game.car;
  return game.dialog.scene(async d => {
    const opts = [];
    if (!c.broken) opts.push({ text: 'Manejar la troca', value: 'drive' });
    if (c.damage > 5) opts.push({ text: `Llevarla al taller de Don Chema ($${Math.round(120 + c.damage * 6)})`, value: 'fix' });
    if (c.broken) opts.push({ text: 'Llamar a la grúa y al taller ($' + Math.round(300 + c.damage * 6) + ')', value: 'tow' });
    opts.push({ text: 'Dejarla así', value: null });
    await d.narrate(c.broken ? 'La troca del abuelo: una Toyota roja del 89 con más golpes que pintura. Ya no arranca.' : `La troca del abuelo: una Toyota roja del 89. ${c.damage > 30 ? 'Se le notan los golpes que le has dado.' : 'El abuelo la cuidaba como a un caballo.'}`);
    const ch = await d.choose(opts);
    if (ch.value === 'drive') { d.end(); enterCar(game); return; }
    if (ch.value === 'fix' || ch.value === 'tow') {
      const cost = Math.round((ch.value === 'tow' ? 300 : 120) + c.damage * 6);
      if (game.state.money < cost) { await d.narrate(`No te alcanza: son $${cost}. Don Chema no fía.`); return; }
      game.state.money -= cost; game.sfx('coin');
      c.damage = 0; c.spec.damage = 0;
      if (ch.value === 'tow') { c.x = HOME.x * TILE; c.y = HOME.y * TILE; c.angle = HOME.angle; }
      saveCar(game);
      await d.narrate(ch.value === 'tow' ? 'La grúa se la lleva entre chirridos. Al día siguiente, Don Chema te la deja afuera de la casa de la abuela, como nueva (casi).' : 'Don Chema le mete mano: enderezar, masilla, pintura. “Ahí quedó, joven. Pero maneje con cuidado, que aquí todos nos conocemos.”');
      game.clock.minutes += ch.value === 'tow' ? 600 : 180;
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Accidents: the hurt, the onlookers, the Cruz Roja and the police.
export class Accidents {
  constructor(game) { this.game = game; this.list = []; this.units = []; }
  hitPerson(p, sp, car) {
    const g = this.game;
    p.down = true; p.downT = 0; p.path = null; p.talking = false; p.pose = 'down'; p.bubble = { text: '¡Aaay!', t: 2.5 };
    const ux = Math.cos(car.angle), uy = Math.sin(car.angle);
    for (let k = 0; k < 6; k++) { const nx = p.x + ux * 4, ny = p.y + uy * 3; if (!p.map.blocked(nx, ny, 4, 2.5)) { p.x = nx; p.y = ny; } }
    g.sfx('door'); g.shake = 4;
    const named = p.def && !p.def.crowd;
    g.addStat('corazon', -12); g.addStat('fama', -8);
    if (named) { g.state.injured = g.state.injured || {}; g.state.injured[p.def.id] = g.clock.dayIndex + 3; g.state.rel[p.def.id] = Math.max(-100, (g.state.rel[p.def.id] || 0) - 25); }
    const acc = { p, x: p.x, y: p.y, t: 0, stage: 0, named, by: 'player', map: p.map };
    this.list.push(acc);
    g.ui.toast(`Atropellaste a ${p.def?.short || p.def?.name || p.name || 'alguien'}.`, 'bad');
  }
  hitDog(a, sp) {
    const g = this.game;
    a.down = true; a.downT = 0; a.bubbleT = 1.6; a.bubbleText = '¡Cai, cai, cai!';
    g.sfx('bark'); g.addStat('corazon', -8);
    setTimeout(() => { a.down = false; a.limp = true; a.home = { x: a.x + (R() - 0.5) * 200, y: a.y + (R() - 0.5) * 120, r: 60 }; }, 6000);
  }
  carCrash(v, sp) {
    const g = this.game;
    g.addStat('palabra', -2);
    if (!this.crashTold) { this.crashTold = true; setTimeout(() => this.crashTold = false, 20000); g.ui.toast('El otro conductor se baja a gritarte. Mejor arreglarse… o irse.', 'bad'); }
  }
  update(dt) {
    const g = this.game;
    for (const a of this.list) {
      a.t += dt;
      if (a.map !== g.map) continue;
      // stage 0: people gather (after a few seconds), someone calls the ambulance
      if (a.stage === 0 && a.t > 4) {
        a.stage = 1;
        const near = (g.people || []).filter(o => o !== g.player && o !== a.p && !o.down && o.def?.crowd && dist(o.x, o.y, a.x, a.y) < 12 * TILE).slice(0, 4);
        for (const o of near) {
          const ang = R() * Math.PI * 2, tx = (a.x + Math.cos(ang) * 22) / TILE, ty = (a.y + Math.sin(ang) * 14) / TILE;
          const path = g.npcs.pathFor(o, tx, ty);
          if (path) { o.path = path; o.pathI = 1; o.behaviour = 'walk'; o.onArrive = () => { o.behaviour = 'stand'; o.face(a.x, a.y); o.bubble = { text: pick(R, ['¡Llamen a la Cruz Roja!', '¡No lo muevan!', '¿Viste quién fue?', 'Ay, Dios mío…', '¡Fue la troca roja!']), t: 4 }; }; }
        }
        a.onlookers = near;
      }
      if (a.stage === 1 && a.t > 14) { a.stage = 2; this.dispatch('ambulancia', a); }
      if (a.stage === 2 && a.t > 22) { a.stage = 3; this.dispatch('patrulla', a); }
    }
    for (const u of this.units) this.updateUnit(u, dt);
    this.units = this.units.filter(u => !u.done);
    this.list = this.list.filter(a => !a.done);
  }
  // Send an ambulance or a patrol car along the streets to the accident.
  dispatch(kind, a) {
    const g = this.game, map = a.map;
    const goal = nearestLane(map, Math.floor(a.x / TILE), Math.floor(a.y / TILE), 10);
    if (!goal) return;
    let start = null, plan = null;
    for (let tries = 0; tries < 30 && !plan; tries++) {
      const ang = R() * Math.PI * 2, d = 11 + R() * 6;
      const s = nearestLane(map, Math.floor(goal[0] + Math.cos(ang) * d), Math.floor(goal[1] + Math.sin(ang) * d), 4);
      if (!s || g.onScreen(s[0] * TILE, s[1] * TILE, 20)) continue;
      plan = lanePath(map, s[0], s[1], goal[0], goal[1], 1); start = s;
    }
    if (!plan) { start = goal; plan = [goal]; }
    const v = new Vehicle(map, start[0], start[1], kind, 900 + (R() * 1e6 | 0));
    v.siren = true; v.speed = 82; v.plan = plan; v.planI = 0; v.fleet = g.npcs.vehicles; v.emergency = true; v.goal = goal;
    g.npcs.vehicles.push(v); g.entities.push(v);
    const u = { kind, v, a, t: 0, stage: 0 };
    v.onArrive = () => { u.stage = 1; u.t = 0; };
    this.units.push(u);
    if (kind === 'ambulancia') g.ui.toast('Se oye la sirena de la Cruz Roja.', '');
    else g.ui.toast('Llega una patrulla de la Policía Municipal.', 'bad');
    g.sfx('honk');
  }
  updateUnit(u, dt) {
    const g = this.game; u.t += dt;
    if (u.v.dead) { u.done = true; return; }
    if (u.stage === 0 && u.t > 50) { u.v.x = u.v.plan?.[u.v.plan.length - 1]?.[0] * TILE + 8 || u.v.x; u.stage = 1; u.t = 0; u.v.parked = true; } // never get stuck forever
    if (u.stage === 1) { // crew gets out
      u.stage = 2; u.crew = [];
      const n = u.kind === 'ambulancia' ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const look = makeLook(4000 + i * 13 + (u.kind === 'ambulancia' ? 0 : 50), u.kind === 'ambulancia' ? { uniform: 'paramedic', age: 'adult', female: i === 1 } : { uniform: 'police', age: 'adult' });
        const p = new Person(u.v.map, u.v.x + (i ? 10 : -10), u.v.y + 10, look);
        p.def = { id: 'crew' + i, name: u.kind === 'ambulancia' ? (i ? 'Paramédica' : 'Paramédico') : 'Oficial Ramírez', crowd: true, role: u.kind === 'ambulancia' ? 'Cruz Roja' : 'Policía Municipal' };
        p.speed = 40; u.crew.push(p); g.entities.push(p);
      }
    }
    if (u.stage === 2) {
      const tgt = u.kind === 'ambulancia' ? u.a : (g.player.map === u.v.map && dist(g.player.x, g.player.y, u.a.x, u.a.y) < 16 * TILE ? g.player : u.a);
      let all = true;
      u.crew.forEach((p, i) => {
        const tx = tgt.x + (i ? 9 : -9), ty = tgt.y + 4, d = dist(p.x, p.y, tx, ty);
        if (d > 4) { all = false; const sp = p.speed * dt; p.tryMove((tx - p.x) / d * p.speed, (ty - p.y) / d * p.speed, dt, null); p.moving = true; p.setDirFromVec(tx - p.x, ty - p.y); } else { p.moving = false; p.face(tgt.x, tgt.y); }
        p.updateAnim(dt);
      });
      if (all || u.t > 25) { u.stage = 3; u.t = 0; if (u.kind === 'patrulla') this.policeTalk(u); }
    }
    if (u.stage === 3 && u.kind === 'ambulancia' && u.t > 4) { // take the injured to the hospital
      const p = u.a.p; p.hidden = true; p.down = false;
      if (p.def?.crowd) { const i = g.npcs.crowd.indexOf(p); if (i >= 0) g.npcs.crowd.splice(i, 1); g.npcs.remove(p); }
      else if (p.def) { g.npcs.named.delete(p.def.id); g.npcs.remove(p); }
      for (const o of u.a.onlookers || []) { o.behaviour = 'wander'; o.home = { x: o.x, y: o.y }; }
      this.leave(u); u.a.done = true;
    }
    if (u.stage === 3 && u.kind === 'patrulla' && !u.talking && u.t > 6) this.leave(u);
  }
  leave(u) {
    const g = this.game;
    for (const p of u.crew || []) { const i = g.entities.indexOf(p); if (i >= 0) g.entities.splice(i, 1); }
    u.crew = []; u.v.parked = false; u.v.plan = null; u.v.emergency = false; u.v.onArrive = null; u.v.siren = u.kind === 'ambulancia'; u.v.pickDir(); u.done = true;
  }
  async policeTalk(u) {
    const g = this.game;
    const near = g.player.map === u.v.map && dist(g.player.x, g.player.y, u.a.x, u.a.y) < 16 * TILE;
    if (!near) {
      g.state.wanted = g.clock.dayIndex + 1;
      g.ui.toast('Te fuiste. La policía anda buscando “una troca roja vieja”. Todo el pueblo ya sabe de quién es.', 'bad');
      g.addStat('palabra', -8); return;
    }
    u.talking = true;
    const cop = u.crew[0];
    if (g.driving) { g.driving.speed = 0; }
    await g.dialog.scene(async d => {
      await d.say(cop, 'Buenas. A ver, joven: ¿usted venía manejando la troca roja? Varios testigos dicen que sí.');
      const fine = 600;
      const c = await d.choose([
        { text: 'Sí, fui yo. Me hago responsable de todo.', value: 'own', tag: 'honest' },
        { text: `Ofrecerle “algo para el refresco” ($200)`, value: 'bribe', tag: 'rude' },
        { text: 'Yo no fui. Venía caminando.', value: 'lie', tag: 'mean' },
      ], cop);
      if (c.value === 'own') {
        const pay = Math.min(g.state.money, fine);
        g.state.money -= pay; g.addStat('palabra', 6); g.addStat('corazon', 3);
        await d.say(cop, `Se agradece la honestidad. Son $${fine} de multa por el daño; ${pay < fine ? 'lo que traiga y el resto lo arregla en el Ayuntamiento' : 'ahí está su recibo'}. Y la Cruz Roja dice que se va a poner bien. Maneje despacio: aquí hay niños, perros y señoras con mandado.`);
      } else if (c.value === 'bribe') {
        if (g.state.money < 200) { await d.say(cop, '¿Y con qué, joven? Mejor súbase a la patrulla. Una noche en los separos le va a enseñar.'); this.jail(); return; }
        g.state.money -= 200; g.addStat('palabra', -10); g.addStat('corazon', -6);
        await d.say(cop, '…Ándele pues. Aquí no pasó nada. Pero la gente sí vio, ¿eh? Eso no se borra con un billete.');
      } else {
        g.addStat('palabra', -12);
        await d.say(cop, 'Mire, la señora de la tienda lo grabó con su celular. Súbase a la patrulla.');
        this.jail();
      }
    });
    u.talking = false;
  }
  jail() {
    const g = this.game;
    g.driving && (g.driving.speed = 0); g.driving = null; g.player.hidden = false;
    g.transition(() => {
      g.clock.advanceTo(7); g.state.money = Math.max(0, g.state.money - 300);
      g.changeMap('town', 170, 109, 0);
      g.ui.toast('Pasaste la noche en los separos del Palacio Municipal. Multa: $300.', 'bad');
    });
  }
}
