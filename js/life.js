// Life in Jiquilpan beyond the main story (in the spirit of Fable): relationships with the people you
// meet, clothes, buying land and building a house with albañiles, and running little businesses.
import { TILE, pick, clamp } from './util.js';
import { G } from './world.js';
import { ITEMS } from './data/items.js';
import { GameMap } from './world.js';
import { sprite, area, light } from './data/build.js';

const R = Math.random;

// ---------------------------------------------------------------------------------------------------
// Relationships
export const REL_LEVELS = [
  { min: -100, name: 'Enemistad', ico: '💢' },
  { min: -40, name: 'Mal visto', ico: '😒' },
  { min: -10, name: 'Conocido', ico: '🙂' },
  { min: 20, name: 'Cuate', ico: '🤝' },
  { min: 45, name: 'Amigo', ico: '😊' },
  { min: 75, name: 'Compadre', ico: '🫂' },
];
export function relLevel(v) { let L = REL_LEVELS[0]; for (const l of REL_LEVELS) if (v >= l.min) L = l; return L; }
export function relKey(npc) { const d = npc.def || {}; return (!d.id || d.crowd) ? null : d.id; }
export function getRel(g, id) {
  if (!g.state.rel) g.state.rel = {};
  if (!g.state.rel[id]) g.state.rel[id] = { v: 0, met: g.clock.dayIndex, day: -1, comp: -1, joke: -1, gift: -1, favor: -1, date: -1, novios: false, notes: [] };
  return g.state.rel[id];
}
// Change how someone feels about you; announces level changes like Fable's "X likes you".
export function addRel(g, npc, dv, silent) {
  const id = relKey(npc); if (!id) return 0;
  const r = getRel(g, id), before = relLevel(r.v);
  r.v = clamp(r.v + dv, -100, 100);
  const after = relLevel(r.v), name = npc.def?.short || npc.def?.name || npc.name;
  if (after !== before && !silent) {
    const up = after.min > before.min;
    const lvl = r.novios ? (npc.look?.female ? 'tu novia' : 'tu novio') : after.name.toLowerCase();
    g.ui.toast(`${after.ico} ${cap(name)} ${up ? 'ahora te considera' : 'ya te ve como'}: ${lvl}`, up ? 'good' : 'bad');
  }
  return dv;
}
export function relOf(g, id) { return g.state.rel?.[id]?.v ?? 0; }
export function noteRel(g, npc, text) { const id = relKey(npc); if (!id) return; const r = getRel(g, id); if (!r.notes.includes(text)) { r.notes.push(text); if (r.notes.length > 6) r.notes.shift(); } }
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// How much a gift pleases someone
export function giftValue(def, id) {
  const it = ITEMS[id]; if (!it) return 0;
  if (it.type === 'quest' || it.type === 'key') return null;
  if (def.likes && def.likes.includes(id)) return 14;
  if (def.dislikes && def.dislikes.includes(id)) return -6;
  const kid = def.look?.age === 'kid';
  if (id === 'mezcal') return kid ? -8 : def.look?.age === 'elder' ? 10 : 6;
  if (id === 'ramo') return def.romance ? 12 : 7;
  if (id === 'rebozo_seda') return def.look?.female ? 22 : 12;
  if (it.type === 'food' || it.type === 'drink') return kid && id === 'dulces' ? 12 : 5;
  return 3;
}

