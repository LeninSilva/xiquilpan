// Music: the guitar class at the Casa de la Cultura (a fretboard you can play, and seven lessons on
// octaves, scales, chords, progressions and the modes, explained the way Profe Ismael explains them),
// and the organ of San Francisco (or the harmonium of the Sagrado Corazón). All melodies here are
// scales, chords and simple original progressions.

const TUNING = [64, 59, 55, 50, 45, 40]; // strings 1..6 (high E down to low E), MIDI
const NAMES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
const LETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const midiAt = (string, fret) => TUNING[string - 1] + fret;
const noteName = (m) => `${NAMES[m % 12]} (${LETTERS[m % 12]})`;

// chord shapes: frets for strings 6..1 (x = muted)
const CHORDS = {
  E: [0, 2, 2, 1, 0, 0], Em: [0, 2, 2, 0, 0, 0], A: ['x', 0, 2, 2, 2, 0], Am: ['x', 0, 2, 2, 1, 0],
  G: [3, 2, 0, 0, 0, 3], C: ['x', 3, 2, 0, 1, 0], D: ['x', 'x', 0, 2, 3, 2], F: ['x', 'x', 3, 2, 1, 1], Dm: ['x', 'x', 0, 2, 3, 1],
};
const CHORD_NAME = { E: 'Mi mayor (E)', Em: 'Mi menor (Em)', A: 'La mayor (A)', Am: 'La menor (Am)', G: 'Sol mayor (G)', C: 'Do mayor (C)', D: 'Re mayor (D)', F: 'Fa mayor (F)', Dm: 'Re menor (Dm)' };

