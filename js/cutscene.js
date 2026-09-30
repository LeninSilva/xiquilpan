// Scripted sequences: intro, the night on the Cerro, the time skips, La Noche del Añil.
import { TILE, clamp, lerp } from './util.js';
import { HILOS_GOAL } from './quests.js';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// --- the visitor -------------------------------------------------------------
export function drawGray(ctx, t = 0, lookUp = 0) {
  ctx.fillStyle = 'rgba(20,20,35,0.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 1.8, 0, 0, 7); ctx.fill();
  const skin = '#aab3b8', dark = '#7e888d';
  // legs & thin body
  ctx.fillStyle = dark; ctx.fillRect(-1.6, -9, 1.2, 9); ctx.fillRect(0.5, -9, 1.2, 9);
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0, -13, 2.6, 5, 0, 0, 7); ctx.fill();
  // long arms with three long fingers
  ctx.strokeStyle = skin; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-2.2, -16); ctx.quadraticCurveTo(-4, -11, -3.6, -6); ctx.moveTo(2.2, -16); ctx.quadraticCurveTo(4, -11, 3.6 + Math.sin(t) * 0.3, -6); ctx.stroke();
  ctx.lineWidth = 0.35;
  for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(s * 3.6, -6); ctx.lineTo(s * 3.6 + i * 0.5, -4.2); ctx.stroke(); }
  // indigo stain on the right hand
  ctx.fillStyle = 'rgba(70,60,200,0.8)'; ctx.beginPath(); ctx.arc(3.6, -5.8, 0.7, 0, 7); ctx.fill();
  ctx.lineCap = 'butt';
  // big head
  const hy = -24 - lookUp;
  const g = ctx.createRadialGradient(-2, hy - 3, 1, 0, hy, 9);
  g.addColorStop(0, '#d3dade'); g.addColorStop(1, '#8e989d');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, hy, 6.4, 7.4, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-3, hy + 5); ctx.quadraticCurveTo(0, hy + 10, 3, hy + 5); ctx.fill();
  // almond eyes
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * 2.6, hy + 1); ctx.rotate(s * 0.45);
    ctx.fillStyle = '#0b0b12'; ctx.beginPath(); ctx.ellipse(0, 0, 2.2, 1.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(120,140,255,0.55)'; ctx.beginPath(); ctx.ellipse(-0.6, -0.3, 0.6, 0.3, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = '#6d777c'; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.moveTo(-0.6, hy + 6); ctx.lineTo(0.6, hy + 6); ctx.stroke();
}

