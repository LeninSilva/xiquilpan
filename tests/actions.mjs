// Things you do with your hands and your horse: slingshot, a fight, riding and jumping, drinking,
// and the Android back button. Usage: node tests/actions.mjs   (server on :8123; OUT=dir for shots)
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
const shot = (n) => page.screenshot({ path: `${OUT}/act_${n}.png` });
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${info}`); };
// step the simulation by hand (deterministic, fast) while the page keeps rendering
const step = (secs) => G((secs) => { const g = window.__game; for (let i = 0; i < secs * 30; i++) { g.clock.tick(1 / 30); g.update(1 / 30); } g.renderer.draw(g); g.ui.updateHUD(); }, secs);
const press = async (key, ms = 60) => { await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); };

// 1. slingshot: buy, equip, knock all five cans down
await G(() => { const g = window.__game; g.clock.minutes = 1440 + 11 * 60; g.changeMap('town', 206.5, 263, 1, { instant: true }); g.giveItem('resortera'); });
await G(() => { const g = window.__game; g.ui.openMenu('bag'); });
await sleep(300);
await page.click('[data-equip="resortera"]');
await sleep(200);
check('equip from the bag', await G(() => window.__game.state.equip.hand === 'resortera'));
await shot('bag');
await G(() => window.__game.ui.closeMenu());
const xs = [-17.6, -8.8, 0, 8.8, 17.6];
for (const dx of xs) {
  await G((dx) => { const g = window.__game; g.player.x = 206.5 * 16 + dx; g.player.y = 263 * 16; g.player.dir = 1; g.gearCool = 0; }, dx);
  await press('f'); await step(0.6);
}
await shot('botes');
const botes = await G(() => window.__game.state.botes || 0);
check('five cans knocked down with the slingshot', botes >= 1, `rounds=${botes}`);

// 2. fruit: whack a guayabo with the stick
await G(() => { const g = window.__game; g.giveItem('palo'); g.state.equip.hand = 'palo'; g.changeMap('town', 88, 257.2, 1, { instant: true }); g.player.dir = 1; });
let fruit = false;
for (let i = 0; i < 6 && !fruit; i++) { await G(() => { const g = window.__game; g.gearCool = 0; g.flags = Object.fromEntries(Object.entries(g.flags).filter(([k]) => !k.startsWith('fruitDay_'))); }); await press('f'); await step(0.5); fruit = await G(() => (window.__game.quests.extraItems || []).some(e => e.dropped)); }
check('fruit falls from a tree', fruit);

// 3. a fight: provoke a grown man twice with the slingshot, then win with fists
const fight = await G(() => {
  const g = window.__game; g.clock.minutes = 1440 + 22 * 60; g.changeMap('town', 126, 104, 0, { instant: true });
  g.state.equip.hand = 'resortera';
  // an open stretch of street with nothing between you and him
  search: for (let y = 112; y < 170; y++) for (let x = 112; x < 200; x++) { let ok = true; for (let k = 0; k < 34 && ok; k++) if (g.map.blocked(x * 16 + 8, y * 16 + 8 - k, 6, 3)) ok = false; if (ok) { g.player.x = x * 16 + 8; g.player.y = y * 16 + 8; break search; } }
  const NPC = g.npcs.named.values().next().value.constructor;
  const lk = g.npcs.lookFor({ id: 'test_brawler', look: { age: 'adult', female: false, girth: 1 } });
  const n = new NPC(g.map, g.player.x, g.player.y - 22, lk, { id: 'crowd_t', name: 'El Güicho', crowd: true, role: 'se toma una michelada' });
  n.ctype = 'drinker'; n.behaviour = 'stand'; g.npcs.crowd.push(n); g.npcs.add(n);
  g.player.dir = 1;
  return n.id;
});
await step(0.2);
for (let i = 0; i < 2 && !(await G(() => window.__game.combat.active)); i++) { await G(() => { window.__game.gearCool = 0; }); await press('f'); await step(0.6); }
check('provoking a drinker at night starts a fight', await G(() => window.__game.combat.active));
await shot('fight');
const hpBefore = await G(() => window.__game.state.hp);
for (let i = 0; i < 40 && await G(() => window.__game.combat.active); i++) { await G(() => { const g = window.__game; g.combat.cool = 0; }); await press('Space'); await step(0.25); }
const after = await G(() => ({ active: window.__game.combat.active, hp: window.__game.state.hp, decals: window.__game.combat.decals.length, corazon: window.__game.stats.corazon, fights: window.__game.state.fights }));
check('fight ends', !after.active, JSON.stringify(after));
check('blood decals on the ground', after.decals > 0);
check('starting a fight costs corazón', after.corazon < 0);
await shot('after_fight');

// 4. horse: hire El Prieto from Don Celso, ride, sprint, jump a bush, dismount
await G(() => { const g = window.__game; g.combat.decals = []; g.clock.minutes = 2 * 1440 + 10 * 60; g.changeMap('cerro', 17.5, 52, 1, { instant: true }); g.npcs.timer = 0; g.npcs.update(0.02); g.state.money = 1000; });
await step(0.5);
const celso = await G(() => { const g = window.__game, n = g.npcs.named.get('salazar'); if (!n) return false; g.player.x = n.x; g.player.y = n.y + 15; g.player.dir = 1; return true; });
check('Don Celso is at his rancho', celso);
await press('Space'); await sleep(500);
for (let i = 0; i < 30; i++) {
  const st = await G(() => ({ open: !document.getElementById('dialog').classList.contains('hidden'), ch: [...document.querySelectorAll('#dlgChoices button')].map(b => b.textContent) }));
  if (!st.open) break;
  if (st.ch.length) { const k = st.ch.findIndex(t => t.includes('renta')); const k2 = k >= 0 ? k : st.ch.findIndex(t => t.includes('Adiós')); await page.click(`#dlgChoices button:nth-child(${k2 + 1})`); }
  else await press('Enter');
  await sleep(200);
}
const horse = await G(() => window.__game.state.horse);
check('hired a horse', horse && horse.name === 'El Prieto', JSON.stringify(horse));
await step(2.5);
const mounted = await G(() => { const g = window.__game, h = g.npcs.animals.find(a => a.owned); if (!h) return 'no horse entity'; g.player.x = h.x - 12; g.player.y = h.y; g.player.dir = 3; return true; });
await step(0.1);
await press('Space'); await step(0.3);
check('mounted the horse', await G(() => window.__game.riding.on), String(mounted));
await shot('mounted');
// ride east for a second, then sprint
const x0 = await G(() => window.__game.player.x);
await page.keyboard.down('ArrowRight');
for (let i = 0; i < 12; i++) await step(0.1);
const walkV = (await G(() => window.__game.player.x) - x0) / 1.2;
await press('Shift', 50);
const x1 = await G(() => window.__game.player.x);
for (let i = 0; i < 10; i++) await step(0.1);
const sprintV = (await G(() => window.__game.player.x) - x1) / 1.0;
await page.keyboard.up('ArrowRight');
check('riding is faster than walking', walkV > 60, `ride≈${walkV.toFixed(0)} px/s`);
check('spurs sprint faster still', sprintV > walkV + 20, `sprint≈${sprintV.toFixed(0)} px/s`);
await shot('riding');
// jump: put a bush in front and jump over it
const jumped = await G(() => {
  const g = window.__game, p = g.player, m = g.map;
  // find a bush with free ground on both sides
  const b = m.sprites.find(s => s.kind === 'bush' && !m.blocked(s.x - 30, s.y, 8, 4) && !m.blocked(s.x + 30, s.y, 8, 4) && !m.blocked(s.x - 20, s.y, 8, 4));
  if (!b) return 'no bush';
  p.x = b.x - 30; p.y = b.y; p.dir = 3; g.riding.vx = 95; g.riding.vy = 0; g.riding.sprint = 0;
  g.riding.tryJump();
  for (let i = 0; i < 30; i++) { g.update(1 / 30); }
  return { from: (b.x - 30).toFixed(0), to: p.x.toFixed(0), bush: b.x.toFixed(0) };
});
check('jumps over a bush', typeof jumped === 'object' && +jumped.to > +jumped.bush, JSON.stringify(jumped));
await G(() => { const g = window.__game; g.riding.vx = g.riding.vy = 0; });
await step(0.3);
await press('Space'); await step(0.3);
check('dismounted when stopped', await G(() => !window.__game.riding.on && window.__game.npcs.animals.some(a => a.owned && !a.hidden)));
// whistle from afar
await G(() => { const g = window.__game; g.player.x += 220; });
await press('h'); await step(4);
const near = await G(() => { const g = window.__game, h = g.npcs.animals.find(a => a.owned); return Math.hypot(h.x - g.player.x, h.y - g.player.y); });
check('the horse comes when whistled', near < 40, `distance=${near.toFixed(0)}`);

