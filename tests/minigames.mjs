// The classes and crafts: guitar lessons on the fretboard, the study workshop, a lecture, the archive,
// stitching a huarache, the trompo challenge and the organ. Usage: node tests/minigames.mjs
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const OUT = process.env.OUT || '/tmp';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto('http://localhost:8123/index.html?autostart=Test&skipintro=1');
await page.waitForFunction(() => window.__game && window.__game.playing, null, { timeout: 30000 });
const G = (fn, a) => page.evaluate(fn, a);
const sleep = (ms) => page.waitForTimeout(ms);
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${info}`); };
async function drive(want = [], max = 40) {
  for (let i = 0; i < max; i++) {
    const st = await G(() => ({ open: !document.getElementById('dialog').classList.contains('hidden'), ch: [...document.querySelectorAll('#dlgChoices button')].map(b => b.textContent) }));
    if (!st.open) return;
    if (st.ch.length) { let k = st.ch.length - 1; for (const w of want) { const j = st.ch.findIndex(t => t.includes(w)); if (j >= 0) { k = j; break; } } await page.click(`#dlgChoices button:nth-child(${k + 1})`); }
    else await page.keyboard.press('Enter');
    await sleep(120);
  }
}
const goto = (map, x, y, minutes) => G(({ map, x, y, minutes }) => { const g = window.__game; g.clock.minutes = minutes; g.returnStack = [{ map: 'town', x: 126 * 16, y: 106 * 16, dir: 0 }]; g.changeMap(map, x, y, 1, { instant: true }); g.npcs.timer = 0; g.npcs.update(0.02); g.state.money = 2000; }, { map, x, y, minutes });
const use = async (key, want) => { await G((key) => { const g = window.__game; g.interact({ type: 'sprite', s: g.map.sprites.find(s => s.interact === key) }); }, key); await sleep(300); await drive(want); };
// click on the fretboard canvas at a string/fret (same geometry as js/music.js)
async function fret(s, f) {
  const box = await page.locator('canvas.fretboard').boundingBox();
  const X0 = 70, X1 = 1280, Y0 = 34, Y1 = 266, W = 1300, H = 300;
  const fx = (k) => k === 0 ? X0 - 34 : X0 + (X1 - X0) * (1 - Math.pow(2, -k / 12)) / (1 - Math.pow(2, -1)) * 0.98;
  const x = f === 0 ? X0 - 22 : (fx(f - 1) + fx(f)) / 2, y = Y0 + (s - 1) * (Y1 - Y0) / 5;
  await page.mouse.click(box.x + x * box.width / W, box.y + y * box.height / H);
  await sleep(60);
}
const MON = 4, TUE = 5, THU = 7, FRI = 8; // day indices (the story starts on a Thursday)

// 1. guitar: lesson 1 (octaves) on the fretboard
await goto('casa_cultura', 26.4, 20, (MON) * 1440 + 17 * 60);
check('Profe Ismael is there on a weekday afternoon', await G(() => window.__game.npcs.named.get('ismael')?.map.id === 'casa_cultura'));
await use('clase_guitarra');
await sleep(400);
check('the guitar lesson opens', await G(() => !!document.querySelector('canvas.fretboard')));
await page.screenshot({ path: `${OUT}/mg_guitar1.png` });
for (const [s, f] of [[6, 0], [6, 12], [1, 0]]) await fret(s, f);
check('lesson 1 completed by playing the notes', await G(() => !document.querySelector('[data-k="done"]').disabled));
await page.click('[data-k="done"]'); await sleep(300);
check('lesson saved', await G(() => window.__game.state.guitar === 1));
// lesson 2: the major scale
const nextDay = (n) => G((n) => { const g = window.__game; if (n != null) g.state.guitar = n; g.state.guitarDay = -1; g.clock.minutes = 4 * 1440 + 17 * 60; g.npcs.timer = 0; g.npcs.update(0.02); }, n); // each lesson takes an hour of the afternoon
await nextDay();
await use('clase_guitarra'); await sleep(400);
for (const [s, f] of [[5, 3], [5, 5], [4, 2], [4, 3], [4, 5], [3, 2], [3, 4], [3, 5]]) await fret(s, f);
check('lesson 2: C major scale', await G(() => !document.querySelector('[data-k="done"]').disabled));
await page.click('[data-k="done"]'); await sleep(300);
// lesson 5: chords (skip ahead)
await nextDay(4);
await use('clase_guitarra'); await sleep(400);
for (let k = 0; k < 4; k++) { await page.click(`.chord-btn[data-i="${k}"]`); await sleep(120); }
check('lesson 5: major and minor chords', await G(() => !document.querySelector('[data-k="done"]').disabled));
await page.screenshot({ path: `${OUT}/mg_guitar5.png` });
await page.click('[data-k="done"]'); await sleep(300);
// lesson 7: the modes quiz
await nextDay(6);
await use('clase_guitarra'); await sleep(400);
for (const a of [0, 0, 1]) { await page.click(`.quiz [data-a="${a}"]`); await sleep(150); }
check('lesson 7: the modes', await G(() => !document.querySelector('[data-k="done"]').disabled));
await page.screenshot({ path: `${OUT}/mg_guitar7.png` });
await page.click('[data-k="done"]'); await sleep(300);
check('course finished', await G(() => window.__game.state.guitar === 7 && window.__game.flags.guitarra));

