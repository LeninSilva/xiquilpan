// Interiors. Each is a small room map; the exit returns to wherever the player came in.
import { GameMap, G } from '../world.js';
import { TILE } from '../util.js';
import { sprite, area, light } from './build.js';
import { STRUCTURE_DRAW } from '../render/structures.js';

// Back wall with decorations, drawn into the ground chunks.
STRUCTURE_DRAW.backwall = (ctx, s) => {
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  const g = ctx.createLinearGradient(0, Y, 0, Y + H);
  g.addColorStop(0, s.color || '#efe6d4'); g.addColorStop(1, s.color2 || '#e3d6bf');
  ctx.fillStyle = g; ctx.fillRect(X, Y, W, H);
  if (s.band) { ctx.fillStyle = s.band; ctx.fillRect(X, Y + H - 8, W, 8); }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X, Y + H - 1.5, W, 1.5);
  // vigas (wooden beams) along the top
  ctx.fillStyle = '#5a3a22'; for (let x = X + 6; x < X + W; x += 20) ctx.fillRect(x, Y, 3, 4);
  if (s.tiles) { // talavera tile strip
    for (let x = X; x < X + W; x += 6) { ctx.fillStyle = (x / 6) % 2 ? '#2f5d9a' : '#f5f0e6'; ctx.fillRect(x, Y + H - 14, 6, 6); ctx.fillStyle = '#e8b04b'; ctx.fillRect(x + 2.5, Y + H - 11.5, 1, 1); }
  }
  for (const d of s.deco || []) drawWallDeco(ctx, X + d.x * TILE, Y + H - (d.h ?? 14), d);
};
STRUCTURE_DRAW.sidewall = (ctx, s) => {
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  ctx.fillStyle = '#cdbfa6'; ctx.fillRect(X, Y, W, H);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(s.right ? X : X + W - 2, Y, 2, H);
};
STRUCTURE_DRAW.rug = (ctx, s) => {
  const X = s.x * TILE, Y = s.y * TILE, W = s.w * TILE, H = s.h * TILE;
  ctx.fillStyle = s.color || '#8e2f35'; ctx.fillRect(X, Y, W, H);
  ctx.strokeStyle = '#e8b04b'; ctx.lineWidth = 1; ctx.strokeRect(X + 2, Y + 2, W - 4, H - 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.6;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(X + W / 2, Y + 4 + i * 3); ctx.lineTo(X + W - 4 - i * 3, Y + H / 2); ctx.lineTo(X + W / 2, Y + H - 4 - i * 3); ctx.lineTo(X + 4 + i * 3, Y + H / 2); ctx.closePath(); ctx.stroke(); }
};
STRUCTURE_DRAW.doormat = (ctx, s) => {
  const X = s.x * TILE, Y = s.y * TILE;
  ctx.fillStyle = '#6b4a30'; ctx.fillRect(X - 6, Y + 4, TILE + 12, 10);
  ctx.fillStyle = 'rgba(255,240,200,0.25)'; ctx.fillRect(X - 6, Y + 13, TILE + 12, 3);
};

