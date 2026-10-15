// Classes and small crafts: Maestra Adela's study workshop (public speaking, argument, persuasion and
// how lies work), Dr. Ochoa's lectures, digging in the UNAM archive, stitching a huarache with Don
// Arnulfo, and the trompo challenge with the kids of the plaza.
import { pick, clamp } from './util.js';

function overlay(title, sub, wide) {
  const el = document.createElement('div'); el.className = 'mg';
  el.innerHTML = `<div class="mg-card ${wide ? 'wide' : ''}"><div class="mg-head"><div><div class="mg-title">${title}</div><div class="mg-sub">${sub}</div></div><button class="round mg-x" aria-label="Salir">✕</button></div><div class="mg-body"></div></div>`;
  document.body.appendChild(el);
  return { el, body: el.querySelector('.mg-body'), close: el.querySelector('.mg-x') };
}
function modal(g, title, sub, build, wide) {
  return new Promise(resolve => {
    const o = overlay(title, sub, wide);
    let done = false;
    const finish = (v) => { if (done) return; done = true; o.el.remove(); window.removeEventListener('keydown', key, true); g.input.enabled = true; resolve(v); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); finish(null); } };
    window.addEventListener('keydown', key, true); o.close.onclick = () => finish(null);
    g.input.enabled = false; g.ui.prompt(null);
    build(o.body, finish);
  });
}
export const skill = (g, k) => (g.state.skills || {})[k] || 0;
function addSkill(g, k, label) {
  g.state.skills ||= {}; g.state.skills[k] = Math.min(3, (g.state.skills[k] || 0) + 1);
  g.ui.toast(`📚 ${label}: nivel ${g.state.skills[k]}`, 'soul');
}