// 2. study workshop with Maestra Adela (Monday morning)
await goto('casa_cultura', 16, 10.6, MON * 1440 + 11 * 60);
await G(() => { window.__game.state.studyDay = -1; });
await use('clase_estudio', ['Oratoria']);
await sleep(400);
for (const a of [1, 1, 1]) { await page.click(`.quiz [data-a="${a}"]`); await sleep(600); }
await page.screenshot({ path: `${OUT}/mg_study.png` });
await page.click('.quiz .btn'); await sleep(300);
check('oratoria skill learned', await G(() => (window.__game.state.skills || {}).oratoria === 1));

// 3. Dr. Ochoa's lecture (Thursday 6 pm at the Casa de la Cultura)
await goto('casa_cultura', 16, 13, THU * 1440 + 18.2 * 60);
const ochoa = await G(() => window.__game.npcs.named.get('alvaro_ochoa')?.map.id);
check('Dr. Ochoa is at the Casa de la Cultura on Thursday evening', ochoa === 'casa_cultura', String(ochoa));
const saber0 = await G(() => window.__game.state.saber || 0);
await G(() => { window.__game.minigames.lecture(window.__game); }); await sleep(300); await drive(['documentos']);
check('a lecture teaches something', await G((s0) => (window.__game.state.saber || 0) > s0 && window.__game.flags.ochoa_archivo, saber0));

// 4. the archive at the UNAM (weekday with Dr. Ramírez)
await goto('unam', 26, 14, TUE * 1440 + 11 * 60);
await G(() => { const g = window.__game; g.interact({ type: 'sprite', s: g.map.sprites.find(s => s.fondo === 'censos') }); }); await sleep(300); await drive(['Lagunita']);
check('found the 1791 padrón of La Lagunita', await G(() => !!window.__game.flags.doc_censos_0));

// 5. stitch a huarache with Don Arnulfo
await goto('huaracheria', 6, 9, TUE * 1440 + 11 * 60);
await use('maquina_poste', ['enseñe']); await sleep(400);
for (const k of ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown']) { await page.keyboard.press(k); await sleep(60); }
await page.screenshot({ path: `${OUT}/mg_stitch.png` });
await page.click('.mg .mg-actions .btn'); await sleep(300);
check('stitched a pair of huaraches', await G(() => !!window.__game.flags.cosiste_huarache && window.__game.state.wardrobe.includes('huaraches')));

// 6. the trompo challenge next to a kid in the plaza
await goto('town', 126, 112, FRI * 1440 + 12 * 60);
await G(() => { const g = window.__game; g.giveItemSilent('trompo_mio'); g.state.equip.hand = 'trompo_mio'; const NPC = g.npcs.named.values().next().value.constructor; const lk = g.npcs.lookFor({ id: 'kidtest', look: { age: 'kid' } }); const n = new NPC(g.map, g.player.x + 16, g.player.y, lk, { id: 'kid_t', name: 'Dany', crowd: true }); n.behaviour = 'stand'; g.npcs.crowd.push(n); g.npcs.add(n); g.people.push(n); g.gearCool = 0; });
await page.keyboard.press('f'); await sleep(500);
check('the kid challenges you to trompo', await G(() => !!document.querySelector('.trompo-cv')));
const btn = page.locator('.mg [data-k="go"]');
const bb = await btn.boundingBox();
await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await page.mouse.down(); await sleep(900); await page.mouse.up();
for (let i = 0; i < 60; i++) { const t = await btn.textContent(); if (/Levantarlo|Listo/.test(t)) break; await sleep(200); } // wait until it can be caught
await page.mouse.down(); await page.mouse.up(); await sleep(400);
await page.screenshot({ path: `${OUT}/mg_trompo.png` });
if (await page.locator('.mg [data-k="go"]').count()) { await page.click('.mg [data-k="go"]'); await sleep(300); }
check('trompo match finished', await G(() => !document.querySelector('.trompo-cv')));

// 7. the organ
await goto('templo_sf', 3, 14, TUE * 1440 + 11 * 60);
await G(() => { window.__game.minigames.playOrgan(window.__game); }); await sleep(300);
for (const m of [60, 64, 67, 72]) { await page.click(`.okey[data-m="${m}"]`); await sleep(80); }
await page.click('[data-k="coral"]'); await sleep(300);
await page.screenshot({ path: `${OUT}/mg_organ.png` });
await page.keyboard.press('Escape'); await sleep(300);
check('organ opens, plays and closes', await G(() => !document.querySelector('.organ-keys') && window.__game.flags.played_organ && window.__game.input.enabled));

if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 10).join('\n'));
console.log(`${results.filter(r => r.ok).length}/${results.length} passed`);
await browser.close();
process.exit(results.every(r => r.ok) && !errors.length ? 0 : 1);
