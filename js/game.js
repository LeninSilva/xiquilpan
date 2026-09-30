// Game state, main loop, player control and interactions.
import { TILE, clamp, dist, lerp, pick } from './util.js';
import { G } from './world.js';
import { buildTown, applyWeekday } from './data/town.js';
import { buildCerro, buildTotolan, buildAbadiano, buildSarabia } from './data/regions.js';
import { buildInterior } from './data/interiors.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Clock, Environment } from './time.js';
import { Person } from './entities.js';
import { makeLook } from './render/people.js';
import { NPCManager } from './npcs.js';
import { Dialogue } from './dialogue.js';
import { Quests } from './quests.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';
import { LLM, DEFAULT_MODEL } from './llm.js';
import { runCutscene } from './cutscene.js';
import { ITEMS, SHOPS } from './data/items.js';
import { SPRITES } from './render/landmarks.js';

const SAVE_KEY = 'xiq_save', SETTINGS_KEY = 'xiq_settings';

// Short texts for landmarks you can examine.
const INFO = {
  aguadora: 'La Fuente de la Aguadora. El conjunto lo diseñó el escultor Federico Canessi, que vivió en Jiquilpan de 1934 a 1940. Honra a las mujeres que acarreaban el agua en cántaros desde la Fuente del Zalate hasta las casas, antes de que hubiera tubería. Hoy es el símbolo del pueblo.',
  fuente: 'La fuente del Jardín Zaragoza. Los niños le avientan monedas y piden deseos; los novios se sientan en su orilla los viernes.',
  obelisco: 'El obelisco a Rioseco y Ornelas. Por su forma, aquí le dicen “el monumento de la botella”.',
  juarez: 'Monumento a Benito Juárez. La escultura, sobre su base piramidal, se instaló en 1939 en el Parque Juárez y en 1968 se trasladó al mirador. Desde aquí se ve todo Jiquilpan y, al fondo, el Cerro de San Francisco.',
  cardenas: 'Monumento al General Lázaro Cárdenas del Río (1895–1970), nacido en Jiquilpan. Presidente de México de 1934 a 1940; el 18 de marzo de 1938 decretó la expropiación petrolera. Por eso el estadio se llama así.',
  pescados: 'La Fuente de los Pescados, en el camellón de Av. Las Palmas. De noche, junto a ella, se ponen unos tacos que valen la pena.',
  estadio: 'La portada del Estadio 18 de Marzo, con su águila de bronce en lo alto. El nombre recuerda el 18 de marzo de 1938, el día de la expropiación petrolera. A los lados, dos tablas con las palabras del General Cárdenas: “Los recursos naturales del país deben servir para su propia prosperidad. Entregarlos a intereses extraños es traicionar la patria.”',
  murales: 'Los murales de José Clemente Orozco en la Biblioteca Pública Gabino Ortiz, fundada en 1940 en un antiguo templo. Figuras enormes, fuego, pueblo. No caben en una pantalla: hay que torcer el cuello para verlos.',
  jeep: 'El jeep del General Cárdenas. Con él recorría los caminos de Michoacán, sin escolta, parando a platicar con la gente en las plazas.',
  vitrina1: 'Vitrina: objetos personales del General — unos lentes, una pluma fuente, una credencial.',
  vitrina2: 'Vitrina: cartas de campesinos al Presidente Cárdenas. Muchas empiezan igual: “Mi General, le escribo porque usted sí escucha”.',
  vitrina3: 'Vitrina: fotografías de la reforestación del Bosque Cuauhtémoc y del Parque Juárez.',
  cruz: 'La cruz del Cerro de San Francisco. Desde aquí se ve la Ciénega de Chapala, Sahuayo y todo Jiquilpan.',
  altar: 'El altar de la abuela: la Virgen de Guadalupe, veladoras, y fotos de toda la familia. Tu abuelo sale en una con su texana nueva.',
  poster: 'Una hoja descolorida por el sol: “SE BUSCA — Miguel (81), Antonio (77) y su nieto. Vistos por última vez el 1 de octubre rumbo al Cerro de San Francisco. Cualquier informe, al Palacio Municipal.” Tu propia foto te mira desde el poste.',
  zaragoza: 'El General Ignacio Zaragoza, vencedor de la batalla de Puebla del 5 de mayo de 1862. El parque que lleva su nombre es la orilla oriente del jardín, frente al Palacio Municipal.',
  galgos: 'Dos perros de caza de hierro fundido, de la casa francesa de Antoine Durenne, como los que adornan parques de París y de la Ciudad de México. Miran al oriente, hacia el Palacio. Los niños se les suben a caballo aunque el policía les chifle.',
  abad: 'Busto de Diego José Abad y García (Jiquilpan, 1727 – Bolonia, 1779), jesuita, poeta y humanista, autor del poema latino “De Deo, Deoque Homine Heroica”. Expulsado con los jesuitas en 1767, murió en Bolonia, Italia; de allá vino este busto, regalo de la ciudad a su pueblo natal.',
  plaque_ocaranza: 'Placa: Ramón Martínez Ocaranza (Jiquilpan, 1915 – Morelia, 1982), poeta. Le llamó a su pueblo “la ciudad de las jacarandas”. Sus versos se leen en voz alta cada marzo, cuando florecen.',
  plaque_canessi: 'Placa: Federico Canessi (1905–1977), escultor. Vivió en Jiquilpan de 1934 a 1940 y aquí dejó la Aguadora, en honor a las mujeres que acarreaban el agua en cántaro.',
  plaque_gabino: 'Placa: Biblioteca Pública Gabino Ortiz, inaugurada en 1940 en el antiguo templo de San Agustín (luego del Sagrado Corazón). Adentro, los murales de José Clemente Orozco, pintados ese mismo año.',
  plaque_cardenas: 'Placa: En esta casa vivió el General Lázaro Cárdenas del Río (Jiquilpan, 21 de mayo de 1895 – Ciudad de México, 19 de octubre de 1970), Presidente de la República de 1934 a 1940.',
  plaque_quote: '“Los recursos naturales del país deben servir para su propia prosperidad. Entregarlos a intereses extraños es traicionar la patria.” — General Lázaro Cárdenas del Río.',
  plaque_bejar: 'Placa: Feliciano Béjar (Jiquilpan, 1920 – Ciudad de México, 2007), pintor y escultor, creador de los “magiscopios” de vidrio y acero.',
  piedrita: 'La Piedrita. Un hilo de agua que baja entre las piedras negras y cae a una poza chiquita. Aquí suben las parejas, los que van a rezar y los que vienen a ver las luces. En la piedra alguien rayó: “AQUÍ LAS VIMOS — 1998”.',
  subida: 'La “subida mágica”. Dicen que si dejas el carro en neutral aquí, se va solito para arriba. Los que saben dicen que es ilusión óptica. Los que han visto las luces dicen que no.',
  trash: 'Bolsas de basura, latas y una silla rota. Por eso le dicen “El Santo Mugrero”.',
  palenque: 'El palenque del estadio. En temporada (de noviembre a Reyes) hay peleas de gallos y bailes hasta las cuatro de la mañana.',
  altar_iglesia: 'El altar mayor. Huele a cera y a flores. Un señor reza en voz baja en la última banca.',
};

