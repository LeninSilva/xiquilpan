// Map container shared by the town, the outlying regions and interiors.
import { TILE, clamp } from './util.js';

export const G = {
  GRASS: 0, DIRT: 1, ASPHALT: 2, COBBLE: 3, SIDEWALK: 4, PLAZA: 5, WATER: 6, ROCK: 7,
  FIELD: 8, FOREST: 9, ROOF: 10, MEDIAN: 11, COURT: 12, INFIELD: 13, STAIRS: 14, SLOPE: 15,
  FLOOR_WOOD: 16, FLOOR_TILE: 17, FLOOR_STONE: 18, WALL: 19, CEMETERY: 20, GARDEN: 21, VOID: 22,
  ROCKROAD: 23, CARPET: 24, MARKET: 25, OUTFIELD: 26, DIRTROAD: 27, CANTERA: 28, HEX: 29, SAND: 30, LAJA: 31,
};

// Which ground types a person can walk on (others collide).
const WALKABLE = new Set([G.GRASS, G.DIRT, G.ASPHALT, G.COBBLE, G.SIDEWALK, G.PLAZA, G.ROCK, G.FIELD,
  G.FOREST, G.MEDIAN, G.COURT, G.INFIELD, G.STAIRS, G.FLOOR_WOOD, G.FLOOR_TILE, G.FLOOR_STONE,
  G.CEMETERY, G.ROCKROAD, G.CARPET, G.MARKET, G.OUTFIELD, G.DIRTROAD, G.CANTERA, G.HEX, G.SAND, G.LAJA]);
export const ROADS = new Set([G.ASPHALT, G.COBBLE, G.DIRTROAD, G.ROCKROAD, G.LAJA]);