// ---------------------------------------------------------------------------------------------------
// Clothes: bought in shops, kept in the wardrobe, worn from the “Yo” tab or the wardrobe at home.
export const CLOTHES = {
  camisa_cuadros: { slot: 'top', name: 'Camisa de cuadros', ico: '👕', set: { top: 'plaid', topColor: '#7a2f2f' } },
  guayabera: { slot: 'top', name: 'Guayabera blanca', ico: '👔', set: { top: 'guayabera', topColor: '#f5f1e6' } },
  playera_chivas: { slot: 'top', name: 'Jersey rojiblanco', ico: '⚽', set: { top: 'jersey', topColor: '#c0392b' } },
  sudadera_anil: { slot: 'top', name: 'Sudadera añil', ico: '🧥', set: { top: 'hoodie', topColor: '#3d3a8c' } },
  camisa_bordada: { slot: 'top', name: 'Camisa bordada', ico: '🪡', set: { top: 'bordado', topColor: '#f7f3ea', embroidery: '#e84a6a' } },
  polo_verde: { slot: 'top', name: 'Polo verde', ico: '👕', set: { top: 'polo', topColor: '#27ae60' } },
  jeans: { slot: 'bottom', name: 'Pantalón de mezclilla', ico: '👖', set: { bottom: 'jeans', bottomColor: '#2f4b7c' } },
  pantalon_vestir: { slot: 'bottom', name: 'Pantalón de vestir', ico: '👖', set: { bottom: 'pants', bottomColor: '#2d3436' } },
  shorts: { slot: 'bottom', name: 'Shorts', ico: '🩳', set: { bottom: 'shorts', bottomColor: '#34495e' } },
  gorra: { slot: 'hat', name: 'Gorra', ico: '🧢', set: { hat: 'cap', capColor: '#1f4fa0' } },
  texana: { slot: 'hat', name: 'Texana', ico: '🤠', set: { hat: 'texana', hatColor: '#f2ead8' } },
  sombrero: { slot: 'hat', name: 'Sombrero de palma', ico: '👒', set: { hat: 'sombrero', hatColor: '#e8d29a' } },
  sin_sombrero: { slot: 'hat', name: 'Sin sombrero', ico: '🙆', set: { hat: null }, free: true },
  botas: { slot: 'shoes', name: 'Botas vaqueras', ico: '👢', set: { shoes: 'boots', shoeColor: '#6b4a2e' } },
  huaraches: { slot: 'shoes', name: 'Huaraches de Sahuayo', ico: '🩴', set: { shoes: 'huaraches', shoeColor: '#8a5a34' } },
  tenis: { slot: 'shoes', name: 'Tenis blancos', ico: '👟', set: { shoes: 'sneakers', shoeColor: '#f5f5f5' } },
  corte_casquete: { slot: 'hair', name: 'Casquete corto', ico: '💈', set: { hair: 'buzz' } },
  corte_peinado: { slot: 'hair', name: 'Peinado de raya', ico: '💈', set: { hair: 'slick' } },
  corte_parado: { slot: 'hair', name: 'Pelo parado', ico: '💈', set: { hair: 'spiky' } },
  corte_normal: { slot: 'hair', name: 'Corte de siempre', ico: '💈', set: { hair: 'short' } },
  bigote: { slot: 'face', name: 'Bigote', ico: '🥸', set: { mustache: true, beard: null } },
  barba: { slot: 'face', name: 'Barba cerrada', ico: '🧔', set: { mustache: true, beard: 'full' } },
  candado: { slot: 'face', name: 'Candado', ico: '🧔', set: { mustache: true, beard: 'goatee' } },
  rasurado: { slot: 'face', name: 'Bien rasurado', ico: '🪒', set: { mustache: false, beard: null } },
};
export function wearOutfit(g, id, announce = true) {
  const c = CLOTHES[id]; if (!c) return;
  if (!g.state.wardrobe) g.state.wardrobe = [];
  if (!g.state.wardrobe.includes(id)) g.state.wardrobe.push(id);
  if (!g.state.outfit) g.state.outfit = {};
  g.state.outfit[c.slot] = id;
  applyOutfit(g);
  if (announce) g.ui.toast(`${c.ico} Te pusiste: ${c.name}`, 'good');
}
export function applyOutfit(g) {
  const L = g.player.look;
  for (const id of Object.values(g.state.outfit || {})) { const c = CLOTHES[id]; if (c) Object.assign(L, c.set); }
  if (L.hat === 'cap' && !L.capColor) L.capColor = '#1f4fa0';
  g.player.cacheKey = null;
}