// ---- Taller de estudio ----------------------------------------------------------------------------------
const STUDY = [
  { key: 'oratoria', title: 'Oratoria: que te escuchen', lesson: [
    'Empieza por lo que tu público ya conoce. En el kiosco no empieces con “las luces”: empieza con la plaza, con el café de Rosita, con algo que todos hayan visto.',
    'Una idea por frase. Frases cortas. Y antes de lo importante, una pausa: el silencio también habla, y hace que la gente levante la cara del teléfono.',
    'No le hables a la multitud: háblale a una persona a la vez, y cambia de persona. Así cada quien siente que le hablas a él.'],
    quiz: [['Vas a hablar en el kiosco un viernes. ¿Cómo empiezas?', ['Con lo que viste en el cerro, de golpe', 'Con algo que todos en la plaza conocen', 'Pidiendo que guarden silencio'], 1],
      ['¿Dónde va la pausa?', ['Al final, para que aplaudan', 'Justo antes de lo más importante', 'No hay que hacer pausas: se aburren'], 1],
      ['¿A quién le hablas?', ['A la multitud entera, mirando arriba', 'A una persona a la vez, cambiando de persona', 'Al Presidente, que es el que manda'], 1]] },
  { key: 'argumentar', title: 'Argumentar: dar razones, no gritos', lesson: [
    'Un argumento tiene tres piezas: lo que afirmas, la prueba que lo sostiene, y el puente que une la prueba con lo que afirmas.',
    'Y tiene trampas, que se llaman falacias. Atacar a la persona en vez de a la idea (“¿y tú quién eres, chamaco?”). Pintar una caricatura de lo que el otro dijo para tumbarla fácil. Decir que algo es cierto porque “siempre ha sido así”. Juzgar a todos por uno (“todos los de Sahuayo son…”).',
    'Quien grita no tiene más razón: tiene menos paciencia.'],
    quiz: [['“¿Y tú qué sabes del cerro? Si apenas llegaste de Morelia.” ¿Qué falacia es?', ['Ataque a la persona', 'Generalización', 'Ninguna: es buena pregunta'], 0],
      ['“Los de Sahuayo se llevaron los huaraches; todos los de Sahuayo son unos rateros.”', ['Argumento sólido', 'Generalización apresurada', 'Apelación a la tradición'], 1],
      ['Para convencer al Padre de que pasó algo en el cerro, ¿qué necesitas?', ['Repetirlo más fuerte', 'Pruebas y el puente que las une con lo que dices', 'Que lo diga alguien famoso'], 1]] },
  { key: 'persuasion', title: 'Persuadir: mover a la gente sin empujarla', lesson: [
    'Aristóteles decía que se convence con tres cosas: con quién eres (tu palabra, tu fama), con lo que la gente siente, y con las razones.',
    'La gente también se mueve por cosas más simples: devolvemos los favores, queremos lo que se acaba, y hacemos lo que vemos hacer a los demás. Por eso la Chata regala la primera cerveza y por eso una fila atrae más fila.',
    'Persuadir no es engañar. Si convences a alguien de algo que le hace daño, ganaste la plática y perdiste a la persona.'],
    quiz: [['Quieres que el pueblo apague el celular un viernes. ¿Qué funciona mejor?', ['Regañarlos', 'Que vean a los Güeros, a Rosita y al Padre hacerlo primero', 'Un letrero que diga PROHIBIDO'], 1],
      ['¿Cuál de estas NO es una de las tres de Aristóteles?', ['Quién eres', 'Lo que la gente siente', 'Lo fuerte que hablas'], 2],
      ['Convences a Don Frijoles de fiarte diez caguamas que no vas a pagar. ¿Qué perdiste?', ['Nada: ganaste', 'A Don Frijoles (y tu palabra)', 'Diez pesos'], 1]] },
  { key: 'mentir', title: 'La mentira: cómo corre y cómo se le alcanza', lesson: [
    'Esta clase no es para que mientas: es para que no te mientan. Pero ya sé que alguno va a usarla al revés.',
    'La mentira necesita detalles que no se pueden comprobar, y por eso el mentiroso explica de más. La verdad a medias es la mentira más peligrosa: tiene la mitad de la verdad para defenderse.',
    'Para descubrirla: pide que te cuenten la historia al revés, del final al principio; pregunta un detalle que se pueda checar; y escucha lo que no dicen. Mentir cuesta: cada mentira pide otra para sostenerse, y la palabra no se recupera fácil.'],
    quiz: [['¿Qué hace casi siempre el que miente?', ['Contesta corto', 'Explica de más', 'Te mira a los ojos'], 1],
      ['Para checar una historia rara, le pides que…', ['La repita más fuerte', 'La cuente del final al principio', 'Jure por su madre'], 1],
      ['¿Cuál es la mentira más difícil de descubrir?', ['La exagerada', 'La verdad a medias', 'La que se dice borracho'], 1]] },
];
export function studyClass(g) {
  const prof = g.npcs.named.get('adela');
  const here = prof && prof.map === g.map;
  return g.dialog.scene(async d => {
    if (!here) { await d.narrate('El pizarrón dice: ORATORIA · ARGUMENTAR · PERSUADIR · ¿Y MENTIR? El taller de la Maestra Adela es lunes, miércoles y viernes en la mañana, y martes y jueves en la tarde.'); return; }
    if (g.state.studyDay === g.clock.dayIndex) { await d.say(prof, 'Una sesión al día. Lo que no se practica se olvida: ve y platica con la gente.'); return; }
    const left = STUDY.filter(s => skill(g, s.key) < 1);
    const opts = STUDY.map((s, i) => ({ text: `${s.title}${skill(g, s.key) ? ' ✓' : ''}`, value: i }));
    opts.push({ text: 'Hoy no, maestra', value: -1 });
    await d.say(prof, left.length ? 'Siéntate. Hoy, ¿qué te hace falta? Escoge tú: el que escoge, aprende más.' : 'Ya pasaste por todo el taller. Puedes repetir el tema que quieras; repetir no es de burros, es de sabios.');
    const c = await d.choose(opts, prof);
    if (c.value < 0) return;
    d.end();
    const S = STUDY[c.value];
    const res = await modal(g, `📚 ${S.title}`, 'Taller de estudio · Maestra Adela', (body, finish) => {
      body.innerHTML = `<div class="lesson-text">${S.lesson.map(p => `<p>${p}</p>`).join('')}</div><div class="quiz"></div><p class="lesson-status"></p>`;
      const qz = body.querySelector('.quiz'), st = body.querySelector('.lesson-status');
      let qi = 0, right = 0;
      const ask = () => {
        if (qi >= S.quiz.length) {
          st.textContent = right >= 2 ? `Bien ${right} de ${S.quiz.length}. La Maestra Adela asiente, que en ella es casi un aplauso.` : `Bien ${right} de ${S.quiz.length}. “Otra vez, con calma.”`;
          qz.innerHTML = `<div class="mg-actions"><button class="btn">${right >= 2 ? 'Terminar' : 'Salir'}</button></div>`;
          qz.querySelector('button').onclick = () => finish(right >= 2); return;
        }
        const [q, os] = S.quiz[qi];
        qz.innerHTML = `<p><b>${q}</b></p><div class="quiz-opts">${os.map((o, k) => `<button class="btn alt" data-a="${k}">${o}</button>`).join('')}</div>`;
        qz.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const ok = +b.dataset.a === S.quiz[qi][2]; if (ok) right++; b.classList.add(ok ? 'right' : 'wrong'); setTimeout(() => { qi++; ask(); }, 450); });
      };
      ask();
    }, true);
    g.state.studyDay = g.clock.dayIndex; g.clock.minutes += 60;
    if (res) {
      addSkill(g, S.key, S.title.split(':')[0]);
      if (S.key === 'mentir') g.addStat('palabra', -1); else g.addStat('palabra', 1);
      g.state.saber = (g.state.saber || 0) + 1; g.save();
    }
  });
}

