// Jiquilpan de Juárez — the town map (north is up; 1 tile ≈ 5 m, distances compressed a little).
//
// Layout follows the real town as far as public maps and photos allow:
//  * Av. Presidente Lázaro Cárdenas is the north–south spine (Norte / Sur). North it leaves for
//    Sahuayo; along it south of the plaza stand the Biblioteca Gabino Ortiz (between Abasolo and
//    5 de Mayo), the Casa de Lázaro Cárdenas facing the Escuela “La Tipo”, the stadium, and it ends
//    at the bosques, where dirt roads climb to the Cerro de San Francisco (south of town).
//  * The Plaza Principal is on Calle Diego José Abad, west of the avenue, with the Parque Zaragoza
//    (statue + two greyhounds by Durenne) on its east side; across the avenue, the Palacio Municipal.
//  * The Parroquia de San Francisco is at Fajardo and Abasolo Oriente.
//  * The MEX 15 leaves east toward Totolán / Zamora, with the Pueblo Mágico roundabout at the entrance.
//  * Av. Las Palmas runs diagonally north-west to La Trasquila hill: tricolor stairs climb to “La Botellita”.
//  * The Monumento a Juárez and its escalinata stand on a rise behind the stadium, among cobbled lanes.
import { GameMap, G, ROADS } from '../world.js';
import { fbm, hash2, TILE } from '../util.js';
import { hStreet, vStreet, laneLoop, sprite, building, block, tree, door, area, light, ensureLanes, diagonalRoad, river, distToPolyline } from './build.js';
import { blockLots } from '../render/structures.js';
import { randomModel } from '../entities.js';

export const TOWN_W = 300, TOWN_H = 334;
export const PALMAS = [[148, 12], [118, 22], [90, 34], [66, 43]];

