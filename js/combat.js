// Fights. Rare, ugly and never free: whoever starts one pays for it in the eyes of the pueblo; the
// police may come; injuries keep people at home or in the hospital for days. Blows are telegraphed
// (the arm goes up, a "!" appears): step back to dodge, hit while they recover. Blood is drawn the
// way a children's book would draw it — little red drops that land as tiny hearts — but it is there.
import { TILE, clamp, dist, pick } from './util.js';
import { Person, findPath } from './entities.js';
import { hasCharm, equipped } from './gear.js';

const R = Math.random;

export class Combat {
  constructor(game) {
    this.game = game; this.foe = null; this.parts = []; this.decals = []; this.warned = new Map();
    // drawn in world space on whatever map you are on
    const self = this;
    this.fx = { persistent: true, get map() { return game.map; }, update() {}, draw(ctx) { self.draw(ctx); } };
  }
  get active() { return !!this.foe; }
  attach() { if (!this.game.effects.includes(this.fx)) this.game.effects.unshift(this.fx); }

  // Something you did hurt somebody (a pebble, a stick). How they react depends on who they are.
  provoke(npc, how) {
    const g = this.game, def = npc.def || {}, look = npc.look || {};
    if (this.foe === npc) { this.hitFoe(how === 'palo' ? 2 : 1, how); return; }
    this.bleed(npc.x, npc.y - 22, 3);
    npc.bubble = { text: pick(R, ['¡Ay! ¿Qué te pasa?', '¡Oye! ¡Me dolió!', '¡Ey, tú! ¿Qué traes?']), t: 2.4 };
    g.sfx('hit');
    const kid = look.age === 'kid', elder = look.age === 'elder';
    if (def.family || def.story || def.fixed || def.politico || npc.talking) { g.addStat('corazon', -4); g.ui.toast(`${def.short || def.name || 'Le'} te mira con una tristeza que duele más que un regaño.`, 'bad'); return; }
    if (kid) { npc.bubble = { text: '¡Buaaa! ¡Le voy a decir a mi amá!', t: 3 }; g.addStat('corazon', -6); g.addStat('fama', -4); g.ui.toast('Le pegaste a un niño. En el pueblo eso no se olvida.', 'bad'); this.flee(npc); return; }
    if (elder || look.female) { g.addStat('corazon', -4); g.addStat('fama', -2); g.ui.toast(look.female ? '“¡Majadero! ¡Ahorita le hablo a la policía!”' : '“¡Muchacho grosero! ¡Tu abuelo se va a enterar!”', 'bad'); this.flee(npc); return; }
    // grown men: the first time they warn you; the second time, or if they have been drinking, it is a fight
    const drunk = npc.ctype === 'drinker' || /michelada|cantina|Remedio|Pantera/i.test(def.role || '') || (g.clock.hour >= 21 || g.clock.hour < 3);
    const warned = this.warned.get(npc.id);
    if (!drunk && !(warned && g.clock.real - warned < 30)) { this.warned.set(npc.id, g.clock.real); g.addStat('corazon', -2); npc.bubble = { text: '¡Otra y te parto la cara!', t: 3 }; return; }
    this.start(npc, { started: 'player', reason: how });
  }
  flee(npc) {
    if (!npc.def?.crowd) return;
    const g = this.game, ang = Math.atan2(npc.y - g.player.y, npc.x - g.player.x);
    const tx = (npc.x + Math.cos(ang) * 120) / TILE, ty = (npc.y + Math.sin(ang) * 90) / TILE;
    const p = findPath(npc.map, npc.x / TILE, npc.y / TILE, tx, ty, 800); if (p) { npc.path = p; npc.pathI = 1; npc.speed = 70; npc.expire = g.clock.minutes + 5; }
  }