function drawWallDeco(ctx, x, y, d) {
  if (d.kind === 'window') {
    ctx.fillStyle = '#d4c1a3'; ctx.fillRect(x - 1, y - 20, 18, 16);
    ctx.fillStyle = '#9fd0ea'; ctx.fillRect(x, y - 19, 16, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + 1, y - 18, 5, 12);
    ctx.strokeStyle = '#1d1d1f'; ctx.lineWidth = 0.4; for (let i = x + 2; i < x + 16; i += 2) { ctx.beginPath(); ctx.moveTo(i, y - 19); ctx.lineTo(i, y - 5); ctx.stroke(); }
  } else if (d.kind === 'frame') {
    ctx.fillStyle = '#8a6a2f'; ctx.fillRect(x, y - 18, 12, 10); ctx.fillStyle = d.color || '#c9b89a'; ctx.fillRect(x + 1, y - 17, 10, 8);
    ctx.fillStyle = 'rgba(60,40,30,0.5)'; ctx.beginPath(); ctx.arc(x + 6, y - 14, 2, 0, 7); ctx.fill(); ctx.fillRect(x + 4, y - 12, 4, 3);
  } else if (d.kind === 'menu') {
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x, y - 22, 28, 16);
    ctx.fillStyle = '#f5f0e6'; ctx.font = 'bold 3px sans-serif'; ctx.textAlign = 'left';
    (d.lines || ['MENÚ']).forEach((l, i) => ctx.fillText(l, x + 2, y - 18 + i * 3.4));
  } else if (d.kind === 'tv') {
    ctx.fillStyle = '#111'; ctx.fillRect(x, y - 22, 26, 15); ctx.fillStyle = '#2fa3e6'; ctx.fillRect(x + 1, y - 21, 24, 13);
    ctx.fillStyle = '#4caf50'; ctx.fillRect(x + 1, y - 13, 24, 5);
  } else if (d.kind === 'cross') {
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(x + 4, y - 26, 3, 20); ctx.fillRect(x, y - 21, 11, 3);
  } else if (d.kind === 'flag') {
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#006847', '#ffffff', '#ce1126'][i]; ctx.fillRect(x + i * 5, y - 22, 5, 12); }
  } else if (d.kind === 'papel') { // papel picado garland
    const cols = ['#e84a6a', '#f2a93b', '#2fb3a0', '#6a5acd', '#f7e36a'];
    for (let i = 0; i < (d.n || 10); i++) { ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(x + i * 7, y - 26); ctx.lineTo(x + i * 7 + 6, y - 26); ctx.lineTo(x + i * 7 + 6, y - 20); ctx.lineTo(x + i * 7 + 3, y - 18); ctx.lineTo(x + i * 7, y - 20); ctx.fill(); }
  } else if (d.kind === 'sign') {
    ctx.fillStyle = d.bg || '#7a1f1a'; ctx.fillRect(x, y - 24, d.w || 40, 8);
    ctx.fillStyle = d.fg || '#fff'; ctx.font = 'bold 4.2px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.text, x + (d.w || 40) / 2, y - 20);
  }
}

// Build a room. spec: {w,h,floor,wall,band,deco,items:[sprites],exit:[x], lights, dark}
function room(id, name, spec) {
  const w = spec.w, h = spec.h;
  const m = new GameMap(id, name, w, h, { fill: spec.floor ?? G.FLOOR_TILE, interior: true });
  m.ambient = spec.ambient || 'interior';
  m.dim = spec.dim ?? 0.05; m.dark = spec.dark || 0;
  // walls: top rows are the back wall, sides & bottom are solid borders
  const wallRows = spec.wallRows ?? 3;
  m.fill(0, 0, w, wallRows, G.WALL); m.setSolid(0, 0, w, wallRows);
  m.structures.push({ kind: 'backwall', x: 0, y: 0, w, h: wallRows, color: spec.wall, color2: spec.wall2, band: spec.band, tiles: spec.tiles, deco: spec.deco, layer: 1 });
  for (let y = 0; y < h; y++) { m.set(0, y, G.VOID); m.set(w - 1, y, G.VOID); }
  m.setSolid(0, 0, 1, h); m.setSolid(w - 1, 0, 1, h);
  for (let x = 0; x < w; x++) { m.set(x, h - 1, G.VOID); m.setSolid(x, h - 1, 1, 1); }
  const ex = spec.exit ?? Math.floor(w / 2);
  const exits = Array.isArray(ex) ? ex : [ex];
  for (const x of exits) {
    m.set(x, h - 1, spec.floor ?? G.FLOOR_TILE); m.setSolid(x, h - 1, 1, 1, 0);
    m.exits.push({ x, y: h - 1, w: 1, h: 1, to: '__back', label: 'Salir' });
    m.structures.push({ kind: 'doormat', x, y: h - 2, w: 1, h: 1, layer: 2 });
  }
  if (spec.topExit != null) {
    m.set(spec.topExit, 0, spec.floor); m.set(spec.topExit, 1, spec.floor); m.setSolid(spec.topExit, 0, 1, 2, 0);
    m.exits.push({ x: spec.topExit, y: 0, w: 1, h: 1, to: '__back2', label: 'Salir' });
  }
  for (const r of spec.rugs || []) m.structures.push({ kind: 'rug', ...r, layer: 2 });
  for (const it of spec.items || []) {
    const { x, y, kind, ...rest } = it;
    sprite(m, kind, x, y, { w: 60, up: 60, ...rest });
  }
  for (const l of spec.lights || []) light(m, l[0], l[1], l[2] || 90, l[3] || '#ffe2a8');
  m.spawns = { entry: { x: exits[0] + 0.5, y: h - 2 } };
  area(m, name, 0, 0, w, h, 'interior');
  m.structures.sort((a, b) => (a.layer || 0) - (b.layer || 0));
  m.finalize();
  return m;
}

