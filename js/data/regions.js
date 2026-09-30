// Outlying maps: the Cerro de San Francisco (with its hilltop pueblito) and nearby villages.
import { GameMap, G } from '../world.js';
import { fbm, hash2, TILE } from '../util.js';
import { hStreet, vStreet, sprite, building, block, tree, door, area, light, ensureLanes } from './build.js';

export function buildCerro() {
  const W = 80, H = 130;
  const m = new GameMap('cerro', 'Cerro de San Francisco', W, H, { fill: G.GRASS, baseElev: 1700 });
  m.ambient = 'cerro';
  // elevation: rises from 1700 m at the foot (south) to ~2080 m at the cross (north)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = 1 - y / H;
    let e = 1700 + t * 380 + (fbm(x * 0.05, y * 0.05, 3, 3) - 0.5) * 40;
    const dx = (x - 40) / 30; e -= dx * dx * 60; // ridge along the middle
    m.elev[y * W + x] = e;
    const n = fbm(x * 0.09, y * 0.09, 17, 3);
    m.set(x, y, n > 0.6 ? G.FOREST : n < 0.2 ? G.ROCK : G.GRASS);
    if (x < 6 || x > W - 7) m.set(x, y, G.SLOPE);
  }
  // steep flanks: impassable slope away from the ridge
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.abs(x - 40) > 30 - Math.sin(y * 0.12) * 4;
    if (edge) m.set(x, y, G.SLOPE);
  }
  // the rocky road zig-zags up from the bottom to the village and on to the summit
  const road = [[40, 129], [40, 118], [22, 112], [22, 100], [56, 94], [56, 82], [30, 76], [30, 66], [40, 62], [40, 40], [52, 34], [52, 26], [40, 20], [40, 16]];
  for (let i = 0; i < road.length - 1; i++) {
    let [x, y] = road[i]; const [bx, by] = road[i + 1];
    while (x !== bx || y !== by) {
      for (let k = -1; k <= 1; k++) { m.set(x + (by === y ? 0 : k), y + (by === y ? k : 0), G.ROCKROAD); }
      x += Math.sign(bx - x); y += Math.sign(by - y);
    }
  }
  m.markStreet(20, 16, 40, 114, 'Camino empedrado al Cerro de San Francisco');
  // village of San Francisco on the hill
  for (let y = 44; y < 66; y++) for (let x = 24; x < 58; x++) if (m.get(x, y) !== G.ROCKROAD) m.set(x, y, G.DIRT);
  building(m, 'capilla', 34, 40, 12, 9, { label: 'SAN FRANCISCO', color: '#f3eee4', tall: 60 });
  door(m, 40, 48, 'capilla_sf', 'Capilla de San Francisco');
  area(m, 'Pueblito de San Francisco', 24, 38, 34, 28, 'village');
  m.fill(36, 49, 9, 3, G.PLAZA);
  for (const [x, y, w, h] of [[26, 52, 7, 6], [48, 50, 8, 6], [26, 60, 6, 5], [46, 58, 9, 6], [50, 44, 6, 5]]) block(m, x, y, w, h, { outskirts: true, facadeH: 28 });
  door(m, 29, 57, 'tienda_cerro', 'Tiendita del cerro', { hours: [7, 20] });
  sprite(m, 'lamp', 36.5, 51.8, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, 36.5, 51, 80);
  sprite(m, 'lamp', 44.5, 51.8, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, 44.5, 51, 80);
  // summit: cross, campsite, llano where the lights land
  for (let y = 4; y < 24; y++) for (let x = 28; x < 56; x++) {
    const d = ((x - 42) / 14) ** 2 + ((y - 14) / 10) ** 2;
    if (d < 1) m.set(x, y, G.GRASS);
  }
  sprite(m, 'summitCross', 42, 7, { scale: 1.3, w: 30, up: 60, collide: [-3, -3, 6, 3], interact: 'cruz' });
  area(m, 'La Cruz (cima del cerro)', 28, 4, 28, 20, 'summit');
  sprite(m, 'campfire', 41.5, 15, { w: 20, up: 20, collide: [-5, -3, 10, 4], interact: 'fogata', acts: [2] });
  sprite(m, 'tent', 36, 13, { color: '#d8792e', w: 34, up: 24, collide: [-12, -4, 24, 4], acts: [2] });
  sprite(m, 'tent', 47, 12.6, { color: '#3c7a8a', w: 34, up: 24, collide: [-12, -4, 24, 4], acts: [2] });
  m.lights.push({ x: 41.5 * TILE, y: 14.6 * TILE, r: 110, color: '#ffb35a', kind: 'fire', acts: [2] });
  // trees: pines and oaks, agaves and rocks
  for (let i = 0; i < 420; i++) {
    const x = 7 + Math.floor(hash2(i, 1, 55) * (W - 14)), y = 2 + Math.floor(hash2(i, 2, 55) * (H - 4));
    const g = m.get(x, y);
    if (g === G.ROCKROAD || g === G.SLOPE || g === G.DIRT || g === G.PLAZA || g === G.ROOF) continue;
    if (y > 3 && y < 24 && x > 28 && x < 56) continue;
    if (m.get(x, y + 1) === G.ROCKROAD || m.get(x + 1, y) === G.ROCKROAD || m.get(x - 1, y) === G.ROCKROAD) continue;
    const r = hash2(i, 3, 55);
    if (r < 0.45) tree(m, x + 0.5, y + 0.8, r < 0.3 ? 'pino' : 'encino', { size: 0.9 + r });
    else if (r < 0.6) sprite(m, 'agave', x + 0.5, y + 0.8, { w: 22, up: 16, collide: [-3, -2, 6, 2] });
    else if (r < 0.8) sprite(m, 'rock', x + 0.5, y + 0.8, { size: 0.8 + r, w: 20, up: 14, collide: [-6, -3, 12, 3] });
    else if (r < 0.9) sprite(m, 'nopal', x + 0.5, y + 0.8, { w: 18, up: 24, collide: [-3, -2, 6, 2] });
  }
  sprite(m, 'signpost', 42.5, 126, { text: 'JIQUILPAN ↓', bg: '#6b4a30', w: 40, up: 30 });
  sprite(m, 'signpost', 33, 66.5, { text: 'SAN FRANCISCO', bg: '#6b4a30', w: 44, up: 30 });
  m.exits.push({ x: 38, y: 129, w: 5, h: 1, to: 'town', tx: 126.5, ty: 2.5, label: 'Bajar a Jiquilpan' });
  m.spawns = { bottom: { x: 40, y: 126 }, summit: { x: 40, y: 17 } };
  m.structures.sort((a, b) => (a.layer || 0) - (b.layer || 0));
  m.finalize();
  return m;
}