export const LESSONS = [
  { title: 'Las cuerdas y la octava', text: [
    'La guitarra tiene seis cuerdas. Cada traste que pisas sube medio tono: la distancia más chiquita de nuestra música.',
    'Doce medios tonos hacen una octava: la misma nota, pero vibrando al doble de rápido. Por eso el traste 12 tiene dos puntitos: ahí la cuerda se parte justo a la mitad.',
    'Toca la sexta cuerda al aire, luego en el traste 12, luego la primera al aire: tres veces Mi, cada una más aguda. Escucha cómo se parecen.'],
    task: { kind: 'seq', notes: [[6, 0], [6, 12], [1, 0]] } },
  { title: 'La escala mayor', text: [
    'Una escala es una escalera de notas. La mayor se arma con esta receta de pasos: tono, tono, medio tono, tono, tono, tono, medio tono.',
    'Empezando en Do no necesita ninguna nota sostenida: Do, Re, Mi, Fa, Sol, La, Si, Do. Suena a domingo en la plaza, a mañanitas, a banda en el kiosco.',
    'Tócala desde la quinta cuerda, traste 3, siguiendo los puntos.'],
    task: { kind: 'seq', notes: [[5, 3], [5, 5], [4, 2], [4, 3], [4, 5], [3, 2], [3, 4], [3, 5]] } },
  { title: 'La escala menor', text: [
    'La menor natural tiene otra receta: tono, medio tono, tono, tono, medio tono, tono, tono.',
    'La menor usa exactamente las mismas notas que Do mayor, pero su casa es La. Por eso se les dice "relativas": son primas, viven en la misma calle, pero cada una tiene su puerta.',
    'Suena a la plaza cuando ya se fue la gente. Tócala desde la sexta cuerda, traste 5.'],
    task: { kind: 'seq', notes: [[6, 5], [6, 7], [6, 8], [5, 5], [5, 7], [5, 8], [4, 5], [4, 7]] } },
  { title: 'La pentatónica', text: [
    'Quítale dos notas a la escala menor (las que forman medios tonos) y te quedan cinco: penta-tónica. Sin medios tonos, ninguna nota choca con otra.',
    'Por eso está en todas partes: en el blues, en el rock, en los sones, en las canciones de cuna de medio mundo. Es la escala de "no hay manera de equivocarse".',
    'Esta es la "caja" de La menor pentatónica, en el traste 5. Recórrela de grave a agudo.'],
    task: { kind: 'seq', notes: [[6, 5], [6, 8], [5, 5], [5, 7], [4, 5], [4, 7], [3, 5], [3, 7], [2, 5], [2, 8], [1, 5], [1, 8]] } },
  { title: 'Acordes: mayor y menor', text: [
    'Un acorde son tres notas que suenan juntas: la fundamental, la tercera y la quinta de su escala.',
    'La diferencia entre mayor y menor es una sola nota, la tercera: en el mayor está a cuatro medios tonos de la fundamental; en el menor, a tres. Un dedo, medio traste, y la canción cambia de ánimo.',
    'Rasguea Mi mayor y Mi menor, luego La mayor y La menor. Fíjate en el dedo que se mueve.'],
    task: { kind: 'chords', chords: ['E', 'Em', 'A', 'Am'] } },
  { title: 'Progresiones', text: [
    'Los acordes se ordenan en progresiones. La más vieja del mundo es I–IV–V: en Sol, Sol–Do–Re. Tres acordes y la verdad: con eso se ha cantado medio México.',
    'Otra, la del "círculo": I–vi–IV–V, en Do: Do–La menor–Fa–Sol. Cientos de baladas caben ahí.',
    'Francisco Salazar, el del cerro, aprendió así: de oído, en el piano de su tía, buscando primero el bajo de cada canción del radio y luego las notas que sonaban bonito encima. Tócalas en orden.'],
    task: { kind: 'chords', chords: ['G', 'C', 'D', 'G', 'C', 'Am', 'F', 'G'], progression: true } },
  { title: 'Los modos', text: [
    'Si tocas las notas de Do mayor pero empiezas en otra nota, cambia el color: eso es un modo. Hay siete, uno por cada grado.',
    'Jónico (desde Do) es la mayor de siempre. Dórico (desde Re) es menor pero con una sexta luminosa: suena a son, a jazz. Frigio (desde Mi) es oscuro, flamenco. Lidio (desde Fa) tiene una cuarta aumentada: suena a sueño. Mixolidio (desde Sol) es mayor con séptima menor: rock y mariachi. Eólico (desde La) es la menor natural. Locrio (desde Si) nunca descansa.',
    'Escucha Re dórico y Re eólico: sólo cambia una nota (Si o Si bemol). Luego contesta.'],
    task: { kind: 'quiz', demo: [[62, 64, 65, 67, 69, 71, 72, 74], [62, 64, 65, 67, 69, 70, 72, 74]], demoNames: ['Re dórico', 'Re eólico'],
      q: [['¿Qué modo empieza en el segundo grado de la escala mayor?', ['Dórico', 'Frigio', 'Lidio'], 0],
        ['De los dos que escuchaste, ¿cuál tiene la sexta "luminosa" (Si natural)?', ['El primero', 'El segundo'], 0],
        ['¿Cuál es igual a la escala menor natural?', ['Mixolidio', 'Eólico', 'Jónico'], 1]] } },
];

function overlay(title, sub, wide) {
  const el = document.createElement('div'); el.className = 'mg';
  el.innerHTML = `<div class="mg-card ${wide ? 'wide' : ''}"><div class="mg-head"><div><div class="mg-title">${title}</div><div class="mg-sub">${sub}</div></div><button class="round mg-x" aria-label="Salir">✕</button></div><div class="mg-body"></div></div>`;
  document.body.appendChild(el);
  return { el, body: el.querySelector('.mg-body'), close: el.querySelector('.mg-x') };
}

