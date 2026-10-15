// What you can do with the things inside the places: pray, light a candle, confess, listen to the
// organ, read the shelves of the Biblioteca, look at the murals up close, peek from the balcony of the
// Palacio. Each returns true when it handled the interaction.
import { pick, clamp } from './util.js';
import { ITEMS } from './data/items.js';
import { hasCharm } from './gear.js';
import { paintMural, pointedArch as pointedArchPath } from './render/rooms.js';
import { BOOKS, SECTION_NOTES } from './data/books.js';

const R = Math.random;

export const PLACE_PROMPTS = {
  organo: 'Ver el órgano', altar_guadalupe: 'Rezarle a la Virgen', altar_corazon: 'Rezar al Sagrado Corazón', veladora: 'Prender una veladora ($5)',
  confesion: 'Confesarte', pila: 'Persignarte', armonio: 'Ver el armonio', mural_view: 'Mirar los murales', libros: 'Ver los libros', fichero: 'Buscar en el fichero',
  globo: 'Girar el globo', mural_palacio: 'Ver el mural', cabildo: 'Ver la mesa del Cabildo', balcon: 'Asomarte al balcón',
  clases: 'Ver los talleres', clase_llena: 'Ver el taller', clase_guitarra: 'Clase de guitarra', clase_estudio: 'Taller de estudio', conferencia: 'Ver el pizarrón',
  archivo: 'Investigar en el archivo', arriba_libreria: 'Ver la escalera', bike_stand: 'Ver la bici', maquina_poste: 'Ver la máquina', troqueladora: 'Ver la troqueladora',
};

