// The insides of the places that matter: three churches that are not alike, the Biblioteca Gabino
// Ortiz with its painted walls, the two floors of the Ayuntamiento, and shops that each have their own
// tools and their own customers coming and going.
import { G } from '../world.js';
import { room, counter, table, shelf, registerInteriors } from './interiors.js';

// seats in the pews: just in front of each pew's bench, facing the altar
const pewSeats = (rows, spans) => { const out = []; for (const y of rows) for (const [a, b] of spans) for (let x = a; x <= b; x += 1.6) out.push([x, y + 0.12, 1, 'sit']); return out; };
const col = (x, y, kind, fw, up, extra = {}) => ({ kind, x, y, fw, w: fw + 8, up, ...extra });
// customers: people come in by the door, go to the counter, buy, and leave
const shopPeople = (counterAt, sitSpots = [], max = 2, lines) => ({ customers: { counter: counterAt, max, lines }, spots: sitSpots });

registerInteriors({
  // ---- Parroquia de San Francisco de Asís: the big one. Gilded retablo, the pipe organ, side altars,
  // a confessional, veladoras for $5, and on Sundays Don Cleto at the organ.
  templo_sf: () => {
    const items = [
      col(12, 7.4, 'retablo', 112, 124, { fh: 92, collide: [-56, -6, 112, 6] }),
      col(12, 9.8, 'altarMesa', 40, 30, { collide: [-20, -6, 40, 6], interact: 'altar_iglesia' }),
      col(8.2, 10.8, 'ambon', 12, 22, { collide: [-4, -2, 8, 2] }),
      col(15.6, 11.2, 'lampara', 8, 62),
      col(3, 12.4, 'organ', 40, 78, { collide: [-20, -6, 40, 6], interact: 'organo' }),
      col(2.6, 17.6, 'sideAltar', 22, 36, { image: 'guadalupe', collide: [-10, -4, 20, 4], interact: 'altar_guadalupe' }),
      col(21.4, 17.6, 'sideAltar', 22, 36, { image: 'corazon', collide: [-10, -4, 20, 4], interact: 'altar_corazon' }),
      col(21, 13.0, 'veladoras', 26, 20, { seed: 7, collide: [-12, -3, 24, 3], interact: 'veladora' }),
      col(21.4, 21.6, 'confesionario', 26, 38, { collide: [-12, -4, 24, 4], interact: 'confesion' }),
      col(10, 22.3, 'pila', 12, 12, { collide: [-4, -2, 8, 2], interact: 'pila' }),
      col(14, 22.3, 'pila', 12, 12, { collide: [-4, -2, 8, 2], interact: 'pila' }),
    ];
    for (const y of [13.4, 15.1, 16.8, 18.5, 20.2]) for (const x of [6.8, 17.2]) items.push(col(x, y, 'pewNice', 80, 18, { collide: [-40, -6, 80, 6] }));
    const m = room('templo_sf', 'Parroquia de San Francisco de Asís', { w: 24, h: 24, wallRows: 7, floor: G.FLOOR_STONE, wall: '#efe4cf', frame: '#7a6650',
      grand: { stone: '#cdb48e', bays: 5, bayKinds: ['niche', 'window', 'none', 'window', 'niche'], wainscot: '#8e2f24' },
      pattern: { pat: 'marble', a: '#efe6d6', b: '#b0563c', size: 8 }, steps: [{ x: 1, y: 10.6, w: 22 }], zoom: 1.0,
      rugs: [{ x: 11, y: 12, w: 2, h: 11, color: '#8e2f35' }], exit: 12, items,
      lights: [[12, 9, 170, '#ffd98a'], [3, 13, 80, '#ffd98a'], [21, 13, 70, '#ffb35a'], [12, 18, 150, '#ffe8b0']], dim: 0.16 });
    m.occupants = { church: true, spots: pewSeats([13.4, 15.1, 16.8, 18.5, 20.2], [[3.6, 9.6], [14.4, 20.2]]), n: [3, 7] };
    return m;
  },
  // ---- Templo del Sagrado Corazón: Gothic. Pointed lancets of stained glass, a rose window, slender
  // clustered columns, the white altar of pinnacles. No great organ: a wheezy harmonium does the job.
  santuario: () => {
    const items = [
      col(11, 6.2, 'gothicAltar', 64, 92, { collide: [-32, -6, 64, 6], interact: 'altar_iglesia' }),
      col(3.4, 9.8, 'armonio', 22, 26, { collide: [-10, -3, 20, 3], interact: 'armonio' }),
      col(19, 9.6, 'sideAltar', 22, 36, { image: 'corazon', collide: [-10, -4, 20, 4], interact: 'altar_corazon' }),
      col(19, 14, 'veladoras', 22, 20, { seed: 3, collide: [-10, -3, 20, 3], interact: 'veladora' }),
      col(11, 22.3, 'pila', 12, 12, { collide: [-4, -2, 8, 2], interact: 'pila' }),
    ];
    for (const y of [10.2, 13.6, 17, 20.4]) for (const x of [6, 16]) items.push(col(x, y, 'gothicColumn', 12, 94, { fh: 76, collide: [-5, -3, 10, 3] }));
    for (const y of [11.6, 13.2, 14.8, 16.4, 18, 19.6]) for (const x of [8.6, 13.4]) items.push(col(x, y, 'pewNice', 40, 18, { collide: [-20, -6, 40, 6] }));
    const m = room('santuario', 'Templo del Sagrado Corazón', { w: 22, h: 24, wallRows: 5, floor: G.FLOOR_STONE, wall: '#e9e5dc', frame: '#6e6a66',
      grand: { style: 'gothic', wainscot: '#cfc8bb' }, pattern: { pat: 'marble', a: '#e9e5dc', b: '#5d5a62', size: 8 }, zoom: 1.0,
      steps: [{ x: 1, y: 8.4, w: 20 }], rugs: [{ x: 10, y: 10, w: 2, h: 13, color: '#6a1f2a' }], exit: 11, items,
      lights: [[11, 6, 160, '#fff0c8'], [11, 14, 150, '#dfe6ff'], [19, 13, 60, '#ffb35a']], dim: 0.2 });
    m.occupants = { church: true, spots: pewSeats([11.6, 13.2, 14.8, 16.4, 18, 19.6], [[7.6, 9.6], [12.4, 14.4]]), n: [2, 5] };
    return m;
  },
  // ---- El Santuario de las Monjas: a small baroque chapel, and beside it the nuns' torno where they
  // sell rompope, cajeta, ates, cocadas and the rosaries they make.
  templo_monjas: () => {
    const items = [
      col(8, 5.8, 'retablo', 66, 92, { fh: 70, collide: [-33, -6, 66, 6] }),
      col(8, 7.9, 'altarMesa', 32, 30, { collide: [-16, -6, 32, 6], interact: 'altar_iglesia' }),
      col(20, 8.8, 'tornoMonjas', 64, 50, { sign: 'DULCES DE LAS MADRES', collide: [-32, -6, 64, 6], shop: 'monjas', interact: 'shopcounter' }),
      col(14.6, 13.0, 'veladoras', 20, 20, { seed: 9, collide: [-9, -3, 18, 3], interact: 'veladora' }),
      col(8, 15.3, 'pila', 12, 12, { collide: [-4, -2, 8, 2], interact: 'pila' }),
    ];
    for (const y of [10.6, 12.2, 13.8]) for (const x of [4.4, 11.6]) items.push(col(x, y, 'pewNice', 64, 18, { collide: [-32, -6, 64, 6] }));
    const m = room('templo_monjas', 'El Santuario de las Monjas', { w: 24, h: 17, wallRows: 5, floor: G.FLOOR_TILE, wall: '#f2e8d4', frame: '#7a5a40',
      grand: { stone: '#c9a77a', bays: 4, bayKinds: ['niche', 'none', 'window', 'none'], wainscot: '#2f5a4a',
        deco: [{ kind: 'sign', x: 16.4, w: 100, text: 'DULCES, ROMPOPE Y ROSARIOS DE LAS MADRES', bg: '#5a1a22', fg: '#f7f0d8' }] },
      pattern: { pat: 'barro' }, rugs: [{ x: 7, y: 9, w: 2, h: 7, color: '#2f5a4a' }], exit: 8, items,
      lights: [[8, 7, 130, '#ffd98a'], [20, 8, 110, '#ffe2a8']], dim: 0.14 });
    m.occupants = { church: true, spots: pewSeats([10.6, 12.2, 13.8], [[2.6, 6.2], [9.8, 13.4]]), n: [1, 4], customers: { counter: [19, 10.4], max: 2, lines: ['Un rompope, madre, del grande.', '¿Tiene cajeta envinada?', 'Una docena de obleas, por favor.', '¿Me bendice este rosario, madre?'] } };
    return m;
  },
  // ---- Biblioteca Pública Gabino Ortiz: the old neo-Gothic church, a long nave of white walls under
  // the vault. The side walls carry the grisaille murals between pilasters, tall windows above, the
  // glass-fronted bookcases below; at the end, under the pointed arch, the allegory in colour over the
  // wood paneling. Red terracotta floor, long tables with green tops and carved chairs.
  biblioteca: () => {
    const W = 26, H = 36, SIDE = 4, ROWS = 8, BAY = 5.4;
    const left = [['HISTORIA', 'historia'], ['SOCIOLOGÍA', 'sociologia'], ['FILOSOFÍA', 'filosofia'], ['MICHOACÁN', 'michoacan'], ['HEMEROTECA']];
    const right = [['LITERATURA', 'literatura'], ['ENCICLOPEDIAS', 'enciclopedias'], ['ARTE', 'arte'], ['INFANTIL', 'infantil'], ['CONSULTA']];
    const items = [
      col(17.5, 31.2, 'mostrador', 56, 26, { sign: 'PRÉSTAMO Y DEVOLUCIÓN', collide: [-28, -6, 56, 6] }),
      col(21, 31.0, 'fichero', 18, 22, { collide: [-8, -3, 16, 3], interact: 'fichero' }),
      col(6.4, 31.4, 'globo', 12, 18, { collide: [-3, -2, 6, 2], interact: 'globo' }),
    ];
    for (const x of [8.5, 13, 17.5]) items.push({ kind: 'label', x, y: ROWS + 0.5, w: 40, up: 4, interact: 'mural_view' });
    const plaques = { left: [], right: [] };
    for (const [list, side] of [[left, 'left'], [right, 'right']]) list.forEach(([label, key], k) => {
      const b0 = ROWS + k * BAY;
      plaques[side].push({ y: b0 + BAY / 2, text: label });
      if (key) for (const j of [0, 1]) items.push({ kind: 'label', x: side === 'left' ? SIDE + 0.3 : W - SIDE - 0.3, y: b0 + 1.57 + j * 2.51 + 0.35, w: 20, up: 4, interact: 'libros', books: key, section: label });
    });
    const spots = [];
    [12.9, 17.3, 21.7, 26.1].forEach((y, row) => [8.5, 17.5].forEach((x, c) => {
      items.push(col(x, y, 'mesaLectura', 64, 34, { green: true, lamps: [-16, 16], books: (row + c) % 2 === 0, collide: [-32, -12, 64, 10] }));
      for (const dx of [-1.25, 0, 1.25]) {
        items.push(col(x + dx, y - 13 / 16, 'sillaTallada', 12, 24, { back: 'up' }));
        items.push(col(x + dx, y + 9 / 16, 'sillaTallada', 12, 18, { back: 'down' }));
        spots.push([x + dx, y - 12 / 16, 0, 'sit', 'lector'], [x + dx, y + 7 / 16, 1, 'sit', 'lector']);
      }
    }));
    const m = room('biblioteca', 'Biblioteca Pública Gabino Ortiz', { w: W, h: H, side: SIDE, wallRows: ROWS, floor: G.FLOOR_TILE, wall: '#efe9dd', frame: '#6e655a',
      mural: { seed: 1940 }, sideMurals: { bay: BAY, light: true, plaques }, pattern: { pat: 'barro', a: '#9a432b', b: '#b4573a', grout: '#6a3424' }, exit: 13, items, zoom: 1.05,
      lights: [[13, 9, 200, '#fff0d0'], ...[12.1, 16.5, 20.9, 25.3].flatMap(y => [[8.5, y, 80, '#fff0b0'], [17.5, y, 80, '#fff0b0']]), [17.5, 30, 110, '#ffe2a8']], dim: 0.08 });
    // the reader by the window always has a seat; the rest come and go
    m.occupants = { spots: [spots[1], ...spots.filter((_, i) => i !== 1)], n: [1, 4], quiet: true };
    return m;
  },
  // ---- The Ayuntamiento, ground floor: the patio's arcade, the windows of the Registro Civil, the
  // Tesorería, Obras Públicas and Atención Ciudadana, people waiting, and the stair to the Cabildo.
  palacio: () => {
    const items = [
      col(5, 4.9, 'ventanilla', 40, 30, { sign: 'REGISTRO CIVIL', collide: [-20, -6, 40, 6] }),
      col(11, 4.9, 'ventanilla', 40, 30, { sign: 'TESORERÍA · PREDIAL', collide: [-20, -6, 40, 6] }),
      col(17, 4.9, 'ventanilla', 40, 30, { sign: 'OBRAS PÚBLICAS', collide: [-20, -6, 40, 6] }),
      col(23, 4.9, 'ventanilla', 40, 30, { sign: 'ATENCIÓN CIUDADANA', signBg: '#8e2f24', collide: [-20, -6, 40, 6] }),
      { kind: 'mural', x: 2.6, y: 14.6, fw: 30, fh: 34, w: 36, up: 40, seed: 7, palette: ['#6b2e1f', '#b4622d', '#e9b04a', '#3b3f4a', '#2f6a4a'], collide: [-15, -4, 30, 4], interact: 'mural_palacio' },
      counter(23, 7.6, 40, { color: '#5b3a22', sign: 'INFORMES', signBg: '#3f3a33', signFg: '#f1e2b8' }),
      col(26.5, 12.4, 'escalera', 40, 50, { fh: 44, label: 'CABILDO · PRESIDENCIA ↑', collide: [-20, -4, 4, 4] }),
    ];
    for (const x of [7, 11, 15, 19]) items.push(col(x, 8.6, 'arcadeColumn', 10, 50, { fh: 44, collide: [-4, -3, 8, 3] }));
    for (const [x, y] of [[8, 12.4], [14, 12.4], [20, 12.4], [8, 15.4], [14, 15.4]]) items.push({ kind: 'bench', x, y, w: 22, up: 14, collide: [-8, -4, 16, 4] });
    const m = room('palacio', 'Palacio Municipal — planta baja', { w: 30, h: 18, wallRows: 4, floor: G.FLOOR_STONE, wall: '#f4efe4', frame: '#7a6650',
      grand: { stone: '#cdb48e', bays: 5, windows: true, wainscot: '#8e2f24', deco: [{ kind: 'flag', x: 27.2 }, { kind: 'clock', x: 14.6, h: 22 }] },
      pattern: { pat: 'marble', a: '#ddd0b6', b: '#c4b391', size: 16 }, exit: 15, items, zoom: 1.05,
      stairs: [{ x: 25, y: 9, w: 3, h: 1, to: 'palacio_alto', tx: 4.5, ty: 12.4, dir: 0, label: 'Subir al Cabildo' }],
      lights: [[8, 8, 150], [20, 8, 150], [14, 13, 150]], dim: 0.06 });
    m.setSolid(25, 9, 3, 1, 0);
    m.occupants = { spots: [[8, 12.2, 1, 'sit'], [14, 12.2, 1, 'sit'], [20, 12.2, 1, 'sit'], [8, 15.2, 1, 'sit'], [5, 6.4, 1], [11, 6.4, 1], [17, 6.4, 1]], n: [3, 6], office: true };
    return m;
  },
  // ---- Upstairs: the Sala de Cabildo and the Presidente's office, the balcony over the plaza.
  palacio_alto: () => {
    const items = [
      col(10, 9.2, 'mesaCabildo', 112, 30, { collide: [-56, -18, 112, 16], interact: 'cabildo' }),
      col(22, 7.8, 'escritorio', 40, 34, { plate: 'LIC. AURELIO FARÍAS', collide: [-19, -10, 38, 8] }),
      { kind: 'label', x: 15, y: 4.5, w: 20, up: 4, interact: 'balcon' },
      col(4.5, 14, 'escalera', 40, 36, { fh: 40, dir: 'down', label: 'PLANTA BAJA ↓', collide: [-20, -3, 4, 3] }),
      col(25.6, 12.6, 'maceta', 14, 20, { seed: 3, collide: [-3, -2, 6, 2] }),
      shelf(18.4, 4.6, 26, { goods: ['#6b4a30', '#2f4f6f', '#7a1f1a', '#d9c7a8'] }),
    ];
    const m = room('palacio_alto', 'Palacio Municipal — Cabildo y Presidencia', { w: 28, h: 17, wallRows: 4, floor: G.FLOOR_WOOD, wall: '#f4efe4', frame: '#6b5440', exit: [],
      grand: { stone: '#cdb48e', bays: 4, bayKinds: ['window', 'window', 'window', 'none'], wainscot: '#6b2a24',
        deco: [{ kind: 'portrait', x: 5, caption: 'GRAL. L. CÁRDENAS' }, { kind: 'portrait', x: 8, caption: 'B. JUÁREZ', bg: '#4a4a5a' }, { kind: 'flag', x: 24.6 }, { kind: 'portrait', x: 21.4, caption: 'PRESIDENTE', bg: '#5a4a3a', suit: '#1b1b1b' }] },
      pattern: { pat: 'planks', a: '#6b3f22', b: '#8a5a34' }, rugs: [{ x: 18, y: 8, w: 8, h: 5, color: '#6b1f1f' }], items,
      stairs: [{ x: 3, y: 15, w: 3, h: 1, to: 'palacio', tx: 25.5, ty: 10.6, dir: 3, label: 'Bajar a la planta baja' }],
      lights: [[10, 8, 160], [22, 8, 130]], dim: 0.08, entry: { x: 4.5, y: 12.4 } });
    m.occupants = { spots: [[5, 6.4, 0, 'sit'], [9, 6.4, 0, 'sit'], [13, 6.4, 0, 'sit']], n: [0, 2], office: true, when: (g) => g.clock.weekday >= 1 && g.clock.weekday <= 5 && g.clock.hour >= 9 && g.clock.hour < 15 };
    return m;
  },
  // ---- La Cochera: espresso, cold brew and cakes. People with laptops; Sofi and Kevin behind the bar.
  la_cochera: () => {
    const items = [
      col(4.6, 5.8, 'pasteles', 40, 30, { collide: [-20, -5, 40, 5], shop: 'cochera', interact: 'shopcounter' }),
      col(8.6, 5.8, 'espresso', 30, 30, { collide: [-14, -5, 28, 5] }),
      col(12.8, 5.8, 'caja', 36, 26, { color: '#2b2420', sign: 'ORDENA AQUÍ', collide: [-18, -5, 36, 5], shop: 'cochera', interact: 'shopcounter' }),
      col(4, 9, 'cafeTable', 20, 18, { laptop: true, collide: [-8, -3, 16, 3] }),
      col(9, 9.2, 'cafeTable', 20, 18, { collide: [-8, -3, 16, 3] }),
      col(14, 9, 'cafeTable', 20, 18, { laptop: true, collide: [-8, -3, 16, 3] }),
    ];
    const m = room('la_cochera', 'La Cochera · coffee & bakery', { w: 18, h: 12, wallRows: 3, floor: G.FLOOR_WOOD, wall: '#2b2420', wall2: '#3a302a', frame: '#1f1a17',
      deco: [{ kind: 'sign', x: 4, w: 70, text: 'LA COCHERA · COFFEE & BAKERY', bg: '#e9d7b0', fg: '#2b2420' }, { kind: 'menu', x: 12.6, lines: ['ESPRESSO 40', 'LATTE 65', 'COLD BREW 58', '3 LECHES 70', 'CONCHA 25'] }],
      pattern: { pat: 'planks', a: '#3a2a1e', b: '#4e3826' }, items, lights: [[5, 5, 100, '#ffd28a'], [13, 5, 100, '#ffd28a'], [9, 9, 110, '#ffcf8a']], dim: 0.2 });
    m.occupants = { spots: [[2.6, 9.6, 3, 'sit'], [10.4, 9.8, 2, 'sit'], [15.4, 9.6, 2, 'sit']], n: [1, 3], cafe: true, customers: { counter: [12.8, 7.2], max: 2, lines: ['Un latte de lavanda, porfa.', '¿Me das un cold brew para llevar?', 'Una rebanada de tres leches.', 'Un americano y una concha.'] } };
    return m;
  },
  // ---- the nevería: nieve de garrafa churned by hand in tubs of ice and salt.
  portal_nieves: () => {
    const items = [
      col(6.2, 5.8, 'garrafas', 60, 26, { n: 5, flavors: ['#f7f3ea', '#b4e37a', '#e8d29a', '#6a1fa0', '#e86a2b'], collide: [-32, -6, 64, 6], shop: 'nieves', interact: 'shopcounter' }),
      col(11.8, 6, 'congelador', 26, 20, { brand: 'PALETAS', collide: [-12, -4, 24, 4], shop: 'nieves', interact: 'shopcounter' }),
      col(1.9, 5.6, 'conos', 14, 16, { collide: [-6, -2, 12, 2] }),
      col(4, 8.6, 'cafeTable', 20, 18, { collide: [-8, -3, 16, 3] }), col(10, 8.6, 'cafeTable', 20, 18, { collide: [-8, -3, 16, 3] }),
    ];
    const m = room('portal_nieves', 'Nevería del Portal', { w: 14, h: 11, wallRows: 3, floor: G.FLOOR_TILE, wall: '#f5e6ef', band: '#b2386b', frame: '#8a4a5a',
      deco: [{ kind: 'sign', x: 2, w: 80, text: 'NIEVES DE GARRAFA · DESDE 1962', bg: '#b2386b' }, { kind: 'menu', x: 10, lines: ['LIMÓN 25', 'PASTA 30', 'ZARZAMORA 30', 'MAMEY 30', 'NUEZ 32'] }],
      pattern: { pat: 'pasta', a: '#c9a3b4', b: '#8fb0c0' }, items, lights: [[7, 5, 110]] });
    m.occupants = { spots: [[2.6, 9.2, 3, 'sit'], [11.4, 9.2, 2, 'sit']], n: [0, 2], customers: { counter: [6, 7.2], max: 2, lines: ['¡Una de limón, sencilla!', 'Doble: pasta y zarzamora.', 'Una paleta de mango con chile.'] } };
    return m;
  },
  // ---- the carnicería: the case of today's cuts, hanging meat, the block, the grinder, the bone saw.
  carniceria: () => {
    const items = [
      { kind: 'meatCase', x: 6.6, y: 5.8, fw: 70, w: 76, up: 30, collide: [-35, -6, 70, 6], shop: 'carniceria', interact: 'shopcounter' },
      { kind: 'meatHooks', x: 6.6, y: 3.1, fw: 60, w: 64, up: 44 }, { kind: 'chopBlock', x: 2.2, y: 4.8, w: 16, up: 16, collide: [-6, -3, 12, 3] },
      { kind: 'scale', x: 9.4, y: 5.3, w: 10, up: 10 }, col(11.2, 4.6, 'molino', 16, 16, { collide: [-4, -2, 8, 2] }), col(12.9, 4.4, 'sierra', 12, 30, { collide: [-5, -2, 10, 2] }),
      { kind: 'sodaFridge', x: 12.6, y: 8, w: 22, up: 46, collide: [-8, -5, 16, 5], brand: 'Coca-Cola', color: '#c8102e' },
      { kind: 'sodaFridge', x: 1.6, y: 8, w: 22, up: 46, collide: [-8, -5, 16, 5], brand: 'CERVEZA', color: '#1f3f8f', beer: true },
    ];
    const m = room('carniceria', 'Carnicería de la esquina', { w: 14, h: 11, floor: G.FLOOR_TILE, wall: '#f4f4f2', wall2: '#e4e8ea', band: '#a01818', tiles: true, frame: '#8a8f96',
      deco: [{ kind: 'sign', x: 2, w: 80, text: 'CARNICERÍA “EL CHAVA” · RES Y CERDO', bg: '#a01818' }],
      pattern: { pat: 'cement', a: '#dcdcd6' }, items, lights: [[7, 5, 110, '#f2f6ff']] });
    m.occupants = { spots: [], n: [0, 0], customers: { counter: [6.6, 7.2], max: 2, lines: ['Medio de bistec, Chava.', 'Un kilo de molida, de la buena.', '¿Tiene costilla para el caldo?', 'Unas chuletas y una Coca.'] } };
    return m;
  },
});