// ---- the fretboard ----------------------------------------------------------------------------------
function fretboard(g, onPlay) {
  const cv = document.createElement('canvas'); cv.className = 'fretboard'; cv.width = 1300; cv.height = 300;
  const ctx = cv.getContext('2d');
  const FR = 13, X0 = 70, X1 = 1280, Y0 = 34, Y1 = 266;
  const fx = (f) => f === 0 ? X0 - 34 : X0 + (X1 - X0) * (1 - Math.pow(2, -f / 12)) / (1 - Math.pow(2, -12 / 12)) * 0.98;
  const sy = (s) => Y0 + (s - 1) * (Y1 - Y0) / 5;
  let marks = new Map(), hits = new Set();
  const draw = () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const wood = ctx.createLinearGradient(0, Y0 - 20, 0, Y1 + 20); wood.addColorStop(0, '#4a2a18'); wood.addColorStop(0.5, '#5e3820'); wood.addColorStop(1, '#3a2012');
    ctx.fillStyle = wood; ctx.fillRect(X0, Y0 - 20, X1 - X0, Y1 - Y0 + 40);
    ctx.fillStyle = '#efe6d0'; ctx.fillRect(X0 - 6, Y0 - 20, 7, Y1 - Y0 + 40); // the nut
    for (let f = 1; f < FR; f++) { const x = fx(f); ctx.fillStyle = '#c9ccd1'; ctx.fillRect(x - 1.5, Y0 - 20, 3, Y1 - Y0 + 40); }
    ctx.fillStyle = '#e8dcc0'; for (const f of [3, 5, 7, 9]) { ctx.beginPath(); ctx.arc((fx(f - 1) + fx(f)) / 2, (Y0 + Y1) / 2, 7, 0, 7); ctx.fill(); }
    for (const yy of [(Y0 + Y1) / 2 - 46, (Y0 + Y1) / 2 + 46]) { ctx.beginPath(); ctx.arc((fx(11) + fx(12)) / 2, yy, 7, 0, 7); ctx.fill(); }
    for (let s = 1; s <= 6; s++) { ctx.strokeStyle = s > 3 ? '#d9b06a' : '#e8eaec'; ctx.lineWidth = 1 + (s - 1) * 0.5; ctx.beginPath(); ctx.moveTo(X0 - 40, sy(s)); ctx.lineTo(X1, sy(s)); ctx.stroke(); }
    ctx.fillStyle = '#c9a77a'; ctx.font = '600 15px system-ui'; ctx.textAlign = 'center';
    for (let f = 1; f < FR; f++) ctx.fillText(f, (fx(f - 1) + fx(f)) / 2, Y1 + 32);
    for (const [k, m] of marks) {
      const [s, f] = k.split(',').map(Number), x = f === 0 ? X0 - 22 : (fx(f - 1) + fx(f)) / 2, y = sy(s);
      ctx.fillStyle = hits.has(k) ? '#2e7d32' : m.next ? '#e8b04b' : 'rgba(232,176,75,0.45)';
      ctx.beginPath(); ctx.arc(x, y, 15, 0, 7); ctx.fill();
      ctx.fillStyle = '#1b1b1b'; ctx.font = 'bold 13px system-ui'; ctx.fillText(m.label ?? '', x, y + 5);
    }
  };
  const pos = (ev) => {
    const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * cv.width / r.width, y = (ev.clientY - r.top) * cv.height / r.height;
    let s = Math.round((y - Y0) / ((Y1 - Y0) / 5)) + 1; s = Math.max(1, Math.min(6, s));
    let f = 0; if (x >= X0) { f = FR - 1; for (let k = 1; k < FR; k++) if (x < fx(k)) { f = k; break; } }
    return [s, f];
  };
  cv.addEventListener('pointerdown', (ev) => { ev.preventDefault(); const [s, f] = pos(ev); const m = midiAt(s, f); g.audio.pluck(hz(m)); onPlay(s, f, m); });
  draw();
  return { cv, draw, set(m) { marks = m; hits = new Set(); draw(); }, hit(k) { hits.add(k); draw(); } };
}
function strum(g, name, when = 0) {
  const shape = CHORDS[name]; let k = 0;
  shape.forEach((f, i) => { if (f === 'x') return; g.audio.pluck(hz(TUNING[5 - i] + f), when + k * 0.035, 0.16); k++; });
}
function chordDiagram(name) {
  const shape = CHORDS[name];
  let svg = `<svg viewBox="0 0 70 86" class="chord"><text x="35" y="10" text-anchor="middle" font-size="9" font-weight="700">${name}</text>`;
  for (let i = 0; i < 6; i++) svg += `<line x1="${10 + i * 10}" y1="18" x2="${10 + i * 10}" y2="78" stroke="#3a2418" stroke-width="${1.6 - i * 0.15}"/>`;
  for (let j = 0; j <= 4; j++) svg += `<line x1="10" y1="${18 + j * 15}" x2="60" y2="${18 + j * 15}" stroke="#3a2418" stroke-width="${j ? 1 : 3}"/>`;
  shape.forEach((f, i) => { const x = 10 + i * 10; if (f === 'x') svg += `<text x="${x}" y="15" text-anchor="middle" font-size="8">×</text>`; else if (f === 0) svg += `<circle cx="${x}" cy="12.5" r="2.6" fill="none" stroke="#3a2418"/>`; else svg += `<circle cx="${x}" cy="${18 + (f - 0.5) * 15}" r="4.4" fill="#c2413c"/>`; });
  return svg + '</svg>';
}

