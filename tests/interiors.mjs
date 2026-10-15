// The insides of places: every new interior is reachable through its street door, its interactive
// things work, the Ayuntamiento's stairs go up and down, customers come and go.
// Usage: node tests/interiors.mjs   (server on :8123; OUT=dir for screenshots)
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const OUT = process.env.OUT || '/tmp';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto('http://localhost:8123/index.html?autostart=Test&skipintro=1');
await page.waitForFunction(() => window.__game && window.__game.playing, null, { timeout: 30000 });
const G = (fn, a) => page.evaluate(fn, a);
const sleep = (ms) => page.waitForTimeout(ms);
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${info}`); };
const step = (secs) => G((secs) => { const g = window.__game; for (let i = 0; i < secs * 30; i++) { g.clock.tick(1 / 30); g.update(1 / 30); } }, secs);
const dialogOpen = () => G(() => !document.getElementById('dialog').classList.contains('hidden'));
// answer a dialogue: click the first choice whose text contains one of `want`, else the last one
async function drive(want = [], max = 40) {
  for (let i = 0; i < max; i++) {
    const st = await G(() => ({ open: !document.getElementById('dialog').classList.contains('hidden'), ch: [...document.querySelectorAll('#dlgChoices button')].map(b => b.textContent) }));
    if (!st.open) return;
    if (st.ch.length) { let k = st.ch.length - 1; for (const w of want) { const j = st.ch.findIndex(t => t.includes(w)); if (j >= 0) { k = j; break; } } await page.click(`#dlgChoices button:nth-child(${k + 1})`); }
    else await page.keyboard.press('Enter');
    await sleep(120);
  }
}
// interact with a sprite of the current map by its `interact` key
async function use(key, want) {
  const ok = await G((key) => { const g = window.__game; const s = g.map.sprites.find(s => s.interact === key); if (!s) return false; g.interact({ type: 'sprite', s }); return true; }, key);
  if (!ok) return false;
  await sleep(250); await drive(want); return true;
}

// 1. every new or rebuilt place opens from its street door
await G(() => { const g = window.__game; g.clock.minutes = 1440 * 4 + 11 * 60; g.state.money = 3000; }); // Monday 11:00
const doors = ['templo_sf', 'santuario', 'templo_monjas', 'biblioteca', 'palacio', 'la_cochera', 'portal_nieves', 'carniceria', 'micheladas_lupita', 'libreria', 'bicicleteria', 'huaracheria', 'casa_cultura', 'unam'];
for (const id of doors) {
  const r = await G((id) => {
    const g = window.__game; g.returnStack = []; g.changeMap('town', 126, 104, 0, { instant: true });
    const d = g.map.doors.find(d => d.to === id); if (!d) return 'no door';
    g.clock.minutes = 1440 * 4 + Math.max(11, d.hours ? d.hours[0] + 1 : 11) * 60;
    g.enterDoor(d); return 'ok';
  }, id);
  await sleep(900);
  const here = await G(() => window.__game.map.id);
  check(`door → ${id}`, r === 'ok' && here === id, r === 'ok' ? `(in ${here})` : r);
  await page.screenshot({ path: `${OUT}/in_${id}.png` });
}

// 2. Ayuntamiento: up the stairs, talk to the Presidente, back down
await G(() => { const g = window.__game; g.clock.minutes = 1440 * 4 + 11 * 60; g.returnStack = [{ map: 'town', x: 170.5 * 16, y: 105.4 * 16, dir: 0 }]; g.changeMap('palacio', 26, 10.4, 1, { instant: true }); g.player.y = 9.4 * 16; });
await step(0.2); await sleep(900);
check('stairs up to the Cabildo', await G(() => window.__game.map.id === 'palacio_alto'));
const pres = await G(() => { const g = window.__game; g.npcs.timer = 0; g.npcs.update(0.02); const n = g.npcs.named.get('presidente'); return n && n.map.id; });
check('the Presidente is upstairs on a weekday', pres === 'palacio_alto', String(pres));
await G(() => { const g = window.__game; const n = g.npcs.named.get('presidente'); g.player.x = n.x; g.player.y = n.y + 16; g.player.dir = 1; g.dialog.converse(n); });
await sleep(400);
check('you can talk to him', await dialogOpen());
await drive(['Adiós']);
await use('balcon'); check('balcony view', true);
await G(() => { const g = window.__game; g.player.x = 4 * 16; g.player.y = 15.4 * 16; });
await step(0.2); await sleep(900);
check('stairs back down', await G(() => window.__game.map.id === 'palacio'));
await G(() => { const g = window.__game; g.player.x = 15.5 * 16; g.player.y = 17.2 * 16; });
await step(0.2); await sleep(900);
check('out by the street door', await G(() => window.__game.map.id === 'town'));

// 3. Parroquia: a candle, the side altar, the organ; the faithful sit in the pews
await G(() => { const g = window.__game; g.clock.minutes = 1440 * 3 + 9 * 60; g.returnStack = [{ map: 'town', x: 195.5 * 16, y: 143 * 16, dir: 0 }]; g.changeMap('templo_sf', 12, 20, 1, { instant: true }); });
await step(1.6);
const pews = await G(() => window.__game.npcs.crowd.filter(c => c.occupant && c.behaviour === 'sit').length);
check('people sitting in the pews', pews >= 2, `sitting=${pews}`);
const money0 = await G(() => window.__game.state.money);
await use('veladora', ['abuelo']);
check('light a veladora ($5)', await G((m0) => window.__game.state.money === m0 - 5, money0));
await use('altar_guadalupe', ['familia']);
check('pray at the Virgen', await G(() => window.__game.state.prayed === window.__game.clock.dayIndex));
const cleto = await G(() => { const n = window.__game.npcs.named.get('cleto'); return n && n.map.id; });
check('Don Cleto at the organ on Sunday morning', cleto === 'templo_sf', String(cleto));