// Micheladas: only micheladas. Each bar with its colour.
for (const [id, name, color] of [['micheladas_lupita', 'Micheladas Lupita', '#d4302b'], ['micheladas_norma', 'Micheladas Norma', '#1f4fa0'], ['micheladas_nico', 'Micheladas de Nico', '#e0a020'], ['pantera_rosa', 'La Pantera Rosa', '#e0559a']]) {
  registerInteriors({ [id]: () => {
    const items = [
      col(8, 5.8, 'micheBar', 84, 30, { color, collide: [-42, -6, 84, 6], shop: 'micheladas', interact: 'shopcounter' }),
      col(1.9, 6.4, 'cubetaHielo', 14, 14, { color, collide: [-5, -2, 10, 2] }), col(14.1, 6.4, 'cubetaHielo', 14, 14, { color: '#2f5d9a', collide: [-5, -2, 10, 2] }),
      { kind: 'mesas', x: 4, y: 9.2, color, w: 44, up: 40, collide: [-18, -4, 36, 4] }, { kind: 'mesas', x: 12, y: 9.2, color, w: 44, up: 40, collide: [-18, -4, 36, 4] },
    ];
    const m = room(id, name, { w: 16, h: 11, floor: G.FLOOR_TILE, wall: '#f4efe4', band: color, frame: '#6b5a48',
      deco: [{ kind: 'sign', x: 2, w: 80, text: name.toUpperCase(), bg: color }, { kind: 'tv', x: 12 }, { kind: 'papel', x: 1, n: 8 }, { kind: 'menu', x: 8.2, lines: ['CLÁSICA 60', 'CUBANA 70', 'CLAMATO 75', 'GOMICHELA 85', 'TAMARINDO 75'] }],
      pattern: { pat: 'cement', a: '#d6cfc2' }, items, lights: [[8, 5, 110]], ambient: 'bar' });
    m.occupants = { spots: [[2.6, 9.6, 3, 'sit', 'drinker'], [5.4, 9.6, 2, 'sit', 'drinker'], [10.6, 9.6, 3, 'sit', 'drinker'], [13.4, 9.6, 2, 'sit', 'drinker']], n: [1, 4], bar: true, customers: { counter: [8, 7.2], max: 1, lines: ['¡Una cubana, bien escarchada!', 'Dos clásicas para llevar.', 'Una gomichela pa’ la novia.'] } };
    return m;
  } });
}