const counter = (x, y, fw, props = {}) => ({ kind: 'counter', x, y, fw, w: fw + 10, up: 30, collide: [-fw / 2, -12, fw, 12], ...props });
const table = (x, y, props = {}) => ({ kind: 'table', x, y, w: 30, up: 20, collide: [-9, -8, 18, 8], ...props });
const shelf = (x, y, fw, props = {}) => ({ kind: 'shelf', x, y, fw, w: fw + 6, up: 40, collide: [-fw / 2, -6, fw, 6], ...props });

const BUILDERS = {
  casa_abuela: () => room('casa_abuela', 'Casa de la abuela', { w: 16, h: 12, floor: G.FLOOR_TILE, wall: '#f4eadb', band: '#2f5a4a', tiles: true,
    deco: [{ kind: 'window', x: 2 }, { kind: 'frame', x: 6, color: '#d8c7a8' }, { kind: 'frame', x: 7.2, color: '#c9d6de' }, { kind: 'window', x: 12 }, { kind: 'cross', x: 9.6 }],
    rugs: [{ x: 5, y: 5, w: 6, h: 4, color: '#7a2f3a' }],
    items: [
      { kind: 'altarCasa', x: 9.6, y: 2.7, w: 30, up: 40, collide: [-10, -4, 20, 4], interact: 'altar' },
      counter(3, 3.2, 44, { color: '#9a6a42', goods: ['#e84a6a', '#f2a93b', '#6ec07a', '#f5f0e6'], interact: 'cocina' }),
      table(8, 7.6, { cloth: '#e8e2d2', items: true }),
      { kind: 'bed', x: 13.5, y: 5.2, w: 30, up: 30, collide: [-12, -20, 24, 20], interact: 'cama' },
      { kind: 'fridge', x: 1.8, y: 5.4, brand: 'MABE', color: '#e8e8e8', w: 20, up: 36, collide: [-7, -5, 14, 5] },
    ], lights: [[8, 4, 120]] }),
  mercado: () => {
    const items = [];
    const stalls = [[6, 7.2, 'mercado_birria1', 'BIRRIA EL CANO', ['#7a2f1a', '#a0522d']], [14, 7.2, 'mercado_birria2', 'EL CANO ORIGINAL', ['#7a2f1a', '#a0522d']], [22, 7.2, 'mercado_birria3', 'EL CANO JR.', ['#7a2f1a', '#c98a4a']], [30, 7.2, 'mercado_tortas', 'TORTAS LA GÜERA', ['#f3d9a5', '#e8b86b']],
      [6, 17.2, 'mercado_jugos', 'JUGOS', ['#f28c28', '#7cb342', '#ffd54f']], [14, 17.2, 'mercado_chiles', 'FONDA DOÑA TERE', ['#2e7d32', '#e53935']], [22, 17.2, 'mercado_codorniz', 'HUEVOS DE CODORNIZ', ['#f5f0e6', '#d9c7a8']], [30, 17.2, 'mercado_carne', 'CARNICERÍA', ['#c62828', '#e57373']]];
    for (const [x, y, shop, sign, goods] of stalls) items.push(counter(x, y, 72, { sign, goods, shop, interact: 'shopcounter', color: '#b7a58a' }));
    items.push(counter(36.5, 12.2, 34, { sign: 'FRUTAS Y VERDURAS', goods: ['#f28c28', '#e53935', '#ffd54f', '#7cb342', '#43a047'], shop: 'mercado_frutas', interact: 'shopcounter', color: '#8a6a48' }));
    items.push(counter(2.6, 12.2, 30, { sign: 'VERDURAS', goods: ['#43a047', '#e53935', '#8d6e63', '#fdd835'], color: '#8a6a48' }));
    for (let x = 4; x < 38; x += 6) items.push({ kind: 'lampHang', x, y: 11.5, w: 10, up: 60 });
    return room('mercado', 'Mercado Municipal', { w: 40, h: 24, floor: G.MARKET, wall: '#e7ddc8', band: '#1f5a3a', exit: 20, topExit: 20,
      deco: [{ kind: 'papel', x: 1, n: 16 }, { kind: 'papel', x: 21, n: 16 }, { kind: 'sign', x: 15, w: 70, text: 'MERCADO MUNICIPAL', bg: '#1f5a3a' }],
      items, lights: [[10, 10, 140], [30, 10, 140], [20, 20, 140]], dim: 0.08 });
  },
  panaderia: () => room('panaderia', 'Panadería Mendoza', { w: 16, h: 10, floor: G.FLOOR_TILE, wall: '#f6ead3', band: '#7a3e1d',
    deco: [{ kind: 'sign', x: 3, w: 80, text: 'PANADERÍA MENDOZA · DESDE 1958', bg: '#7a3e1d' }, { kind: 'window', x: 13 }],
    items: [counter(8, 6.4, 90, { goods: ['#f3d9a5', '#e8b86b', '#c98a4a', '#f7e7c9', '#d9a066'], color: '#9a6a42', shop: 'panaderia', interact: 'shopcounter' }), shelf(4, 3.2, 40, { goods: ['#f3d9a5', '#e8b86b', '#c98a4a', '#f7e7c9'] }), shelf(12, 3.2, 40, { goods: ['#f3d9a5', '#e8b86b', '#c98a4a', '#f7e7c9'] })], lights: [[8, 5, 110]] }),
  billar_mendoza: () => billar('billar_mendoza', 'Billar (arriba de la Mendoza)'),
  billar_entrada: () => billar('billar_entrada', 'Billar de la entrada'),
  palacio: () => room('palacio', 'Palacio Municipal', { w: 26, h: 14, floor: G.FLOOR_STONE, wall: '#f4efe4', band: '#8e2f24',
    deco: [{ kind: 'flag', x: 12 }, { kind: 'sign', x: 3, w: 90, text: 'H. AYUNTAMIENTO DE JIQUILPAN', bg: '#3f3a33', fg: '#f1e2b8' }, { kind: 'window', x: 20 }, { kind: 'frame', x: 17, color: '#c9b89a' }],
    rugs: [{ x: 10, y: 6, w: 6, h: 6, color: '#7a1f1a' }],
    items: [
      { kind: 'mural', x: 6, y: 2.2, fw: 70, fh: 26, w: 80, up: 34, seed: 7, palette: ['#6b2e1f', '#b4622d', '#e9b04a', '#3b3f4a', '#2f6a4a'] },
      table(9, 5.6, { color: '#5b3a22', items: true }), table(15, 5.6, { color: '#5b3a22', items: true }),
      shelf(20, 3.4, 30, { goods: ['#d9c7a8', '#f5f0e6', '#b8a888', '#e8e2d2'] }),
      shelf(23.5, 3.4, 24, { goods: ['#d9c7a8', '#f5f0e6', '#b8a888'] }),
      { kind: 'bench', x: 5, y: 10, w: 20, up: 12, collide: [-8, -4, 16, 4] }, { kind: 'bench', x: 21, y: 10, w: 20, up: 12, collide: [-8, -4, 16, 4] },
    ], lights: [[13, 6, 150]] }),
  templo_sf: () => church('templo_sf', 'Parroquia de San Francisco de Asís', '#e3d3b8', ['#e0b54a', '#a8662e']),
  santuario: () => church('santuario', 'Santuario del Sagrado Corazón', '#f1d4cf', ['#f0c4bd', '#b85c56']),
  templo_monjas: () => church('templo_monjas', 'Templo de las Monjas', '#d8c3a3', ['#c9a054', '#6b4a2e']),
  capilla_cayetano: () => church('capilla_cayetano', 'Capilla de San Cayetano', '#f2ece0', ['#d9b24a', '#8a5a2e'], 14),
  capilla_sf: () => church('capilla_sf', 'Capilla de San Francisco (del cerro)', '#f3eee4', ['#e8c26a', '#7a4a26'], 14),
  totolan_templo: () => church('totolan_templo', 'Templo de Totolán', '#f2dcc6', ['#d9b24a', '#8a5a2e'], 16),
  abadiano_templo: () => church('abadiano_templo', 'Templo de Abadiano', '#f3eee4', ['#d9b24a', '#8a5a2e'], 14),
  sarabia_templo: () => church('sarabia_templo', 'Templo de Francisco Sarabia', '#e8e6f2', ['#d9b24a', '#8a5a2e'], 14),
  biblioteca: () => {
    const items = [
      { kind: 'mural', x: 6, y: 2.2, fw: 150, fh: 40, w: 160, up: 48, seed: 40, interact: 'murales' },
      { kind: 'mural', x: 18, y: 2.2, fw: 150, fh: 40, w: 160, up: 48, seed: 41, palette: ['#3b3f4a', '#8a2f1f', '#c4622d', '#e9d7b0', '#556b75'], interact: 'murales' },
    ];
    for (const x of [4, 9, 15, 20]) items.push(table(x, 8.6, { color: '#6b4a30', items: false }));
    for (const x of [3, 21]) items.push({ kind: 'bookshelf', x, y: 14.2, fw: 40, w: 44, up: 40, collide: [-20, -5, 40, 5], seed: x });
    items.push(counter(12, 12.4, 40, { color: '#5b3a22', sign: 'PRÉSTAMO' }));
    return room('biblioteca', 'Biblioteca Pública Gabino Ortiz', { w: 24, h: 18, floor: G.FLOOR_STONE, wall: '#e9dcc4', wall2: '#dbc9aa', wallRows: 3,
      deco: [], items, lights: [[6, 6, 150], [18, 6, 150], [12, 12, 150]], dim: 0.12 });
  },
  casa_cultura: () => room('casa_cultura', 'Casa de la Cultura', { w: 20, h: 12, floor: G.FLOOR_WOOD, wall: '#f3ede0', band: '#6c2a24',
    deco: [{ kind: 'papel', x: 1, n: 12 }, { kind: 'sign', x: 5, w: 90, text: 'TALLERES: DANZA · GUITARRA · PINTURA · TEATRO', bg: '#6c2a24' }, { kind: 'frame', x: 16, color: '#e9b04a' }],
    items: [{ kind: 'mural', x: 4, y: 2.2, fw: 50, fh: 22, w: 56, up: 30, seed: 88, palette: ['#e84a6a', '#f2a93b', '#2fb3a0', '#6a5acd', '#f7e36a'] },
      table(15, 7, { color: '#6b4a30' }), { kind: 'bench', x: 5, y: 9, w: 20, up: 12, collide: [-8, -4, 16, 4] }], lights: [[10, 6, 140]] }),
  unam: () => room('unam', 'UNAM — Unidad Académica de Estudios Regionales', { w: 28, h: 16, floor: G.FLOOR_STONE, wall: '#f3eee4', band: '#003d79',
    deco: [{ kind: 'sign', x: 2, w: 110, text: 'MUSEO · LÁZARO CÁRDENAS DEL RÍO (1895–1970)', bg: '#003d79', fg: '#c59d2a' }, { kind: 'frame', x: 12, color: '#b8a888' }, { kind: 'frame', x: 13.4, color: '#c9b89a' }, { kind: 'frame', x: 14.8, color: '#a89878' }, { kind: 'window', x: 22 }],
    items: [
      { kind: 'jeep', x: 7, y: 8, w: 60, up: 34, collide: [-22, -12, 44, 12], interact: 'jeep' },
      { kind: 'vitrina', x: 13, y: 7.4, w: 24, up: 24, collide: [-10, -8, 20, 8], item: '#c9a54a', interact: 'vitrina1' },
      { kind: 'vitrina', x: 16.5, y: 7.4, w: 24, up: 24, collide: [-10, -8, 20, 8], item: '#d9d0c0', interact: 'vitrina2' },
      { kind: 'vitrina', x: 13, y: 11.4, w: 24, up: 24, collide: [-10, -8, 20, 8], item: '#6b8a3d', interact: 'vitrina3' },
      { kind: 'bookshelf', x: 22, y: 4.2, fw: 40, w: 44, up: 40, collide: [-20, -5, 40, 5], seed: 3 },
      { kind: 'bookshelf', x: 25.5, y: 4.2, fw: 30, w: 34, up: 40, collide: [-15, -5, 30, 5], seed: 4 },
      table(22, 9, { color: '#6b4a30', items: true }), table(25, 9, { color: '#6b4a30' }),
    ], lights: [[7, 7, 150], [22, 8, 140]] }),
  hospital: () => room('hospital', 'Hospital', { w: 18, h: 12, floor: G.FLOOR_TILE, wall: '#eef3f2', band: '#2f7f7a',
    deco: [{ kind: 'sign', x: 3, w: 60, text: 'URGENCIAS · CONSULTA', bg: '#2f7f7a' }, { kind: 'window', x: 13 }],
    items: [counter(8, 6.4, 50, { color: '#dfe6e6', sign: 'RECEPCIÓN', signBg: '#2f7f7a', signFg: '#fff' }), { kind: 'bed', x: 3, y: 5, color: '#f5f5f5', blanket: '#7fc8c0', w: 30, up: 30, collide: [-12, -20, 24, 20] }, { kind: 'bed', x: 15, y: 5, color: '#f5f5f5', blanket: '#7fc8c0', w: 30, up: 30, collide: [-12, -20, 24, 20] },
      { kind: 'bench', x: 4, y: 9.5, w: 20, up: 12, collide: [-8, -4, 16, 4] }, { kind: 'bench', x: 13, y: 9.5, w: 20, up: 12, collide: [-8, -4, 16, 4] }], lights: [[9, 6, 150]] }),
  la_cochera: () => room('la_cochera', 'La Cochera', { w: 18, h: 10, floor: G.FLOOR_WOOD, wall: '#2b2420', wall2: '#3a302a',
    deco: [{ kind: 'sign', x: 4, w: 70, text: 'LA COCHERA · COFFEE & BAKERY', bg: '#e9d7b0', fg: '#2b2420' }, { kind: 'menu', x: 13, lines: ['LATTE  65', 'COLD BREW 58', '3 LECHES 70', 'GALLETA 35'] }],
    items: [counter(9.5, 5.4, 80, { color: '#e9d7b0', goods: ['#6b3f22', '#f3d9a5', '#c98a4a', '#f7f3ea'], shop: 'cochera', interact: 'shopcounter' }), table(4, 8, { color: '#2b2420', items: true }), table(14, 8, { color: '#2b2420', items: true })],
    lights: [[5, 5, 90, '#ffd28a'], [13, 5, 90, '#ffd28a']], dim: 0.18 }),
  portal_nieves: () => shop('portal_nieves', 'Nevería del Portal', 'nieves', '#f5e6ef', '#b2386b', ['#f7c6d9', '#b4e37a', '#ffffff', '#6a1fa0']),
  portal_azul: () => shop('portal_azul', 'Cenaduría del Portal Azul', 'cenaduria', '#e6eef7', '#2e6fb3', ['#c0392b', '#f3d9a5', '#43a047'], true),
  portal_tienda: () => shop('portal_tienda', 'Tienda del Portal', 'tiendita', '#f4efe4', '#8e2f24'),
  tiendita: () => shop('tiendita', 'Tiendita de la esquina', 'tiendita', '#f1ead8', '#8e2f24'),
  tiendita_sur: () => shop('tiendita_sur', 'Abarrotes “La Esperanza”', 'tiendita', '#f1ead8', '#2f5d9a'),
  tienda_cerro: () => shop('tienda_cerro', 'Tiendita del cerro', 'tiendita', '#efe0c8', '#8c5d3b'),
  frijoles: () => shop('frijoles', 'Tienda “Frijoles”', 'frijoles', '#f6ecc8', '#5a2d0c', ['#e53935', '#43a047', '#ffd54f', '#8d6e63']),
  carniceria: () => shop('carniceria', 'Carnicería de la esquina', 'carniceria', '#f6f1e6', '#a01818', ['#c62828', '#e57373', '#f5f5f5']),
  oxxo: () => shop('oxxo', 'OXXO', 'oxxo', '#f5f3ee', '#e11b22', ['#e11b22', '#ffd200', '#1e88e5', '#43a047', '#f5f5f5'], false, true),
  tortilleria: () => shop('tortilleria', 'Tortillería de la curva', 'tortilleria', '#f7f0da', '#b01c1c', ['#f3e2b0', '#e8d29a']),
  hotel_palmira: () => room('hotel_palmira', 'Hotel Palmira', { w: 16, h: 10, floor: G.CARPET, wall: '#efe4cf', band: '#7b4a2e',
    deco: [{ kind: 'sign', x: 4, w: 60, text: 'HOTEL PALMIRA · RECEPCIÓN', bg: '#7b4a2e' }, { kind: 'frame', x: 12, color: '#58ffc0' }],
    items: [counter(8, 5.4, 60, { color: '#7b4a2e', shop: 'hotel', interact: 'shopcounter' }), { kind: 'tree', x: 2.5, y: 8, tree: 'palma', size: 0.6, w: 40, up: 50 }, { kind: 'bench', x: 12, y: 8, w: 20, up: 12, collide: [-8, -4, 16, 4] }], lights: [[8, 5, 110]] }),
  chamacuero: () => room('chamacuero', 'Mezcalería El Chamacuero', { w: 18, h: 12, floor: G.FLOOR_STONE, wall: '#c9a27a', wall2: '#b58c64', band: '#8c5d3b',
    deco: [{ kind: 'sign', x: 3, w: 80, text: 'MEZCAL EL CHAMACUERO · ARTESANAL', bg: '#3a2616', fg: '#f0cf7a' }],
    items: [counter(9, 5.4, 60, { color: '#7a4a26', goods: ['#e8e6d8', '#d8d2b0'], shop: 'chamacuero', interact: 'shopcounter' }),
      { kind: 'barrels', x: 3, y: 9, w: 40, up: 30, collide: [-12, -6, 24, 6] }, { kind: 'barrels', x: 15, y: 9, w: 40, up: 30, collide: [-12, -6, 24, 6] }, { kind: 'agave', x: 9, y: 9.5, w: 22, up: 16 }], lights: [[9, 5, 100, '#ffc27a']], dim: 0.15 }),
  micheladas_lupita: () => bar('micheladas_lupita', 'Micheladas Lupita', '#d4302b'),
  micheladas_norma: () => bar('micheladas_norma', 'Micheladas Norma', '#1f4fa0'),
  micheladas_nico: () => bar('micheladas_nico', 'Micheladas de Nico', '#f2c230'),
  pantera_rosa: () => bar('pantera_rosa', 'La Pantera Rosa', '#f06aa8'),
};

