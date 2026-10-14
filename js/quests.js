// Main story and side quests.
import { TILE } from './util.js';

export const HILOS_GOAL = 12;
const CLUE_NPC = { rosita: 'Rosita (café de la plaza)', chuy: 'Chuy (sitio de Abasolo)', lupe: 'Don Lupe (El Chamacuero)', refugio: 'Don Refugio (pajaretes)', tona: 'Doña Toña (pueblito del cerro)' };

// Where things are, for the compass & map pins: [map, tileX, tileY]
const PLACES = {
  home: ['town', 225, 156.5], rosita: ['town', 120.5, 102.2], chuy: ['town', 160.8, 128.3], lupe: ['town', 15.5, 26.2], refugio: ['town', 275.5, 39],
  cerro: ['town', 1.5, 20], summit: ['cerro', 41.5, 118.6], tona: ['cerro', 37, 93.4], kiosco: ['town', 126, 105.4], unam: ['town', 225, 194.5],
  palacio: ['town', 170, 105.6], hospital: ['town', 224, 140.4], templo: ['town', 195, 143.4], beto: ['town', 171, 51.5], escuela: ['town', 132, 156.6],
  chema: ['town', 121, 115.4], poncho: ['town', 156.5, 248.4], chon: ['town', 222, 217.2], guero: ['town', 125, 84.2], biblioteca: ['town', 140, 140.4],
  tianguis_fri: ['town', 171, 61], mercado: ['town', 200, 110.4], cochera: ['town', 118, 115], chamacuero: ['town', 14.5, 25.6], parque: ['town', 52, 64],
  bosque: ['town', 194, 253.5], lagunita: ['town', 260.5, 1.5], ezequiel: ['lagunita', 19.5, 25], loteria: ['town', 119.5, 108.8], marin: ['town', 119, 93.4], reboceria: ['town', 62, 40.4], casita: ['town', 29, 254.4],
};

export class Quests {
  constructor(game) {
    this.game = game;
  }
  get s() { return this.game.state; }
  get f() { return this.game.flags; }
  q(id) { return (this.s.quests[id] ||= { stage: 0, done: false }); }
  started(id) { return this.s.quests[id] && this.s.quests[id].stage > 0; }
  done(id) { return this.s.quests[id]?.done; }
  set(id, stage) { const q = this.q(id); q.stage = stage; this.game.save(); }
  finish(id, msg) { const q = this.q(id); if (q.done) return; q.done = true; q.stage = 99; this.game.ui.toast('✔ ' + (msg || SIDE[id]?.title || 'Misión completada'), 'quest'); this.game.sfx('quest'); this.game.save(); }
  start(id) { const q = this.q(id); if (q.stage === 0) { q.stage = 1; this.game.ui.toast('Nueva misión: ' + (SIDE[id]?.title || id), 'quest'); this.game.sfx('quest'); this.game.save(); } }

  addClue(id) {
    const c = this.s.clues;
    if (c.includes(id)) return;
    c.push(id);
    this.game.ui.toast(`Pista (${c.length}): ${CLUE_NPC[id] || id}`, 'quest');
    this.game.sfx('clue');
    if (this.s.act === 1 && c.length >= 3 && this.q('main').stage < 2) { this.set('main', 2); this.game.ui.toast('Fueron al Cerro de San Francisco… pero ¿a dónde, exactamente? El tío Ezequiel, en La Lagunita, sabe.', 'quest'); }
    this.game.save();
  }

  // ---------- tracker -------------------------------------------------------
  objective() {
    const g = this.game, s = this.s, main = this.q('main');
    switch (s.act) {
      case 1:
        if (main.stage < 1) return { title: '¿Han visto a mi abuelo?', text: 'Habla con tu abuela.', at: PLACES.home };
        if (main.stage < 2) return { title: '¿Han visto a mi abuelo?', text: `Pregunta en el pueblo por Don Miguel y Don Toño. Pistas: ${s.clues.length}/3`, at: this.nearestClue() };
        if (!this.f.ezequiel) return { title: 'La Lagunita', text: 'Ve a La Lagunita (por la carretera del norte, junto a Circunvalación, o en taxi). El tío Ezequiel sabe a dónde suben de noche.', at: PLACES.lagunita };
        if (!g.hasItem('linterna')) return { title: 'Rumbo al cerro', text: 'Consigue una linterna (OXXO, “Frijoles”, el tianguis… o pídesela a tu abuela).', at: PLACES.home };
        return { title: 'Rumbo al cerro', text: 'Sube al Cerro de San Francisco: sal por el poniente, por la colonia del panteón, y sigue el camino de terracería.', at: PLACES.cerro };
      case 2:
        if (!this.f.found_grandpas) return { title: 'El Cerro de San Francisco', text: 'Busca a tu abuelo en la cima, junto a la cruz.', at: PLACES.summit };
        return { title: 'La noche en el cerro', text: 'Habla con tu abuelo junto a la fogata.', at: PLACES.summit };
      case 3:
        if (main.stage < 31) return { title: 'Cinco meses', text: 'Baja al pueblo y ve a casa de tu abuela.', at: PLACES.home };
        if (main.stage < 32) return { title: 'El mensaje', text: 'Habla ante el pueblo en el kiosco de la plaza (en la tarde o noche).', at: PLACES.kiosco };
        if (main.stage < 33) return { title: 'Pruebas', text: `Reúne pruebas de lo que pasó: ${this.evidenceCount()}/3 (Doña Toña, la UNAM, la Dra. Estela, los niños).`, at: this.nextEvidence() };
        return { title: 'Pruebas', text: 'Lleva las pruebas al Padre Tomás, en la Parroquia de San Francisco.', at: PLACES.templo };
      case 4: {
        const h = s.hilos;
        const allies = this.alliesCount();
        if (h < HILOS_GOAL || allies < 3) return { title: 'La Noche del Añil', text: `Escucha a la gente (hilos ${h}/${HILOS_GOAL}) y consigue aliados (${allies}/3): el Padre, el Ayuntamiento, Karla, Rosita, El Güero.`, at: null };
        return { title: 'La Noche del Añil', text: 'Viernes de 8 a 11 de la noche: ve al kiosco con tu abuelo. Que todos apaguen sus pantallas.', at: PLACES.kiosco };
      }
      default:
        return { title: 'Epílogo', text: 'Jiquilpan sigue su vida. Recorre el pueblo; siempre hay alguien con quien platicar.', at: null };
    }
  }
  nearestClue() {
    const missing = ['rosita', 'chuy', 'lupe', 'refugio'].filter(c => !this.s.clues.includes(c));
    if (!missing.length) return null;
    const p = this.game.player;
    let best = null, bd = 1e9;
    for (const c of missing) { const pl = PLACES[c]; const d = Math.hypot(pl[1] * TILE - p.x, pl[2] * TILE - p.y); if (d < bd) { bd = d; best = pl; } }
    return best;
  }
  evidenceCount() { return ['ev_tona', 'ev_carta', 'ev_estela', 'ev_dibujo'].filter(k => this.f[k]).length; }
  nextEvidence() {
    if (!this.f.ev_estela) return PLACES.hospital;
    if (!this.f.ev_carta) return PLACES.unam;
    if (!this.f.ev_dibujo) return PLACES.beto;
    if (!this.f.ev_tona) return PLACES.cerro;
    return PLACES.templo;
  }
  alliesCount() { return ['ally_padre', 'ally_palacio', 'ally_karla', 'ally_rosita', 'ally_guero'].filter(k => this.f[k]).length; }

  markerFor(id) {
    const s = this.s, f = this.f, main = this.q('main');
    if (s.act === 1) {
      if (id === 'abuela' && main.stage < 1) return 'main';
      if (['rosita', 'chuy', 'lupe', 'refugio'].includes(id) && main.stage >= 1 && !s.clues.includes(id)) return 'main';
      if (id === 'abuela' && main.stage >= 2 && this.f.ezequiel && !this.game.hasItem('linterna')) return 'main';
      if (id === 'ezequiel' && main.stage >= 2 && !this.f.ezequiel) return 'main';
    }
    if (s.act === 2 && id === 'miguel') return 'main';
    if (s.act === 2 && id === 'tona' && !s.clues.includes('tona')) return 'main';
    if (s.act === 3) {
      if (id === 'abuela' && main.stage < 31) return 'main';
      if (main.stage === 32) {
        if (id === 'estela' && !f.ev_estela) return 'main';
        if (id === 'ramirez' && !f.ev_carta) return 'main';
        if (id === 'beto' && !f.ev_dibujo) return 'main';
        if (id === 'tona' && !f.ev_tona) return 'main';
      }
      if (main.stage === 33 && id === 'padre') return 'main';
    }
    if (s.act === 4) {
      const ally = { padre: 'ally_padre', paty: 'ally_palacio', karla: 'ally_karla', rosita: 'ally_rosita', guero: 'ally_guero' }[id];
      if (ally && !f[ally]) return 'main';
    }
    // side quests
    for (const [qid, def] of Object.entries(SIDE)) {
      if (this.done(qid)) continue;
      if (def.giver === id && !this.started(qid) && (!def.when || def.when(this.game))) return 'side';
      if (def.target && def.target(this.game) === id) return 'side';
    }
    return null;
  }
  hideNPC(id) {
    if (id === 'miguel' || id === 'tono') return this.s.act === 3 && this.q('main').stage < 31 && false;
    return false;
  }

