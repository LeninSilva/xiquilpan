// Screenshot any map: node tests/shotmap.mjs <mapId> [x y] [hour] [zoom] [out-name]
// Hides the HUD and toasts; runs the world for a moment so people take their places.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const [, , mapId = 'town', x, y, hour = '11', zoom = '1', name] = process.argv;
const OUT = process.env.OUT || '/tmp';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 960), height: +(process.env.H || 600) } });
const errors = [];
page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.goto('http://localhost:8123/index.html?autostart=Test&skipintro=1');
await page.waitForFunction(() => window.__game && window.__game.playing, null, { timeout: 30000 });
const info = await page.evaluate(({ mapId, x, y, hour, zoom }) => {
  const g = window.__game;
  const day = +(new URLSearchParams(location.search).get('day') || 1);
  g.clock.minutes = day * 1440 + (+hour) * 60;
  const m = g.getMap(mapId);
  const sx = x != null ? +x : m.spawns?.entry?.x ?? m.w / 2, sy = y != null ? +y : m.spawns?.entry?.y ?? m.h / 2;
  g.changeMap(mapId, sx, sy, 1, { instant: true });
  g.npcs.timer = 0; g.npcs.crowdTimer = 0;
  for (let i = 0; i < 90; i++) { g.clock.tick(1 / 30); g.update(1 / 30); }
  g.settings.zoom = +zoom; g.renderer.zoomMul = +zoom * (m.interior ? 1.3 : 1); g.renderer.resize();
  for (const id of ['hud', 'toasts', 'banner', 'prompt', 'touch']) document.getElementById(id).style.display = 'none';
  return { w: m.w, h: m.h, name: m.name, people: g.people.length };
}, { mapId, x, y, hour, zoom });
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/${name || 'map_' + mapId}.png` });
console.log(JSON.stringify(info));
if (errors.length) console.log('ERRORS', errors.slice(0, 5).join('\n'));
await browser.close();
