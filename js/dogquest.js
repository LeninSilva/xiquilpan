// Dogs you can befriend, and Claudia Azul's errand: justice for the dog hanged in Abadiano.
import { pick } from './util.js';
import { SIDE } from './quests.js';
import { NAMED } from './data/npcs.js';
import { DOG_NAMES } from './dogs.js';
import { playPelea } from './minigames.js';

const R = Math.random;
const FOODS = ['hueso', 'croquetas', 'pan', 'churros'];

export function dogInteract(game, dog) {
  return game.dialog.scene(async d => {
    const st = game.state;
    if (dog.companion) {
      const c = await d.choose([{ text: `Acariciar a ${dog.name}`, value: 'pet', tag: 'kind' }, ...(FOODS.some(f => game.hasItem(f)) ? [{ text: 'Darle algo de comer', value: 'feed', tag: 'kind' }] : []), { text: `Decirle a ${dog.name} que se quede en casa de la abuela`, value: 'home' }, { text: 'Nada', value: null }]);
      if (c.value === 'pet') { dog.happyT = 5; await d.narrate(pick(R, [`${dog.name} se tira panza arriba en medio de la banqueta. La gente que pasa se ríe.`, `${dog.name} te lame la mano y luego estornuda. Así dice “te quiero”.`, `Le rascas detrás de la oreja. ${dog.name} cierra los ojos como si estuviera en misa.`])); }
      if (c.value === 'feed') { const f = FOODS.find(x => game.hasItem(x)); game.takeItem(f); dog.happyT = 6; dog.state = 'eat'; dog.timer = 5; await d.narrate(`${dog.name} se lo come en dos mordidas y te mira como preguntando si hay más.`); game.addStat('corazon', 1); }
      if (c.value === 'home') { st.dog = null; dog.dead = true; game.npcs.animals = game.npcs.animals.filter(a => a !== dog); game.npcs.remove(dog); await d.narrate(`${dog.name} se va trotando hacia la casa de la abuela. Ahí te espera; cuando quieras, vuelves por él.`); st.dogHome = true; }
      return;
    }
    st.dogAff = st.dogAff || {};
    const aff = () => dog.affinity;
    const desc = dog.limp ? 'Un perro flaco que cojea de una pata.' : pick(R, ['Un perro callejero, de los que duermen en la plaza.', 'Un perro de color canela, con las costillas marcadas y la cola inquieta.', 'Un perro del mercado: conoce a todos los carniceros por su nombre.']);
    await d.narrate(aff() >= 3 ? 'El perro te reconoce y viene meneando la cola.' : desc);
    const opts = [{ text: 'Acariciarlo con calma', value: 'pet', tag: 'kind' }];
    if (FOODS.some(f => game.hasItem(f))) opts.push({ text: 'Darle de comer', value: 'feed', tag: 'kind' });
    if (aff() >= 4 && dog.fedByPlayer && !st.dog) opts.push({ text: 'Llevártelo contigo', value: 'adopt', tag: 'honest' });
    if (st.dogHome && !st.dog) opts.push({ text: 'Ir por tu perro a casa de la abuela', value: 'fetch' });
    opts.push({ text: 'Dejarlo en paz', value: null });
    const c = await d.choose(opts);
    if (c.value === 'pet') {
      if (aff() < 1 && R() < 0.4) { await d.narrate('Se echa para atrás con la cola entre las patas. Alguien le ha pegado antes. Hay que tenerle paciencia.'); dog.affinity += 0.5; }
      else { await d.narrate('Se deja acariciar. Tiene el pelo áspero de polvo y sol, y el corazón le late rapidito.'); dog.affinity += 1; dog.happyT = 4; }
      game.addStat('corazon', 1);
    }
    if (c.value === 'feed') {
      const f = FOODS.find(x => game.hasItem(x)); game.takeItem(f);
      dog.affinity += 2; dog.fedByPlayer = true; dog.happyT = 6; dog.state = 'eat'; dog.timer = 5;
      await d.narrate(f === 'hueso' ? 'Agarra el hueso con cuidado, como si no lo creyera, y se echa a roerlo a tus pies.' : 'Se lo come todo y se queda sentado frente a ti, esperando.');
      game.addStat('corazon', 2);
    }
    if (c.value === 'adopt') {
      const n = await d.choose(DOG_NAMES.slice(0, 6).map(x => ({ text: `Llamarlo “${x}”`, value: x })));
      st.dog = { name: n.value, coat: [dog.color, dog.spot, dog.floppy] };
      dog.companion = true; dog.name = n.value; dog.leader = null; dog.def = { id: 'mi_perro', name: n.value, crowd: true, dog: true };
      game.ui.toast(`🐕 ${n.value} ahora te sigue a todas partes. Te avisa cuando huele algo.`, 'good'); game.sfx('quest');
      await d.narrate(`${n.value} ladra una vez, como diciendo “ya era hora”, y se pone a caminar a tu lado.`);
      game.addStat('corazon', 4);
    }
    if (c.value === 'fetch') { st.dog = st.dogBackup || { name: 'Canelo', coat: ['#b5854f', null, false] }; st.dogHome = false; game.npcs.syncCompanion(); }
    if (dog.idx != null) st.dogAff[dog.idx] = dog.affinity;
    if (st.dog) st.dogBackup = st.dog;
  });
}