export function drawGrayPortrait(ctx, S, t = 0) {
  ctx.save();
  const g0 = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S);
  g0.addColorStop(0, '#2a2a5a'); g0.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = g0; ctx.fillRect(0, 0, S, S);
  ctx.translate(S / 2, S * 0.58); const k = S / 22; ctx.scale(k, k);
  const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 10);
  g.addColorStop(0, '#d3dade'); g.addColorStop(1, '#8e989d');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 8, 9.5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, 6); ctx.quadraticCurveTo(0, 13, 4, 6); ctx.fill();
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * 3.3, 1.2); ctx.rotate(s * 0.45);
    ctx.fillStyle = '#07070d'; ctx.beginPath(); ctx.ellipse(0, 0, 2.9, 1.6, 0, 0, 7); ctx.fill();
    // a tiny reflection of the three men in the eye
    ctx.fillStyle = 'rgba(255,190,120,0.8)'; for (let i = -1; i <= 1; i++) ctx.fillRect(i * 0.7 - 0.12, -0.2, 0.24, 0.6);
    ctx.fillStyle = 'rgba(150,170,255,0.6)'; ctx.beginPath(); ctx.ellipse(-0.9, -0.5, 0.8, 0.35, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
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
  constructor(map, x, y) { this.map = map; this.x = x; this.y = y; this.t = 0; this.alpha = 0; this.solid = false; this.lookUp = 0; }
  update(dt) { this.t += dt; }
  draw(ctx, game) {
    ctx.save(); ctx.globalAlpha = this.alpha; ctx.translate(this.x, this.y); ctx.scale(1.25, 1.25);
    drawGray(ctx, this.t, this.lookUp);
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
  game.ui.banner('¿Han visto a mi abuelo?', 'Capítulo I');
  await wait(1800);
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
    await d.narrate('Pistas: habla con la gente. Toca “¿No ha visto a mi abuelo?” en las conversaciones. Abre el mapa con el botón ☰.');
  });
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
  P.x = 40.5 * TILE; P.y = 16.4 * TILE; P.dir = 1; P.pose = 'sit';
  if (miguel) { miguel.x = 39 * TILE; miguel.y = 15.2 * TILE; miguel.dir = 1; miguel.behaviour = 'stand'; miguel.pose = null; }
  if (tono) { tono.x = 44 * TILE; tono.y = 15.4 * TILE; tono.dir = 1; tono.behaviour = 'stand'; tono.pose = null; }
  game.camera.x = 42 * TILE; game.camera.y = 12 * TILE; game.camLock = true;
  await ui.fade(false, false, 1200);
  await d.scene(async d => { await d.narrate('Casi medianoche. La fogata truena. Abajo, las luces de Jiquilpan, de Sahuayo y, a lo lejos, el brillo de la Ciénega.'); });
  const sky = new SkyLights(game.map, 44 * TILE, 5 * TILE);
  game.effects.push(sky);
  game.sfx('ufo');
  for (let i = 0; i <= 30; i++) { sky.alpha = i / 30; await wait(60); }
  await d.scene(async d => {
    if (tono) await d.say(tono, '¡Ahí están! ¡Miguel, ahí están otra vez!');
    if (miguel) await d.say(miguel, 'No son estrellas, mijo. Míralas: se mueven como si nos estuvieran buscando.');
  });
  // they descend and land in the llano behind the cross
  sky.landX = 48 * TILE; sky.landY = 8 * TILE;
  for (let i = 0; i <= 60; i++) { sky.land = i / 60; sky.x = lerp(44 * TILE, sky.landX, i / 60); sky.y = lerp(5 * TILE, sky.landY + 120, i / 60); await wait(40); }
  sky.land = 1; sky.x = sky.landX; sky.y = sky.landY;
  game.dynamicLights = [{ x: sky.landX, y: sky.landY, r: 200, color: '#9fb4ff', power: 0.9 }];
  P.pose = null; P.dir = 1;
  const gray = new GrayEntity(game.map, sky.landX, sky.landY);
  game.effects.push(gray);
  for (let i = 0; i <= 20; i++) { gray.alpha = i / 20; await wait(50); }
  // it walks toward the camp
  for (let i = 0; i <= 50; i++) { gray.x = lerp(sky.landX, 43.5 * TILE, i / 50); gray.y = lerp(sky.landY, 12.6 * TILE, i / 50); await wait(40); }
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
    await d.narrate('El ser camina entre ustedes sin prisa. Es pequeño, gris, delgado. Se detiene frente a Don Toño y lo mira a los ojos. Luego frente a tu abuelo. Luego frente a ti.');
    const visitor = { name: '…', role: 'el visitante', look: { alien: true } };
    await d.say(visitor, '(No mueve la boca. Su voz suena dentro de tu cabeza, con la voz de tu propia abuela, de tu maestra de primaria, de todos a la vez.)');
    await d.say(visitor, 'Nosotros también teníamos una plaza. Y un kiosco. Y viernes.');
    await d.say(visitor, 'Pusimos una luz pequeña entre cada rostro. Nuestros ojos crecieron para mirarla. Nuestras bocas se hicieron pequeñas, porque ya no hablábamos.');
    await d.say(visitor, 'Díganles que apaguen la luz pequeña. Que se miren. Que se escuchen. Antes de que olviden cómo.');
    await d.narrate('El ser toma la mano derecha de tu abuelo. Donde lo toca queda una mancha azul, profunda, del color del añil. Luego toma la tuya.');
  });
  game.flags.mancha = true;
  game.player.look.stain = true;
  if (miguel) miguel.look.stain = true;
  ui.toast('Tienes una mancha color añil en la mano. Brilla cuando escuchas de verdad.', 'soul');
  game.sfx('hilo');
  await wait(1200);
  await ui.fade(true, true, 1400);
  game.effects = game.effects.filter(e => e !== sky && e !== gray);
  game.dynamicLights = [];
  game.frozen = false;
  // five months later
  game.clock.addDays(151);
  game.clock.advanceTo(6.6);
  game.env.override = null;
  game.state.act = 3; game.quests.set('main', 30);
  if (tono) tono.look.holds = null;
  P.x = 41 * TILE; P.y = 17 * TILE; P.dir = 0; game.camLock = false;
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
  P.x = 125.5 * TILE; P.y = 107.8 * TILE; P.dir = 0;
  game.camera.x = 125.5 * TILE; game.camera.y = 103 * TILE; game.camLock = true;
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
  const sky = new SkyLights(game.map, 126 * TILE, 88 * TILE);
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