export function buildTown() {
  const m = new GameMap('town', 'Jiquilpan de Juárez', TOWN_W, TOWN_H, { fill: G.GRASS, baseElev: 1552 });
  m.potholes = true;
  ensureLanes(m);
  m.daySprites = {}; m.closedByDay = {};
  m.floodZones = [];

  // --- elevation (m): the valley floor rises south toward the bosques and the Cerro de San
  // Francisco, falls north toward Sahuayo and the Ciénega, and La Trasquila hill stands to the west.
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    let e = 1552 + (fbm(x * 0.03, y * 0.03, 11, 3) - 0.5) * 5;
    if (y > 150) e += (y - 150) * 0.2;
    if (y < 25) e -= (25 - y) * 0.25;
    if (x < 110) e += (110 - x) * 0.07;                       // the west side is higher (water runs east)
    e += (300 - x) * 0.012;                                   // …and the valley tilts a little east, toward the river
    const tq = ((x - 46) ** 2 + (y - 66) ** 2) / (2 * 17 * 17); e += 46 * Math.exp(-tq); // La Trasquila (La Botellita on top)
    const ej = ((x - 172) ** 2 + (y - 238) ** 2) / (2 * 7 * 7); e += 9 * Math.exp(-ej); // the little rise of the Monumento a Juárez
    const sc = ((x - 40) ** 2 + (y - 30) ** 2) / (2 * 20 * 20); e += 22 * Math.exp(-sc); // San Cayetano
    const jp = ((x - 171) ** 2 + (y - 52) ** 2) / (2 * 7 * 7); e -= 5 * Math.exp(-jp);   // Jardín de la Paz sits in a dip
    m.elev[y * m.w + x] = e;
  }

  // --- countryside ------------------------------------------------------------------
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const n = fbm(x * 0.07, y * 0.07, 5, 3);
    if (y < 18 || x > 262 || x < 26) m.set(x, y, n > 0.56 ? G.FIELD : G.GRASS);
  }

  // --- streets ------------------------------------------------------------------------
  const VX = [[28, 'Calle Caltzontzin'], [50, 'Calle Ocampo'], [74, 'Calle Rioseco'], [94, 'Calle Guillermo Prieto'], [110, 'Calle Hidalgo'],
    [186, 'Calle Fajardo'], [210, 'Calle Morelos'], [234, 'Calle Allende']];
  const HY = [[18, 'Calle Nicolás Bravo'], [40, 'Calle Constitución'], [60, 'Calle Madero'], [80, 'Calle Pino Suárez'], [110, 'Calle Diego José Abad'],
    [124, 'Calle Abasolo'], [140, 'Calle 5 de Mayo'], [156, 'Calle Vicente Guerrero']];
  const HILL = (x, y) => x < 58 && y > 44 && y < 108; // La Trasquila: no grid on the hill
  const cob = (name) => /Rioseco|Prieto|Caltzontzin|Ocampo|Allende|Constitución|Nicolás/.test(name) ? G.COBBLE : G.ASPHALT;
  // Centro streets are one-way with a parking lane on one side (like the real town: narrow, but cars park)
  // (horizontal and vertical streets are keyed separately: y=110 is Diego José Abad, x=110 is Hidalgo)
  const ONEWAY_H = { 40: ['E', 1], 60: ['E', 1], 80: ['W', 0], 110: ['W', 0], 124: ['E', 1], 140: ['W', 0] };
  const ONEWAY_V = { 74: ['N', 0], 94: ['N', 0], 110: ['S', 1], 186: ['N', 0], 210: ['S', 1] };
  const owH = (k) => ONEWAY_H[k] ? { oneWay: ONEWAY_H[k][0], park: ONEWAY_H[k][1] } : {};
  const owV = (k) => ONEWAY_V[k] ? { oneWay: ONEWAY_V[k][0], park: ONEWAY_V[k][1] } : {};
  for (const [y, name] of HY) {
    const segs = [[28, 262]];
    if (y === 60 || y === 80) segs[0][0] = 58;
    if (y === 140) segs.splice(0, 1, [28, 190], [210, 262]); // San Francisco's atrium interrupts 5 de Mayo
    for (const [a, b] of segs) hStreet(m, name, a, b, y, 4, { surface: cob(name), ...owH(y) });
  }
  for (const [x, name] of VX) {
    const y1 = x >= 210 ? 172 : 228;
    if (x < 58) { vStreet(m, name, x, 18, 44, 4, { surface: G.COBBLE }); vStreet(m, name, x, 106, y1, 4, { surface: G.COBBLE }); }
    else vStreet(m, name, x, 18, y1, 4, { surface: cob(name), ...owV(x) });
  }
  // the avenue: formal cantera sidewalks, asphalt; north to Sahuayo, south to the bosques
  vStreet(m, 'Av. Presidente Lázaro Cárdenas Norte', 150, 0, 110, 6, { surface: G.ASPHALT, walkSurface: G.CANTERA });
  vStreet(m, 'Av. Presidente Lázaro Cárdenas Sur', 150, 110, 244, 6, { surface: G.ASPHALT, walkSurface: G.CANTERA });
  vStreet(m, 'Camino del Bosque', 150, 244, m.h, 4, { surface: G.DIRTROAD, sidewalk: false });
  // the way to the Cerro is a stone footpath: no cars go up there
  m.fill(0, 19, 28, 2, G.ROCKROAD); m.markStreet(0, 18, 28, 4, 'Camino empedrado al Cerro de San Francisco');
  vStreet(m, 'Av. Circunvalación', 258, 18, 179, 6, { surface: G.ASPHALT });
  // south side streets
  hStreet(m, 'Calle Felicitas del Río', 28, 150, 172, 4, { surface: G.ASPHALT });
  hStreet(m, 'Carretera Jiquilpan–Zamora (MEX 15)', 150, 262, 171, 8, { surface: G.ASPHALT });
  hStreet(m, 'Carretera Jiquilpan–Zamora (MEX 15)', 262, 300, 171, 8, { surface: G.ASPHALT, median: true });
  hStreet(m, 'Calle Álvaro Obregón', 28, 150, 200, 4, { surface: G.COBBLE });
  hStreet(m, 'Calle al Bosque', 28, 262, 224, 4, { surface: G.DIRTROAD, sidewalk: false });
  // Diego José Abad is the plaza's street: formal sidewalks too
  for (let x = 28; x < 262; x++) for (const y of [110, 113]) if (!ROADS.has(m.get(x, y))) m.set(x, y, G.CANTERA);
  // dirt roads out of town
  vStreet(m, 'Camino a los corrales', 266, 22, 30, 3, { surface: G.DIRTROAD, sidewalk: false });
  hStreet(m, 'Brecha del Chamacuero', 4, 28, 35, 3, { surface: G.DIRTROAD, sidewalk: false });
  // Av. Las Palmas: diagonal, planted with palms, climbing to La Trasquila
  diagonalRoad(m, 'Av. Las Palmas', PALMAS, 10, { median: 2 });
  for (let i = 0; i < PALMAS.length - 1; i++) {
    const [ax, ay] = PALMAS[i], [bx, by] = PALMAS[i + 1], L = Math.hypot(bx - ax, by - ay);
    for (let d = 1.5; d < L; d += 3.2) tree(m, ax + (bx - ax) * d / L, ay + (by - ay) * d / L + 0.4, 'palma', { size: 0.95, collide: [-2, -2, 4, 3] });
  }

  // Fuente de los Pescados on the median, and the Maseca tortillería at the curve
  sprite(m, 'pescados', 104, 28.1, { scale: 1.25, w: 40, up: 40, collide: [-10, -6, 20, 6], interact: 'pescados' });
  area(m, 'Fuente de los Pescados', 101, 26, 6, 5, 'monument');
  block(m, 78, 23, 8, 6, { facadeH: 30, outskirts: true, facades: [{ x: 78, w: 8, exact: true, kind: 'shop', sign: 'TORTILLERÍA', signBg: '#f2c230', signFg: '#b01c1c', fh: 30 }] });
  door(m, 82, 28, 'tortilleria', 'Tortillería de la curva (Maseca)', { hours: [6, 15] });
  area(m, 'Tortillería de la curva', 78, 23, 8, 6, 'shop');

  // --- La Trasquila hill: the tricolor stairs from Constitución up to La Botellita (the obelisk) ---------------
  // Across the street, at the foot of the stairs, the Modelorama of Las Palmas.
  for (let y = 44; y < 108; y++) for (let x = 6; x < 58; x++) if (HILL(x, y) && !ROADS.has(m.get(x, y))) m.set(x, y, fbm(x * 0.1, y * 0.1, 3) > 0.52 ? G.FOREST : G.GRASS);
  const STX = 54, STY = 44, STH = 16;               // the stairs: 3 tiles wide, 16 long
  m.fill(46, STY + STH, 12, 8, G.PLAZA);            // the mirador on top
  m.fill(STX, STY, 3, STH, G.STAIRS);
  m.structures.push({ kind: 'tricolorSteps', x: STX, y: STY, w: 3, h: STH, layer: 2, margin: 0 });
  sprite(m, 'obelisco', 52, STY + STH + 4.6, { scale: 1.35, w: 60, up: 100, collide: [-10, -8, 20, 8], interact: 'obelisco' });
  for (let x = 46.4; x < 57.8; x += 1.1) if (x < STX - 0.4 || x > STX + 3.2) sprite(m, 'balustre', x, STY + STH + 0.7, { w: 8, up: 12, collide: [-2, -2, 4, 2] });
  for (let y = STY + STH + 1.5; y < STY + STH + 8; y += 1.1) for (const x of [46.4, 57.6]) sprite(m, 'balustre', x, y, { w: 8, up: 12, collide: [-2, -2, 4, 2] });
  for (const [bx, by] of [[49, STY + STH + 2.2], [55, STY + STH + 7.2]]) sprite(m, 'bench', bx, by, { w: 22, up: 14, collide: [-8, -4, 16, 4], seat: true });
  // wild trees on both sides of the stairs: jacarandas, fresnos, a huizache
  for (let y = STY + 1; y < STY + STH; y += 2.6) { tree(m, STX - 1.2, y + 0.6, ['jacaranda', 'fresno', 'jacaranda', 'huizache'][Math.floor(y) % 4], { size: 0.9 + (y % 3) * 0.08, collide: [-2, -2, 4, 3] }); if (y < STY + STH - 2) tree(m, STX + 4.2, y + 1.6, ['fresno', 'jacaranda', 'eucalipto'][Math.floor(y) % 3], { size: 0.95, collide: [-2, -2, 4, 3] }); }
  for (const [x, y] of [[40, 50], [30, 52], [20, 60], [14, 80], [44, 84], [22, 96], [50, 98], [12, 50], [36, 70]]) tree(m, x, y, 'jacaranda', { size: 1.1 });
  for (let i = 0; i < 70; i++) {
    const x = 7 + Math.floor(hash2(i, 1, 99) * 50), y = 45 + Math.floor(hash2(i, 2, 99) * 62);
    if (!HILL(x, y) || m.get(x, y) === G.PLAZA || m.get(x, y) === G.STAIRS || (x > STX - 9 && x < STX + 5 && y < STY + STH + 9)) continue;
    const kinds = ['jacaranda', 'eucalipto', 'fresno', 'bush', 'huizache', 'jacaranda'];
    const k = kinds[Math.floor(hash2(i, 3, 99) * kinds.length)];
    if (k === 'bush') sprite(m, 'bush', x + 0.5, y + 0.8, { seed: i, w: 24, up: 18, collide: [-4, -3, 8, 3] });
    else tree(m, x + 0.5, y + 0.8, k);
  }
  area(m, 'Cerrito de La Trasquila', 6, 44, 52, 62, 'park');
  sprite(m, 'label', 50.5, STY + STH + 6.6, { w: 4, up: 4, interact: 'cielo' });
  area(m, 'Mirador de La Trasquila — “La Botellita”', 46, STY + STH, 12, 8, 'monument');
  area(m, 'Escalones de La Trasquila (los tricolores)', STX, STY, 3, STH, 'stairs');

  // --- Plaza Principal (Jardín) --------------------------------------------------------------
  const PX = 114, PY = 93, PW = 24, PH = 17;
  m.fill(PX, 84, 36, 26, G.PLAZA);
  area(m, 'Plaza Principal', PX, PY, PW, PH, 'plaza');
  // north side: the casona of Nacho Marín (NW corner), the andador, the Casa de la Cultura
  building(m, 'casona', 114, 84, 10, 9, { tall: 50 });
  door(m, 119, 92, 'casa_marin', 'Casa de la familia Marín');
  area(m, 'Casa de Nacho Marín', 114, 84, 10, 9, 'home');
  area(m, 'Andador de la Cultura', 124, 84, 3, 9, 'plaza');
  building(m, 'casacultura', 127, 84, 11, 9, { tall: 50 });
  door(m, 132, 92, 'casa_cultura', 'Casa de la Cultura', { hours: [9, 21] });
  area(m, 'Casa de la Cultura', 127, 84, 11, 9, 'building');
  sprite(m, 'plaque', 129.5, 93.2, { who: 'ocaranza', w: 12, up: 12, interact: 'plaque_ocaranza' });
  sprite(m, 'plaque', 124.3, 92.6, { who: 'bejar', w: 12, up: 12, interact: 'plaque_bejar' });
  // “los tubos”: the steel-pipe pergola behind the Casa de la Cultura, where El Güero sets up at night
  sprite(m, 'tubos', 128.5, 83.5, { scale: 1.2, w: 30, up: 40 });
  // gardens with iron fences, boxy ficus with whitewashed trunks, jacarandas, iron benches
  const gardens = [[115, 95, 8, 4], [128, 95, 9, 4], [115, 104, 7, 4], [133, 104, 4, 4]];
  for (const [x, y, w, h] of gardens) { m.fill(x, y, w, h, G.GARDEN); m.setSolid(x, y, w, h); m.structures.push({ kind: 'ironFence', x, y, w, h, layer: 3 }); }
  for (const [x, y, k] of [[117, 97, 'ficus'], [121, 97.5, 'ficus'], [130, 97, 'ficus'], [134.5, 97.5, 'ficus'], [117, 106, 'ficus'], [120.5, 106.5, 'flamboyan'], [135, 106.5, 'ficus'], [114.6, 101, 'flamboyan'], [137.4, 101, 'jacaranda']]) tree(m, x, y, k, { size: k === 'ficus' ? 1.05 : 1.15, collide: [-2, -2, 4, 3] });
  sprite(m, 'kiosco', 126, 104.2, { scale: 1.5, w: 90, up: 100, interact: 'kiosco', priority: true });
  m.setSolid(123, 100, 6, 4);
  light(m, 126, 99, 110, '#ffe2a8');
  sprite(m, 'aguadora', 131.8, 109.3, { scale: 1.35, w: 76, up: 84, collide: [-26, -12, 52, 11], interact: 'aguadora' });
  light(m, 131.8, 107.9, 60, '#ff9a5a');
  for (const [bx, by] of [[118, 94.2], [132, 94.2], [123.2, 99.5], [129.8, 99.5], [118, 103.2], [123.5, 108.8], [133.5, 102.6]]) sprite(m, 'ironBench', bx, by, { w: 24, up: 18, collide: [-9, -3, 18, 3], seat: true });
  for (const [lx, ly] of [[114.5, 93.8], [137.5, 93.8], [114.5, 109.4], [137.5, 109.4], [122, 101], [130, 101]]) { sprite(m, 'farolDoble', lx, ly, { w: 22, up: 54, collide: [-1, -1, 2, 2] }); light(m, lx, ly - 2, 80, '#fff1cf'); }
  sprite(m, 'plaque', 134.9, 110.1, { who: 'canessi', w: 12, up: 12, interact: 'plaque_canessi' });
  // Parque Zaragoza: the general's statue and the two greyhounds facing east, toward the Palacio
  m.fill(138, 84, 12, 26, G.GARDEN); m.fill(141, 92, 6, 10, G.PLAZA); m.fill(146, 93, 4, 8, G.PLAZA);
  sprite(m, 'zaragoza', 144, 97.4, { scale: 1.3, w: 40, up: 70, collide: [-9, -8, 18, 8], interact: 'zaragoza' });
  sprite(m, 'galgo', 148.4, 94.6, { scale: 1.15, w: 30, up: 24, collide: [-8, -5, 16, 5], interact: 'galgos' });
  sprite(m, 'galgo', 148.4, 100.4, { scale: 1.15, w: 30, up: 24, collide: [-8, -5, 16, 5], interact: 'galgos' });
  for (const [x, y] of [[139.5, 86], [148, 86], [139.5, 108], [148, 108], [143, 88]]) tree(m, x, y, x < 143 ? 'jacaranda' : 'ficus', { size: 1 });
  area(m, 'Parque Ignacio Zaragoza', 138, 84, 12, 26, 'park');
  // portales south of Diego José Abad: a walkable arcade facing the plaza
  m.fill(114, 114, 36, 2, G.FLOOR_STONE);
  block(m, 114, 116, 36, 8, { facadeH: 34, allHouses: false,
    facades: [{ x: 141, w: 9, exact: true, kind: 'shop', sign: 'TORTILLERÍA MARÍN', signBg: '#f5e6c8', signFg: '#7a1f1a', fh: 34 }] });
  // Seen from above (the camera looks north), a north-facing arcade shows its tiled roof, the cantera
  // cornice and the column heads along the edge; it fades out while you walk underneath.
  sprite(m, 'portalRoof', 132, 116, { fw: 36 * TILE, w: 36 * TILE + 8, up: 44, overlay: [114, 113.7, 36, 2.3], blueFrom: 26 * TILE,
    signs: [[4, 'LA COCHERA', '#2b2420', '#e9d7b0'], [10, 'NIEVES', '#f5e6ef', '#b2386b'], [17, 'HOTEL PLAZA TARASCA', '#3f3a33', '#f1e2b8'], [30, 'PORTAL AZUL', '#2e6fb3', '#ffffff']] });
  for (let x = 114.5; x < 150; x += 2) sprite(m, 'label', x, 114.15, { w: 4, up: 4, collide: [-1.4, -2, 2.8, 2] });
  area(m, 'Portales de la Plaza', 114, 114, 26, 2, 'portal');
  area(m, 'Portal Azul', 140, 114, 10, 2, 'portal');
  door(m, 118, 116, 'la_cochera', 'La Cochera (café)', { fromSouth: true, hours: [8, 22] });
  door(m, 124, 116, 'portal_nieves', 'Nevería del Portal', { fromSouth: true, hours: [10, 22] });
  door(m, 131, 116, 'hotel_tarasca', 'Hotel Plaza Tarasca · Portal Hidalgo 12', { fromSouth: true });
  door(m, 144, 116, 'portal_azul', 'Portal Azul — cenaduría', { fromSouth: true, hours: [9, 23] });
  door(m, 145, 123, 'tortilleria_marin', 'Tortillería Marín', { hours: [6, 15] });

  // --- east of the avenue: Palacio Municipal, busto de Diego José Abad, mercado, panadería ----------
  building(m, 'palacio', 156, 84, 30, 21, { tall: 90 });
  m.fill(156, 105, 30, 5, G.PLAZA);
  door(m, 170, 104, 'palacio', 'Palacio Municipal', { hours: [8, 15] });
  area(m, 'Palacio Municipal (H. Ayuntamiento)', 156, 84, 30, 26, 'building');
  sprite(m, 'bustoAbad', 160, 108.2, { scale: 1.1, w: 44, up: 58, collide: [-15, -6, 30, 6], interact: 'abad' });
  sprite(m, 'flagpole', 182, 108.6, { w: 30, up: 60, collide: [-1, -1, 2, 2] });
  building(m, 'mercado', 190, 84, 20, 26);
  door(m, 200, 109, 'mercado', 'Mercado Municipal', { hours: [7, 18] });
  door(m, 200, 84, 'mercado', 'Mercado (puerta de atrás)', { hours: [7, 18], fromNorth: true });
  area(m, 'Mercado Municipal', 190, 84, 20, 26, 'building');
  building(m, 'panaderia', 190, 64, 20, 16);
  door(m, 195, 79, 'panaderia', 'Panadería Mendoza', { hours: [7, 21] });
  door(m, 205, 79, 'billar_mendoza', 'Billar (arriba de la Mendoza)', { hours: [12, 24] });
  area(m, 'Panadería Mendoza', 190, 64, 20, 16, 'building');
  sprite(m, 'sitio', 189.5, 99, { scale: 1.2, w: 20, up: 24, collide: [-7, -3, 14, 3], interact: 'sitio', sitio: 'Fajardo' });
  area(m, 'Sitio de taxis Fajardo', 186, 92, 4, 12, 'taxi');
  for (const ty of [93.2, 95.6, 103.2]) sprite(m, 'parkedCarV', 187.5, ty, { color: '#f4f4f0', taxi: true, model: 'tsuru', w: 26, up: 40, collide: [-6, -12, 12, 22], notDays: [6] });

  // --- south of the plaza along the avenue ----------------------------------------------------------
  block(m, 114, 128, 16, 12, { facades: [
    { x: 114, w: 8, exact: true, kind: 'shop', sign: 'ESTÉTICA LUPITA', signBg: '#f7c6d9', signFg: '#8a2f5a', fh: 36 },
    { x: 122, w: 8, exact: true, kind: 'shop', sign: 'ROPA Y NOVEDADES', signBg: '#f3d36b', signFg: '#1f4b7a', fh: 36 }] });
  door(m, 118, 139, 'tienda_902_ESTÉTICA', 'Estética Lupita (cortes y rasurada)', { hours: [9, 20] });
  door(m, 126, 139, 'tienda_903_NOVEDADES', 'Ropa y Novedades', { hours: [9, 21] });
  building(m, 'biblioteca', 130, 128, 20, 12, { tall: 90 });
  door(m, 140, 139, 'biblioteca', 'Biblioteca Pública Gabino Ortiz', { hours: [9, 19] });
  area(m, 'Biblioteca Pública Gabino Ortiz', 130, 128, 20, 12, 'building');
  sprite(m, 'plaque', 144.5, 140.2, { who: 'gabino', w: 12, up: 12, interact: 'plaque_gabino' });
  // Sitio de taxis on Calle Abasolo, between the avenue and Fajardo
  sprite(m, 'sitio', 163.5, 127.95, { scale: 1.2, w: 20, up: 24, collide: [-7, -3, 14, 3], interact: 'sitio', sitio: 'Abasolo' });
  area(m, 'Sitio de taxis Abasolo', 158, 124, 16, 4, 'taxi');
  for (const tx of [167.5, 170.5, 173.5]) sprite(m, 'parkedCar', tx, 126.95, { color: '#f4f4f0', taxi: true, model: 'tsuru', w: 44, up: 30, collide: [-14, -6, 28, 6] });
  building(m, 'escuelaTipo', 114, 144, 36, 12, { tall: 60 });
  door(m, 132, 155, 'escuela_tipo', 'Escuela “La Tipo”', { hours: [7, 14] });
  area(m, 'Escuela “La Tipo”', 114, 144, 36, 12, 'building');
  building(m, 'casaCardenas', 156, 144, 30, 12, { tall: 60 });
  door(m, 171, 155, 'casa_cardenas', 'Casa de Lázaro Cárdenas (museo)', { hours: [10, 17] });
  area(m, 'Casa de Lázaro Cárdenas', 156, 144, 30, 12, 'building');
  sprite(m, 'plaque', 165, 156.2, { who: 'cardenas', w: 12, up: 12, interact: 'plaque_cardenas' });
  block(m, 156, 128, 30, 12, { facades: [{ x: 160, w: 7, exact: true, kind: 'shop', sign: 'MICHELADAS NORMA', signBg: '#1f4fa0', signFg: '#fff', fh: 36 }] });
  door(m, 163, 139, 'micheladas_norma', 'Micheladas de Norma', { hours: [12, 24] });
  sprite(m, 'mesas', 163.5, 141, { color: '#1f4fa0', w: 44, up: 40, collide: [-18, -4, 36, 4] });
  block(m, 156, 114, 30, 10);

  // --- Parroquia de San Francisco (Fajardo y Abasolo Ote.) with its curato and atrium ------------------
  m.fill(190, 128, 20, 28, G.HEX);
  building(m, 'sanfrancisco', 190, 128, 10, 15, { tall: 150, ground: G.GARDEN });
  building(m, 'curato', 200, 128, 10, 13, { tall: 40 });
  door(m, 195, 142, 'templo_sf', 'Parroquia de San Francisco de Asís', { hours: [6, 21] });
  door(m, 205, 140, 'curato', 'Curato de San Francisco', { hours: [9, 14] });
  for (const [x, y] of [[191, 150], [208.5, 150], [191, 154.5], [208.5, 154.5]]) tree(m, x, y, y < 152 ? 'jacaranda' : 'palma', { size: 0.95 });
  sprite(m, 'estatuaFraile', 193.2, 146.6, { scale: 1.2, w: 24, up: 54, collide: [-7, -4, 14, 4], interact: 'fraile' });
  tree(m, 206.5, 146.4, 'cipres', { size: 1.25, collide: [-2, -2, 4, 3] });
  for (const [bx, by] of [[196, 149], [203, 149]]) sprite(m, 'bench', bx, by, { w: 22, up: 14, collide: [-8, -4, 16, 4], seat: true });
  area(m, 'Parroquia de San Francisco de Asís', 190, 128, 20, 15, 'building');
  area(m, 'Atrio de San Francisco', 190, 143, 20, 13, 'plaza');

  // --- west side: Templo de las Monjas, Sagrado Corazón, obelisco, IMSS ---------------------------------
  m.fill(78, 84, 16, 26, G.PLAZA);
  building(m, 'monjas', 78, 84, 16, 18);
  door(m, 86, 101, 'templo_monjas', 'Templo de las Monjas', { hours: [7, 20] });
  tree(m, 79.5, 107, 'jacaranda', { size: 1 }); tree(m, 92.5, 107, 'jacaranda', { size: 1 });
  area(m, 'Templo de las Monjas', 78, 84, 16, 26, 'building');
  m.fill(78, 64, 16, 16, G.PLAZA);
  building(m, 'santuario', 80, 64, 12, 12, { tall: 170, ground: G.GARDEN });
  door(m, 86, 75, 'santuario', 'Santuario del Sagrado Corazón', { hours: [6, 21] });
  for (const [x, y] of [[78.8, 67], [93.2, 67], [78.8, 78.6], [93.2, 78.6]]) tree(m, x, y, 'ficus', { size: 0.85, collide: [-2, -2, 4, 3] });
  area(m, 'Santuario del Sagrado Corazón', 78, 64, 16, 16, 'building');
  m.fill(78, 128, 16, 12, G.PLAZA); m.fill(80, 130, 12, 8, G.GARDEN); m.fill(84, 130, 4, 8, G.PLAZA);
  sprite(m, 'fuenteChica', 86, 135.2, { scale: 1.2, w: 30, up: 30, collide: [-8, -4, 16, 5] });
  for (const [x, y] of [[81, 131], [91, 131], [81, 138], [91, 138]]) tree(m, x, y, 'jacaranda', { size: 0.9 });
  area(m, 'Jardín Rioseco y Ornelas', 78, 128, 16, 12, 'park');
  building(m, 'hospital', 54, 84, 20, 22, { label: 'CLÍNICA IMSS', tall: 60 });
  door(m, 64, 105, 'hospital', 'Clínica IMSS');
  area(m, 'Clínica IMSS', 54, 84, 20, 22, 'building');
  block(m, 98, 144, 12, 12, { facades: [
    { x: 98, w: 6, exact: true, kind: 'shop', sign: 'FRIJOLES', signBg: '#f3d36b', signFg: '#5a2d0c', fh: 36 },
    { x: 104, w: 6, exact: true, kind: 'shop', sign: 'CARNICERÍA', signBg: '#f6f1e6', signFg: '#a01818', fh: 36 }] });
  door(m, 101, 155, 'frijoles', 'Tienda “Frijoles”', { hours: [8, 22] });
  door(m, 107, 155, 'carniceria', 'Carnicería de la esquina', { hours: [7, 20] });
  area(m, 'Tienda “Frijoles”', 98, 144, 6, 12, 'shop');
  block(m, 74 + 4, 44, 16, 16, { facades: [{ x: 80, w: 8, exact: true, kind: 'shop', sign: 'MICHELADAS LUPITA', signBg: '#d4302b', signFg: '#fff', fh: 36 }] });
  door(m, 84, 59, 'micheladas_lupita', 'Micheladas Lupita', { hours: [11, 24] });
  sprite(m, 'mesas', 84.5, 60.95, { color: '#d4302b', w: 44, up: 40, collide: [-18, -4, 36, 4] });

  // --- Jardín de la Paz (north, between the avenue and Fajardo) and the Cremería ---------------------------
  // Once the town's old cemetery. Open lawns you can cross, a perimeter walk where people do their laps,
  // two diagonal walks crossing in an X, a ring path and, at the centre, the sculpture of Lucía de la Paz.
  m.fill(156, 44, 30, 16, G.GARDEN);
  const PZ = { x: 156, y: 44, w: 30, h: 16, cx: 171, cy: 52 };
  const pazPaths = { kind: 'pazPaths', ...PZ, layer: 1, margin: 0 };
  m.structures.push(pazPaths);
  m.walkway = m.walkway || new Uint8Array(m.w * m.h);
  for (let y = PZ.y; y < PZ.y + PZ.h; y++) for (let x = PZ.x; x < PZ.x + PZ.w; x++) {
    const px = x + 0.5, py = y + 0.5, edge = x === PZ.x || y === PZ.y || x === PZ.x + PZ.w - 1 || y === PZ.y + PZ.h - 1;
    const d1 = distToPolyline(px, py, [[PZ.x + 1, PZ.y + 1], [PZ.x + PZ.w - 1, PZ.y + PZ.h - 1]]), d2 = distToPolyline(px, py, [[PZ.x + PZ.w - 1, PZ.y + 1], [PZ.x + 1, PZ.y + PZ.h - 1]]);
    const rr = Math.hypot((px - PZ.cx) / 1, (py - PZ.cy) * 1.25);
    if (edge || d1 < 0.9 || d2 < 0.9 || Math.abs(rr - 5.6) < 0.7 || rr < 2.8) m.walkway[y * m.w + x] = 1;
  }
  sprite(m, 'luciaPaz', PZ.cx, PZ.cy + 0.6, { scale: 1.2, w: 34, up: 62, collide: [-6, -5, 12, 6], interact: 'lucia_paz' });
  const pazTrees = [[160, 47, 'fresno'], [163.5, 50, 'laurel'], [159.5, 55.5, 'jacaranda'], [164, 57.6, 'fresno'], [182, 47, 'laurel'], [178.5, 49.6, 'jacaranda'], [182.5, 56, 'fresno'], [178, 57.6, 'laurel'],
    [167, 46.2, 'jacaranda'], [175, 46.2, 'jacaranda'], [168.5, 58.6, 'flamboyan'], [174, 58.6, 'jacaranda']];
  for (const [x, y, k] of pazTrees) tree(m, x, y, k, { size: 1.15 + hash2(x, y, 3) * 0.2, collide: [-2, -2, 4, 3] });
  for (const [bx, by] of [[171, 47.2], [171, 57.6], [165.3, 52.6], [176.7, 52.6], [157.2, 50.4], [184.8, 50.4]]) sprite(m, 'ironBench', bx, by, { w: 24, up: 18, collide: [-9, -3, 18, 3], seat: true });
  for (const [lx, ly] of [[156.6, 44.6], [185.4, 44.6], [156.6, 59.6], [185.4, 59.6], [166, 52], [176, 52]]) { sprite(m, 'farolDoble', lx, ly, { w: 22, up: 54, collide: [-1, -1, 2, 2] }); light(m, lx, ly - 2, 74, '#fff1cf'); }
  // Tacos Pizarro, on the corner of the jardín that faces Av. Lázaro Cárdenas (only at night: see npcs)
  m.floodZones.push({ x: 156, y: 44, w: 30, h: 16 });
  area(m, 'Jardín de la Paz', 156, 44, 30, 16, 'plaza');
  sprite(m, 'seTraspasa', 184.2, 45.4, { label: 'ELOTES Y ESQUITES', w: 30, up: 30, collide: [-2, -2, 4, 2], interact: 'negocio', biz: 'elotes' });
  block(m, 156, 22, 30, 18, { facades: [{ x: 166, w: 9, exact: true, kind: 'shop', sign: 'CREMERÍA LA PAZ', signBg: '#f6f1e6', signFg: '#2f5d9a', fh: 36 }] });
  door(m, 170, 39, 'tienda_901_CREMERÍA', 'Cremería La Paz', { hours: [8, 21] });
  area(m, 'Cremería La Paz', 166, 22, 9, 18, 'shop');

  // --- east side: hospital, abuela, micheladas ---------------------------------------
  building(m, 'hospital', 214, 128, 20, 12, { label: 'ISSSTE · CLÍNICA HOSPITAL', issste: true, tall: 60 });
  door(m, 224, 139, 'hospital', 'ISSSTE — Clínica Hospital Jiquilpan');
  area(m, 'Clínica Hospital del ISSSTE', 214, 128, 20, 12, 'building');
  block(m, 214, 144, 7, 12); block(m, 229, 144, 5, 12);
  building(m, 'casaAbuela', 221, 147, 8, 9, { tall: 40 });
  m.fill(221, 144, 8, 3, G.ROOF); m.setSolid(221, 144, 8, 3);
  door(m, 225, 155, 'casa_abuela', 'Casa de la abuela Chayo');
  area(m, 'Casa de la abuela', 221, 144, 8, 12, 'home');
  block(m, 238, 160, 20, 11, { facades: [{ x: 241, w: 8, exact: true, kind: 'shop', sign: 'MICHELADAS DE NICO', signBg: '#f2c230', signFg: '#1b1b1b', fh: 36 }] });
  door(m, 245, 170, 'micheladas_nico', 'Micheladas de Nico', { hours: [12, 24] });
  sprite(m, 'mesas', 244.5, 172.1, { color: '#f2c230', w: 44, up: 40, collide: [-18, -4, 36, 4] });
  block(m, 238, 128, 20, 12, { facades: [{ x: 240, w: 8, exact: true, kind: 'shop', sign: 'LA PANTERA ROSA', signBg: '#f06aa8', signFg: '#fff', wall: '#f7c6dc', band: '#c2447e', fh: 36 }] });
  door(m, 244, 139, 'pantera_rosa', 'Micheladas La Pantera Rosa', { hours: [12, 24] });
  sprite(m, 'mesas', 244.5, 141, { color: '#f06aa8', w: 44, up: 40, collide: [-18, -4, 36, 4] });

  // --- stadium, UAER, Monumento a Lázaro Cárdenas -------------------------------------------------------
  const SX = 156, SY = 180, SW = 50, SH = 43;
  m.fill(SX, SY, SW, SH, G.DIRT); // the field is bare earth, as in the photos
  const wall = (x, y, w, h) => { m.structures.push({ kind: 'wall', x, y, w, h, color: '#e6ddcc', layer: 3 }); m.setSolid(x, y, w, h); };
  wall(SX, SY, 12, 1); wall(SX + 18, SY, SW - 18, 1); wall(SX, SY, 1, SH); wall(SX + SW - 1, SY, 1, SH);
  wall(SX, SY + SH - 1, 38, 1); wall(SX + 42, SY + SH - 1, SW - 42, 1);
  m.fill(SX + 12, SY - 1, 6, 3, G.PLAZA); m.setSolid(SX + 12, SY, 6, 1, 0);
  sprite(m, 'portadaEstadio', SX + 15, SY + 1.2, { scale: 1.3, w: 130, up: 80, interact: 'estadio' });
  area(m, 'Estadio 18 de Marzo', SX, SY, SW, SH, 'stadium');
  area(m, 'Portada del Estadio 18 de Marzo', SX + 10, SY - 2, 10, 4, 'monument');
  building(m, 'palenque', 188, 182, 16, 13, { tall: 40 });
  door(m, 196, 194, 'palenque', 'Palenque', { hours: [20, 28], season: 'palenque' });
  area(m, 'Palenque', 188, 182, 16, 13, 'building');
  // covered grandstand on the north side (facing the field), green bleachers beside it
  sprite(m, 'gradas', 162, 186.6, { fw: 150, w: 170, up: 90 }); m.setSolid(157, 181, 10, 6);
  sprite(m, 'gradas', 184, 186.6, { fw: 60, green: true, w: 70, up: 60 }); m.setSolid(182, 183, 5, 4);
  m.fill(159, 190, 22, 10, G.COURT);
  m.structures.push({ kind: 'basketball', x: 160, y: 190, w: 10, h: 10, layer: 1, rot: true }, { kind: 'basketball', x: 170, y: 190, w: 10, h: 10, layer: 1 });
  for (const [hx, hy] of [[165, 190.6], [175, 190.6], [165, 199.4], [175, 199.4]]) sprite(m, 'hoop', hx, hy, { w: 14, up: 44 });
  area(m, 'Canchas de básquetbol', 159, 190, 22, 10, 'court');
  for (const [px, py] of [[166, 203.4], [166, 221.3]]) sprite(m, 'porteria', px, py, { w: 30, up: 16 });
  m.structures.push({ kind: 'diamond', x: 176, y: 199, w: 29, h: 23, layer: 1 });
  area(m, 'Campo de béisbol', 176, 199, 29, 23, 'stadium');
  building(m, 'unam', 212, 180, 26, 14, { tall: 70 });
  door(m, 225, 193, 'unam', 'UNAM — Unidad Académica de Estudios Regionales', { hours: [9, 19] });
  area(m, 'UAER — UNAM', 212, 180, 26, 14, 'building');
  m.fill(212, 194, 26, 8, G.PLAZA); m.fill(214, 196, 5, 4, G.GARDEN); m.fill(231, 196, 5, 4, G.GARDEN);
  sprite(m, 'monCardenas', 225, 199.6, { scale: 1.4, w: 34, up: 70, collide: [-12, -7, 24, 7], interact: 'cardenas' });
  light(m, 225, 200.2, 46, '#ff9a4a'); // the flame at its base never goes out
  area(m, 'Monumento a Lázaro Cárdenas', 212, 194, 26, 8, 'monument');
  for (const [x, y] of [[214, 203], [236, 203], [216.5, 197], [233.5, 197]]) tree(m, x, y, 'jacaranda', { size: 1 });
  // the ferretería of Francisco and Tío Luis, across from the Monumento a Lázaro Cárdenas
  block(m, 239, 184, 15, 13, { facadeH: 34, facades: [{ x: 241, w: 11, exact: true, kind: 'shop', sign: 'FERRETERÍA FRANCISCO', signBg: '#f2c230', signFg: '#1f3f8f', fh: 34 }] });
  m.fill(238, 197, 20, 4, G.PLAZA); m.fill(238, 201, 20, 1, G.SIDEWALK);
  door(m, 246, 196, 'tienda_960_FERRETERÍA', 'Ferretería Francisco', { hours: [9, 19] });
  area(m, 'Ferretería Francisco', 239, 184, 15, 17, 'shop');
  sprite(m, 'tinacos', 241.6, 198.8, { w: 44, up: 26, collide: [-14, -4, 30, 4] });
  sprite(m, 'tinacos', 252.6, 199.4, { scale: 0.8, w: 44, up: 26, collide: [-12, -3, 24, 3] });
  // south of the stadium: El Santo Remedio (“el Santo Mugrero”) and Ferretuberías
  m.fill(206, 202, 32, 22, G.GRASS);
  block(m, 186, 228, 24, 15, { facadeH: 32, outskirts: true, facades: [
    { x: 194, w: 7, exact: true, kind: 'shop', sign: 'EL SANTO REMEDIO', signBg: '#2d2d2d', signFg: '#f2c230', fh: 32 },
    { x: 201, w: 8, exact: true, kind: 'shop', sign: 'FERRETUBERÍAS', signBg: '#1f4b7a', signFg: '#fff', fh: 32 }] });
  door(m, 197, 242, 'santo_remedio', 'Bar El Santo Remedio', { hours: [14, 26] });
  door(m, 205, 242, 'ferretuberias', 'Ferretuberías', { hours: [9, 18], owner: 'guicho' });
  for (let i = 0; i < 9; i++) sprite(m, 'trash', 195 + (i % 5) * 0.9, 243.4 + Math.floor(i / 5) * 0.5, { seed: i, w: 10, up: 8 });
  area(m, 'Bar El Santo Remedio', 194, 228, 7, 16, 'shop');

  // --- east entrance: MEX 15, roosters, JIQUILPAN letters, roundabout, Palmira, OXXO, PEMEX, panteón ---
  for (let y = 171; y < 179; y++) for (let x = 280; x < 288; x++) {
    const dx = (x + 0.5 - 284) / 3.3, dy = (y + 0.5 - 175) / 3.3;
    if (dx * dx + dy * dy <= 1) { m.set(x, y, G.ASPHALT); m.laneDir[y * m.w + x] = 0; m.setSolid(x, y); }
  }
  sprite(m, 'glorietaSign', 284, 177.4, { scale: 1.3, w: 100, up: 80 });
  area(m, 'Glorieta “Jiquilpan, Pueblo Mágico”', 279, 170, 10, 10, 'monument');
  sprite(m, 'gallo', 265.5, 176.5, { scale: 1.2, w: 30, up: 40, collide: [-12, -6, 24, 6] });
  sprite(m, 'gallo', 276, 176.5, { scale: 1.2, flip: true, w: 30, up: 40, collide: [-12, -6, 24, 6] });
  sprite(m, 'whiteLetters', 270.8, 176.3, { scale: 1.2, w: 80, up: 20, collide: [-34, -4, 68, 4] });
  area(m, 'Los gallos y las letras de JIQUILPAN', 263, 174, 16, 3, 'monument');
  building(m, 'palmira', 264, 156, 14, 15, { tall: 100 });
  door(m, 271, 170, 'hotel_palmira', 'Hotel Palmira');
  area(m, 'Hotel Palmira', 264, 156, 14, 15, 'building');
  building(m, 'oxxo', 288, 162, 9, 9, { tall: 30 });
  door(m, 292, 170, 'oxxo', 'OXXO');
  area(m, 'OXXO (entrada)', 288, 162, 9, 9, 'shop');
  sprite(m, 'sitio', 285.5, 171.95, { scale: 1.2, w: 20, up: 24, collide: [-7, -3, 14, 3], interact: 'sitio', sitio: 'Entrada' });
  area(m, 'Sitio de taxis de la Entrada', 280, 171, 8, 1, 'taxi');
  building(m, 'pemex', 264, 180, 12, 11, { tall: 70 });
  m.setSolid(264, 180, 12, 11, 0); m.fill(264, 180, 12, 11, G.ASPHALT); m.setSolid(264, 180, 12, 3, 1);
  area(m, 'PEMEX', 264, 180, 12, 11, 'shop');
  block(m, 278, 180, 22, 11, { outskirts: true, facades: [{ x: 280, w: 6, exact: true, kind: 'shop', sign: 'BILLAR', signBg: '#10331f', signFg: '#f7f1d0', fh: 30 }] });
  door(m, 283, 190, 'billar_entrada', 'Billar de la entrada', { hours: [11, 24] });
  for (const [tx, ty] of [[266, 200], [284, 206], [270, 214], [292, 196], [278, 222]]) tree(m, tx, ty, ty % 2 ? 'eucalipto' : 'fresno', { size: 1.1 });
  // Río Jiquilpan, coming from the east before it goes underground beneath Circunvalación
  for (let y = 60; y < 150; y++) for (let x = 262; x < 300; x++) if (m.get(x, y) !== G.ASPHALT && !ROADS.has(m.get(x, y))) m.set(x, y, fbm(x * 0.08, y * 0.08, 7) > 0.55 ? G.FIELD : G.GRASS);
  river(m, 'Río Jiquilpan', [[300, 104], [288, 110], [279, 118], [270, 122], [262, 126]], 3);
  for (let i = 0; i < 22; i++) tree(m, 264 + (i * 7) % 34 + 0.5, 100 + ((i * 11) % 30), i % 3 ? 'fresno' : 'eucalipto', { size: 1 + (i % 4) * 0.1 });
  area(m, 'Río Jiquilpan', 262, 100, 38, 30, 'river');

  // --- north: San Cayetano (rebocería), Chamacuero, the corrales ------------------------------------------
  building(m, 'capilla', 34, 22, 10, 9, { label: 'SAN CAYETANO', tall: 60 });
  door(m, 39, 30, 'capilla_cayetano', 'Capilla de San Cayetano', { hours: [7, 19] });
  m.fill(32, 31, 16, 8, G.PLAZA);
  tree(m, 33.5, 35, 'jacaranda', { size: 1.1 }); tree(m, 46, 35, 'jacaranda', { size: 1 });
  area(m, 'Barrio de San Cayetano', 28, 18, 30, 26, 'district');
  area(m, 'Capilla de San Cayetano', 32, 22, 16, 17, 'building');
  block(m, 54, 22, 20, 18, { outskirts: true, facades: [{ x: 54, w: 6, exact: true, kind: 'shop', sign: 'MODELORAMA', signBg: '#f2c230', signFg: '#1f3f8f', wall: '#f7f3e8', band: '#1f3f8f', fh: 30 },
    { x: 62, w: 9, exact: true, kind: 'shop', sign: 'REBOZOS · TALLER', signBg: '#5b3f7a', signFg: '#f7e7c9', wall: '#f1e4d0', fh: 30 }] });
  door(m, 66, 39, 'reboceria', 'Taller de rebozos de Doña Amparo', { hours: [8, 19] });
  door(m, 57, 39, 'tienda_970_MODELORAMA', 'Modelorama Las Palmas', { hours: [10, 23] });
  sprite(m, 'beerCrates', 55.2, 40.4, { n: 6, seed: 3, w: 30, up: 20, collide: [-11, -4, 22, 4] });
  sprite(m, 'parkedMoto', 59.4, 40.6, { color: '#c0392b', basket: true, w: 20, up: 18, collide: [-5, -3, 10, 3] });
  area(m, 'Modelorama Las Palmas', 54, 22, 6, 18, 'shop');
  area(m, 'Taller de rebozos', 62, 22, 9, 18, 'shop');
  building(m, 'chamacuero', 8, 26, 12, 9, { tall: 40 });
  door(m, 14, 34, 'chamacuero', 'Mezcal El Chamacuero', { hours: [9, 20] });
  area(m, 'El Chamacuero (mezcal)', 6, 24, 18, 14, 'shop');
  // Panteón Municipal (north-west), and the neighbourhood toward the Cerro de San Francisco
  const PX0 = 60, PY0 = 2, PW0 = 30, PH0 = 14;
  m.fill(PX0, PY0, PW0, PH0, G.CEMETERY);
  for (const [x, y, w, h] of [[PX0, PY0, PW0, 1], [PX0, PY0 + PH0 - 1, 13, 1], [PX0 + 17, PY0 + PH0 - 1, PW0 - 17, 1], [PX0, PY0, 1, PH0], [PX0 + PW0 - 1, PY0, 1, PH0]]) { m.structures.push({ kind: 'wall', x, y, w, h, color: '#e9e2d4', layer: 3 }); m.setSolid(x, y, w, h); }
  m.structures.push({ kind: 'tomb', x: PX0 + 2, y: PY0 + 2, w: PW0 - 4, h: PH0 - 4, layer: 4 });
  for (let y = PY0 + 2; y < PY0 + PH0 - 2; y++) for (let x = PX0 + 2; x < PX0 + PW0 - 2; x++) if ((x - PX0) % 3 !== 2 && (y - PY0) % 3 !== 2 && !(x >= PX0 + 12 && x <= PX0 + 17)) m.setSolid(x, y);
  sprite(m, 'panteonGate', PX0 + 15, PY0 + PH0, { w: 60, up: 50 });
  sprite(m, 'capilla', PX0 + 15, PY0 + 7, { color: '#ece6da', w: 60, up: 60 }); m.setSolid(PX0 + 13, PY0 + 3, 5, 4);
  for (const [tx, ty] of [[PX0 + 3, PY0 + 4], [PX0 + 26, PY0 + 5], [PX0 + 4, PY0 + 11], [PX0 + 25, PY0 + 11], [PX0 + 20, PY0 + 3]]) tree(m, tx, ty, 'cipres', { size: 1.05 });
  area(m, 'Panteón Municipal', PX0, PY0, PW0, PH0, 'cemetery');
  for (const [x, y, w, h] of [[4, 4, 22, 10], [30, 4, 12, 10], [44, 4, 14, 10], [92, 4, 16, 10], [4, 23, 3, 1]]) {
    if (w < 4) continue;
    block(m, x, y, w, h, { outskirts: true, facadeH: 30 }); addLotDoors(m, m.structures[m.structures.length - 1]);
  }
  area(m, 'Colonia del Panteón', 0, 0, 110, 18, 'district');
  sprite(m, 'signpost', 3.5, 23, { text: '← SAN FRANCISCO · RANCHOS', bg: '#6b4a30', w: 70, up: 30 });
  for (let i = 0; i < 16; i++) sprite(m, 'agave', 8 + (i % 8) * 2.5, 46 + Math.floor(i / 8) * 2.2, { w: 22, up: 16, collide: [-3, -2, 6, 2] });
  m.fill(266, 30, 28, 16, G.DIRT);
  for (const [x, y, w, h] of [[266, 30, 28, 1], [266, 45, 12, 1], [282, 45, 12, 1], [266, 30, 1, 16], [293, 30, 1, 16]]) { m.structures.push({ kind: 'fence', x, y, w, h, layer: 3 }); m.setSolid(x, y, w, h); }
  sprite(m, 'corralShade', 274, 36, { scale: 1.2, w: 60, up: 44, collide: [-12, -8, 24, 8], interact: 'pajarete' });
  tree(m, 289, 34, 'fresno', { size: 1.3 });
  area(m, 'Corrales — pajaretes de Don Refugio', 266, 30, 28, 16, 'ranch');

  // --- bosques Cuauhtémoc (west) and Juárez (east), Casita de Piedra -------------------------------------
  for (let y = 244; y < m.h; y++) for (let x = 0; x < m.w; x++) if (!ROADS.has(m.get(x, y))) m.set(x, y, G.FOREST);
  laneLoop(m, [[20, 252], [140, 252], [140, 326], [20, 326]], G.DIRTROAD, 'Circuito del Bosque Cuauhtémoc');
  laneLoop(m, [[162, 252], [290, 252], [290, 326], [162, 326]], G.DIRTROAD, 'Circuito del Bosque Juárez');
  hStreet(m, 'Calle del Bosque', 0, 300, 244, 3, { surface: G.DIRTROAD, sidewalk: false });
  for (const x of [148, 154]) vStreet(m, 'Entrada al bosque', x === 148 ? 140 : 154, 247, 253, 2, { surface: G.DIRTROAD, sidewalk: false });
  area(m, 'Bosque Cuauhtémoc', 0, 244, 148, 90, 'forest');
  area(m, 'Bosque Juárez', 156, 244, 144, 90, 'forest');
  // Portada de Juárez: the stone double arch at the entrance of the Bosque Juárez
  m.fill(188, 246, 12, 6, G.COBBLE);
  sprite(m, 'portadaJuarez', 194, 250, { scale: 1.5, w: 120, up: 90 });
  m.setSolid(186, 249, 2, 1); m.setSolid(193, 249, 2, 1); m.setSolid(200, 249, 2, 1);
  area(m, 'Portada del Bosque Juárez', 186, 246, 16, 8, 'monument');
  building(m, 'casitaPiedra', 24, 246, 10, 8, { tall: 40, ground: G.DIRT });
  m.fill(27, 254, 5, 1, G.PLAZA); m.fill(28, 255, 3, 3, G.PLAZA);
  for (const [bx, by] of [[25.4, 255.2], [33.6, 255.2], [26, 257.6], [33, 257.6]]) sprite(m, 'bush', bx, by, { seed: bx * 7, w: 24, up: 18, collide: [-4, -3, 8, 3] });
  for (const [tx, ty] of [[22.5, 248], [35.5, 249], [21.5, 256], [37, 257]]) tree(m, tx, ty, ty > 252 ? 'jacaranda' : 'fresno', { size: 1.15 });
  door(m, 29, 253, 'casita_piedra', 'La Casita de Piedra (rebozos)', { hours: [9, 18] });
  area(m, 'La Casita de Piedra', 24, 246, 10, 8, 'shop');
  for (let x = 30; x < 290; x++) { if (x > 144 && x < 160) continue; m.set(x, 290, G.DIRT); m.set(x, 291, G.DIRT); }
  for (let i = 0; i < 620; i++) {
    const x = 1 + Math.floor(hash2(i, 5, 7) * 298), y = 246 + Math.floor(hash2(i, 6, 7) * 87);
    if (m.get(x, y) !== G.FOREST || m.get(x, y + 1) !== G.FOREST || m.get(x + 1, y) !== G.FOREST) continue;
    const kinds = ['eucalipto', 'eucalipto', 'eucalipto', 'jacaranda', 'jacaranda', 'fresno', 'laurel', 'bush', 'bush'];
    const k = kinds[Math.floor(hash2(i, 8, 7) * kinds.length)];
    if (k === 'bush') sprite(m, 'bush', x + 0.5, y + 0.8, { seed: i, flowers: hash2(i, 9, 7) > 0.7, w: 24, up: 18, collide: [-4, -3, 8, 3] });
    else tree(m, x + 0.5, y + 0.8, k, { size: 1 + hash2(i, 9, 7) * 0.4 });
  }
  sprite(m, 'mesas', 141.5, 248.4, { color: '#2e8b57', w: 44, up: 40, collide: [-18, -4, 36, 4] });
  sprite(m, 'cart', 145, 248.4, { cart: 'micheladas', color: '#2e8b57', sign: 'MICHELADAS DEL BOSQUE', umbrella: '#2e8b57', w: 34, up: 44, collide: [-11, -4, 22, 4], interact: 'vendor', vendor: 'micheladas_bosque' });
  area(m, 'Micheladas del Bosque', 138, 246, 10, 4, 'shop');
  sprite(m, 'seTraspasa', 138.6, 249.2, { label: 'SE BUSCA SOCIO', w: 30, up: 30, collide: [-2, -2, 4, 2], interact: 'negocio', biz: 'micheladas' });
  for (const [lx, ly] of [[60, 253], [110, 253], [175, 253], [230, 253], [60, 325], [230, 325]]) { sprite(m, 'lamp', lx, ly, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, lx, ly - 1, 70); }
  sprite(m, 'signpost', 156.5, 330, { text: 'BOSQUE · FIN DEL CAMINO', bg: '#6b4a30', w: 60, up: 30 });
  m.exits.push({ x: 0, y: 18, w: 1, h: 4, to: 'cerro', tx: 40.5, ty: 2.6, dir: 0, label: 'Cerro de San Francisco' });

  // --- CBTIS (bachillerato tecnológico), on the east side by Circunvalación ------------------------------
  building(m, 'escuelaTipo', 238, 144, 20, 12, { tall: 60, label: 'C.B.T.i.s. JIQUILPAN', band: '#7a1f2b', plaqueBg: '#5a1a22' });
  door(m, 248, 155, 'cbtis', 'CBTIS — Centro de Bachillerato Tecnológico industrial y de servicios', { hours: [7, 20] });
  area(m, 'CBTIS', 238, 144, 20, 12, 'building');
  // --- Universidad de la Ciénega (UCEMICH), up the hill on the way out to Sahuayo -----------------------
  for (let y = 0; y < 18; y++) for (let x = 156; x < 196; x++) { const d = Math.hypot((x - 176) / 16, (y - 8) / 9); if (d < 1) m.elev[y * m.w + x] += 14 * (1 - d * d); }
  m.fill(162, 2, 28, 15, G.GRASS);
  building(m, 'ucemich', 164, 3, 24, 9, { tall: 50 });
  m.fill(164, 12, 24, 3, G.PLAZA); m.fill(174, 15, 4, 3, G.PLAZA);
  hStreet(m, 'Av. de la Universidad', 156, 174, 15, 3, { surface: G.ASPHALT, sidewalk: false });
  door(m, 176, 11, 'ucemich', 'Universidad de la Ciénega del Estado de Michoacán de Ocampo', { hours: [7, 21] });
  for (const [x, y] of [[163, 13], [189, 13], [166, 16.5], [186, 16.5]]) tree(m, x, y, 'fresno', { size: 1.1 });
  sprite(m, 'signpost', 157.5, 14.4, { text: 'UNIVERSIDAD DE LA CIÉNEGA ↑', bg: '#1d4f91', w: 70, up: 30 });
  area(m, 'Universidad de la Ciénega (UCEMICH)', 162, 2, 28, 16, 'building');
  // --- Monumento a Juárez and its escalinata, on a rise behind the stadium, among cobbled lanes -------------
  vStreet(m, 'Callejón de la Escalinata', 158, 228, 244, 3, { surface: G.COBBLE, sidewalk: false });
  vStreet(m, 'Callejón del Rincón', 182, 228, 244, 3, { surface: G.COBBLE, sidewalk: false });
  for (let x = 156; x < 186; x++) for (const y of [224, 225, 226, 227]) if (m.get(x, y) === G.DIRTROAD) m.set(x, y, G.COBBLE);
  m.fill(165, 233, 14, 8, G.PLAZA);
  m.fill(171, 228, 3, 5, G.STAIRS);
  sprite(m, 'label', 168.5, 239.6, { w: 4, up: 4, interact: 'cielo' });
  sprite(m, 'monJuarez', 172, 237.6, { scale: 1.4, w: 44, up: 60, collide: [-17, -8, 34, 8], interact: 'juarez' });
  for (let x = 165.4; x < 178.8; x += 1.1) if (x < 170.6 || x > 174.4) sprite(m, 'balustre', x, 233.7, { w: 8, up: 12, collide: [-2, -2, 4, 2] });
  for (const [x, y] of [[166, 236], [178, 236], [167, 240.6], [177, 240.6], [161.5, 231], [186.5, 231]]) tree(m, x, y, y > 238 ? 'cipres' : 'jacaranda', { size: 1.05, collide: [-2, -2, 4, 3] });
  for (const [bx, by] of [[168, 239.4], [176, 239.4]]) sprite(m, 'bench', bx, by, { w: 22, up: 14, collide: [-8, -4, 16, 4], seat: true });
  area(m, 'Monumento a Juárez', 165, 233, 14, 8, 'monument');
  area(m, 'Escalinata de Juárez', 171, 228, 3, 5, 'stairs');

  // --- the remaining blocks of the grid (every lot gets a door) ------------------------------------------
  const vx = [28, 50, 74, 94, 110, 150, 186, 210, 234, 258];
  const vw = { 150: 6, 258: 6 };
  const hy = [18, 40, 60, 80, 110, 124, 140, 156, 172, 200, 224];
  const hw = { 172: 4 };
  for (let j = 0; j < hy.length - 1; j++) for (let i = 0; i < vx.length - 1; i++) {
    const x = vx[i] + (vw[vx[i]] || 4), x1 = vx[i + 1];
    const y = hy[j] + (hw[hy[j]] || 4), y1 = hy[j + 1];
    if (x1 - x < 4 || y1 - y < 4) continue;
    if (x >= 210 && y >= 176) continue; // south-east: stadium / UAER / countryside
    if (x >= 150 && y >= 176) continue;
    let used = false;
    for (let yy = y; yy < y1 && !used; yy++) for (let xx = x; xx < x1; xx++) {
      const g = m.get(xx, yy);
      if (g !== G.GRASS && g !== G.FIELD) { used = true; break; }
      if (distToPolyline(xx + 0.5, yy + 0.5, PALMAS) < 7) { used = true; break; }
    }
    if (used) { // around Las Palmas: leave a planted parkway with jacarandas
      for (let yy = y; yy < y1; yy++) for (let xx = x; xx < x1; xx++) if (m.get(xx, yy) === G.GRASS && distToPolyline(xx + 0.5, yy + 0.5, PALMAS) < 9 && hash2(xx, yy, 44) > 0.985) tree(m, xx + 0.5, yy + 0.8, 'jacaranda', { size: 1 });
      continue;
    }
    const outskirts = x < 50 || x > 234 || y < 40 || y > 180;
    const b = { x, y, w: x1 - x, h: y1 - y, outskirts, facadeH: outskirts ? 30 : 36 };
    block(m, x, y, b.w, b.h, { outskirts, facadeH: b.facadeH, centro: x >= 94 && x < 238 && y >= 60 && y < 160 });
    addLotDoors(m, m.structures[m.structures.length - 1]);
  }
  // doors for the special blocks too (skip the lots covered by named facades)
  for (const s of m.structures) if (s.kind === 'block' && !s._doors && (s.facadeH ?? 36) > 0) addLotDoors(m, s);

  // --- jacarandas sprinkled at street corners all over town --------------------------------------------
  for (const x of vx) for (const y of hy) {
    if (hash2(x, y, 12) < 0.45) continue;
    const cx = x - 0.6, cy = y - 0.3;
    if (m.get(Math.floor(cx), Math.floor(cy)) === G.ROOF) continue;
    if (!m.isSolidTile(Math.floor(cx), Math.floor(cy)) && m.get(Math.floor(cx), Math.floor(cy)) !== G.ASPHALT) tree(m, cx, cy, 'jacaranda', { size: 0.95, collide: [-1.5, -2, 3, 2] });
  }

  // --- tianguis ---------------------------------------------------------------------------------------------
  const stall = (x, y, props = {}) => ({ kind: 'stall', x: x * TILE + 8, y: y * TILE, fw: 26, w: 36, up: 40, seed: Math.floor(x * 7 + y * 3), collide: [-13, -5, 26, 5], interact: 'tianguis', ...props });
  const fri = [];
  for (let x = 157; x < 185; x += 2.3) fri.push(stall(x, 61.8));      // Madero, along the Jardín de la Paz
  for (let y = 44.8; y < 59; y += 2.2) fri.push(stall(187.4, y));     // Fajardo
  m.daySprites[5] = fri;
  m.closedByDay[5] = [[156, 60, 30, 4], [186, 44, 4, 16]];
  const sat = [];
  for (let y = 84.5; y < 110; y += 2.2) sat.push(stall(187.4, y));
  for (let x = 160; x < 250; x += 2.3) { if (x > 184 && x < 190) continue; sat.push(stall(x, 225.8)); }
  sat.push(stall(214, 227.4, { fw: 34, tarp: '#1f6fb3', goods: 'pots', sign: 'BIRRIA DE GUATEMALA', interact: 'vendor', vendor: 'birria_guatemala', collide: [-17, -5, 34, 5] }));
  m.daySprites[6] = sat;
  m.closedByDay[6] = [[186, 84, 4, 26], [150, 224, 112, 4]];
  // weekend chicharrones & carnitas at the corners (Rioseco y Diego José Abad, Fajardo y 5 de Mayo)
  const wk = [
    { kind: 'cazo', x: 77.5 * TILE, y: 114.6 * TILE, w: 30, up: 30, collide: [-7, -3, 14, 3], interact: 'vendor', vendor: 'carnitas_esquina' },
    { kind: 'cazo', x: 189.5 * TILE, y: 144.4 * TILE, w: 30, up: 30, collide: [-7, -3, 14, 3], interact: 'vendor', vendor: 'carnitas_esquina' },
  ];
  const loteria = { kind: 'mesaLoteria', x: 116.5 * TILE, y: 108.9 * TILE, w: 40, up: 34, collide: [-15, -4, 30, 4], interact: 'loteria' };
  m.daySprites[0] = wk.concat([loteria]); m.daySprites[6] = m.daySprites[6].concat(wk, [loteria]); m.daySprites[5] = m.daySprites[5].concat([loteria]);

  // “SE BUSCA” posters (act III)
  for (const [x, y] of [[113.5, 93.6], [149.2, 110.8], [138.4, 140.6], [189.4, 110.6], [96.6, 111], [150.8, 60.6], [223.5, 156.8], [153.4, 243.2]]) sprite(m, 'poster', x, y, { w: 16, up: 30, acts: [3], interact: 'poster' });

  // --- signs at the edges: neighbouring towns (closed for now) --------------------------------------------
  sprite(m, 'signpost', 157.8, 3.5, { text: 'SAHUAYO 3 KM', bg: '#1f5fa8', w: 50, up: 30 });
  sprite(m, 'signpost', 296, 169.6, { text: 'TOTOLÁN · ZAMORA', bg: '#1f5fa8', w: 60, up: 30 });
  sprite(m, 'signpost', 26.5, 172.6, { text: 'COLIMA · PAREDONES', bg: '#1f5fa8', w: 60, up: 30 });
  sprite(m, 'signpost', 262.5, 17, { text: 'LA LAGUNITA · ABADIANO', bg: '#1f5fa8', w: 64, up: 30 });
  vStreet(m, 'Carretera a Sahuayo', 150, 0, 18, 6, { surface: G.ASPHALT, walkSurface: G.SIDEWALK });
  vStreet(m, 'Carretera a La Lagunita y Abadiano', 258, 0, 18, 6, { surface: G.ASPHALT });
  m.exits.push({ x: 258, y: 0, w: 6, h: 1, to: 'closed', label: 'La Lagunita', msg: 'La carretera a La Lagunita y a San Antonio Abadiano. De La Lagunita viene buena parte de tu familia… pero todavía no es momento de ir. Primero, Jiquilpan.' });
  hStreet(m, 'Carretera a Colima (MEX 110)', 0, 28, 172, 4, { surface: G.ASPHALT });
  hStreet(m, 'Carretera a Totolán', 262, 300, 171, 8, { surface: G.ASPHALT, median: true });
  m.exits.push({ x: 150, y: 0, w: 6, h: 1, to: 'closed', label: 'Sahuayo', msg: 'La carretera a Sahuayo. El pueblo vecino está a tres kilómetros: comercio, huaraches y mucho movimiento. Por ahora tu historia está aquí, en Jiquilpan.' });
  m.exits.push({ x: 299, y: 171, w: 1, h: 8, to: 'closed', label: 'Totolán', msg: 'La MEX 15 hacia San Martín Totolán y Zamora. Hoy el camino está cerrado por obras.' });
  m.exits.push({ x: 0, y: 172, w: 1, h: 4, to: 'closed', label: 'Colima', msg: 'La carretera a Colima, rumbo a Paredones y La Lagunita. Por ahora no hay transporte hacia allá.' });

  // neighbouring towns, shown on the map (closed for now)
  area(m, 'Sahuayo (3 km) ↑', 158, 0, 40, 6, 'neighbor');
  area(m, 'La Lagunita · Abadiano ↗', 262, 0, 38, 8, 'neighbor');
  area(m, 'Totolán · Zamora →', 288, 180, 12, 12, 'neighbor');
  area(m, '← Paredones · Colima', 0, 176, 26, 8, 'neighbor');
  area(m, 'Francisco Sarabia ↘', 262, 300, 38, 12, 'neighbor');
  // named districts for the map
  area(m, 'Centro Histórico', 94, 64, 116, 96, 'district');
  area(m, 'Barrio de La Trasquila', 6, 44, 52, 62, 'district');
  area(m, 'Colonia El Tanque', 186, 18, 72, 44, 'district');
  area(m, 'Entrada a Jiquilpan', 262, 150, 38, 30, 'district');
  area(m, 'Av. Presidente Lázaro Cárdenas', 150, 0, 6, 244, 'street');
  area(m, 'Av. Las Palmas', 62, 10, 90, 36, 'street');

  // --- the centro: flagstone (laja) streets, red-and-white street lamps -------------------------------------
  const CENTRO = (x, y) => x >= 94 && x < 238 && y >= 60 && y < 160;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (!CENTRO(x, y) || (x >= 150 && x < 156)) continue; // the avenue stays asphalt
    const g = m.get(x, y);
    if (g === G.ASPHALT || g === G.COBBLE) m.set(x, y, G.LAJA);
  }
  let lampK = 0;
  for (const y of [60, 80, 110, 124, 140, 156]) for (let x = 97; x < 236; x += 9) {
    const row = (lampK++ % 2) ? y : y + 3;
    const g = m.get(x, row);
    if (g !== G.SIDEWALK && g !== G.CANTERA) continue;
    if (m.doors.some(d => Math.abs(d.x - x) < 1 && Math.abs(d.y - row) <= 1)) continue;
    sprite(m, 'farolCentro', x + 0.5, row === y ? row + 0.3 : row + 0.95, { w: 12, up: 40, collide: [-1.2, -1.2, 2.4, 2] });
    light(m, x + 0.5, row + 0.2, 60, '#fff1c8');
  }

  // --- parked cars and Italikas along the parking lanes of the one-way streets ------------------------------
  const noPark = (x, y) => Object.values(m.closedByDay).some(list => list.some(([rx, ry, rw, rh]) => x >= rx && x < rx + rw && y >= ry && y < ry + rh))
    || (y >= 84 && y < 110 && x >= 186 && x < 190) || (y >= 124 && y < 128 && x >= 160 && x < 177);
  const free = (x, y) => m.parking && m.parking[y * m.w + x] && !m.laneDir[y * m.w + x] && ROADS.has(m.get(x, y)) && !noPark(x, y);
  const CARS = ['#c9ccd1', '#f4f4f0', '#b3201f', '#1f3f6f', '#2b2b2e', '#8a8f94', '#d8c79a', '#3e6b48', '#7a1f2b'];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const p = m.parking && m.parking[y * m.w + x];
    if (!p) continue;
    const h = hash2(x, y, 303);
    if (p === 1 && free(x, y) && free(x + 1, y) && free(x - 1, y) && free(x + 2, y) && x % 3 === 0) {
      if (h < 0.3) sprite(m, 'parkedCar', x + 1, y + 0.95, { color: CARS[Math.floor(hash2(x, y, 304) * CARS.length)], flip: hash2(x, y, 305) > 0.5, model: randomModel(() => hash2(x, y, 306)), w: 44, up: 30, collide: [-14, -6, 28, 6] });
      else if (h < 0.4) sprite(m, 'parkedMoto', x + 0.5, y + 0.95, { color: ['#c0392b', '#1f4fa0', '#1b1b1b', '#f39c12'][Math.floor(h * 40) % 4], flip: h > 0.5, w: 20, up: 18, collide: [-5, -3, 10, 3] });
    }
    if (p === 2 && free(x, y) && free(x, y + 1) && free(x, y - 1) && free(x, y + 2) && y % 3 === 0) {
      if (h < 0.3) sprite(m, 'parkedCarV', x + 0.5, y + 1.9, { color: CARS[Math.floor(hash2(x, y, 304) * CARS.length)], model: randomModel(() => hash2(x, y, 307)), flip: hash2(x, y, 308) > 0.5, w: 26, up: 40, collide: [-6, -12, 12, 22] });
      else if (h < 0.4) sprite(m, 'parkedMoto', x + 0.5, y + 0.95, { color: ['#c0392b', '#1f4fa0', '#1b1b1b', '#f39c12'][Math.floor(h * 40) % 4], vertical: true, w: 14, up: 20, collide: [-3, -4, 6, 4] });
    }
  }

  // --- combis: three routes with their stops (a blue sign with the route colour) -----------------------
  m.combiRoutes = {
    verde: [[136, 112, 'Plaza Principal'], [200, 126, 'San Francisco'], [212, 136, 'Hospital General'], [275, 173, 'La Entrada'], [188, 100, 'Mercado']],
    roja: [[152, 104, 'Palacio Municipal'], [152, 150, 'Casa de Cárdenas'], [152, 176, 'Estadio'], [152, 238, 'El Bosque'], [140, 126, 'Biblioteca']],
    amarilla: [[152, 54, 'Jardín de la Paz'], [152, 25, 'Las Palmas'], [152, 4, 'Salida a Sahuayo'], [220, 42, 'El Tanque'], [170, 62, 'Cremería']],
  };
  for (const [route, stops] of Object.entries(m.combiRoutes)) for (const st of stops) {
    // put the sign on the nearest sidewalk beside the street
    let best = null;
    for (let r = 0; r < 4 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r; dx++) {
      const g = m.get(st[0] + dx, st[1] + dy);
      if ((g === G.SIDEWALK || g === G.CANTERA || g === G.PLAZA) && !m.isSolidTile(st[0] + dx, st[1] + dy)) { best = [st[0] + dx, st[1] + dy]; break; }
    }
    if (best) sprite(m, 'parada', best[0] + 0.5, best[1] + 0.8, { route, stop: st[2], w: 20, up: 40, collide: [-1, -1, 2, 2], interact: 'parada' });
  }

  // --- the huerta at the edge of the Bosque Cuauhtémoc: guayabos, mangos, naranjos, a limón and an
  // aguacate criollo. Knock the fruit down with a stick or a pebble (once a day per tree).
  const clearAround = (x, y, r) => { m.sprites = m.sprites.filter(sp => Math.hypot(sp.x / TILE - x, sp.y / TILE - y) > r); };
  clearAround(96, 262, 11);
  m.fill(86, 254, 22, 16, G.GRASS);
  const HUERTA = [['guayabo', 88, 256], ['guayabo', 92.5, 257.5], ['mango', 97, 256.4], ['naranjo', 101.5, 257.6], ['limon', 105.5, 256.4],
    ['guayabo', 89, 262], ['mango', 94, 263.4], ['aguacate', 99.5, 262.2], ['naranjo', 104.4, 263.2], ['guayabo', 90.5, 267.6], ['mango', 96, 268.2], ['naranjo', 102, 267.8]];
  for (const [k, x, y] of HUERTA) tree(m, x, y, k, { size: 0.95, fruit: true });
  sprite(m, 'signpost', 87, 253.4, { text: 'HUERTA COMUNITARIA · TOME LO QUE COMA', bg: '#4c7a34', w: 90, up: 30 });
  area(m, 'La huerta del bosque', 86, 254, 22, 16, 'park');
  // --- tiro al bote: cans on a wall in a clearing of the Bosque Juárez, for the slingshot ---------------
  clearAround(206, 262, 7);
  m.fill(199, 256, 16, 12, G.DIRT);
  sprite(m, 'botes', 206.5, 259, { n: 5, fw: 44, w: 52, up: 30, collide: [-24, -4, 48, 4] });
  sprite(m, 'signpost', 199.5, 258.4, { text: 'TIRO AL BOTE', bg: '#7a2f2f', w: 50, up: 30 });
  sprite(m, 'bench', 206.5, 265.6, { w: 22, up: 14, collide: [-8, -4, 16, 4], seat: true });
  area(m, 'Tiro al bote', 199, 256, 16, 12, 'park');

  // trays of water that shops leave out for the street dogs
  for (const [x, y] of [[198.2, 111.1], [148.6, 115.6], [107.6, 156.2], [244.2, 199.6]]) sprite(m, 'waterTray', x, y, { w: 12, up: 6 });

  m.spawns = {
    start: { x: 225.5, y: 157.2 },
    plaza: { x: 126, y: 106.4 },
    cerroPath: { x: 2.5, y: 20 },
    sitioAbasolo: { x: 163.5, y: 128.6 },
    sitioMercado: { x: 188, y: 99 },
    sitioEntrada: { x: 290.5, y: 171.6 },
  };
  m.structures.sort((a, b) => (a.layer || 0) - (b.layer || 0));
  m.baseSprites = m.sprites.slice();
  return m;
}