// ---- Claudia Azul's errand -----------------------------------------------------------------------
NAMED.push(
  {
    id: 'mela', name: 'Doña Mela', role: 'vecina de Abadiano', when: (g) => g.quests.started('s_perro'),
    look: { female: true, age: 'elder', hair: 'braids', hairColor: '#b9b3ac', rebozo: '#5b3f7a', top: 'blouse', topColor: '#e8e2d2', bottom: 'longskirt', bottomColor: '#3b3350', nose: 'wide', eyes: 'droopy' },
    persona: 'Doña Mela, 74 años, de San Antonio Abadiano. Su perrita, la Canela, apareció colgada de un mezquite junto al camino. Está dolida y asustada; sospecha de un vecino que le roba gallinas.',
    lines: ['La Canela me cuidaba las gallinas. Le ladraba a todo el que pasaba de noche.', 'Aquí todos sabemos quién fue. Pero nadie dice nada. Le tienen miedo.'],
    sched: [{ h: [7, 20], map: 'abadiano', at: [32.5, 27.6], act: 'stand', dir: 0 }],
  },
  {
    id: 'betito', name: 'Betito', role: 'niño de Abadiano', when: (g) => g.quests.started('s_perro'),
    look: { age: 'kid', hair: 'buzz', top: 'tshirt', topColor: '#2e78c4', bottom: 'shorts', shoes: 'sneakers', expr: null },
    persona: 'Betito, 9 años, de Abadiano. Vio algo la noche que mataron a la Canela y lo dibujó en su cuaderno; tiene miedo de contarlo a los adultos.',
    lines: ['Yo no vi nada… bueno, poquito.', '¿Tú eres de Jiquilpan? Allá hay kiosco grande, ¿verdad?'],
    sched: [{ h: [8, 19], map: 'abadiano', at: [36.5, 22.4], act: 'wander', r: 2 }],
  },
  {
    id: 'chueco', name: 'El Chueco', role: 'vecino de Abadiano', when: (g) => g.quests.started('s_perro') && !g.quests.done('s_perro') && !g.flags.chueco_gone,
    look: { age: 'adult', hair: 'slick', hairColor: '#21170f', mustache: true, beard: 'stubble', top: 'tshirt', topColor: '#5b6066', bottom: 'jeans', bottomColor: '#3b3b3b', shoes: 'boots', girth: 0.88, nose: 'aquiline', jaw: 'long', brows: 1.1, browArch: -0.3, eyes: 'narrow', cap: null },
    persona: 'Rigoberto, “El Chueco”, 38 años, de Abadiano. Vende chatarra y mecate, anda en una Italika gris. Agresivo y mentiroso; colgó a la perrita de Doña Mela porque le ladraba cuando él iba a robarle gallinas.',
    lines: ['¿Y tú qué me ves?', 'Aquí no se te perdió nada, güerito.'],
    sched: [{ h: [7, 22], map: 'abadiano', at: [11.5, 27.4], act: 'stand', dir: 0 }],
  },
);

