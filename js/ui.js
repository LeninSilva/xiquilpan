// DOM user interface: HUD, dialogue, menus, map, shop, toasts.
import { TILE, clamp, fmtTime, makeCanvas, DAYS, shade } from './util.js';
import { G } from './world.js';
import { drawPerson, PEOPLE_SCALE } from './render/people.js';
import { ITEMS, SHOPS } from './data/items.js';
import { HILOS_GOAL } from './quests.js';
import { drawGrayPortrait } from './cutscene.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(game) {
    this.game = game;
    this.el = {
      hud: $('hud'), touch: $('touch'), place: $('placeName'), street: $('streetName'), clock: $('clockText'), day: $('dayText'), wx: $('wxIcon'),
      money: $('moneyText'), tracker: $('questTracker'), compass: $('compass'), needle: $('compassNeedle'), prompt: $('prompt'), promptText: $('promptText'),
      dialog: $('dialog'), portrait: $('portrait'), dlgName: $('dlgName'), dlgRole: $('dlgRole'), dlgText: $('dlgText'), dlgChoices: $('dlgChoices'),
      dlgAsk: $('dlgAsk'), dlgInput: $('dlgInput'), dlgNext: $('dlgNext'), toasts: $('toasts'), banner: $('banner'), fade: $('fade'),
      menu: $('menu'), shop: $('shop'),
    };
    this.typing = null; this.advanceResolve = null; this.choiceResolve = null; this.askResolve = null;
    this.menuOpen = false; this.shopOpenFlag = false;
    this.bind();
  }
  bind() {
    const e = this.el;
    const advance = (ev) => { if (ev && ev.target.closest('button, input, form')) return; this.onAdvance(); };
    e.dialog.addEventListener('click', advance);
    e.dlgAsk.addEventListener('submit', (ev) => { ev.preventDefault(); const v = e.dlgInput.value.trim(); e.dlgInput.value = ''; e.dlgInput.blur(); e.dlgAsk.classList.add('hidden'); const r = this.askResolve; this.askResolve = null; r && r(v); });
    $('btnMenu').addEventListener('click', () => this.openMenu('map'));
    $('menuClose').addEventListener('click', () => this.closeMenu());
    for (const b of document.querySelectorAll('#menuTabs button')) b.addEventListener('click', () => this.openMenu(b.dataset.tab));
    $('shopClose').addEventListener('click', () => this.closeShop());
    window.addEventListener('keydown', (ev) => {
      if (ev.target.tagName === 'INPUT') { if (ev.key === 'Escape') ev.target.blur(); return; }
      const k = ev.key.toLowerCase();
      if (this.choiceResolve) {
        const btns = [...e.dlgChoices.querySelectorAll('button')];
        if (k === 'arrowdown' || k === 's') { this.choiceSel = (this.choiceSel + 1) % btns.length; this.highlight(btns); ev.preventDefault(); }
        else if (k === 'arrowup' || k === 'w') { this.choiceSel = (this.choiceSel - 1 + btns.length) % btns.length; this.highlight(btns); ev.preventDefault(); }
        else if (k === 'enter' || k === ' ' || k === 'e') { btns[this.choiceSel]?.click(); ev.preventDefault(); }
        else if (/^[1-9]$/.test(k)) { btns[+k - 1]?.click(); }
        return;
      }
      if (!e.dialog.classList.contains('hidden') && (k === 'enter' || k === ' ' || k === 'e')) { this.onAdvance(); ev.preventDefault(); return; }
      if (k === 'm' || k === 'tab') { ev.preventDefault(); if (this.menuOpen) this.closeMenu(); else if (!this.game.dialog.active) this.openMenu('map'); }
      if (k === 'i') { if (!this.menuOpen && !this.game.dialog.active) this.openMenu('bag'); }
      if (k === 'j') { if (!this.menuOpen && !this.game.dialog.active) this.openMenu('journal'); }
      if (k === 'escape') { if (this.shopOpenFlag) this.closeShop(); else if (this.menuOpen) this.closeMenu(); }
    });
    // A button also advances dialogue on touch devices
    $('btnA').addEventListener('touchstart', () => { if (!e.dialog.classList.contains('hidden')) { if (this.choiceResolve) { const btns = [...e.dlgChoices.querySelectorAll('button')]; btns[this.choiceSel]?.click(); } else this.onAdvance(); } }, { passive: true });
  }
  highlight(btns) { btns.forEach((b, i) => b.classList.toggle('sel', i === this.choiceSel)); btns[this.choiceSel]?.scrollIntoView({ block: 'nearest' }); }

  // ---- HUD ------------------------------------------------------------------
  showHUD(on) { this.el.hud.classList.toggle('hidden', !on); this.el.touch.classList.toggle('hidden', !on); }
  updateHUD() {
    const g = this.game, e = this.el;
    const place = g.placeName();
    if (this._place !== place) { e.place.textContent = place; this._place = place; }
    const st = g.map.outdoor ? (g.map.streetAt(Math.floor(g.player.x / TILE), Math.floor(g.player.y / TILE)) || '') : '';
    if (this._street !== st) { e.street.textContent = st; e.street.style.display = st ? '' : 'none'; this._street = st; }
    const t = fmtTime(g.clock.minuteOfDay);
    if (this._t !== t) { e.clock.textContent = t; this._t = t; }
    const d = g.clock.shortDate();
    if (this._d !== d) { e.day.textContent = d; this._d = d; }
    const w = g.env.icon();
    if (this._w !== w) { e.wx.textContent = w; this._w = w; }
    if (this._m !== g.state.money) { e.money.textContent = g.state.money; this._m = g.state.money; }
    const o = g.quests.objective();
    const key = o.title + o.text;
    if (this._o !== key) { e.tracker.innerHTML = `<div class="qt">${o.title}</div><div class="qs">${o.text}</div>`; this._o = key; }
    // compass toward the objective when it is on this map
    const at = o.at;
    if (at && (at[0] === g.map.id || (g.map.interior && at[0] === g.lastOutdoor))) {
      e.compass.style.display = '';
      if (g.map.interior) { e.needle.style.transform = 'rotate(180deg)'; }
      else {
        const ang = Math.atan2(at[2] * TILE - g.player.y, at[1] * TILE - g.player.x) + Math.PI / 2;
        e.needle.style.transform = `rotate(${ang}rad)`;
      }
    } else if (at && at[0] !== g.map.id && g.map.id === 'town' && at[0] === 'cerro') {
      e.compass.style.display = ''; const ang = Math.atan2(g.map.h * TILE - g.player.y, 152 * TILE - g.player.x) + Math.PI / 2; e.needle.style.transform = `rotate(${ang}rad)`;
    } else if (at && g.map.id === 'cerro' && at[0] === 'town') {
      e.compass.style.display = ''; const ang = Math.atan2(0 - g.player.y, 40 * TILE - g.player.x) + Math.PI / 2; e.needle.style.transform = `rotate(${ang}rad)`;
    } else e.compass.style.display = 'none';
  }
  prompt(text) {
    if (text === this._prompt) return;
    this._prompt = text;
    if (!text) { this.el.prompt.classList.add('hidden'); return; }
    this.el.promptText.textContent = text; this.el.prompt.classList.remove('hidden');
  }
  toast(text, kind = '') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = text;
    this.el.toasts.appendChild(t);
    setTimeout(() => t.remove(), 3300);
    while (this.el.toasts.children.length > 4) this.el.toasts.firstChild.remove();
  }
  banner(title, sub) {
    const b = this.el.banner; b.classList.remove('hidden');
    $('bannerTitle').textContent = title; $('bannerSub').textContent = sub || '';
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(this._bt); this._bt = setTimeout(() => b.classList.add('hidden'), 4600);
  }
  fade(on, white = false, ms = 450) {
    const f = this.el.fade;
    f.classList.toggle('white', white);
    f.style.transitionDuration = ms + 'ms';
    f.classList.toggle('on', on);
    return new Promise(r => setTimeout(r, ms + 30));
  }
  cinema(on) { document.body.classList.toggle('cine', on); this.showHUD(!on); }

  // ---- dialogue ----------------------------------------------------------------
  dialogSpeaker(who) {
    const e = this.el;
    e.dialog.classList.remove('hidden');
    this.prompt(null);
    const name = who ? (who.def?.name || who.name || '') : '';
    e.dlgName.textContent = name;
    e.dlgRole.textContent = who ? (who.def?.role || who.role || '') : '';
    const look = who && (who.look || who.def?._look);
    e.portrait.style.display = look ? '' : 'none';
    e.dlgText.style.fontStyle = who ? '' : 'italic';
    if (look) this.drawPortrait(look, false);
    this.speaker = who;
  }
  drawPortrait(look, talk) {
    const c = this.el.portrait, S = c.width;
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
    if (look.alien) { drawGrayPortrait(ctx, S, performance.now() / 1000); return; }
    const L = { ...look, body: 1 / PEOPLE_SCALE };
    const k = S / 30;
    ctx.save(); ctx.scale(k, k); ctx.translate(-1, -8 - (look.hat === 'sombrero' || look.hat === 'texana' ? -2 : 0));
    drawPerson(ctx, L, 0, talk ? 'talk' : 'idle');
    ctx.restore();
    if (look.glow > 0.2) { ctx.fillStyle = `rgba(120,110,255,${0.12 * look.glow})`; ctx.fillRect(0, 0, S, S); }
  }
  async dialogText(text, opts = {}) {
    const e = this.el;
    e.dlgChoices.innerHTML = ''; e.dlgAsk.classList.add('hidden'); e.dlgNext.style.visibility = 'hidden';
    e.dlgText.textContent = '';
    text = String(text ?? '');
    const look = this.speaker && (this.speaker.look || this.speaker.def?._look);
    return new Promise(resolve => {
      let i = 0; let last = 0;
      const speed = opts.fast ? 90 : 48; // chars per second
      const start = performance.now();
      const step = (now) => {
        const n = Math.min(text.length, Math.floor((now - start) / 1000 * speed));
        if (n !== i) { i = n; e.dlgText.textContent = text.slice(0, i); if (look && now - last > 140) { this.drawPortrait(look, (i / 3) % 2 < 1); last = now; } if (i % 3 === 0) this.game.sfx('blip'); }
        if (i >= text.length) { this.typing = null; if (look) this.drawPortrait(look, false); e.dlgNext.style.visibility = ''; resolve(); return; }
        this.typing = requestAnimationFrame(step);
      };
      this.finishTyping = () => { cancelAnimationFrame(this.typing); this.typing = null; e.dlgText.textContent = text; if (look) this.drawPortrait(look, false); e.dlgNext.style.visibility = ''; resolve(); };
      this.typing = requestAnimationFrame(step);
    });
  }
  dialogThinking() { this.el.dlgText.innerHTML = '<span class="thinking">…</span>'; this.el.dlgChoices.innerHTML = ''; }
  onAdvance() {
    if (this.typing) { this.finishTyping(); return; }
    if (this.advanceResolve) { const r = this.advanceResolve; this.advanceResolve = null; r(); }
  }
  waitAdvance(autoMs) {
    return new Promise(resolve => {
      this.advanceResolve = resolve;
      if (autoMs) setTimeout(() => { if (this.advanceResolve === resolve) { this.advanceResolve = null; resolve(); } }, autoMs);
    });
  }
  dialogChoices(options) {
    const e = this.el;
    e.dlgNext.style.visibility = 'hidden';
    e.dlgChoices.innerHTML = '';
    this.choiceSel = 0;
    return new Promise(resolve => {
      options.forEach((o, i) => {
        const b = document.createElement('button');
        const tag = o.tag ? `<span class="tag ${o.tag}">${{ quest: 'misión', side: 'misión', kind: 'amable', mean: 'grosero', honest: 'honesto', money: '$' }[o.tag] || o.tag}</span>` : '';
        b.innerHTML = `${tag}<span>${escapeHTML(o.text)}</span>`;
        b.addEventListener('click', (ev) => { ev.stopPropagation(); e.dlgChoices.innerHTML = ''; this.choiceResolve = null; this.game.sfx('select'); resolve(o); });
        e.dlgChoices.appendChild(b);
      });
      this.choiceResolve = resolve;
      this.highlight([...e.dlgChoices.querySelectorAll('button')]);
    });
  }
  dialogAsk(placeholder) {
    const e = this.el;
    e.dlgChoices.innerHTML = ''; e.dlgAsk.classList.remove('hidden');
    e.dlgInput.placeholder = placeholder || 'Di algo…';
    setTimeout(() => e.dlgInput.focus(), 50);
    const cancel = document.createElement('button'); cancel.textContent = 'Cancelar';
    cancel.addEventListener('click', (ev) => { ev.stopPropagation(); e.dlgAsk.classList.add('hidden'); e.dlgChoices.innerHTML = ''; const r = this.askResolve; this.askResolve = null; r && r(''); });
    e.dlgChoices.appendChild(cancel);
    return new Promise(resolve => { this.askResolve = (v) => { e.dlgChoices.innerHTML = ''; resolve(v); }; });
  }
  hideDialog() {
    const e = this.el;
    e.dialog.classList.add('hidden'); e.dlgChoices.innerHTML = ''; e.dlgAsk.classList.add('hidden');
    this.advanceResolve = null; this.choiceResolve = null; this.askResolve = null;
  }

  // ---- shop ------------------------------------------------------------------
  openShop(shopId, npc, onBuy) {
    const shop = SHOPS[shopId]; if (!shop) return Promise.resolve();
    const g = this.game, e = this.el;
    this.shopOpenFlag = true; g.input.enabled = false;
    $('shopName').textContent = shop.name; $('shopSub').textContent = shop.sub + (shop.fiado && g.state.debt > 0 ? ` · Debes $${g.state.debt}` : '');
    const list = $('shopList');
    const render = () => {
      list.innerHTML = '';
      for (const entry of shop.items) {
        const [id, name, ico, price, effect, desc] = entry;
        const free = (g.state.freeTacos > 0 && shopId === 'taco_guero_bueno');
        const row = document.createElement('div'); row.className = 'shop-row';
        row.innerHTML = `<div class="ico">${ico}</div><div class="meta"><b>${name}</b><small>${desc || ''}</small></div><div class="price">${free ? 'GRATIS' : '$' + price}</div>`;
        const buy = document.createElement('button'); buy.textContent = 'Comprar';
        buy.disabled = !free && g.state.money < price;
        buy.addEventListener('click', () => { onBuy(entry, 'cash'); render(); $('shopSub').textContent = shop.sub + (shop.fiado && g.state.debt > 0 ? ` · Debes $${g.state.debt}` : ''); });
        row.appendChild(buy);
        if (shop.fiado && price > 0) {
          const fia = document.createElement('button'); fia.className = 'alt'; fia.textContent = 'Fiado';
          fia.title = 'Pedir fiado: pagar después';
          fia.disabled = g.stats.palabra < -40 || g.state.debt > 60;
          fia.addEventListener('click', () => { onBuy(entry, 'fiado'); render(); $('shopSub').textContent = shop.sub + ` · Debes $${g.state.debt}`; });
          row.appendChild(fia);
        }
        list.appendChild(row);
      }
    };
    render();
    e.shop.classList.remove('hidden');
    return new Promise(r => { this.shopResolve = r; });
  }
  closeShop() {
    this.el.shop.classList.add('hidden'); this.shopOpenFlag = false;
    if (!this.game.dialog.active) this.game.input.enabled = true;
    const r = this.shopResolve; this.shopResolve = null; r && r();
  }

  // ---- menu ------------------------------------------------------------------
  openMenu(tab) {
    const g = this.game;
    if (g.dialog.active || g.cutsceneActive) return;
    this.menuOpen = true; g.input.enabled = false; g.clock.paused = true;
    this.el.menu.classList.remove('hidden');
    for (const b of document.querySelectorAll('#menuTabs button')) b.classList.toggle('on', b.dataset.tab === tab);
    for (const s of document.querySelectorAll('.tab')) s.classList.toggle('on', s.id === 'tab-' + tab);
    this.tab = tab;
    if (tab === 'map') this.renderMap();
    if (tab === 'journal') this.renderJournal();
    if (tab === 'bag') this.renderBag();
    if (tab === 'self') this.renderSelf();
    if (tab === 'settings') this.renderSettings();
    g.sfx('menu');
  }
  closeMenu() {
    this.menuOpen = false; this.el.menu.classList.add('hidden');
    this.game.input.enabled = true; this.game.clock.paused = false;
    this.game.saveSettings();
  }

  renderJournal() {
    const g = this.game;
    const t = $('tab-journal');
    const entries = g.quests.journal();
    let html = '';
    for (const e of entries) html += `<div class="card"><div class="kicker">${e.kicker}</div><h3 class="${e.done ? 'done' : ''}">${e.title}</h3><p>${e.text}</p></div>`;
    html += `<div class="card"><div class="kicker">Hilos del rebozo añil</div><h3>${g.state.hilos} / ${HILOS_GOAL}</h3><p>${g.flags.mancha ? 'Cada conversación verdadera —escuchar sin pantalla de por medio— agrega un hilo.' : 'Todavía no sabes lo que son los hilos.'}</p>${g.state.hiloNames.length ? `<p style="color:#6c4bb4">${g.state.hiloNames.join(' · ')}</p>` : ''}</div>`;
    if (g.state.clues.length) html += `<div class="card"><div class="kicker">Pistas</div><p>${g.state.clues.map(c => '• ' + ({ rosita: 'Rosita: salieron el lunes antes del amanecer, con café.', chuy: 'Chuy los llevó a la brecha del cerro.', lupe: 'Toño compró mezcal “pa’l valor”.', refugio: 'Don Refugio les prestó una cobija; Toño llevaba su rifle.', tona: 'Doña Toña: subieron a la cruz.' }[c] || c)).join('<br>')}</p></div>`;
    t.innerHTML = html;
  }
  renderBag() {
    const g = this.game, t = $('tab-bag');
    const inv = g.state.inventory;
    let html = '<div class="grid">';
    const keys = Object.keys(inv).filter(k => inv[k] > 0);
    if (!keys.length) html += '<div class="card" style="grid-column:1/-1"><p>Tu morral está vacío. Por ahí hay palos, trompos perdidos… y tiendas.</p></div>';
    for (const k of keys) {
      const it = ITEMS[k] || { name: k, ico: '❔', desc: '' };
      html += `<div class="item"><div class="ico">${it.ico}</div><b>${it.name}${inv[k] > 1 ? ' ×' + inv[k] : ''}</b><small>${it.desc}</small>${it.type === 'food' || it.type === 'drink' ? `<button data-use="${k}">Consumir</button>` : ''}${k === 'trompo' ? `<button data-spin="1">Bailar el trompo</button>` : ''}</div>`;
    }
    html += '</div>';
    t.innerHTML = html;
    t.querySelectorAll('[data-use]').forEach(b => b.addEventListener('click', () => { g.consumeItem(b.dataset.use); this.renderBag(); }));
    t.querySelectorAll('[data-spin]').forEach(b => b.addEventListener('click', () => { this.closeMenu(); g.spinTrompo(); }));
  }
  renderSelf() {
    const g = this.game, t = $('tab-self'), s = g.stats;
    const meter = (label, v, c, uni) => `<div class="statrow"><span>${label}</span><div class="meter ${uni ? 'uni' : ''}" style="--c:${c}"><i style="${uni ? `width:${clamp(v, 0, 100)}%` : v >= 0 ? `width:${v / 2}%` : `left:${50 + v / 2}%;width:${-v / 2}%`}"></i></div><b>${Math.round(v)}</b></div>`;
    const desc = [];
    if (s.corazon > 50) desc.push('La gente te sonríe al pasar; hasta los perros te mueven la cola.');
    else if (s.corazon < -40) desc.push('Tu ropa se ve descuidada y los perros te ladran.');
    if (s.palabra > 40) desc.push('Tu palabra vale: te fían sin pensarlo.');
    else if (s.palabra < -30) desc.push('En el pueblo se dice que no pagas lo que debes.');
    if (s.fama < -30) desc.push('Para muchos eres “el marciano del cerro”.');
    else if (s.fama > 40) desc.push('Tu nombre se dice con respeto en los portales.');
    if (s.panza > 60) desc.push('Los tacos del Güero se te notan en la panza.');
    if (g.flags.mancha) desc.push('Tienes una mancha color añil en la mano derecha. Brilla cuando escuchas de verdad.');
    t.innerHTML = `<div class="card" style="display:flex;gap:14px;align-items:center"><canvas id="selfPortrait" width="140" height="140" style="width:100px;height:100px;border-radius:14px;background:linear-gradient(160deg,#efe3cb,#d9c3a2)"></canvas><div><div class="kicker">${g.state.era === 'after' ? 'Dos años después' : 'Jiquilpan'}</div><h3>${escapeHTML(g.state.name)}</h3><p>${desc.join(' ') || 'Un muchacho de Jiquilpan, como cualquier otro. Por ahora.'}</p></div></div>
      <div class="card"><h4>Quién eres (cambia con lo que haces)</h4>
      ${meter('Corazón', s.corazon, '#c2413c')}${meter('Palabra', s.palabra, '#2b4c8a')}${meter('Fama', s.fama, '#b58a1f')}${meter('Panza', s.panza, '#8a5a34', true)}
      <p style="font-size:12px;color:#7a6a5a">Corazón: bondad. Palabra: honestidad y deudas. Fama: lo que el pueblo cree de ti. Panza: lo bien que comes.</p></div>
      <div class="card"><h4>Estado</h4><p>${[g.status.enchilado > 0 ? '🌶️ Enchilado' : '', g.status.buzz > 30 ? '🍺 Alegre' : '', g.state.debt > 0 ? `💸 Debes $${g.state.debt} a Don Refugio` : '', '🧶 Hilos: ' + g.state.hilos].filter(Boolean).join(' · ')}</p>
      <p>Conversaciones: ${s.talks || 0} · Días en el pueblo: ${g.clock.dayIndex + 1}</p></div>`;
    const c = $('selfPortrait'); const ctx = c.getContext('2d'); const L = { ...g.player.look, body: 1 / PEOPLE_SCALE };
    ctx.scale(140 / 30, 140 / 30); ctx.translate(-1, -8); drawPerson(ctx, L, 0, 'idle');
  }
  renderSettings() {
    const g = this.game, t = $('tab-settings'), st = g.settings;
    t.innerHTML = `
      <div class="card"><h3>Ajustes</h3>
        <div class="set-row"><span>Hora real de Jiquilpan<br><small>El reloj del juego sigue la hora de México</small></span><button class="toggle ${g.clock.realTime ? 'on' : ''}" data-t="realTime"></button></div>
        <div class="set-row"><span>Clima real de Jiquilpan<br><small>Si hay internet, llueve o hace sol como ahorita en Jiquilpan (Open-Meteo)</small></span><button class="toggle ${g.env.useLive ? 'on' : ''}" data-t="liveWeather"></button></div>
        <div class="set-row"><span>Velocidad del tiempo</span><select id="setRate"><option value="0.5">Lenta</option><option value="1">Normal (1 min = 1 s)</option><option value="2">Rápida</option></select></div>
        <div class="set-row"><span>Sonido</span><button class="toggle ${st.sound ? 'on' : ''}" data-t="sound"></button></div>
        <div class="set-row"><span>Acercamiento</span><select id="setZoom"><option value="0.8">Lejos</option><option value="1">Normal</option><option value="1.25">Cerca</option></select></div>
      </div>
      <div class="card"><h3>Conversación libre con IA</h3>
        <p>Con una API key de Anthropic (o un proxy propio), los personajes responden en vivo con Claude y cada plática es distinta. Sin ella, el juego usa su propio generador de diálogos.</p>
        <div class="set-row"><span>Activar</span><button class="toggle ${st.llmEnabled ? 'on' : ''}" data-t="llmEnabled"></button></div>
        <div class="set-row"><span>API key</span><input type="password" id="setKey" placeholder="sk-ant-…" value="${escapeHTML(st.apiKey || '')}"></div>
        <div class="set-row"><span>Proxy (opcional)</span><input type="text" id="setBase" placeholder="https://tu-proxy.example" value="${escapeHTML(st.baseURL || '')}"></div>
        <div class="set-row"><span>Modelo</span><input type="text" id="setModel" value="${escapeHTML(st.model || 'claude-opus-5-5')}"></div>
        <p style="font-size:12px;color:#7a6a5a">La key se guarda sólo en este dispositivo y se envía directo a la API de Anthropic. ${g.llm.lastError ? 'Último error: ' + escapeHTML(g.llm.lastError) : ''}</p>
      </div>
      <div class="card"><h3>Partida</h3>
        <div class="set-row"><span>Guardar ahora</span><button class="btn ghost" id="setSave">Guardar</button></div>
        <div class="set-row"><span>Borrar partida y empezar de nuevo</span><button class="btn" id="setReset">Reiniciar</button></div>
        <p style="font-size:12px;color:#7a6a5a">Controles: flechas/WASD para caminar, Shift o B para correr, Espacio/E o A para hablar, M mapa, I morral, J diario.</p>
      </div>`;
    $('setRate').value = String(g.clock.rate); $('setZoom').value = String(st.zoom || 1);
    $('setRate').addEventListener('change', (ev) => { g.clock.rate = +ev.target.value; });
    $('setZoom').addEventListener('change', (ev) => { st.zoom = +ev.target.value; g.renderer.zoomMul = st.zoom; g.renderer.resize(); });
    t.querySelectorAll('.toggle').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.t; b.classList.toggle('on'); const on = b.classList.contains('on');
      if (k === 'realTime') g.clock.realTime = on;
      else if (k === 'liveWeather') { g.env.useLive = on; st.liveWeather = on; if (on) g.env.fetchLive(); }
      else { st[k] = on; if (k === 'llmEnabled') g.llm.failures = 0; }
    }));
    $('setKey').addEventListener('change', (ev) => { st.apiKey = ev.target.value.trim(); g.llm.failures = 0; });
    $('setBase').addEventListener('change', (ev) => { st.baseURL = ev.target.value.trim(); g.llm.failures = 0; });
    $('setModel').addEventListener('change', (ev) => { st.model = ev.target.value.trim() || 'claude-opus-5-5'; });
    $('setSave').addEventListener('click', () => { g.save(true); });
    $('setReset').addEventListener('click', () => { if (confirm('¿Borrar la partida? No se puede deshacer.')) { localStorage.removeItem('xiq_save'); location.reload(); } });
  }

  // ---- illustrated map (in the spirit of an explorer's parchment map) --------------
  buildMapImage(map) {
    const K = 4;
    const c = makeCanvas(map.w * K, map.h * K), ctx = c.getContext('2d');
    const col = {
      [G.GRASS]: '#cfd6a6', [G.FOREST]: '#a9c48a', [G.FIELD]: '#d9d59c', [G.SLOPE]: '#b9b58a', [G.ROCK]: '#cbbf9f', [G.DIRT]: '#dcc49a', [G.DIRTROAD]: '#c8a67a',
      [G.ROCKROAD]: '#b89a78', [G.ASPHALT]: '#8d8a86', [G.COBBLE]: '#a39a8c', [G.SIDEWALK]: '#e4dac6', [G.PLAZA]: '#e7cfae', [G.ROOF]: '#c98e6e', [G.MEDIAN]: '#a9c48a',
      [G.GARDEN]: '#a9c48a', [G.COURT]: '#8fb3a0', [G.OUTFIELD]: '#b9d28f', [G.INFIELD]: '#d9a57a', [G.STAIRS]: '#e2d2b4', [G.CEMETERY]: '#c2cc9a', [G.WATER]: '#8fc0d6',
      [G.FLOOR_STONE]: '#e2d2b4', [G.WALL]: '#d9cdb4', [G.MARKET]: '#ddd', [G.VOID]: '#b8a888',
    };
    ctx.fillStyle = '#efe2c4'; ctx.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      ctx.fillStyle = col[map.get(x, y)] || '#e9dcc0';
      ctx.fillRect(x * K, y * K, K, K);
    }
    // contour lines from real-ish elevation
    ctx.strokeStyle = 'rgba(120,90,50,0.35)'; ctx.lineWidth = 1;
    for (let y = 0; y < map.h - 1; y++) for (let x = 0; x < map.w - 1; x++) {
      const a = Math.floor(map.elev[y * map.w + x] / 10), b = Math.floor(map.elev[y * map.w + x + 1] / 10), d = Math.floor(map.elev[(y + 1) * map.w + x] / 10);
      if (a !== b) { ctx.beginPath(); ctx.moveTo(x * K + K, y * K); ctx.lineTo(x * K + K, y * K + K); ctx.stroke(); }
      if (a !== d) { ctx.beginPath(); ctx.moveTo(x * K, y * K + K); ctx.lineTo(x * K + K, y * K + K); ctx.stroke(); }
    }
    // block outlines
    ctx.strokeStyle = 'rgba(110,60,40,0.55)'; ctx.lineWidth = 1.2;
    for (const s of map.structures) if (s.kind === 'block') ctx.strokeRect(s.x * K + 0.5, s.y * K + 0.5, s.w * K - 1, s.h * K - 1);
    for (const s of map.sprites) if (s.building && s.rect) { ctx.fillStyle = '#b86a4c'; ctx.fillRect(s.rect.x * K, s.rect.y * K, s.rect.w * K, s.rect.h * K); ctx.strokeRect(s.rect.x * K + 0.5, s.rect.y * K + 0.5, s.rect.w * K - 1, s.rect.h * K - 1); }
    // trees as little dots
    for (const s of map.sprites) if (s.kind === 'tree') { ctx.fillStyle = s.tree === 'jacaranda' ? '#9a86c8' : '#7f9f62'; ctx.beginPath(); ctx.arc(s.x / TILE * K, s.y / TILE * K - 2, 2.2, 0, 7); ctx.fill(); }
    // paper vignette
    const vg = ctx.createRadialGradient(c.width / 2, c.height / 2, c.width * 0.3, c.width / 2, c.height / 2, c.width * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,80,30,0.25)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, c.width, c.height);
    c.K = K;
    return c;
  }
  renderMap() {
    const g = this.game;
    const map = g.map.interior ? g.getMap(g.lastOutdoor || 'town') : g.map;
    if (!this.mapCache || this.mapCache.id !== map.id) this.mapCache = { id: map.id, img: this.buildMapImage(map) };
    const img = this.mapCache.img, K = img.K;
    const cv = $('bigmap'), wrap = $('mapWrap');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = wrap.clientWidth * dpr; cv.height = wrap.clientHeight * dpr;
    const px = g.map.interior ? (g.returnStack.at(-1)?.x ?? g.player.x) : g.player.x, py = g.map.interior ? (g.returnStack.at(-1)?.y ?? g.player.y) : g.player.y;
    if (!this.mapView || this.mapView.id !== map.id) this.mapView = { id: map.id, z: 1.6 * dpr, cx: px / TILE * K, cy: py / TILE * K };
    else { this.mapView.cx = px / TILE * K; this.mapView.cy = py / TILE * K; }
    const view = this.mapView;
    const draw = () => {
      const ctx = cv.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#e9dcc0'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(view.z, 0, 0, view.z, cv.width / 2 - view.cx * view.z, cv.height / 2 - view.cy * view.z);
      ctx.drawImage(img, 0, 0);
      // labels of places
      const PRI = { plaza: 0, monument: 1, building: 2, stadium: 2, home: 3, shop: 4, taxi: 5, nature: 3, park: 6, forest: 6, village: 6, summit: 6, cemetery: 6, ranch: 6, trail: 7, neighbor: 8, district: 9 };
      const labels = map.areas.filter(a => a.kind in PRI).sort((a, b) => PRI[a.kind] - PRI[b.kind]);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const placed = [];
      for (const a of labels) {
        const big = ['district', 'park', 'forest', 'village', 'neighbor'].includes(a.kind);
        const size = (big ? 15 : 9.5) / Math.sqrt(view.z / dpr);
        if (!big && view.z / dpr < 1.1 && a.kind !== 'plaza') continue;
        ctx.font = `${big ? 'italic 600' : '600'} ${size}px Fraunces, Georgia, serif`;
        const x = (a.x + a.w / 2) * K, y = (a.y + a.h / 2) * K;
        // skip labels that would overlap one already placed (more important places go first)
        const w = ctx.measureText(a.name).width, h = size * 1.1;
        const box = [x - w / 2 - 2, y - h / 2, x + w / 2 + 2, y + h / 2];
        if (placed.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        placed.push(box);
        if (a.kind === 'neighbor') { ctx.lineWidth = 3 / Math.sqrt(view.z); ctx.strokeStyle = 'rgba(245,236,214,0.9)'; ctx.strokeText(a.name, x, y); ctx.fillStyle = 'rgba(110,90,70,0.75)'; ctx.fillText(a.name, x, y); continue; }
        ctx.lineWidth = 3 / Math.sqrt(view.z); ctx.strokeStyle = 'rgba(245,236,214,0.9)'; ctx.strokeText(a.name, x, y);
        ctx.fillStyle = big ? 'rgba(90,60,40,0.7)' : a.kind === 'taxi' ? '#1b7a3e' : a.kind === 'shop' ? '#7a4a1a' : '#4a2a1a';
        ctx.fillText(a.name, x, y);
      }
      // objective pin
      const o = g.quests.objective();
      if (o.at && o.at[0] === map.id) pin(ctx, o.at[1] * K, o.at[2] * K, '#e3b341', view.z);
      // player marker
      const t = performance.now() / 1000;
      ctx.fillStyle = 'rgba(194,65,60,0.25)'; ctx.beginPath(); ctx.arc(px / TILE * K, py / TILE * K, (10 + Math.sin(t * 4) * 3) / view.z * dpr, 0, 7); ctx.fill();
      ctx.fillStyle = '#c2413c'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 / view.z * dpr;
      ctx.beginPath(); ctx.arc(px / TILE * K, py / TILE * K, 5 / view.z * dpr, 0, 7); ctx.fill(); ctx.stroke();
      // compass rose
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = cv.width / dpr;
      ctx.save(); ctx.translate(W - 34, 34); ctx.fillStyle = 'rgba(74,42,26,0.8)'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(5, 0); ctx.lineTo(0, 18); ctx.lineTo(-5, 0); ctx.fill();
      ctx.font = 'bold 11px Fraunces, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('N', 0, -24); ctx.restore();
    };
    draw();
    $('mapLabel').textContent = map.name + (map.id === 'town' ? ' · Michoacán' : '');
    $('mapLegend').innerHTML = `<span style="--c:#c2413c">Tú</span><span style="--c:#e3b341">Objetivo</span><span style="--c:#1b7a3e">Sitios de taxi</span><span style="--c:#9a86c8">Jacarandas</span><span style="--c:#7a4a1a">Tiendas</span>`;
    // pan / pinch
    if (!cv._bound) {
      cv._bound = true;
      let drag = null, pinch = null;
      cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', (e) => { if (!drag || pinch) return; const v = this.mapView; v.cx -= (e.clientX - drag.x) * dpr / v.z; v.cy -= (e.clientY - drag.y) * dpr / v.z; drag = { x: e.clientX, y: e.clientY }; this._mapDraw(); });
      cv.addEventListener('pointerup', () => { drag = null; });
      cv.addEventListener('wheel', (e) => { e.preventDefault(); const v = this.mapView; v.z = clamp(v.z * (e.deltaY < 0 ? 1.15 : 0.87), 0.5 * dpr, 6 * dpr); this._mapDraw(); }, { passive: false });
      cv.addEventListener('touchstart', (e) => { if (e.touches.length === 2) { pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), z: this.mapView.z }; } }, { passive: true });
      cv.addEventListener('touchmove', (e) => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); this.mapView.z = clamp(pinch.z * d / pinch.d, 0.5 * dpr, 6 * dpr); this._mapDraw(); } }, { passive: true });
      cv.addEventListener('touchend', () => { pinch = null; });
    }
    this._mapDraw = draw;
  }
}

function pin(ctx, x, y, color, z) {
  const s = 1 / Math.sqrt(z);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * 2, s * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(1, 1, 5, 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-8, -10, -6, -18, 0, -18); ctx.bezierCurveTo(6, -18, 8, -10, 0, 0); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -12, 2.5, 0, 7); ctx.fill();
  ctx.restore();
}

export function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