// Every lot of a block gets a door: houses lead into a family home, shops into a small shop.
export function addLotDoors(m, s) {
  s._doors = true;
  const lots = blockLots(s);
  const by = s.y + s.h - 1;
  const exact = (s.facades || []).filter(o => o.exact);
  for (const l of lots) {
    const cx = (l.doorX + l.doorW / 2) / TILE;
    const tx = Math.floor(cx);
    if (exact.some(o => tx >= o.x && tx < o.x + o.w)) continue;
    if (m.doors.some(d => d.x === tx && d.y === by)) continue;
    if (l.kind === 'shop') door(m, tx, by, `tienda_${l.seed}_${encodeURIComponent(l.sign)}`, l.sign.charAt(0) + l.sign.slice(1).toLowerCase(), { hours: [8, 21], generic: true });
    else door(m, tx, by, `casa_${l.seed}_${encodeURIComponent(l.surname)}`, `Casa de la familia ${l.surname}`, { generic: true, house: true });
    if (l.ocote) {
      sprite(m, 'ocote', cx + 0.9, by + 1.35, { w: 16, up: 22, nightOnly: true, collide: [-2, -2, 4, 2] });
      m.lights.push({ x: (cx + 0.9) * TILE, y: (by + 1.2) * TILE, r: 55, color: '#ff9c4a', kind: 'fire', nightOnly: true });
    }
  }
}

// Swap tianguis stalls in/out for the given weekday.
export function applyWeekday(m, day) {
  if (!m.baseSprites) return;
  m.sprites = m.baseSprites.filter(s => !s.notDays || !s.notDays.includes(day)).concat(m.daySprites?.[day] || []);
  m.closed = new Uint8Array(m.w * m.h);
  for (const [x, y, w, h] of (m.closedByDay?.[day] || [])) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m.inb(i, j)) m.closed[j * m.w + i] = 1;
  }
  m.finalize();
}