// ---- Dr. Ochoa's lectures ------------------------------------------------------------------------------
const LECTURES = [
  ['Los afrodescendientes de la Ciénega', [
    'En los padrones parroquiales del siglo XVIII de esta región aparecen, una y otra vez, palabras que hoy casi nadie usa: “mulato libre”, “moreno”, “pardo”. Eran arrieros, vaqueros, tintoreros de añil, sirvientes, soldados de las milicias.',
    'La mayoría eran descendientes de africanos traídos a la Nueva España en los siglos XVI y XVII. Con el tiempo se casaron con indígenas y con españoles, y sus apellidos son los apellidos de cualquiera de ustedes.',
    'No lo digo para que nadie se ofenda ni para que nadie se enorgullezca de más. Lo digo porque está en el papel. La historia se hace con documentos, no con lo que nos gustaría haber sido.']],
  ['Los “chinos” de la Nao', [
    'Por Acapulco llegó durante dos siglos y medio el Galeón de Manila. Con la seda y la porcelana llegaron personas: filipinos, gente de las islas del Pacífico y del sudeste de Asia, a quienes los registros llaman, a todos, “chinos”.',
    'Algunos se quedaron en la costa de Colima y de Michoacán. La tuba, esa bebida de palma que venden en Colima, es herencia suya; también ciertas palabras y ciertas maneras de trabajar la palma.',
    'Cuando digo que la Ciénega se hizo de muchas sangres, no estoy haciendo poesía: estoy leyendo actas de bautizo.']],
  ['El añil y el rebozo', [
    'Xiquilpan: lugar del jiquilite, la planta del añil. Aquí se teñía de azul desde antes de la Conquista; luego, en obrajes. Las manos de las tintoreras se quedaban azules semanas enteras.',
    'De ese azul viene el rebozo de bolita, tejido en telar de cintura. Cuando la producción se volvió industria, se mudó a donde había capital y caminos: Sahuayo, Zamora, Guadalajara. Lo mismo pasó, en el siglo XX, con el huarache.',
    'No hubo robo en el sentido del Código Penal. Hubo algo más común y más triste: un pueblo que hacía las cosas bien y otro que supo venderlas.']],
];
export function lecture(g) {
  const ochoa = g.npcs.named.get('alvaro_ochoa');
  const here = ochoa && ochoa.map === g.map;
  return g.dialog.scene(async d => {
    if (!here) { await d.narrate(g.map.id === 'unam' ? 'El aula está vacía. En la puerta: “Conferencias del Dr. Álvaro Ochoa: viernes de 10 a 1”.' : 'Las conferencias del Dr. Ochoa son los jueves a las 6 de la tarde.'); return; }
    if (g.state.lectureDay === g.clock.dayIndex) { await d.narrate('Ya oíste la conferencia de hoy. El doctor contesta preguntas a un grupo de estudiantes.'); return; }
    const full = ((g.clock.dayIndex * 7 + (g.map.id === 'unam' ? 3 : 0)) % 5) < 2;
    await d.narrate(full ? 'El aula está llena: estudiantes de la UNAM, maestros jubilados, dos señoras con su libreta. No hay dónde sentarse; te quedas parado al fondo, junto a la puerta.' : 'Encuentras lugar en la tercera fila. El doctor acomoda sus papeles, se sube los lentes y empieza sin micrófono.');
    const n = (g.state.lectures || 0) % LECTURES.length;
    const [title, parts] = LECTURES[n];
    await d.say(ochoa, `Hoy: “${title}”.`);
    for (const p of parts) await d.say(ochoa, p);
    const c = await d.choose([{ text: 'Levantar la mano: “¿Y de las luces del cerro, doctor?”', value: 'luces', tag: 'honest' }, { text: 'Levantar la mano: “¿Dónde están esos documentos?”', value: 'doc', tag: 'kind' }, { text: 'Quedarte callado y tomar notas', value: 'notas' }], ochoa);
    if (c.value === 'luces') { await d.say(ochoa, 'De eso no hablo, joven. No porque me dé miedo: porque no hay papel. Tráigame un documento y le dedico una conferencia entera. Mientras tanto, es folclor, y el folclor es respetable, pero es otra cosa.'); g.flags.ochoa_luces = true; }
    else if (c.value === 'doc') { await d.say(ochoa, 'En el archivo de la Unidad, en los padrones del obispado de Michoacán, en los libros de bautizos de la parroquia. Ve con el Dr. Ramírez y pídele los censos. Y lea despacio: la letra del siglo dieciocho no perdona.'); g.flags.ochoa_archivo = true; g.addStat('palabra', 1); }
    else g.addStat('palabra', 1);
    g.state.lectures = (g.state.lectures || 0) + 1; g.state.lectureDay = g.clock.dayIndex; g.state.saber = (g.state.saber || 0) + 1; g.clock.minutes += 75;
    g.ui.toast(`📖 Conferencia: ${title}. Saber: ${g.state.saber}`, 'good');
  });
}