function church(id, name, color, mural, w = 20) {
  const items = [{ kind: 'altar', x: w / 2, y: 3.2, fw: 60, w: 70, up: 80, mural1: mural[0], mural2: mural[1], collide: [-16, -12, 32, 12], interact: 'altar_iglesia' }];
  for (let y = 6; y < 12; y += 2) for (const x of [w / 2 - 4.5, w / 2 + 4.5]) items.push({ kind: 'pew', x, y, fw: 90, w: 96, up: 14, collide: [-45, -10, 90, 10] });
  return room(id, name, { w, h: 14, floor: G.FLOOR_STONE, wall: color, wall2: color, wallRows: 3,
    deco: [{ kind: 'window', x: 2, h: 22 }, { kind: 'window', x: w - 3, h: 22 }],
    rugs: [{ x: Math.floor(w / 2) - 1, y: 4, w: 2, h: 9, color: '#8e2f35' }], items, lights: [[w / 2, 4, 140, '#ffd98a'], [w / 2, 10, 120, '#ffd98a']], dim: 0.2 });
}
function shop(id, name, shopId, wall, band, goods, eatery, bright) {
  return room(id, name, { w: 14, h: 10, floor: bright ? G.FLOOR_TILE : G.FLOOR_TILE, wall, band,
    deco: [{ kind: 'sign', x: 2, w: 80, text: name.toUpperCase(), bg: band }, { kind: 'papel', x: 1, n: 7 }],
    items: [counter(7, 5.4, 70, { color: '#8a6a48', goods: goods || ['#e53935', '#1e88e5', '#fdd835', '#43a047'], shop: shopId, interact: 'shopcounter' }),
      shelf(3, 3.2, 34, {}), shelf(11, 3.2, 34, {}), { kind: 'fridge', x: 12.5, y: 7.4, w: 20, up: 36, collide: [-7, -5, 14, 5] },
      ...(eatery ? [table(3.5, 8, { cloth: '#e8e2d2', items: true })] : [])], lights: [[7, 5, 110]] });
}
function bar(id, name, color) {
  return room(id, name, { w: 16, h: 10, floor: G.FLOOR_TILE, wall: '#f4efe4', band: color,
    deco: [{ kind: 'sign', x: 2, w: 80, text: name.toUpperCase(), bg: color }, { kind: 'tv', x: 12 }, { kind: 'papel', x: 1, n: 8 }],
    items: [counter(8, 5.4, 80, { color: '#8a5a34', goods: ['#e6c75a', '#b8322a', '#f5f0e6', '#43a047'], shop: 'micheladas', interact: 'shopcounter' }),
      { kind: 'fridge', x: 2, y: 4.2, brand: 'CORONA', color: '#1f4fa0', w: 20, up: 36, collide: [-7, -5, 14, 5] },
      { kind: 'mesas', x: 4, y: 8.4, color, w: 44, up: 40, collide: [-18, -4, 36, 4] }, { kind: 'mesas', x: 12, y: 8.4, color, w: 44, up: 40, collide: [-18, -4, 36, 4] }],
    lights: [[8, 5, 110]] });
}
function billar(id, name) {
  return room(id, name, { w: 16, h: 10, floor: G.FLOOR_WOOD, wall: '#2f3b33', wall2: '#26302a', band: '#1f5a3a',
    deco: [{ kind: 'sign', x: 3, w: 70, text: 'BILLAR · NO SE ADMITEN APUESTAS', bg: '#10331f', fg: '#f7f1d0' }, { kind: 'tv', x: 12 }],
    items: [{ kind: 'billiardTable', x: 5, y: 6, w: 50, up: 30, collide: [-22, -24, 44, 24], interact: 'billar' }, { kind: 'billiardTable', x: 11.5, y: 6, w: 50, up: 30, collide: [-22, -24, 44, 24], interact: 'billar' },
      counter(3.5, 9, 20, { color: '#5b3a22', shop: 'billar', interact: 'shopcounter' })],
    lights: [[5, 5, 80, '#fff2c0'], [11.5, 5, 80, '#fff2c0']], dim: 0.35 });
}

export function buildInterior(id) {
  const b = BUILDERS[id];
  return b ? b() : null;
}
