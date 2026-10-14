// Riding. Your horse (Lucero, once you bring her home to the Salazars, or El Prieto, hired at their
// rancho for the day) is faster than walking, sprints on the spurs (B / Shift; three of them, they
// come back on their own) and jumps (A while moving) over things you cannot climb on foot: bushes,
// rocks, benches, low walls, the cerro's fences, the canal. H whistles for her from anywhere outdoors.
import { TILE, clamp, dist, shade, lerp } from './util.js';
import { Animal } from './entities.js';
import { G } from './world.js';
import { getFrame, CHAR_W, CHAR_H } from './render/people.js';
import { shadowBlob } from './render/art.js';

const LOW_KINDS = new Set(['bush', 'rock', 'bench', 'ironBench', 'balustre', 'agave', 'nopal', 'boulder', 'tinacos', 'parkedMoto', 'beerCrates', 'ocote', 'campfire', 'whiteLetters', 'seVende', 'seTraspasa', 'cerca', 'fence', 'hay', 'trough', 'planter', 'barrels', 'mesas', 'tent']);
const SPURS = 3;

export class Riding {
  constructor(game) { this.game = game; this.horse = null; this.vx = 0; this.vy = 0; this.spurs = SPURS; this.spurT = 0; this.sprint = 0; this.jump = null; }
  get on() { return !!this.horse; }

  // ---- getting on and off ----------------------------------------------------------------------
  mount(h) {
    const g = this.game, p = g.player;
    if (g.combat?.active) return;
    this.horse = h; h.hidden = true; h.follow = false;
    p.x = h.x; p.y = h.y; p.mount = { color: h.color, name: h.def?.name || 'el caballo', mane: h.mane };
    this.vx = this.vy = 0; this.spurs = SPURS; this.jump = null;
    g.sfx('neigh'); g.ui.toast(`🐎 Montaste a ${p.mount.name}. B: espuelas · A: saltar · A parado: bajarte`, 'good');
    g.ui.refreshItemButton?.();
  }
  dismount(silent) {
    const g = this.game, p = g.player, h = this.horse;
    if (!h) return;
    this.horse = null; p.mount = null;
    // step off to the side that is free
    for (const [ox, oy] of [[10, 4], [-10, 4], [0, 10], [0, -8]]) if (!p.map.blocked(p.x + ox, p.y + oy, 4, 2.5)) { h.x = p.x; h.y = p.y; p.x += ox; p.y += oy; break; }
    h.map = p.map; h.hidden = false; h.target = null; h.wait = 3; h.home = { x: h.x, y: h.y, r: 10 };
    if (!g.entities.includes(h)) g.npcs.add(h);
    if (!g.npcs.animals.includes(h)) g.npcs.animals.push(h);
    this.saveHorse(h);
    if (!silent) g.sfx('select');
  }
  saveHorse(h) {
    const st = this.game.state.horse; if (!st) return;
    st.map = h.map.id; st.x = h.x; st.y = h.y;
  }