// ---- the archive of the UNAM -------------------------------------------------------------------------------
const FONDOS = {
  cardenas: ['Fondo Lázaro Cárdenas', [['Cartas de campesinos, 1934–1940', 'Cientos de cartas a mano: piden un pozo, una escuela, un maestro, justicia. Una de 1939, de Nacho Marín, pide una bomba de agua “para que la milpa no dependa del cielo”.'], ['Fotografías de la Ciénega', 'El General en mangas de camisa, en una canoa, en La Lagunita. Al fondo, unas mujeres con rebozos azules miran a la cámara.']]],
  archivo: ['Archivo histórico', [['Obrajes de añil, siglo XVIII', 'Licencias, deudas, inventarios: tinas, jiquilite, “un esclavo mulato de nombre Juan, tintorero”. El azul del pueblo también se pagó con eso.'], ['Juicio por una caja de luces, 1863', 'Un expediente rarísimo: un juez de paz anota que varios vecinos vieron “luces que caminaban” sobre el cerro y que el cura los mandó callar. Falta la última hoja.']]],
  tesis: ['Tesis de la Unidad', [['La industria del huarache en Sahuayo (1950–1990)', 'Una tesis de maestría: cómo los talleres de Sahuayo copiaron el tejido de tres puntadas de los huaracheros de Jiquilpan, lo pasaron a máquina y lo vendieron en todo el país. Cita una entrevista: “Don Arnulfo Ortiz, último huarachero”.'], ['El rebozo de bolita: técnica y memoria', 'Fotografías de telares de cintura en Jiquilpan y en Sahuayo. Una tejedora dice: “Nos compraban el rebozo a cien y lo vendían a mil”.']]],
  censos: ['Padrones y censos', [['Padrón de La Lagunita, 1791', 'Familias de pescadores y tintoreros. Una línea subrayada a lápiz por alguien antes que tú: “Salazar, Miguel, mulato libre, tintorero de añil, casado con María Antonia, india, con tres hijos”. Miguel, Antonio… y un Lorenzo.'], ['Censo de 1930, Jiquilpan', 'Oficios: 21 huaracheros, 34 tejedoras de rebozo, 3 tintoreros. En 1960 ya no aparece ningún tintorero.']]],
};
export function archive(g, fondo) {
  const F = FONDOS[fondo] || FONDOS.archivo;
  return g.dialog.scene(async d => {
    const ram = g.npcs.named.get('ramirez');
    if (!ram || ram.map !== g.map) { await d.narrate(`${F[0]}: cajas grises con etiquetas a máquina. Sin el Dr. Ramírez no se pueden abrir: “Material de consulta. Pida ayuda al investigador”.`); return; }
    await d.say(ram, `${F[0]}. Guantes, lápiz, nada de pluma. ¿Qué buscamos?`);
    const c = await d.choose([...F[1].map(([t], i) => ({ text: t, value: i })), { text: 'Nada, gracias', value: -1 }], ram);
    if (c.value < 0) return;
    const [t, body] = F[1][c.value];
    g.clock.minutes += 45;
    await d.narrate(`${t}. ${body}`);
    const key = `doc_${fondo}_${c.value}`;
    if (!g.flags[key]) {
      g.flags[key] = true; g.state.saber = (g.state.saber || 0) + 1;
      g.state.docs = (g.state.docs || []).concat([t]);
      g.ui.toast(`🗂️ Documento: ${t}`, 'quest');
      g.quests.onDocument?.(key);
    }
  });
}