  // opts: { started: 'player' | 'foe' | 'story', hp, dmg, onEnd(result), defend: name of someone you defend }
  start(npc, opts = {}) {
    const g = this.game;
    if (this.foe) return;
    this.attach();
    this.foe = npc; this.opts = opts;
    npc.fighting = true; npc.path = null; npc.pose = null; npc.talking = false;
    this.foeHP = opts.hp ?? (npc.look?.girth > 1.2 ? 7 : 5);
    this.foeMax = this.foeHP;
    this.state = 'approach'; this.t = 0.6; this.cool = 0; this.iframes = 0;
    g.ui.toast(opts.started === 'player' ? '¡Pelea! Tú empezaste. A: pegar · aléjate cuando levante el brazo.' : '¡Pelea! A: pegar · aléjate cuando levante el brazo.', 'bad');
    g.ui.showFoe?.(npc.def?.short || npc.name || 'Vecino', 1);
    g.sfx('hit');
  }

  update(dt) {
    const g = this.game;
    this.updateParts(dt);
    if (!this.foe) return;
    const f = this.foe, p = g.player;
    if (f.map !== g.map || f.dead) { this.end('gone'); return; }
    if (this.iframes > 0) this.iframes -= dt;
    if (this.cool > 0) this.cool -= dt;
    const d = dist(f.x, f.y, p.x, p.y);
    if (d > 260) { this.end('fled'); return; }
    f.face(p.x, p.y);
    this.t -= dt;
    switch (this.state) {
      case 'approach': {
        f.pose = null;
        if (d > 15) {
          const sp = 44, vx = (p.x - f.x) / d * sp, vy = (p.y - f.y) / d * sp;
          f.tryMove(vx, vy, dt, g.hardBlockers); f.moving = true;
        } else f.moving = false;
        if (d < 18 && this.t <= 0) { this.state = 'windup'; this.t = f.look?.age === 'elder' ? 0.75 : 0.55; f.pose = 'wave'; f.bubble = { text: '!', t: this.t }; }
        break;
      }
      case 'windup':
        f.moving = false;
        if (this.t <= 0) {
          this.state = 'recover'; this.t = 0.9; f.pose = null;
          if (d < 19) this.hurtPlayer(this.opts.dmg || 1, f);
          else { f.bubble = { text: pick(R, ['¡Ven acá!', '¡No te me escondas!', '¡Cobarde!']), t: 1.2 }; }
        }
        break;
      case 'stagger':
        f.moving = false;
        if (this.t <= 0) { this.state = 'approach'; this.t = 0.4; }
        break;
      case 'recover':
        f.moving = false;
        if (this.t <= 0) { this.state = 'approach'; this.t = 0.3 + R() * 0.5; }
        break;
    }
  }

  // A: punch (or swing the stick if you carry it). Works in any direction at close range.
  playerAttack(hand = equipped(this.game, 'hand')) {
    const g = this.game, p = g.player, f = this.foe;
    if (!f || this.cool > 0) return;
    this.cool = 0.38;
    p.face(f.x, f.y); p.pose = 'wave'; setTimeout(() => { if (p.pose === 'wave') p.pose = null; }, 180);
    const reach = hand === 'palo' ? 24 : 18;
    if (dist(p.x, p.y, f.x, f.y) > reach) { g.sfx('tap'); return; }
    this.hitFoe(hand === 'palo' ? 2 : 1, hand || 'puño');
  }
  hitFoe(dmg, how) {
    const g = this.game, f = this.foe, p = g.player;
    if (!f) return;
    // hitting while they wind up interrupts them (and hurts a little more)
    if (this.state === 'windup') { dmg += 1; f.bubble = null; }
    this.foeHP -= dmg; g.sfx('hit'); g.shake = 3;
    const a = Math.atan2(f.y - p.y, f.x - p.x);
    f.tryMove(Math.cos(a) * 260, Math.sin(a) * 200, 0.04, g.hardBlockers);
    this.bleed(f.x, f.y - 24, 2 + dmg * 2);
    this.state = 'stagger'; this.t = 0.4; f.pose = null;
    g.ui.showFoe?.(f.def?.short || f.name, clamp(this.foeHP / this.foeMax, 0, 1));
    if (this.foeHP <= 0) this.end('win');
  }
  hurtPlayer(n, from) {
    const g = this.game, p = g.player;
    if (this.iframes > 0) return;
    if (hasCharm(g, 'rosario')) { n = n >= 2 ? Math.ceil(n / 2) : (R() < 0.5 ? 0 : 1); if (!n) { g.ui.toast('📿 El golpe apenas te roza. “Te cuida la Virgen”, decía la monja.', 'good'); return; } }
    g.state.hp = Math.max(0, (g.state.hp ?? 12) - n); this.iframes = 0.7;
    g.sfx('hurt'); g.shake = 5; g.hurtFlash = 0.35;
    const a = from ? Math.atan2(p.y - from.y, p.x - from.x) : 0;
    p.tryMove(Math.cos(a) * 300, Math.sin(a) * 240, 0.04, g.entities);
    this.bleed(p.x, p.y - 24, 3 + n * 2);
    p.bubble = { text: pick(R, ['¡Ay!', '¡Uf!', '¡Auch!']), t: 0.8 };
    if (g.state.hp <= 0) this.knockedOut();
  }