  // ---- the horse you own: spawning it with the map, and whistling for it ----------------------------
  spawnOwned(map, add) {
    const g = this.game, st = g.state.horse;
    if (!st || !map.outdoor) return null;
    if (this.horse) { // you arrive riding: the horse comes with you
      this.horse.map = map; st.map = map.id; add(this.horse); return this.horse;
    }
    if (st.map !== map.id) return null;
    const h = makeHorse(map, st.x ?? g.player.x + 24, st.y ?? g.player.y, st);
    add(h); return h;
  }
  whistle() {
    const g = this.game, st = g.state.horse, p = g.player;
    if (!st) { g.ui.toast('No tienes caballo. En el Rancho de los Salazar rentan uno, y a lo mejor Don Celso te tiene confianza…', ''); return; }
    if (this.horse) return;
    if (!g.map.outdoor) { g.ui.toast('Aquí adentro no se oye el chiflido. Sal a la calle.', ''); return; }
    g.sfx('whistle'); p.bubble = { text: '¡Fiuuu-fiu!', t: 1.2 };
    let h = g.npcs.animals.find(a => a.horse && a.owned);
    if (!h) {
      // she comes trotting from off-screen
      const a = Math.random() * Math.PI * 2;
      let x = p.x + Math.cos(a) * 200, y = p.y + Math.sin(a) * 150;
      for (let k = 0; k < 20 && g.map.blocked(x, y, 8, 4); k++) { const b = Math.random() * Math.PI * 2; x = p.x + Math.cos(b) * (120 + k * 6); y = p.y + Math.sin(b) * 100; }
      h = makeHorse(g.map, x, y, st);
      g.npcs.animals.push(h); g.npcs.add(h);
    }
    h.comeTo = { x: p.x + 16, y: p.y + 4 }; h.wait = 0; h.target = null; h.speed = 70;
    st.map = g.map.id;
    g.ui.toast(`${st.name} levanta las orejas y viene al trote.`, 'good');
  }
  // the hired horse goes home at the end of the day
  newDay() {
    const g = this.game, st = g.state.horse;
    if (st && st.rented && st.until < g.clock.dayIndex) {
      if (this.horse) this.dismount(true);
      const h = g.npcs.animals.find(a => a.horse && a.owned); if (h) { h.dead = true; g.npcs.remove(h); g.npcs.animals = g.npcs.animals.filter(a => a !== h); }
      g.state.horse = null; g.ui.toast(`${st.name} regresó solo al Rancho de los Salazar. Sabe el camino mejor que tú.`, '');
    }
  }

  // ---- riding --------------------------------------------------------------------------------------
  update(dt, canMove, inp) {
    const g = this.game, p = g.player, m = g.map;
    p.updateAnim(dt);
    // spurs come back slowly
    this.spurT += dt; if (this.spurT > 2.6 && this.spurs < SPURS && this.sprint <= 0) { this.spurT = 0; this.spurs++; }
    if (this.sprint > 0) this.sprint -= dt;
    if (this.jump) return this.updateJump(dt);
    let ax = 0, ay = 0;
    if (canMove) ({ x: ax, y: ay } = inp.axis());
    if (g.status.buzz > 45) { const w = Math.sin(g.clock.real * 2.3) * (g.status.buzz - 45) / 110; const nx = ax - ay * w, ny = ay + ax * w; ax = nx; ay = ny; }
    // a short press of the run button spends a spur on a burst of speed
    if (canMove && (inp.was('shift') || inp.was('btnb')) && this.spurs > 0 && (ax || ay)) { this.spurs--; this.sprint = 1.5; this.spurT = 0; g.sfx('gallop'); }
    const top = this.sprint > 0 ? 180 : inp.run ? 128 : 100;
    const tx = ax * top, ty = ay * top, k = Math.min(1, dt * (ax || ay ? 3.2 : 5));
    this.vx = lerp(this.vx, tx, k); this.vy = lerp(this.vy, ty, k);
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > 3) {
      const moved = moveBox(m, p, this.vx * dt, this.vy * dt, g);
      if (!moved) { this.vx *= 0.3; this.vy *= 0.3; }
      p.setDirFromVec(this.vx, this.vy); p.moving = sp > 6;
      p.running = this.sprint > 0;
    } else { p.moving = false; this.vx = this.vy = 0; }
    this.gait = sp;
    // doors: you get off and tie the horse outside
    const [fx, fy] = [[0, 1], [0, -1], [-1, 0], [1, 0]][p.dir];
    const door = m.doors.find(d => { const x = Math.floor((p.x + fx * 10) / TILE), y = Math.floor((p.y + fy * 6) / TILE); return x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h; });
    if (door && sp < 40 && canMove && !door.generic && !(g.doorCooldown > 0)) { this.dismount(true); g.ui.toast(`Amarraste a ${this.game.state.horse?.name || 'tu caballo'} afuera.`, ''); g.enterDoor(door); return; }
    const ex = m.exitAt(p.x, p.y); if (ex && !g.transitioning) g.useExit(ex);
    if (!canMove) return;
    let it = g.findInteraction();
    if (it && (it.type === 'car' || it.type === 'door' || (it.type === 'npc' && it.e === this.horse))) it = null;
    const label = g.promptFor(it);
    g.ui.prompt(label || (sp > 30 ? 'Saltar' : 'Bajarte del caballo'));
    if (inp.action()) {
      if (label) g.interact(it);
      else if (sp > 30) this.tryJump();
      else this.dismount();
    }
    if (inp.was('h')) g.ui.toast('Ya vas montado.', '');
  }
  tryJump() {
    const g = this.game, p = g.player, m = g.map, sp = Math.hypot(this.vx, this.vy) || 1;
    const ux = this.vx / sp, uy = this.vy / sp, len = this.sprint > 0 ? 58 : 46;
    const lx = p.x + ux * len, ly = p.y + uy * len;
    const landOK = !m.blocked(lx, ly, 8, 3.5) && !isWater(m, lx, ly) && !people(g, lx, ly);
    let clear = landOK;
    if (clear) for (let s = 4; s < len; s += 4) { const x = p.x + ux * s, y = p.y + uy * s; if (!jumpable(m, x, y)) { clear = false; break; } }
    g.sfx('jump');
    if (!clear) { this.jump = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, t: 0, T: 0.3, h: 5 }; if (!landOK) g.ui.toast(`${p.mount.name} no ve dónde caer y se frena.`, ''); else g.ui.toast('Eso está muy alto para brincarlo.', ''); return; }
    this.jump = { x0: p.x, y0: p.y, x1: lx, y1: ly, t: 0, T: this.sprint > 0 ? 0.55 : 0.48, h: 14 };
  }
  updateJump(dt) {
    const g = this.game, p = g.player, j = this.jump;
    j.t += dt; const k = clamp(j.t / j.T, 0, 1);
    p.x = lerp(j.x0, j.x1, k); p.y = lerp(j.y0, j.y1, k); p.z = Math.sin(Math.PI * k) * j.h;
    p.moving = true;
    if (k >= 1) { this.jump = null; p.z = 0; g.shake = 1.5; g.sfx('land'); }
  }
}