// ---- stitching a huarache with Don Arnulfo -----------------------------------------------------------------
// The three-stitch weave: over, under, through. Follow the pattern with ← ↓ → (or tap the arrows).
export function stitch(g) {
  const PAT = ['←', '↓', '→', '↓', '←', '↓', '→', '↓', '←', '↓', '→', '↓'];
  return modal(g, '🩴 La tres puntadas', 'Don Arnulfo te enseña: “una puntada contesta a la otra”. Sigue el patrón: ← ↓ → … sin prisa y sin equivocarte.', (body, finish) => {
    let i = 0, miss = 0;
    body.innerHTML = `<div class="stitch"><div class="stitch-row">${PAT.map((p, k) => `<span data-k="${k}">${p}</span>`).join('')}</div><canvas width="520" height="120"></canvas></div><div class="mg-actions" style="gap:10px">${['←', '↓', '→'].map(a => `<button class="btn alt" data-a="${a}">${a}</button>`).join('')}</div><p class="lesson-status">Puntada 1 de ${PAT.length}</p>`;
    const cv = body.querySelector('canvas'), ctx = cv.getContext('2d'), st = body.querySelector('.lesson-status');
    const spans = [...body.querySelectorAll('.stitch-row span')];
    const draw = () => {
      ctx.fillStyle = '#7a4a28'; ctx.fillRect(0, 0, 520, 120);
      ctx.fillStyle = '#5a331d'; ctx.fillRect(20, 30, 480, 60);
      for (let k = 0; k < i; k++) { const x = 30 + k * 39; ctx.fillStyle = k % 2 ? '#c99a5a' : '#b07a4a'; ctx.fillRect(x, 34 + (k % 3) * 4, 30, 48 - (k % 3) * 8); ctx.strokeStyle = '#3a2214'; ctx.lineWidth = 2; ctx.strokeRect(x, 34 + (k % 3) * 4, 30, 48 - (k % 3) * 8); }
      spans.forEach((s, k) => s.className = k < i ? 'done' : k === i ? 'next' : '');
    };
    const press = (a) => {
      if (i >= PAT.length) return;
      if (a === PAT[i]) { i++; g.audio.pluck(196 + i * 12, 0, 0.08); }
      else { miss++; g.sfx('tap'); st.textContent = miss > 3 ? '“Se te zafó. Así no, mijo: deshaz y vuelve.”' : '“Esa no. Fíjate en la que sigue.”'; if (miss > 3) { i = Math.max(0, i - 3); miss = 0; } }
      draw();
      if (i >= PAT.length) { st.textContent = '“Ahora sí: eso es un huarache de Jiquilpan.” Don Arnulfo lo voltea, le jala las tiras y te lo da.'; body.querySelector('.mg-actions').innerHTML = '<button class="btn">Llevártelo</button>'; body.querySelector('.mg-actions button').onclick = () => finish(true); }
      else if (!st.textContent.startsWith('“')) st.textContent = `Puntada ${i + 1} de ${PAT.length}`;
    };
    body.querySelectorAll('[data-a]').forEach(b => b.onclick = () => press(b.dataset.a));
    const keys = (e) => { const m = { ArrowLeft: '←', ArrowDown: '↓', ArrowRight: '→', a: '←', s: '↓', d: '→' }[e.key]; if (m) { e.preventDefault(); press(m); } };
    window.addEventListener('keydown', keys);
    const obs = new MutationObserver(() => { if (!document.body.contains(body)) { window.removeEventListener('keydown', keys); obs.disconnect(); } }); obs.observe(document.body, { childList: true });
    draw();
  }).then(ok => {
    if (!ok) return false;
    if (!g.flags.cosiste_huarache) { g.flags.cosiste_huarache = true; g.state.wardrobe = Array.from(new Set([...(g.state.wardrobe || []), 'huaraches'])); g.addStat('corazon', 2); g.ui.toast('🩴 Cosiste tus propios huaraches. Te quedan un poco chuecos. Son tuyos.', 'soul'); g.quests.onEvent?.('huarache_cosido'); }
    g.clock.minutes += 90; return true;
  });
}

