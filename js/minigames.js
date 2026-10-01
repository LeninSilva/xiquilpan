// Little games you can play in town: Lotería in the plaza and a shift at the Tortillería Marín.
// They run in a DOM overlay and resolve with a result object.

const CARDS = [
  ['El Gallo', '🐓', 'El que le cantó a San Pedro, no le volverá a cantar'], ['El Diablito', '😈', 'Pórtate bien, cuatito, si no te lleva el coloradito'],
  ['La Dama', '💃', 'Puliendo el paso, por toda la calle real'], ['El Catrín', '🎩', 'Don Ferruco en la alameda, su bastón quería tirar'],
  ['El Paraguas', '☂️', 'Para el sol y para el agua'], ['La Sirena', '🧜', 'Con los cantos de sirena, no te vayas a marear'],
  ['La Escalera', '🪜', 'Súbeme paso a pasito, no quieras pegar brinquitos'], ['La Botella', '🍾', 'La herramienta del borracho'],
  ['El Barril', '🛢️', 'Tanto bebió el albañil, que quedó como barril'], ['El Árbol', '🌳', 'El que a buen árbol se arrima, buena sombra le cobija'],
  ['El Melón', '🍈', 'Me lo das o me lo quitas'], ['El Valiente', '🗡️', 'Por qué le corres, cobarde, trayendo tan buen puñal'],
  ['El Gorrito', '👒', 'Ponle su gorrito al nene, no se nos vaya a resfriar'], ['La Muerte', '💀', 'La muerte tilica y flaca'],
  ['La Pera', '🍐', 'El que espera, desespera'], ['La Bandera', '🇲🇽', 'Verde, blanco y colorado, la bandera del soldado'],
  ['El Bandolón', '🎸', 'Tocando su bandolón, está el mariachi Simón'], ['El Violoncello', '🎻', 'Creciendo se fue hasta el cielo, y como no fue violín, tuvo que ser violoncello'],
  ['La Garza', '🦩', 'Al otro lado del río tengo mi banco de arena'], ['El Pájaro', '🐦', 'Tú me traes a puros brincos, como pájaro en la rama'],
  ['La Mano', '✋', 'La mano de un criminal'], ['La Bota', '🥾', 'Una bota igual que la otra'], ['La Luna', '🌙', 'El farol de los enamorados'],
  ['El Cotorro', '🦜', 'Cotorro, cotorro, saca la pata, y empiézame a platicar'], ['El Borracho', '🥴', '¡Qué borracho tan necio, ya no lo puedo aguantar!'],
  ['El Negrito', '🧑🏿', 'El que se comió el azúcar'], ['El Corazón', '❤️', 'No me extrañes, corazón, que regreso en el camión'],
  ['La Sandía', '🍉', 'La barriga que Juan tenía, era empacho de sandía'], ['El Tambor', '🥁', 'No te arrugues, cuero viejo, que te quiero pa\' tambor'],
  ['El Camarón', '🦐', 'Camarón que se duerme, se lo lleva la corriente'], ['Las Jaras', '🏹', 'Las jaras del indio Adán, donde pegan dan'],
  ['El Músico', '🎺', 'El músico trompas de hule, ya no me quiere tocar'], ['La Araña', '🕷️', 'Atarántamela a palos, no me la dejes llegar'],
  ['El Soldado', '💂', 'Uno, dos y tres, el soldado p\'al cuartel'], ['La Estrella', '⭐', 'La guía de los marineros'], ['El Cazo', '🫕', 'El caso que te hago es poco'],
  ['El Mundo', '🌎', 'Este mundo es una bola, y nosotros un bolón'], ['El Apache', '🪶', '¡Ah, Chihuahua! Cuánto apache con pantalón y huarache'],
  ['El Nopal', '🌵', 'Al nopal lo van a ver, nomás cuando tiene tunas'], ['El Alacrán', '🦂', 'El que con la cola pica, le dan una paliza'],
  ['La Rosa', '🌹', 'Rosita, Rosaura, ven que te quiero ahora'], ['La Calavera', '☠️', 'Al pasar por el panteón, me encontré un calaverón'],
  ['La Campana', '🔔', 'Tú con la campana y yo con tu hermana'], ['El Cantarito', '🏺', 'Tanto va el cántaro al agua, que se quiebra y te moja las enaguas'],
  ['El Venado', '🦌', 'Saltando va buscando, pero no ve nada'], ['El Sol', '☀️', 'La cobija de los pobres'], ['La Corona', '👑', 'El sombrero de los reyes'],
  ['La Chalupa', '🛶', 'Rema que rema Lupita, sentada en su chalupita'], ['El Pino', '🌲', 'Fresco y oloroso, en todo tiempo hermoso'],
  ['El Pescado', '🐟', 'El que por la boca muere, aunque mudo fuera'], ['La Palma', '🌴', 'Palmero, sube a la palma y bájame un coco real'],
  ['La Maceta', '🪴', 'El que nace pa\' maceta, no sale del corredor'], ['El Arpa', '🪕', 'Arpa vieja de mi suegra, ya no sirves pa\' tocar'],
  ['La Rana', '🐸', 'Al ver a la verde rana, qué susto se llevó tu hermana'],
];

