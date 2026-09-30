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