export async function placeInteract(game, s) {
  const g = game, d0 = g.dialog;
  if (['clases', 'clase_llena', 'clase_guitarra', 'clase_estudio', 'conferencia', 'archivo', 'arriba_libreria', 'bike_stand', 'maquina_poste', 'troqueladora'].includes(s.interact)) return cultureInteract(g, s);
  switch (s.interact) {
    case 'organo': return d0.scene(async d => {
      const cleto = g.npcs.named.get('cleto');
      if (cleto && cleto.map === g.map) {
        await d.narrate('Don Cleto toca. El aire entra por los tubos y la nave entera vibra: el piso, las bancas, el pecho de uno. Afuera, los perros de la plaza se callan.');
        if (g.flags.organDay !== g.clock.dayIndex) { g.flags.organDay = g.clock.dayIndex; g.addStat('corazon', 1); }
        await g.minigames.listenOrgan?.(g, true);
        return;
      }
      await d.narrate('El órgano de la parroquia: dos teclados, los registros con sus perillas de colores y una fachada de tubos de estaño, los más altos en las torres. Lo trajeron por partes en tren y en carreta; el tubo más grande tuvo que entrar por el atrio, de lado.');
      const c = await d.choose([{ text: 'Sentarte y tocar unas notas', value: 'play', tag: 'kind' }, { text: 'Mejor no', value: 0 }]);
      if (c.value) { d.end(); await g.minigames.playOrgan?.(g); }
    });
    case 'armonio': return d0.scene(async d => {
      await d.narrate('Un armonio de pedales, de madera oscura. Aquí no hay órgano grande: el Sagrado Corazón se construyó con lo que se pudo juntar, y esto es lo que sobró. Doña Pura lo toca en la misa de siete, pedaleando como si fuera en bicicleta.');
      const pura = g.npcs.named.get('pura');
      if (pura && pura.map === g.map) await g.minigames.listenOrgan?.(g, false);
    });
    case 'altar_guadalupe': case 'altar_corazon': return d0.scene(async d => {
      await d.narrate(s.interact === 'altar_guadalupe' ? 'La Virgen de Guadalupe, rodeada de rosas de plástico y de tela, y de fotos: niños, soldados, un señor en una troca, una boda. Gente que alguien quiere que regrese con bien.' : 'El Sagrado Corazón, con el pecho abierto y la mano en alto. Alguien dejó un milagrito de latón: una pierna. Otro, un corazón chiquito.');
      if (g.state.prayed === g.clock.dayIndex) { await d.narrate('Ya rezaste hoy. Te quedas un momento en silencio, de todos modos.'); return; }
      const c = await d.choose([{ text: 'Rezar por tu familia', tag: 'kind', value: 'fam' }, { text: 'Pedir por alguien que te cae mal', tag: 'kind', value: 'enemy' }, { text: 'Seguir tu camino', value: 0 }]);
      if (!c.value) return;
      g.state.prayed = g.clock.dayIndex;
      const k = hasCharm(g, 'rosario') ? 2 : 1;
      g.addStat('corazon', (c.value === 'enemy' ? 3 : 2) * k);
      await d.narrate(c.value === 'enemy' ? 'Cuesta trabajo. Pero lo dices completo, y algo se afloja.' : 'Rezas con las palabras que te enseñó tu abuela, aunque se te revuelvan.');
      if (k > 1) await d.narrate('Las cuentas del rosario de las madres se te van entre los dedos, una por una. Rezas el doble sin darte cuenta.');
    });
    case 'veladora': return d0.scene(async d => {
      if (g.state.money < 5) { await d.narrate('Una veladora cuesta cinco pesos. No traes.'); return; }
      const c = await d.choose([{ text: 'Por tu abuelo', value: 'abuelo' }, { text: 'Por tu abuela', value: 'abuela' }, ...(g.flags.lorenzo_dead ? [{ text: 'Por Lorenzo', value: 'lorenzo' }] : []), { text: 'Por los que ya no están', value: 'muertos' }, { text: 'Nada, gracias', value: 0 }]);
      if (!c.value) return;
      g.addMoney(-5); s.lit = Math.min(1, (s.lit ?? 0.6) + 0.04); s.cacheKey = null;
      if (g.flags.candleDay !== g.clock.dayIndex) { g.flags.candleDay = g.clock.dayIndex; g.addStat('corazon', 1); }
      await d.narrate({ abuelo: 'La flama tiembla y luego se queda derechita. Como él cuando se planta en la plaza.', abuela: 'Pones la veladora junto a las de las señoras. Una se voltea y te sonríe: “Así se hace, mijo”.', lorenzo: 'Le prendes una a Lorenzo. Nadie más lo hace. Alguien tenía que.', muertos: 'Por los que ya no están. La cera escurre despacio, como si tuviera todo el tiempo del mundo.' }[c.value]);
    });
    case 'pila': g.ui.toast('Te persignas con agua bendita, como te enseñó tu abuela. Está fría.', ''); return true;
    case 'confesion': return d0.scene(async d => {
      const padre = g.npcs.named.get('padre');
      if (!padre || padre.map !== g.map) { await d.narrate('El confesionario está vacío. Un letrero escrito a mano: “Confesiones: sábados de 5 a 7 y antes de cada misa”.'); return; }
      if (g.flags.confessWeek === Math.floor(g.clock.dayIndex / 7)) { await d.narrate('Ya te confesaste esta semana. El Padre Tomás te dice desde adentro: “Ve en paz, hijo. Y ya no le busques”.'); return; }
      await d.narrate('Te hincas. Del otro lado de la rejilla, la respiración del Padre Tomás y un olor a menta.');
      const sins = [];
      if ((g.state.fights || 0) > 0) sins.push(`me peleé ${g.state.fights === 1 ? 'una vez' : g.state.fights + ' veces'}`);
      if (g.state.debt > 0) sins.push('debo dinero');
      if (g.flags.knockedOutDay != null || g.stats.fama < -10) sins.push('anduve de borracho');
      if (g.stats.corazon < -10) sins.push('he sido grosero con la gente');
      const c = await d.choose([{ text: sins.length ? `Decirle la verdad: ${sins.join(', ')}` : 'Decirle que no te acuerdas de nada malo', tag: 'honest', value: 'truth' }, { text: 'Inventarle algo para salir rápido', tag: 'mean', value: 'lie' }]);
      g.flags.confessWeek = Math.floor(g.clock.dayIndex / 7);
      if (c.value === 'lie') { g.addStat('palabra', -2); await d.say(padre, 'Hijo, a mí puedes mentirme. Al de arriba, ni lo intentes. Reza un rosario y vuelve cuando quieras de verdad.'); return; }
      g.addStat('palabra', 2); if (g.stats.corazon < 0) g.addStat('corazon', 3);
      await d.say(padre, sins.length ? 'Lo que pesa no es lo que hiciste: es lo que no has arreglado. Ve y arréglalo con quien tengas que arreglarlo. Eso es la penitencia. Ego te absolvo.' : 'Eso que no te acuerdas también cuenta, hijo. Pero está bien: un muchacho que se confiesa sin pecados es más raro que una luz en el cerro. Ve en paz.');
    });
    case 'mural_view': await muralViewer(g); return true;
    case 'mural_palacio': return d0.scene(async d => { await d.narrate('Un mural en el cubo de la escalera: la Ciénega, el añil tendido al sol, un tren, gente que trabaja la tierra y, arriba, un cielo de color de lumbre. La firma está borrada por la humedad.'); });
    case 'libros': return readShelf(g, s.books);
    case 'fichero': return d0.scene(async d => {
      await d.narrate('El fichero: cajoncitos de madera con tarjetas escritas a máquina. Algunas tienen manchas de café de los años sesenta.');
      const c = await d.choose([{ text: 'Buscar “añil”', value: 'anil' }, { text: 'Buscar “luces”', value: 'luces' }, { text: 'Buscar “Jiquilpan”', value: 'jiq' }, { text: 'Buscar “Darío”', value: 'dario' }, { text: 'Cerrar el cajón', value: 0 }]);
      if (!c.value) return;
      if (c.value === 'anil') { await d.narrate('“Añil — cultivo y tinte en la Ciénega de Chapala, siglos XVI–XIX.” Estante de HISTORIA. A lápiz, alguien anotó: “jiquilite = xiquilitl = lo que da nombre al pueblo”.'); g.flags.lore_anil = true; }
      if (c.value === 'luces') { await d.narrate('Hay una tarjeta guía: “LUCES, fenómenos de — véase:” y nada más. Las tarjetas que seguían están arrancadas. Quedan los pedacitos de papel en el riel.'); if (!g.flags.fichas_arrancadas) { g.flags.fichas_arrancadas = true; g.ui.toast('Alguien arrancó las fichas de “Luces”. ¿Quién, y para qué?', 'quest'); } }
      if (c.value === 'jiq') await d.narrate('Doscientas tarjetas. “Jiquilpan — historia”, “— Cárdenas, Lázaro”, “— Orozco, murales de la Biblioteca”, “— rebozo”, “— huarache”, “— Danza de los Negritos”… Hay más historia aquí que pueblo afuera.');
      if (c.value === 'dario') await d.narrate('“Darío, Rubén (1867–1916). Azul… Valparaíso, 1888.” Tres ejemplares. La ficha de préstamo del más viejo tiene, en tinta de pluma, el mismo nombre una y otra vez durante treinta años: Celeste.');
    });
    case 'globo': { const p = pick(R, ['Islandia', 'Mongolia', 'Madagascar', 'Bolivia', 'Japón', 'Senegal', 'Noruega', 'Filipinas', 'Perú', 'Marruecos']); g.ui.toast(`Giras el globo y pones el dedo: ${p}. Algún día.`, ''); return true; }
    case 'cabildo': return d0.scene(async d => {
      const inSession = g.clock.weekday === 2 && g.clock.hour >= 10 && g.clock.hour < 13;
      if (!inSession) { await d.narrate('La mesa larga del Cabildo, con su paño verde y sus banderitas. Los martes en la mañana hay sesión: se discute todo y se decide la mitad.'); return; }
      await d.narrate('Sesión de Cabildo. La regidora de Morena habla de “la transformación”; el del PAN pide la palabra para pedir la palabra; el del PRI recuerda que en sus tiempos ya estaba pavimentada la calle; la del PRD toma nota; el naranja sube un video.');
      await d.narrate('Punto único del orden del día: “Baches”. Se acuerda formar una comisión que estudie la formación de una comisión.');
      if (!g.flags.saw_cabildo) { g.flags.saw_cabildo = true; g.addStat('fama', 1); }
    });
    case 'balcon': return d0.scene(async d => {
      const h = g.clock.hour;
      await d.narrate(h >= 18 || h < 6 ? 'Desde el balcón del Palacio: la plaza encendida, el kiosco, los portales con sus focos amarillos y, detrás de los techos, el Cerro de San Francisco tapando un pedazo de estrellas.' : 'Desde el balcón del Palacio se ve todo el Jardín: Rosita con su café, los boleros, los perros dormidos en la sombra, la Aguadora derramando su cántaro, y el cerro al fondo, como siempre, mirando.');
      if (g.clock.month === 8 && g.clock.date.getUTCDate() === 15 && h >= 22) await d.narrate('Esta noche, desde aquí, el Presidente dará el Grito. Abajo ya huele a pozole y a pólvora.');
    });
  }
  return false;
}