export class Game {
  constructor() {
    this.renderer = new Renderer(document.getElementById('game'));
    this.input = new Input(document.body);
    this.clock = new Clock();
    this.env = new Environment();
    this.audio = new Audio();
    this.settings = this.loadSettings();
    this.llm = new LLM(this.settings);
    this.ui = new UI(this);
    this.dialog = new Dialogue(this);
    this.quests = new Quests(this);
    this.maps = {};
    this.entities = [];
    this.effects = [];
    this.dynamicLights = [];
    this.returnStack = [];
    this.camera = { x: 0, y: 0 };
    this.playing = false;
    this.firstFrame = true;
    this.lastWeekday = -1;
    this.frozen = false;
    this.itemEntities = [];
    this.newState();
  }

  // ---- state -------------------------------------------------------------------
  newState() {
    this.state = { name: 'Emiliano', money: 150, inventory: {}, act: 1, era: 'before', quests: {}, clues: [], hilos: 0, hiloNames: [], debt: 0, debtSince: null, freeTacos: 0, believers: 0, ending: null, ateToday: -1, prayed: -1 };
    this.flags = {};
    this.stats = { corazon: 0, palabra: 0, fama: 0, panza: 22, talks: 0 };
    this.status = { enchilado: 0, buzz: 0 };
  }
  loadSettings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) { s = {}; }
    return { sound: true, llmEnabled: false, apiKey: '', baseURL: '', model: DEFAULT_MODEL, zoom: 1, liveWeather: true, ...s };
  }
  saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch (e) {} this.audio.on = this.settings.sound; }
  save(manual) {
    if (!this.playing) return;
    try {
      const p = this.player;
      const data = { v: 1, state: this.state, flags: this.flags, stats: this.stats, status: this.status, clock: this.clock.toJSON(),
        player: { map: this.map.id, x: p.x, y: p.y, dir: p.dir, hat: p.look.hat, capColor: p.look.capColor }, returnStack: this.returnStack, lastOutdoor: this.lastOutdoor };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      if (manual) this.ui.toast('Partida guardada', 'good');
    } catch (e) { console.warn('save failed', e); }
  }
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

  // ---- boot ------------------------------------------------------------------
  init() {
    this.audio.on = this.settings.sound;
    this.renderer.zoomMul = this.settings.zoom || 1; this.renderer.resize();
    this.env.useLive = this.settings.liveWeather !== false;
    // build the town up-front (it is also the title backdrop)
    const town = this.getMap('town');
    this.map = town;
    this.player = new Person(town, 125.5 * TILE, 100 * TILE, this.playerLook());
    this.player.speed = 58;
    this.npcs = new NPCManager(this);
    this.entities.push(this.player);
    this.camera.x = this.player.x; this.camera.y = this.player.y;
    this.clock.minutes = 7 * 60 + 30;
    const title = document.getElementById('title');
    const cont = document.getElementById('btnContinue');
    if (this.hasSave()) cont.classList.remove('hidden');
    cont.addEventListener('click', () => { this.audio.unlock(); title.classList.add('hidden'); this.loadGame(); });
    document.getElementById('btnNew').addEventListener('click', () => {
      document.getElementById('nameBox').classList.remove('hidden');
      document.querySelector('.t-actions').classList.add('hidden');
      setTimeout(() => document.getElementById('nameInput').focus(), 50);
    });
    const start = () => {
      this.audio.unlock();
      const name = document.getElementById('nameInput').value.trim().slice(0, 16) || 'Emiliano';
      title.classList.add('hidden');
      this.newGame(name);
    };
    document.getElementById('btnStart').addEventListener('click', start);
    document.getElementById('nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
    this.env.fetchLive();
    setInterval(() => this.env.fetchLive(), 10 * 60 * 1000);
    setInterval(() => { if (this.playing && !this.dialog.active) this.save(); }, 30000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
    // automated-test hook: ?autostart=Name
    const q = new URLSearchParams(location.search);
    if (q.get('autostart') != null) { title.classList.add('hidden'); if (q.get('continue') && this.hasSave()) this.loadGame(); else this.newGame(q.get('autostart') || 'Emiliano', q.has('skipintro')); }
  }
  playerLook() {
    return makeLook(77, { female: false, age: 'teen', hair: 'short', hairColor: '#2b1f18', top: 'hoodie', topColor: '#3d3a8c', bottom: 'jeans', bottomColor: '#2f4b7c', shoes: 'sneakers', shoeColor: '#f5f5f5', hat: null, beard: null, mustache: false, glasses: false, backpack: true, skin: '#d19f78', extra: { eyeColor: '#2a1c12' } });
  }
  newGame(name, skipIntro) {
    this.newState();
    this.state.name = name;
    this.clock = new Clock();
    this.playing = true;
    this.ui.showHUD(true);
    this.returnStack = [{ map: 'town', x: 225.5 * TILE, y: 157.2 * TILE, dir: 0 }];
    this.lastOutdoor = 'town';
    this.changeMap('casa_abuela', 8.5, 9.6, 1, { instant: true });
    this.npcs.timer = 0; this.npcs.update(0.016);
    if (!skipIntro) setTimeout(() => this.cutscene('intro').then(() => this.controlsHint()), 600);
    else this.quests.set('main', 1);
    this.save();
  }
  loadGame() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      this.newState();
      Object.assign(this.state, d.state); this.flags = d.flags || {}; Object.assign(this.stats, d.stats); Object.assign(this.status, d.status || {});
      this.clock.load(d.clock);
      this.returnStack = d.returnStack || []; this.lastOutdoor = d.lastOutdoor || 'town';
      this.playing = true; this.ui.showHUD(true);
      this.player.look.hat = d.player.hat || null; if (d.player.capColor) this.player.look.capColor = d.player.capColor;
      if (this.flags.mancha) this.player.look.stain = true;
      this.changeMap(d.player.map || 'town', d.player.x / TILE, d.player.y / TILE, d.player.dir || 0, { instant: true });
      this.ui.toast('Bienvenido de vuelta a Jiquilpan', 'good');
    } catch (e) {
      console.error(e); this.ui.toast('No se pudo cargar la partida; empezando de nuevo.', 'bad'); this.newGame('Emiliano');
    }
  }
  controlsHint() {
    const touch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
    this.ui.toast(touch ? 'Toca la mitad izquierda para caminar · A: hablar/entrar · B: correr' : 'Flechas/WASD: caminar · Shift: correr · Espacio: hablar/entrar · M: mapa', '');
  }
  reportError(e) { if (!this._errShown) { this._errShown = true; this.ui.toast('Ups: ' + (e.message || e), 'bad'); setTimeout(() => this._errShown = false, 5000); } }

  // ---- maps --------------------------------------------------------------------------
  getMap(id, lazy) {
    if (this.maps[id]) return this.maps[id];
    let m = null;
    if (id === 'town') { m = buildTown(); applyWeekday(m, this.clock.weekday); this.lastWeekday = this.clock.weekday; }
    else if (id === 'cerro') m = buildCerro();
    else if (id === 'totolan') m = buildTotolan();
    else if (id === 'abadiano') m = buildAbadiano();
    else if (id === 'sarabia') m = buildSarabia();
    else m = buildInterior(id);
    if (m) this.maps[id] = m;
    return m;
  }
  changeMap(id, tx, ty, dir = 0, opts = {}) {
    const m = this.getMap(id);
    if (!m) { this.ui.toast('Ese lugar todavía no está abierto.', 'bad'); return; }
    const prev = this.map;
    this.map = m;
    const zm = (this.settings.zoom || 1) * (m.interior ? 1.3 : 1);
    if (this.renderer.zoomMul !== zm) { this.renderer.zoomMul = zm; this.renderer.resize(); }
    if (m.outdoor) this.lastOutdoor = id;
    this.player.map = m; this.player.x = tx * TILE; this.player.y = ty * TILE; this.player.dir = dir; this.player.path = null;
    this.camera.x = this.player.x; this.camera.y = this.player.y;
    this.firstFrame = true;
    if (prev !== m) { this.npcs.clearTransient(); this.effects = this.effects.filter(e => e.persistent); this.syncItems(); }
    this.npcs.timer = 0;
    this.quests.onEnterMap(id);
    if (!opts.instant) this.sfx('door');
  }
  async transition(fn) {
    if (this.transitioning) return;
    this.transitioning = true; this.input.enabled = false;
    await this.ui.fade(true, false, 280);
    fn();
    await new Promise(r => setTimeout(r, 60));
    await this.ui.fade(false, false, 320);
    this.input.enabled = !this.dialog.active; this.transitioning = false;
  }
  enterDoor(door) {
    if (!this.doorOpen(door)) {
      const msg = door.season === 'palenque' && !this.palenqueSeason()
        ? `${door.label}: cerrado. Abre en temporada, de noviembre a Reyes.`
        : `${door.label}: cerrado. Abre de ${door.hours[0]}:00 a ${door.hours[1] % 24}:00.`;
      this.ui.toast(msg, 'bad');
      this.doorCooldown = 1.2;
      return;
    }
    const back = { map: this.map.id, x: this.player.x, y: this.player.y + (door.fromNorth ? -6 : 8), dir: door.fromNorth ? 1 : 0 };
    if (door.fromNorth) back.y = (door.y - 0.6) * TILE;
    else back.y = (door.y + 1.4) * TILE;
    back.x = (door.x + 0.5) * TILE;
    if (door.fromSouth) { back.y = (door.y - 0.6) * TILE; back.dir = 1; }
    const target = this.getMap(door.to);
    if (!target) { this.ui.toast(`${door.label}`, ''); return; }
    this.transition(() => {
      this.returnStack.push(back);
      const sp = target.spawns.entry;
      this.changeMap(door.to, sp.x, sp.y, 1);
      if (door.to === 'mercado' && door.fromNorth) { this.player.x = 20.5 * TILE; this.player.y = 2.6 * TILE; this.player.dir = 0; }
      this.ui.toast(door.label, '');
    });
  }
  palenqueSeason() { const m = this.clock.month, d = this.clock.date.getUTCDate(); return m === 10 || m === 11 || (m === 0 && d <= 6); }
  doorOpen(door) {
    if (door.season === 'palenque' && !this.palenqueSeason()) return false;
    if (!door.hours) return true;
    const h = this.clock.hour, [a, b] = door.hours;
    return (h >= a && h < b) || (b > 24 && h < b - 24);
  }
  exitInterior(which) {
    const back = this.returnStack.pop() || { map: 'town', x: 126 * TILE, y: 106 * TILE, dir: 0 };
    this.transition(() => {
      if (which === '__back2' && this.map.id === 'mercado') { this.changeMap('town', 200.5, 83.2, 1); return; }
      if (which === '__back' && this.map.id === 'mercado' && back.y < 90 * TILE) { this.changeMap('town', 200.5, 110.4, 0); return; }
      this.changeMap(back.map, back.x / TILE, back.y / TILE, back.dir);
    });
  }

  // ---- helpers ----------------------------------------------------------------------
  sfx(n) { this.audio.sfx(n); }
  onScreen(x, y, margin = 0) {
    const vw = this.renderer.viewW, vh = this.renderer.viewH;
    return Math.abs(x - this.camera.x) < vw / 2 + margin && Math.abs(y - this.camera.y) < vh / 2 + margin;
  }
  placeName() {
    if (this.map.interior) return this.map.name;
    const a = this.map.areaAt(Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE));
    return a && a.kind !== 'street' ? a.name : this.map.name;
  }
  placeKey() {
    const n = this.placeName().toLowerCase();
    if (n.includes('plaza') || n.includes('zaragoza') || n.includes('portal') || n.includes('kiosco')) return 'plaza';
    if (n.includes('mercado')) return 'mercado';
    if (n.includes('bosque')) return 'bosque';
    if (n.includes('palmas') || n.includes('pescados') || n.includes('tortill')) return 'palmas';
    if (n.includes('estadio') || n.includes('cárdenas') || n.includes('cancha')) return 'estadio';
    if (n.includes('entrada') || n.includes('glorieta') || n.includes('gallos') || n.includes('palmira') || n.includes('oxxo') || n.includes('pemex')) return 'entrada';
    if (this.map.id === 'cerro' || n.includes('cerro') || n.includes('cruz')) return 'cerro';
    if (n.includes('juárez')) return 'juarez';
    return 'generic';
  }
  addMoney(n) { this.state.money = Math.max(0, this.state.money + n); if (n > 0) { this.sfx('coin'); this.ui.toast(`+$${n}`, 'good'); } }
  addStat(k, v) {
    const before = this.stats[k];
    this.stats[k] = clamp(this.stats[k] + v, k === 'panza' ? 0 : -100, 100);
    if (k !== 'panza' && Math.abs(v) >= 3) {
      const names = { corazon: 'Corazón', palabra: 'Palabra', fama: 'Fama' };
      this.ui.toast(`${names[k]} ${v > 0 ? '▲' : '▼'}`, v > 0 ? 'good' : 'bad');
    }
    if (before !== this.stats[k]) this.refreshLook();
  }
  refreshLook() {
    const L = this.player.look;
    L.girth = 0.92 + this.stats.panza / 220;
    L.glow = this.stats.corazon > 50 ? (this.stats.corazon - 50) / 50 : 0;
    L.dirty = this.stats.corazon < -40;
    L.enchilado = this.status.enchilado > 0 ? 1 : 0;
  }
  hasItem(id) { return (this.state.inventory[id] || 0) > 0; }
  giveItem(id, n = 1) { this.state.inventory[id] = (this.state.inventory[id] || 0) + n; const it = ITEMS[id]; this.ui.toast(`Obtuviste: ${it ? it.ico + ' ' + it.name : id}`, 'good'); this.sfx('pickup'); this.quests.onPickup(id); this.save(); }
  giveItemSilent(id) { this.state.inventory[id] = (this.state.inventory[id] || 0) + 1; }
  takeItem(id) { if (this.state.inventory[id] > 0) this.state.inventory[id]--; if (!this.state.inventory[id]) delete this.state.inventory[id]; }
  consumeItem(id) {
    const it = ITEMS[id]; if (!it || !this.hasItem(id)) return;
    this.takeItem(id); this.applyEffect(it.effect || {});
    this.ui.toast(`${it.ico} ${it.name}: ¡provecho!`, 'good');
  }
  applyEffect(e) {
    if (e.panza) this.addStat('panza', e.panza);
    if (e.buzz) this.status.buzz = Math.max(0, Math.min(100, this.status.buzz + e.buzz));
    if (e.enchilado) { this.status.enchilado = e.enchilado; this.sfx('enchilado'); this.ui.toast('🌶️ ¡AY! ¡Pica, pica, pica!', 'bad'); }
    if (e.cure === 'enchilado' && this.status.enchilado > 0) { this.status.enchilado = 0; this.ui.toast('Ahhh… ya se te quitó lo enchilado.', 'good'); this.quests.onCure('enchilado'); }
    if (e.cure === 'enchilado_soft' && this.status.enchilado > 0) { this.status.enchilado = Math.max(0, this.status.enchilado - 40); if (!this.status.enchilado) this.quests.onCure('enchilado'); }
    if (e.give) this.giveItemSilent(e.give);
    if (e.wear) { this.player.look.hat = e.wear; if (e.wear === 'cap') this.player.look.capColor = pick(Math.random, ['#c0392b', '#1f4fa0', '#1b1b1b']); this.ui.toast('¡Te queda bien!', 'good'); }
    if (e.sleep) this.sleep(7);
    if (e.minigame === 'billar') {
      const win = Math.random() < 0.45 + this.stats.palabra / 400;
      this.ui.toast(win ? '🎱 ¡Metiste la ocho! Ganaste la partida.' : '🎱 Se te fue la blanca. Perdiste… esta vez.', win ? 'good' : '');
    }
    this.refreshLook();
  }
  gainHilo(npc) {
    if (!this.flags.mancha) return;
    const name = npc?.def?.short || npc?.def?.name || npc?.name || 'alguien';
    this.state.hilos++; this.state.hiloNames.push(name);
    this.ui.toast(`🧶 Un hilo nuevo para el rebozo: ${name} (${this.state.hilos})`, 'soul');
    this.sfx('hilo');
    this.handGlow = 2.5;
    this.save();
  }
  debtOverdue() { return this.state.debt > 0 && this.state.debtSince != null && this.clock.dayIndex - this.state.debtSince >= 3; }
  shopOpen(def) { return !!SHOPS[def.shop]; }
  async openShop(shopId, npc) {
    if (!SHOPS[shopId]) return;
    await this.ui.openShop(shopId, npc, (entry, mode) => this.buy(shopId, entry, mode, npc));
  }
  buy(shopId, entry, mode, npc) {
    const [id, name, ico, price, effect] = entry;
    const free = this.state.freeTacos > 0 && shopId === 'taco_guero_bueno';
    if (mode === 'fiado') {
      if (this.state.debt === 0) this.state.debtSince = this.clock.dayIndex;
      this.state.debt += price; this.addStat('palabra', -1);
      if (!this.quests.started('s_fiado')) this.quests.start('s_fiado');
      this.ui.toast(`Fiado: ${name}. “Ahí me paga luego, joven.” (Debes $${this.state.debt})`, '');
    } else if (free) { this.state.freeTacos--; this.ui.toast(`${ico} ${name}: ¡invita la casa!`, 'good'); }
    else {
      if (this.state.money < price) { this.ui.toast('No te alcanza.', 'bad'); return; }
      this.state.money -= price; if (price) this.sfx('coin');
      this.ui.toast(`${ico} ${name} (−$${price})`, '');
    }
    if (effect.give) { this.state.inventory[effect.give] = (this.state.inventory[effect.give] || 0) + 1; this.quests.onPickup(effect.give); }
    const e2 = { ...effect }; delete e2.give;
    this.applyEffect(e2);
    if (effect.quality === 'salado') this.ui.toast('Mmm… están saladitos. Bastante saladitos.', '');
    if (effect.quality === 'salsa') this.ui.toast('Los tacos, bien. La salsa… sabe a agua de jitomate.', '');
    if (effect.quality === 'excelente') this.ui.toast('¡Qué tacos! Con razón hay fila.', 'good');
    this.quests.onBuy(shopId, entry);
    this.save();
  }
  // Look through a wardrobe, a trunk, a flower pot… once per spot.
  searchSpot(s) {
    const key = `searched_${this.map.id}_${Math.round(s.x)}_${Math.round(s.y)}`;
    const what = { ropero: 'el ropero', baul: 'el baúl', maceta: 'las macetas', bookshelf: 'el librero' }[s.kind] || 'ahí';
    return this.dialog.scene(async d => {
      if (this.flags[key]) { await d.narrate(`Ya buscaste en ${what}. No hay nada más.`); return; }
      const owner = this.map.residents && !this.map.residents.shopkeeper;
      if (owner) {
        const c = await d.choose([{ text: `Buscar en ${what}`, value: 1, tag: 'rude' }, { text: 'Mejor no: no es tu casa', value: 0, tag: 'kind' }]);
        if (!c.value) { this.addStat('corazon', 1); return; }
        if (Math.random() < 0.3) { this.addStat('fama', -2); await d.narrate('—¡Oiga! ¿Qué anda buscando ahí? —te reclaman desde la cocina. Te pones rojo.'); }
      }
      this.flags[key] = true;
      const loot = s.loot || 'nothing';
      if (loot === 'pesos') { const n = 5 + Math.floor(Math.random() * 4) * 5; this.state.money += n; this.sfx('coin'); await d.narrate(`Entre la ropa hay una bolsita con monedas: $${n}. “Pa' la tanda”, dice un papelito.`); }
      else if (loot === 'lore') await d.narrate(pick(Math.random, [
        'Un recorte de periódico de 1979: “Vecinos de Jiquilpan reportan luces sobre el Cerro de San Francisco”. Alguien subrayó la palabra “vecinos”.',
        'Un cuaderno con recetas: corundas, uchepos, capirotada. En la última hoja: “Las luces otra vez. Nacho dice que no estamos locos.”',
        'Una foto de la plaza en los años cincuenta: el kiosco, los portales, y la Aguadora con su cúpula recién pintada.',
        'Un programa de la feria de 1985 con palenque, jaripeo y baile en el estadio. Los precios hacen reír.',
        'Una carta desde California: “Mamá, aquí nadie saluda en la calle. Extraño las jacarandas.”',
        'Un rosario, una estampa de San Cayetano y un boleto de lotería que nunca se cobró.']));
      else if (loot === 'nothing') await d.narrate(`Buscas en ${what}: calcetines, facturas viejas y un olor a naftalina. Nada más.`);
      else if (ITEMS[loot]) { if (this.hasItem(loot) && ITEMS[loot].type === 'quest') { await d.narrate('Nada nuevo por aquí.'); return; } this.giveItem(loot); }
    });
  }
  // Move a rock on the cerro; sometimes something was under it.
  pushRock(s) {
    if (s.moved) return;
    const p = this.player, dx = Math.sign(s.x - p.x) || 1;
    s.moved = true; s.x += dx * 12; s.cacheKey = null;
    this.map.finalize();
    this.sfx('door');
    const key = `rock_${this.map.id}_${s.rid}`;
    if (!this.flags[key] && s.loot) {
      this.flags[key] = true;
      const it = { map: this.map.id, id: s.loot, x: (s.x - dx * 12) / TILE, y: s.y / TILE };
      this.quests.extraItems = (this.quests.extraItems || []).concat([it]);
      this.syncItems();
      this.ui.toast('Algo brilla donde estaba la piedra…', 'good');
    } else this.ui.toast(pick(Math.random, ['Debajo sólo hay tierra húmeda y una lagartija que sale corriendo.', 'Un alacrán. Mejor la dejas.', 'Nada. Pero pesaba.']), '');
  }
  async palenqueBet() {
    await this.dialog.scene(async d => {
      const h = this.clock.hour;
      if (!(h >= 21 || h < 4)) { await d.narrate('El ruedo está vacío. Las peleas empiezan ya noche y siguen hasta las cuatro de la mañana.'); return; }
      await d.narrate('Los galleros de Sahuayo, de Cotija y de aquí mismo presentan a sus gallos. El juez da la señal y el palenque ruge.');
      const c = await d.choose([{ text: 'Apostar $50 al colorado (de Jiquilpan)', value: 'colorado' }, { text: 'Apostar $50 al giro (de Sahuayo)', value: 'giro' }, { text: 'Sólo mirar', value: null }]);
      if (!c.value) { await d.narrate('Te quedas mirando a la gente más que a los gallos: nadie trae el celular en la mano. Aquí todos gritan, ríen y se abrazan con desconocidos.'); return; }
      if (this.state.money < 50) { await d.narrate('No te alcanza. El apostador te mira de arriba abajo y se ríe.'); return; }
      this.state.money -= 50;
      const win = Math.random() < (c.value === 'colorado' ? 0.5 : 0.45);
      if (win) { this.state.money += 95; this.sfx('coin'); await d.narrate(`¡Ganó el ${c.value}! Te pagan $95 entre gritos. Alguien te invita una cerveza.`); this.addStat('fama', 1); }
      else await d.narrate(`Perdió el ${c.value}. “Así es esto, joven”, te dice un señor de sombrero, palmeándote la espalda.`);
    });
  }
  ferreCounter(s) {
    // Güicho, the owner, is rarely in: mornings on weekdays, when he isn't out partying.
    const h = this.clock.hour, d = this.clock.weekday, day = this.clock.dayIndex;
    const here = d >= 1 && d <= 5 && h < 13 && (day * 7 + d) % 3 !== 0;
    if (here) return this.openShop('ferretuberias');
    return this.dialog.scene(async dd => { await dd.narrate(pick(Math.random, [
      'En el mostrador hay un letrero escrito con plumón: “REGRESO EN 5 MIN”. El polvo sobre el letrero dice otra cosa.',
      'No está Güicho. El chavo de la tienda de al lado grita: “¡Anda en Sahuayo con una muchacha, quién sabe a qué hora vuelva!”',
      'Cerrado por dentro, pero se oye cumbia en el cuarto de atrás. Nadie abre.'])); });
  }
  sleep(hour) {
    this.transition(() => {
      this.clock.advanceTo(hour);
      this.status.buzz = 0; this.status.enchilado = 0;
      this.stats.panza = Math.max(0, this.stats.panza - 4);
      this.npcs.timer = 0; this.refreshLook();
      this.ui.toast(`Dormiste. ${this.clock.dateLabel()}`, 'good');
    });
  }
  cutscene(name) { return runCutscene(this, name); }
  spinTrompo() {
    const p = this.player, t0 = this.clock.real, x = p.x + [0, 0, -12, 12][p.dir], y = p.y + [10, -6, 2, 2][p.dir];
    const skill = Math.random() < 0.55;
    this.effects.push({ map: this.map, x, y, update() {}, draw(ctx, game) {
      const t = game.clock.real - t0; if (t > 4) { game.effects = game.effects.filter(e => e !== this); return; }
      const wob = skill ? Math.max(0, t - 3) * 0.6 : t * 0.35;
      ctx.save(); ctx.translate(this.x, this.y);
      ctx.fillStyle = 'rgba(20,20,35,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 3, 1, 0, 0, 7); ctx.fill();
      ctx.rotate(Math.sin(t * 9) * wob);
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(-3.5, -6); ctx.lineTo(3.5, -6); ctx.lineTo(0, 0); ctx.fill();
      ctx.fillStyle = t * 20 % 2 < 1 ? '#f2c230' : '#2f5d9a'; ctx.fillRect(-3.5, -6.8, 7, 1.2);
      ctx.restore();
    } });
    this.ui.toast(skill ? '¡Lo bailaste de uñita! El trompo zumba en el piso.' : 'Se te fue chueco… pero bailó tantito.', skill ? 'good' : '');
  }

  // ---- taxis ------------------------------------------------------------------------
  async taxi(sitioName) {
    const h = this.clock.hour;
    const driverAt = { Mercado: 'lalo', Biblioteca: 'chuy', Entrada: 'memo' }[sitioName];
    if (driverAt && !this.npcs.named.get(driverAt)) { this.ui.toast('No hay taxis en el sitio ahorita. Vuelve más al rato.', 'bad'); return; }
    const inTown = this.map.id === 'town';
    const dests = inTown ? [
      { text: 'Al sitio del Mercado — $30', value: ['town', 188, 99, 30] },
      { text: 'Al sitio de la Biblioteca Gabino Ortiz — $30', value: ['town', 134.5, 142.6, 30] },
      { text: 'A la entrada (OXXO) — $35', value: ['town', 290.5, 171.6, 35] },
      { text: 'Al Bosque Juárez (la Portada) — $35', value: ['town', 194, 253.5, 35] },
      { text: 'A la Casita de Piedra — $40', value: ['town', 29.5, 255, 40] },
      { text: 'Al camino del Cerro — $40', value: ['town', 152, 320, 40] },
      { text: 'A Totolán, Abadiano o Sarabia', value: ['closed', null, null, 0] },
      { text: 'A Sahuayo — $90', value: ['sahuayo', null, null, 90] },
      { text: 'Mejor no', value: null },
    ] : [
      { text: 'Regresar a Jiquilpan (sitio Gabino Ortiz) — $60', value: ['town', 134.5, 142.6, 60] },
      { text: 'Mejor no', value: null },
    ];
    const driver = this.npcs.named.get(driverAt) || { name: 'Taxista', role: 'sitio de taxis', look: makeLook(55, { uniform: 'taxi', age: 'adult' }) };
    await this.dialog.scene(async d => {
      await d.say(driver, pick(Math.random, ['¿A dónde lo llevo, joven?', 'Súbase. ¿Pa’ dónde?', '¿Taxi? Ándele, dígame a dónde.']), { noWait: true });
      const c = await d.choose(dests, driver);
      if (!c.value) return;
      const [map, x, y, fare] = c.value;
      if (map === 'closed') { await d.say(driver, 'Ay, joven, hoy no. Andan arreglando la carretera y a los ranchos no estoy subiendo. Otro día lo llevo a Totolán, a Abadiano, hasta a Sarabia. Hoy, puro Jiquilpan.'); return; }
      if (map === 'sahuayo') { await d.say(driver, '¿A Sahuayo? Jaja, allá va a gastar todo su dinero, joven. Mejor quédese: aquí hay más historia y la birria es igual de buena. (El taxista no quiere salir de su ruta hoy.)'); return; }
      if (this.state.money < fare) { await d.say(driver, 'Mmm, no le alcanza, joven. Y fiado no, eh. Eso es con Don Refugio.'); return; }
      this.state.money -= fare; this.sfx('coin');
      d.end();
      this.transition(() => {
        this.clock.minutes += 12;
        if (map === 'town') { this.returnStack = []; this.changeMap('town', x, y, 0); }
        else { const m = this.getMap(map); const sp = m.spawns.plaza; this.returnStack = []; this.changeMap(map, sp.x, sp.y, 0); this.ui.banner(m.name, 'Municipio de Jiquilpan'); }
      });
    });
  }

  // ---- world items -----------------------------------------------------------------
  syncItems() {
    for (const e of this.itemEntities) { const i = this.entities.indexOf(e); if (i >= 0) this.entities.splice(i, 1); }
    this.itemEntities = [];
    for (const it of this.quests.worldItems()) {
      if (it.map !== this.map.id) continue;
      if (it.repeat && this.hasItem(it.id)) continue;
      const e = { id: 'item_' + it.id, item: it.id, map: this.map, x: it.x * TILE, y: it.y * TILE, solid: false, update() {}, draw(ctx, game) {
        const t = game.clock.real; const b = Math.sin(t * 3) * 1.2;
        ctx.fillStyle = 'rgba(20,20,35,0.25)'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 4, 1.4, 0, 0, 7); ctx.fill();
        ctx.save(); ctx.translate(this.x, this.y - 3 + b);
        if (this.item === 'palo') { ctx.strokeStyle = '#7a5a36'; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(6, -3); ctx.moveTo(1, -1); ctx.lineTo(3, -5); ctx.stroke(); }
        else if (this.item === 'trompo') { ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(-3, -3); ctx.lineTo(3, -3); ctx.lineTo(0, 3); ctx.fill(); ctx.fillStyle = '#f2c230'; ctx.fillRect(-3, -3, 6, 1); }
        else if (this.item === 'bomba') { ctx.fillStyle = '#333'; ctx.fillRect(-1, -6, 2, 8); ctx.fillStyle = '#c0392b'; ctx.fillRect(-4, -7, 8, 1.5); }
        else { ctx.fillStyle = '#f5f0e6'; ctx.fillRect(-4, -4, 8, 6); ctx.strokeStyle = '#8a6a2f'; ctx.strokeRect(-4, -4, 8, 6); }
        ctx.restore();
        ctx.fillStyle = `rgba(255,255,220,${0.5 + Math.sin(t * 5) * 0.4})`; ctx.beginPath(); ctx.arc(this.x + 4, this.y - 9 + b, 1, 0, 7); ctx.fill();
      } };
      this.itemEntities.push(e); this.entities.push(e);
    }
  }

  // ---- interaction ------------------------------------------------------------------
  findInteraction() {
    const p = this.player, m = this.map;
    const [fx, fy] = [[0, 1], [0, -1], [-1, 0], [1, 0]][p.dir];
    const px = p.x + fx * 10, py = p.y + fy * 8;
    let best = null, bd = 26;
    for (const e of this.entities) {
      if (e === p || e.map !== m || e.hidden) continue;
      if (!(e.def || e.item || e.owner)) continue;
      const d = dist(px, py, e.x, e.y - (e.def ? 4 : 0));
      if (d < bd) { bd = d; best = { type: e.item ? 'item' : 'npc', e: e.owner || e }; }
    }
    // a quest landmark right in front of you (the kiosco) wins over a passer-by
    if (best && best.e.def?.crowd) {
      for (const s of m.spritesInView(p.x - 40, p.y - 40, p.x + 40, p.y + 40)) if (s.priority && s.interact && dist(px, py, s.x, s.y - 4) < 30) return { type: 'sprite', s };
    }
    if (best) return best;
    // sprites with an interaction
    for (const s of m.spritesInView(p.x - 40, p.y - 40, p.x + 40, p.y + 40)) {
      if (!s.interact) continue;
      if (s.acts && !s.acts.includes(this.state.act)) continue;
      const d = dist(px, py, s.x, s.y - 4);
      if (d < 30 && d < bd + 6) { bd = d; best = { type: 'sprite', s }; }
    }
    if (best) return best;
    // door in front
    const tx = Math.floor((p.x + fx * 12) / TILE), ty = Math.floor((p.y + fy * 12) / TILE);
    const door = m.doors.find(d => tx >= d.x && tx < d.x + d.w && ty >= d.y && ty < d.y + d.h);
    if (door) return { type: 'door', door };
    return null;
  }
  promptFor(it) {
    if (!it) return null;
    if (it.type === 'npc') return `Hablar con ${it.e.def?.short || it.e.def?.name || it.e.name}`;
    if (it.type === 'item') return `Recoger: ${ITEMS[it.e.item]?.name || it.e.item}`;
    if (it.type === 'door') return `Entrar: ${it.door.label}`;
    if (it.type === 'sprite') {
      const s = it.s;
      return { sitio: 'Pedir un taxi', vendor: 'Comprar', tianguis: 'Ver el puesto', shopcounter: 'Comprar', ferre_counter: 'Comprar', cama: 'Descansar', cocina: 'Comer algo', kiosco: 'Subir al kiosco', fogata: 'Sentarse junto al fuego', billar: 'Jugar billar', search: 'Buscar', push: 'Mover la piedra', palenque_bet: 'Ver las peleas', telar: 'Ver el telar' }[s.interact] || 'Ver';
    }
  }
  async interact(it) {
    if (!it) return;
    if (it.type === 'npc') { this.player.pose = null; await this.dialog.converse(it.e); return; }
    if (it.type === 'item') {
      const e = it.e;
      const i = this.entities.indexOf(e); if (i >= 0) this.entities.splice(i, 1);
      this.itemEntities = this.itemEntities.filter(x => x !== e);
      const ex = (this.quests.extraItems || []).find(x => x.id === e.item && x.map === this.map.id);
      if (ex) this.flags['got_' + ex.map + ex.id + Math.round(ex.x)] = true;
      this.giveItem(e.item);
      return;
    }
    if (it.type === 'door') { this.enterDoor(it.door); return; }
    const s = it.s;
    switch (s.interact) {
      case 'sitio': return this.taxi(s.sitio);
      case 'vendor': return this.openShop(s.vendor === 'micheladas_bosque' ? 'micheladas' : s.vendor);
      case 'tianguis': return this.openShop('tianguis');
      case 'shopcounter': return this.openShop(s.shop || 'tiendita');
      case 'kiosco': return this.quests.interactWorld('kiosco');
      case 'search': return this.searchSpot(s);
      case 'push': return this.pushRock(s);
      case 'palenque_bet': return this.palenqueBet();
      case 'ferre_counter': return this.ferreCounter(s);
      case 'telar': return this.dialog.scene(async d => { await d.narrate('El telar de cintura: un extremo amarrado al poste, el otro a la cintura de la tejedora. Hilo por hilo, así se hacen los rebozos de bolita desde antes de que existieran las máquinas. Un rebozo fino lleva semanas.'); });
      case 'altar_casa': return this.dialog.scene(async d => { await d.narrate(pick(Math.random, ['Un altarcito con la Virgen de Guadalupe, veladoras y fotos de los difuntos de la familia.', 'San Judas Tadeo, una veladora encendida y la foto de un muchacho que se fue al norte.', 'La Virgen, un ramo de flores de plástico y la foto de una boda en el Santuario.'])); });
      case 'vitrina_casa1': return this.dialog.scene(async d => { await d.narrate('Vitrina: el sombrero, las botas de montar y unos binoculares del General. Al lado, fotos de la familia Cárdenas en el patio de esta misma casa.'); });
      case 'vitrina_casa2': return this.dialog.scene(async d => { await d.narrate('Vitrina: cartas y el acta de nacimiento, 21 de mayo de 1895. Un letrero pide, a mano: “Favor de no tocar. La familia lo agradece”.'); });
      case 'pajarete': return this.dialog.scene(async d => { await d.narrate('El corral huele a leche tibia, a tierra y a chocolate. Don Refugio vende los pajaretes muy temprano.'); });
      case 'cama': return this.dialog.scene(async d => {
        const c = await d.choose([{ text: 'Dormir hasta mañana (7 am)', value: 7 }, { text: 'Descansar hasta la tarde (5 pm)', value: 17 }, { text: 'Hasta la noche (8 pm)', value: 20 }, { text: 'No, gracias', value: null }], null);
        if (c.value != null) { d.end(); this.sleep(c.value); }
      });
      case 'cocina': return this.dialog.scene(async d => {
        if (this.state.ateToday === this.clock.dayIndex) { await d.narrate('La abuela ya te dio de comer hoy. “¡Te vas a poner como globo, mijo!”'); return; }
        this.state.ateToday = this.clock.dayIndex; this.addStat('panza', 6);
        await d.narrate(pick(Math.random, ['Frijoles de la olla, tortillas hechas a mano y un chile de molcajete. Nadie cocina como la abuela.', 'Caldo de res con su limón. La abuela te sirve dos veces sin preguntar.', 'Enchiladas con queso de rancho. Tu abuela te mira comer y sonríe.']));
      });
      case 'altar_iglesia': return this.dialog.scene(async d => {
        await d.narrate(INFO.altar_iglesia);
        if (this.state.prayed !== this.clock.dayIndex) { const c = await d.choose([{ text: 'Rezar un momento por tu familia', tag: 'kind', value: 1 }, { text: 'Seguir tu camino', value: 0 }]); if (c.value) { this.state.prayed = this.clock.dayIndex; this.addStat('corazon', 2); await d.narrate('Te quedas en silencio. Por un momento, todo está en calma.'); } }
      });
      case 'fogata': return this.dialog.scene(async d => { await d.narrate('El fuego truena. Huele a ocote y a café de olla. Arriba, las estrellas se ven clarísimas.'); });
      case 'billar': return this.openShop('billar');
      default:
        if (INFO[s.interact]) return this.dialog.scene(async d => { await d.narrate(INFO[s.interact]); });
    }
  }

  // ---- main loop -------------------------------------------------------------------------
  frame(dt) {
    const frozen = this.frozen;
    if (!frozen) this.clock.real += 0; // (clock.real advanced by tick)
    if (this.playing && !this.ui.menuOpen && !this.cutsceneActive && !this.dialog.active) this.clock.tick(dt);
    else { this.clock.dt = dt; if (!frozen) this.clock.real += dt; }
    this.env.update(this.clock, dt);
    if (this.map.id === 'town' && this.clock.weekday !== this.lastWeekday) { this.lastWeekday = this.clock.weekday; applyWeekday(this.map, this.clock.weekday); }
    if (this.playing) this.update(dt);
    else { // title backdrop: slow pan across the plaza
      this.camera.x = (125 + Math.sin(this.clock.real * 0.05) * 20) * TILE; this.camera.y = 100 * TILE;
    }
    this.renderer.draw(this);
    if (this.playing) this.ui.updateHUD();
    this.audio.ambience(this, dt);
    this.input.endFrame();
  }

  update(dt) {
    const p = this.player, inp = this.input;
    if (!this.frozen) {
      this.npcs.update(dt);
      for (const e of this.effects) e.update?.(dt, this);
    }
    this.map.act = this.state.act;
    // an unpaid debt slowly costs you your word
    if (this.debtOverdue() && this.state.debtPenaltyDay !== this.clock.dayIndex) {
      this.state.debtPenaltyDay = this.clock.dayIndex; this.addStat('palabra', -3);
      this.ui.toast('En el pueblo ya se comenta que no le has pagado a Don Refugio.', 'bad');
    }
    // status effects
    if (this.status.enchilado > 0) { this.status.enchilado = Math.max(0, this.status.enchilado - dt * 0.5); if (this.status.enchilado === 0) this.refreshLook(); }
    if (this.status.buzz > 0) this.status.buzz = Math.max(0, this.status.buzz - dt * 0.35);
    if (this.handGlow > 0) this.handGlow -= dt;
    this.refreshLook();
    // item sync every few seconds
    this.itemTimer = (this.itemTimer || 0) - dt;
    if (this.itemTimer <= 0) { this.itemTimer = 3; this.syncItems(); }
    // player movement
    p.updateAnim(dt);
    p.moving = false;
    if (this.doorCooldown > 0) this.doorCooldown -= dt;
    const canMove = inp.enabled && !this.dialog.active && !this.ui.menuOpen && !this.ui.shopOpenFlag && !this.cutsceneActive && !this.transitioning;
    if (canMove) {
      let { x, y } = inp.axis();
      if (this.status.buzz > 45) { const w = Math.sin(this.clock.real * 2.3) * (this.status.buzz - 45) / 110; const nx = x - y * w, ny = y + x * w; x = nx; y = ny; }
      if (x || y) {
        p.pose = null;
        p.running = inp.run;
        const sp = p.speed * (inp.run ? 1.65 : 1) * (this.stats.panza > 70 ? 0.9 : 1) * (this.map.get(Math.floor(p.x / TILE), Math.floor(p.y / TILE)) === G.ROCKROAD ? 0.85 : 1);
        const vx = x * sp, vy = y * sp;
        const moved = p.tryMove(vx, vy, dt, this.entities);
        p.setDirFromVec(vx, vy);
        p.moving = moved;
        if (moved) this.stats.panza = Math.max(0, this.stats.panza - dt * 0.012);
        // walking into a door
        if (!moved || true) {
          const [fx, fy] = [[0, 1], [0, -1], [-1, 0], [1, 0]][p.dir];
          const tx = Math.floor((p.x + fx * 7) / TILE), ty = Math.floor((p.y + fy * 5) / TILE);
          const door = this.map.doors.find(d => tx >= d.x && tx < d.x + d.w && ty >= d.y && ty < d.y + d.h);
          if (door && !(this.doorCooldown > 0) && !door.generic) {
            const intoDoor = (door.fromNorth || door.fromSouth) ? p.dir === 0 : p.dir === 1;
            if (intoDoor && !moved) this.enterDoor(door);
          }
        }
      }
      // exits
      const ex = this.map.exitAt(p.x, p.y);
      if (ex && !this.transitioning) this.useExit(ex);
      // interaction prompt & action
      const it = this.findInteraction();
      this.ui.prompt(this.promptFor(it));
      if (inp.action()) this.interact(it);
    } else if (!this.dialog.active) this.ui.prompt(null);
    // hand glow when talking sincerely (the añil stain)
    this.dynamicGlow = this.handGlow > 0;
    // camera
    const target = { x: p.x, y: p.y - 10 };
    if (!this.camLock) {
      const k = Math.min(1, dt * 6);
      this.camera.x = lerp(this.camera.x, target.x, k); this.camera.y = lerp(this.camera.y, target.y, k);
    }
    const vw = this.renderer.viewW, vh = this.renderer.viewH, mw = this.map.w * TILE, mh = this.map.h * TILE;
    this.camera.x = mw < vw ? mw / 2 : clamp(this.camera.x, vw / 2, mw - vw / 2);
    this.camera.y = mh < vh ? mh / 2 : clamp(this.camera.y, vh / 2, mh - vh / 2);
    // light around the player at night (lantern) & the añil glow
    this.dynamicLights = (this.dynamicLights || []).filter(l => !l.player);
    if (this.map.outdoor && this.env.light < 0.5 && this.hasItem('linterna')) this.dynamicLights.push({ x: p.x, y: p.y - 6, r: 90, color: '#fff2c0', player: true });
    if (this.handGlow > 0) this.dynamicLights.push({ x: p.x, y: p.y - 12, r: 60, color: '#6e6bff', player: true, power: 0.6 });
  }
  useExit(ex) {
    if (ex.to === '__back' || ex.to === '__back2') { this.exitInterior(ex.to); return; }
    if (ex.to === 'closed') {
      const p = this.player;
      if (ex.w >= ex.h) p.y += (ex.y === 0 ? 1 : -1) * 22; else p.x += (ex.x === 0 ? 1 : -1) * 22;
      this.dialog.scene(async d => { await d.narrate(ex.msg || `${ex.label}: por ahora el camino está cerrado.`); });
      return;
    }
    if (ex.to === 'sahuayo_sign' || ex.to === 'zamora_sign') {
      this.player.x += ex.to === 'sahuayo_sign' ? 20 : -20;
      this.dialog.scene(async d => {
        await d.narrate(ex.to === 'sahuayo_sign' ? 'La carretera a Sahuayo. A seis kilómetros está el pueblo vecino: comercio, huaraches y mucho movimiento. Pero lo que buscas está aquí, en Jiquilpan.' : 'La carretera a Zamora y a Morelia. Por aquí llegan los que vienen de lejos. Hoy no te vas a ningún lado.');
      });
      return;
    }
    this.transition(() => {
      this.returnStack = [];
      this.changeMap(ex.to, ex.tx, ex.ty, ex.dir ?? (ex.to === 'town' ? 0 : 1));
      if (ex.to === 'town' && this.state.act >= 3 && this.clock.hour < 7) this.clock.advanceTo(7.5);
    });
  }
}
