// Conversations: scripted beats + an always-fresh procedural generator + optional live LLM.
import { GREET, ADDRESS, CLOSE, TOPICS, TYPED_FALLBACK } from './data/lines.js';
import { pick, DAYS } from './util.js';
import { addRel, getRel, relKey, relLevel, giftValue, noteRel } from './life.js';
import { ITEMS } from './data/items.js';

const r = Math.random;

// A rough reading of the mood of a line, for the speaker's face.
export function moodOf(text = '') {
  const t = text.toLowerCase();
  if (/jaja|jeje|qué gusto|me da gusto|bienvenid|gracias|qué bonit|¡ánimo|me encanta|felicidades|sí quiero|qué rico|a toda madre|chido/.test(t)) return 'happy';
  if (/¿de veras|no puede ser|¡no!|¡¿|¡qué!|¡ay, dios|increíble|¡órale!|¿en serio/.test(t)) return 'surprised';
  if (/lárgate|cállate|qué te pasa|grosero|no te metas|¡oiga!|me ofend|ni se te ocurra|váyase|sinvergüenza|maldit/.test(t)) return 'angry';
  if (/triste|extraño|murió|se fue|perdón|lástima|desapareci|llor|ya no está|nadie sabe|solo|sola|miedo|ay, mijo/.test(t)) return 'sad';
  return null;
}