// The murals of the Biblioteca, up close: pan across a big painting while Maestra Olga talks.
export function muralViewer(g) {
  return new Promise(resolve => {
    const el = document.createElement('div'); el.className = 'mg mural-view';
    el.innerHTML = `<div class="mg-card wide"><div class="mg-head"><div><div class="mg-title">Los muros pintados de la Gabino Ortiz</div><div class="mg-sub">Desliza para recorrer el muro · una evocación para el juego, no una copia</div></div><button class="round mg-x" aria-label="Salir">✕</button></div>
      <div class="mg-body"><div class="mural-scroll"><canvas width="2400" height="520"></canvas></div><p class="mural-cap"></p><div class="mg-actions"><button class="btn" data-k="prev">◀</button><button class="btn" data-k="next">▶</button></div></div></div>`;
    document.body.appendChild(el);
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    // the nave unrolled: two bays of the left wall, the apse, two bays of the right wall
    cv.width = 3000; cv.height = 520; ctx.scale(6, 6);
    const VH = 520 / 6;
    ctx.fillStyle = '#efe9dd'; ctx.fillRect(0, 0, 500, VH);
    const panels = [[4, 88, 1944, 'grisaille'], [96, 88, 1945, 'grisaille'], [192, 116, 1940, 'color'], [312, 88, 1943, 'grisaille'], [404, 92, 1947, 'grisaille']]; // seed % 3: the crowd, the horses, the fallen
    for (const [x, w, seed, mode] of panels) {
      if (mode === 'color') {
        ctx.save(); pointedArchPath(ctx, x, x + w, 64, 2); ctx.clip(); paintMural(ctx, x, 2, w, 62, seed, 'color', true); ctx.restore();
        ctx.strokeStyle = '#cfc4ae'; ctx.lineWidth = 1.4; pointedArchPath(ctx, x - 0.7, x + w + 0.7, 64, 1.3); ctx.stroke();
        ctx.fillStyle = '#4a2c1a'; ctx.fillRect(x - 6, 64, w + 12, VH - 64); // the wood paneling and its doors
        for (const d of [x + w * 0.2, x + w * 0.8]) { ctx.fillStyle = '#2e1a0f'; ctx.fillRect(d - 6, 66, 12, VH - 66); ctx.fillStyle = '#5e3822'; ctx.fillRect(d - 5.4, 67, 10.8, VH - 67); ctx.fillStyle = '#d9b24a'; ctx.fillRect(d - 1.4, 76, 0.6, 0.6); ctx.fillRect(d + 0.8, 76, 0.6, 0.6); }
        for (let k = x + w * 0.32; k < x + w * 0.66; k += 7) { ctx.fillStyle = '#5a3520'; ctx.fillRect(k, 68, 5.6, VH - 72); }
      } else {
        paintMural(ctx, x, 4, w, VH - 8, seed, 'grisaille', true);
        ctx.strokeStyle = '#7a7166'; ctx.lineWidth = 0.4; ctx.strokeRect(x, 4, w, VH - 8);
      }
    }
    for (const px of [0, 92, 184, 308, 400, 496]) { ctx.fillStyle = '#d8cfbd'; ctx.fillRect(px, 0, 4, VH); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px + 3.4, 0, 0.6, VH); } // the pilasters
    const caps = [
      '“Entras y a la izquierda está la gente: todo en grises, como hollín, como humo. El único color es el rojo de las banderas. Orozco no pintaba héroes bonitos; pintaba al pueblo con el peso que carga.” — Maestra Olga',
      '“Los caballos salen del humo con los ojos en blanco. ¿Ves los sombreros, los rifles? Es la Revolución, pero aquí nadie posa para la foto: todo se mueve, todo se está cayendo.” — Maestra Olga',
      '“Al fondo, donde antes estaba el altar, bajo el arco en punta: la alegoría, en color. El verde, el blanco y el rojo doblándose como una bandera al viento, el águila, el jaguar, la figura del manto de lumbre, los hombres armados y, abajo, los nopales. Lo pintó en 1940. Dicen que el General venía a verlo trabajar y no decía nada.” — Maestra Olga',
      '“A la derecha, los caídos. Cuerpos tirados entre el humo, una bandera rota en el suelo, y uno que sigue de pie con los brazos arriba. Llevo treinta años aquí y todavía les encuentro gente nueva a estos muros.” — Maestra Olga',
      '“Y otra vez la gente, gritando con la boca abierta. Fíjate: ninguno tiene nombre. Ese era el punto.” — Maestra Olga',
      '“Lo que ves en el juego es un recuerdo, no el mural: para verlo de verdad hay que venir a Jiquilpan, torcer el cuello y quedarse un rato callado.”',
    ];
    const centers = [48, 140, 250, 356, 450, 250];
    let i = 0; const scroll = el.querySelector('.mural-scroll'), cap = el.querySelector('.mural-cap');
    const show = () => { cap.textContent = caps[i]; const k = scroll.scrollWidth / 500; scroll.scrollTo({ left: Math.max(0, centers[i] * k - scroll.clientWidth / 2), behavior: 'smooth' }); };
    el.querySelector('[data-k="prev"]').onclick = () => { i = (i + caps.length - 1) % caps.length; show(); };
    el.querySelector('[data-k="next"]').onclick = () => { i = (i + 1) % caps.length; show(); };
    const close = () => { el.remove(); window.removeEventListener('keydown', key, true); g.input.enabled = true; if (!g.flags.saw_murals) { g.flags.saw_murals = true; g.addStat('corazon', 1); g.ui.toast('Te quedaste un buen rato mirando los muros.', 'good'); } resolve(); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } if (e.key === 'ArrowRight') el.querySelector('[data-k="next"]').click(); if (e.key === 'ArrowLeft') el.querySelector('[data-k="prev"]').click(); };
    window.addEventListener('keydown', key, true);
    el.querySelector('.mg-x').onclick = close;
    g.input.enabled = false; g.ui.prompt(null);
    show();
  });
}