// ---- the trompo challenge -----------------------------------------------------------------------------------
// Hold to wind the cord tight, let go when the bar is in the green, then catch it on your palm at the
// right moment. The kid does the same; best spin wins.
export function trompoChallenge(g, kid) {
  const name = kid?.def?.name || kid?.name || 'el niño';
  return modal(g, '🪀 ¡Trompo!', `${name} te reta: a ver quién lo baila más tiempo… y quién lo levanta en la palma.`, (body, finish) => {
    body.innerHTML = `<canvas width="520" height="200" class="trompo-cv"></canvas><p class="lesson-status">Mantén presionado para enredar el cordón; suelta en la zona verde.</p><div class="mg-actions"><button class="btn" data-k="go">Enredar / soltar</button></div>`;
    const cv = body.querySelector('canvas'), ctx = cv.getContext('2d'), st = body.querySelector('.lesson-status'), btn = body.querySelector('[data-k="go"]');
    let phase = 'wind', power = 0, dirUp = 1, spin = 0, t0 = 0, mine = 0, raf = 0, catchAt = 0;
    const rival = 6 + Math.random() * 5;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(0, 0, 520, 200);
      ctx.fillStyle = '#cdbfa6'; ctx.fillRect(0, 150, 520, 50);
      if (phase === 'winding') { power += dirUp * 0.018; if (power > 1 || power < 0) dirUp *= -1; power = clamp(power, 0, 1); }
      // power bar
      ctx.fillStyle = '#5a331d'; ctx.fillRect(20, 20, 200, 16); ctx.fillStyle = '#7fd08a'; ctx.fillRect(20 + 200 * 0.68, 20, 200 * 0.2, 16);
      ctx.fillStyle = '#c2413c'; ctx.fillRect(20 + 200 * power - 2, 16, 4, 24);
      if (phase === 'spinning' || phase === 'catch') {
        const t = (now - t0) / 1000, wob = Math.max(0, t - spin * 0.75) * 0.25;
        ctx.save(); ctx.translate(260, 150); ctx.rotate(Math.sin(t * 20) * wob);
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(-18, -34); ctx.lineTo(18, -34); ctx.lineTo(0, 0); ctx.fill();
        ctx.fillStyle = Math.floor(t * 30) % 2 ? '#f2c230' : '#2f5d9a'; ctx.fillRect(-18, -38, 36, 6); ctx.restore();
        if (phase === 'spinning' && t > spin * 0.6) { phase = 'catch'; catchAt = now; st.textContent = '¡Ahora! Levántalo en la palma: toca el botón.'; btn.textContent = '¡Levantarlo!'; }
        if (phase === 'catch' && (now - catchAt) / 1000 > 1.2) end(false, (now - t0) / 1000);
      }
      ctx.fillStyle = '#3a2418'; ctx.font = '600 15px system-ui'; ctx.fillText(`${name}: ${rival.toFixed(1)} s`, 330, 32);
      if (mine) ctx.fillText(`Tú: ${mine.toFixed(1)} s`, 330, 54);
    };
    const end = (caught, secs) => {
      cancelAnimationFrame(raf); phase = 'end';
      mine = secs + (caught ? 3 : 0);
      const win = mine > rival;
      st.textContent = caught ? `¡Lo levantaste en la palma y siguió bailando! ${mine.toFixed(1)} s contra ${rival.toFixed(1)}. ${win ? 'Ganaste.' : 'Casi.'}` : `Se cayó de lado: ${mine.toFixed(1)} s contra ${rival.toFixed(1)}. ${win ? 'Ganaste de todos modos.' : `${name} se ríe: “¡Tráelo mañana!”`}`;
      btn.textContent = 'Listo'; btn.onclick = () => finish({ win, caught });
      loop(performance.now()); cancelAnimationFrame(raf);
    };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); if (phase === 'wind') { phase = 'winding'; st.textContent = 'Suelta en la zona verde…'; } else if (phase === 'catch') end(true, (performance.now() - t0) / 1000); });
    btn.addEventListener('pointerup', () => {
      if (phase !== 'winding') return;
      const good = power >= 0.68 && power <= 0.88;
      spin = good ? 7 + Math.random() * 3 : 2 + power * 4;
      phase = 'spinning'; t0 = performance.now(); st.textContent = good ? '¡Zumba! Bailó de uñita.' : 'Salió chueco, pero baila…';
      btn.textContent = '…';
    });
    raf = requestAnimationFrame(loop);
  }).then(r => {
    if (!r) return;
    if (r.win) { g.addStat('fama', 1); g.state.trompoWins = (g.state.trompoWins || 0) + 1; g.ui.toast(r.caught ? '🪀 ¡De uñita y a la palma! Los niños te miran con respeto.' : '🪀 Le ganaste al trompo de la plaza.', 'good'); }
    else g.ui.toast('🪀 Perdiste. El niño te enseña cómo se enreda bien el cordón.', '');
    g.addStat('corazon', 1);
  });
}