// 5. drinking: alegre → mareado (blur, double vision) → pass out and wake at home
await G(() => { const g = window.__game; g.changeMap('town', 126, 104, 0, { instant: true }); g.status.buzz = 0; g.applyEffect({ buzz: 50 }); g.applyEffect({ buzz: 40 }); });
await step(0.3);
check('drunk screen effect on', await G(() => document.body.classList.contains('drunk')));
await shot('drunk');
await G(() => { const g = window.__game; g.applyEffect({ buzz: 40 }); });
await step(0.2); await sleep(1500);
for (let i = 0; i < 20; i++) { const open = await G(() => !document.getElementById('dialog').classList.contains('hidden')); if (open) await press('Enter'); await sleep(200); }
const woke = await G(() => ({ map: window.__game.map.id, buzz: Math.round(window.__game.status.buzz), hour: window.__game.clock.hour.toFixed(1) }));
check('passing out wakes you at the abuela’s', woke.map === 'casa_abuela' && woke.buzz < 30, JSON.stringify(woke));

// 6. Android back button (history.back) closes the menu and opens it again
await G(() => window.__game.ui.openMenu('bag'));
await page.evaluate(() => history.back()); await sleep(400);
check('back closes the menu', await G(() => !window.__game.ui.menuOpen));
await page.evaluate(() => history.back()); await sleep(400);
check('back opens the menu when nothing is open', await G(() => window.__game.ui.menuOpen));
await G(() => window.__game.ui.closeMenu());

if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 10).join('\n'));
console.log(`${results.filter(r => r.ok).length}/${results.length} passed`);
await browser.close();
process.exit(results.every(r => r.ok) && !errors.length ? 0 : 1);