export class Dialogue {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.recent = new Map(); // npc id -> Set of recently used lines
  }
  get ui() { return this.game.ui; }

  // ---- primitives used by scripts -----------------------------------
  async say(who, text, opts = {}) {
    // faces follow the mood of what is said (eyebrows, eyes, mouth)
    const look = who && (who.look || who.def?._look);
    if (look && !look.mask) look.expr = opts.expr || moodOf(text);
    this.ui.dialogSpeaker(who);
    await this.ui.dialogText(text, opts);
    if (!opts.noWait) await this.ui.waitAdvance();
  }
  async narrate(text) { return this.say(null, text); }
  async choose(options, who) {
    if (who !== undefined) this.ui.dialogSpeaker(who);
    return this.ui.dialogChoices(options);
  }
  async askText(placeholder) { return this.ui.dialogAsk(placeholder); }
  begin() { this.active = true; this.game.input.enabled = false; }
  end() { this.active = false; this.ui.hideDialog(); this.game.input.enabled = true; this.game.input.endFrame(); }

  // Run a scripted scene (function receiving this dialogue)
  async scene(fn) {
    if (this.active) return;
    this.begin();
    try { await fn(this); } catch (e) { console.error(e); }
    this.end();
  }

  // ---- talking to an NPC ----------------------------------------------
  async converse(npc) {
    if (this.active) return;
    const g = this.game, def = npc.def || {};
    this.begin();
    npc.talking = true; npc.pose = 'talk';
    npc.face(g.player.x, g.player.y); g.player.face(npc.x, npc.y);
    g.stats.talks = (g.stats.talks || 0) + 1;
    try {
      let handled = false;
      if (def.script) handled = await def.script(g, npc, this);
      else { const qs = g.quests.scriptFor(npc); if (qs) handled = await qs(this); }
      if (handled !== 'end') {
        if (!handled) await this.say(npc, this.opener(npc));
        await this.menu(npc);
      }
    } catch (e) { console.error(e); }
    npc.talking = false; npc.pose = null;
    if (npc.look) npc.look.expr = null;
    g.player.look.expr = null;
    this.end();
  }

  async menu(npc) {
    const g = this.game, def = npc.def || {};
    for (let guard = 0; guard < 40; guard++) {
      const opts = [];
      for (const q of g.quests.optionsFor(npc)) opts.push(q);
      if (def.shop && g.shopOpen(def)) opts.push({ text: def.shopLabel || 'Quiero comprar algo', tag: 'money', tag2: '$', value: 'shop' });
      if (g.state.act === 1 && !g.flags['asked_' + (def.id || npc.id)] && def.id !== 'abuela') opts.push({ text: '¿No ha visto a mi abuelo Miguel?', tag: 'quest', value: 'abuelo' });
      if (g.state.act >= 3 && !g.flags['told_' + (def.id || npc.id)] && !def.noCerro) opts.push({ text: 'Contarle lo que pasó en el cerro', tag: 'honest', value: 'cerro' });
      if (g.flags.mancha && !g.flags['hilo_' + (def.id || npc.id) + '_' + g.state.era] && !def.noHilo) opts.push({ text: 'Guardar el celular y escuchar', tag: 'kind', value: 'listen' });
      opts.push({ text: 'Platicar', value: 'chat' });
      if (relKey(npc)) opts.push({ text: 'Convivir…', value: 'social' });
      opts.push({ text: 'Adiós', value: 'bye' });
      const c = await this.choose(opts, npc);
      if (!c || c.value === 'bye') {
        this.ui.dialogSpeaker(npc);
        await this.ui.dialogText(this.fill(pick(Math.random, CLOSE), npc));
        await this.ui.waitAdvance(1400);
        return;
      }
      if (c.run) { const res = await c.run(this); if (res === 'end') return; continue; }
      if (c.value === 'shop') { this.ui.hideDialog(); await g.openShop(def.shop, npc); if (!this.active) return; continue; }
      if (c.value === 'chat') { await this.chat(npc); continue; }
      if (c.value === 'social') { await this.social(npc); continue; }
      if (c.value === 'abuelo') {
        g.flags['asked_' + (def.id || npc.id)] = true;
        const k = def.knows && def.knows.abuelo;
        if (k) { await this.say(npc, typeof k === 'function' ? k(g) : k); if (def.clue) g.quests.addClue(def.clue); noteRel(g, npc, 'Te ayudó a buscar a tu abuelo'); }
        else await this.say(npc, this.fill(pick(r, TOPICS.abuelo_no), npc));
        continue;
      }
      if (c.value === 'cerro') { g.flags['told_' + (def.id || npc.id)] = true; await this.tellCerro(npc); continue; }
      if (c.value === 'listen') { await this.listen(npc); continue; }
    }
  }

  // ---- closed conversation: what they say, and how you answer shapes who you are -------------------
  async chat(npc) {
    const g = this.game, def = npc.def || {};
    let line = null;
    if (g.llm.available && !def.crowd) {
      this.ui.dialogSpeaker(npc); this.ui.dialogThinking();
      line = await g.llm.reply(this.systemPrompt(npc), [{ role: 'user', content: '(El muchacho se acerca a platicar contigo. Dile una sola cosa natural, de una o dos oraciones, según tu personaje y el momento.)' }]);
    }
    await this.say(npc, line || this.topicLine(npc));
    const opts = [
      { text: pick(r, REPLY.kind), tag: 'kind', value: 'kind' },
      { text: pick(r, REPLY.funny), tag: 'funny', value: 'funny' },
      { text: pick(r, REPLY.honest), tag: 'honest', value: 'honest' },
      { text: pick(r, REPLY.mean), tag: 'mean', value: 'mean' },
    ];
    const c = await this.choose(opts, npc);
    const key = relKey(npc), rel = key ? getRel(g, key) : null, first = rel && rel.day !== g.clock.dayIndex;
    if (rel) rel.day = g.clock.dayIndex;
    g.stats.style = g.stats.style || { kind: 0, funny: 0, honest: 0, mean: 0 };
    g.stats.style[c.value]++;
    const likesJokes = (def.persona || '').match(/bromista|chist|platicad|alegre|burl|coquet/i);
    if (c.value === 'kind') { g.addStat('corazon', 1); addRel(g, npc, first ? 4 : 1); await this.say(npc, pick(r, REACT.kind), { expr: 'happy' }); }
    else if (c.value === 'funny') { const ok = likesJokes || r() < 0.65; g.addStat('fama', ok ? 1 : 0); addRel(g, npc, ok ? (first ? 4 : 2) : -2); await this.say(npc, pick(r, ok ? REACT.funny : REACT.flat), { expr: ok ? 'happy' : 'neutral' }); }
    else if (c.value === 'honest') { g.addStat('palabra', 1); addRel(g, npc, first ? 3 : 1); await this.say(npc, pick(r, REACT.honest)); }
    else { g.addStat('corazon', -2); addRel(g, npc, -5); await this.say(npc, pick(r, REACT.mean), { expr: r() < 0.5 ? 'angry' : 'sad' }); }
  }

  async social(npc) {
    const g = this.game, def = npc.def || {}, key = relKey(npc), rel = getRel(g, key), today = g.clock.dayIndex;
    const name = def.short || def.name || npc.name;
    const opts = [];
    if (rel.comp !== today) opts.push({ text: 'Hacerle un cumplido', tag: 'kind', value: 'comp' });
    if (rel.joke !== today) opts.push({ text: 'Echarle carrilla (burlarte tantito)', tag: 'mean', value: 'tease' });
    const gifts = Object.keys(g.state.inventory).filter(k => g.state.inventory[k] > 0 && giftValue(def, k) !== null);
    if (gifts.length) opts.push({ text: 'Darle un regalo', tag: 'kind', value: 'gift' });
    if (rel.v >= 45 && rel.favor !== today) opts.push({ text: 'Pedirle un favor de amigos', tag: 'quest', value: 'favor' });
    if (def.romance && !rel.novios && rel.v >= 30 && rel.date !== today) opts.push({ text: `Invitar a ${name} a dar la vuelta a la plaza`, tag: 'kind', value: 'date' });
    if (def.romance && !rel.novios && rel.v >= 75) opts.push({ text: `Pedirle a ${name} que sea tu ${npc.look?.female ? 'novia' : 'novio'}`, tag: 'honest', value: 'ask' });
    if (def.politico) opts.push({ text: 'Pedirle que arregle los baches de la calle', tag: 'honest', value: 'baches' });
    opts.push({ text: 'Nada, olvídalo', value: null });
    const c = await this.choose(opts, npc);
    if (!c.value) return;
    if (c.value === 'comp') {
      rel.comp = today; g.addStat('corazon', 1);
      const ok = r() < 0.85; addRel(g, npc, ok ? 5 : 1);
      await this.say({ name: g.state.name, look: g.player.look }, pick(r, COMPLIMENTS));
      await this.say(npc, pick(r, ok ? REACT.compliment : REACT.flat), { expr: ok ? 'happy' : 'neutral' });
    } else if (c.value === 'tease') {
      rel.joke = today; g.addStat('fama', 1); g.addStat('corazon', -1);
      const takes = (def.persona || '').match(/bromista|burl|chist/i) && r() < 0.6;
      addRel(g, npc, takes ? 2 : -6);
      await this.say({ name: g.state.name, look: g.player.look }, pick(r, TEASES));
      await this.say(npc, pick(r, takes ? REACT.tease_ok : REACT.tease_bad), { expr: takes ? 'happy' : 'angry' });
    } else if (c.value === 'gift') {
      const gc = await this.choose(gifts.map(k => ({ text: `${ITEMS[k].ico} ${ITEMS[k].name}`, value: k })).concat([{ text: 'Mejor no', value: null }]), npc);
      if (!gc.value) return;
      g.takeItem(gc.value);
      let v = giftValue(def, gc.value); if (rel.gift === today) v = Math.round(v / 3);
      rel.gift = today; addRel(g, npc, v); g.addStat('corazon', 2);
      if (v >= 12) noteRel(g, npc, `Le encantó tu regalo: ${ITEMS[gc.value].name.toLowerCase()}`);
      await this.say(npc, pick(r, v >= 12 ? REACT.gift_love : v > 0 ? REACT.gift_ok : REACT.gift_bad), { expr: v >= 12 ? 'surprised' : v > 0 ? 'happy' : 'sad' });
    } else if (c.value === 'favor') {
      rel.favor = today;
      if (def.shop) { await this.say(npc, pick(r, ['Para ti, lo que quieras de aquí te lo dejo a precio de amigo. Y hoy, esto va por mi cuenta.', 'Ándale, llévate esto. No me lo pagues; nomás no le digas a nadie.'])); const e = (await import('./data/items.js')).SHOPS[def.shop]?.items?.[0]; if (e) { const eff = { ...e[4] }; if (eff.give) g.giveItem(eff.give); else g.applyEffect(eff); } }
      else if (npc.look?.age === 'elder') { const n = 20 + Math.floor(r() * 4) * 10; await this.say(npc, `Ten, mijo, para tus tacos. No me digas que no, que me ofendo.`); g.addMoney(n); }
      else await this.say(npc, pick(r, SECRETS));
      noteRel(g, npc, 'Te hizo un favor de amigos');
    } else if (c.value === 'date') {
      rel.date = today;
      const h = g.clock.hour, nice = h >= 17 && h < 22;
      await this.narrate(nice ? `Dan la vuelta a la plaza con ${name}, como se hacía antes: despacio, alrededor del kiosco, con una nieve del portal. Nadie saca el celular.` : `Caminan un rato con ${name}. Hace calor y hay mucho ruido, pero platican a gusto.`);
      addRel(g, npc, nice ? 8 : 4); g.addStat('corazon', 1);
      await this.say(npc, pick(r, REACT.date));
      g.clock.minutes += 40;
    } else if (c.value === 'ask') {
      const other = Object.entries(g.state.rel || {}).find(([k, v]) => v.novios && k !== key);
      if (other) { g.state.rel[other[0]].v -= 40; g.state.rel[other[0]].novios = false; g.addStat('fama', -6); g.ui.toast('En Jiquilpan todo se sabe: tu otra relación se terminó.', 'bad'); }
      rel.novios = true; addRel(g, npc, 6, true); g.addStat('fama', 3);
      await this.say(npc, pick(r, ['…¿De veras? Sí. Sí quiero. Pero me vas a llevar a misa el domingo y a comer birria con mi familia, ¿eh?', 'Ay, ya te habías tardado. Sí. Y que se entere todo el pueblo.']));
      g.ui.toast(`💞 ${name} y tú ya son novios`, 'good');
    } else if (c.value === 'baches') {
      g.flags.asked_politico = (g.flags.asked_politico || 0) + 1;
      await this.say(npc, pick(r, POLITICO));
      g.quests.onEvent?.('politico');
    }
  }

  async tellCerro(npc) {
    const g = this.game, def = npc.def || {};
    const opts = [
      { text: 'Decir la verdad: las luces, la nave, el ser gris, el mensaje', tag: 'honest', value: 'truth' },
      { text: 'Mejor bromear: “Fue el mezcal de mi tío Toño”', tag: 'mean', value: 'joke' },
    ];
    const c = await this.choose(opts, npc);
    if (c.value === 'joke') {
      g.addStat('palabra', -3); g.addStat('fama', 4);
      await this.say(npc, pick(r, ['¡Jajaja! Ya decía yo. Ese Toño…', 'Jaja, ¡ahí está! Por fin alguien sensato en esa familia.', 'Jajaja. Bueno, al menos admite.']));
      return;
    }
    g.addStat('palabra', 3);
    const believe = def.believer || (g.state.act >= 4 && r() < 0.35 + g.stats.corazon / 300) || (g.stats.fama > 20 && r() < 0.3);
    if (believe) { g.addStat('fama', 3); g.state.believers = (g.state.believers || 0) + 1; await this.say(npc, this.fill(pick(r, TOPICS.believer), npc)); }
    else { g.addStat('fama', -4); await this.say(npc, this.fill(pick(r, TOPICS.marcianos), npc)); }
  }

  async listen(npc) {
    const g = this.game, def = npc.def || {};
    const story = (def.stories && def.stories.length) ? pick(r, def.stories) : this.genericStory(npc);
    await this.say(npc, story);
    const c = await this.choose([
      { text: 'Quedarte en silencio y escuchar hasta el final', tag: 'kind', value: 'k' },
      { text: 'Sacar el celular a medio relato', tag: 'mean', value: 'm' },
    ], npc);
    if (c.value === 'm') {
      g.addStat('corazon', -6);
      await this.say(npc, pick(r, ['…Ándele, siga con su teléfono.', 'Ya ni para qué le cuento.', 'Igualito que mis nietos.']));
      return;
    }
    g.flags['hilo_' + (def.id || npc.id) + '_' + g.state.era] = true;
    g.addStat('corazon', 5);
    await this.say(npc, pick(r, ['Gracias por escucharme, de veras. Hace mucho nadie lo hacía.', 'No sé por qué le conté todo esto. Pero me siento más ligero.', 'Usted tiene algo en la mirada… como su abuelo.']));
    g.gainHilo(npc);
  }

  // ---- procedural generation ----------------------------------------
  ctx(npc) {
    const g = this.game, def = npc.def || {};
    const age = npc.look?.age || 'adult';
    return {
      addr: pick(r, ADDRESS[age === 'elder' ? 'elder' : age === 'teen' ? 'teen' : age === 'kid' ? 'kid' : 'adult']),
      greet: this.greeting(), name: g.state.name,
    };
  }
  greeting() {
    const h = this.game.clock.hour;
    return pick(r, h < 12 ? GREET.morning : h < 19 ? GREET.afternoon : GREET.night);
  }
  fill(t, npc) {
    const c = this.ctx(npc);
    const others = this.game.npcs.namedPresent().filter(n => n !== npc.def?.name);
    return t.replace(/\{addr\}/g, c.addr).replace(/\{greet\}/g, c.greet).replace(/\{name\}/g, c.name)
      .replace(/\{npc\}/g, others.length ? pick(r, others) : 'la del portal')
      .replace(/\{sahuayo\}/g, () => pick(r, TOPICS.sahuayo)).replace(/\{food\}/g, () => pick(r, TOPICS.food))
      .replace(/\{tech\}/g, () => pick(r, this.game.state.era === 'after' ? TOPICS.tech_after : TOPICS.tech_before));
  }
  uniq(npc, list) {
    const key = npc.def?.id || npc.id;
    let set = this.recent.get(key); if (!set) { set = new Set(); this.recent.set(key, set); }
    const fresh = list.filter(l => !set.has(l));
    const line = pick(r, fresh.length ? fresh : list);
    set.add(line); if (set.size > 24) set.delete(set.values().next().value);
    return line;
  }
  opener(npc) {
    const g = this.game, def = npc.def || {};
    const c = this.ctx(npc);
    let first = `${c.greet}, ${c.addr}.`;
    if (def.quirks && r() < 0.6) first = this.fill(pick(r, def.quirks), npc);
    const extra = [];
    // stat-reactive remarks (Fable-like: the town notices who you are)
    if (g.effects && g.status.enchilado > 0) extra.push(TOPICS.stat_enchilado);
    if (g.status.buzz > 30) extra.push(TOPICS.stat_buzz);
    if (g.stats.panza > 60 && r() < 0.5) extra.push(TOPICS.stat_panza);
    if (g.debtOverdue() && r() < 0.5) extra.push(TOPICS.stat_fiado);
    if (g.stats.corazon > 45 && r() < 0.35) extra.push(TOPICS.stat_good);
    if (g.stats.corazon < -35 && r() < 0.6) extra.push(TOPICS.stat_bad);
    if (g.state.act >= 3 && g.state.era !== 'after' && r() < 0.45 && !def.believer && !def.family) extra.push(TOPICS.marcianos);
    if (def.family) extra.length = 0;
    let line = extra.length ? this.fill(this.uniq(npc, pick(r, extra)), npc) : this.topicLine(npc);
    return first + ' ' + line;
  }
  topicLine(npc) {
    const g = this.game, def = npc.def || {};
    const pools = [];
    const w = g.env.weather;
    if (def.family && def.lines) return this.fill(this.uniq(npc, r() < 0.7 ? def.lines : (TOPICS.weather[w] || TOPICS.weather.soleado)), npc);
    pools.push([TOPICS.weather[w] || TOPICS.weather.soleado, 2]);
    pools.push([TOPICS.weekday[g.clock.weekday], 1.5]);
    const h = g.clock.hour;
    pools.push([h < 7.5 ? TOPICS.time.dawn : h < 11 ? TOPICS.time.morning : h < 16 ? TOPICS.time.noon : h < 20 ? TOPICS.time.evening : TOPICS.time.night, 1.5]);
    const place = g.placeKey();
    pools.push([TOPICS.place[place] || TOPICS.place.generic, 2.5]);
    pools.push([TOPICS.sahuayo, 1.2]);
    pools.push([TOPICS.culture, 1.5]);
    pools.push([TOPICS.food, 1.5]);
    pools.push([g.state.era === 'after' ? TOPICS.tech_after : TOPICS.tech_before, g.state.era === 'after' ? 3 : 1]);
    pools.push([TOPICS.gossip, 1]);
    if (def.lines) pools.push([def.lines, 4]);
    if (g.state.act === 1) pools.push([TOPICS.abuelo_no, 0.8]);
    if (g.state.act <= 3 && !def.believer && !def.family) pools.push([TOPICS.skeptic, g.state.act === 1 ? 0.35 : 0.5]);
    let tot = pools.reduce((a, p) => a + p[1], 0), x = r() * tot;
    let chosen = pools[0][0];
    for (const [list, wt] of pools) { x -= wt; if (x <= 0) { chosen = list; break; } }
    return this.fill(this.uniq(npc, chosen), npc);
  }
  genericStory(npc) {
    const who = npc.look?.age;
    const stories = [
      'Mi papá tenía un puesto en el mercado. Cuando murió, pensé que nadie se acordaría de él… pero todavía me paran para decirme que su birria era la mejor.',
      'Tengo un hijo en Chicago. Hace tres años que no lo abrazo. Me manda videos, y los veo todas las noches, pero un video no huele a él.',
      'Cuando era joven bailaba en la Casa de la Cultura. Dejé de ir cuando me casé. A veces paso por ahí y escucho la música desde la banqueta.',
      'Yo le tenía miedo al cerro de niño. Mi abuela decía que ahí arriba se escuchan pasos cuando no hay nadie.',
      'Me cuesta trabajo hablar con mis hijos. Están siempre en el teléfono y yo no sé cómo entrarles.',
      'Hace años perdí mi trabajo y me daba vergüenza salir a la plaza. Un viernes Don Miguel, su abuelo, me invitó unos tacos y me dijo: “aquí nadie es menos”.',
    ];
    if (who === 'teen') return pick(r, ['Neta, a veces me siento más solo con quinientos seguidores que cuando no tenía celular.', 'Mi mamá trabaja en Sahuayo todo el día. Llego a mi casa y no hay nadie. Por eso me vengo a la plaza.', 'Quiero estudiar en la UNAM, pero nadie en mi familia ha ido a la universidad. Me da miedo decepcionarlos.']);
    if (who === 'kid') return pick(r, ['Mi perro se llama Canelo y no le gusta el cerro. Se pone a llorar cuando lo ve.', 'Mi papá está en el norte. Me dijo que regresa en diciembre. Ya van dos diciembres.']);
    return pick(r, stories);
  }
  localReply(npc, text) {
    const t = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const def = npc.def || {};
    let key = 'default';
    const map = [['abuel', 'abuelo'], ['miguel', 'abuelo'], ['tono', 'abuelo'], ['cerro', 'cerro'], ['luz', 'luces'], ['luces', 'luces'], ['ovni', 'luces'], ['extraterrest', 'luces'], ['marcian', 'luces'],
      ['sahuayo', 'sahuayo'], ['taco', 'taco'], ['comer', 'comida'], ['hambre', 'hambre'], ['birria', 'comida'], ['cardenas', 'cardenas'], ['general', 'cardenas'], ['celular', 'celular'], ['telefono', 'telefono'],
      ['internet', 'internet'], ['tiktok', 'tiktok'], ['gracias', 'gracias'], ['hola', 'hola'], ['buenas', 'hola'], ['amor', 'amor'], ['novia', 'amor'], ['dinero', 'dinero'], ['trabajo', 'dinero'], ['jacaranda', 'jacaranda']];
    for (const [k, v] of map) if (t.includes(k)) { key = v; break; }
    if (def.knows) for (const k in def.knows) if (t.includes(k)) { const v = def.knows[k]; return typeof v === 'function' ? v(this.game) : v; }
    const tmpl = pick(r, TYPED_FALLBACK[key] || TYPED_FALLBACK.default);
    const topic = this.topicLine(npc);
    const hint = (def.knows && def.knows.abuelo) ? (typeof def.knows.abuelo === 'function' ? def.knows.abuelo(this.game) : def.knows.abuelo) : this.fill(pick(r, TOPICS.abuelo_no), npc);
    return this.fill(tmpl.replace('{abuelo_hint}', hint).replace('{topic}', topic).replace('{topic_lc}', topic.charAt(0).toLowerCase() + topic.slice(1)), npc);
  }
  systemPrompt(npc) {
    const g = this.game, def = npc.def || {};
    const place = g.placeName();
    const when = `${DAYS[g.clock.weekday]} ${g.clock.date.getUTCDate()}/${g.clock.date.getUTCMonth() + 1}/${g.clock.date.getUTCFullYear()}, ${Math.floor(g.clock.hour)}:${String(Math.floor(g.clock.minuteOfDay % 60)).padStart(2, '0')} h`;
    const acts = {
      1: `${g.state.name}, nieto de Don Miguel, busca a su abuelo Miguel y al hermano de éste, Don Antonio "Toño", que subieron a acampar al Cerro de San Francisco hace días y no han vuelto. Si tu personaje no sabe nada, dilo; no inventes que los viste.`,
      2: `${g.state.name} está buscando a su abuelo en el Cerro de San Francisco.`,
      3: `Hace unos días regresaron ${g.state.name}, Don Miguel y Don Toño del Cerro de San Francisco después de CINCO MESES desaparecidos (ellos creen que fueron cinco días). Dicen que vieron una nave, un ser gris que los miró a los ojos y les dio un mensaje: que la gente deje las pantallas porque la tecnología está deshaciendo cómo nos miramos y hablamos. Casi nadie les cree; en el pueblo les dicen "los marcianos del cerro" y circulan memes. Tu personaje reacciona según su carácter (burla, duda, compasión o curiosidad).`,
      4: `Han pasado dos años desde que ${g.state.name} y sus abuelos regresaron del cerro con el mensaje sobre la tecnología. Ahora se nota: menos gente en la plaza, más pantallas, relaciones más frías. Algunos empiezan a creerles.`,
      5: `El pueblo acaba de vivir La Noche del Añil en la plaza. Tu personaje la recuerda.`,
    };
    const rep = [];
    if (g.stats.corazon > 40) rep.push('tiene fama de buena persona'); if (g.stats.corazon < -30) rep.push('tiene fama de grosero');
    if (g.debtOverdue()) rep.push('le debe dinero a Don Refugio por leche fiada');
    if (g.stats.fama < -30) rep.push('muchos se burlan de él por lo del cerro');
    if (g.status.enchilado > 0) rep.push('ahorita está muy enchilado, rojo y sudando');
    if (g.status.buzz > 30) rep.push('se nota que ya tomó');
    const knows = def.knows ? Object.entries(def.knows).map(([k, v]) => `- ${k}: ${typeof v === 'function' ? v(g) : v}`).join('\n') : '';
    return `Eres ${def.name || npc.name}, ${def.role || 'habitante'} de Jiquilpan de Juárez, Michoacán (Pueblo Mágico en la Ciénega de Chapala, cuna de Lázaro Cárdenas; vecino de Sahuayo, que es más comercial, mientras Jiquilpan presume su cultura, sus murales de Orozco y su historia política).
Personalidad: ${def.persona || 'una persona común del pueblo, amable y platicadora.'}
Estás en: ${place}. Momento: ${when}. Clima: ${g.env.weather}${g.env.temp ? `, ${g.env.temp}°C` : ''}.
Hablas con ${g.state.name}${rep.length ? ' (' + rep.join('; ') + ')' : ''}.
Situación: ${acts[g.state.act] || acts[1]}
${knows ? 'Lo que tu personaje sabe:\n' + knows : ''}
Estilo: español mexicano natural de la región (Michoacán), cálido y con modismos locales sin caricaturizar. Responde SIEMPRE en personaje, en 1 a 3 frases (máximo 60 palabras), sin narración entre asteriscos, sin listas y sin mencionar que eres una IA o un juego. Si te preguntan algo que tu personaje no sabría, dilo con naturalidad. Cada respuesta debe sentirse nueva y específica a este momento.`;
  }
}