  end(result) {
    const g = this.game, f = this.foe, o = this.opts || {};
    this.foe = null; g.ui.showFoe?.(null);
    if (!f) return;
    f.fighting = false; f.pose = null;
    if (result === 'win') {
      f.down = true; f.downT = 0; f.bubble = { text: 'Ya… ya estuvo…', t: 3 };
      setTimeout(() => { f.down = false; f.pose = null; f.bandaged = true; if (f.def?.crowd) { f.expire = g.clock.minutes + 3; } }, 14000);
      if (f.def && !f.def.crowd) { g.state.injured ||= {}; g.state.injured[f.def.id] = g.clock.dayIndex + 2; }
      g.state.fights = (g.state.fights || 0) + 1;
      if (o.started === 'player') { g.addStat('corazon', -6); g.addStat('fama', -3); g.ui.toast('Ganaste la pelea. Nadie te aplaude.', 'bad'); }
      else if (o.defend) { g.addStat('corazon', 3); g.addStat('fama', 5); g.ui.toast(`Defendiste a ${o.defend}. El pueblo lo va a contar.`, 'good'); }
      else { g.addStat('fama', 1); g.ui.toast('Ganaste la pelea. Te tiemblan las manos.', ''); }
      g.flags.lastFightDay = g.clock.dayIndex;
      if (o.started === 'player') this.maybePolice();
    } else if (result === 'fled') g.ui.toast('Se acabó el pleito: cada quien por su lado.', '');
    o.onEnd?.(result);
    g.save();
  }
  // A fight in the open, in front of people, brings the municipal police sometimes.
  maybePolice() {
    const g = this.game;
    if (g.map.id !== 'town') return;
    const witnesses = g.people.filter(e => e !== g.player && dist(e.x, e.y, g.player.x, g.player.y) < 150).length;
    if (witnesses < 4 || R() > 0.6) return;
    setTimeout(() => g.dialog.scene(async d => {
      const cmd = { name: 'Comandante Barajas', role: 'policía municipal', look: g.npcs.lookFor(g.npcs.defs.find(x => x.id === 'comandante') || { id: 'comandante' }) };
      await d.narrate('Una patrulla se detiene con la sirena apagada. Se baja el Comandante Barajas, despacio, como quien ya vio de todo.');
      await d.say(cmd, `A ver, joven ${g.state.name}. Me dicen que usted empezó. Son trescientos pesos de multa por riña en la vía pública… o una noche en los separos del Palacio. Usted escoge.`);
      const c = await d.choose([{ text: 'Pagar la multa ($300)', value: 'pay', tag: 'money' }, { text: 'Pasar la noche en los separos', value: 'jail', tag: 'honest' }]);
      if (c.value === 'pay' && g.state.money >= 300) { g.addMoney(-300); await d.say(cmd, 'Que no se repita. Su abuela es buena gente; no le haga pasar vergüenzas.'); }
      else {
        if (c.value === 'pay') await d.say(cmd, 'No le alcanza. Pues vámonos: separos.');
        d.end();
        g.transition(() => { g.clock.advanceTo(7); g.returnStack = []; g.changeMap('town', 170.5, 105.4, 0, { instant: true }); g.addStat('fama', -4); g.state.hp = g.state.hpMax || 12; g.ui.toast('Pasaste la noche en los separos del Palacio. Huele a cloro y a arrepentimiento.', 'bad'); });
      }
    }), 1200);
  }
  // Out cold: you wake up in the hospital (or, outside town, where somebody carried you).
  knockedOut() {
    const g = this.game, f = this.foe, o = this.opts || {};
    this.foe = null; g.ui.showFoe?.(null);
    if (f) { f.fighting = false; f.pose = null; f.bubble = { text: 'Y no te vuelvas a meter conmigo.', t: 3 }; }
    o.onEnd?.('lose');
    g.flags.knockedOutDay = g.clock.dayIndex;
    g.transition(() => {
      g.clock.minutes += 5 * 60;
      const bill = Math.min(g.state.money, 250);
      g.addMoney(-bill);
      g.state.hp = Math.ceil((g.state.hpMax || 12) / 2);
      g.returnStack = [{ map: 'town', x: 224.5 * TILE, y: 140.2 * TILE, dir: 0 }];
      g.changeMap('hospital', 9, 9.5, 1, { instant: true });
      g.addStat('fama', -2);
      g.ui.toast(`Despiertas en el hospital con la ceja cosida. La cuenta: $${bill}.`, 'bad');
    });
  }