function village(id, name, W, H, opts) {
  const m = new GameMap(id, name, W, H, { fill: G.FIELD, baseElev: opts.elev || 1540 });
  m.ambient = 'village';
  ensureLanes(m);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x * 0.08, y * 0.08, opts.seed, 3);
    m.set(x, y, n > 0.55 ? G.FIELD : G.GRASS);
    m.elev[y * W + x] = (opts.elev || 1540) + fbm(x * 0.04, y * 0.04, opts.seed + 1, 3) * 20;
  }
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  hStreet(m, 'Calle Principal', 2, W - 2, cy + 3, 4, { surface: opts.paved ? G.COBBLE : G.DIRTROAD, sidewalk: !!opts.paved });
  vStreet(m, 'Calle Hidalgo', cx - 12, 4, H - 4, 4, { surface: G.DIRTROAD, sidewalk: false });
  vStreet(m, 'Calle Morelos', cx + 10, 4, H - 4, 4, { surface: G.DIRTROAD, sidewalk: false });
  // small plaza with church facing south
  m.fill(cx - 7, cy - 4, 15, 7, G.PLAZA);
  building(m, 'capilla', cx - 5, cy - 13, 11, 9, { label: opts.church, color: opts.churchColor || '#f3eee4', tall: 60 });
  door(m, cx, cy - 5, id + '_templo', opts.church);
  tree(m, cx - 5, cy + 1.5, 'laurel', { size: 1.1 }); tree(m, cx + 6, cy + 1.5, 'jacaranda', { size: 1 });
  for (const [bx, by] of [[cx - 2, cy + 1.2], [cx + 3, cy + 1.2]]) sprite(m, 'bench', bx, by, { w: 20, up: 12, collide: [-8, -4, 16, 4], seat: true });
  sprite(m, 'lamp', cx - 6.5, cy - 3.5, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, cx - 6.5, cy - 4, 80);
  sprite(m, 'lamp', cx + 7.5, cy - 3.5, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, cx + 7.5, cy - 4, 80);
  // houses
  const lots = [[cx - 20, cy - 12, 7, 7], [cx - 20, cy + 8, 7, 6], [cx - 7, cy + 8, 7, 6], [cx + 1, cy + 8, 8, 6], [cx + 15, cy - 12, 8, 7], [cx + 15, cy + 8, 8, 6], [cx + 15, cy - 2, 8, 4], [cx - 20, cy - 2, 7, 4]];
  for (const [x, y, w, h] of lots) block(m, x, y, w, h, { outskirts: true, facadeH: 26 });
  door(m, cx - 17, cy - 6, 'tiendita', 'Tiendita', { hours: [7, 21] });
  if (opts.school) { building(m, 'escuela', cx - 7, cy + 16, 14, 7); area(m, 'Escuela rural', cx - 7, cy + 16, 14, 7, 'building'); }
  // taxi back
  sprite(m, 'sitio', cx + 8.5, cy + 3.1, { scale: 1.2, w: 20, up: 24, collide: [-7, -3, 14, 3], interact: 'sitio', sitio: name });
  sprite(m, 'parkedCar', cx + 11, cy + 4.6, { color: '#f4f4f0', taxi: '#1b7a3e', w: 36, up: 24, collide: [-14, -6, 28, 6] });
  // trees & fields
  for (let i = 0; i < 70; i++) {
    const x = 2 + Math.floor(hash2(i, 1, opts.seed) * (W - 4)), y = 2 + Math.floor(hash2(i, 2, opts.seed) * (H - 4));
    const g = m.get(x, y); if (g !== G.GRASS && g !== G.FIELD) continue;
    if (Math.abs(x - cx) < 22 && Math.abs(y - cy) < 16) continue;
    const r = hash2(i, 3, opts.seed);
    if (r < 0.5) tree(m, x + 0.5, y + 0.8, pickKind(r), { size: 0.9 + r * 0.4 });
    else if (r < 0.7) sprite(m, 'agave', x + 0.5, y + 0.8, { w: 22, up: 16, collide: [-3, -2, 6, 2] });
  }
  area(m, name, 0, 0, W, H, 'village');
  m.spawns = { plaza: { x: cx + 0.5, y: cy + 2 } };
  m.structures.sort((a, b) => (a.layer || 0) - (b.layer || 0));
  m.finalize();
  return m;
}
function pickKind(r) { return r < 0.15 ? 'huizache' : r < 0.3 ? 'fresno' : r < 0.4 ? 'jacaranda' : 'encino'; }

export function buildTotolan() { return village('totolan', 'Totolán', 64, 46, { seed: 71, church: 'TOTOLÁN', churchColor: '#f2dcc6', paved: true, elev: 1555 }); }
export function buildAbadiano() { return village('abadiano', 'Abadiano', 56, 40, { seed: 83, church: 'ABADIANO', elev: 1545 }); }
export function buildSarabia() { return village('sarabia', 'Francisco Sarabia', 56, 42, { seed: 97, church: 'FCO. SARABIA', churchColor: '#e8e6f2', school: true, elev: 1550 }); }