export function makeHorse(map, x, y, st) {
  const h = new Animal(map, x, y, 'horse', { color: st.color || '#f2efe8', r: 12 });
  h.def = { id: 'mi_caballo', name: st.name, crowd: true, horse: true };
  h.horse = true; h.owned = true; h.mane = st.mane; h.speed = 20;
  return h;
}

// Move the rider and horse as one wider box, sliding along walls.
function moveBox(m, p, dx, dy, g) {
  let moved = false;
  const blk = (x, y) => m.blocked(x, y, 7, 3) || hitsSomeone(g, p, x, y);
  if (dx && !blk(p.x + dx, p.y)) { p.x += dx; moved = true; }
  if (dy && !blk(p.x, p.y + dy)) { p.y += dy; moved = true; }
  if (!moved) for (const o of [4, 8]) for (const s of [-1, 1]) {
    const horiz = Math.abs(dx) >= Math.abs(dy);
    const nx = p.x + (horiz ? dx : s * o * 0.5), ny = p.y + (horiz ? s * o * 0.5 : dy);
    if (!blk(nx, ny)) { p.x = nx; p.y = ny; return true; }
  }
  return moved;
}
function hitsSomeone(g, p, x, y) {
  for (const o of g.entities) {
    if (o === p || !o.solid || o.map !== p.map || o.hidden || o === g.riding?.horse) continue;
    const r = (o.radius || 4) + 8, dx = x - o.x, dy = (y - o.y) * 1.6;
    if (dx * dx + dy * dy < r * r && dx * dx + dy * dy < (p.x - o.x) ** 2 + ((p.y - o.y) * 1.6) ** 2) return true;
  }
  return false;
}
function people(g, x, y) { return g.people?.some(o => o !== g.player && Math.abs(o.x - x) < 10 && Math.abs(o.y - y) < 6); }
function isWater(m, x, y) { return m.get(Math.floor(x / TILE), Math.floor(y / TILE)) === G.WATER; }
// Can a horse sail over this point? Free ground, low things and narrow water: yes. Walls, trees,
// statues, houses: no.
function jumpable(m, x, y) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE), gnd = m.get(tx, ty);
  if (m.isSolidTile(tx, ty) && gnd !== G.WATER && gnd !== G.GARDEN && gnd !== G.MEDIAN) return false;
  for (const c of m.colliders || []) {
    if (x + 6 > c.x0 && x - 6 < c.x1 && y + 3 > c.y0 && y - 3 < c.y1) {
      const s = c.s, up = (s.up || 64) * (s.scale || 1);
      if (!(LOW_KINDS.has(s.kind) || up <= 26)) return false;
    }
  }
  return true;
}