// ---------------------------------------------------------------------------------------------------
// Land and houses
export const LOTS = [
  { id: 'L1', name: 'Terreno en la Colonia del Estadio', x: 240, y: 205, w: 8, h: 7, price: 3200 },
  { id: 'L2', name: 'Terreno junto al Estadio', x: 250, y: 205, w: 8, h: 7, price: 3400 },
  { id: 'L3', name: 'Terreno junto al Río Jiquilpan', x: 266, y: 198, w: 9, h: 8, price: 4200 },
  { id: 'L4', name: 'Terreno con vista al Cerro', x: 280, y: 198, w: 9, h: 8, price: 4500 },
  { id: 'L5', name: 'Terreno en la Colonia del Panteón', x: 4, y: 0, w: 0, h: 0, price: 0, hidden: true },
];
export const STYLES = {
  colonial: { name: 'Colonial del centro', desc: 'Blanca, con guardapolvo rojo, marcos de cantera y balcón de herrería.', wall: '#f4efe4', band: '#8e2f24', frame: '#a64a3a', roof: '#b0583d' },
  adobe: { name: 'Adobe y teja', desc: 'Muros de adobe, techo de teja y un portalito con postes de madera, como en los ranchos.', wall: '#d9c09a', band: '#8e5a3a', frame: '#6b4a30', roof: '#a24f37' },
  ladrillo: { name: 'Ladrillo aparente', desc: 'Moderna: ladrillo rojo, losa plana, ventanales y tinaco.', wall: '#b8664a', band: '#6e3b2c', frame: '#2d2d2d', roof: '#cfc6b6' },
  colores: { name: 'De colores', desc: 'Naranja, rosa o amarillo, como las casas de la colonia, con macetas en la ventana.', wall: '#f0a35e', band: '#b8452f', frame: '#f4f1ea', roof: '#cfc6b6' },
};
export const STAGES = [
  { id: 'cimientos', name: 'Cimientos', cost: 700, days: 1, desc: 'Zanjas, piedra y cemento.' },
  { id: 'muros', name: 'Muros', cost: 1400, days: 2, desc: 'Levantar las paredes y los castillos.' },
  { id: 'techo', name: 'Techo', cost: 1100, days: 1, desc: 'Colar la losa o poner la teja.' },
  { id: 'acabados', name: 'Fachada y acabados', cost: 900, days: 1, desc: 'Enjarre, pintura, puertas y ventanas.' },
];
export const EXTRAS = {
  barandal: { name: 'Barandal de herrería', cost: 300, days: 0, desc: 'Un barandal con macetas al frente.' },
  jardin: { name: 'Jardín con jacaranda', cost: 250, days: 0, desc: 'Una jacaranda para que florezca en marzo.' },
  piso2: { name: 'Segundo piso', cost: 2200, days: 2, desc: 'Un cuarto más arriba; lo puedes rentar.' },
  local: { name: 'Local al frente', cost: 1200, days: 1, desc: 'Una cortina metálica para poner un negocio propio.' },
};
export function propOf(g, lotId) { return (g.state.properties || []).find(p => p.id === lotId); }