// Browsing a section of the library: a few real books, a line about each, and you can sit and read.
function readShelf(g, key) {
  return g.dialog.scene(async d => {
    const list = BOOKS[key] || [];
    await d.narrate(SECTION_NOTES[key] || 'Libros viejos, con el lomo despegado y olor a polvo dulce.');
    const opts = list.map((b, i) => ({ text: `${b.t} — ${b.a}${b.y ? ` (${b.y})` : ''}`, value: i }));
    opts.push({ text: 'Cerrar', value: -1 });
    const c = await d.choose(opts);
    if (c.value < 0) return;
    const b = list[c.value];
    await d.narrate(b.note);
    if (b.quote) await d.narrate(`«${b.quote}»`);
    const c2 = await d.choose([{ text: 'Sentarte a leerlo un rato (media hora)', value: 'read', tag: 'kind' }, { text: 'Regresarlo al estante', value: 0 }]);
    if (!c2.value) return;
    g.clock.minutes += 30;
    const k = `read_${key}_${c.value}`;
    if (!g.flags[k]) {
      g.flags[k] = true; g.state.saber = (g.state.saber || 0) + 1;
      g.addStat(b.stat || 'palabra', 1);
      g.ui.toast(`📖 Leíste un rato “${b.t}”. Saber: ${g.state.saber}`, 'good');
    } else g.ui.toast('Lo vuelves a hojear. Ya lo conoces, pero encuentras otra cosa.', '');
  });
}

