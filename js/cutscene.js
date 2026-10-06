// Scripted sequences: intro, the night on the Cerro, the time skips, La Noche del Añil.
import { TILE, clamp, lerp } from './util.js';
import { HILOS_GOAL } from './quests.js';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// --- the visitors -------------------------------------------------------------
// Drawn after what the children of the Ariel School (Ruwa, Zimbabwe, 1994) described: small beings
// in tight, shiny black suits, thin bodies and long thin necks, big heads and enormous black eyes
// that wrap around the face; one of them with long black hair. They do not speak with the mouth.
export function drawGray(ctx, t = 0, lookUp = 0, hair = false) {
  const sg = ctx.createRadialGradient(0, 0, 0.3, 0, 0, 6); sg.addColorStop(0, 'rgba(10,10,20,0.45)'); sg.addColorStop(1, 'rgba(10,10,20,0)');
  ctx.save(); ctx.scale(1, 0.32); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill(); ctx.restore();
  const suit = (x0, y0, x1, y1, w) => { const g = ctx.createLinearGradient(x0 - w, 0, x0 + w, 0); g.addColorStop(0, '#3a3d4a'); g.addColorStop(0.4, '#14151b'); g.addColorStop(1, '#050507'); ctx.strokeStyle = g; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  // thin legs and body in the black suit, with a sheen down the left side
  suit(-0.9, -8.5, -1, -0.6, 1.3); suit(0.9, -8.5, 1, -0.6, 1.3);
  ctx.fillStyle = '#0d0e13'; ctx.beginPath(); ctx.ellipse(0, -12.4, 2.4, 4.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(160,170,210,0.28)'; ctx.beginPath(); ctx.ellipse(-1.2, -13, 0.5, 3.4, 0.1, 0, 7); ctx.fill();
  // long arms; three long fingers
  suit(-2, -15.6, -3.2, -10.2, 0.9); suit(2, -15.6, 3.3 + Math.sin(t) * 0.2, -10.2, 0.9);
  ctx.strokeStyle = '#aeb6bb'; ctx.lineWidth = 0.7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3.2, -10.2); ctx.lineTo(-3.4, -7); ctx.moveTo(3.3, -10.2); ctx.lineTo(3.5, -7); ctx.stroke();
  ctx.lineWidth = 0.28;
  for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(s * 3.45, -7); ctx.lineTo(s * 3.45 + i * 0.45, -5.2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(70,60,200,0.8)'; ctx.beginPath(); ctx.arc(3.5, -6.8, 0.6, 0, 7); ctx.fill(); // the añil on its fingertips
  ctx.lineCap = 'butt';
  // the long thin neck
  ctx.fillStyle = '#9aa3a8'; ctx.fillRect(-0.55, -20.5, 1.1, 4.2);
  // the head: a large inverted pear, pale grey
  const hy = -25 - lookUp;
  if (hair) { ctx.fillStyle = '#0a0a0e'; ctx.beginPath(); ctx.ellipse(0, hy + 2.5, 6.4, 8.6, 0, 0, 7); ctx.fill(); }
  const g = ctx.createRadialGradient(-2, hy - 3, 0.8, 0, hy, 8.5);
  g.addColorStop(0, '#d9dfe2'); g.addColorStop(0.6, '#aab3b8'); g.addColorStop(1, '#7c868b');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-5.6, hy - 1); ctx.bezierCurveTo(-6.4, hy - 9, 6.4, hy - 9, 5.6, hy - 1); ctx.bezierCurveTo(5, hy + 4, 1.6, hy + 6.6, 0, hy + 6.8); ctx.bezierCurveTo(-1.6, hy + 6.6, -5, hy + 4, -5.6, hy - 1); ctx.fill();
  if (hair) { ctx.fillStyle = '#0a0a0e'; ctx.beginPath(); ctx.moveTo(-5.8, hy - 1); ctx.bezierCurveTo(-6.6, hy - 9.6, 6.6, hy - 9.6, 5.8, hy - 1); ctx.lineTo(4.4, hy - 4.2); ctx.quadraticCurveTo(0, hy - 7, -4.4, hy - 4.2); ctx.closePath(); ctx.fill(); }
  // the enormous black eyes, slanted, wrapping toward the sides
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * 2.5, hy + 0.6); ctx.rotate(s * 0.5);
    const eg = ctx.createRadialGradient(-0.6, -0.4, 0.1, 0, 0, 2.6); eg.addColorStop(0, '#20202c'); eg.addColorStop(1, '#020203');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.35, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(170,190,255,0.5)'; ctx.beginPath(); ctx.ellipse(-0.9, -0.45, 0.7, 0.28, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#6d777c'; ctx.beginPath(); ctx.arc(-0.35, hy + 3.4, 0.14, 0, 7); ctx.arc(0.35, hy + 3.4, 0.14, 0, 7); ctx.fill();
  ctx.strokeStyle = '#6d777c'; ctx.lineWidth = 0.22; ctx.beginPath(); ctx.moveTo(-0.7, hy + 5); ctx.lineTo(0.7, hy + 5); ctx.stroke();
}