// One lesson in the guitar class. Resolves true when completed.
export function guitarClass(g) {
  const prof = g.npcs.named.get('ismael');
  const here = prof && prof.map === g.map;
  const n = g.state.guitar || 0;
  return g.dialog.scene(async d => {
    if (!here) { await d.narrate('La clase de guitarra es de lunes a viernes, de 4 a 8 de la tarde, con el Profe Ismael. Las guitarras esperan colgadas en la pared.'); return; }
    if (n >= LESSONS.length) { await d.say(prof, 'Ya sabes lo que yo sé, lo demás es tocar y tocar. Ve al cerro con Francisco Salazar: él te enseña lo que no viene en ningún libro.'); if (!g.flags.guitar_free) { const c = await d.choose([{ text: 'Tocar un rato, libre', value: 1 }, { text: 'Gracias, profe', value: 0 }]); if (c.value) { d.end(); await freePlay(g); } } return; }
    if (g.state.guitarDay === g.clock.dayIndex) { await d.say(prof, 'Una lección por día, joven. La mano aprende dormida: mañana te va a salir solo lo de hoy.'); return; }
    await d.say(prof, n === 0 ? '¡Bienvenido! La clase cuesta veinte pesos, para las cuerdas. Agarra esa guitarra; no muerde. Bueno, a veces.' : `Lección ${n + 1}: ${LESSONS[n].title}. Son veinte pesos.`);
    if (g.state.money < 20) { await d.say(prof, 'Si no traes, pagas la próxima. Aquí nadie se queda sin aprender por veinte pesos.'); }
    else g.addMoney(-20);
    d.end();
    const ok = await runLesson(g, n);
    if (ok) {
      g.state.guitar = n + 1; g.state.guitarDay = g.clock.dayIndex; g.clock.minutes += 60;
      g.addStat('corazon', 1); g.state.saber = (g.state.saber || 0) + 1;
      g.ui.toast(`🎸 Lección ${n + 1} de ${LESSONS.length}: ${LESSONS[n].title}`, 'good');
      if (n + 1 === LESSONS.length) { g.ui.toast('🎸 Terminaste el curso de guitarra. Ya puedes acompañar a quien cante.', 'soul'); g.flags.guitarra = true; }
      g.save();
    }
  });
}
function runLesson(g, i) {
  const L = LESSONS[i];
  return new Promise(resolve => {
    const o = overlay(`🎸 ${L.title}`, `Clase de guitarra · Lección ${i + 1} de ${LESSONS.length} · Profe Ismael`, true);
    o.body.innerHTML = `<div class="lesson-text">${L.text.map(p => `<p>${p}</p>`).join('')}</div><div class="lesson-task"></div><p class="lesson-status"></p><div class="mg-actions"><button class="btn" data-k="done" disabled>Terminar lección</button></div>`;
    const task = o.body.querySelector('.lesson-task'), status = o.body.querySelector('.lesson-status'), doneBtn = o.body.querySelector('[data-k="done"]');
    let finished = false;
    const finish = (ok) => { if (finished) return; finished = true; o.el.remove(); window.removeEventListener('keydown', key, true); g.input.enabled = true; resolve(ok); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); finish(false); } };
    window.addEventListener('keydown', key, true);
    o.close.onclick = () => finish(false);
    doneBtn.onclick = () => finish(true);
    const complete = (msg) => { status.textContent = msg; doneBtn.disabled = false; g.sfx('quest'); };
    g.input.enabled = false; g.ui.prompt(null);
    const t = L.task;
    if (t.kind === 'seq') {
      const fb = fretboard(g, (s, f) => {
        const want = t.notes[idx];
        if (want && want[0] === s && want[1] === f) { fb.hit(`${s},${f}`); idx++; mark(); if (idx >= t.notes.length) complete('¡Eso! Así suena. ' + (i === 0 ? 'Tres Mis, tres alturas.' : 'Otra vez, más rápido, y ya es música.')); }
        else status.textContent = `Esa es ${noteName(midiAt(s, f))}. Busca el punto amarillo.`;
      });
      let idx = 0;
      const mark = () => { const m = new Map(); t.notes.forEach(([s, f], k) => m.set(`${s},${f}`, { label: NAMES[midiAt(s, f) % 12], next: k === idx })); fb.set(m); for (let k = 0; k < idx; k++) fb.hit(`${t.notes[k][0]},${t.notes[k][1]}`); status.textContent = idx < t.notes.length ? `Siguiente: ${noteName(midiAt(...t.notes[idx]))} — cuerda ${t.notes[idx][0]}, traste ${t.notes[idx][1]}` : ''; };
      task.appendChild(fb.cv); mark();
      const play = document.createElement('button'); play.className = 'btn alt'; play.textContent = '▶ Escuchar cómo suena';
      play.onclick = () => t.notes.forEach(([s, f], k) => g.audio.pluck(hz(midiAt(s, f)), k * 0.32));
      task.appendChild(play);
    } else if (t.kind === 'chords') {
      let idx = 0;
      task.innerHTML = `<div class="chord-row">${t.chords.map((c, k) => `<button class="chord-btn" data-i="${k}">${chordDiagram(c)}<small>${CHORD_NAME[c]}</small></button>`).join('')}</div>`;
      const btns = [...task.querySelectorAll('.chord-btn')];
      const upd = () => { btns.forEach((b, k) => { b.classList.toggle('next', k === idx); b.classList.toggle('done', k < idx); }); status.textContent = idx < t.chords.length ? `Rasguea: ${CHORD_NAME[t.chords[idx]]}${t.progression ? ` (${idx < 4 ? 'I–IV–V–I en Sol' : 'I–vi–IV–V en Do'})` : ''}` : ''; };
      btns.forEach((b, k) => b.onclick = () => { strum(g, t.chords[k]); if (k === idx) { idx++; upd(); if (idx >= t.chords.length) complete(t.progression ? '¿Oíste cómo cada acorde “jala” al siguiente? Eso es una progresión.' : 'Un solo dedo, y del sol a la sombra. Eso es la tercera.'); } });
      upd();
    } else if (t.kind === 'quiz') {
      let right = 0, qi = 0;
      task.innerHTML = `<div class="mg-actions" style="gap:10px">${t.demo.map((d, k) => `<button class="btn alt" data-demo="${k}">▶ ${t.demoNames[k]}</button>`).join('')}</div><div class="quiz"></div>`;
      task.querySelectorAll('[data-demo]').forEach(b => b.onclick = () => t.demo[+b.dataset.demo].forEach((m, k) => g.audio.pluck(hz(m), k * 0.3)));
      const qz = task.querySelector('.quiz');
      const ask = () => {
        if (qi >= t.q.length) { if (right >= 2) complete(`Contestaste bien ${right} de ${t.q.length}. Los modos son colores: ahora ya los ves.`); else { status.textContent = `Bien ${right} de ${t.q.length}. Escucha otra vez y vuelve a intentar.`; qi = 0; right = 0; setTimeout(ask, 1200); } return; }
        const [q, opts] = t.q[qi];
        qz.innerHTML = `<p><b>${q}</b></p><div class="quiz-opts">${opts.map((op, k) => `<button class="btn alt" data-a="${k}">${op}</button>`).join('')}</div>`;
        qz.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { if (+b.dataset.a === t.q[qi][2]) right++; qi++; ask(); });
      };
      ask();
    }
  });
}
// After the course: just play.
function freePlay(g) {
  return new Promise(resolve => {
    const o = overlay('🎸 Tocar libre', 'Toca lo que quieras. Los acordes, abajo.', true);
    const fb = fretboard(g, () => {}); o.body.appendChild(fb.cv);
    const row = document.createElement('div'); row.className = 'chord-row';
    row.innerHTML = Object.keys(CHORDS).map(c => `<button class="chord-btn" data-c="${c}">${chordDiagram(c)}</button>`).join('');
    row.querySelectorAll('[data-c]').forEach(b => b.onclick = () => strum(g, b.dataset.c));
    o.body.appendChild(row);
    const close = () => { o.el.remove(); window.removeEventListener('keydown', key, true); g.input.enabled = true; resolve(); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    window.addEventListener('keydown', key, true); o.close.onclick = close; g.input.enabled = false;
  });
}

// ---- the organ -------------------------------------------------------------------------------------
// An original four-part chorale in Do: I–IV–V–I, vi–ii–V–I.
const CHORALE = [[48, 64, 67, 72], [53, 65, 69, 72], [55, 62, 67, 71], [48, 64, 67, 72], [57, 64, 69, 72], [50, 65, 69, 74], [55, 62, 67, 71], [48, 60, 64, 72]];
export function listenOrgan(g, grand = true) {
  return new Promise(res => {
    CHORALE.forEach((ch, k) => ch.forEach(m => g.audio.organ(hz(m), k * 1.1, 1.0, grand ? 0.045 : 0.05, !grand)));
    setTimeout(res, 300);
  });
}
export function playOrgan(g) {
  return new Promise(resolve => {
    const o = overlay('⛪ El órgano de San Francisco', 'Dos teclados, los registros jalados y el aire que entra por los fuelles. Toca las teclas, o deja que suene el coral.');
    const keys = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72];
    o.body.innerHTML = `<div class="organ-keys">${keys.map(m => `<button class="okey ${[1, 3, 6, 8, 10].includes(m % 12) ? 'black' : ''}" data-m="${m}"><small>${NAMES[m % 12]}</small></button>`).join('')}</div>
      <div class="mg-actions" style="gap:10px"><button class="btn alt" data-k="coral">▶ Tocar un coral</button><button class="btn alt" data-k="pleno">Registro: ${'principal'}</button></div><p class="lesson-status">Cada tecla es un tubo; los graves, los tubos más grandes de la fachada.</p>`;
    let reed = false;
    o.body.querySelectorAll('[data-m]').forEach(b => b.onpointerdown = (e) => { e.preventDefault(); const m = +b.dataset.m; g.audio.organ(hz(m), 0, 0.6, 0.06, reed); g.audio.organ(hz(m - 12), 0, 0.6, 0.03, reed); });
    o.body.querySelector('[data-k="coral"]').onclick = () => listenOrgan(g, !reed);
    o.body.querySelector('[data-k="pleno"]').onclick = (e) => { reed = !reed; e.target.textContent = 'Registro: ' + (reed ? 'trompeta' : 'principal'); };
    const close = () => { o.el.remove(); window.removeEventListener('keydown', key, true); g.input.enabled = true; if (!g.flags.played_organ) { g.flags.played_organ = true; g.addStat('fama', 1); g.ui.toast('Las señoras de la última banca voltearon a verte. Una sonrió.', 'good'); } resolve(); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    window.addEventListener('keydown', key, true); o.close.onclick = close; g.input.enabled = false; g.ui.prompt(null);
  });
}
