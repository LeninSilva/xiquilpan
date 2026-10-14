// Crowd stress test: simulates busy places with drawing switched off and reports walkers that get
// stuck (no progress while they have somewhere to go), recoveries, teleports and people standing
// inside each other. Usage: node tests/crowd.mjs [seconds]   (server on :8123)
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const SECS = +(process.argv[2] || 150);
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:8123/index.html?autostart=Test&skipintro=1');
await page.waitForFunction(() => window.__game && window.__game.playing, null, { timeout: 30000 });

const PLACES = [
  { name: 'plaza, Friday 19:30', map: 'town', x: 126, y: 104, min: 1440 + 19.5 * 60 },
  { name: 'portales, Saturday 18:00', map: 'town', x: 130, y: 113, min: 2 * 1440 + 18 * 60 },
  { name: 'tianguis, Saturday 10:00', map: 'town', x: 195, y: 95, min: 2 * 1440 + 10 * 60 },
  { name: 'Jardín de la Paz, Friday 11:00', map: 'town', x: 171, y: 50, min: 1440 + 11 * 60 },
  { name: 'mercado, Thursday 10:00', map: 'mercado', x: 20, y: 20, min: 10 * 60 },
  { name: 'Sunday mass + Negritos, 11:30', map: 'town', x: 126, y: 106, min: 3 * 1440 + 11.5 * 60 },
  { name: 'micheladas, Friday 21:00', map: 'town', x: 86, y: 62, min: 1440 + 21 * 60 },
  { name: 'bosque, Monday 7:00', map: 'town', x: 110, y: 250, min: 4 * 1440 + 7 * 60 },
];
const results = [];
for (const P of PLACES) {
  const r = await page.evaluate(async ({ P, SECS }) => {
    const g = window.__game;
    g.frame = () => {}; // stop the live loop; we step by hand
    g.env.useLive = false;
    g.clock.minutes = P.min;
    g.npcs.clearTransient?.();
    g.changeMap(P.map, P.x, P.y, 0, { instant: true });
    g.player.x = P.x * 16; g.player.y = P.y * 16;
    g.npcs.timer = 0; g.npcs.crowdTimer = 0;
    const NPC = g.npcs.named.values().next().value?.constructor;
    let recovers = 0, teleports = 0;
    const origRecover = NPC.prototype.recover;
    NPC.prototype.recover = function (game) { recovers++; const x = this.x, y = this.y; origRecover.call(this, game); if (Math.hypot(this.x - x, this.y - y) > 40) teleports++; };
    const track = new Map(); // npc -> {x,y,t,stuckT,maxStuck}
    const overlap = new Map();
    let stuckEvents = 0, maxStuck = 0, people = 0, overlapEvents = 0;
    const dt = 1 / 30;
    const stuckList = [];
    for (let f = 0; f < SECS * 30; f++) {
      g.clock.tick(dt); g.env.update(g.clock, dt); g.update(dt);
      if (f % 15) continue;
      const list = g.people.filter(p => p !== g.player && !p.down);
      people = Math.max(people, list.length);
      for (const n of list) {
        let t = track.get(n);
        if (!t) { t = { x: n.x, y: n.y, stuckT: 0, flagged: false }; track.set(n, t); }
        const moved = Math.hypot(n.x - t.x, n.y - t.y);
        if (n.path && !n.talking && moved < 1.5) t.stuckT += 0.5; else { t.stuckT = 0; t.flagged = false; }
        if (t.stuckT >= 3 && !t.flagged) { t.flagged = true; stuckEvents++; stuckList.push(`${n.name}@${(n.x / 16).toFixed(1)},${(n.y / 16).toFixed(1)}`); }
        maxStuck = Math.max(maxStuck, t.stuckT);
        t.x = n.x; t.y = n.y;
      }
      // people standing inside each other (centres closer than 5 px) for more than 2 s
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (a.behaviour === 'dance' || b.behaviour === 'dance') continue;
        const key = a.id + ':' + b.id;
        if (Math.hypot(a.x - b.x, (a.y - b.y) * 1.4) < 5) { const v = (overlap.get(key) || 0) + 0.5; overlap.set(key, v); if (v === 2.5) overlapEvents++; }
        else overlap.delete(key);
      }
      if (f % 300 === 0) await new Promise(r => setTimeout(r, 0));
    }
    NPC.prototype.recover = origRecover;
    return { place: P.name, people, stuckEvents, maxStuck, recovers, teleports, overlapEvents, sample: stuckList.slice(0, 6) };
  }, { P, SECS });
  results.push(r);
  console.log(JSON.stringify(r));
}
if (errors.length) console.log('ERRORS', errors.slice(0, 5));
await browser.close();
