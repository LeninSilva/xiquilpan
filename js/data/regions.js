// Outlying maps: the Cerro de San Francisco (with its hilltop pueblito) and nearby villages.
import { GameMap, G } from '../world.js';
import { fbm, hash2, TILE } from '../util.js';
import { hStreet, vStreet, sprite, building, block, tree, door, area, light, ensureLanes } from './build.js';
import { addLotDoors } from './town.js';

// The Cerro de San Francisco rises SOUTH of Jiquilpan. You come in from the town at the top of this
// map (north) and climb southward: the "subida mágica" (the gravity hill), the path to La Piedrita
// and its little waterfall, the pueblito of San Francisco with its chapel, and the summit with the
// cross. Only the highest part has pines; below it is oak, huizache, giant magueys, nopales and
// rocks everywhere, with cows and horses loose on the slopes.
export const CERRO = { W: 80, H: 140, entry: [40.5, 2.6], camp: [41.5, 120], cross: [42, 129], land: [48, 111], village: [40, 94], tona: [37, 92.6], road: [[40, 0], [40, 22], [24, 28], [24, 40], [54, 46], [54, 58], [32, 64], [32, 74], [40, 78], [40, 98], [52, 104], [52, 112], [40, 116]], piedrita: [62, 31], subida: [36, 14] };
export function buildCerro() {
  const W = CERRO.W, H = CERRO.H;
  const m = new GameMap('cerro', 'Cerro de San Francisco', W, H, { fill: G.GRASS, baseElev: 1620 });
  m.ambient = 'cerro';
  ensureLanes(m);
  // elevation: ~1620 m where the town's dirt road arrives, ~2000 m at the cross (south)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = y / H;
    let e = 1620 + Math.pow(t, 1.15) * 380 + (fbm(x * 0.05, y * 0.05, 3, 3) - 0.5) * 40;
    const dx = (x - 40) / 30; e -= dx * dx * 60;
    m.elev[y * W + x] = e;
    const n = fbm(x * 0.09, y * 0.09, 17, 3);
    m.set(x, y, n > 0.62 ? G.FOREST : n < 0.24 ? G.ROCK : G.GRASS);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = Math.abs(x - 40) > 31 - Math.sin(y * 0.12) * 4;
    if (edge) m.set(x, y, G.SLOPE);
  }
  // the road: dirt from town, then a cobbled/pebbled camino that zig-zags up to the pueblito and the summit
  const road = [[40, 0], [40, 22], [24, 28], [24, 40], [54, 46], [54, 58], [32, 64], [32, 74], [40, 78], [40, 98], [52, 104], [52, 112], [40, 116], [40, 122]];
  for (let i = 0; i < road.length - 1; i++) {
    let [x, y] = road[i]; const [bx, by] = road[i + 1];
    const surf = y < 22 ? G.DIRTROAD : G.ROCKROAD;
    while (x !== bx || y !== by) {
      for (let k = -1; k <= 1; k++) m.set(x + (by === y ? 0 : k), y + (by === y ? k : 0), surf);
      x += Math.sign(bx - x); y += Math.sign(by - y);
    }
  }
  m.markStreet(20, 22, 40, 100, 'Camino empedrado al Cerro de San Francisco');
  m.markStreet(38, 0, 5, 22, 'Camino de terracería (desde Jiquilpan)');
  // the gravity hill: a straight dirt stretch where cars "roll uphill"
  m.markStreet(38, 8, 5, 12, 'La subida mágica');
  sprite(m, 'signpost', 36.2, 12, { text: 'LA SUBIDA MÁGICA', bg: '#7a2f3a', w: 60, up: 30, interact: 'subida' });
  sprite(m, 'rollingCar', 41, 9, { w: 40, up: 30, interact: 'subida' });
  area(m, 'La subida mágica', 34, 6, 12, 16, 'road');
  // La Piedrita: a footpath east to a little waterfall between black rocks
  for (let x = 42; x < 62; x++) { m.set(x, 24, G.DIRT); m.set(x, 25, G.DIRT); }
  for (let y = 24; y < 33; y++) { m.set(60, y, G.DIRT); m.set(61, y, G.DIRT); }
  for (let y = 26; y < 36; y++) for (let x = 56; x < 70; x++) if (((x - 63) / 7) ** 2 + ((y - 31) / 5) ** 2 < 1) m.set(x, y, G.ROCK);
  sprite(m, 'piedrita', 63, 30.4, { scale: 1.2, w: 90, up: 70, collide: [-30, -12, 60, 12], interact: 'piedrita' });
  m.setSolid(58, 27, 11, 3);
  area(m, 'La Piedrita', 55, 24, 16, 12, 'nature');
  sprite(m, 'signpost', 44.5, 23, { text: 'LA PIEDRITA →', bg: '#6b4a30', w: 44, up: 30 });
  // the ranchos along the rocky road: Novoa (near the bottom) and the Salazar (with their horses)
  for (let y = 5; y < 18; y++) for (let x = 45; x < 58; x++) m.set(x, y, G.DIRT);
  building(m, 'ranchHouse', 46, 6, 10, 7, { name: 'RANCHO DE NOVOA', tall: 40 });
  area(m, 'Rancho de Novoa', 45, 5, 13, 13, 'ranch');
  for (let y = 40; y < 57; y++) for (let x = 11; x < 27; x++) m.set(x, y, G.DIRT);
  building(m, 'ranchHouse', 12, 41, 11, 8, { name: 'RANCHO DE LOS SALAZAR', tall: 40 });
  for (const [x, y, w, h] of [[12, 52, 14, 1], [12, 52, 1, 5], [25, 52, 1, 5], [12, 56, 6, 1], [21, 56, 5, 1]]) { m.structures.push({ kind: 'fence', x, y, w, h, layer: 3 }); m.setSolid(x, y, w, h); }
  area(m, 'Rancho de los Salazar', 11, 40, 16, 17, 'ranch');
  // the pueblito of San Francisco, near the top, with its chapel and a couple of stores
  for (let y = 84; y < 108; y++) for (let x = 22; x < 58; x++) if (m.get(x, y) !== G.ROCKROAD) m.set(x, y, G.DIRT);
  building(m, 'capilla', 34, 80, 12, 9, { label: 'SAN FRANCISCO', color: '#f3eee4', tall: 60 });
  door(m, 40, 88, 'capilla_sf', 'Capilla de San Francisco', { hours: [7, 20] });
  area(m, 'Pueblito de San Francisco', 22, 78, 36, 30, 'village');
  m.fill(35, 89, 11, 3, G.PLAZA);
  const vblocks = [[24, 92, 7, 6], [46, 92, 9, 6], [24, 100, 7, 6], [44, 100, 10, 6], [48, 84, 7, 5]];
  door(m, 27, 97, 'tienda_cerro', 'Tiendita del cerro', { hours: [7, 20] });
  door(m, 50, 97, 'tienda_904_ABARROTES', 'Abarrotes La Cumbre', { hours: [8, 19] });
  for (const [x, y, w, h] of vblocks) { block(m, x, y, w, h, { outskirts: true, facadeH: 28, allHouses: true }); addLotDoors(m, m.structures[m.structures.length - 1]); }
  sprite(m, 'lamp', 35.5, 91.8, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, 35.5, 91, 80);
  sprite(m, 'lamp', 45.5, 91.8, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, 45.5, 91, 80);
  sprite(m, 'signpost', 33, 108.5, { text: 'LA CRUZ ↓', bg: '#6b4a30', w: 40, up: 30 });
  // summit plateau: camp, the llano where the lights come down, the cross at the top
  for (let y = 106; y < 136; y++) for (let x = 26; x < 58; x++) {
    const d = ((x - 42) / 15) ** 2 + ((y - 121) / 14) ** 2;
    if (d < 1 && m.get(x, y) !== G.ROCKROAD) m.set(x, y, G.GRASS);
  }
  sprite(m, 'antenna', 50, 131, { scale: 1.3, w: 30, up: 90, collide: [-6, -3, 12, 3] }); m.lights.push({ x: 50 * TILE, y: 120 * TILE, r: 30, color: '#ff4a3a' });
  sprite(m, 'summitCross', CERRO.cross[0], CERRO.cross[1], { scale: 1.3, w: 30, up: 60, collide: [-3, -3, 6, 3], interact: 'cruz' });
  area(m, 'La Cruz (cima del cerro)', 26, 106, 32, 30, 'summit');
  sprite(m, 'campfire', CERRO.camp[0], CERRO.camp[1], { w: 20, up: 20, collide: [-5, -3, 10, 4], interact: 'fogata', acts: [2] });
  sprite(m, 'tent', 36, 118, { color: '#d8792e', w: 34, up: 24, collide: [-12, -4, 24, 4], acts: [2] });
  sprite(m, 'tent', 47, 117.6, { color: '#3c7a8a', w: 34, up: 24, collide: [-12, -4, 24, 4], acts: [2] });
  m.lights.push({ x: CERRO.camp[0] * TILE, y: (CERRO.camp[1] - 0.4) * TILE, r: 110, color: '#ffb35a', kind: 'fire', acts: [2] });
  // vegetation: pines only up high; oak, huizache, giant magueys, nopales and many rocks lower down
  const road2 = (x, y) => [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([a, b]) => m.get(x + a, y + b) === G.ROCKROAD || m.get(x + a, y + b) === G.DIRTROAD);
  for (let i = 0; i < 900; i++) {
    const x = 7 + Math.floor(hash2(i, 1, 55) * (W - 14)), y = 2 + Math.floor(hash2(i, 2, 55) * (H - 4));
    const g = m.get(x, y);
    if (g === G.ROCKROAD || g === G.DIRTROAD || g === G.SLOPE || g === G.DIRT || g === G.PLAZA || g === G.ROOF || m.isSolidTile(x, y)) continue;
    if (y > 108 && y < 134 && x > 30 && x < 54) continue;
    if (((x - 63) / 9) ** 2 + ((y - 31) / 7) ** 2 < 1) continue; // keep La Piedrita open
    if (road2(x, y)) continue;
    const r = hash2(i, 3, 55), high = y > 98;
    if (r < 0.34) tree(m, x + 0.5, y + 0.8, high ? (r < 0.22 ? 'pino' : 'encino') : (r < 0.14 ? 'huizache' : r < 0.26 ? 'encino' : 'fresno'), { size: 0.9 + r });
    else if (r < 0.46) sprite(m, 'maguey', x + 0.5, y + 0.8, { seed: i, size: 1.3 + hash2(i, 4, 55) * 0.7, quiote: hash2(i, 5, 55) > 0.85, w: 60, up: 70, collide: [-6, -3, 12, 3] });
    else if (r < 0.74) sprite(m, 'rock', x + 0.5, y + 0.8, { size: 0.7 + hash2(i, 6, 55) * 1.1, w: 26, up: 18, collide: [-6, -3, 12, 3] });
    else if (r < 0.88) sprite(m, 'nopal', x + 0.5, y + 0.8, { w: 18, up: 24, collide: [-3, -2, 6, 2] });
    else sprite(m, 'bush', x + 0.5, y + 0.8, { seed: i, w: 24, up: 18, collide: [-4, -3, 8, 3] });
  }
  // stones you can move: some hide something
  const LOOT = ['piedra_azul', null, 'punta_flecha', null, null, 'moneda_antigua', null, 'punta_flecha', null, 'piedra_azul'];
  const spots = [[30, 18], [48, 34], [20, 44], [58, 52], [28, 60], [48, 64], [20, 96], [58, 100], [30, 108], [52, 132], [60, 40], [18, 70]];
  spots.forEach(([x, y], k) => {
    if (m.isSolidTile(x, y) || m.get(x, y) === G.ROCKROAD) m.set(x, y, G.GRASS);
    sprite(m, 'boulder', x + 0.5, y + 0.8, { rid: k, loot: LOOT[k % LOOT.length], size: 1.2, w: 30, up: 22, collide: [-8, -3, 16, 3], interact: 'push' });
  });
  sprite(m, 'signpost', 42.5, 4, { text: 'JIQUILPAN ↑', bg: '#6b4a30', w: 40, up: 30 });
  m.exits.push({ x: 38, y: 0, w: 5, h: 1, to: 'town', tx: 2.5, ty: 19.6, dir: 3, label: 'Bajar a Jiquilpan' });
  m.road = CERRO.road;
  m.spawns = { bottom: { x: CERRO.entry[0], y: CERRO.entry[1] }, entry: { x: CERRO.entry[0], y: CERRO.entry[1] }, summit: { x: 40, y: 117 } };
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