export class GameMap {
  constructor(id, name, w, h, opts = {}) {
    this.id = id; this.name = name; this.w = w; this.h = h;
    this.ground = new Uint8Array(w * h).fill(opts.fill ?? G.GRASS);
    this.solid = new Uint8Array(w * h);      // 1 = blocked for walking
    this.elev = new Float32Array(w * h).fill(opts.baseElev ?? 1560); // metres
    this.street = new Int16Array(w * h).fill(-1); // index into streetNames
    this.streetNames = [];
    this.structures = []; // baked into ground chunks (blocks of houses, walls...)
    this.sprites = [];    // y-sorted static objects (landmarks, trees, lamps...)
    this.doors = [];      // {x,y,w,h,to,tx,ty,label,hours}
    this.exits = [];      // edge / tile triggers to other maps
    this.areas = [];      // named zones {name,x,y,w,h,kind}
    this.labels = [];     // map labels {text,x,y,size}
    this.lights = [];     // {x,y,r,color,kind}
    this.lanes = [];      // vehicle lanes: polylines in tile coords
    this.spawns = {};     // named points
    this.interior = !!opts.interior;
    this.outdoor = !opts.interior;
    this.ambient = opts.ambient || 'town';
    this.version = 0;
  }
  idx(x, y) { return y * this.w + x; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inb(x, y) ? this.ground[y * this.w + x] : G.VOID; }
  set(x, y, g) { if (this.inb(x, y)) this.ground[y * this.w + x] = g; }
  fill(x, y, w, h, g) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, g);
  }
  setSolid(x, y, w = 1, h = 1, v = 1) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.inb(i, j)) this.solid[j * this.w + i] = v;
  }
  isSolidTile(x, y) {
    if (!this.inb(x, y)) return true;
    const i = y * this.w + x;
    return this.solid[i] === 1 || !WALKABLE.has(this.ground[i]);
  }
  // Collision against a small box in world units.
  blocked(px, py, hw = 4, hh = 3) {
    const x0 = Math.floor((px - hw) / TILE), x1 = Math.floor((px + hw) / TILE);
    const y0 = Math.floor((py - hh) / TILE), y1 = Math.floor((py + hh) / TILE);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.isSolidTile(x, y)) return true;
    // Circular colliders from sprites (trees, fountains, lamp posts...)
    for (const s of this.colliders || []) {
      if (px + hw > s.x0 && px - hw < s.x1 && py + hh > s.y0 && py - hh < s.y1) return true;
    }
    return false;
  }
  elevAt(x, y) {
    x = clamp(Math.floor(x), 0, this.w - 1); y = clamp(Math.floor(y), 0, this.h - 1);
    return this.elev[y * this.w + x];
  }
  addStreetName(name) {
    let i = this.streetNames.indexOf(name);
    if (i < 0) { i = this.streetNames.length; this.streetNames.push(name); }
    return i;
  }
  markStreet(x, y, w, h, name) {
    const id = this.addStreetName(name);
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.inb(i, j)) this.street[j * this.w + i] = id;
  }
  streetAt(tx, ty) {
    if (!this.inb(tx, ty)) return null;
    const s = this.street[ty * this.w + tx];
    return s >= 0 ? this.streetNames[s] : null;
  }
  areaAt(tx, ty) {
    let best = null;
    for (const a of this.areas) {
      if (a.kind === 'neighbor') continue;
      if (tx >= a.x && ty >= a.y && tx < a.x + a.w && ty < a.y + a.h) {
        if (!best || a.w * a.h < best.w * best.h) best = a;
      }
    }
    return best;
  }
  // Build fast collider list from sprites that declare a footprint.
  finalize() {
    this.colliders = [];
    for (const s of this.sprites) {
      if (s.collide) {
        const k = s.scale || 1;
        const c = s.collide.map(v => v * k); // world units rect relative to sprite anchor
        this.colliders.push({ x0: s.x + c[0], y0: s.y + c[1], x1: s.x + c[0] + c[2], y1: s.y + c[1] + c[3], s });
      }
    }
    // spatial buckets for colliders (per 8 tiles)
    this.bucket = new Map();
    const B = TILE * 8;
    for (const c of this.colliders) {
      for (let by = Math.floor(c.y0 / B); by <= Math.floor(c.y1 / B); by++)
        for (let bx = Math.floor(c.x0 / B); bx <= Math.floor(c.x1 / B); bx++) {
          const k = bx + ',' + by;
          if (!this.bucket.has(k)) this.bucket.set(k, []);
          this.bucket.get(k).push(c);
        }
    }
    const self = this;
    this.blocked = function (px, py, hw = 4, hh = 3) {
      const x0 = Math.floor((px - hw) / TILE), x1 = Math.floor((px + hw) / TILE);
      const y0 = Math.floor((py - hh) / TILE), y1 = Math.floor((py + hh) / TILE);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (self.isSolidTile(x, y)) return true;
      const list = self.bucket.get(Math.floor(px / B) + ',' + Math.floor(py / B));
      if (list) for (const c of list) {
        if (c.s.acts && !c.s.acts.includes(self.act)) continue;
        if (px + hw > c.x0 && px - hw < c.x1 && py + hh > c.y0 && py - hh < c.y1) return true;
      }
      return false;
    };
    // tiles whose middle is taken by a sprite collider (bushes, benches, lamps, trees…): pathfinding avoids them
    this.colBlock = new Uint8Array(this.w * this.h);
    for (const c of this.colliders) {
      if (c.s.acts || c.s.nightOnly) continue;
      for (let ty = Math.floor(c.y0 / TILE); ty <= Math.floor(c.y1 / TILE); ty++) for (let tx = Math.floor(c.x0 / TILE); tx <= Math.floor(c.x1 / TILE); tx++) {
        if (!this.inb(tx, ty)) continue;
        const X = tx * TILE, Y = ty * TILE;
        if (c.x1 > X + 3 && c.x0 < X + 13 && c.y1 > Y + 4 && c.y0 < Y + 14) this.colBlock[ty * this.w + tx] = 1;
      }
    }
    // sort sprites into row buckets for quick culling
    this.spriteRows = new Map();
    for (const s of this.sprites) {
      const r = Math.floor(s.y / (TILE * 8));
      if (!this.spriteRows.has(r)) this.spriteRows.set(r, []);
      this.spriteRows.get(r).push(s);
    }
    this.version++;
  }
  spritesInView(x0, y0, x1, y1) {
    const out = [];
    const R = TILE * 8;
    for (let r = Math.floor(y0 / R) - 1; r <= Math.floor(y1 / R) + 4; r++) {
      const list = this.spriteRows.get(r);
      if (!list) continue;
      for (const s of list) {
        const w = (s.w || 32) * (s.scale || 1), up = (s.up || 64) * (s.scale || 1);
        if (s.x + w / 2 < x0 - 16 || s.x - w / 2 > x1 + 16) continue;
        if (s.y < y0 - 16 || s.y - up > y1) continue;
        out.push(s);
      }
    }
    return out;
  }
  doorAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    for (const d of this.doors) {
      if (tx >= d.x && tx < d.x + (d.w || 1) && ty >= d.y && ty < d.y + (d.h || 1)) return d;
    }
    return null;
  }
  exitAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    for (const e of this.exits) {
      if (tx >= e.x && tx < e.x + e.w && ty >= e.y && ty < e.y + e.h) return e;
    }
    return null;
  }
}
