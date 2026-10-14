// Things you carry and use with your hands: the slingshot, a stick, a trompo, and what you wear for
// luck (the rosary of the nuns). One thing in the hand, one at the neck. F (or the 🎯 button) uses
// what is in your hand.
import { TILE, clamp, dist } from './util.js';
import { ITEMS } from './data/items.js';
import { Person, Animal } from './entities.js';

export const SLOTS = { hand: 'En la mano', charm: 'Al cuello' };

export function equipSlot(id) { return ITEMS[id]?.equip || null; }
export function equipped(game, slot) { const e = game.state.equip || {}; return e[slot] && game.hasItem(e[slot]) ? e[slot] : null; }
export function hasCharm(game, id) { return equipped(game, 'charm') === id; }

export function equip(game, id) {
  const slot = equipSlot(id); if (!slot || !game.hasItem(id)) return;
  game.state.equip ||= { hand: null, charm: null };
  game.state.equip[slot] = game.state.equip[slot] === id ? null : id;
  const it = ITEMS[id];
  game.ui.toast(game.state.equip[slot] ? `${it.ico} ${it.name}: ${slot === 'hand' ? 'en la mano (F o 🎯 para usarlo)' : 'al cuello'}` : `Guardaste ${it.name} en el morral.`, 'good');
  game.sfx('select'); game.ui.refreshItemButton?.(); game.save();
}

// ---- using what is in your hand --------------------------------------------------------------
export function useHand(game) {
  if (game.gearCool > 0) return;
  const id = equipped(game, 'hand');
  if (game.combat?.active) { game.combat.playerAttack(id); return; }
  if (!id) { game.ui.toast('No traes nada en la mano. Equipa algo en el Morral (I).', ''); game.gearCool = 0.6; return; }
  if (id === 'resortera') return shoot(game);
  if (id === 'palo') return swing(game);
  if (id === 'trompo' || id === 'trompo_mio') { game.gearCool = 1; return game.trompoHere(); }
}

const FACE = [[0, 1], [0, -1], [-1, 0], [1, 0]];

function shoot(game) {
  const p = game.player, [fx, fy] = FACE[p.dir];
  game.gearCool = 0.45; game.sfx('select');
  game.effects.push(new Pebble(game, p.x + fx * 6, p.y - 10 + fy * 4, fx, fy));
}

function swing(game) {
  const p = game.player, [fx, fy] = FACE[p.dir];
  game.gearCool = 0.5; p.pose = 'wave'; setTimeout(() => { if (p.pose === 'wave') p.pose = null; }, 220);
  const hx = p.x + fx * 14, hy = p.y + fy * 10;
  game.effects.push(new Swoosh(game, hx, hy - 8, p.dir));
  // fruit trees give fruit to a good whack; people do not like being whacked
  if (hitTree(game, hx, hy, 'palo')) return;
  const who = hitPerson(game, hx, hy, 12);
  if (who) game.combat.provoke(who, 'palo');
}