// ---- workshops, lectures, research, the shops' machines --------------------------------------------------
const CLASES = {
  danza: ['Danza folclórica', 'Maestra Yadira', 'Lunes, miércoles y viernes, 5 pm', 'Jarabes de Jalisco y de Michoacán, la danza de los viejitos, sones de la Tierra Caliente.'],
  ceramica: ['Cerámica', 'Don Rufino', 'Martes y jueves, 10 am', 'Torno, pastillaje y bruñido; ollas de barro como las de Tzintzuntzan.'],
  pintura: ['Artes plásticas', 'Maestra Pita', 'Sábados, 10 am', 'Dibujo del natural y acuarela en la plaza; el último sábado del mes, mural colectivo.'],
};
export async function cultureInteract(g, s) {
  const d0 = g.dialog;
  switch (s.interact) {
    case 'clases': return d0.scene(async d => {
      await d.narrate('El tablero de los talleres, lleno de papelitos con tachuelas:');
      await d.narrate('DANZA FOLCLÓRICA — CUPO LLENO. CERÁMICA — CUPO LLENO (lista de espera hasta marzo). ARTES PLÁSTICAS — CUPO LLENO. GUITARRA — lunes a viernes, 4 a 8 pm, con el Profe Ismael: ¡HAY LUGARES! TALLER DE ESTUDIO (oratoria, argumentación, persuasión) — con la Maestra Adela: ¡HAY LUGARES!');
      await d.narrate('Abajo, a mano: “Conferencia del Dr. Álvaro Ochoa, jueves 6 pm. Entrada libre. Traiga su silla, por si acaso”.');
    });
    case 'clase_llena': return d0.scene(async d => {
      const c = CLASES[s.clase] || CLASES.danza;
      await d.narrate(`${c[0]} con ${c[1]}: ${c[2]}. ${c[3]}`);
      await d.narrate('Un papel pegado con cinta: “CUPO LLENO”. Abajo, una lista de espera de dos hojas. El tuyo sería el nombre cuarenta y tres.');
      if (!g.flags['espera_' + s.clase]) { g.flags['espera_' + s.clase] = true; g.ui.toast('Te anotaste en la lista de espera. No te hagas ilusiones.', ''); }
    });
    case 'clase_guitarra': return g.minigames.guitarClass ? g.minigames.guitarClass(g) : d0.scene(async d => d.narrate('La clase de guitarra es de lunes a viernes, de 4 a 8 de la tarde.'));
    case 'clase_estudio': return g.minigames.studyClass ? g.minigames.studyClass(g) : d0.scene(async d => d.narrate('El taller de estudio de la Maestra Adela: lunes, miércoles y viernes en la mañana; martes y jueves en la tarde.'));
    case 'conferencia': return g.minigames.lecture ? g.minigames.lecture(g) : d0.scene(async d => d.narrate('El pizarrón del aula: “Etnohistoria de la Ciénega. Fuentes y no fantasmas”.'));
    case 'archivo': return g.minigames.archive ? g.minigames.archive(g, s.fondo) : d0.scene(async d => d.narrate('Cajas grises con etiquetas a máquina.'));
    case 'arriba_libreria': return d0.scene(async d => {
      await d.narrate('La escalera de madera sube a la bodega. Un mecate rojo y un letrero: “BODEGA · SÓLO PERSONAL”.');
      const leti = g.npcs.named.get('leticia');
      if (leti && leti.map === g.map) await d.say(leti, 'Ahí arriba nomás hay cajas, mijo, y un murciélago que se llama Octavio. Si buscas algo, dime y yo te lo bajo.');
      else await d.narrate('Desde arriba se oye una caja que se arrastra. Mejor no.');
    });
    case 'bike_stand': return d0.scene(async d => {
      await d.narrate('Una bici de ruta verde, de cabeza en el soporte, con la rueda de atrás quitada. En el cuadro, una calcomanía vieja de Los Rinos y otra, más nueva, de un colibrí.');
      const jl = g.npcs.named.get('jose_luis');
      if (jl && jl.map === g.map) await d.say(jl, 'Es la de Liber. La trae como si fuera caballo de carreras: le cambio la cadena cada tres meses. ¿La has visto subir a la Trasquila? Parece que no le pesa nada.');
    });
    case 'maquina_poste': return d0.scene(async d => {
      await d.narrate('Una máquina de poste, de hierro colado y pintura negra que ya es gris en los bordes. En el brazo, una placa de latón casi borrada: “…Mass. U.S.A. 1928”. Don Arnulfo la compró de segunda en 1961, en Guadalajara, y la trajo en el camión de redilas de un compadre.');
      if (g.minigames.stitch) { const c = await d.choose([{ text: 'Pedirle que te enseñe a coser un huarache', value: 1, tag: 'kind' }, { text: 'Nomás mirar', value: 0 }]); if (c.value) { d.end(); await g.minigames.stitch(g); } }
    });
    case 'troqueladora': return d0.scene(async d => { await d.narrate('La troqueladora: una palanca de fierro que baja un molde con filo sobre la vaqueta. ¡Clac! y sale una suela. En la madera del banco, cientos de cortes, uno encima del otro, como los anillos de un árbol.'); });
  }
  return false;
}