  // Scripts that take over a conversation from its first line (story beats)
  scriptFor(npc) {
    const id = npc.def?.id, s = this.s, main = this.q('main');
    if (id === 'miguel' && s.act === 2) return async (d) => { await this.campScene(npc, d); return 'end'; };
    if (id === 'abuela' && s.act === 3 && main.stage < 31) return async (d) => { await this.returnHomeScene(npc, d); return true; };
    if (id === 'abuela' && s.act === 1 && main.stage < 1) return async (d) => { d.end(); await this.game.cutscene('intro'); return 'end'; };
    if (id === 'ezequiel' && s.act === 1 && main.stage >= 2 && !this.f.ezequiel) return async (d) => { await this.ezequielScene(npc, d); return true; };
    return null;
  }
  async returnHomeScene(npc, d) {
    const g = this.game;
    await d.say(npc, `¿${g.state.name}? …¡${g.state.name}! ¡Virgen santísima!`);
    await d.narrate('Tu abuela te abraza tan fuerte que no puedes respirar. Llora, te pega en el brazo, te vuelve a abrazar.');
    await d.say(npc, 'Cinco meses, mijo. CINCO MESES. Los buscaron con perros, con drones, con la policía de Sahuayo. Ya les habíamos hecho misa…');
    const c = await d.choose([
      { text: 'Abuela, perdóname. Te voy a contar todo.', tag: 'honest', value: 'h' },
      { text: 'Para nosotros fueron cinco días…', tag: 'kind', value: 'k' },
    ], npc);
    await d.say(npc, c.value === 'h' ? 'Me lo contó tu abuelo. Luces, un “señor gris”… Mijo, yo te creo porque eres mi nieto. Pero el pueblo no te va a creer.' : 'Eso dice tu abuelo. Y yo le creo, porque tiene cincuenta años sin mentirme. Pero el pueblo… el pueblo ya se está riendo.');
    await d.say(npc, 'Tu abuelo dice que les dieron un mensaje. Que lo tienen que decir en la plaza. Ay, Dios… Anda, ve con él. Está en la banca de la plaza, junto a la Aguadora.');
    this.set('main', 31);
  }

  // The tío abuelo Ezequiel, on his bench facing the lagoon, tells where they go.
  async ezequielScene(npc, d) {
    const g = this.game;
    await d.narrate('Un viejo flaco, con el sombrero echado para atrás, mira la laguna desde una banca de madera. No voltea. Te reconoce por los pasos.');
    await d.say(npc, `Tienes los pasos de Miguel. Pesados de un lado, como si la tierra le debiera algo. Siéntate, ${g.state.name}. Ya sé a qué vienes.`);
    await d.say(npc, 'Aquí, cuando éramos niños, el agua llegaba hasta la puerta de la capilla. Nuestras madres metían la tela en las tinas de añil y la sacaban verde, y nosotros veíamos cómo el aire la iba poniendo azul. Esa fue la primera magia que vimos. La segunda vino del cielo.');
    await d.say(npc, 'Fue en el setenta y nueve. Tu abuelo y yo andábamos pescando de noche. Se levantó una luz de la laguna, sin ruido, sin viento, y se fue despacito rumbo al Cerro de San Francisco. Nadie nos creyó. Así que dejamos de contarlo y empezamos a esperar.');
    const c = await d.choose([{ text: '¿A dónde suben, tío? ¿A qué lugar del cerro?', value: 'where', tag: 'honest' }, { text: '¿Usted también cree que van a volver?', value: 'believe', tag: 'kind' }], npc);
    if (c.value === 'believe') await d.say(npc, 'Yo creo en lo que vi. Y en lo que no vi también, porque si no, ¿qué chiste tendría ser viejo? Pero te pregunté otra cosa sin decirla, mijo: te pregunté si tú vas a ir por ellos.');
    await d.say(npc, 'No a la cruz, como todos piensan. Al llano que está detrás, donde el pasto se queda aplastado en círculos aunque no pase ganado. Allá prenden su fogata, de cara al sur, y esperan con los ojos abiertos hasta que se les cierran.');
    await d.say(npc, 'Sube por el camino empedrado, el de piedra bola; no hay otro. Pasa por los ranchos de los Novoa y de los Salazar, pasa la capilla de San Francisco y la caseta del radio. De ahí ya se ve la cruz. No te desvíes a La Piedrita, que de noche el agua habla y uno se queda oyendo.');
    await d.say(npc, 'Y llévate luz, pero no la del teléfono. Esa nomás te enseña lo que ya traes en la mano. Una linterna de pilas, un ocote, algo que alumbre para afuera.');
    await d.narrate('El tío Ezequiel saca de la bolsa de la camisa una foto doblada en cuatro: dos muchachos flacos junto a una canoa, y arriba, en la esquina, una mancha de luz que nadie supo explicar.');
    await d.say(npc, 'Dásela a Miguel cuando lo encuentres. Dile que el primo Cheque todavía mira la laguna. Y que no se le ocurra irse sin despedirse.');
    this.f.ezequiel = true; g.addStat('palabra', 2); g.addStat('corazon', 2);
    if (!g.hasItem('foto_luces')) g.giveItem('foto_luces');
    g.ui.toast('Ya sabes a dónde van: el llano detrás de la cruz del Cerro de San Francisco.', 'quest');
    if (g.flags.mancha) g.gainHilo(npc);
  }