// A pebble flying until it hits something or drops.
class Pebble {
  constructor(game, x, y, fx, fy) { this.map = game.map; this.x = x; this.y = y; this.vx = fx * 260; this.vy = fy * 260; this.z = 10; this.life = 0.5; }
  update(dt, game) {
    this.life -= dt;
    const steps = 3;
    for (let k = 0; k < steps && !this.done; k++) {
      this.x += this.vx * dt / steps; this.y += this.vy * dt / steps;
      const gy = this.y + this.z; // the ground point under the pebble
      if (hitCans(game, this.x, gy)) { this.done = true; break; }
      if (hitTree(game, this.x, gy, 'resortera')) { this.done = true; break; }
      const a = game.entities.find(e => e instanceof Animal && e.map === this.map && !e.hidden && Math.abs(e.x - this.x) < 8 && Math.abs(e.y - gy) < 7);
      if (a) { this.done = true; hitAnimal(game, a); break; }
      const who = hitPerson(game, this.x, gy, 6);
      if (who) { this.done = true; game.combat.provoke(who, 'resortera'); break; }
      if (this.map.blocked(this.x, gy, 1, 1)) { this.done = true; game.sfx('tap'); break; }
    }
    if (this.life <= 0 || this.done) game.effects = game.effects.filter(e => e !== this);
  }
  draw(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(this.x, this.y + this.z, 1.4, 0.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a8478'; ctx.beginPath(); ctx.arc(this.x, this.y, 1.2, 0, 7); ctx.fill();
  }
}
class Swoosh {
  constructor(game, x, y, dir) { this.map = game.map; this.x = x; this.y = y; this.dir = dir; this.t = 0; }
  update(dt, game) { this.t += dt; if (this.t > 0.2) game.effects = game.effects.filter(e => e !== this); }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate([Math.PI / 2, -Math.PI / 2, Math.PI, 0][this.dir]);
    ctx.strokeStyle = `rgba(255,255,255,${0.8 - this.t * 4})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(-6, 0, 9, -0.9 + this.t * 6, 0.9 + this.t * 6); ctx.stroke(); ctx.restore();
  }
}

function hitPerson(game, x, y, r) {
  return game.entities.find(e => e instanceof Person && e !== game.player && e.map === game.map && !e.hidden && !e.down && Math.abs(e.x - x) < r && y > e.y - 30 && y < e.y + 4) || null;
}
function hitAnimal(game, a) {
  game.sfx('bark');
  if (a.kind === 'pigeon') { a.flyT = 1.6; a.fx = (Math.random() - 0.5) * 80; return; }
  if (a.kind === 'dog' || a.dog) { a.bubbleT = 1.2; a.scared = 3; game.addStat('corazon', -3); game.ui.toast('El perro chilla y se echa a correr. Nadie que te vio te lo va a perdonar pronto.', 'bad'); return; }
  if (a.kind === 'cow' || a.kind === 'horse') { a.target = null; a.wait = 0; game.ui.toast(a.kind === 'cow' ? 'La vaca te mira, ofendida, y sigue rumiando.' : 'El caballo relincha y se aleja al trote.', ''); }
}

// Fruit trees: guayabos, mangos, naranjos and limones. A hit has a fair chance to drop one.
const FRUIT = { guayabo: 'guayaba', mango: 'mango', naranjo: 'naranja', limon: 'limon', aguacate: 'aguacate' };
function hitTree(game, x, y, how) {
  // the canopy, the trunk, or the ground just in front of the trunk (where you stand to whack it)
  const s = game.map.sprites.find(s => s.kind === 'tree' && Math.abs(s.x - x) < 13 && y > s.y - 40 * (s.size || 1) && y < s.y + 14);
  if (!s) return false;
  const fruit = FRUIT[s.tree] || (s.fruit ? s.fruit : null);
  game.sfx('tap');
  if (!fruit) { if (how === 'palo') game.ui.toast('Las hojas se sacuden. Este árbol no da fruta.', ''); return true; }
  const key = 'fruitDay_' + Math.round(s.x) + '_' + Math.round(s.y);
  if (game.flags[key] === game.clock.dayIndex) { game.ui.toast('Ya no le queda fruta a la mano. Mañana.', ''); return true; }
  if (Math.random() < (how === 'palo' ? 0.7 : 0.45)) {
    game.flags[key] = game.clock.dayIndex;
    game.dropItem(fruit, s.x + (Math.random() - 0.5) * 14, s.y + 6);
    game.ui.toast(`¡Cayó una ${ITEMS[fruit]?.name.toLowerCase() || fruit}!`, 'good');
  }
  return true;
}

// Cans on a wall (target practice behind the stadium, and at the Casa de la Cultura's patio).
function hitCans(game, x, y) {
  const s = game.map.sprites.find(s => s.kind === 'botes' && Math.abs(s.x - x) < (s.fw || 40) / 2 + 2 && y > s.y - 26 && y < s.y + 2);
  if (!s) return false;
  s.down ||= [];
  const n = s.n || 5, w = s.fw || 40;
  const i = clamp(Math.floor((x - (s.x - w / 2)) / (w / n)), 0, n - 1);
  if (s.down[i]) { game.sfx('tap'); return true; }
  s.down[i] = true; s.cacheKey = null; game.sfx('clink');
  const hits = s.down.filter(Boolean).length;
  if (hits >= n) {
    game.state.botes = (game.state.botes || 0) + 1;
    const prize = game.state.botes === 1 ? 'Primera vez que tumbas los cinco. Un niño te aplaude.' : `¡Los cinco otra vez! (${game.state.botes})`;
    game.ui.toast('🥫 ' + prize, 'good'); game.addStat('fama', 1);
    if (game.state.botes === 3 && !game.flags.puntería) { game.flags.puntería = true; game.ui.toast('Ganaste fama de buena puntería: “el de la resortera”.', 'soul'); }
    setTimeout(() => { s.down = []; s.cacheKey = null; }, 2500);
  }
  return true;
}

// The equipped-item button on touch screens shows what is in your hand.
export function itemButtonLabel(game) {
  const id = equipped(game, 'hand');
  return id ? ITEMS[id].ico : '✋';
}