// Put the lots and whatever you have built on them into the town map.
export function applyProperties(g, map) {
  if (map.id !== 'town') return;
  map.sprites = map.sprites.filter(s => !s.lotSprite);
  if (map.baseSprites) map.baseSprites = map.baseSprites.filter(s => !s.lotSprite);
  map.doors = map.doors.filter(d => !d.myHouse);
  const add = (s) => { s.lotSprite = true; map.sprites.push(s); if (map.baseSprites) map.baseSprites.push(s); return s; };
  for (const L of LOTS) {
    if (L.hidden) continue;
    const p = propOf(g, L.id);
    // clear the lot
    for (let y = L.y; y < L.y + L.h; y++) for (let x = L.x; x < L.x + L.w; x++) { map.setSolid(x, y, 1, 1, 0); if (map.get(x, y) === G.ROOF) map.set(x, y, G.DIRT); }
    if (!p) { add({ kind: 'seVende', x: (L.x + L.w / 2) * TILE, y: (L.y + L.h - 0.4) * TILE, w: 40, up: 34, collide: [-6, -3, 12, 3], interact: 'lote', lot: L.id, price: L.price }); continue; }
    const stage = p.stage || 0;
    const building = p.work && p.work.ready > g.clock.dayIndex;
    add({ kind: 'miCasa', x: (L.x + L.w / 2) * TILE, y: (L.y + L.h) * TILE, fw: L.w * TILE, fd: (L.h - 1) * TILE, w: L.w * TILE + 40, up: L.h * TILE + 80,
      stage, style: p.style, extras: (p.extras || []).join(','), working: building, interact: 'obra', lot: L.id });
    if (stage >= 2) {
      map.setSolid(L.x, L.y, L.w, L.h - 1, 1);
      if (stage >= 4) map.doors.push({ x: Math.floor(L.x + L.w / 2), y: L.y + L.h - 2, w: 1, h: 1, to: 'mi_casa_' + L.id, label: 'Tu casa', myHouse: true });
    }
    if (building) add({ kind: 'albaniles', x: (L.x + 1) * TILE, y: (L.y + L.h + 0.2) * TILE, w: 40, up: 34 });
  }
  map.finalize();
}

// Interior of the house you built
export function buildMyHouse(g, id) {
  const lotId = id.replace('mi_casa_', ''), p = propOf(g, lotId);
  const st = STYLES[p?.style] || STYLES.colonial;
  const w = p?.extras?.includes('piso2') ? 18 : 14, h = 11;
  const m = new GameMap(id, 'Tu casa', w, h, { fill: p?.style === 'adobe' ? G.FLOOR_WOOD : G.FLOOR_TILE, interior: true });
  m.ambient = 'interior'; m.dim = 0.05;
  m.fill(0, 0, w, 3, G.WALL); m.setSolid(0, 0, w, 3);
  m.structures.push({ kind: 'backwall', x: 0, y: 0, w, h: 3, color: st.wall === '#b8664a' ? '#efe6d6' : st.wall, band: st.band, tiles: p?.style === 'colonial', deco: [{ kind: 'window', x: 2 }, { kind: 'frame', x: 6, color: '#c9b89a' }, { kind: 'cross', x: w - 4 }], layer: 1 });
  for (let y = 0; y < h; y++) { m.set(0, y, G.VOID); m.set(w - 1, y, G.VOID); }
  m.setSolid(0, 0, 1, h); m.setSolid(w - 1, 0, 1, h);
  for (let x = 0; x < w; x++) { m.set(x, h - 1, G.VOID); m.setSolid(x, h - 1, 1, 1); }
  const ex = Math.floor(w / 2);
  m.set(ex, h - 1, G.FLOOR_TILE); m.setSolid(ex, h - 1, 1, 1, 0);
  m.exits.push({ x: ex, y: h - 1, w: 1, h: 1, to: '__back', label: 'Salir' });
  m.structures.push({ kind: 'doormat', x: ex, y: h - 2, w: 1, h: 1, layer: 2 });
  m.structures.push({ kind: 'rug', x: 4, y: 5, w: 5, h: 3, color: '#2b3f8f', layer: 2 });
  const it = (kind, x, y, props = {}) => sprite(m, kind, x, y, { w: 40, up: 40, ...props });
  it('bed', w - 3, 5.2, { w: 30, up: 30, blanket: '#2b3f8f', collide: [-12, -20, 24, 20], interact: 'cama' });
  it('ropero', 3, 3.4, { w: 24, up: 40, collide: [-10, -5, 20, 5], interact: 'wardrobe' });
  it('altarCasa', 7, 2.7, { w: 30, up: 40, collide: [-10, -4, 20, 4], interact: 'altar_casa' });
  it('table', 6.5, 8, { w: 30, up: 20, cloth: '#e8e2d2', items: true, collide: [-9, -8, 18, 8] });
  it('maceta', 1.8, 8.6, { w: 14, up: 20, seed: 3 });
  if (p?.extras?.includes('piso2')) it('counter', 14, 8.4, { fw: 30, w: 40, up: 30, color: '#8a6a48', sign: 'ESCALERA AL 2º PISO', collide: [-15, -12, 30, 12] });
  light(m, w / 2, 5, 120, '#ffe2a8');
  m.spawns = { entry: { x: ex + 0.5, y: h - 2 } };
  area(m, 'Tu casa', 0, 0, w, h, 'interior');
  m.structures.sort((a, b) => (a.layer || 0) - (b.layer || 0));
  m.finalize();
  return m;
}

