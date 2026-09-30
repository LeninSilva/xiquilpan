// Game clock, calendar and environment (daylight, weather).
import { clamp, lerp, DAYS, MONTHS } from './util.js';

const LAT = 19.9936, LON = -102.7175; // Jiquilpan de Juárez

export class Clock {
  constructor() {
    // Story begins Thursday 1 October 2026, 7:30 am
    this.base = Date.UTC(2026, 9, 1);
    this.minutes = 7 * 60 + 30;      // minutes since base (game time)
    this.rate = 1;                   // game minutes per real second
    this.real = 0;                   // real seconds since boot
    this.dt = 0;
    this.paused = false;
    this.realTime = false;           // sync with the real clock of Jiquilpan
  }
  tick(dt) {
    this.dt = dt; this.real += dt;
    if (this.realTime) {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now);
      const h = +parts.find(p => p.type === 'hour').value % 24, m = +parts.find(p => p.type === 'minute').value;
      const day = Math.floor(this.minutes / 1440);
      let target = day * 1440 + h * 60 + m + now.getSeconds() / 60;
      if (target < this.minutes - 720) target += 1440;
      this.minutes = Math.max(this.minutes, target);
    } else if (!this.paused) this.minutes += dt * this.rate;
  }
  get dayIndex() { return Math.floor(this.minutes / 1440); }
  get minuteOfDay() { return ((this.minutes % 1440) + 1440) % 1440; }
  get hour() { return this.minuteOfDay / 60; }
  get date() { return new Date(this.base + this.minutes * 60000); }
  get weekday() { return this.date.getUTCDay(); } // 0 Sunday
  get month() { return this.date.getUTCMonth(); }
  dateLabel() {
    const d = this.date;
    return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  }
  shortDate() { const d = this.date; return `${DAYS[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`; }
  advanceTo(hour) { // skip forward to the next occurrence of this hour
    const md = this.minuteOfDay, target = hour * 60;
    this.minutes += (target > md ? target - md : 1440 - md + target);
  }
  addDays(n) { this.minutes += n * 1440; }
  toJSON() { return { minutes: this.minutes, rate: this.rate, realTime: this.realTime }; }
  load(o) { if (!o) return; this.minutes = o.minutes ?? this.minutes; this.rate = o.rate ?? 1; this.realTime = !!o.realTime; }
}

export class Environment {
  constructor() {
    this.light = 1; this.dawn = false; this.dusk = false;
    this.rainAmt = 0; this.cloud = 0.2; this.overcast = 0; this.wind = 0.3; this.lightning = 0;
    this.weather = 'soleado'; this.temp = 22;
    this.live = null; this.liveAt = 0; this.useLive = true;
    this.sim = { rainTarget: 0, next: 0 };
    this.bloom = false;
    this.override = null;
  }
  // Try to use the real current weather of Jiquilpan (Open-Meteo, no key needed).
  async fetchLive() {
    if (!this.useLive || !navigator.onLine) return;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,precipitation,rain,cloud_cover,wind_speed_10m,weather_code&timezone=America%2FMexico_City`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      this.live = j.current; this.liveAt = Date.now();
    } catch (e) { /* offline: keep simulating */ }
  }
  update(clock, dt) {
    const h = clock.hour;
    // daylight curve (sunrise ~7:05, sunset ~19:05 in Jiquilpan, varies little)
    const rise = 7.05, set = 19.1;
    let L;
    if (h < rise - 0.8 || h > set + 0.8) L = 0;
    else if (h < rise + 0.6) L = clamp((h - (rise - 0.8)) / 1.4, 0, 1);
    else if (h > set - 0.6) L = clamp(((set + 0.8) - h) / 1.4, 0, 1);
    else L = 1;
    this.dawn = h < 12 && L < 1; this.dusk = h > 12 && L < 1;
    // jacarandas bloom from February to April
    const mo = clock.month; this.bloom = mo >= 1 && mo <= 3;
    // weather
    let targetRain = 0, targetCloud = 0.2, wind = 0.3, code = 0;
    if (this.override) {
      ({ rain: targetRain, cloud: targetCloud } = this.override);
    } else if (this.live && this.useLive && (Date.now() - this.liveAt) < 3 * 3600 * 1000) {
      targetRain = clamp((this.live.precipitation || 0) / 3, 0, 1);
      targetCloud = clamp((this.live.cloud_cover || 0) / 100, 0, 1);
      wind = clamp((this.live.wind_speed_10m || 0) / 25, 0.1, 1);
      code = this.live.weather_code || 0; this.temp = this.live.temperature_2m;
    } else {
      // Simulated: rainy season (June–October) brings afternoon/evening storms.
      const rainy = mo >= 5 && mo <= 9;
      const dayKey = clock.dayIndex;
      const seed = Math.sin(dayKey * 12.9898) * 43758.5453; const r = seed - Math.floor(seed);
      const stormToday = rainy ? r < 0.55 : r < 0.07;
      const stormStart = 14.5 + r * 4, stormLen = 1 + r * 2.5;
      if (stormToday && h > stormStart && h < stormStart + stormLen) targetRain = 0.35 + r * 0.6;
      targetCloud = stormToday ? (h > stormStart - 2 && h < stormStart + stormLen + 1 ? 0.9 : 0.45) : (rainy ? 0.35 : 0.12);
      wind = 0.2 + targetRain * 0.8;
      this.temp = Math.round(lerp(13, 27, Math.sin(Math.PI * clamp((h - 6) / 14, 0, 1))) + (rainy ? 0 : 1));
    }
    const k = Math.min(1, dt * 0.25);
    this.rainAmt = lerp(this.rainAmt, targetRain, k);
    this.cloud = lerp(this.cloud, targetCloud, k);
    this.wind = lerp(this.wind, wind, k);
    this.overcast = clamp((this.cloud - 0.5) * 1.6, 0, 0.8) + this.rainAmt * 0.3;
    this.light = L * (1 - this.overcast * 0.25);
    // occasional lightning during heavy rain
    if (this.rainAmt > 0.65 && Math.random() < dt * 0.05) this.lightning = 0.7;
    this.lightning = Math.max(0, this.lightning - dt * 2.5);
    this.weather = this.rainAmt > 0.55 ? 'tormenta' : this.rainAmt > 0.15 ? 'lluvia' : this.cloud > 0.6 ? 'nublado' : L < 0.3 ? 'despejado' : 'soleado';
    if (code >= 95) this.weather = 'tormenta';
  }
  icon() {
    return { tormenta: '⛈', lluvia: '🌧', nublado: '☁', despejado: '✦', soleado: '☀' }[this.weather] || '☀';
  }
}