export function drawGrayPortrait(ctx, S, t = 0) {
  ctx.save();
  const g0 = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S);
  g0.addColorStop(0, '#2a2a5a'); g0.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = g0; ctx.fillRect(0, 0, S, S);
  ctx.translate(S / 2, S * 0.56); const k = S / 22; ctx.scale(k, k);
  ctx.fillStyle = '#0d0e13'; ctx.beginPath(); ctx.ellipse(0, 15, 6, 4, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#9aa3a8'; ctx.fillRect(-0.8, 6, 1.6, 6);
  const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 10);
  g.addColorStop(0, '#d9dfe2'); g.addColorStop(0.6, '#aab3b8'); g.addColorStop(1, '#7c868b');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-7.4, -1); ctx.bezierCurveTo(-8.4, -12, 8.4, -12, 7.4, -1); ctx.bezierCurveTo(6.6, 5, 2.2, 8.6, 0, 8.8); ctx.bezierCurveTo(-2.2, 8.6, -6.6, 5, -7.4, -1); ctx.fill();
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * 3.3, 0.8); ctx.rotate(s * 0.5);
    ctx.fillStyle = '#030305'; ctx.beginPath(); ctx.ellipse(0, 0, 3.5, 1.8, 0, 0, 7); ctx.fill();
    // in its eyes: a world on fire, and three small men by a fire
    const pulse = (Math.sin(t * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(255,${120 + pulse * 60},60,${0.35 + pulse * 0.3})`; ctx.beginPath(); ctx.ellipse(0.6, 0.5, 1.6, 0.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,190,120,0.8)'; for (let i = -1; i <= 1; i++) ctx.fillRect(i * 0.7 - 0.12, -0.3, 0.24, 0.6);
    ctx.fillStyle = 'rgba(150,170,255,0.6)'; ctx.beginPath(); ctx.ellipse(-1.2, -0.6, 1, 0.35, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = '#6d777c'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(-0.9, 6.2); ctx.lineTo(0.9, 6.2); ctx.stroke();
  ctx.restore();
}

// --- the vision they put in your head: a painted sequence, full screen ---------------------------
export function playVision(ui) {
  return new Promise(resolve => {
    const el = document.createElement('div'); el.className = 'vision';
    const cv = document.createElement('canvas'); el.appendChild(cv);
    const cap = document.createElement('div'); cap.className = 'vision-cap'; el.appendChild(cap);
    document.body.appendChild(el);
    const W = cv.width = Math.min(1200, innerWidth * (devicePixelRatio || 1)), H = cv.height = Math.min(1200, innerHeight * (devicePixelRatio || 1));
    const ctx = cv.getContext('2d');
    const scenes = [
      { d: 7, cap: 'Ves la Tierra desde muy alto. Toda está encendida: millones de luces pequeñas, una frente a cada rostro.' },
      { d: 7, cap: 'Los rostros se inclinan hacia las luces. Nadie mira al de al lado. Los ojos crecen; las bocas se achican.' },
      { d: 8, cap: 'Las fábricas no duermen. Arden los bosques. La Ciénega se seca y la laguna se vuelve polvo.' },
      { d: 7, cap: 'La plaza de Jiquilpan, vacía un viernes. El kiosco oxidado. Las jacarandas, secas. Nadie se acuerda de nadie.' },
      { d: 8, cap: '“No tiene que ser así”, sientes. Y ves la plaza llena: gente que se mira, que se escucha, que se toma de la mano.' },
    ];
    const t0 = performance.now();
    const R = (i) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
    const frame = (now) => {
      const t = (now - t0) / 1000;
      let acc = 0, idx = 0; for (; idx < scenes.length; idx++) { if (t < acc + scenes[idx].d) break; acc += scenes[idx].d; }
      if (idx >= scenes.length) { el.classList.add('out'); setTimeout(() => { el.remove(); resolve(); }, 900); return; }
      const lt = t - acc, sc = scenes[idx], fade = Math.min(1, lt / 1.2, (sc.d - lt) / 1.2);
      if (cap.dataset.i !== String(idx)) { cap.dataset.i = idx; cap.textContent = sc.cap; }
      ctx.globalAlpha = 1; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, fade);
      const cx = W / 2, cy = H / 2, m = Math.min(W, H);
      if (idx === 0) { // the earth, covered in small cold lights
        const g = ctx.createRadialGradient(cx - m * 0.1, cy - m * 0.1, m * 0.05, cx, cy, m * 0.36); g.addColorStop(0, '#1d3a5a'); g.addColorStop(1, '#060b14');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, m * 0.34, 0, 7); ctx.fill();
        for (let i = 0; i < 900; i++) { const a = R(i) * 6.283, r = Math.sqrt(R(i + 9)) * m * 0.33; const tw = (Math.sin(t * 3 + i) + 1) / 2; ctx.fillStyle = `rgba(150,200,255,${0.3 + tw * 0.6})`; ctx.fillRect(cx + Math.cos(a + t * 0.05) * r, cy + Math.sin(a + t * 0.05) * r * 0.98, 2, 2); }
      } else if (idx === 1) { // faces bent over glowing rectangles, eyes growing
        for (let i = 0; i < 9; i++) {
          const x = (i % 3 + 0.5) * W / 3, y = (Math.floor(i / 3) + 0.5) * H / 3, s = m * 0.11, grow = 1 + lt * 0.08;
          ctx.fillStyle = '#7d8a96'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.75, s, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#05050a'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sx * s * 0.3, y, s * 0.18 * grow, s * 0.1 * grow, sx * 0.4, 0, 7); ctx.fill(); }
          ctx.fillStyle = '#3c4650'; ctx.fillRect(x - s * 0.1 / grow, y + s * 0.5, s * 0.2 / grow, s * 0.03);
          const pg = ctx.createRadialGradient(x, y + s * 1.2, 2, x, y + s * 1.2, s); pg.addColorStop(0, 'rgba(140,200,255,0.9)'); pg.addColorStop(1, 'rgba(140,200,255,0)');
          ctx.fillStyle = pg; ctx.fillRect(x - s, y + s * 0.4, s * 2, s * 1.6);
          ctx.fillStyle = '#cfe8ff'; ctx.fillRect(x - s * 0.22, y + s * 1, s * 0.44, s * 0.6);
        }
      } else if (idx === 2) { // smokestacks, fire, a dried lake
        const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2a0d08'); sky.addColorStop(0.6, '#7a2a10'); sky.addColorStop(1, '#3a2a1a'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 7; i++) { const x = W * (0.1 + i * 0.13), h = H * (0.25 + R(i) * 0.2); ctx.fillStyle = '#140c08'; ctx.fillRect(x, H * 0.62 - h, W * 0.04, h); for (let k = 0; k < 6; k++) { const p = ((t * 0.3 + k / 6 + i * 0.1) % 1); ctx.fillStyle = `rgba(60,50,45,${0.5 * (1 - p)})`; ctx.beginPath(); ctx.arc(x + W * 0.02 + p * 60, H * 0.62 - h - p * H * 0.3, 10 + p * 50, 0, 7); ctx.fill(); } }
        for (let i = 0; i < 40; i++) { const x = R(i + 3) * W, f = (Math.sin(t * 8 + i) + 1) / 2; ctx.fillStyle = `rgba(255,${120 + f * 80},30,0.8)`; ctx.beginPath(); ctx.moveTo(x - 10, H * 0.66); ctx.lineTo(x, H * 0.66 - 20 - f * 30); ctx.lineTo(x + 10, H * 0.66); ctx.fill(); }
        ctx.fillStyle = '#8a7656'; ctx.fillRect(0, H * 0.66, W, H * 0.34);
        ctx.strokeStyle = '#5a4a32'; ctx.lineWidth = 2; for (let i = 0; i < 30; i++) { const x = R(i + 7) * W, y = H * 0.7 + R(i + 8) * H * 0.28; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y + 8); ctx.lineTo(x + 50, y - 4); ctx.stroke(); }
      } else if (idx === 3) { // the empty plaza, the rusted kiosco, dead jacarandas
        ctx.fillStyle = '#2a2830'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#4a4650'; ctx.fillRect(0, H * 0.62, W, H * 0.38);
        ctx.fillStyle = '#6a5040'; ctx.beginPath(); ctx.moveTo(cx - m * 0.2, H * 0.42); ctx.lineTo(cx, H * 0.3); ctx.lineTo(cx + m * 0.2, H * 0.42); ctx.fill();
        ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 3; for (const k of [-0.16, -0.06, 0.06, 0.16]) { ctx.beginPath(); ctx.moveTo(cx + k * m, H * 0.42); ctx.lineTo(cx + k * m, H * 0.6); ctx.stroke(); }
        ctx.fillStyle = '#6a6070'; ctx.fillRect(cx - m * 0.22, H * 0.6, m * 0.44, H * 0.06);
        for (const sx of [0.12, 0.88]) { ctx.strokeStyle = '#3a3030'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W * sx, H * 0.66); ctx.lineTo(W * sx, H * 0.4); ctx.moveTo(W * sx, H * 0.48); ctx.lineTo(W * sx + 40, H * 0.36); ctx.moveTo(W * sx, H * 0.45); ctx.lineTo(W * sx - 35, H * 0.34); ctx.stroke(); }
        for (let i = 0; i < 20; i++) { const x = R(i + 30) * W, y = H * 0.7 + R(i + 31) * H * 0.25; ctx.fillStyle = 'rgba(140,200,255,0.5)'; ctx.fillRect(x, y, 3, 5); } // phones left on the ground
      } else { // the full plaza: people looking at each other, warm light
        const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1b2a5a'); sky.addColorStop(1, '#e8925a'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#d8c6a8'; ctx.fillRect(0, H * 0.62, W, H * 0.38);
        ctx.fillStyle = '#f3efe6'; ctx.fillRect(cx - m * 0.2, H * 0.52, m * 0.4, H * 0.1); ctx.fillStyle = '#cf4a2c'; for (const k of [-0.2, -0.07, 0.06, 0.19]) ctx.fillRect(cx + k * m, H * 0.52, m * 0.02, H * 0.1);
        ctx.fillStyle = '#7d868c'; ctx.beginPath(); ctx.moveTo(cx - m * 0.24, H * 0.42); ctx.lineTo(cx, H * 0.3); ctx.lineTo(cx + m * 0.24, H * 0.42); ctx.fill();
        for (const sx of [0.1, 0.9]) { ctx.fillStyle = '#8e6cc4'; ctx.beginPath(); ctx.arc(W * sx, H * 0.42, m * 0.12, 0, 7); ctx.fill(); }
        for (let i = 0; i < 26; i++) { const x = (i + 0.5) / 26 * W, y = H * (0.7 + (i % 3) * 0.08), s = m * 0.03; ctx.fillStyle = ['#c8463a', '#2e78c4', '#2f9356', '#f2c230', '#efe8da'][i % 5]; ctx.fillRect(x - s * 0.6, y - s * 2, s * 1.2, s * 2); ctx.fillStyle = '#b9835b'; ctx.beginPath(); ctx.arc(x, y - s * 2.6, s * 0.6, 0, 7); ctx.fill(); if (i % 2 === 0) { ctx.strokeStyle = '#b9835b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + s * 0.6, y - s * 1.4); ctx.lineTo(x + W / 26 - s * 0.6, y - s * 1.4); ctx.stroke(); } }
        const glow = ctx.createRadialGradient(cx, H * 0.55, 10, cx, H * 0.55, m * 0.6); glow.addColorStop(0, 'rgba(255,220,160,0.35)'); glow.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

// --- sky effects ------------------------------------------------------------------
class SkyLights {
  constructor(map, x, y) { this.map = map; this.x = x; this.y = y; this.t = 0; this.alpha = 0; this.lights = [0, 1, 2].map(i => ({ ph: i * 2.1, r: 30 + i * 12 })); this.land = 0; this.landX = x; this.landY = y; }
  update(dt) { this.t += dt; }
  draw(ctx, game) {
    const a = this.alpha; if (a <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      const lx = this.x + Math.cos(this.t * 0.7 + l.ph) * l.r * (1 - this.land), ly = this.y - 120 * (1 - this.land) + Math.sin(this.t * 0.9 + l.ph) * 18 * (1 - this.land);
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 26);
      g.addColorStop(0, `rgba(190,220,255,${0.95 * a})`); g.addColorStop(0.3, `rgba(90,110,255,${0.5 * a})`); g.addColorStop(1, 'rgba(40,40,160,0)');
      ctx.fillStyle = g; ctx.fillRect(lx - 26, ly - 26, 52, 52);
    }
    ctx.restore();
    if (this.land > 0.95) this.drawCraft(ctx, game);
  }
  drawCraft(ctx, game) {
    const x = this.landX, y = this.landY, t = this.t;
    ctx.save(); ctx.translate(x, y);
    // beam
    const g = ctx.createLinearGradient(0, -60, 0, 0);
    g.addColorStop(0, 'rgba(150,180,255,0.0)'); g.addColorStop(1, 'rgba(150,180,255,0.35)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(10, -40); ctx.lineTo(26, 0); ctx.lineTo(-26, 0); ctx.fill();
    ctx.fillStyle = 'rgba(170,200,255,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 28, 8, 0, 0, 7); ctx.fill();
    // hull hovering
    const hy = -44 + Math.sin(t * 2) * 1.5;
    ctx.fillStyle = '#4b4f5c'; ctx.beginPath(); ctx.ellipse(0, hy, 34, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6d7282'; ctx.beginPath(); ctx.ellipse(0, hy - 2, 34, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(160,200,255,0.8)'; ctx.beginPath(); ctx.ellipse(0, hy - 6, 12, 7, 0, Math.PI, 0); ctx.fill();
    for (let i = 0; i < 8; i++) { const a = t * 2 + i * 0.785; const lx = Math.cos(a) * 30; ctx.fillStyle = Math.sin(a) > 0 ? 'rgba(120,170,255,0.95)' : 'rgba(120,170,255,0.3)'; ctx.beginPath(); ctx.arc(lx, hy + 1 + Math.sin(a) * 3, 1.6, 0, 7); ctx.fill(); }
    ctx.restore();
  }
}

class GrayEntity {
  constructor(map, x, y, hair) { this.map = map; this.x = x; this.y = y; this.t = 0; this.alpha = 0; this.solid = false; this.lookUp = 0; this.hair = hair; }
  update(dt) { this.t += dt; }
  draw(ctx, game) {
    ctx.save(); ctx.globalAlpha = this.alpha; ctx.translate(this.x, this.y); ctx.scale(1.25, 1.25);
    drawGray(ctx, this.t, this.lookUp, this.hair);
    ctx.restore();
  }
}

// --- sequences ----------------------------------------------------------------------
export async function runCutscene(game, name) {
  game.cutsceneActive = name;
  game.input.enabled = false;
  try {
    if (name === 'intro') await intro(game);
    if (name === 'ufo') await ufo(game);
    if (name === 'timeskip') await timeskip(game);
    if (name === 'anil') await anil(game);
  } catch (e) { console.error(e); }
  game.cutsceneActive = null; game.frozen = false;
  game.ui.cinema(false);
  game.input.enabled = true;
  game.save();
}

async function intro(game) {
  const d = game.dialog;
  const abuela = () => game.npcs.named.get('abuela') || { name: 'Abuela Chayo', role: 'tu abuela' };
  game.ui.cinema(true);
  game.ui.banner('¿Han visto a mi abuelo?', 'Capítulo I');
  await wait(3600);
  await d.scene(async d => {
    await d.narrate('Jiquilpan de Juárez, Michoacán. Jueves 1 de octubre. Todavía huele a lluvia de anoche.');
    await d.say(abuela(), `¡${game.state.name}! Qué bueno que llegaste, mijo. Siéntate. No, no te sientes. Escúchame.`);
    await d.say(abuela(), 'Tu abuelo y tu tío Toño se fueron el lunes a acampar al Cerro de San Francisco. Dijeron que bajaban el miércoles. Hoy es jueves y no contestan el celular.');
    await d.say(abuela(), 'Tu abuelo anda con eso de las luces otra vez. Que se ven sobre el cerro, que “ahora sí van a bajar”. ¡A sus ochenta y un años!');
    const c = await d.choose([
      { text: 'Yo los encuentro, abuela. Te lo prometo.', tag: 'kind', value: 'k' },
      { text: '¿Luces? El abuelo ya está chocheando…', tag: 'mean', value: 'm' },
    ], abuela());
    if (c.value === 'm') { game.addStat('corazon', -3); await d.say(abuela(), 'No le faltes el respeto a tu abuelo. Chocheando o no, es tu sangre. Ándale, ve.'); }
    else { game.addStat('corazon', 3); await d.say(abuela(), 'Dios te bendiga, mijo.'); }
    await d.say(abuela(), 'Pregunta en el pueblo. Tu abuelo siempre toma café con Rosita en la plaza, y los taxistas ven pasar a todo mundo. Toño… ese seguro fue al Chamacuero por su mezcal.');
    await d.narrate('Habla con la gente: en cada plática escoges qué decir, y eso va formando quién eres. Pregunta “¿No ha visto a mi abuelo?”. En el menú ☰ están el mapa, tus misiones, la gente que conoces y tus propiedades.');
  });
  game.ui.cinema(false);
  game.quests.set('main', 1);
}

async function ufo(game) {
  const d = game.dialog, ui = game.ui;
  const miguel = game.npcs.named.get('miguel'), tono = game.npcs.named.get('tono');
  ui.cinema(true);
  await ui.fade(true, false, 900);
  game.clock.advanceTo(23.5);
  game.env.override = { rain: 0, cloud: 0 };
  // place everyone around the fire
  const P = game.player;
  P.x = 40.5 * TILE; P.y = 121.4 * TILE; P.dir = 1; P.pose = 'sit';
  if (miguel) { miguel.x = 39 * TILE; miguel.y = 120.2 * TILE; miguel.dir = 1; miguel.behaviour = 'stand'; miguel.pose = null; }
  if (tono) { tono.x = 44 * TILE; tono.y = 120.4 * TILE; tono.dir = 1; tono.behaviour = 'stand'; tono.pose = null; }
  game.camera.x = 42 * TILE; game.camera.y = 117 * TILE; game.camLock = true;
  await ui.fade(false, false, 1200);
  await d.scene(async d => { await d.narrate('Casi medianoche. La fogata truena. Abajo, las luces de Jiquilpan, de Sahuayo y, a lo lejos, el brillo de la Ciénega.'); });
  const sky = new SkyLights(game.map, 44 * TILE, 110 * TILE);
  game.effects.push(sky);
  game.sfx('ufo');
  for (let i = 0; i <= 30; i++) { sky.alpha = i / 30; await wait(60); }
  await d.scene(async d => {
    if (tono) await d.say(tono, '¡Ahí están! ¡Miguel, ahí están otra vez!');
    if (miguel) await d.say(miguel, 'No son estrellas, mijo. Míralas: se mueven como si nos estuvieran buscando.');
  });
  // they descend and land in the llano behind the cross
  sky.landX = 48 * TILE; sky.landY = 112 * TILE;
  for (let i = 0; i <= 60; i++) { sky.land = i / 60; sky.x = lerp(44 * TILE, sky.landX, i / 60); sky.y = lerp(110 * TILE, sky.landY + 120, i / 60); await wait(40); }
  sky.land = 1; sky.x = sky.landX; sky.y = sky.landY;
  game.dynamicLights = [{ x: sky.landX, y: sky.landY, r: 200, color: '#9fb4ff', power: 0.9 }];
  P.pose = null; P.dir = 1;
  const gray = new GrayEntity(game.map, sky.landX, sky.landY);
  const gray2 = new GrayEntity(game.map, sky.landX + 26, sky.landY - 4, true); // the second one, with long black hair, stays by the craft
  game.effects.push(gray, gray2);
  for (let i = 0; i <= 20; i++) { gray.alpha = i / 20; gray2.alpha = i / 20; await wait(50); }
  // it walks toward the camp
  for (let i = 0; i <= 50; i++) { gray.x = lerp(sky.landX, 43.5 * TILE, i / 50); gray.y = lerp(sky.landY, 117.6 * TILE, i / 50); await wait(40); }
  if (tono) { tono.look.holds = 'rifle'; tono.dir = 1; }
  await d.scene(async d => {
    if (tono) await d.say(tono, '¡Quieto ahí, compadre! ¡Un paso más y te trueno!');
    if (miguel) await d.say(miguel, '¡Toño, no!');
  });
  // everything freezes
  game.frozen = true; game.sfx('freeze');
  await wait(400);
  await d.scene(async d => {
    await d.narrate('Y entonces todo se detiene. El fuego queda quieto, como pintado. El viento no sopla. Don Toño es una estatua con el dedo en el gatillo. Tú no puedes mover ni los párpados.');
    await d.narrate('Son dos. Pequeños, del tamaño de un niño. Un traje negro, ceñido, que brilla con la luz de la nave como piel de pez. El cuello largo y delgadísimo. La cabeza grande, gris, y unos ojos negros enormes que le dan la vuelta a la cara. El otro, junto a la nave, tiene el pelo negro y largo, y no se mueve.');
    await d.narrate('El primero camina entre ustedes sin prisa. Se detiene frente a Don Toño. Luego frente a tu abuelo. Luego frente a ti, y te mira a los ojos. No puedes dejar de mirar esos ojos: son como asomarse a un pozo sin fondo.');
    const visitor = { name: '…', role: 'el visitante', look: { alien: true } };
    await d.say(visitor, '(No mueve la boca. Lo que dice no son palabras: son imágenes que se te meten en la cabeza, y una voz que suena como la de tu abuela, la de tu maestra de primaria, la de todos a la vez.)');
  });
  await playVision(ui);
  await d.scene(async d => {
    const visitor = { name: '…', role: 'el visitante', look: { alien: true } };
    await d.say(visitor, 'Nosotros también teníamos una plaza. Y un kiosco. Y viernes.');
    await d.say(visitor, 'Pusimos una luz pequeña entre cada rostro. Nuestros ojos crecieron para mirarla. Nuestras bocas se hicieron pequeñas, porque ya no hablábamos. Y mientras mirábamos la luz, se nos secó el agua y se nos quemó la tierra.');
    await d.say(visitor, 'Cuiden su tierra. Apaguen la luz pequeña. Mírense. Escúchense. Tengan compasión unos de otros. Antes de que olviden cómo.');
    await d.narrate('El ser toma la mano derecha de tu abuelo. Donde lo toca queda una mancha azul, profunda, del color del añil. Luego toma la tuya.');
  });
  game.flags.mancha = true;
  game.player.look.stain = true;
  if (miguel) miguel.look.stain = true;
  ui.toast('Tienes una mancha color añil en la mano. Brilla cuando escuchas de verdad.', 'soul');
  game.sfx('hilo');
  await wait(1200);
  await ui.fade(true, true, 1400);
  game.effects = game.effects.filter(e => e !== sky && e !== gray && e !== gray2);
  game.dynamicLights = [];
  game.frozen = false;
  // five months later
  game.clock.addDays(151);
  game.clock.advanceTo(6.6);
  game.env.override = null;
  game.state.act = 3; game.quests.set('main', 30);
  if (tono) tono.look.holds = null;
  P.x = 41 * TILE; P.y = 122.6 * TILE; P.dir = 1; game.camLock = false;
  game.npcs.timer = 0;
  await wait(600);
  await ui.fade(false, true, 1600);
  ui.banner('Cinco meses', 'Capítulo III');
  await d.scene(async d => {
    await d.narrate('Amanece. La fogata está fría, cubierta de ceniza vieja. Las casas de campaña están descoloridas, como si hubieran pasado muchos soles encima.');
    await d.narrate('Tu abuelo y Don Toño ya van bajando por la brecha, sin decir nada. Tu celular no enciende.');
  });
}

async function timeskip(game) {
  const d = game.dialog, ui = game.ui;
  ui.cinema(true);
  await ui.fade(true, false, 1200);
  await d.scene(async d => {
    await d.narrate('Pasó un año. Luego otro.');
    await d.narrate('El video de “los abuelos marcianos” tuvo tres millones de vistas. Luego nadie se acordó.');
    await d.narrate('La cenaduría de la esquina cerró: ahora todo se pide por aplicación. Los viernes, la plaza se vacía antes de las diez.');
    await d.narrate('En las mesas de las micheladas, cada quien mira su pantalla. Los chamacos ya no bailan trompo. Los novios se conocen por fotos. Las abuelas mandan audios desde la otra recámara.');
    await d.narrate('Y la gente empezó, poco a poco, a recordar lo que dijeron aquellos tres.');
  });
  game.clock.addDays(730);
  game.clock.advanceTo(9);
  game.state.act = 4; game.state.era = 'after';
  game.quests.set('main', 40);
  game.npcs.timer = 0; game.npcs.animalsFor = null;
  await ui.fade(false, false, 1400);
  ui.banner('Dos años después', 'Capítulo IV — La Noche del Añil');
  await d.scene(async d => {
    const miguel = game.npcs.named.get('miguel') || { name: 'Don Miguel', role: 'tu abuelo' };
    await d.say(miguel, 'Ahora sí, mijo. Ahora les duele. Se sienten solos rodeados de gente, y no saben por qué.');
    await d.say(miguel, 'Vamos a tejerle al pueblo un rebozo: un hilo por cada persona que escuches de verdad. Y un viernes, en la plaza, lo extendemos. Sin pantallas. Como antes.');
    await d.narrate(`Objetivo: consigue ${HILOS_GOAL} hilos (escucha a la gente sin sacar el celular) y al menos 3 aliados. Luego, un viernes de 8 a 11 de la noche, ve al kiosco.`);
  });
}

async function anil(game) {
  const d = game.dialog, ui = game.ui, f = game.flags;
  ui.cinema(true);
  await ui.fade(true, false, 900);
  const P = game.player;
  P.x = 126 * TILE; P.y = 106.6 * TILE; P.dir = 0;
  game.camera.x = 126 * TILE; game.camera.y = 103 * TILE; game.camLock = true;
  // gather the town around the kiosco
  const extra = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2, r = 5 + (i % 3);
    const w = game.npcs.spawnWalker('stroll', [[125, 104]]);
    if (w) { w.path = null; w.x = (125.5 + Math.cos(a) * r) * TILE; w.y = (104 + Math.sin(a) * r * 0.7) * TILE; w.face(125.5 * TILE, 104 * TILE); w.look.phone = false; w.behaviour = 'stand'; w.expire = game.clock.minutes + 600; extra.push(w); }
  }
  await ui.fade(false, false, 1200);
  await d.scene(async d => {
    if (f.ally_padre) { game.sfx('bell'); await d.narrate('A las ocho en punto, las campanas de San Francisco empiezan a tocar. Como cuando llamaban a todo el pueblo.'); game.sfx('bell'); }
    if (f.ally_palacio) await d.narrate('Las luces del Palacio se apagan. Sólo quedan los faroles de la plaza y la luna sobre el cerro.');
    if (f.ally_karla) await d.narrate('Karla sube su último video: “Este viernes, la plaza sin celulares”. Luego apaga el teléfono delante de todos.');
    if (f.ally_rosita) await d.narrate('Rosita reparte café de olla y pan de nata. Esta vez no cobra.');
    if (f.ally_guero) await d.narrate('Los tres Güeros, el tío, el primo y el bueno, ponen sus trompos juntos, por primera vez.');
    const miguel = game.npcs.named.get('miguel') || { name: 'Don Miguel', role: 'tu abuelo' };
    await d.say(miguel, 'Buenas noches, Jiquilpan. No les vamos a pedir que nos crean. Nomás que se sienten con alguien que no conocen, y le pregunten cómo está. Y que escuchen la respuesta completa.');
    await d.narrate(`Extiendes el rebozo añil sobre el barandal del kiosco. ${game.state.hilos} hilos. Cada uno, el nombre de alguien que te contó algo verdadero: ${game.state.hiloNames.slice(0, 14).join(', ')}${game.state.hiloNames.length > 14 ? '…' : ''}.`);
  });
  // lights over the cerro, seen by everyone
  const sky = new SkyLights(game.map, 126 * TILE, 92 * TILE);
  game.effects.push(sky); game.sfx('ufo');
  for (let i = 0; i <= 40; i++) { sky.alpha = i / 40; await wait(70); }
  const s = game.stats;
  const good = s.corazon >= 30 && game.state.hilos >= HILOS_GOAL;
  const mixed = s.corazon >= 0;
  await d.scene(async d => {
    await d.narrate('Alguien grita y señala al cerro. Tres luces azules se levantan sobre la cruz. Toda la plaza las ve. Nadie saca el celular para grabarlas.');
    if (good) {
      await d.narrate('Las luces no bajan. Se quedan un rato largo, quietas, como mirando. Luego se apagan una por una, despacio, como quien se despide contento.');
      await d.narrate('La plaza no se vacía. Se quedan platicando hasta las tres de la mañana. Don Toño cuenta chistes. Beto baila su trompo. La abuela Chayo llora, pero esta vez de risa.');
      ui.banner('El pueblo que se miró', 'Final');
    } else if (mixed) {
      await d.narrate('Las luces pasan despacio sobre el cerro y se pierden hacia la Ciénega. Mucha gente se queda; otra, al rato, vuelve a sus pantallas.');
      await d.say(game.npcs.named.get('tono') || { name: 'Don Toño' }, 'Ya vendrán más viernes, sobrino. Un pueblo no se voltea en una noche.');
      ui.banner('La luz pequeña', 'Final');
    } else {
      await d.narrate('Las luces parpadean una sola vez y se apagan. La gente te mira de reojo; nadie olvida cómo los trataste. Poco a poco, la plaza se vacía.');
      await d.say(game.npcs.named.get('miguel') || { name: 'Don Miguel' }, 'El mensaje no era para ellos nada más, mijo. También era para ti.');
      ui.banner('El eco', 'Final');
    }
    await d.narrate('Gracias por jugar Xiquilpan: Las Luces del Cerro. El pueblo sigue ahí: puedes seguir recorriéndolo, platicando y descubriendo a su gente.');
  });
  game.effects = game.effects.filter(e => e !== sky);
  game.state.act = 5; game.state.ending = good ? 'bueno' : mixed ? 'mixto' : 'eco';
  game.quests.set('main', 50);
  game.camLock = false;
  for (const w of extra) w.expire = game.clock.minutes + 30;
}