// ---------------------------------------------------------------------------------------------------
// Businesses
export const BUSINESSES = {
  elotes: { name: 'Puesto de elotes y esquites', ico: '🌽', price: 1200, where: 'Jardín de la Paz', desc: 'Un carrito con su lumbre. Te lo traspasa Don Tacho, que ya se cansó.', income: (g, d) => 70 + (d === 5 ? 60 : d === 0 ? 40 : 0) },
  micheladas: { name: 'Micheladas del Bosque (socio)', ico: '🍺', price: 2600, where: 'Bosque', desc: 'Tavo te hace socio: pones la inversión, él atiende. Se vende más en fin de semana.', income: (g, d) => 60 + (d === 5 || d === 6 ? 160 : d === 0 ? 120 : 0) },
  taxi: { name: 'Un taxi en el sitio de Abasolo', ico: '🚕', price: 6000, where: 'Sitio de Abasolo', desc: 'Un Tsuru blanco con verde. Lo maneja el sobrino de Chuy; tú pones el carro.', income: () => 210 },
  cuarto: { name: 'Rentar el cuarto de arriba', ico: '🛏️', price: 0, where: 'Tu casa', desc: 'Lo rentan maestros que vienen a la Unidad de la UNAM.', income: () => 90, needs: 'piso2' },
  tiendita: { name: 'Tiendita en tu local', ico: '🏪', price: 800, where: 'Tu casa', desc: 'Refrescos, dulces, papas y chismes.', income: (g, d) => 110 + (d === 0 ? 30 : 0), needs: 'local' },
  tacos: { name: 'Taquería en tu local', ico: '🌮', price: 1500, where: 'Tu casa', desc: 'Al pastor en la noche. Compites con los tres Güeros.', income: (g, d) => 90 + (d === 5 || d === 6 ? 150 : 40), needs: 'local' },
};
export function ownsBiz(g, id) { return (g.state.businesses || []).includes(id); }
export function bizIncome(g) {
  const d = g.clock.weekday; let sum = 0;
  for (const id of g.state.businesses || []) { const b = BUSINESSES[id]; if (b) sum += Math.round(b.income(g, d) * (1 + clamp(g.stats.fama, -50, 60) / 200)); }
  return sum;
}

// Called once per new day: construction progress and business income.
export function newDay(g) {
  // bottles you promised to bring back to Don Frijoles
  if (g.state.bottleOwed > 0 && g.clock.dayIndex - (g.state.bottleSince ?? g.clock.dayIndex) >= 3 && !g.state.bottleBan) {
    g.state.bottleBan = true; g.addStat('palabra', -3);
    g.ui.toast('Don Frijoles ya te tiene en la libreta: “el de los envases”. Ya no te fía ni uno.', 'bad');
  }
  const s = g.state, day = g.clock.dayIndex;
  if (s.lastDay === day) return;
  const first = s.lastDay == null; s.lastDay = day;
  if (first) return;
  let changed = false;
  for (const p of s.properties || []) {
    if (p.work && p.work.ready <= day) {
      if (p.work.stage != null) p.stage = Math.max(p.stage || 0, p.work.stage + 1);
      if (p.work.extra) { p.extras = p.extras || []; if (!p.extras.includes(p.work.extra)) p.extras.push(p.work.extra); }
      g.ui.toast(`🏗️ Los albañiles terminaron: ${p.work.label}`, 'good');
      p.work = null; changed = true;
      if (p.stage >= 4 && !g.quests.done('s_casa')) g.quests.finish('s_casa', 'Una casa en Jiquilpan');
    }
  }
  const inc = bizIncome(g);
  if (inc > 0) { s.money += inc; s.earned = (s.earned || 0) + inc; g.ui.toast(`💰 Tus negocios dejaron $${inc} ayer`, 'good'); }
  if (changed) { const town = g.maps.town; if (town) applyProperties(g, town); }
}