  // ---------- dialogue options per NPC ---------------------------------------
  optionsFor(npc) {
    const g = this.game, s = this.s, f = this.f, id = npc.def?.id, main = this.q('main');
    const out = [];
    const opt = (text, run, tag = 'quest') => out.push({ text, tag, run });

    // --- abuela ---
    if (id === 'abuela') {
      if (s.act === 1 && main.stage >= 2 && !g.hasItem('linterna')) opt('Abuela, ¿tienes una linterna?', async d => {
        await d.say(npc, 'La de tu abuelo está en el ropero… ¡se la llevó! Pero ten, esta es la vieja de tu bisabuelo. Todavía prende si le pegas tantito.');
        g.giveItem('linterna');
      });
      if (!this.started('s_libro') && s.act <= 3) opt('¿Necesitas algo del centro?', async d => {
        await d.say(npc, 'Ay, mijo, sí: devuélveme este libro a la Biblioteca Gabino Ortiz. Ya está bien vencido y la maestra Olga me va a regañar.');
        g.giveItem('libro'); this.start('s_libro');
      }, 'side');
      if (this.started('s_libro') && !this.started('s_mandado') && g.clock.weekday >= 4 && s.act <= 4) opt('¿Algo más, abuela?', async d => {
        await d.say(npc, 'El viernes ponen tianguis en el Jardín de la Paz, y el sábado junto al mercado. Tráeme lo de esta lista, ándale. Aquí está el dinero.');
        g.giveItem('lista'); g.addMoney(90); this.start('s_mandado');
      }, 'side');
      if (this.started('s_mandado') && !this.done('s_mandado') && g.hasItem('bolsa_tianguis')) opt('Aquí está el mandado', async d => {
        g.takeItem('bolsa_tianguis'); g.takeItem('lista');
        await d.say(npc, '¡Ay, qué buen muchacho! Ten, para tus tacos. Y no le digas a tu abuelo que te di.');
        g.addMoney(50); g.addStat('corazon', 3); this.finish('s_mandado');
      }, 'side');
      if (g.hasItem('chiles') && !f.gave_chiles) opt('Te traje chiles rellenos de Doña Tere', async d => {
        g.takeItem('chiles'); f.gave_chiles = true;
        await d.say(npc, '¡De mi comadre Tere! Ay, mijo… hace mucho que nadie me traía de comer a mí. Siéntate, vamos a comer juntos.');
        g.addStat('corazon', 6); g.gainHilo(npc);
      }, 'kind');
    }
    // --- clue givers in act 1 are handled via "¿Ha visto a mi abuelo?" (knows.abuelo) ---

    // --- Miguel (act 2 camp) ---
    if (id === 'miguel' && s.act === 3 && main.stage >= 31 && main.stage < 32) opt('Abuelo, ¿qué hacemos ahora?', async d => {
      await d.say(npc, 'Lo que nos pidieron, mijo: decirle al pueblo. Aunque se rían. La plaza es de todos; ahí se dicen las cosas importantes.');
    });
    if (id === 'miguel' && s.act >= 3) opt('Abuelo, enséñame la mancha', async d => {
      await d.say(npc, 'Mírala: azul añil, como el jiquilite que le dio nombre a este pueblo. No se quita con nada. Y cuando platico de verdad con alguien… brilla, tantito.');
    }, 'honest');

    // --- Toño ---
    if (id === 'tono' && s.act >= 3 && !this.started('s_mezcal')) opt('Tío Toño, ¿cómo estás?', async d => {
      await d.say(npc, 'Mal, sobrino. Le apunté a esa cosa y me quedé tieso como estatua. Setenta años de bravo y me congeló una mirada. Tráeme una del Chamacuero, pa’ los nervios… y pa’ platicarte algo.');
      this.start('s_mezcal');
    }, 'side');
    if (id === 'tono' && this.started('s_mezcal') && !this.done('s_mezcal') && g.hasItem('mezcal')) opt('Aquí está tu mezcal', async d => {
      g.takeItem('mezcal');
      await d.say(npc, 'Salud. Te voy a decir algo que no le he dicho ni a tu abuelo: cuando esa cosa me miró, no sentí miedo. Sentí vergüenza. Como cuando mi amá me veía llegar tarde. Como si me conociera de siempre.');
      await d.say(npc, 'Esos ojos… sobrino, esos ojos eran de acá. De Jiquilpan. No me preguntes cómo lo sé.');
      this.finish('s_mezcal', 'Mezcal para Toño'); g.gainHilo(npc);
    }, 'side');

    // --- act 3: evidence ---
    if (s.act === 3 && main.stage === 32) {
      if (id === 'estela' && !f.ev_estela) opt('Doctora, ¿qué encontró en la mano de mi abuelo?', async d => {
        await d.say(npc, 'Honestamente: no es tinta, no es un hongo, no es una quemadura. Es un pigmento dentro de la piel, como un tatuaje… pero hecho de añil natural. Te firmo mi reporte; con eso nadie puede decir que es pintura.');
        f.ev_estela = true; g.giveItemSilent('reporte'); g.ui.toast('Prueba: reporte médico de la Dra. Estela', 'quest'); this.checkEvidence();
      });
      if (id === 'ramirez' && !f.ev_carta) opt('Doctor, ¿hay registros de luces en el cerro?', async d => {
        if (!this.done('s_jeep')) {
          await d.say(npc, 'Registros… podría haber algo en el archivo del General, pero hay una caja sin catalogar desde que se perdió la foto del jeep. Si me ayudas con eso, busco con calma. Pregúntale a Fer, la guía.');
          if (!this.started('s_jeep')) this.start('s_jeep');
          return;
        }
        await d.say(npc, 'Encontré esto en la caja: una carta de 1940, de un campesino de San Francisco al General Cárdenas. Habla de “luces sobre el cerro” y de “un hombre chiquito de manos azules que dijo venir de lo que seremos”. Te hago una copia.');
        f.ev_carta = true; g.giveItem('carta_1940'); this.checkEvidence();
      });
      if (id === 'beto' && !f.ev_dibujo) opt('Beto, ¿tú viste algo aquella noche?', async d => {
        if (this.done('s_trompo')) {
          await d.say(npc, '¡Sí! Esa noche no podía dormir y vi las luces en el cerro. Las dibujé. Mi maestra dijo que era imaginación… pero tú sí me crees, ¿verdad? Tenlo, te lo regalo.');
          f.ev_dibujo = true; g.giveItem('dibujo'); this.checkEvidence();
        } else await d.say(npc, 'Mmm… ¿y mi trompo? Si me ayudas a encontrar mi trompo, te enseño algo que dibujé.');
      });
      if (id === 'tona' && !f.ev_tona) opt('Doña Toña, ¿usted vio las luces esa noche?', async d => {
        await d.say(npc, 'Claro que las vi. Y se lo digo a quien quiera oírlo, delante del padre si hace falta. Esa noche el cerro se iluminó azul, y Canelo lloró hasta el amanecer.');
        f.ev_tona = true; g.ui.toast('Prueba: el testimonio de Doña Toña', 'quest'); this.checkEvidence();
      });
    }
    if (s.act === 3 && main.stage === 33 && id === 'padre') opt('Padre, le traigo las pruebas', async d => { await this.padreScene(npc, d); return 'end'; });

    // --- act 4: allies ---
    if (s.act === 4) {
      const ask = async (d, flag, lines, condText, cond) => {
        if (cond && !cond()) { await d.say(npc, condText); return; }
        for (const l of lines) await d.say(npc, l);
        f[flag] = true; g.ui.toast('Nuevo aliado para La Noche del Añil', 'soul'); g.sfx('clue'); g.save();
      };
      if (id === 'padre' && !f.ally_padre) opt('Padre, el viernes queremos juntar al pueblo sin pantallas', async d => ask(d, 'ally_padre',
        ['Hace dos años te pedí paciencia. Ahora veo las bancas vacías y a la gente rezando con el celular en la mano. Tocaré las campanas a las ocho, como antes, cuando llamaban a todos a la plaza.'],
        'Tú escucha primero a tu gente. Cuando hayas escuchado a muchos, ven.', () => s.hilos >= 5));
      if (id === 'paty' && !f.ally_palacio) opt('¿Podrían apagar el alumbrado y las pantallas del Palacio el viernes?', async d => ask(d, 'ally_palacio',
        ['Mira, el Presidente dice que si es por la convivencia y no es mitin político… va. Una hora, de nueve a diez, a oscuras nomás con las lámparas de la plaza. Si alguien se queja, que venga conmigo.'],
        'Ahorita no hay quien firme. Vuelve en horario de oficina, de lunes a viernes.', () => g.clock.weekday >= 1 && g.clock.weekday <= 5 && g.clock.hour < 15));
      if (id === 'karla' && !f.ally_karla) opt('Karla, ¿nos ayudas a invitar a la gente?', async d => {
        await d.say(npc, 'Yo subí el video de “los abuelos marcianos”. Tres millones de vistas. Y nunca me sentí tan sola como esa semana.');
        const c = await d.choose([{ text: 'Todos cometemos errores. Ayúdanos a arreglarlo.', tag: 'kind', value: 'k' }, { text: 'Me debes una, y grande.', tag: 'mean', value: 'm' }], npc);
        if (c.value === 'm') { g.addStat('corazon', -4); await d.say(npc, '…Sí, ya sé. Ok. Subo un último video. Y luego apago todo.'); }
        else { g.addStat('corazon', 4); await d.say(npc, 'Subo un último video: “Este viernes, la plaza sin celulares”. Y luego lo apago. Lo prometo.'); }
        f.ally_karla = true; g.ui.toast('Nuevo aliado para La Noche del Añil', 'soul'); g.save();
      });
      if (id === 'rosita' && !f.ally_rosita) opt('Rosita, ¿vendrías el viernes a la plaza?', async d => ask(d, 'ally_rosita',
        ['¿Venir? Llevo el café para todos. Y el pan de nata. Si la gente va a platicar, que platique calientita.']));
      if (id === 'guero' && !f.ally_guero) opt('Güero, el viernes… ¿tacos para todos?', async d => ask(d, 'ally_guero',
        ['Tacos al costo, compa. Y le digo a mi primo y a mi tío: tres Güeros en la plaza, por primera vez juntos. Ya era hora.']));
    }

    // --- small business offers ---
    if (id === 'chuy' && !(g.state.businesses || []).includes('taxi')) opt('Chuy, ¿y si pongo un taxi a trabajar?', async d => {
      await d.say(npc, 'Mi sobrino lo maneja, tú pones el carro. Un Tsuru bien cuidado anda en $6,000. Deja unos $210 diarios, limpios. ¿Le entras?');
      const c = await d.choose([{ text: 'Trato hecho ($6,000)', tag: 'money', value: 1 }, { text: 'Lo voy a pensar', value: 0 }], npc);
      if (!c.value) return;
      if (g.state.money < 6000) { await d.say(npc, 'Junta primero, compa. Aquí te espero.'); return; }
      g.buyBusiness('taxi'); await d.say(npc, '¡Bienvenido al gremio! Cada mañana te paso tu cuenta.');
    }, 'money');
    // --- side quests ---
    for (const [qid, def] of Object.entries(SIDE)) {
      if (def.options) for (const o of def.options(g, npc, this) || []) out.push(o);
    }
    return out;
  }

