// Conversations: scripted beats + an always-fresh procedural generator + optional live LLM.
import { GREET, ADDRESS, CLOSE, TOPICS, TYPED_FALLBACK } from './data/lines.js';
import { pick, DAYS } from './util.js';

const r = Math.random;

export class Dialogue {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.recent = new Map(); // npc id -> Set of recently used lines
  }
  get ui() { return this.game.ui; }

  // ---- primitives used by scripts -----------------------------------
  async say(who, text, opts = {}) {
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
    this.end();
  }

  async menu(npc) {
    const g = this.game, def = npc.def || {};
    let typedTurns = 0;
    const history = [];
    for (let guard = 0; guard < 40; guard++) {
      const opts = [];
      for (const q of g.quests.optionsFor(npc)) opts.push(q);
      if (def.shop && g.shopOpen(def)) opts.push({ text: def.shopLabel || 'Quiero comprar algo', tag: 'money', tag2: '$', value: 'shop' });
      if (g.state.act === 1 && !g.flags['asked_' + (def.id || npc.id)] && def.id !== 'abuela') opts.push({ text: '¿No ha visto a mi abuelo Miguel?', tag: 'quest', value: 'abuelo' });
      if (g.state.act >= 3 && !g.flags['told_' + (def.id || npc.id)] && !def.noCerro) opts.push({ text: 'Contarle lo que pasó en el cerro', tag: 'honest', value: 'cerro' });
      if (g.flags.mancha && !g.flags['hilo_' + (def.id || npc.id) + '_' + g.state.era] && !def.noHilo) opts.push({ text: 'Guardar el celular y escuchar', tag: 'kind', value: 'listen' });
      opts.push({ text: 'Platicar', value: 'chat' });
      opts.push({ text: g.llm.available ? 'Decir algo… (conversación libre)' : 'Decir algo…', value: 'type' });
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
      if (c.value === 'chat') { await this.say(npc, this.topicLine(npc)); continue; }
      if (c.value === 'abuelo') {
        g.flags['asked_' + (def.id || npc.id)] = true;
        const k = def.knows && def.knows.abuelo;
        if (k) { await this.say(npc, typeof k === 'function' ? k(g) : k); if (def.clue) g.quests.addClue(def.clue); }
        else await this.say(npc, this.fill(pick(r, TOPICS.abuelo_no), npc));
        continue;
      }
      if (c.value === 'cerro') { g.flags['told_' + (def.id || npc.id)] = true; await this.tellCerro(npc); continue; }
      if (c.value === 'listen') { await this.listen(npc); continue; }
      if (c.value === 'type') {
        const text = await this.askText(g.llm.available ? `Háblale a ${npc.def?.short || npc.name}…` : 'Escribe algo (p. ej. “¿dónde hay tacos?”)');
        if (!text) continue;
        history.push({ role: 'user', content: text });
        this.ui.dialogSpeaker(npc);
        let reply = null;
        if (g.llm.available) {
          this.ui.dialogThinking();
          reply = await g.llm.reply(this.systemPrompt(npc), history.slice(-12));
          if (!reply && g.llm.lastError) g.ui.toast('Conversación libre sin conexión: ' + g.llm.lastError, 'bad');
        }
        if (!reply) reply = this.localReply(npc, text);
        history.push({ role: 'assistant', content: reply });
        await this.say(npc, reply);
        typedTurns++;
        if (typedTurns >= 3 && g.flags.mancha && !g.flags['hilo_' + (def.id || npc.id) + '_' + g.state.era]) {
          g.flags['hilo_' + (def.id || npc.id) + '_' + g.state.era] = true;
          g.gainHilo(npc);
        }
        continue;
      }
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