  // ---- blood, sparks and the marks they leave ------------------------------------------------------
  bleed(x, y, n) {
    for (let i = 0; i < n; i++) this.parts.push({ map: this.game.map, x, y, z: 0, vx: (R() - 0.5) * 60, vy: (R() - 0.5) * 30, vz: -40 - R() * 40, life: 1.2, kind: R() < 0.3 ? 'star' : 'drop' });
  }
  updateParts(dt) {
    for (const q of this.parts) {
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt * 0.3; q.vz += 220 * dt; q.z += q.vz * dt;
      if (q.kind === 'drop' && q.z > 24 && !q.landed) { q.landed = true; q.life = 0; this.decals.push({ map: q.map, x: q.x, y: q.y + 22, t: 40, r: 0.9 + R() * 0.9, heart: R() < 0.5 }); }
    }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const dcl of this.decals) dcl.t -= dt;
    this.decals = this.decals.filter(dcl => dcl.t > 0).slice(-80);
  }
  draw(ctx) {
    const map = this.game.map;
    for (const dcl of this.decals) {
      if (dcl.map !== map) continue;
      ctx.globalAlpha = clamp(dcl.t / 10, 0, 0.85);
      ctx.fillStyle = '#b3201f';
      if (dcl.heart) heart(ctx, dcl.x, dcl.y, dcl.r * 1.3);
      else { ctx.beginPath(); ctx.ellipse(dcl.x, dcl.y, dcl.r * 1.4, dcl.r * 0.7, 0, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    for (const q of this.parts) {
      if (q.map !== map) continue;
      if (q.kind === 'star') { ctx.fillStyle = `rgba(255,250,220,${clamp(q.life, 0, 1)})`; star(ctx, q.x, q.y + q.z * 0.2, 1.8); }
      else { ctx.fillStyle = '#d0302b'; ctx.beginPath(); ctx.ellipse(q.x, q.y + q.z, 0.9, 1.3, 0, 0, 7); ctx.fill(); }
    }
    // the foe's health over their head
    const f = this.foe;
    if (f && f.map === map) {
      const w = 18, k = clamp(this.foeHP / this.foeMax, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(f.x - w / 2 - 0.5, f.y - 54, w + 1, 3);
      ctx.fillStyle = '#e04848'; ctx.fillRect(f.x - w / 2, f.y - 53.5, w * k, 2);
    }
  }
}

function heart(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y + r);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.4);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r); ctx.fill();
}
function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.fill();
}

// Bandage drawn on someone who got hurt (until they heal).
export function drawBandage(ctx, e) {
  const k = e.look?.body || 1;
  ctx.fillStyle = '#f7f3ea'; ctx.fillRect(e.x - 3.2, e.y - 40 * k, 6.4, 1.5);
  ctx.fillStyle = '#d0302b'; ctx.fillRect(e.x + 1.2, e.y - 40 * k, 1, 1.5);
}

// Hearts in the HUD: 2 per heart, like you remember from the old games.
export function heartsHTML(hp, max) {
  let s = '';
  for (let i = 0; i < max / 2; i++) { const v = hp - i * 2; s += `<i class="ht ${v >= 2 ? 'full' : v === 1 ? 'half' : 'empty'}"></i>`; }
  return s;
}