  checkEvidence() {
    if (this.evidenceCount() >= 3 && this.q('main').stage === 32) { this.set('main', 33); this.game.ui.toast('Tienes suficientes pruebas. Llévalas al Padre Tomás.', 'quest'); }
    this.game.save();
  }

  // ---------- big scenes ---------------------------------------------------
  async campScene(npc, d) {
    const g = this.game;
    g.flags.found_grandpas = true;
    const tono = g.npcs.named.get('tono');
    await d.say(npc, `¡${g.state.name}! ¿Qué haces aquí arriba, mijo? ¿Tu abuela te mandó?`);
    await d.say(null, 'Tu abuelo te abraza fuerte. Huele a humo de leña y a café de olla.');
    if (tono) await d.say(tono, '¡Ya llegó el refuerzo! Échate un trago, sobrino, que en la noche hiela.');
    await d.say(npc, 'Llevamos tres noches viendo luces sobre el cerro. Azules, luego blancas. Se paran encima de la cruz y se van hacia la Ciénega. Esta noche es la buena, lo siento en los huesos.');
    const c = await d.choose([
      { text: 'Me quedo con ustedes esta noche', tag: 'kind', value: 'stay' },
      { text: 'Abuelo, vámonos. La abuela está llorando.', tag: 'honest', value: 'go' },
    ], npc);
    if (c.value === 'go') {
      await d.say(npc, 'Una noche más, mijo. Nomás una. Quédate con nosotros y mañana bajamos los tres. Te lo prometo por tu abuela.');
      g.addStat('palabra', 2);
    } else g.addStat('corazon', 3);
    await d.say(null, 'Se sientan alrededor de la fogata. Don Toño cuenta chistes; tu abuelo mira el cielo. Nadie saca el celular: aquí no hay señal.');
    d.end();
    await g.cutscene('ufo');
  }

  async padreScene(npc, d) {
    const g = this.game;
    await d.say(npc, 'A ver… un reporte médico, una carta de 1940, un dibujo de niño, el testimonio de Doña Toña. Hijo, esto es más de lo que tiene la mitad de los milagros de este templo.');
    await d.say(npc, 'Pero te voy a decir algo con cariño: la gente no cambia porque le enseñes papeles. Cambia cuando le duele. Y todavía no les duele.');
    await d.say(npc, 'Dale tiempo. El tiempo es el único que convence a este pueblo.');
    g.addStat('fama', 10);
    d.end();
    await g.cutscene('timeskip');
  }

  async kioscoSpeech() {
    const g = this.game;
    await g.dialog.scene(async d => {
      await d.narrate('Te subes al kiosco. Poco a poco la gente se voltea a verte; algunos ya levantan el celular para grabar.');
      await d.say({ name: g.state.name, look: g.player.look }, '¡Buenas noches, Jiquilpan! Muchos saben que mi abuelo, mi tío Toño y yo desaparecimos cinco meses en el cerro.');
      const c = await d.choose([
        { text: 'Contar todo, con calma y sin miedo', tag: 'honest', value: 'truth' },
        { text: 'Gritarles que están ciegos con sus celulares', tag: 'mean', value: 'angry' },
      ]);
      if (c.value === 'angry') { g.addStat('corazon', -5); g.addStat('fama', -10); await d.say({ name: g.state.name, look: g.player.look }, '¡Todos ustedes andan ciegos con esas pantallas! ¡Nos están comiendo vivos!'); }
      else { g.addStat('palabra', 4); await d.say({ name: g.state.name, look: g.player.look }, 'Vimos luces. Vimos algo que bajó. Nos miró a los ojos y nos pidió una sola cosa: que no dejemos que una pantalla se ponga entre nosotros. Que nos volvamos a mirar.'); }
      await d.say({ name: 'Voz entre la gente' }, '¡Jajaja! ¡Ahí está el marciano! ¡Salúdanos al E.T.!');
      await d.say({ name: 'Otra voz' }, '¿Y qué, nos va a quitar el WhatsApp? ¡Bájate de ahí!');
      await d.narrate('Las risas llenan la plaza. Alguien pone reggaetón en una bocina. Tu abuelo, desde una banca, te mira con orgullo. Nadie más.');
      g.addStat('fama', -15);
      this.set('main', 32);
      await d.say(g.npcs.named.get('miguel') || { name: 'Don Miguel' }, 'No te agüites, mijo. Nadie cree lo que no puede tocar. Vamos a darles algo que puedan tocar: pruebas. Y luego, tiempo.');
    });
  }

  // called by the game when talking to the kiosco / other world objects
  async interactWorld(what) {
    const g = this.game, s = this.s;
    if (what === 'kiosco') {
      if (s.act === 3 && this.q('main').stage === 31) {
        if (g.clock.hour >= 17 || g.clock.hour < 1) return this.kioscoSpeech();
        return g.ui.toast('Mejor en la tarde o noche, cuando la plaza está llena.');
      }
      if (s.act === 4 && this.objective().text.startsWith('Viernes')) {
        if (g.clock.weekday === 5 && g.clock.hour >= 20 && g.clock.hour < 23) return g.cutscene('anil');
        return g.ui.toast('La Noche del Añil será el viernes, de 8 a 11 de la noche.');
      }
      return g.dialog.scene(async d => { await d.narrate(pick1([
        'El kiosco del Jardín Zaragoza: columnas de hierro, cúpula gris y una vista de toda la plaza.',
        'Desde el kiosco se ven los portales, el Palacio y, detrás de los techos, el Cerro de San Francisco.',
        'Aquí tocaba la banda los domingos. Todavía, a veces, suena una tambora.'])); });
    }
  }

  // Event hooks
  onEnterMap(id) {
    const g = this.game, s = this.s;
    if (id === 'cerro' && s.act === 1) {
      if (this.q('main').stage < 2) g.ui.toast('Todavía no sabes bien dónde buscar… pero ya estás aquí.', '');
      s.act = 2; this.set('main', 10);
      g.ui.banner('El Cerro de San Francisco', 'Capítulo II');
    }
    if (id === 'town' && s.act === 3 && !this.f.saw_posters) {
      this.f.saw_posters = true;
      g.dialog.scene(async d => {
        await d.narrate('Las jacarandas están en flor. Todo Jiquilpan está morado. Pero en septiembre no hay jacarandas…');
        await d.narrate('En un poste, una hoja descolorida por el sol: “SE BUSCA — Miguel, Antonio y su nieto. Desaparecidos desde el 1 de octubre.”');
        await d.say(g.npcs.named.get('tono') || { name: 'Don Toño' }, '¿Primero de octubre? Si nomás estuvimos cinco días…');
        await d.say(g.npcs.named.get('miguel') || { name: 'Don Miguel' }, 'No, hermano. Mira las jacarandas. Es marzo.');
      });
    }
  }
  onEvent(ev) {
    const g = this.game;
    if (ev === 'loteria_win' && this.started('s_loteria') && !this.done('s_loteria')) this.q('s_loteria').stage = 2;
    if (ev === 'politico' && this.started('s_baches') && this.q('s_baches').stage === 2) { this.q('s_baches').stage = 3; g.ui.toast('Te prometieron todo. Ahora toca esperar… o hacerlo ustedes.', 'quest'); }
  }
  onPickup(item) {
    if (item === 'trompo' && this.started('s_trompo')) this.set('s_trompo', 2);
    if (item === 'palo' && this.started('s_palo')) this.set('s_palo', 2);
    if (item === 'bomba' && this.started('s_rinos')) this.set('s_rinos', 2);
  }
  onBuy(shopId, entry) {
    const g = this.game, f = this.f;
    if (shopId === 'taco_guero_bueno') f.tried_guero1 = true;
    if (shopId === 'taco_guero_salado') f.tried_guero2 = true;
    if (shopId === 'taco_guero_salsa') f.tried_guero3 = true;
    if ((f.tried_guero1 || f.tried_guero2 || f.tried_guero3) && !this.started('s_gueros')) this.start('s_gueros');
    if (entry[0] === 'taco_carnitas_salsa' && !this.done('s_enchilado')) { this.start('s_enchilado'); this.set('s_enchilado', 2); }
    if (shopId === 'cochera') f.bought_cochera = true;
  }
  onCure(kind) { if (kind === 'enchilado' && this.q('s_enchilado').stage === 2) this.finish('s_enchilado', '¡Sobreviviste a la salsa de Don Chon!'); }