function overlay(title, sub) {
  const el = document.createElement('div'); el.className = 'mg';
  el.innerHTML = `<div class="mg-card"><div class="mg-head"><div><div class="mg-title">${title}</div><div class="mg-sub">${sub}</div></div><button class="round mg-x" aria-label="Salir">✕</button></div><div class="mg-body"></div></div>`;
  document.body.appendChild(el);
  return { el, body: el.querySelector('.mg-body'), close: el.querySelector('.mg-x') };
}
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Lotería: tap the cards on your tabla as the gritón sings them. Line, column, diagonal or the four corners wins.
export function playLoteria(game, { bet = 10, rivals = ['Doña Lety', 'Don Chema', 'Karla'] } = {}) {
  return new Promise(resolve => {
    const { el, body, close } = overlay('¡Lotería!', `Mesa de Doña Lety en la plaza · Apuesta $${bet} · Gana quien llene una línea, una columna, una diagonal o las cuatro esquinas`);
    const deck = shuffle(CARDS.map((c, i) => i));
    const tabla = shuffle(CARDS.map((c, i) => i)).slice(0, 16);
    const rivalTablas = rivals.map(() => new Set(shuffle(CARDS.map((c, i) => i)).slice(0, 16)));
    const rivalHits = rivals.map(() => new Set());
    const marked = new Set(), called = new Set();
    body.innerHTML = `<div class="lot-call"><div class="lot-card" id="lotCard"><span class="emo">🎴</span><b>¿Listos?</b></div><div class="lot-verse" id="lotVerse">El gritón baraja las cartas…</div></div>
      <div class="lot-grid" id="lotGrid"></div><div class="lot-rivals" id="lotRivals"></div><div class="mg-actions"><button class="btn" id="lotBtn">¡Lotería!</button></div>`;
    const grid = body.querySelector('#lotGrid');
    tabla.forEach((ci, k) => {
      const [name, emo] = CARDS[ci];
      const b = document.createElement('button'); b.className = 'lot-cell'; b.innerHTML = `<span class="emo">${emo}</span><small>${name}</small>`;
      b.addEventListener('click', () => { if (!called.has(ci)) { b.classList.add('nope'); setTimeout(() => b.classList.remove('nope'), 300); return; } marked.add(k); b.classList.add('on'); game.sfx('select'); });
      grid.appendChild(b);
    });
    const lines = [];
    for (let i = 0; i < 4; i++) { lines.push([0, 1, 2, 3].map(j => i * 4 + j)); lines.push([0, 1, 2, 3].map(j => j * 4 + i)); }
    lines.push([0, 5, 10, 15], [3, 6, 9, 12], [0, 3, 12, 15]);
    const win = (set) => lines.some(l => l.every(k => set.has(k)));
    const rivalsEl = body.querySelector('#lotRivals');
    const drawRivals = () => { rivalsEl.innerHTML = rivals.map((r, i) => `<span>${r}: ${rivalHits[i].size}/16</span>`).join(''); };
    drawRivals();
    let idx = 0, done = false, timer = null;
    const finish = (res) => { if (done) return; done = true; clearInterval(timer); setTimeout(() => { el.remove(); resolve(res); }, res.silent ? 0 : 1800); };
    const rivalLine = (i) => { const t = [...rivalTablas[i]]; const set = new Set(); t.forEach((ci, k) => { if (rivalHits[i].has(ci)) set.add(k); }); return win(set); };
    const next = () => {
      if (idx >= deck.length) return finish({ win: false, reason: 'Se acabó la baraja.' });
      const ci = deck[idx++]; called.add(ci);
      const [name, emo, verse] = CARDS[ci];
      body.querySelector('#lotCard').innerHTML = `<span class="emo">${emo}</span><b>${name}</b>`;
      body.querySelector('#lotVerse').textContent = `“${verse}…”`;
      game.sfx('blip');
      rivals.forEach((r, i) => { if (rivalTablas[i].has(ci) && Math.random() < 0.82) rivalHits[i].add(ci); });
      drawRivals();
      const w = rivals.findIndex((r, i) => rivalLine(i));
      if (w >= 0 && idx > 8) { body.querySelector('#lotVerse').textContent = `¡LOTERÍA! grita ${rivals[w]}. Te ganaron esta vez.`; finish({ win: false, winner: rivals[w] }); }
    };
    timer = setInterval(next, 2300); setTimeout(next, 700);
    body.querySelector('#lotBtn').addEventListener('click', () => {
      if (win(marked)) { body.querySelector('#lotVerse').textContent = '¡LOTERÍA! La mesa entera aplaude.'; game.sfx('clue'); finish({ win: true, prize: bet * (rivals.length + 1) }); }
      else { body.querySelector('#lotVerse').textContent = 'Todavía no llenas nada… ¡fíjate bien!'; }
    });
    close.addEventListener('click', () => finish({ win: false, quit: true, silent: true }));
  });
}

