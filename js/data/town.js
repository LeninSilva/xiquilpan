// Jiquilpan de Juárez — the town map.
// Layout is an interpretation: the historic centre (Jardín Zaragoza, Palacio,
// portales, temples) in the middle, Av. Lázaro Cárdenas crossing east–west to
// the entrance glorieta, Av. Las Palmas running south past the Parque Juárez and
// the Estadio 18 de Marzo down to the Bosque Cuauhtémoc, and the slopes of the
// Cerro de San Francisco rising to the north. 1 tile ≈ 5 m.
import { GameMap, G } from '../world.js';
import { fbm, hash2, TILE } from '../util.js';
import { hStreet, vStreet, laneLoop, sprite, building, block, tree, door, area, light, DIR, ensureLanes } from './build.js';

export const TOWN_W = 260, TOWN_H = 234;

export function buildTown() {
  const m = new GameMap('town', 'Jiquilpan de Juárez', TOWN_W, TOWN_H, { fill: G.GRASS, baseElev: 1560 });
  m.potholes = true;
  ensureLanes(m);
  m.daySprites = {}; // weekday -> sprites (tianguis)
  m.closedByDay = {}; // weekday -> list of tile rects closed to traffic

  // --- elevation --------------------------------------------------------
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    let e = 1558 + fbm(x * 0.03, y * 0.03, 11, 3) * 8;
    if (y < 40) e += Math.pow(40 - y, 1.38) * 1.15;                      // skirts of the Cerro de San Francisco
    const dx = x - 50, dy = y - 150; e += 42 * Math.exp(-(dx * dx + dy * dy) / (2 * 15 * 15)); // Parque Juárez hill
    if (y > 196) e -= 4;                                                  // the bosque sits a little lower
    if (x > 215) e += (x - 215) * 0.12;                                   // gentle rise to the east entrance
    m.elev[y * m.w + x] = e;
  }

  // --- countryside to the north ------------------------------------------
  for (let y = 0; y < 36; y++) for (let x = 0; x < m.w; x++) {
    const n = fbm(x * 0.07, y * 0.07, 5, 3);
    let g = n > 0.56 ? G.FIELD : G.GRASS;
    if (y < 11) g = G.SLOPE;
    m.set(x, y, g);
  }
  // fields & scrub east and west of the town
  for (let y = 36; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (x < 10 || x > 252) m.set(x, y, fbm(x * 0.08, y * 0.08, 7) > 0.55 ? G.FIELD : G.GRASS);
  }

  // --- street grid --------------------------------------------------------
  const VX = [[10, 'Calle Degollado'], [28, 'Calle Aldama'], [44, 'Calle Abasolo'], [60, 'Calle Allende'], [76, 'Calle Galeana'],
    [92, 'Calle Nicolás Bravo'], [110, 'Calle Hidalgo'], [136, 'Calle Morelos'], [152, 'Calle Zaragoza'], [168, 'Calle Ramón Corona'],
    [184, 'Calle Madero'], [200, 'Calle Pino Suárez'], [216, 'Calle Juárez']];
  const HY = [[36, 'Calle Constitución', 4], [54, 'Calle Independencia', 4], [70, 'Calle 5 de Mayo', 4], [88, 'Av. Lázaro Cárdenas', 6],
    [112, 'Calle Vicente Guerrero', 4], [128, 'Calle Iturbide', 4], [144, 'Calle Mina', 4]];

  // horizontal streets
  for (const [y, name, w] of HY) {
    let x0 = 10, x1 = 220;
    if (y >= 128) x0 = 88;                       // west of Las Palmas is the Parque Juárez
    if (y === 88) { x0 = 0; x1 = 220; }         // the avenue crosses the whole town
    const surface = (y === 36) ? G.COBBLE : (y === 88 || y === 112) ? G.ASPHALT : G.COBBLE;
    hStreet(m, name, x0, x1, y, w, { surface });
  }
  // vertical streets
  for (const [x, name] of VX) {
    let y0 = 36, y1 = 148;
    if (x < 92) y1 = 116;
    if (x === 92) y1 = 116;
    if (x >= 168 && x <= 216) y1 = 200;
    const surface = (x === 110 || x === 136) ? G.ASPHALT : G.COBBLE;
    vStreet(m, name, x, y0, y1, 4, { surface });
  }
  // rename the alley behind the market
  m.markStreet(136, 70, 20, 4, 'Callejón del Mercado');

  // Av. Las Palmas: two roadways and a planted median, from Vicente Guerrero to the curve.
  vStreet(m, 'Av. Las Palmas', 88, 112, 201, 10, { surface: G.ASPHALT, median: true });
  hStreet(m, 'Av. Las Palmas (la curva)', 24, 98, 196, 5, { surface: G.ASPHALT });
  // streets of the south side
  hStreet(m, 'Calle 18 de Marzo', 14, 160, 186, 4, { surface: G.ASPHALT });
  hStreet(m, 'Calle Francisco J. Múgica', 156, 220, 164, 4, { surface: G.COBBLE });
  hStreet(m, 'Calle Ignacio Zaragoza Sur', 156, 220, 180, 4, { surface: G.DIRTROAD, sidewalk: false });
  vStreet(m, 'Calle Juárez', 216, 116, 134, 4, { surface: G.COBBLE });
  hStreet(m, 'Camino al Panteón', 216, 256, 130, 4, { surface: G.DIRTROAD, sidewalk: false });

  // East entrance boulevard with median, glorieta and the roosters
  hStreet(m, 'Carretera Jiquilpan–Zamora', 220, 260, 86, 10, { surface: G.ASPHALT, median: true });
  // glorieta: grass island in the middle
  for (let y = 86; y < 96; y++) for (let x = 236; x < 247; x++) {
    const dx = (x + 0.5 - 241.5) / 2.9, dy = (y + 0.5 - 91) / 2.6;
    if (dx * dx + dy * dy <= 1) { m.set(x, y, G.ASPHALT); m.laneDir[y * m.w + x] = 0; m.setSolid(x, y); }
  }
  // west exit to Sahuayo
  m.markStreet(0, 88, 10, 6, 'Carretera a Sahuayo');

  // Dirt roads to the countryside (north)
  const dirt = (x, y0, y1, name, surf = G.DIRTROAD) => vStreet(m, name, x, y0, y1, 3, { surface: surf, sidewalk: false });
  dirt(18, 14, 36, 'Camino al Chamacuero');
  dirt(64, 16, 36, 'Subida a San Cayetano');
  dirt(125, 0, 36, 'Camino al Cerro de San Francisco');
  for (let y = 0; y < 12; y++) for (let x = 125; x < 128; x++) m.set(x, y, G.ROCKROAD);
  dirt(209, 12, 36, 'Camino a los corrales');
  hStreet(m, 'Brecha del Cerro', 18, 212, 13, 3, { surface: G.DIRTROAD, sidewalk: false });

  // --- plaza: Jardín Zaragoza --------------------------------------------
  const PX = 114, PY = 94, PW = 22, PH = 18;
  m.fill(PX, PY, PW, PH, G.PLAZA);
  area(m, 'Jardín Zaragoza (la Plaza)', PX, PY, PW, PH, 'plaza');
  // gardens (NE and SW) with benches, fountains in the other two quadrants
  m.fill(128, 96, 6, 4, G.GARDEN); m.fill(116, 106, 6, 4, G.GARDEN);
  m.setSolid(128, 96, 6, 4); m.setSolid(116, 106, 6, 4);
  tree(m, 130, 98, 'laurel', { size: 1.25 }); tree(m, 133, 99, 'laurel', { size: 1.1 });
  tree(m, 118, 108, 'laurel', { size: 1.25 }); tree(m, 121, 109, 'laurel', { size: 1.1 });
  tree(m, 116, 96, 'jacaranda', { size: 1 }); tree(m, 134, 110, 'jacaranda', { size: 1 });
  tree(m, 135, 95, 'laurel', { size: 1.05 });
  // kiosco in the centre
  sprite(m, 'kiosco', 125, 105, { scale: 1.55, w: 90, up: 90, interact: 'kiosco' });
  m.setSolid(123, 102, 4, 3);
  light(m, 125, 101, 110, '#ffe2a8');
  // Fuente de la Aguadora (NW) and the fountain (SE)
  sprite(m, 'aguadora', 119, 99.6, { scale: 1.5, w: 60, up: 70, collide: [-24, -14, 48, 12], interact: 'aguadora' });
  sprite(m, 'fuente', 131, 109.4, { scale: 1.4, w: 52, up: 46, collide: [-22, -12, 44, 11], interact: 'fuente' });
  // benches & lamps along the walkways
  for (const [bx, by] of [[124, 97], [127, 97], [116, 101], [134, 101], [116, 104.5], [134, 104.5], [124, 111.2], [127, 111.2]]) sprite(m, 'bench', bx, by, { w: 20, up: 12, collide: [-8, -4, 16, 4], seat: true });
  for (const [lx, ly] of [[114.6, 94.8], [135.4, 94.8], [114.6, 111.6], [135.4, 111.6], [122, 101], [128.5, 101], [122, 107.5], [128.5, 107.5]]) {
    sprite(m, 'lamp', lx, ly, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, lx, ly - 1, 70);
  }
  // "los tubos" by the Casa de la Cultura: a pergola of steel pipes at the plaza corner
  sprite(m, 'tubos', 114.7, 111.8, { scale: 1.2, w: 30, up: 40 });

  // --- north of the avenue: portales, Palacio, mercado ----------------------
  building(m, 'portal', 96, 74, 7, 14, { sign: 'PORTAL ALLENDE', shops: ['#e8b04b', '#d4553d', '#6ec07a'] });
  building(m, 'portal', 103, 74, 7, 14, { blue: true, sign: 'PORTAL AZUL', shops: ['#f3eee4', '#e8b04b'] });
  area(m, 'Portal Azul', 103, 74, 7, 16, 'building');
  door(m, 99, 87, 'portal_tienda', 'Tienda del Portal Allende');
  door(m, 106, 87, 'portal_azul', 'Portal Azul — Cenaduría');
  building(m, 'palacio', 114, 74, 22, 14, { tall: 80 });
  area(m, 'Palacio Municipal (H. Ayuntamiento)', 114, 74, 22, 14, 'building');
  door(m, 125, 87, 'palacio', 'Palacio Municipal', { hours: [8, 15] });
  building(m, 'mercado', 140, 74, 12, 14);
  area(m, 'Mercado Municipal', 140, 74, 12, 14, 'building');
  door(m, 146, 87, 'mercado', 'Mercado Municipal', { hours: [7, 18] });
  door(m, 146, 74, 'mercado', 'Mercado (puerta del callejón)', { hours: [7, 18], fromNorth: true });
  building(m, 'panaderia', 140, 58, 12, 12);
  area(m, 'Panadería Mendoza', 140, 58, 12, 12, 'building');
  door(m, 143, 69, 'panaderia', 'Panadería Mendoza', { hours: [7, 21] });
  door(m, 149, 69, 'billar_mendoza', 'Billar (arriba de la panadería)', { hours: [12, 24] });
  // taxi rank by the market & palacio
  sprite(m, 'sitio', 139.5, 81, { scale: 1.2, w: 20, up: 24, collide: [-7, -3, 14, 3], interact: 'sitio', sitio: 'Mercado' });
  area(m, 'Sitio de taxis del Mercado', 136, 76, 4, 10, 'taxi');
  for (const ty of [77, 79, 83]) sprite(m, 'parkedCar', 138, ty, { color: '#f4f4f0', taxi: '#1b7a3e', flip: true, w: 36, up: 24, collide: [-14, -6, 28, 6] });

  // Templo de las Monjas & the obelisk garden
  m.fill(80, 74, 12, 14, G.PLAZA);
  building(m, 'monjas', 80, 74, 12, 10);
  tree(m, 81.5, 86.5, 'laurel', { size: 0.9 }); tree(m, 90.5, 86.5, 'laurel', { size: 0.9 });
  area(m, 'Templo de las Monjas', 80, 74, 12, 14, 'building');
  door(m, 86, 83, 'templo_monjas', 'Templo de las Monjas', { hours: [7, 20] });
  m.fill(64, 74, 12, 14, G.PLAZA); m.fill(65, 75, 10, 12, G.GARDEN);
  m.fill(68, 80, 4, 8, G.PLAZA);
  sprite(m, 'obelisco', 70, 82, { scale: 1.35, w: 60, up: 100, collide: [-10, -8, 20, 8], interact: 'obelisco' });
  area(m, 'Obelisco a Rioseco y Ornelas ("la Botella")', 64, 74, 12, 14, 'monument');
  for (const [tx, ty] of [[66, 77], [73, 77], [66, 86], [74, 86]]) tree(m, tx, ty, 'jacaranda', { size: 0.9 });

  // --- east of the plaza -------------------------------------------------
  // Parroquia de San Francisco: nave to the north, open atrium to the street
  m.fill(140, 94, 12, 18, G.PLAZA); m.fill(140, 94, 2, 10, G.GARDEN); m.fill(150, 94, 2, 10, G.GARDEN);
  building(m, 'sanfrancisco', 142, 94, 8, 10, { tall: 130, ground: G.GARDEN });
  for (const [tx, ty] of [[141, 106], [150.5, 106], [141, 110], [150.5, 110], [140.8, 97], [151, 99]]) tree(m, tx, ty, ty < 104 ? 'laurel' : 'jacaranda', { size: 0.95 });
  m.structures.push({ kind: 'wall', x: 140, y: 111, w: 5, h: 1, color: '#d9c2a3', layer: 3 }, { kind: 'wall', x: 147, y: 111, w: 5, h: 1, color: '#d9c2a3', layer: 3 });
  m.setSolid(140, 111, 5, 1); m.setSolid(147, 111, 5, 1);
  area(m, 'Parroquia de San Francisco de Asís', 140, 94, 12, 18, 'building');
  area(m, 'Atrio de San Francisco', 140, 104, 12, 8, 'plaza');
  door(m, 146, 103, 'templo_sf', 'Parroquia de San Francisco', { hours: [6, 21] });
  m.fill(156, 94, 12, 18, G.GARDEN);
  building(m, 'biblioteca', 156, 94, 12, 12, { tall: 90 });
  m.fill(160, 106, 4, 6, G.PLAZA);
  for (const [tx, ty] of [[157.5, 108], [166.5, 108], [157.5, 111], [166.5, 111]]) tree(m, tx, ty, 'jacaranda', { size: 0.9 });
  area(m, 'Biblioteca Pública Gabino Ortiz', 156, 94, 12, 18, 'building');
  door(m, 162, 105, 'biblioteca', 'Biblioteca Gabino Ortiz', { hours: [9, 19] });
  sprite(m, 'sitio', 158, 112.95, { scale: 1.2, w: 20, up: 24, collide: [-7, -3, 14, 3], interact: 'sitio', sitio: 'Biblioteca' });
  area(m, 'Sitio de taxis Gabino Ortiz', 154, 112, 12, 4, 'taxi');
  for (const tx of [155, 161, 164]) sprite(m, 'parkedCar', tx, 114, { color: '#f4f4f0', taxi: '#1b7a3e', w: 36, up: 24, collide: [-14, -6, 28, 6] });
  // Frijoles & the carnicería on Vicente Guerrero
  block(m, 172, 94, 12, 18, {
    facades: [
      { x: 172, w: 6, exact: true, kind: 'shop', sign: 'FRIJOLES', signBg: '#f3d36b', signFg: '#5a2d0c', fh: 36 },
      { x: 178, w: 6, exact: true, kind: 'shop', sign: 'CARNICERÍA', signBg: '#f6f1e6', signFg: '#a01818', fh: 36 },
    ],
  });
  door(m, 175, 111, 'frijoles', 'Tienda "Frijoles"', { hours: [8, 22] });
  door(m, 181, 111, 'carniceria', 'Carnicería de la esquina', { hours: [7, 20] });
  area(m, 'Tienda "Frijoles"', 172, 94, 6, 18, 'shop');
  // abuela's house
  block(m, 188, 94, 12, 10, { facadeH: 0 });
  block(m, 188, 104, 4, 8); block(m, 198, 104, 2, 8);
  building(m, 'casaAbuela', 192, 104, 6, 8, { tall: 40 });
  door(m, 195, 111, 'casa_abuela', 'Casa de la abuela Chayo');
  area(m, 'Casa de la abuela', 192, 104, 6, 8, 'home');
  // Jardín de la Paz
  m.fill(188, 116, 12, 12, G.PLAZA); m.fill(190, 118, 3, 3, G.GARDEN); m.fill(195, 118, 3, 3, G.GARDEN); m.fill(190, 123, 3, 3, G.GARDEN); m.fill(195, 123, 3, 3, G.GARDEN);
  for (const [tx, ty] of [[191, 120], [196, 120], [191, 125], [196, 125]]) { tree(m, tx + 0.5, ty + 0.2, ty < 122 ? 'jacaranda' : 'fresno', { size: 0.95 }); m.setSolid(tx - 1, ty - 2, 3, 3); }
  for (const [bx, by] of [[194, 118.5], [194, 126.8], [189, 122.5], [199, 122.5]]) sprite(m, 'bench', bx, by, { w: 20, up: 12, collide: [-8, -4, 16, 4], seat: true });
  for (const [lx, ly] of [[188.5, 116.5], [199.5, 116.5], [188.5, 127.5], [199.5, 127.5]]) { sprite(m, 'lamp', lx, ly, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, lx, ly - 1, 70); }
  area(m, 'Jardín de la Paz', 188, 116, 12, 12, 'plaza');
  building(m, 'hospital', 172, 116, 12, 12, { label: 'HOSPITAL GENERAL', tall: 60 });
  area(m, 'Hospital General', 172, 116, 12, 12, 'building');
  door(m, 178, 127, 'hospital', 'Hospital General');
  // escuela
  building(m, 'escuela', 188, 58, 12, 12);
  area(m, 'Escuela Primaria', 188, 58, 12, 12, 'building');

  // --- west of the plaza --------------------------------------------------
  building(m, 'casacultura', 96, 94, 14, 18);
  area(m, 'Casa de la Cultura', 96, 94, 14, 18, 'building');
  door(m, 103, 111, 'casa_cultura', 'Casa de la Cultura', { hours: [9, 20] });

  // --- south portal corridor ----------------------------------------------
  m.fill(114, 116, 22, 2, G.FLOOR_STONE);
  block(m, 114, 118, 22, 10, { facadeH: 34 });
  for (let x = 114.5; x < 136; x += 2) sprite(m, 'portalCol', x, 116.2, { w: 12, up: 40, collide: [-1.4, -2, 2.8, 2] });
  area(m, 'Portales de la Plaza', 114, 116, 22, 2, 'portal');
  door(m, 118, 118, 'la_cochera', 'La Cochera (café)', { fromSouth: true, hours: [8, 22] });
  door(m, 125, 118, 'portal_nieves', 'Nevería del Portal', { fromSouth: true, hours: [10, 22] });
  sprite(m, 'hangSign', 118, 117.9, { text: 'LA COCHERA', bg: '#2b2420', fg: '#e9d7b0', w: 30, up: 30 });
  sprite(m, 'hangSign', 125, 117.9, { text: 'NIEVES', bg: '#f5e6ef', fg: '#b2386b', w: 30, up: 30 });

  // --- Santuario & the south grid -----------------------------------------
  m.fill(114, 132, 22, 12, G.GARDEN); m.fill(114, 141, 22, 3, G.PLAZA);
  building(m, 'santuario', 121, 132, 8, 9, { tall: 140, ground: G.GARDEN });
  for (const [tx, ty] of [[116, 135], [119, 138], [116, 140], [131, 135], [134, 138], [131, 140]]) tree(m, tx, ty, tx < 125 ? 'jacaranda' : 'fresno', { size: 0.95 });
  area(m, 'Santuario del Sagrado Corazón', 114, 132, 22, 12, 'building');
  door(m, 125, 140, 'santuario', 'Santuario del Sagrado Corazón', { hours: [6, 21] });
  block(m, 156, 132, 12, 12, { facades: [{ x: 158, w: 7, exact: true, kind: 'shop', sign: 'MICHELADAS NORMA', signBg: '#1f4fa0', signFg: '#fff', fh: 36 }] });
  door(m, 161, 143, 'micheladas_norma', 'Micheladas de Norma', { hours: [12, 24] });
  sprite(m, 'mesas', 161.5, 145, { color: '#1f4fa0', w: 44, up: 40, collide: [-18, -4, 36, 4] });
  block(m, 204, 116, 12, 12, { facades: [{ x: 206, w: 7, exact: true, kind: 'shop', sign: 'MICHELADAS DE NICO', signBg: '#f2c230', signFg: '#1b1b1b', fh: 36 }] });
  door(m, 209, 127, 'micheladas_nico', 'Micheladas de Nico', { hours: [12, 24] });
  sprite(m, 'mesas', 209.5, 129, { color: '#f2c230', w: 44, up: 40, collide: [-18, -4, 36, 4] });
  block(m, 204, 74, 12, 14, {
    facades: [
      { x: 205, w: 7, exact: true, kind: 'shop', sign: 'LA PANTERA ROSA', signBg: '#f06aa8', signFg: '#fff', wall: '#f7c6dc', band: '#c2447e', fh: 38 },
      { x: 212, w: 4, exact: true, kind: 'shop', sign: 'BILLAR', signBg: '#10331f', signFg: '#f7f1d0', fh: 38 },
    ],
  });
  door(m, 208, 87, 'pantera_rosa', 'Micheladas La Pantera Rosa', { hours: [12, 24] });
  door(m, 214, 87, 'billar_entrada', 'Billar de la entrada', { hours: [11, 24] });
  sprite(m, 'mesas', 208.5, 88.95, { color: '#f06aa8', w: 44, up: 40, collide: [-18, -4, 36, 4] });
  block(m, 48, 58, 12, 12, { facades: [{ x: 51, w: 7, exact: true, kind: 'shop', sign: 'MICHELADAS LUPITA', signBg: '#d4302b', signFg: '#fff', fh: 36 }] });
  door(m, 54, 69, 'micheladas_lupita', 'Micheladas Lupita', { hours: [11, 24] });
  sprite(m, 'mesas', 54.5, 70.95, { color: '#d4302b', w: 44, up: 40, collide: [-18, -4, 36, 4] });

  // --- Parque Juárez, escalinata, Monumento a Juárez ---------------------------
  for (let y = 116; y < 186; y++) for (let x = 12; x < 88; x++) {
    const n = fbm(x * 0.09, y * 0.09, 21, 3);
    m.set(x, y, n > 0.52 ? G.FOREST : G.GRASS);
  }
  area(m, 'Parque Juárez', 12, 116, 76, 70, 'park');
  // winding paths
  const path = (pts) => { for (let i = 0; i < pts.length - 1; i++) { let [x, y] = pts[i]; const [bx, by] = pts[i + 1]; while (x !== bx || y !== by) { m.fill(x, y, 2, 2, G.DIRT); x += Math.sign(bx - x); y += Math.sign(by - y); } } };
  path([[86, 124], [70, 128], [58, 140], [52, 152]]);
  path([[20, 120], [30, 136], [44, 150], [50, 152]]);
  path([[56, 158], [66, 168], [80, 176], [86, 180]]);
  path([[44, 158], [30, 170], [18, 182]]);
  // mirador plaza with the monument
  m.fill(44, 150, 13, 9, G.PLAZA);
  sprite(m, 'monJuarez', 50.5, 155.5, { scale: 1.4, w: 44, up: 60, collide: [-17, -8, 34, 8], interact: 'juarez' });
  area(m, 'Monumento a Juárez (mirador)', 44, 150, 13, 9, 'monument');
  // the escalinata down to Calle 18 de Marzo
  m.fill(49, 159, 3, 27, G.STAIRS);
  for (let y = 160; y < 186; y += 3) { sprite(m, 'balustre', 48.6, y + 0.6, { w: 8, up: 10, collide: [-2, -2, 4, 2] }); sprite(m, 'balustre', 52.4, y + 0.6, { w: 8, up: 10, collide: [-2, -2, 4, 2] }); }
  area(m, 'Escalinata de Juárez', 48, 159, 5, 27, 'stairs');
  sprite(m, 'portadaJuarez', 50.5, 186, { scale: 1.45, w: 60, up: 70 });
  area(m, 'Portada del Parque Juárez', 44, 184, 13, 3, 'monument');
  // park trees: jacarandas, fresnos, pines, eucalyptus
  for (let i = 0; i < 260; i++) {
    const x = 13 + Math.floor(hash2(i, 1, 99) * 74), y = 117 + Math.floor(hash2(i, 2, 99) * 67);
    if (m.get(x, y) === G.DIRT || m.get(x, y) === G.PLAZA || m.get(x, y) === G.STAIRS) continue;
    if (x > 45 && x < 55 && y > 148) continue;
    const kinds = ['jacaranda', 'jacaranda', 'fresno', 'pino', 'eucalipto', 'laurel'];
    tree(m, x + 0.5, y + 0.8, kinds[Math.floor(hash2(i, 3, 99) * kinds.length)]);
  }

  // --- Estadio 18 de Marzo --------------------------------------------------
  const SX = 102, SY = 148, SW = 54, SH = 34;
  m.fill(SX, SY, SW, SH, G.OUTFIELD);
  m.structures.push({ kind: 'wall', x: SX, y: SY, w: SW, h: 1, color: '#e6ddcc', layer: 3 });
  m.structures.push({ kind: 'wall', x: SX, y: SY, w: 1, h: SH, color: '#e6ddcc', layer: 3 });
  m.structures.push({ kind: 'wall', x: SX + SW - 1, y: SY, w: 1, h: SH, color: '#e6ddcc', layer: 3 });
  m.structures.push({ kind: 'wall', x: SX, y: SY + SH - 1, w: 24, h: 1, color: '#e6ddcc', layer: 3 });
  m.structures.push({ kind: 'wall', x: SX + 30, y: SY + SH - 1, w: SW - 30, h: 1, color: '#e6ddcc', layer: 3 });
  m.setSolid(SX, SY, SW, 1); m.setSolid(SX, SY, 1, SH); m.setSolid(SX + SW - 1, SY, 1, SH);
  m.setSolid(SX, SY + SH - 1, 24, 1); m.setSolid(SX + 30, SY + SH - 1, SW - 30, 1);
  m.structures.push({ kind: 'diamond', x: SX + 2, y: SY + 2, w: 34, h: 30, layer: 1 });
  m.fill(140, 150, 14, 12, G.COURT);
  m.structures.push({ kind: 'basketball', x: 141, y: 150, w: 6, h: 11, layer: 1 });
  m.structures.push({ kind: 'basketball', x: 147, y: 150, w: 6, h: 11, layer: 1 });
  sprite(m, 'hoop', 144, 150.6, { w: 14, up: 44 }); sprite(m, 'hoop', 150, 150.6, { w: 14, up: 44 });
  sprite(m, 'hoop', 144, 161.2, { w: 14, up: 44 }); sprite(m, 'hoop', 150, 161.2, { w: 14, up: 44 });
  sprite(m, 'gradas', 119, 180.5, { fw: 180, w: 190, up: 40, collide: [-90, -8, 180, 8] });
  area(m, 'Estadio 18 de Marzo', SX, SY, SW, SH, 'stadium');
  area(m, 'Canchas de básquetbol', 140, 150, 14, 12, 'court');
  // forecourt, portada with the eagle, Monumento a Lázaro Cárdenas
  m.fill(100, 182, 60, 4, G.PLAZA);
  m.fill(126, 180, 4, 2, G.PLAZA); m.setSolid(126, 180, 4, 2, 0);
  sprite(m, 'portadaEstadio', 128, 182, { scale: 1.45, w: 90, up: 100, interact: 'estadio' });
  area(m, 'Portada del Estadio 18 de Marzo', 118, 180, 20, 6, 'monument');
  sprite(m, 'monCardenas', 110, 184.6, { scale: 1.4, w: 34, up: 70, collide: [-12, -7, 24, 7], interact: 'cardenas' });
  area(m, 'Monumento a Lázaro Cárdenas', 104, 182, 12, 4, 'monument');
  for (const lx of [104, 116, 140, 152]) { sprite(m, 'lamp', lx, 182.6, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, lx, 181.6, 70); }

  // --- UNAM & the south-east ------------------------------------------------
  building(m, 'unam', 160, 148, 24, 16, { tall: 70 });
  area(m, 'UNAM — Unidad Académica de Estudios Regionales', 160, 148, 24, 16, 'building');
  door(m, 172, 163, 'unam', 'UNAM — Estudios Regionales', { hours: [9, 18] });
  for (const [bx, by, bw, bh] of [[188, 148, 12, 16], [204, 148, 12, 16], [172, 168, 12, 12], [188, 168, 12, 12], [204, 168, 12, 12],
    [158, 168, 10, 12], [172, 184, 12, 12], [188, 184, 12, 12], [204, 184, 12, 12], [158, 184, 10, 12]]) block(m, bx, by, bw, bh, { outskirts: true, facadeH: 30 });
  block(m, 188, 132, 12, 12); block(m, 172, 132, 12, 12);

  // --- Las Palmas: palms, fuente de los pescados, the curve ------------------
  for (let y = 113; y < 196; y += 3) tree(m, 92.5, y + 0.9, 'palma', { size: 0.95 });
  sprite(m, 'pescados', 93, 166.8, { scale: 1.25, w: 40, up: 40, collide: [-14, -8, 28, 8], interact: 'pescados' });
  area(m, 'Fuente de los Pescados', 91, 163, 4, 6, 'monument');
  m.fill(24, 190, 64, 6, G.GRASS);
  block(m, 60, 190, 26, 6, { facadeH: 30, facades: [{ x: 74, w: 6, exact: true, kind: 'shop', sign: 'TORTILLERÍA', signBg: '#f2c230', signFg: '#b01c1c', fh: 30 }] });
  door(m, 77, 195, 'tortilleria', 'Tortillería (Maseca)', { hours: [6, 15] });
  area(m, 'Tortillería de la curva', 72, 190, 10, 6, 'shop');
  building(m, 'hospital', 26, 190, 18, 6, { label: 'CLÍNICA IMSS', tall: 50 });
  area(m, 'Clínica IMSS', 26, 190, 18, 6, 'building');
  door(m, 35, 195, 'hospital', 'Clínica IMSS');
  block(m, 46, 190, 12, 6, { facadeH: 28, outskirts: true, facades: [{ x: 48, w: 6, exact: true, kind: 'shop', sign: 'ABARROTES', fh: 28 }] });
  door(m, 51, 195, 'tiendita_sur', 'Abarrotes "La Esperanza"', { hours: [7, 22] });
  // small blocks along Las Palmas' east side & the south grid
  block(m, 98, 116, 12, 12); block(m, 98, 132, 12, 12, { facades: [{ x: 100, w: 6, exact: true, kind: 'shop', sign: 'CELULARES', fh: 36 }] });
  block(m, 140, 116, 12, 12); block(m, 140, 132, 12, 12); block(m, 156, 116, 12, 12);

  // --- Bosque Cuauhtémoc ---------------------------------------------------------
  for (let y = 200; y < m.h; y++) for (let x = 8; x < 250; x++) m.set(x, y, G.FOREST);
  area(m, 'Bosque Cuauhtémoc', 8, 200, 242, 34, 'forest');
  laneLoop(m, [[30, 205], [230, 205], [230, 229], [30, 229]], G.DIRTROAD, 'Circuito del Bosque');
  vStreet(m, 'Av. Las Palmas', 88, 199, 206, 10, { surface: G.ASPHALT, median: true });
  // walking track
  for (let x = 40; x < 220; x++) { m.set(x, 216, G.DIRT); m.set(x, 217, G.DIRT); }
  for (let i = 0; i < 520; i++) {
    const x = 9 + Math.floor(hash2(i, 5, 7) * 240), y = 200 + Math.floor(hash2(i, 6, 7) * 33);
    const g = m.get(x, y); if (g !== G.FOREST) continue;
    if (m.get(x, y + 1) !== G.FOREST || m.get(x + 1, y) !== G.FOREST) continue;
    const kinds = ['eucalipto', 'eucalipto', 'jacaranda', 'fresno', 'pino', 'pino', 'laurel'];
    tree(m, x + 0.5, y + 0.8, kinds[Math.floor(hash2(i, 8, 7) * kinds.length)], { size: 1 + hash2(i, 9, 7) * 0.35 });
  }
  sprite(m, 'mesas', 103, 203, { color: '#2e8b57', w: 44, up: 40, collide: [-18, -4, 36, 4] });
  sprite(m, 'cart', 107.5, 203, { cart: 'micheladas', color: '#2e8b57', sign: 'MICHELADAS DEL BOSQUE', umbrella: '#2e8b57', w: 34, up: 44, collide: [-11, -4, 22, 4], interact: 'vendor', vendor: 'micheladas_bosque' });
  area(m, 'Micheladas del Bosque', 100, 200, 12, 5, 'shop');
  for (const [lx, ly] of [[60, 206], [100, 206], [140, 206], [180, 206], [220, 206], [60, 228], [140, 228], [220, 228]]) { sprite(m, 'lamp', lx, ly, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, lx, ly - 1, 70); }

  // --- north: countryside, Chamacuero, San Cayetano, corrales, the Cerro path ---
  building(m, 'chamacuero', 12, 18, 12, 9, { tall: 40 });
  door(m, 18, 26, 'chamacuero', 'Mezcal El Chamacuero', { hours: [9, 20] });
  area(m, 'El Chamacuero (mezcal)', 10, 14, 16, 16, 'shop');
  for (let i = 0; i < 20; i++) sprite(m, 'agave', 6 + (i % 5) * 4 + 0.5, 30 + Math.floor(i / 5) * 1.5, { w: 22, up: 16, collide: [-3, -2, 6, 2] });
  building(m, 'capilla', 60, 16, 10, 8, { label: 'SAN CAYETANO', tall: 60 });
  door(m, 65, 23, 'capilla_cayetano', 'Capilla de San Cayetano', { hours: [7, 19] });
  area(m, 'Capilla de San Cayetano', 56, 14, 18, 12, 'building');
  // corrales / pajaretes
  m.fill(196, 16, 30, 16, G.DIRT);
  m.structures.push({ kind: 'fence', x: 196, y: 16, w: 30, h: 1, layer: 3 }, { kind: 'fence', x: 196, y: 31, w: 12, h: 1, layer: 3 },
    { kind: 'fence', x: 212, y: 31, w: 14, h: 1, layer: 3 }, { kind: 'fence', x: 196, y: 16, w: 1, h: 16, layer: 3 }, { kind: 'fence', x: 225, y: 16, w: 1, h: 16, layer: 3 });
  m.setSolid(196, 16, 30, 1); m.setSolid(196, 31, 12, 1); m.setSolid(212, 31, 14, 1); m.setSolid(196, 16, 1, 16); m.setSolid(225, 16, 1, 16);
  sprite(m, 'corralShade', 204, 22, { scale: 1.2, w: 60, up: 44, collide: [-12, -8, 24, 8], interact: 'pajarete' });
  tree(m, 220, 20, 'fresno', { size: 1.3 });
  area(m, 'Corrales — pajaretes de Don Refugio', 196, 16, 30, 16, 'ranch');
  // scattered huizaches, nopales, rocks on the hillside
  for (let i = 0; i < 180; i++) {
    const x = Math.floor(hash2(i, 11, 3) * m.w), y = 11 + Math.floor(hash2(i, 12, 3) * 24);
    const g = m.get(x, y); if (g !== G.GRASS && g !== G.FIELD) continue;
    if ((x > 194 && x < 228 && y > 14 && y < 33) || (x > 8 && x < 28 && y > 12 && y < 32) || (x > 54 && x < 76 && y > 12 && y < 28)) continue;
    const r = hash2(i, 13, 3);
    if (r < 0.4) tree(m, x + 0.5, y + 0.8, r < 0.2 ? 'huizache' : 'encino', { size: 0.8 + r });
    else if (r < 0.6) sprite(m, 'nopal', x + 0.5, y + 0.8, { w: 18, up: 24, collide: [-3, -2, 6, 2] });
    else if (r < 0.8) sprite(m, 'rock', x + 0.5, y + 0.8, { size: 0.8 + r * 0.5, w: 20, up: 12, collide: [-6, -3, 12, 3] });
    else sprite(m, 'agave', x + 0.5, y + 0.8, { w: 22, up: 16, collide: [-3, -2, 6, 2] });
  }
  sprite(m, 'antenna', 150.5, 6, { w: 14, up: 90 });
  sprite(m, 'signpost', 128.6, 35.5, { text: 'CERRO DE SAN FRANCISCO ↑', bg: '#6b4a30', w: 60, up: 30 });
  m.exits.push({ x: 125, y: 0, w: 3, h: 1, to: 'cerro', tx: 40, ty: 116, label: 'Cerro de San Francisco' });
  area(m, 'Subida al Cerro de San Francisco', 118, 0, 16, 36, 'trail');

  // --- east entrance ---------------------------------------------------------
  building(m, 'palmira', 222, 72, 13, 14, { tall: 100 });
  area(m, 'Hotel Palmira', 222, 72, 13, 14, 'building');
  door(m, 228, 85, 'hotel_palmira', 'Hotel Palmira');
  building(m, 'oxxo', 237, 78, 9, 8, { tall: 30 });
  area(m, 'OXXO', 237, 78, 9, 8, 'shop');
  door(m, 241, 85, 'oxxo', 'OXXO');
  building(m, 'pemex', 248, 74, 11, 12, { tall: 70 });
  m.setSolid(248, 74, 11, 12, 0); m.fill(248, 74, 11, 12, G.ASPHALT); m.setSolid(248, 74, 11, 3, 1);
  area(m, 'PEMEX', 248, 74, 11, 12, 'shop');
  sprite(m, 'sitio', 236.2, 86.95, { scale: 1.2, w: 20, up: 24, collide: [-7, -3, 14, 3], interact: 'sitio', sitio: 'Entrada' });
  area(m, 'Sitio de taxis de la Entrada', 230, 86, 10, 2, 'taxi');
  sprite(m, 'gallo', 225, 91.6, { scale: 1.25, w: 30, up: 40, collide: [-12, -6, 24, 6] });
  sprite(m, 'gallo', 233, 91.6, { scale: 1.25, flip: true, w: 30, up: 40, collide: [-12, -6, 24, 6] });
  sprite(m, 'whiteLetters', 229.2, 91.4, { scale: 1.3, w: 80, up: 20, collide: [-34, -4, 68, 4] });
  area(m, 'Los Gallos y las letras de JIQUILPAN', 223, 90, 13, 2, 'monument');
  sprite(m, 'glorietaSign', 241.5, 93.45, { scale: 1.3, w: 100, up: 80 });
    area(m, 'Glorieta "Jiquilpan Pueblo Mágico"', 236, 86, 11, 10, 'monument');
  for (const lx of [222, 230, 250]) { sprite(m, 'lamp', lx, 86.6, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, lx, 85.6, 80); }
  // panteón
  m.fill(222, 100, 30, 30, G.CEMETERY);
  for (const [x, y, w, h] of [[222, 100, 30, 1], [222, 100, 1, 30], [251, 100, 1, 30], [222, 129, 13, 1], [239, 129, 13, 1]]) {
    m.structures.push({ kind: 'wall', x, y, w, h, color: '#e9e2d4', layer: 3 }); m.setSolid(x, y, w, h);
  }
  m.structures.push({ kind: 'tomb', x: 224, y: 102, w: 26, h: 26, layer: 4 });
  for (let y = 102; y < 128; y++) for (let x = 224; x < 250; x++) if ((x - 224) % 3 !== 2 && (y - 102) % 3 !== 2 && !(x >= 234 && x <= 239)) m.setSolid(x, y);
  sprite(m, 'panteonGate', 237, 130, { w: 60, up: 50 });
  sprite(m, 'capilla', 237, 106, { color: '#ece6da', w: 60, up: 60 }); m.setSolid(234, 102, 6, 4);
  for (const [tx, ty] of [[226, 110], [248, 112], [230, 124], [246, 124]]) sprite(m, 'tree', tx, ty, { tree: 'pino', seed: tx * 3 + ty, size: 1.1, w: 40, up: 80 });
  area(m, 'Panteón Municipal', 222, 100, 30, 30, 'cemetery');

  // --- generic blocks for the rest of the grid -------------------------------
  const vx = VX.map(v => v[0]);
  const hy = HY.map(h => h[0]);
  const hw = { 36: 4, 54: 4, 70: 4, 88: 6, 112: 4, 128: 4, 144: 4 };
  for (let j = 0; j < hy.length - 1; j++) {
    for (let i = 0; i < vx.length - 1; i++) {
      const x = vx[i] + 4, x1 = vx[i + 1];
      const y = hy[j] + hw[hy[j]], y1 = hy[j + 1];
      if (y >= 116 && x < 98) continue; // park
      const w = x1 - x, h = y1 - y;
      if (w <= 0 || h <= 0) continue;
      // skip if anything already occupies this block
      let used = false;
      for (let yy = y; yy < y1 && !used; yy++) for (let xx = x; xx < x1; xx++) { const g = m.get(xx, yy); if (g !== G.GRASS && g !== G.FIELD) { used = true; break; } }
      if (used) continue;
      const outskirts = x < 30 || x > 200 || y < 54;
      block(m, x, y, w, h, { outskirts, facadeH: outskirts ? 30 : 36 });
      // make some facades enterable as small shops / homes
      if (!outskirts && hash2(x, y, 5) < 0.6) door(m, x + Math.floor(w / 2), y1 - 1, 'tiendita', 'Tiendita de la esquina', { hours: [7, 22], generic: true });
    }
  }
  // blocks east of Calle Juárez before the entrance
  block(m, 220, 40, 14, 12, { outskirts: true, facadeH: 30 }); block(m, 236, 40, 16, 12, { outskirts: true, facadeH: 30 });
  hStreet(m, 'Calle Revolución', 216, 256, 52, 4, { surface: G.DIRTROAD, sidewalk: false });
  block(m, 220, 58, 14, 10, { outskirts: true, facadeH: 30 }); block(m, 236, 58, 16, 10, { outskirts: true, facadeH: 30 });

  // --- road paint, topes, zebra crossings ------------------------------------
  m.structures.push({ kind: 'laneH', x: 0, y: 88, w: 220, h: 6, layer: 1, color: 'rgba(245,215,90,0.85)' });
  m.structures.push({ kind: 'laneH', x: 14, y: 196, w: 74, h: 5, layer: 1 });
  m.structures.push({ kind: 'laneH', x: 0, y: 112, w: 220, h: 4, layer: 1, color: 'rgba(245,242,230,0.6)' });
  for (const [x, y, w, h, v] of [[110, 94, 4, 2, 1], [136, 94, 4, 2, 1], [110, 108, 4, 2, 1], [136, 108, 4, 2, 1], [114, 89, 2, 4, 0], [134, 89, 2, 4, 0], [114, 113, 2, 2, 0], [134, 113, 2, 2, 0]])
    m.structures.push({ kind: 'zebra', x, y, w, h, vertical: !!v, layer: 1 });
  for (const [x, y] of [[40, 89], [180, 89], [128, 37], [60, 113], [200, 129]]) m.structures.push({ kind: 'tope', x, y, w: 2, h: 1, layer: 1 });

  // --- sidewalk trees & lamps along the avenue ----------------------------------
  for (let x = 4; x < 216; x += 10) {
    if (m.get(x, 93) === G.SIDEWALK && m.get(x, 94) === G.ROOF) { sprite(m, 'lamp', x + 0.5, 93.8, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, x + 0.5, 93, 70); }
  }
  for (let y = 116; y < 200; y += 8) { sprite(m, 'lamp', 88.4, y + 0.5, { scale: 1.25, w: 8, up: 32, collide: [-1, -1, 2, 2] }); light(m, 88.4, y - 0.5, 70); }

  // --- tianguis (by weekday) ------------------------------------------------
  // Friday: around the Jardín de la Paz (Calle Madero & Calle Iturbide)
  const fri = [];
  for (let y = 117; y < 142; y += 2.2) fri.push({ kind: 'stall', x: 185.9 * TILE, y: y * TILE + 8, fw: 26, w: 36, up: 40, seed: y * 3, collide: [-13, -5, 26, 5], interact: 'tianguis' });
  for (let x = 190; x < 214; x += 2.2) fri.push({ kind: 'stall', x: x * TILE + 8, y: 130.2 * TILE, fw: 26, w: 36, up: 40, seed: x * 5, collide: [-13, -5, 26, 5], interact: 'tianguis' });
  m.daySprites[5] = fri;
  m.closedByDay[5] = [[184, 116, 4, 28], [188, 128, 28, 4]];
  // Saturday: Calle Morelos closed beside the mercado + Calle 18 de Marzo by the stadium
  const sat = [];
  for (let y = 74.5; y < 110; y += 2.2) sat.push({ kind: 'stall', x: 137.9 * TILE, y: y * TILE + 8, fw: 26, w: 36, up: 40, seed: y * 7, collide: [-13, -5, 26, 5], interact: 'tianguis' });
  for (let x = 56; x < 124; x += 2.3) {
    if (x > 86 && x < 99) continue;
    sat.push({ kind: 'stall', x: x * TILE + 8, y: 187.9 * TILE, fw: 28, w: 38, up: 40, seed: x * 11, collide: [-14, -5, 28, 5], interact: 'tianguis' });
  }
  sat.push({ kind: 'stall', x: 100 * TILE, y: 190.8 * TILE, fw: 34, w: 40, up: 40, seed: 77, tarp: '#1f6fb3', goods: 'pots', sign: 'BIRRIA DE GUATEMALA', collide: [-17, -5, 34, 5], interact: 'vendor', vendor: 'birria_guatemala' });
  m.daySprites[6] = sat;
  m.closedByDay[6] = [[136, 74, 4, 38], [56, 186, 68, 4]];

  // "SE BUSCA" posters that appear when the three return (act III)
  for (const [x, y] of [[113.4, 93.6], [136.6, 111.6], [157.2, 112.4], [168.6, 90.4], [96.8, 120], [139.6, 76], [186.6, 113], [124, 36.8]]) sprite(m, 'poster', x, y, { w: 16, up: 30, acts: [3], interact: 'poster' });

  // --- named areas for the map ---------------------------------------------------
  area(m, 'Av. Lázaro Cárdenas', 0, 88, 220, 6, 'street');
  area(m, 'Av. Las Palmas', 88, 112, 10, 90, 'street');
  area(m, 'Entrada a Jiquilpan', 216, 70, 44, 30, 'district');
  area(m, 'Centro Histórico', 76, 70, 110, 76, 'district');
  area(m, 'Barrio de San Cayetano', 10, 36, 50, 34, 'district');
  area(m, 'Colonia El Tanque', 150, 36, 70, 34, 'district');
  area(m, 'Colonia Emiliano Zapata', 156, 164, 60, 36, 'district');
  m.exits.push({ x: 0, y: 88, w: 1, h: 6, to: 'sahuayo_sign', label: 'Carretera a Sahuayo' });
  m.exits.push({ x: 259, y: 86, w: 1, h: 10, to: 'zamora_sign', label: 'Carretera a Zamora' });

  // spawn points
  m.spawns = {
    start: { x: 195.5, y: 113 },
    plaza: { x: 125.5, y: 99 },
    cerroPath: { x: 126.5, y: 2 },
    sitioBiblioteca: { x: 158.5, y: 114.5 },
    sitioMercado: { x: 138.5, y: 86 },
    sitioEntrada: { x: 236.5, y: 88 },
  };

  // layer order for baked structures
  m.structures.sort((a, b) => (a.layer || 0) - (b.layer || 0));
  m.baseSprites = m.sprites.slice();
  return m;
}

// Swap tianguis stalls in/out for the given weekday.
export function applyWeekday(m, day) {
  if (!m.baseSprites) return;
  m.sprites = m.baseSprites.concat(m.daySprites?.[day] || []);
  m.closed = new Uint8Array(m.w * m.h);
  for (const [x, y, w, h] of (m.closedByDay?.[day] || [])) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m.inb(i, j)) m.closed[j * m.w + i] = 1;
  }
  m.finalize();
}