  // items lying around the world (visible only when relevant)
  worldItems() {
    const out = [];
    if (this.started('s_trompo') && !this.done('s_trompo') && !this.game.hasItem('trompo')) out.push({ id: 'trompo', map: 'town', x: 197.5, y: 152.6 });
    out.push({ id: 'palo', map: 'town', x: 44.5, y: 86.6, repeat: true });
    if (this.started('s_rinos') && !this.done('s_rinos') && !this.game.hasItem('bomba')) out.push({ id: 'bomba', map: 'town', x: 160.5, y: 253.6 });
    for (const it of this.extraItems || []) if (!this.f['got_' + it.map + it.id + Math.round(it.x)]) out.push(it);
    if (this.started('s_jeep') && !this.done('s_jeep') && !this.game.hasItem('foto_jeep') && this.f.jeep_hint) out.push({ id: 'foto_jeep', map: 'palacio', x: 19.5, y: 4.6 });
    return out;
  }

  journal() {
    const out = [];
    const o = this.objective();
    out.push({ kicker: 'Historia', title: o.title, text: o.text, main: true });
    for (const [id, def] of Object.entries(SIDE)) {
      const q = this.s.quests[id];
      if (!q || q.stage === 0) continue;
      out.push({ kicker: 'Misión secundaria', title: def.title, text: q.done ? def.doneText || 'Completada.' : (def.step ? def.step(this.game, q) : def.desc), done: q.done });
    }
    return out;
  }
}

function pick1(a) { return a[Math.floor(Math.random() * a.length)]; }