// ---------------------------------------------------------------------------------------------------
// Interactions: the lot sign, your construction site, business signs, the wardrobe
export async function lotInteract(g, s) {
  const L = LOTS.find(l => l.id === s.lot); if (!L) return;
  await g.dialog.scene(async d => {
    await d.narrate(`“SE VENDE — ${L.name}. $${L.price.toLocaleString('es-MX')}. Informes en el Palacio Municipal o aquí mismo.” ${L.w * 5} por ${L.h * 5} metros de tierra buena.`);
    const c = await d.choose([{ text: `Comprar el terreno ($${L.price})`, tag: 'money', value: 'buy' }, { text: 'Ahorita no', value: null }]);
    if (c.value !== 'buy') return;
    if (g.state.money < L.price) { await d.narrate(`Te faltan $${L.price - g.state.money}. Los negocios, los trabajos y las apuestas del palenque dan dinero… algunos.`); return; }
    g.state.money -= L.price; g.sfx('coin');
    g.state.properties = g.state.properties || []; g.state.properties.push({ id: L.id, stage: 0, style: null, extras: [], work: null });
    await d.narrate('Firmas en la oficina del Palacio. El terreno es tuyo. Ahora falta la casa: aquí mismo puedes contratar albañiles.');
    if (!g.quests.started('s_casa')) g.quests.start('s_casa');
    applyProperties(g, g.map); g.save();
  });
}
export async function obraInteract(g, s) {
  const p = propOf(g, s.lot); if (!p) return;
  const L = LOTS.find(l => l.id === s.lot);
  await g.dialog.scene(async d => {
    const maestro = { name: 'Maestro Nacho Zepeda', role: 'maestro albañil', look: g.albanilLook() };
    if (p.work && p.work.ready > g.clock.dayIndex) {
      await d.say(maestro, pick(R, [`Ahí vamos, patrón. ${p.work.label}: mañana queda. Si Dios quiere y no llueve.`, 'Ya casi, ya casi. Nomás que nos traigan el cemento… y unas cocas.', 'Tranquilo, patrón. En Jiquilpan las casas se hacen con calma, pero se hacen bien.']));
      return;
    }
    if (!p.style) {
      await d.say(maestro, `Buenas, patrón. ¿Qué casa quiere en su ${L.name.toLowerCase()}? Le hago la que me diga.`);
      const c = await d.choose(Object.entries(STYLES).map(([k, v]) => ({ text: `${v.name} — ${v.desc}`, value: k })).concat([{ text: 'Todavía lo estoy pensando', value: null }]), maestro);
      if (!c.value) return;
      p.style = c.value;
      await d.say(maestro, `${STYLES[c.value].name}. Buena elección. Esa se ve bonita en el pueblo.`);
    }
    const stage = p.stage || 0;
    const opts = [];
    if (stage < STAGES.length) { const S = STAGES[stage]; opts.push({ text: `${S.name}: $${S.cost} (${S.days} día${S.days > 1 ? 's' : ''}) — ${S.desc}`, tag: 'money', value: { stage, ...S } }); }
    if (stage >= STAGES.length) for (const [k, e] of Object.entries(EXTRAS)) if (!(p.extras || []).includes(k)) opts.push({ text: `${e.name}: $${e.cost} — ${e.desc}`, tag: 'money', value: { extra: k, ...e } });
    for (const [bid, b] of Object.entries(BUSINESSES)) if (b.needs && (p.extras || []).includes(b.needs) && !ownsBiz(g, bid)) opts.push({ text: `Abrir: ${b.name}${b.price ? ` ($${b.price})` : ''} — unos $${b.income(g, 1)} diarios`, tag: 'money', value: { biz: bid } });
    if (stage >= STAGES.length && !(p.extras || []).length) opts.push({ text: '¿Cómo quedó? Enséñeme la casa', value: 'look' });
    opts.push({ text: 'Nada por ahora', value: null });
    await d.say(maestro, stage === 0 ? 'Para empezar hay que echar los cimientos.' : stage >= STAGES.length ? '¡La casa ya está! Si quiere le agregamos algo.' : `Ya tenemos ${STAGES[stage - 1].name.toLowerCase()}. ¿Seguimos?`);
    const c = await d.choose(opts, maestro);
    if (!c.value || c.value === 'look') { if (c.value === 'look') await d.narrate('La casa huele a pintura fresca. Es tuya.'); return; }
    const job = c.value;
    if (job.biz) {
      const b = BUSINESSES[job.biz];
      if (g.state.money < b.price) { await d.say(maestro, `Para eso hacen falta $${b.price}, patrón.`); return; }
      buyBusiness(g, job.biz); await d.say(maestro, `¡Ándele! ${b.name}. Ya verá que la gente llega sola.`); return;
    }
    if (g.state.money < job.cost) { await d.say(maestro, `Son $${job.cost}, patrón. Nomás con el material por adelantado. Cuando junte, aquí andamos.`); return; }
    g.state.money -= job.cost; g.sfx('coin');
    const days = job.days || 0;
    if (days === 0) { p.extras = p.extras || []; p.extras.push(job.extra); await d.say(maestro, '¡Listo! Eso se hace en una tarde.'); }
    else { p.work = { ready: g.clock.dayIndex + days, stage: job.stage, extra: job.extra, label: job.name }; await d.say(maestro, `Trato hecho. En ${days} día${days > 1 ? 's' : ''} queda. Usted váyase tranquilo.`); }
    applyProperties(g, g.map); g.save();
  });
}
export async function bizSignInteract(g, s) {
  const id = s.biz, b = BUSINESSES[id]; if (!b) return;
  await g.dialog.scene(async d => {
    if (ownsBiz(g, id)) { await d.narrate(`${b.ico} ${b.name}: es tuyo. Hoy deja unos $${b.income(g, g.clock.weekday)}.`); return; }
    await d.narrate(`${b.ico} SE TRASPASA — ${b.name}. ${b.desc} Inversión: $${b.price}. Ganancia: unos $${b.income(g, 1)} al día (más en fin de semana).`);
    const c = await d.choose([{ text: `Comprarlo ($${b.price})`, tag: 'money', value: 1 }, { text: 'Ahorita no', value: 0 }]);
    if (!c.value) return;
    if (g.state.money < b.price) { await d.narrate(`Te faltan $${b.price - g.state.money}.`); return; }
    buyBusiness(g, id);
    await d.narrate('Trato hecho, de palabra y con un apretón de manos. Cada mañana te llegará lo que deje.');
  });
}
export function buyBusiness(g, id) {
  const b = BUSINESSES[id];
  g.state.money -= b.price; g.sfx('coin');
  g.state.businesses = g.state.businesses || []; if (!g.state.businesses.includes(id)) g.state.businesses.push(id);
  g.addStat('fama', 3); g.save();
}
export async function wardrobeInteract(g) {
  await g.dialog.scene(async d => {
    const own = (g.state.wardrobe || []).map(id => [id, CLOTHES[id]]).filter(([, c]) => c);
    if (!own.length) { await d.narrate('Tu ropero está vacío. En el tianguis, en las tiendas de ropa y en la estética del centro hay de dónde escoger.'); return; }
    for (let i = 0; i < 12; i++) {
      const c = await d.choose(own.map(([id, cl]) => ({ text: `${cl.ico} ${cl.name}${g.state.outfit?.[cl.slot] === id ? ' ✓' : ''}`, value: id })).concat([{ text: 'Listo', value: null }]));
      if (!c.value) return;
      wearOutfit(g, c.value);
    }
  });
}