SIDE.s_perro = {
  title: 'Justicia para la Canela', giver: 'claudia',
  desc: 'Claudia Azul quiere saber quién colgó a una perrita en Abadiano.',
  step: (g, q) => ({ 1: 'Pídele a Claudia que te consiga cómo llegar a Abadiano.', 2: 'En Abadiano, revisa el mezquite junto al camino, al oriente del pueblo.', 3: 'Habla con Doña Mela, la dueña de la Canela.', 4: 'Busca a Betito, el niño que vio algo esa noche.', 5: 'Enfrenta a El Chueco, el de la Italika gris.', 6: 'Regresa con Claudia Azul al Portal Azul.' }[q.stage] || 'Habla con Claudia Azul.'),
  target: (g) => { const s = g.quests.q('s_perro').stage; return g.quests.done('s_perro') ? null : s === 3 ? 'mela' : s === 4 ? 'betito' : s === 5 ? 'chueco' : s === 6 || s === 1 ? 'claudia' : null; },
  doneText: 'El Chueco respondió ante la ley. La Canela tiene una cruz de flores en Abadiano.',
  options: (g, npc, Q) => {
    const id = npc.def?.id, st = Q.q('s_perro').stage;
    if (id === 'claudia' && !Q.started('s_perro')) return [{ text: 'La veo preocupada, Claudia.', tag: 'quest', run: async d => {
      await d.say(npc, 'Lo estoy. En San Antonio Abadiano amaneció una perrita colgada de un mezquite, junto al camino. Era de Doña Mela, una señora grande que vive sola.', { expr: 'sad' });
      await d.say(npc, 'Como Comité de Pueblo Mágico no podemos voltear para otro lado. Si dejamos pasar esto, mañana es otro. Necesito a alguien que vaya, pregunte y junte pruebas para la policía. ¿Me ayudas?', { expr: 'angry' });
      const c = await d.choose([{ text: 'Cuente conmigo.', value: 1, tag: 'honest' }, { text: 'Ahorita no puedo.', value: 0 }], npc);
      if (!c.value) { await d.say(npc, 'Entiendo. Aquí estaré.'); return; }
      Q.start('s_perro'); g.addStat('corazon', 2);
      await d.say(npc, 'Gracias. Cuando estés listo, dime y mi sobrino te da un aventón en la camioneta del comité.', { expr: 'happy' });
    } }];
    if (id === 'claudia' && st >= 1 && st < 6) return [{ text: 'Lléveme a Abadiano.', tag: 'quest', run: async d => {
      await d.say(npc, 'Ándale. Toñito sale ahorita. Y llévate algo para Doña Mela; la gente grande agradece que la visiten.');
      if (st < 2) Q.set('s_perro', 2);
      d.end();
      g.transition(() => { g.returnStack = []; g.clock.minutes += 25; g.changeMap('abadiano', 30.5, 26.6, 0); g.ui.banner('San Antonio Abadiano', 'Municipio de Jiquilpan'); });
    } }];
    if (id === 'claudia' && st === 6 && !Q.done('s_perro')) return [{ text: 'Ya sabemos quién fue.', tag: 'honest', run: async d => {
      await d.say(npc, g.flags.chueco_let_go ? 'Lo dejaste ir… Entiendo que quisieras darle una oportunidad. Ojalá la aproveche. Doña Mela al menos sabe la verdad.' : 'Ya me llamó el comandante. Lo detuvieron con el mecate en la moto. Doña Mela le puso una cruz de flores a la Canela.', { expr: g.flags.chueco_let_go ? 'sad' : 'happy' });
      await d.say(npc, 'Gracias. Esto también es ser Pueblo Mágico: que nadie haga daño y se quede tan tranquilo. Ten, del comité. Y la cena en el Portal Azul corre por mi cuenta cuando quieras.', { expr: 'happy' });
      g.addMoney(350); g.addStat('fama', 8); g.addStat('corazon', g.flags.chueco_let_go ? 4 : 8);
      Q.finish('s_perro', 'Justicia para la Canela');
    } }];
    if (id === 'mela' && st === 3) return [{ text: 'Vengo de parte de Claudia Azul, del Comité.', tag: 'kind', run: async d => {
      await d.say(npc, 'Ay, mijo… La Canela tenía doce años. Me cuidaba las gallinas: cada que alguien se metía de noche, ladraba hasta que yo salía con la linterna.', { expr: 'sad' });
      await d.say(npc, 'Desde hace un mes me faltan gallinas. Y hay uno que pasa en su motito gris a deshoras, “El Chueco”. Le dijo a mi compadre que “ese perro ya le tenía harto”.', { expr: 'angry' });
      await d.say(npc, 'Yo no lo vi. Pero el niño de los Ochoa, Betito, anda muy callado desde ese día. Pregúntale a él, a ti a lo mejor te dice.');
      if (g.hasItem('pan') || g.hasItem('ramo') || g.hasItem('gelatina')) { const it = ['pan', 'ramo', 'gelatina'].find(x => g.hasItem(x)); g.takeItem(it); g.addStat('corazon', 3); await d.say(npc, 'Ay, ¿me trajiste esto? Dios te lo pague, mijo.', { expr: 'happy' }); }
      Q.set('s_perro', 4);
    } }];
    if (id === 'betito' && st === 4) return [{ text: '¿Viste algo la noche de la Canela?', tag: 'kind', run: async d => {
      await d.say(npc, '…Si te digo, ¿no le dices a mi papá? Es que yo estaba despierto, viendo por la ventana.', { expr: 'sad' });
      const c = await d.choose([{ text: 'Te lo prometo. Fue muy valiente que lo vieras.', value: 1, tag: 'kind' }, { text: 'Dímelo ya, no tengo todo el día.', value: 0, tag: 'mean' }], npc);
      if (!c.value) { g.addStat('corazon', -2); await d.say(npc, '…', { expr: 'sad' }); await d.narrate('Betito se echa a correr. Después de un rato regresa, con los ojos rojos, y te da una hoja arrancada de su cuaderno sin decir nada.'); }
      else await d.say(npc, 'Era un señor flaco en una moto gris. Traía un mecate amarillo. La Canela le ladraba y él… Yo lo dibujé. Tenlo.', { expr: 'sad' });
      g.giveItem('dibujo_moto'); Q.set('s_perro', 5);
    } }];
    if (id === 'chueco' && st === 5) return [{ text: 'Usted colgó a la perrita de Doña Mela.', tag: 'honest', run: async d => {
      await d.say(npc, '¿Yo? ¿Y quién dice? Aquí cualquiera tiene mecate.', { expr: 'angry' });
      const ev = (g.hasItem('mecate_amarillo') ? 1 : 0) + (g.hasItem('dibujo_moto') ? 1 : 0);
      if (ev < 2) { await d.narrate('Te falta algo para sostenerlo. Sin pruebas, nadie le va a hacer nada.'); return; }
      await d.narrate('Le enseñas el pedazo de mecate amarillo y el dibujo de Betito. Ve el mecate igualito que cuelga de su moto. Se le cae la sonrisa.');
      await d.say(npc, 'Ese escuincle no sabe lo que dice… Mira, güerito, mejor vete de aquí antes de que te pase lo mismo que al perro.', { expr: 'angry' });
      const c = await d.choose([{ text: 'No me voy. Esto lo va a saber la policía.', value: 'firm', tag: 'honest' }, { text: 'Retroceder y llamar a la policía desde la tienda', value: 'call', tag: 'kind' }], npc);
      let won = true;
      if (c.value === 'firm') {
        d.end();
        const res = await playPelea(g, { title: 'El Chueco se te va encima', foe: 'El Chueco', dog: g.state.dog?.name });
        won = res.win;
        await g.dialog.scene(async d2 => {
          if (won) await d2.narrate(`El Chueco acaba sentado en la tierra, sin aire${g.state.dog ? `, con ${g.state.dog.name} gruñéndole a un palmo de la cara` : ''}. Los vecinos salen de sus casas.`);
          else await d2.narrate('El Chueco te tumba y se sube a su moto. Pero los vecinos ya salieron, y Doña Cuca tiene el número del comandante.');
          await finishChueco(g, d2, npc, won);
        });
        return 'end';
      }
      await finishChueco(g, d, npc, true);
      return 'end';
    } }];
    return [];
  },
};