// ------------------------------------------------------------------------------
// Side quests
export const SIDE = {
  s_fiado: {
    title: 'Leche fiada', giver: null, desc: 'Le debes leche a Don Refugio.',
    step: (g) => g.state.debt > 0 ? `Le debes $${g.state.debt} a Don Refugio. Págale en su corral (mañanas).` : 'Estás al corriente con Don Refugio.',
    target: (g) => g.state.debt > 0 ? 'refugio' : null,
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'refugio' || g.state.debt <= 0) return [];
      return [{ text: `Pagarle lo que le debo ($${g.state.debt})`, tag: 'honest', run: async d => {
        if (g.state.money < g.state.debt) { await d.say(npc, 'No traes completo, ¿verdad? No te apures, cuando tengas.'); return; }
        g.addMoney(-g.state.debt); g.state.debt = 0; g.state.debtSince = null; g.addStat('palabra', 10);
        await d.say(npc, 'Así me gusta. Palabra es palabra. Tu abuelo estaría orgulloso. La próxima, la leche va por mi cuenta.');
        Q.finish('s_fiado', 'Deuda saldada con Don Refugio');
      } }];
    },
  },
  s_gueros: {
    title: 'Los tres Güeros', desc: 'Prueba los tacos de los tres puestos “El Güero” (de noche) y dile al de los tubos cuál es el mejor.',
    step: (g) => `Probados: ${[g.flags.tried_guero1, g.flags.tried_guero2, g.flags.tried_guero3].filter(Boolean).length}/3. ${g.flags.tried_guero1 && g.flags.tried_guero2 && g.flags.tried_guero3 ? 'Habla con El Güero de los tubos.' : 'Los tres ponen su puesto de noche: junto a los tubos, frente a Las Monjas y en el Jardín de la Paz.'}`,
    target: (g) => (g.flags.tried_guero1 && g.flags.tried_guero2 && g.flags.tried_guero3 && !g.quests.done('s_gueros')) ? 'guero' : null,
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'guero' || Q.done('s_gueros') || !(g.flags.tried_guero1 && g.flags.tried_guero2 && g.flags.tried_guero3)) return [];
      return [{ text: 'Ya probé los tres Güeros…', tag: 'honest', run: async d => {
        const c = await d.choose([
          { text: 'Los tuyos son los mejores, sin duda', tag: 'honest', value: 'a' },
          { text: 'Los de tu tío… (mentira piadosa)', tag: 'kind', value: 'b' },
          { text: 'Los de tu primo son mejores', tag: 'mean', value: 'c' },
        ], npc);
        if (c.value === 'a') { await d.say(npc, '¡Lo sabía! Mi primo los sala de más y a mi tío la salsa le sale aguada. Pero no les digas, que son familia. Tu próxima orden va por la casa.'); g.addStat('palabra', 3); g.state.freeTacos = 5; }
        else if (c.value === 'b') { await d.say(npc, '¿De mi tío? …Jaja, qué buena gente eres. Él me enseñó todo. Cuando lo veas, díselo; le va a dar mucho gusto.'); g.addStat('corazon', 5); }
        else { await d.say(npc, '¿Mi primo? ¿Con esa sal? Ándale pues… cada quien sus gustos.'); g.addStat('palabra', -3); }
        Q.finish('s_gueros', 'Los tres Güeros');
      } }];
    },
  },
  s_trompo: {
    title: 'El trompo de Beto', giver: 'beto', desc: 'Beto perdió su trompo cerca del Jardín de la Paz.',
    step: (g) => g.hasItem('trompo') ? 'Devuélvele el trompo a Beto (Jardín de la Paz por las tardes, la plaza los fines de semana).' : 'Busca el trompo entre los arbustos del Jardín de la Paz.',
    target: (g) => g.hasItem('trompo') ? 'beto' : null,
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'beto') return [];
      if (!Q.started('s_trompo')) return [{ text: '¿Por qué tan triste?', tag: 'kind', run: async d => {
        await d.say(npc, 'Perdí mi trompo. Me lo hizo mi abuelo de madera de guayabo. Se me fue rodando por los arbustos del Jardín… y no lo encuentro.');
        Q.start('s_trompo');
      } }];
      if (g.hasItem('trompo') && !Q.done('s_trompo')) return [{ text: 'Mira lo que encontré', tag: 'kind', run: async d => {
        const c = await d.choose([{ text: 'Dárselo', tag: 'kind', value: 'give' }, { text: 'Quedártelo (está bien bonito)', tag: 'mean', value: 'keep' }], npc);
        if (c.value === 'keep') { g.addStat('corazon', -10); await d.say(npc, '…¿Por qué lo escondes? ¡Ese es mío!'); Q.q('s_trompo').stage = 3; return; }
        g.takeItem('trompo'); g.addStat('corazon', 8);
        await d.say(npc, '¡MI TROMPO! ¡Gracias, gracias! Mira, así se baila: se enrolla el cordón, se lanza de uñita… ¡y zas!');
        Q.finish('s_trompo', 'El trompo de Beto');
      } }];
      return [];
    },
  },
  s_palo: {
    title: 'Un bastón para Don Chema', giver: 'chema', desc: 'A Don Chema se le rompió su bastón.',
    step: (g) => g.hasItem('palo') ? 'Llévale el palo a Don Chema, en los portales de la plaza.' : 'Busca un buen palo de fresno en el Parque Juárez.',
    target: (g) => g.hasItem('palo') && g.quests.started('s_palo') ? 'chema' : null,
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'chema') return [];
      if (!Q.started('s_palo')) return [{ text: '¿Le ayudo en algo, Don Chema?', tag: 'kind', run: async d => {
        await d.say(npc, 'Se me rompió el bastón, mijo. Ochenta y ocho años y me tiene que traer mi nieta del brazo. En el Parque Juárez hay buenos palos de fresno, rectitos.');
        Q.start('s_palo');
      } }];
      if (g.hasItem('palo') && !Q.done('s_palo')) return [{ text: 'Le traje un palo de fresno', tag: 'kind', run: async d => {
        g.takeItem('palo'); g.addStat('corazon', 7);
        await d.say(npc, 'Ah, qué palo tan derechito. Con esto llego hasta el cerro. Siéntate, te cuento de cuando el General me regaló un peso de plata, aquí en esta misma plaza…');
        Q.finish('s_palo', 'Un bastón para Don Chema');
        if (g.flags.mancha) g.gainHilo(npc);
      } }];
      return [];
    },
  },
  s_enchilado: {
    title: '¡Enchilado!', desc: 'Le pusiste la salsa de Don Chon a tus carnitas.',
    step: () => 'Quítate lo enchilado: leche, nieve de limón, una limonada o una michelada.',
    doneText: 'Sobreviviste. Don Chon todavía se ríe.',
  },
  s_libro: {
    title: 'Libro vencido', desc: 'Devuelve el libro de la abuela a la Biblioteca Gabino Ortiz.',
    step: () => 'Devuélvele el libro a la Maestra Olga, en la Biblioteca Gabino Ortiz.',
    target: (g) => g.hasItem('libro') ? 'olga' : null,
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'olga' || !g.hasItem('libro')) return [];
      return [{ text: 'Vengo a devolver un libro de mi abuela', tag: 'honest', run: async d => {
        g.takeItem('libro'); g.addStat('palabra', 5);
        await d.say(npc, '“Pedro Páramo”… ¡tres meses vencido, Chayo! Bueno, la multa se la perdono si tú te quedas cinco minutos a ver los murales. Orozco los pintó aquí en 1940. Mira ese: la gente, el fuego, la historia. No se ven en una pantalla; se ven con el cuello torcido y la boca abierta.');
        Q.finish('s_libro', 'Libro vencido');
      } }];
    },
  },
  s_rinos: {
    title: 'La bomba de los Rinos', giver: 'poncho', desc: 'Don Poncho perdió la bomba de aire del grupo en el Bosque Cuauhtémoc.',
    step: (g) => g.hasItem('bomba') ? 'Devuélvele la bomba a Don Poncho (entrada del bosque, mañanas).' : 'Busca la bomba de aire a lo largo de la pista del Bosque Cuauhtémoc.',
    target: (g) => g.hasItem('bomba') ? 'poncho' : null,
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'poncho') return [];
      if (!Q.started('s_rinos')) return [{ text: '¿Qué pasó, Don Poncho?', tag: 'kind', run: async d => {
        await d.say(npc, '¡Se me cayó la bomba de aire en la pista del bosque! Sin ella, al primer bache que agarremos nos quedamos tirados. Y baches, en Jiquilpan, sobran.');
        Q.start('s_rinos');
      } }];
      if (g.hasItem('bomba') && !Q.done('s_rinos')) return [{ text: 'Aquí está su bomba', tag: 'kind', run: async d => {
        g.takeItem('bomba'); g.addStat('corazon', 5); g.addMoney(40);
        await d.say(npc, '¡Eres un rinoceronte honorario! Los sábados y domingos salimos a las siete. Aquí no hay celulares: nomás el camino y la plática.');
        Q.finish('s_rinos', 'La bomba de los Rinos');
        if (g.flags.mancha) g.gainHilo(npc);
      } }];
      return [];
    },
  },
  s_rosita: {
    title: 'Café para dos pueblos', giver: 'rosita', when: (g) => g.flags.bought_cochera,
    desc: 'Rosita y La Cochera compiten por la clientela.',
    step: (g) => g.flags.cochera_ok ? 'Regresa con Rosita y dale la buena noticia.' : 'Convence a Sofi, de La Cochera, de vender el pan de nata de Rosita.',
    target: (g) => g.quests.started('s_rosita') && !g.quests.done('s_rosita') ? (g.flags.cochera_ok ? 'rosita' : 'sofi_kevin') : null,
    options: (g, npc, Q) => {
      const id = npc.def?.id;
      if (id === 'rosita' && !Q.started('s_rosita') && g.flags.bought_cochera) return [{ text: 'Rosita, ¿cómo va la venta?', tag: 'kind', run: async d => {
        await d.say(npc, 'Ya te vi con tu vasote de La Cochera, eh. No te creas… pero sí me pega. Nomás que mi pan de nata no lo tienen allá. ¿Y si se los vendiera? Yo no me animo a ir, me da pena.');
        Q.start('s_rosita');
      } }];
      if (id === 'sofi_kevin' && Q.started('s_rosita') && !g.flags.cochera_ok) return [{ text: '¿Venderían el pan de nata de Rosita?', tag: 'kind', run: async d => {
        await d.say(npc, '¿El pan de nata de la señora de la plaza? ¡Kevin se come dos cada mañana! Ok, ok: si ella nos lo vende, lo ponemos con un letrerito: “Pan de Rosita”. Sahuayo y Jiquilpan, collab.');
        g.flags.cochera_ok = true;
      } }];
      if (id === 'rosita' && g.flags.cochera_ok && !Q.done('s_rosita')) return [{ text: 'La Cochera quiere tu pan', tag: 'kind', run: async d => {
        await d.say(npc, '¿De veras? ¿Los de Sahuayo? …Ay, muchacho. Ven, te regalo un café. Hoy sí, invita la casa.');
        g.addStat('corazon', 6); Q.finish('s_rosita', 'Café para dos pueblos'); if (g.flags.mancha) g.gainHilo(npc);
      } }];
      return [];
    },
  },
  s_birria: {
    title: '¿Cuál Cano es el original?', giver: 'tere', desc: 'Tres puestos de Birria El Cano en el mercado dicen ser el original.',
    step: (g) => g.flags.birria_truth ? 'Cuéntales la verdad a los tres Canos.' : 'Pregunta a alguien que conozca la historia del mercado.',
    options: (g, npc, Q) => {
      const id = npc.def?.id;
      if (id === 'tere' && !Q.started('s_birria')) return [{ text: 'Doña Tere, ¿cuál de los Canos es el original?', tag: 'quest', run: async d => {
        await d.say(npc, 'Ninguno, mijo. La original era Doña Cana, la abuela de los tres. Vendía birria en un bote bajo el portal, en los setenta. Los muchachos se pelean por un nombre que ni era de ellos. Díselos, a ver si se contentan.');
        Q.start('s_birria'); g.flags.birria_truth = true;
      } }];
      if (['cano1', 'cano2', 'cano3'].includes(id) && g.flags.birria_truth && !Q.done('s_birria')) return [{ text: 'La original era Doña Cana, su abuela', tag: 'honest', run: async d => {
        g.flags['told_' + id] = true;
        await d.say(npc, pick1(['…¿Quién te dijo? ¿La Tere? …Pues sí. Mi abuela. Qué vergüenza estar peleando entre primos.', 'Ah, caray. Pues sí. Ella nos enseñó a los tres. A ver si ahora ponemos un solo letrero: “Birria Doña Cana”.', 'Ay, jaja. Tienes razón. Ya ni me acordaba de su bote bajo el portal.']));
        if (g.flags.told_cano1 && g.flags.told_cano2 && g.flags.told_cano3) { g.addStat('corazon', 6); g.addMoney(60); Q.finish('s_birria', 'Los tres Canos'); }
      } }];
      return [];
    },
  },
  s_mandado: {
    title: 'El mandado de la abuela', desc: 'Compra lo de la lista en el tianguis (viernes en el Jardín de la Paz, sábado junto al mercado) o en el mercado.',
    step: (g) => g.hasItem('bolsa_tianguis') ? 'Llévale el mandado a tu abuela.' : 'Compra el mandado en el tianguis o con Doña Pili en el mercado.',
    target: (g) => g.hasItem('bolsa_tianguis') ? 'abuela' : null,
  },
  s_jeep: {
    title: 'La foto del jeep', giver: 'fer', desc: 'Falta la foto del General Cárdenas con su jeep en el museo de la UNAM.',
    step: (g) => g.hasItem('foto_jeep') ? 'Lleva la foto a Fer, en la UNAM.' : g.flags.jeep_hint ? 'Busca la foto en el Palacio Municipal (oficina de Paty).' : 'Pregúntale a Fer, la guía del museo de la UNAM.',
    target: (g) => g.hasItem('foto_jeep') ? 'fer' : (g.quests.started('s_jeep') && !g.flags.jeep_hint ? 'fer' : null),
    options: (g, npc, Q) => {
      const id = npc.def?.id;
      if (id === 'fer' && !Q.done('s_jeep') && !g.hasItem('foto_jeep')) return [{ text: '¿Qué le falta a la exhibición del jeep?', tag: 'quest', run: async d => {
        await d.say(npc, '¡La foto! La del General parado junto a este mismo jeep en la plaza. Se la prestamos al Palacio para una exposición y nunca regresó. Paty, la secretaria, debe saber. O está por ahí, en algún archivero.');
        if (!Q.started('s_jeep')) Q.start('s_jeep');
        g.flags.jeep_hint = true;
      } }];
      if (id === 'paty' && g.flags.jeep_hint && !g.hasItem('foto_jeep') && !Q.done('s_jeep')) return [{ text: '¿Tiene la foto del jeep de la UNAM?', tag: 'quest', run: async d => {
        await d.say(npc, '¿La del General? Ay, está en el archivero del fondo, junto a la ventana. Agárrala tú, que yo ando con mil trámites.');
      } }];
      if (id === 'fer' && g.hasItem('foto_jeep') && !Q.done('s_jeep')) return [{ text: 'Aquí está la foto', tag: 'kind', run: async d => {
        g.takeItem('foto_jeep'); g.addStat('corazon', 4);
        await d.say(npc, '¡Ahí está! Mira: el General, sin guardaespaldas, platicando con la gente en la plaza. Así hacía política: de frente. El Dr. Ramírez quería revisar una caja del archivo; ahora sí tiene tiempo.');
        Q.finish('s_jeep', 'La foto del jeep');
      } }];
      return [];
    },
  },
  // ---- round 3: intriguing errands around town ----------------------------------------------------
  s_foto79: {
    title: 'La foto de 1979', giver: 'nacho_marin', desc: 'Don Nacho Marín vio las luces con tu abuelo en 1979 y guarda una foto.',
    step: (g) => g.hasItem('foto_luces') ? (g.flags.foto_ochoa ? 'Regrésale la foto a Don Nacho y cuéntale.' : 'Llévale la foto al historiador Álvaro Ochoa (jueves en la Casa de la Cultura, viernes en la UAER).') : 'Busca la foto en el ropero de la casona de los Marín.',
    target: (g) => g.hasItem('foto_luces') ? (g.flags.foto_ochoa ? 'nacho_marin' : 'alvaro_ochoa') : null,
    options: (g, npc, Q) => {
      const id = npc.def?.id;
      if (id === 'nacho_marin' && !Q.started('s_foto79')) return [{ text: 'Don Nacho, ¿usted vio las luces?', tag: 'quest', run: async d => {
        await d.say(npc, 'Septiembre del 79. Tu abuelo y yo, en la cruz del cerro. Tomé una foto con una Kodak prestada. Salió movida, pero salió. Nadie la quiso ver.');
        await d.say(npc, 'Está en mi ropero, abajo de las camisas. Búscala. Y llévasela a ese historiador que viene de Zamora, Ochoa. Que diga él si estoy loco.');
        Q.start('s_foto79');
      } }];
      if (id === 'alvaro_ochoa' && g.hasItem('foto_luces') && !g.flags.foto_ochoa) return [{ text: 'Doctor, ¿qué opina de esta foto?', tag: 'quest', run: async d => {
        await d.say(npc, 'Kodak Instamatic, revelado en Zamora, 1979: mire el sello del laboratorio atrás. No es un truco de cuarto oscuro. Qué son esas luces, no lo sé. Pero la foto es auténtica y la fecha coincide con un recorte del periódico de Sahuayo.');
        await d.say(npc, 'El historiador no cree ni descree, joven: documenta. Dígale a Don Nacho que su foto va a ir al archivo de la Unidad. Con su nombre.');
        g.flags.foto_ochoa = true; g.addStat('fama', 4);
      } }];
      if (id === 'nacho_marin' && g.flags.foto_ochoa && !Q.done('s_foto79')) return [{ text: 'Don Nacho, Ochoa dice que su foto es auténtica', tag: 'kind', run: async d => {
        g.takeItem('foto_luces');
        await d.say(npc, '…Cuarenta y siete años esperando que alguien dijera eso. Gracias, muchacho. Toma, esto era de mi padre: que te dé suerte.');
        g.addMoney(150); g.addStat('corazon', 5); Q.finish('s_foto79', 'La foto de 1979'); if (g.flags.mancha) g.gainHilo(npc);
      } }];
      return [];
    },
  },
  s_guicho: {
    title: '¿Dónde anda Güicho?', giver: 'ruben_marin', desc: 'A la máquina de tortillas de los Marín se le rompió una pieza. Sólo Güicho, de Ferretuberías, la tiene… y nunca está.',
    step: (g) => g.hasItem('codo') ? 'Llévale la pieza a Rubén, en la Tortillería Marín.' : 'Encuentra a Güicho. Dicen que anda en El Santo Remedio por las tardes, o en las micheladas de Nico.',
    target: (g) => g.quests.started('s_guicho') && !g.quests.done('s_guicho') ? (g.hasItem('codo') ? 'ruben_marin' : 'guicho') : null,
    options: (g, npc, Q) => {
      const id = npc.def?.id;
      if (id === 'ruben_marin' && !Q.started('s_guicho')) return [{ text: '¿Por qué tan apurado, Rubén?', tag: 'quest', run: async d => {
        await d.say(npc, 'Se me tronó un codo de la máquina. Sin eso, la masa sale chueca. Sólo Güicho tiene la pieza, pero ese hombre nunca abre. Si lo encuentras, te lo agradezco con tortillas de por vida.');
        Q.start('s_guicho');
      } }];
      if (id === 'guicho' && Q.started('s_guicho') && !g.hasItem('codo') && !Q.done('s_guicho')) return [{ text: 'Güicho, Rubén Marín necesita un codo de fierro', tag: 'quest', run: async d => {
        await d.say(npc, '¿El de la tortillería? ¡Claro! Traigo uno en la camioneta, siempre traigo de todo. Llévatelo; me lo paga en tortillas. Y si alguien pregunta, yo estaba trabajando, ¿eh?');
        g.giveItem('codo');
      } }];
      if (id === 'ruben_marin' && g.hasItem('codo') && !Q.done('s_guicho')) return [{ text: 'Aquí está la pieza', tag: 'kind', run: async d => {
        g.takeItem('codo');
        await d.say(npc, '¡Lo encontraste! ¿Dónde estaba? …No, no me digas. Mi papá dice que eres igualito a tu abuelo: necio pa\' buscar. Cuando quieras trabajar un turno, aquí hay chamba.');
        g.addMoney(120); g.addStat('corazon', 3); Q.finish('s_guicho', '¿Dónde anda Güicho?');
      } }];
      return [];
    },
  },
  s_tortillas: {
    title: 'Manos de tortillero', giver: 'ruben_marin', desc: 'Trabaja un turno en la Tortillería Marín (de 6 a 3) y saca al menos 10 tortillas buenas.',
    step: () => 'Habla con Rubén Marín y pide un turno. Voltea las tortillas cuando se inflen.',
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'ruben_marin') return [];
      return [{ text: 'Trabajar un turno en la tortillería', tag: 'money', run: async d => {
        if (!Q.started('s_tortillas')) Q.start('s_tortillas');
        await d.say(npc, 'Ándale, ponte el mandil. Cuando se inflen, las volteas; cuando se inflen otra vez, las sacas. Si se queman, me las cobras… no, es broma.');
        d.ui.hideDialog();
        const res = await g.tortillasShift(npc);
        if (!res) return;
        await d.say(npc, res.good >= 10 ? `¡${res.good} buenas! Tienes manos de tortillero, como mi papá.` : `${res.good} buenas. Mañana te sale mejor.`);
        if (res.good >= 10 && !Q.done('s_tortillas')) Q.finish('s_tortillas', 'Manos de tortillero');
      } }];
    },
  },
  s_baches: {
    title: 'El bache de la Vicente Guerrero', giver: 'chuy', desc: 'Un bache se tragó la llanta del taxi de Chuy. Nadie en el Ayuntamiento hace nada.',
    step: (g) => { const q = g.quests.q('s_baches'); return q.stage === 1 ? `Junta firmas de vecinos (${g.state.firmas || 0}/5).` : q.stage === 2 ? 'Lleva la petición al Palacio: al Presidente o a algún regidor.' : q.stage === 3 ? 'Prometieron todo. Compra un bulto de cemento (Ferretuberías o una tlapalería) y llévaselo a Chuy.' : ''; },
    target: (g) => { const q = g.quests.q('s_baches'); return q.stage === 3 && g.hasItem('cemento') ? 'chuy' : null; },
    options: (g, npc, Q) => {
      const id = npc.def?.id, q = Q.q('s_baches');
      if (id === 'chuy' && !Q.started('s_baches')) return [{ text: '¿Qué le pasó al taxi, Chuy?', tag: 'quest', run: async d => {
        await d.say(npc, '¡Ese bache de la Vicente Guerrero! Ya se tragó dos llantas y la suspensión. Hay que llevarle firmas al Ayuntamiento, a ver si ahora sí. Junta cinco vecinos que firmen, ándale.');
        Q.start('s_baches'); g.state.firmas = 0; g.state.firmados = [];
      } }];
      if (q.stage === 1 && id && !npc.def.crowd && id !== 'chuy' && !(g.state.firmados || []).includes(id) && !npc.def.politico) return [{ text: 'Firmar la petición del bache', tag: 'quest', run: async d => {
        g.state.firmados.push(id); g.state.firmas = (g.state.firmas || 0) + 1;
        await d.say(npc, pick1(['¡Claro que firmo! Ese bache ya tiene nombre: le dicen “el Presidente”, porque nunca se va.', 'Firmo, pero no te hagas ilusiones. Aquí los baches duran más que los gobiernos.', 'Dame la pluma. A mi compadre se le rompió el eje ahí mismo.']));
        if (g.state.firmas >= 5) { q.stage = 2; g.ui.toast('Ya tienes 5 firmas. Llévalas al Palacio Municipal.', 'quest'); }
      } }];
      if (q.stage === 2 && npc.def?.politico) return [{ text: 'Le traigo una petición firmada por los vecinos', tag: 'honest', run: async d => {
        await d.say(npc, pick1(['¡Excelente! Esto es democracia, joven. Lo vamos a turnar a la comisión correspondiente. (Mete los papeles en un cajón lleno de papeles.)', 'Muy bien, muy bien. Lo vemos en la próxima sesión de Cabildo… o en la siguiente. Usted confíe.']));
        q.stage = 3; g.ui.toast('Te prometieron todo. Ahora toca esperar… o hacerlo ustedes.', 'quest');
      } }];
      if (id === 'chuy' && q.stage === 3 && g.hasItem('cemento')) return [{ text: 'Chuy, traje cemento. Lo tapamos nosotros', tag: 'kind', run: async d => {
        g.takeItem('cemento');
        await d.say(npc, '¡Ese es mi muchacho! Le hablo a los vecinos. Así se hacen las cosas en Jiquilpan: el Ayuntamiento promete, y el pueblo tapa.');
        await d.narrate('Esa tarde, entre cinco vecinos, Chuy y tú, el bache queda tapado. Alguien escribe con un palito en el cemento fresco: “ESTE NO LO HIZO EL AYUNTAMIENTO”.');
        g.addStat('fama', 8); g.addStat('corazon', 4); g.addMoney(80); Q.finish('s_baches', 'El bache de la Vicente Guerrero');
      } }];
      return [];
    },
  },
  s_loteria: {
    title: '¡Lotería!', giver: 'lety', desc: 'Doña Lety juega lotería en la plaza los viernes, sábados y domingos en la noche. Gana una partida.',
    step: (g) => g.quests.q('s_loteria').stage >= 2 ? 'Cuéntale a Doña Lety que ganaste.' : 'Juega en la mesa de la lotería de la plaza (viernes a domingo, de 5 a 11 de la noche).',
    target: (g) => g.quests.q('s_loteria').stage >= 2 && !g.quests.done('s_loteria') ? 'lety' : null,
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'lety') return [];
      if (!Q.started('s_loteria')) return [{ text: 'Doña Lety, ¿y esa mesa con cartas?', tag: 'quest', run: async d => {
        await d.say(npc, '¡La lotería! Viernes, sábado y domingo en la noche. Diez pesos la tabla. El gritón soy yo, y nadie canta “el borracho” como yo. Si me ganas una, te regalo una gelatina de las grandes.');
        Q.start('s_loteria');
      } }];
      if (Q.q('s_loteria').stage >= 2 && !Q.done('s_loteria')) return [{ text: '¡Le gané una partida!', tag: 'kind', run: async d => {
        await d.say(npc, '¡Ya me contaron! Ten tu gelatina, y la próxima te pongo la tabla de la suerte: la del gallo.');
        g.giveItem('gelatina'); Q.finish('s_loteria', '¡Lotería!');
      } }];
      return [];
    },
  },
  s_caballo: {
    title: 'Lucero, el caballo de los Salazar', giver: 'salazar', desc: 'A Don Salazar se le escapó su yegua Lucero en el cerro.',
    step: (g) => g.flags.lucero_follow ? 'Lleva a Lucero de regreso al Rancho de los Salazar.' : 'Busca a Lucero por La Piedrita: le gusta el agua.',
    target: (g) => g.quests.started('s_caballo') && !g.quests.done('s_caballo') && g.flags.lucero_follow ? 'salazar' : null,
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'salazar') return [];
      const out = [];
      if (!Q.started('s_caballo')) out.push({ text: '¿Qué busca, señor?', tag: 'quest', run: async d => {
        await d.say(npc, 'A mi yegua, la Lucero. Blanca, con una mancha café en la frente. Anoche se espantó con unas luces y rompió la cerca. Le gusta el agua de La Piedrita. Si me la traes, te pago bien.');
        Q.start('s_caballo');
      } });
      if (g.flags.lucero_follow && !Q.done('s_caballo')) out.push({ text: 'Aquí está Lucero', tag: 'kind', run: async d => {
        await d.say(npc, '¡Lucero, mi reina! Mira nomás, ni un rasguño. Ten, muchacho, y una cosa más: la noche que se escapó, las luces bajaron hasta el agua. Yo no digo nada… pero las vi.');
        g.flags.lucero_follow = false; g.flags.lucero_home = true; g.addMoney(180); g.addStat('corazon', 4); Q.finish('s_caballo', 'Lucero, el caballo de los Salazar');
        await d.say(npc, 'Y otra cosa: la Lucero te escogió. Se te fue detrás sin mecate, y eso no lo hace con nadie. Llévatela. Nomás tráemela a herrar cada luna, y si la maltratas, te busco.');
        const lu = g.npcs.animals.find(a => a.def?.id === 'lucero'); if (lu) { lu.dead = true; g.npcs.remove(lu); g.npcs.animals = g.npcs.animals.filter(a => a !== lu); }
        g.state.horse = { name: 'Lucero', color: '#f2efe8', mane: '#d8d0c0', map: g.map.id, x: npc.x + 20, y: npc.y + 6 };
        g.npcs.syncHorse(); g.ui.toast('🐎 Lucero es tuya. Móntala con A; H (o el Morral) para chiflarle.', 'soul');
      } });
      // before Lucero is yours, Don Celso hires out El Prieto by the day
      if (!g.state.horse && !g.flags.lucero_follow) out.push({ text: 'Don Celso, ¿me renta un caballo? ($120 por el día)', tag: 'money', run: async d => {
        if (g.state.money < 120) { await d.say(npc, 'Ciento veinte, joven. Sin dinero no hay caballo; con caballo no hay prisa.'); return; }
        g.addMoney(-120);
        await d.say(npc, 'Llévese al Prieto. Es manso pero no es tonto: no lo meta a los charcos y no lo deje solo de noche. Mañana regresa solito; sabe el camino mejor que usted.');
        g.state.horse = { name: 'El Prieto', color: '#2b2420', mane: '#141010', rented: true, until: g.clock.dayIndex, map: g.map.id, x: npc.x + 20, y: npc.y + 6 };
        g.npcs.syncHorse(); g.ui.toast('🐎 El Prieto es tuyo por hoy. Móntalo con A.', 'good');
      } });
      return out;
    },
  },
  s_casa: {
    title: 'Una casa en Jiquilpan', giver: 'paty', desc: 'Compra un terreno, contrata albañiles y construye tu casa.',
    step: (g) => (g.state.properties || []).length ? 'Habla con el maestro albañil en tu terreno para seguir la obra.' : 'Junta dinero y compra un terreno con letrero de SE VENDE (junto al estadio o cerca del río).',
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'paty' || Q.started('s_casa')) return [];
      return [{ text: '¿Hay terrenos en venta en el pueblo?', tag: 'quest', run: async d => {
        await d.say(npc, 'Hay unos lotes junto al estadio y otros por el río, en la salida a Totolán. Tienen su letrero de “Se vende”. Aquí se hace la escritura. Y el maestro Nacho Zepeda le construye lo que quiera, si le paga por adelantado.');
        Q.start('s_casa');
      } }];
    },
  },
  s_ochoa: {
    title: 'La plática del historiador', giver: 'alvaro_ochoa', desc: 'Álvaro Ochoa da una plática sobre la historia de la Ciénega.',
    step: () => 'Escucha la plática del Dr. Ochoa.',
    options: (g, npc, Q) => {
      if (npc.def?.id !== 'alvaro_ochoa' || Q.done('s_ochoa')) return [];
      return [{ text: 'Escuchar la plática', tag: 'kind', run: async d => {
        if (!Q.started('s_ochoa')) Q.start('s_ochoa');
        await d.say(npc, 'Xiquilpan: “lugar del jiquilite”, la planta del añil. Aquí se teñía de azul desde antes de los españoles. Luego vinieron los conventos, la Independencia, la Reforma… Juárez, por eso “de Juárez”.');
        await d.say(npc, 'Y de este pueblo chico salió un presidente que expropió el petróleo, un poeta que cantó a las jacarandas, un jesuita que murió en Bolonia escribiendo en latín. Los pueblos no se miden por su tamaño, sino por lo que se acuerdan.');
        g.addStat('fama', 2); Q.finish('s_ochoa', 'La plática del historiador'); if (g.flags.mancha) g.gainHilo(npc);
      } }];
    },
  },
  s_mezcal: { title: 'Mezcal para Toño', desc: 'Don Toño quiere una botella del Chamacuero.', step: (g) => g.hasItem('mezcal') ? 'Llévale el mezcal a Don Toño.' : 'Compra una botella en El Chamacuero.', target: (g) => g.hasItem('mezcal') ? 'tono' : null },
};