// Horse and rider, in the four directions, with the rider bouncing to the gait.
export function drawRider(ctx, p, game) {
  const t = game.clock.real, mv = p.moving, run = p.running, z = p.z || 0;
  const color = p.mount.color || '#f2efe8';
  const bob = mv ? Math.abs(Math.sin(t * (run ? 15 : 10))) * (run ? 1.6 : 1) : 0;
  const ghost = game.ghostPass; // the see-through pass only needs the rider (the horse would wash them out)
  if (!ghost) shadowBlob(ctx, p.x, p.y + 1, 13 - z * 0.25, 4 - z * 0.08, 0.28);
  ctx.save(); ctx.translate(p.x, p.y - z);
  const dir = p.dir;
  if (!ghost) {
    if (dir === 2 || dir === 3) drawHorseSide(ctx, dir === 2 ? -1 : 1, t, color, mv, run, p.mount.mane);
    else drawHorseEnd(ctx, dir, t, color, mv, run, p.mount.mane, 'body');
  }
  // in the saddle: the rider's hips sit on the saddle (about 19 px up), legs astride the barrel
  const img = getFrame(p.look, dir, 'mount');
  const ry = (dir === 2 || dir === 3 ? 0.6 : 0) + (p.look.age === 'kid' ? -3 : 0);
  ctx.drawImage(img, -CHAR_W / 2 + (dir === 2 ? 1.5 : dir === 3 ? -1.5 : 0), -44 + ry - bob, CHAR_W, CHAR_H);
  if (dir === 0 && !ghost) drawHorseEnd(ctx, dir, t, color, mv, run, p.mount.mane, 'head'); // the head in front of the rider
  ctx.restore();
}
function drawHorseSide(ctx, flip, t, color, mv, run, mane) {
  const ph = t * (run ? 15 : 10), dark = shade(color, -0.28), mn = mane || shade(color, -0.55);
  const legA = mv ? Math.sin(ph) * (run ? 3.4 : 2.2) : 0, legB = mv ? Math.sin(ph + Math.PI) * (run ? 3.4 : 2.2) : 0;
  ctx.save(); ctx.scale(flip, 1);
  // far legs, body, near legs
  ctx.fillStyle = dark; leg(ctx, -8 + legB * 0.5, legB); leg(ctx, 7 + legA * 0.5, legA);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, -13, 11.5, 5.6, 0, 0, 7); ctx.fill();               // barrel
  ctx.beginPath(); ctx.ellipse(-8, -13.4, 5, 5.2, 0, 0, 7); ctx.fill();                // rump
  ctx.beginPath(); ctx.moveTo(6, -16); ctx.quadraticCurveTo(10, -24, 13, -26); ctx.lineTo(16, -23.5); ctx.quadraticCurveTo(13, -18, 11, -11); ctx.fill(); // neck
  ctx.beginPath(); ctx.ellipse(16.4, -23.2, 4.4, 2.3, 0.45, 0, 7); ctx.fill();         // head
  ctx.fillStyle = shade(color, -0.12); ctx.beginPath(); ctx.ellipse(19.2, -21.6, 1.8, 1.4, 0.45, 0, 7); ctx.fill(); // muzzle
  ctx.fillStyle = color; leg(ctx, -6 + legA * 0.5, legA); leg(ctx, 9 + legB * 0.5, legB);
  ctx.fillStyle = mn; ctx.beginPath(); ctx.moveTo(6.4, -17); ctx.quadraticCurveTo(9.6, -25.4, 13.2, -27.2); ctx.lineTo(12.2, -24); ctx.quadraticCurveTo(9.8, -21, 8.4, -16); ctx.fill(); // mane
  ctx.beginPath(); ctx.moveTo(14.4, -26.6); ctx.lineTo(13.6, -29); ctx.lineTo(15.6, -26.4); ctx.fill(); // ear
  ctx.strokeStyle = mn; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-12.4, -15); ctx.quadraticCurveTo(-16 - (mv ? Math.sin(ph) : 0), -10, -14.6, -4.5); ctx.stroke(); // tail
  ctx.fillStyle = '#1b1512'; ctx.beginPath(); ctx.arc(16.8, -24.2, 0.6, 0, 7); ctx.fill(); // eye
  // saddle and blanket
  ctx.fillStyle = '#7a2f2f'; ctx.fillRect(-4.6, -18.6, 9.2, 5.4);
  ctx.fillStyle = '#e8b04b'; ctx.fillRect(-4.6, -14.2, 9.2, 0.8);
  ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.ellipse(0, -18.4, 5, 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3e2a18'; ctx.fillRect(2.6, -21.2, 1.2, 3); // horn
  ctx.restore();
}
function leg(ctx, x, swing) {
  ctx.save(); ctx.translate(x, -10); ctx.rotate(swing * 0.06);
  ctx.fillRect(-0.9, 0, 1.9, 9.6); ctx.fillStyle = '#2b2420'; ctx.fillRect(-1, 8.6, 2.1, 1.4); ctx.restore();
}
// Seen from behind (going north) or from the front (going south).
function drawHorseEnd(ctx, dir, t, color, mv, run, mane, part) {
  const ph = t * (run ? 15 : 10), dark = shade(color, -0.28), mn = mane || shade(color, -0.55);
  const a = mv ? Math.sin(ph) * 1.6 : 0;
  if (part === 'head') { // going south: the head, low and in front, between the rider's knees
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, -15.5, 2.9, 4.2, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -10.8, 2.6, 3.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = shade(color, -0.12); ctx.beginPath(); ctx.ellipse(0, -8.2, 2.1, 1.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1b1512'; ctx.fillRect(-2.1, -13.4, 0.9, 0.9); ctx.fillRect(1.2, -13.4, 0.9, 0.9);
    ctx.fillStyle = mn; ctx.fillRect(-0.8, -19.6, 1.6, 4.4); ctx.beginPath(); ctx.moveTo(-2.2, -17.4); ctx.lineTo(-3, -20.4); ctx.lineTo(-1.2, -18); ctx.moveTo(2.2, -17.4); ctx.lineTo(3, -20.4); ctx.lineTo(1.2, -18); ctx.fill();
    ctx.fillStyle = shade(color, 0.3); ctx.fillRect(-0.5, -15.8, 1, 2.6); // blaze
    ctx.strokeStyle = '#3e2a18'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(-2.6, -10); ctx.lineTo(-4.6, -17); ctx.moveTo(2.6, -10); ctx.lineTo(4.6, -17); ctx.stroke(); // reins
    return;
  }
  ctx.fillStyle = dark; ctx.fillRect(-4.6, -10 + a, 2, 10 - a); ctx.fillRect(2.6, -10 - a, 2, 10 + a);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, -13.5, 6.4, 6.6, 0, 0, 7); ctx.fill();
  ctx.fillRect(-4.2, -10 - a, 2, 10 + a); ctx.fillRect(2.2, -10 + a, 2, 10 - a);
  ctx.fillStyle = '#2b2420'; for (const x of [-4.4, -4.2, 2.2, 2.6]) ctx.fillRect(x, -1.2, 2, 1.2);
  if (dir === 1) { // from behind: rump, tail, and the neck peeking above
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, -24, 2.6, 3.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = mn; ctx.fillRect(-0.8, -27, 1.6, 6);
    ctx.strokeStyle = mn; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(mv ? Math.sin(ph) * 1.5 : 0, -5, 0, -2.6); ctx.stroke();
  }
  ctx.fillStyle = '#7a2f2f'; ctx.fillRect(-5.6, -19.4, 11.2, 4.6); ctx.fillStyle = '#e8b04b'; ctx.fillRect(-5.6, -15.4, 11.2, 0.8);
}