export const PLACES_READY = true;

const placa = (x, y, text, extra = {}) => ({ kind: 'placa', x, y, text, w: Math.max(26, text.length * 2.3 + 10), up: 30, collide: [-1, -1, 2, 2], ...extra });

registerInteriors({
  // ---- Librería La Aguadora, under the portales: Don Ramón at the register, Doña Leticia with her cart.
  // There is an upstairs (the stock room), roped off.
  libreria: () => {
    const items = [
      col(3.6, 4.4, 'estante', 40, 52, { fh: 44, section: 'NOVEDADES', seed: 51, palette: ['#c8102e', '#f2c230', '#2f5d9a', '#2e7d32', '#f7f3ea', '#1b1b1b', '#e86a2b'], collide: [-20, -5, 40, 5], interact: 'libros', books: 'novedades' }),
      col(7.4, 4.4, 'estante', 40, 52, { fh: 44, section: 'LIT. MEXICANA', seed: 52, collide: [-20, -5, 40, 5], interact: 'libros', books: 'literatura' }),
      col(11.2, 4.4, 'estante', 40, 52, { fh: 44, section: 'HISTORIA', seed: 53, collide: [-20, -5, 40, 5], interact: 'libros', books: 'historia' }),
      col(1.9, 8.4, 'estante', 22, 52, { fh: 40, section: 'INFANTIL', seed: 54, collide: [-11, -5, 22, 5], interact: 'libros', books: 'infantil' }),
      col(15.6, 6.6, 'escaleraCerrada', 22, 42, { text: 'BODEGA · SÓLO PERSONAL', collide: [-10, -6, 20, 6], interact: 'arriba_libreria' }),
      col(7.4, 7.8, 'mesaNovedades', 40, 22, { seed: 7, collide: [-20, -6, 40, 5], interact: 'libros', books: 'usados' }),
      col(13.6, 9.2, 'caja', 34, 26, { color: '#5a331d', sign: 'CAJA', collide: [-17, -5, 34, 5], shop: 'libreria', interact: 'shopcounter' }),
    ];
    const m = room('libreria', 'Librería La Aguadora', { w: 18, h: 12, wallRows: 3, floor: G.FLOOR_WOOD, wall: '#efe4cf', band: '#5a1a22', frame: '#5e4a38',
      deco: [{ kind: 'sign', x: 3.6, w: 90, text: 'LIBRERÍA LA AGUADORA · LIBROS NUEVOS Y USADOS', bg: '#5a1a22', fg: '#f7f0d8' }],
      pattern: { pat: 'planks', a: '#6b4528', b: '#8a5a36' }, rugs: [{ x: 5, y: 9, w: 5, h: 2, color: '#2f4f6f' }], items, exit: 9,
      lights: [[6, 6, 120, '#ffe2a8'], [13, 8, 100, '#ffe2a8']], dim: 0.1 });
    m.occupants = { spots: [[5.4, 10.2, 1], [9.6, 6.4, 1]], n: [0, 2], quiet: true, customers: { counter: [13.6, 10.4], max: 1, lines: ['¿Tiene “Pedro Páramo”? Es para la tarea de mi hija.', '¿Le llegó el de Elena Garro?', 'Me lo envuelve para regalo, por favor.'] } };
    return m;
  },
  // ---- Bicicletería José Luis: a bike up on the stand, wheels on the wall, the smell of grease.
  bicicleteria: () => {
    const items = [
      col(4.4, 4.2, 'ruedasPared', 48, 40, {}), col(11.4, 4.2, 'pegboard', 36, 40, { seed: 4 }),
      col(7.6, 7.2, 'bikeStand', 28, 24, { color: '#2f9e44', collide: [-10, -3, 20, 3], interact: 'bike_stand' }),
      col(12.6, 8.8, 'bicisVenta', 44, 24, { colors: ['#c8102e', '#1f4fa0', '#f2c230'], collide: [-18, -4, 36, 4], shop: 'bicis', interact: 'shopcounter' }),
      col(3.4, 8.2, 'banco', 40, 20, { collide: [-18, -5, 36, 5], shop: 'bicis', interact: 'shopcounter' }),
    ];
    const m = room('bicicleteria', 'Bicicletería José Luis', { w: 16, h: 11, wallRows: 3, floor: G.FLOOR_TILE, wall: '#e8eef2', band: '#2f9e44', frame: '#5a5f63',
      deco: [{ kind: 'sign', x: 2, w: 84, text: 'BICICLETERÍA JOSÉ LUIS · REPARACIÓN Y VENTA', bg: '#2f9e44' }, { kind: 'poster', x: 13.2, w: 14, bg: '#5b2a8c', fg: '#fff', lines: ['RINOS', 'DOMINGO', '7 AM'] }],
      pattern: { pat: 'cement', a: '#c9c3b8' }, items, lights: [[8, 5, 110]] });
    m.occupants = { spots: [], n: [0, 0], customers: { counter: [6, 8.6], max: 1, lines: ['Se me ponchó otra vez, José Luis.', '¿Me ajusta los frenos? Rechinan como puerta vieja.', '¿Cuánto por la roja?'] } };
    return m;
  },
  // ---- The last huarachería of Jiquilpan: old machines, lasts, hides, and Don Arnulfo at his bench.
  huaracheria: () => {
    const items = [
      col(3, 4.2, 'pieles', 40, 34, {}), col(8, 3.8, 'huarachesPared', 48, 38, { seed: 11 }), col(13, 4.4, 'hormas', 36, 26, {}),
      col(4.4, 7.2, 'maquinaPoste', 28, 30, { collide: [-12, -4, 24, 4], interact: 'maquina_poste' }),
      col(8.8, 7, 'troqueladora', 24, 32, { collide: [-9, -4, 18, 4], interact: 'troqueladora' }),
      col(12.4, 8.6, 'bancoZapatero', 22, 14, { collide: [-9, -3, 18, 3] }),
      counter(7.6, 9.4, 34, { color: '#6b4a30', goods: ['#b07a4a', '#7a4a28', '#3a2214'], shop: 'huaraches', interact: 'shopcounter' }),
    ];
    const m = room('huaracheria', 'Huarachería Ortiz · desde 1938', { w: 16, h: 12, wallRows: 3, floor: G.FLOOR_STONE, wall: '#e2d2b4', wall2: '#cdb994', band: '#6b3f22', frame: '#5e4a38',
      deco: [{ kind: 'sign', x: 2.4, w: 84, text: 'HUARACHERÍA ORTIZ · DESDE 1938', bg: '#3a2214', fg: '#efd9a8' }, { kind: 'frame', x: 13.4, color: '#a89878' }, { kind: 'poster', x: 11.6, w: 10, bg: '#f2e6c8', fg: '#7a1f1a', lines: ['1987', 'ENERO'] }],
      pattern: { pat: 'barro' }, items, lights: [[8, 6, 110, '#ffd9a0']], dim: 0.18 });
    m.occupants = { spots: [], n: [0, 0], customers: { counter: [7.6, 10.6], max: 1, lines: ['Don Arnulfo, ¿ya están mis huaraches?', 'Unos de tres puntadas, del siete.', '¿Les cambia la suela a estos? Son de mi papá.'] } };
    return m;
  },
  // ---- Casa de la Cultura: a colonial house with a patio; around it, the rooms of the workshops.
  // Danza, cerámica and pintura are full; the guitar class and the study workshop have places.
  casa_cultura: () => {
    const items = [
      // Danza folclórica (top left): the barre and the mirror
      col(5.4, 4.6, 'barra', 110, 40, { fw: 108 }), placa(8.6, 11.8, 'DANZA FOLCLÓRICA', { full: true, interact: 'clase_llena', clase: 'danza' }),
      // Cerámica (bottom left)
      col(3.4, 15.8, 'torno', 22, 16, { collide: [-6, -3, 12, 3], interact: 'clase_llena', clase: 'ceramica' }), col(6.6, 15.8, 'torno', 22, 16, { collide: [-6, -3, 12, 3], interact: 'clase_llena', clase: 'ceramica' }),
      col(8.6, 20.4, 'horno', 20, 26, { collide: [-9, -3, 18, 3] }), col(4.6, 13.6, 'repisaBarro', 44, 32, { seed: 6 }), placa(8.6, 17.6, 'CERÁMICA', { full: true, interact: 'clase_llena', clase: 'ceramica' }),
      // Pintura (top right)
      col(24.2, 6.6, 'caballete', 16, 24, { seed: 3, collide: [-4, -2, 8, 2] }), col(27.4, 6.6, 'caballete', 16, 24, { seed: 8, collide: [-4, -2, 8, 2] }), col(25.8, 9.8, 'caballete', 16, 24, { seed: 12, collide: [-4, -2, 8, 2] }),
      placa(23.4, 11.8, 'ARTES PLÁSTICAS', { full: true, interact: 'clase_llena', clase: 'pintura' }),
      // Música: the guitar class (bottom right)
      col(26.4, 13.6, 'guitarras', 44, 32, { n: 4, interact: 'clase_guitarra' }), col(26.4, 18.6, 'sillasCirculo', 40, 12, { n: 8, r: 12 }),
      col(23.6, 16.4, 'atril', 10, 20, { collide: [-2, -1, 4, 1] }), col(29.2, 16.4, 'atril', 10, 20, { collide: [-2, -1, 4, 1] }),
      placa(23.4, 17.6, 'GUITARRA', { open: true, interact: 'clase_guitarra' }),
      // Taller de estudio (top centre): public speaking, argument, persuasion — and how lies work
      col(16, 5.4, 'pizarron', 24, 30, { lines: ['ORATORIA', 'ARGUMENTAR', 'PERSUADIR', '¿Y MENTIR?'], ink: '#7a1f1a', collide: [-9, -2, 18, 2], interact: 'clase_estudio' }),
      col(16, 8.4, 'sillasCirculo', 34, 12, { n: 6, r: 10 }), placa(18.4, 9.8, 'TALLER DE ESTUDIO', { open: true, interact: 'clase_estudio' }),
      // the patio
      col(16, 14, 'fuenteChica', 20, 30, { collide: [-8, -4, 16, 5] }),
      col(12, 11.2, 'maceta', 14, 20, { seed: 2, collide: [-3, -2, 6, 2] }), col(20, 11.2, 'maceta', 14, 20, { seed: 5, collide: [-3, -2, 6, 2] }),
      col(12, 17.6, 'maceta', 14, 20, { seed: 7, collide: [-3, -2, 6, 2] }), col(20, 17.6, 'maceta', 14, 20, { seed: 9, collide: [-3, -2, 6, 2] }),
      col(13.4, 20.6, 'tablero', 20, 26, { seed: 5, collide: [-8, -2, 16, 2], interact: 'clases' }),
      { kind: 'bench', x: 18.6, y: 20.6, w: 22, up: 14, collide: [-8, -4, 16, 4] },
    ];
    const m = room('casa_cultura', 'Casa de la Cultura de Jiquilpan', { w: 32, h: 24, wallRows: 4, floor: G.FLOOR_TILE, wall: '#f3ede0', band: '#6c2a24', frame: '#7a5a40', zoom: 1.0,
      deco: [{ kind: 'papel', x: 11, n: 14 }, { kind: 'sign', x: 11.4, w: 150, text: 'CASA DE LA CULTURA · DANZA · CERÁMICA · ARTES PLÁSTICAS · MÚSICA · ESTUDIO', bg: '#6c2a24' }],
      pattern: { pat: 'barro' }, exit: 16, items,
      walls: [[10, 4, 1, 4], [10, 10, 1, 7], [10, 19, 1, 4], [21, 4, 1, 4], [21, 10, 1, 7], [21, 19, 1, 4], [1, 12, 7, 1], [24, 12, 7, 1], [11, 9, 4, 1], [17, 9, 4, 1]],
      lights: [[5, 8, 110], [5, 17, 110], [26, 8, 110], [26, 17, 110], [16, 6, 100], [16, 14, 140]], dim: 0.08 });
    m.occupants = { spots: [[3.4, 8.6, 0, 'dance', 'dancer'], [5.4, 8.6, 0, 'dance', 'dancer'], [7.4, 8.6, 0, 'dance', 'dancer'], [4.4, 10.4, 0, 'dance', 'dancer'], [6.4, 10.4, 0, 'dance', 'dancer'],
      [3.4, 16.4, 1, 'sit', 'student'], [6.6, 16.4, 1, 'sit', 'student'], [24.2, 7.4, 1, 'stand', 'student'], [27.4, 7.4, 1, 'stand', 'student'], [25.8, 10.6, 1, 'stand', 'student']], n: [10, 10], school: true };
    return m;
  },
  // ---- UNAM, Unidad Académica de Estudios Regionales: the General's jeep and showcases, the archive,
  // and the aula where Dr. Ochoa and Dr. Ramírez give their lectures (some days there is no room to sit).
  unam: () => {
    const items = [
      { kind: 'jeep', x: 6, y: 7.6, w: 60, up: 34, collide: [-22, -12, 44, 12], interact: 'jeep' },
      { kind: 'vitrina', x: 12, y: 6.8, w: 24, up: 24, collide: [-10, -8, 20, 8], item: '#c9a54a', interact: 'vitrina1' },
      { kind: 'vitrina', x: 15.4, y: 6.8, w: 24, up: 24, collide: [-10, -8, 20, 8], item: '#d9d0c0', interact: 'vitrina2' },
      { kind: 'vitrina', x: 18.8, y: 6.8, w: 24, up: 24, collide: [-10, -8, 20, 8], item: '#6b8a3d', interact: 'vitrina3' },
      col(24, 4.6, 'estante', 34, 52, { fh: 44, section: 'FONDO CÁRDENAS', seed: 61, collide: [-17, -5, 34, 5], interact: 'archivo', fondo: 'cardenas' }),
      col(27.4, 4.6, 'estante', 34, 52, { fh: 44, section: 'ARCHIVO', seed: 62, ladder: true, collide: [-17, -5, 34, 5], interact: 'archivo', fondo: 'archivo' }),
      col(24, 8.8, 'estante', 34, 52, { fh: 44, section: 'TESIS', seed: 63, collide: [-17, -5, 34, 5], interact: 'archivo', fondo: 'tesis' }),
      col(27.4, 8.8, 'estante', 34, 52, { fh: 44, section: 'CENSOS', seed: 64, collide: [-17, -5, 34, 5], interact: 'archivo', fondo: 'censos' }),
      col(25.6, 12.4, 'mesaLectura', 50, 22, { collide: [-25, -10, 50, 8] }),
      // the aula
      col(8, 13.8, 'pizarron', 24, 30, { lines: ['ETNOHISTORIA DE', 'LA CIÉNEGA', '“Fuentes y no', 'fantasmas”'], collide: [-9, -2, 18, 2], interact: 'conferencia' }),
      col(4.4, 14, 'ambon', 12, 22, { collide: [-4, -2, 8, 2] }),
    ];
    for (let y = 16.4; y <= 20.2; y += 1.9) for (let x = 3; x <= 13; x += 2.5) items.push({ kind: 'pupitre', x, y, w: 14, up: 12, collide: [-5, -3, 10, 3] });
    const m = room('unam', 'UNAM — Unidad Académica de Estudios Regionales', { w: 30, h: 23, wallRows: 4, floor: G.FLOOR_STONE, wall: '#f3eee4', frame: '#5e5a56', zoom: 1.0,
      grand: { stone: '#c9c0b0', bays: 5, bayKinds: ['window', 'none', 'window', 'none', 'window'], wainscot: '#003d79',
        deco: [{ kind: 'sign', x: 2, w: 120, text: 'MUSEO · LÁZARO CÁRDENAS DEL RÍO (1895–1970)', bg: '#003d79', fg: '#c59d2a' }] },
      pattern: { pat: 'marble', a: '#e2dccf', b: '#cfc6b4', size: 16 }, exit: 18, items,
      walls: [[1, 12, 12, 1], [15, 12, 1, 10]],
      lights: [[7, 7, 150], [16, 7, 140], [26, 8, 140], [8, 17, 150]], dim: 0.06 });
    m.occupants = { spots: [[5.5, 17.2, 1, 'sit'], [8, 17.2, 1, 'sit'], [10.5, 17.2, 1, 'sit'], [3, 19.1, 1, 'sit'], [5.5, 19.1, 1, 'sit'], [13, 19.1, 1, 'sit'], [25.6, 13.4, 1, 'sit']], n: [1, 3], quiet: true };
    return m;
  },
});