// ---------------------------------------------------------------------------------------------------
// Menu pages (rendered by the UI)
export function peopleHTML(g, esc) {
  const rel = g.state.rel || {};
  const defs = g.npcs.defs;
  const rows = Object.entries(rel).map(([id, r]) => ({ id, r, def: defs.find(d => d.id === id) })).filter(x => x.def).sort((a, b) => b.r.v - a.r.v);
  if (!rows.length) return '<div class="card"><h3>Gente</h3><p>Todavía no conoces a nadie de verdad. Platica con la gente del pueblo: cada quien te va a recordar a su manera.</p></div>';
  let html = `<div class="card intro"><h3>Gente que conoces</h3><p>Lo que piensan de ti cambia con lo que dices y haces: cumplidos, regalos, favores… o burlas. Con los amigos hay descuentos y favores; con los compadres, secretos.</p></div><div class="people">`;
  for (const { id, r, def } of rows) {
    const L = relLevel(r.v);
    const pct = (r.v + 100) / 2;
    html += `<div class="person" data-id="${id}"><canvas width="96" height="96" data-look="${id}"></canvas><div class="pmeta"><b>${esc(def.name)}</b><small>${esc(def.role || '')}</small>
      <div class="relbar"><i style="width:${pct}%;background:${r.v >= 45 ? '#4f9a3a' : r.v >= 0 ? '#c9a23c' : '#c2413c'}"></i></div>
      <span class="rellvl">${L.ico} ${r.novios ? (def.look?.female ? 'Tu novia' : 'Tu novio') : L.name}</span>${r.notes.length ? `<small class="note">“${esc(r.notes[r.notes.length - 1])}”</small>` : ''}</div></div>`;
  }
  return html + '</div>';
}
export function propsHTML(g, esc) {
  let html = `<div class="card intro"><h3>Tus propiedades</h3><p>Ahorra, compra un terreno con letrero de <b>SE VENDE</b>, contrata albañiles y escoge cómo quieres tu casa. También puedes quedarte con negocios que se traspasan y cobrar lo que dejan cada mañana.</p>
    <div class="kpis"><div><b>$${g.state.money}</b><small>en la bolsa</small></div><div><b>$${bizIncome(g)}</b><small>al día (negocios)</small></div><div><b>$${g.state.earned || 0}</b><small>ganado en total</small></div></div></div>`;
  const props = g.state.properties || [];
  if (props.length) for (const p of props) {
    const L = LOTS.find(l => l.id === p.id);
    const stage = p.stage || 0, pct = Math.round(stage / STAGES.length * 100);
    html += `<div class="card"><div class="kicker">${stage >= STAGES.length ? 'Tu casa' : 'En obra'}</div><h3>${esc(L.name)}</h3><p>${p.style ? STYLES[p.style].name : 'Sin estilo todavía'}${(p.extras || []).length ? ' · ' + p.extras.map(e => EXTRAS[e].name).join(', ') : ''}</p>
      <div class="relbar"><i style="width:${pct}%;background:#6c4bb4"></i></div><p><small>${p.work ? `🏗️ ${esc(p.work.label)}: listo en ${Math.max(0, p.work.ready - g.clock.dayIndex)} día(s)` : stage < STAGES.length ? `Siguiente: ${STAGES[stage].name} ($${STAGES[stage].cost}) — habla con el maestro en el terreno.` : 'Terminada. Ve a verla.'}</small></p></div>`;
  }
  else html += `<div class="card"><p>No tienes terrenos. Hay letreros de <b>SE VENDE</b> junto al estadio y cerca del río, en la salida a Totolán.</p></div>`;
  html += '<div class="card"><h4>Negocios</h4>';
  for (const [id, b] of Object.entries(BUSINESSES)) {
    const own = ownsBiz(g, id);
    html += `<p>${b.ico} <b>${b.name}</b> ${own ? '<span class="pill-ok">tuyo</span>' : `<small>· $${b.price} · ${b.where}</small>`}<br><small>${b.desc}</small></p>`;
  }
  return html + '</div>';
}