// Tortillas: flip each tortilla when it puffs (green) and take it off before it burns.
export function playTortillas(game, { seconds = 40 } = {}) {
  return new Promise(resolve => {
    const { el, body, close } = overlay('Turno en la Tortillería Marín', 'Voltea cada tortilla cuando se infle (verde) y sácala antes de que se queme. Te pagan $3 por tortilla buena.');
    body.innerHTML = `<div class="tor-top"><span id="torTime">${seconds}s</span><span id="torScore">Buenas: 0</span><span id="torBurn">Quemadas: 0</span></div><div class="comal" id="comal"></div>`;
    const comal = body.querySelector('#comal');
    const slots = [];
    for (let i = 0; i < 6; i++) {
      const b = document.createElement('button'); b.className = 'tor'; comal.appendChild(b);
      const s = { b, state: 'empty', t: 0, side: 0 }; slots.push(s);
      b.addEventListener('click', () => {
        if (s.state === 'raw') { s.b.classList.add('nope'); setTimeout(() => s.b.classList.remove('nope'), 250); return; }
        if (s.state === 'puffed') { if (s.side === 0) { s.side = 1; s.state = 'raw'; s.t = 0; s.cook = cook[1] * (0.6 + Math.random() * 0.9); game.sfx('select'); } else { good++; s.state = 'empty'; s.t = -0.6 - Math.random(); game.sfx('coin'); } }
        else if (s.state === 'burnt') { s.state = 'empty'; s.t = -0.5; }
        paint();
      });
    }
    let good = 0, burnt = 0, left = seconds, last = performance.now(), done = false;
    const cook = [2.2, 1.7], window1 = 1.6;
    function paint() {
      for (const s of slots) {
        s.b.className = 'tor ' + s.state + (s.side ? ' flipped' : '');
        s.b.textContent = s.state === 'empty' ? '' : s.state === 'raw' ? '' : s.state === 'puffed' ? '¡ya!' : '🔥';
      }
      body.querySelector('#torScore').textContent = `Buenas: ${good}`; body.querySelector('#torBurn').textContent = `Quemadas: ${burnt}`;
      body.querySelector('#torTime').textContent = `${Math.ceil(left)}s`;
    }
    function tick(now) {
      if (done) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now; left -= dt;
      for (const s of slots) {
        s.t += dt;
        if (s.state === 'empty' && s.t > 0 && Math.random() < dt * 0.7) { s.state = 'raw'; s.side = 0; s.t = 0; s.cook = cook[0] * (0.6 + Math.random() * 0.9); }
        else if (s.state === 'raw' && s.t > (s.cook || cook[s.side])) { s.state = 'puffed'; s.t = 0; }
        else if (s.state === 'puffed' && s.t > window1) { s.state = 'burnt'; s.t = 0; burnt++; }
      }
      paint();
      if (left <= 0) { done = true; const pay = good * 3; body.insertAdjacentHTML('beforeend', `<p class="mg-result">Turno terminado: ${good} buenas, ${burnt} quemadas. Te pagan $${pay}.</p>`); setTimeout(() => { el.remove(); resolve({ good, burnt, pay }); }, 1800); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    close.addEventListener('click', () => { if (done) return; done = true; el.remove(); resolve({ good, burnt, pay: good * 3, quit: true }); });
  });
}
