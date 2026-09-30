// Automated play-through driver. Usage: node tests/play.mjs <scenario> [w h]
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const [, , scenario = 'basic', w = '390', h = '844'] = process.argv;
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_')) errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
const sleep = (ms) => page.waitForTimeout(ms);
const shot = async (n) => { await page.screenshot({ path: `/tmp/claude-0/p_${scenario}_${n}.png` }); };
const G = (fn, arg) => page.evaluate(fn, arg);
// press Enter until dialog closes (max n)
async function skipDialog(n = 40) {
  for (let i = 0; i < n; i++) {
    const open = await G(() => !document.getElementById('dialog').classList.contains('hidden'));
    if (!open) return;
    const choices = await G(() => document.querySelectorAll('#dlgChoices button').length);
    if (choices) await page.click('#dlgChoices button');
    else await page.keyboard.press('Enter');
    await sleep(150);
  }
}
// choose a dialogue option containing `want` (or the first one), advancing text until `until()` is true or dialog closes
async function drive(want = [], max = 60) {
  for (let i = 0; i < max; i++) {
    const st = await G(() => ({ open: !document.getElementById('dialog').classList.contains('hidden'), ch: [...document.querySelectorAll('#dlgChoices button')].map(b => b.textContent), cs: !!window.__game.cutsceneActive }));
    if (!st.open && !st.cs) return;
    if (st.ch.length) {
      let idx = 0;
      for (const w of want) { const k = st.ch.findIndex(t => t.includes(w)); if (k >= 0) { idx = k; break; } }
      if (st.ch.some(t => t.includes('Adiós')) && !want.some(w => st.ch.some(t => t.includes(w)))) idx = st.ch.findIndex(t => t.includes('Adiós'));
      await page.click(`#dlgChoices button:nth-child(${idx + 1})`);
    } else if (st.open) await page.keyboard.press('Enter');
    await sleep(160);
  }
}
async function talkTo(id, want) {
  const ok = await G((id) => { const g = window.__game; g.npcs.timer = 0; g.npcs.update(0.01); const n = g.npcs.named.get(id); if (!n) return false; if (n.map !== g.map) { g.changeMap(n.map.id, n.x / 16, n.y / 16 + 1.1, 1, { instant: true }); } g.player.x = n.x; g.player.y = n.y + 15; g.player.dir = 1; return true; }, id);
  if (!ok) { console.log('npc not present', id); return false; }
  await sleep(250); await page.keyboard.press('Space'); await sleep(400);
  await drive(want);
  return true;
}
async function hold(key, ms) { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); }
await page.goto('http://localhost:8123/index.html?autostart=Emiliano' + (scenario === 'basic' ? '' : '&skipintro=1'));
await page.waitForFunction(() => window.__game && window.__game.playing, null, { timeout: 20000 });
await sleep(1500);
const scenarios = {
  async basic() {
    await sleep(1500); await shot('intro'); await skipDialog(); await sleep(300); await shot('afterintro');
    await hold('ArrowDown', 1600); await sleep(900); await shot('outside');
    await G(() => { const g = window.__game; g.player.x = 125.5 * 16; g.player.y = 100 * 16; });
    await sleep(1200); await shot('plaza');
    await G(() => { const g = window.__game; g.clock.minutes = 20.5 * 60; }); await sleep(2500); await shot('plaza_night');
  },
  async talk() {
    await G(() => { const g = window.__game; g.changeMap('town', 121.5, 107, 1); g.clock.minutes = 8 * 60; g.npcs.timer = 0; });
    await sleep(2500); await shot('near_rosita');
    await G(() => { const g = window.__game; const r = g.npcs.named.get('rosita'); if (r) { g.player.x = r.x; g.player.y = r.y + 16; g.player.dir = 1; } });
    await sleep(400); await page.keyboard.press('Space'); await sleep(1800); await shot('dialog');
    await page.keyboard.press('Enter'); await sleep(300); await shot('choices');
  },
  async tour() {
    const spots = [['palacio', 125, 92], ['mercado_ext', 146, 92], ['sanfrancisco', 146, 115], ['biblio', 162, 116], ['santuario', 125, 147], ['estadio', 128, 186], ['palmas', 93, 150], ['juarez', 50, 162], ['bosque', 100, 208], ['entrada', 238, 97], ['palmira', 228, 90], ['cerro_path', 126, 20], ['corral', 208, 30], ['monjas', 86, 92], ['paz', 194, 130], ['unam', 172, 168]];
    for (const [n, x, y] of spots) {
      await G(([x, y]) => { const g = window.__game; g.changeMap('town', x, y, 0, { instant: true }); g.clock.minutes = 12 * 60; }, [x, y]);
      await sleep(1100); await shot(n);
    }
  },
  async churches() {
    for (const [n, x, y] of [['sf', 146, 108], ['santuario', 125, 146], ['monjas', 86, 90], ['biblio', 162, 110]]) {
      await G(([x, y]) => { const g = window.__game; g.changeMap('town', x, y, 0, { instant: true }); g.clock.minutes = 12 * 60; }, [x, y]);
      await sleep(1100); await shot(n);
    }
  },
  async story() {
    await G(() => { const g = window.__game; g.state.act = 3; g.quests.set('main', 30); g.flags.mancha = true; g.clock.minutes = 10 * 60 + 151 * 1440; g.changeMap('town', 195.5, 114, 1); });
    await sleep(800); await skipDialog();
    await talkTo('abuela', []); await shot('home');
    let st = await G(() => window.__game.quests.q('main').stage); console.log('after home', st);
    await G(() => { const g = window.__game; g.clock.minutes = Math.floor(g.clock.minutes / 1440) * 1440 + 19 * 60; g.changeMap('town', 125, 106.2, 1); });
    await sleep(600); await page.keyboard.press('Space'); await sleep(500); await drive(['Contar todo']); await shot('speech');
    st = await G(() => window.__game.quests.q('main').stage); console.log('after speech', st);
    await G(() => { const g = window.__game; g.clock.minutes = Math.floor(g.clock.minutes / 1440) * 1440 + 1440 + 10 * 60; while (g.clock.weekday !== 2) g.clock.minutes += 1440; });
    await talkTo('estela', ['Doctora']);
    await G(() => { const g = window.__game; g.quests.q('s_jeep').done = true; g.quests.q('s_trompo').done = true; });
    await talkTo('ramirez', ['registros']);
    await G(() => { const g = window.__game; g.clock.minutes = Math.floor(g.clock.minutes / 1440) * 1440 + 17 * 60; });
    await talkTo('beto', ['viste algo']);
    st = await G(() => [window.__game.quests.q('main').stage, window.__game.quests.evidenceCount()]); console.log('evidence', st);
    await G(() => { const g = window.__game; g.clock.minutes = Math.floor(g.clock.minutes / 1440) * 1440 + 1440 + 11 * 60; });
    await talkTo('padre', ['pruebas']);
    await drive([], 80); await sleep(500); await drive([], 40); await shot('after_skip');
    st = await G(() => [window.__game.state.act, window.__game.state.era]); console.log('act/era', st);
    // act 4: allies & hilos
    await G(() => { const g = window.__game; g.state.hilos = 11; g.clock.minutes = Math.floor(g.clock.minutes / 1440) * 1440 + 10 * 60; while (g.clock.weekday !== 3) g.clock.minutes += 1440; });
    await talkTo('rosita', ['vendrías']); await talkTo('paty', ['alumbrado']);
    await G(() => { const g = window.__game; g.clock.minutes = Math.floor(g.clock.minutes / 1440) * 1440 + 17 * 60; });
    await talkTo('karla', ['invitar', 'Todos cometemos']);
    await talkTo('juanita', ['escuchar', 'Quedarte']);
    st = await G(() => [window.__game.state.hilos, window.__game.quests.alliesCount(), window.__game.quests.objective().text]); console.log('act4', JSON.stringify(st));
    await G(() => { const g = window.__game; g.stats.corazon = 45; while (g.clock.weekday !== 5) g.clock.minutes += 1440; g.clock.minutes = Math.floor(g.clock.minutes / 1440) * 1440 + 20.5 * 60; g.changeMap('town', 125, 106.2, 1); });
    await sleep(600); await page.keyboard.press('Space'); await sleep(600);
    for (let i = 0; i < 12; i++) { await drive([], 30); await sleep(400); if (i === 3) await shot('anil'); }
    st = await G(() => [window.__game.state.act, window.__game.state.ending]); console.log('ending', st);
    await shot('end');
  },
  async shops() {
    await G(() => { const g = window.__game; g.clock.minutes = 7 * 60; g.changeMap('town', 205, 26, 1); });
    await talkTo('refugio', ['comprar']);
    await sleep(300); await shot('shop');
    await page.click('#shopList .shop-row:nth-child(2) button.alt'); await sleep(200);
    await page.click('#shopList .shop-row:nth-child(1) button'); await sleep(200); await shot('bought');
    await page.click('#shopClose'); await sleep(300); await drive(['Adiós']);
    console.log('debt', await G(() => [window.__game.state.debt, window.__game.state.money, window.__game.status.buzz]));
    await talkTo('refugio', ['Pagarle']); console.log('debt after', await G(() => window.__game.state.debt));
    // taxi
    await G(() => { const g = window.__game; g.clock.minutes = 10 * 60; g.changeMap('town', 158.5, 114.6, 1); g.player.x = 158 * 16; g.player.y = 114.2 * 16; g.player.dir = 1; });
    await sleep(500); await page.keyboard.press('Space'); await sleep(500); await shot('taxi');
    await drive(['Totolán']); await sleep(1500); await shot('totolan');
    console.log('map', await G(() => window.__game.map.id));
    // menu screens
    await page.keyboard.press('m'); await sleep(600); await shot('map');
    await page.click('[data-tab=journal]'); await sleep(300); await shot('journal');
    await page.click('[data-tab=self]'); await sleep(300); await shot('self');
    await page.click('[data-tab=bag]'); await sleep(300); await shot('bag');
    await page.click('[data-tab=settings]'); await sleep(300); await shot('settings');
  },
  async interiors() {
    const ids = ['mercado', 'biblioteca', 'unam', 'templo_sf', 'micheladas_lupita', 'la_cochera', 'palacio', 'panaderia', 'billar_mendoza', 'oxxo', 'chamacuero', 'hospital'];
    for (const id of ids) {
      await G((id) => { const g = window.__game; g.returnStack = [{ map: 'town', x: 2000, y: 1600, dir: 0 }]; const m = g.getMap(id); g.changeMap(id, m.spawns.entry.x, m.spawns.entry.y - 1, 1, { instant: true }); g.clock.minutes = 13 * 60; g.npcs.timer = 0; }, id);
      await sleep(1200); await shot(id);
    }
  },
  async cerro() {
    await G(() => { const g = window.__game; g.giveItem('linterna'); g.quests.set('main', 2); g.state.clues = ['rosita', 'chuy', 'lupe']; g.changeMap('town', 126.5, 3, 1); });
    await sleep(500);
    await hold('ArrowUp', 1500); await sleep(1500); await shot('arrive');
    await skipDialog();
    await G(() => { const g = window.__game; g.player.x = 40.5 * 16; g.player.y = 56 * 16; }); await sleep(1200); await shot('village');
    await G(() => { const g = window.__game; g.player.x = 40.5 * 16; g.player.y = 17 * 16; g.clock.minutes += 10 * 60; }); await sleep(1500); await shot('summit');
    await G(() => { const g = window.__game; const m = g.npcs.named.get('miguel'); g.player.x = m.x; g.player.y = m.y + 14; g.player.dir = 1; });
    await sleep(300); await page.keyboard.press('Space'); await sleep(800); await shot('talk_miguel');
    // run the camp conversation and the UFO cutscene
    for (let i = 0; i < 80; i++) {
      const st = await G(() => ({ act: window.__game.state.act, cs: window.__game.cutsceneActive, open: !document.getElementById('dialog').classList.contains('hidden'), ch: document.querySelectorAll('#dlgChoices button').length }));
      if (st.act === 3 && !st.cs) break;
      if (st.ch) { await page.click('#dlgChoices button'); }
      else if (st.open) await page.keyboard.press('Enter');
      await sleep(250);
      if (i === 30) await shot('ufo_mid');
      if (i === 45) await shot('ufo_late');
    }
    await sleep(1500); await shot('after_ufo');
    await skipDialog();
    await G(() => { const g = window.__game; g.changeMap('town', 126.5, 3, 0); }); await sleep(1500); await skipDialog(); await shot('town_act3');
    await G(() => { const g = window.__game; g.player.x = 125 * 16; g.player.y = 100 * 16; }); await sleep(1500); await shot('jacarandas');
  },
};
await scenarios[scenario]();
const state = await G(() => ({ act: window.__game.state.act, map: window.__game.map.id, ents: window.__game.entities.length, fps: 0 }));
console.log(JSON.stringify(state));
if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 20).join('\n'));
await browser.close();