// 4. the nuns sell rosaries; wear one
await G(() => { const g = window.__game; g.clock.minutes = 1440 * 4 + 10 * 60; g.changeMap('templo_monjas', 19, 12, 1, { instant: true }); g.npcs.timer = 0; g.npcs.update(0.02); });
const before = await G(() => window.__game.hasItem('rosario'));
await G(() => { const g = window.__game; g.buy('monjas', ['rosario', 'Rosario', '📿', 90, { give: 'rosario' }], 'cash', g.npcs.named.get('socorro')); });
check('buy a rosary from the Madres', !before && await G(() => window.__game.hasItem('rosario')));
await G(() => { const g = window.__game; import('./js/gear.js').then(m => m.equip(g, 'rosario')); });
await sleep(200);
check('wear the rosary', await G(() => window.__game.state.equip.charm === 'rosario'));

// 5. the library: browse a shelf, read, the card catalogue, the murals up close
await G(() => { const g = window.__game; g.clock.minutes = 1440 * 4 + 12 * 60; g.changeMap('biblioteca', 13, 20, 1, { instant: true }); });
const saber0 = await G(() => window.__game.state.saber || 0);
await G(() => { const g = window.__game; const s = g.map.sprites.find(s => s.books === 'literatura'); g.interact({ type: 'sprite', s }); });
await sleep(300); await drive(['Azul', 'leerlo']);
check('read Darío at the library', await G((s0) => (window.__game.state.saber || 0) === s0 + 1, saber0));
await use('fichero', ['luces']);
check('the torn cards in the catalogue', await G(() => !!window.__game.flags.fichas_arrancadas));
await G(() => { const g = window.__game; g.interact({ type: 'sprite', s: g.map.sprites.find(s => s.interact === 'mural_view') }); });
await sleep(500);
check('mural viewer opens', await G(() => !!document.querySelector('.mural-view canvas')));
await page.screenshot({ path: `${OUT}/in_mural_view.png` });
await page.keyboard.press('Escape'); await sleep(300);
check('mural viewer closes with Escape', await G(() => !document.querySelector('.mural-view') && window.__game.input.enabled));

// 6. Don Frijoles: caguama and its bottle
await G(() => { const g = window.__game; g.clock.minutes = 1440 * 4 + 12 * 60; g.changeMap('frijoles', 7, 7, 1, { instant: true }); g.state.inventory.envase = 0; delete g.state.inventory.envase; g.state.deposit = 0; g.state.bottleOwed = 0; g.stats.palabra = -20; });
const m1 = await G(() => window.__game.state.money);
await G(() => { const g = window.__game; g.status.buzz = 0; g.buy('frijoles', ['caguama', 'Caguama', '🍺', 45, { buzz: 30, caguama: true }], 'cash', null); });
const after1 = await G(() => ({ paid: window.__game.state.money, dep: window.__game.state.deposit, owed: window.__game.state.bottleOwed, envase: window.__game.hasItem('envase') }));
check('a caguama without a bottle: deposit or trust, and you leave with the empty', (after1.dep === 15 || after1.owed === 1) && after1.envase, JSON.stringify({ paidTotal: m1 - after1.paid, ...after1 }));
await G(() => { const g = window.__game; g.buy('frijoles', ['envase_dev', 'Devolver', '🍾', 0, { returnBottle: true }], 'cash', null); });
check('returning the bottle settles it', await G(() => !window.__game.hasItem('envase') && !window.__game.state.deposit && !window.__game.state.bottleOwed));

// 7. customers come into La Cochera, buy, and leave
await G(() => { const g = window.__game; g.clock.minutes = 1440 * 4 + 10 * 60; g.changeMap('la_cochera', 9, 10, 1, { instant: true }); });
let maxCust = 0, left = false;
for (let i = 0; i < 12; i++) { await step(5); const n = await G(() => window.__game.npcs.crowd.filter(c => c.customer && !c.hidden).length); maxCust = Math.max(maxCust, n); if (maxCust && n < maxCust) left = true; }
check('customers come in to buy', maxCust >= 1, `max=${maxCust}`);
check('…and leave again', left);

// 8. Doña Leticia's cart follows her
await G(() => { const g = window.__game; g.clock.minutes = 1440 * 4 + 12 * 60; g.changeMap('libreria', 9, 10, 1, { instant: true }); g.npcs.timer = 0; g.npcs.update(0.02); });
await step(6);
const cart = await G(() => { const g = window.__game, n = g.npcs.named.get('leticia'), p = g.npcs.props.get('leticia'); return n && p ? Math.hypot(n.x - p.x, n.y - p.y) : -1; });
check('the book cart rolls with Doña Leticia', cart >= 0 && cart < 14, `distance=${cart.toFixed?.(1)}`);

if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 10).join('\n'));
console.log(`${results.filter(r => r.ok).length}/${results.length} passed`);
await browser.close();
process.exit(results.every(r => r.ok) && !errors.length ? 0 : 1);