// Answers you can give, and how people react to them
const REPLY = {
  kind: ['Qué bonito lo que dice. Gracias por contarme.', 'Usted siempre tan amable, de veras.', 'Me alegra verlo bien. ¿Y la familia?', 'Cuente conmigo para lo que se ofrezca.'],
  funny: ['¡Ah, chirrión! Eso ni mi tío Toño se lo cree.', 'Jaja, con razón dicen que en Jiquilpan no hay noticias: hay chismes.', 'Si eso pasa en Sahuayo, ya lo estarían vendiendo.', 'Pues mientras no sea la salsa de Don Chon, todo bien.'],
  honest: ['Le voy a ser sincero: no estoy tan seguro.', 'La verdad, yo lo veo de otro modo.', 'Mire, yo nomás digo lo que vi.', 'No sé mucho de eso, pero me gustaría aprender.'],
  mean: ['Ajá… ¿y a mí qué?', 'Ya me aburrió con eso.', 'Pues allá usted.', 'Qué chismoso me salió.'],
};
const REACT = {
  kind: ['Ay, gracias, muchacho. Da gusto platicar con alguien educado.', 'Qué buena gente eres. Se nota de qué familia vienes.', 'Bien, gracias a Dios. Saludos a tu abuela.'],
  funny: ['¡Jajaja! Ay, qué ocurrente.', 'Jaja, ¡no te pases! Pero sí, eh.', '¡Jajaja! Eso se lo voy a contar a mi señora.'],
  flat: ['…Mmm. Bueno.', 'Ajá. Ok.', 'No le entendí, pero bueno.'],
  honest: ['Eso me gusta: alguien que dice las cosas derechas.', 'Tienes razón. A veces uno habla de más.', 'Pues fíjate que sí. Gracias por la franqueza.'],
  mean: ['Oye, oye. ¿Así te enseñaron en tu casa?', '…Ándale pues. Que te vaya bien.', 'Mira nomás qué modos.'],
  compliment: ['¡Ay, no exageres! …Pero gracias.', 'Uy, me chuleaste el día.', 'Jaja, ya, ya. Me vas a hacer sonrojar.'],
  tease_ok: ['¡Jajaja! Sí, ya sé, ya sé. Tú tampoco te salvas.', 'Uy, cuidado, que yo también sé cosas de ti, eh.'],
  tease_bad: ['No me parece chistoso.', 'Ah, ¿sí? Qué bonito. Ya veremos quién se ríe.', 'Pues mira, si vas a estar de payaso, mejor vete.'],
  gift_love: ['¡No me digas! ¿Es para mí? Ay, ¿cómo supiste? Me encanta.', '¡Qué detallazo! Esto no se me olvida.'],
  gift_ok: ['Gracias, muchacho. Qué amable.', 'Ah, mira. Gracias, eh.'],
  gift_bad: ['…Gracias, supongo. No es lo mío.', 'Mmm, bueno. Se lo voy a dar a alguien más.'],
  date: ['Hace mucho que nadie me invitaba a dar la vuelta, como antes.', 'Me la pasé bien. ¿Repetimos el viernes?', 'Me gustó platicar sin prisas. Gracias.'],
};
const COMPLIMENTS = ['Qué bien se ve hoy, eh.', 'Usted es de lo mejor de este pueblo, de veras.', 'Siempre que paso por aquí me alegra el día.', 'Qué bonito le quedó eso.'];
const TEASES = ['¿Y esa cara? ¿Le fue mal en el palenque?', 'Oiga, ¿y ese corte? ¿Se lo hizo en Sahuayo?', 'Ya hasta parece de Sahuayo, nomás le falta vender algo.', '¿Otra vez aquí? Ya nomás le falta una banca con su nombre.'];
const SECRETS = ['Te digo algo, pero no lo andes contando: en el cerro, debajo de las piedras grandes, a veces la gente encuentra puntas de flecha. Mueve las piedras, a ver.', 'Si quieres ganar algo de dinero, Rubén Marín siempre necesita manos en la tortillería, en la mañana.', 'La lotería de Doña Lety, los viernes en la noche: el que se fija, gana.', 'Hay terrenos en venta junto al estadio. Barato no es, pero dicen que va a subir.', 'Güicho, el de Ferretuberías, casi nunca está. Si lo encuentras de buenas, te fía lo que sea.'];
const POLITICO = ['Claro que sí, joven. Ya lo tenemos contemplado en el presupuesto. Para el próximo año, si Dios quiere.', 'Lo voy a subir al Cabildo. Usted no se preocupe: aquí trabajamos por el pueblo. (Te da una tarjeta con su foto.)', '¡Excelente propuesta! Hay que formar una comisión para analizarlo. Venga la otra semana.', 'Mire, eso le toca a Obras Públicas. Y Obras Públicas… pues está de vacaciones.'];