async function finishChueco(g, d, npc, won) {
  const c = await d.choose([
    { text: 'Llamar a la policía (desde el teléfono de la tiendita de Doña Cuca)', value: 'police', tag: 'honest' },
    ...(won ? [{ text: 'Dejarlo ir si jura no volver a hacerle daño a nadie', value: 'go', tag: 'kind' }] : []),
  ], npc);
  if (c.value === 'police') {
    await d.narrate('A la media hora llega la patrulla de Jiquilpan levantando polvo. El comandante revisa la moto: en el portaequipajes, el resto del mecate amarillo y dos gallinas amarradas.');
    await d.narrate(won ? 'Se lo llevan esposado. Doña Mela se persigna. Betito te mira desde la ventana y levanta el pulgar.' : 'Lo alcanzan en el camino a Sahuayo. Al rato pasa la patrulla con El Chueco atrás, agachado. Doña Mela llora, pero de alivio.');
    g.addStat('palabra', 6); g.addStat('fama', 4);
  } else {
    await d.say(npc, 'Ya, ya… lo juro. Por mi madre.', { expr: 'sad' });
    await d.narrate('Se va en su moto sin voltear. Los vecinos murmuran. Doña Mela no dice nada; nomás mira el mezquite.');
    g.flags.chueco_let_go = true; g.addStat('corazon', 2); g.addStat('palabra', -2);
  }
  g.flags.chueco_gone = true;
  g.quests.set('s_perro', 6);
  g.ui.toast('Regresa con Claudia Azul al Portal Azul.', 'quest');
}

// the mesquite by the road out of Abadiano
export async function mezquiteScene(g) {
  return g.dialog.scene(async d => {
    const st = g.quests.q('s_perro').stage;
    if (st < 2) { await d.narrate('Un mezquite viejo junto al camino, con una crucecita de palos al pie y unas flores de cempasúchil ya secas.'); return; }
    if (g.hasItem('mecate_amarillo')) { await d.narrate('La crucecita de palos y las flores. Alguien vino a rezar.'); return; }
    await d.narrate('Al pie del mezquite, Doña Mela enterró a la Canela y le puso una crucecita de palos. En una rama todavía cuelga un pedazo de mecate de nylon amarillo, cortado con navaja.');
    await d.narrate('En la tierra suelta hay marcas de llanta de moto, delgadas, y una mancha de aceite.');
    g.giveItem('mecate_amarillo');
    if (g.state.dog) await d.narrate(`${g.state.dog.name} olfatea las marcas y gruñe, mirando hacia el poniente del pueblo.`);
    g.quests.set('s_perro', 3);
  });
}
