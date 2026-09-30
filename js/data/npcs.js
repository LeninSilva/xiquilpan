// The people of Jiquilpan. Schedules use tile coordinates and 24h hours.
// d: weekdays (0=Sunday) when present; h: [from, to) hours; map: map id; at: tile; act: behaviour.
// acts: story acts in which the NPC appears (1 search, 2 cerro, 3 return, 4 two years later, 5 epilogue).

const ALL = [0, 1, 2, 3, 4, 5, 6];
const WEEK = [1, 2, 3, 4, 5];
const WKND = [0, 6];

export const NAMED = [
  // --- family ------------------------------------------------------------
  {
    id: 'abuela', name: 'Abuela Chayo', short: 'la abuela', role: 'tu abuela', noHilo: false,
    look: { female: true, age: 'elder', hair: 'bun', hairColor: '#d9d4cc', top: 'blouse', topColor: '#8e6fae', bottom: 'longskirt', bottomColor: '#3b3350', rebozo: '#2f5d7a', glasses: true, apron: true, embroidery: '#e84a6a' },
    family: true,
    quirks: ['¡Mijo! ¿Ya comiste?', '¡Ay, mijo, qué bueno que llegas!', 'Ven acá, déjame verte.', '¿Y ahora qué traes, mijo?'],
    lines: ['Hice frijoles de la olla; hay tortillas en el chiquihuite.', 'Tu abuelo nunca aprende. Toda la vida mirando el cielo en vez de la milpa.', 'Ponte un suéter, que en la noche refresca.', 'Reza aunque sea un Padre Nuestro, mijo. No cuesta nada.', 'El domingo vamos a misa al Santuario, ¿eh? Nada de excusas.'],
    persona: 'Doña Rosario "Chayo", 78 años, esposa de Don Miguel. Cariñosa, mandona, muy católica, cocina de maravilla; se preocupa por todo. Le dice "mijo" a su nieto.',
    sched: [
      { d: [0], h: [9, 11], map: 'santuario', at: [10, 8], act: 'sit' },
      { h: [0, 24], map: 'casa_abuela', at: [7, 7], act: 'stand' },
    ],
    stories: ['Cuando tu abuelo me pidió matrimonio, subimos al cerro. Me dijo: “desde aquí se ve todo lo que te voy a dar”. Nomás se veía el pueblo… y era suficiente.',
      'Yo tejía rebozos de joven. Mi madre teñía con añil, con jiquilite de la Ciénega. Las manos le quedaban azules semanas enteras.'],
  },
  {
    id: 'miguel', name: 'Don Miguel', short: 'tu abuelo', role: 'tu abuelo', acts: [2, 3, 4, 5],
    look: { age: 'elder', hair: 'short', hairColor: '#cfcac2', beard: 'full', mustache: true, hat: 'texana', hatColor: '#f2ead8', top: 'plaid', topColor: '#7a2f2f', bottom: 'jeans', bottomColor: '#2f4b7c', shoes: 'boots', girth: 1.08 },
    family: true,
    quirks: ['¿Qué pasó, mijo?', 'Siéntate tantito conmigo.', 'Aquí andamos, mijo, viendo pasar la vida.'],
    lines: ['Desde el cerro todo se ve más chiquito, hasta los problemas.', 'Al que madruga, Dios lo ayuda… y Rosita le sirve café.', 'Mira a la gente, mijo. Todos cargan algo. Nomás hay que preguntarles.', 'Tu tío Toño es bravo por fuera y de azúcar por dentro.'],
    persona: 'Don Miguel, 81 años, tu abuelo. Ranchero retirado, sereno, sabio, habla despacio y con refranes; desde el cerro trae una mancha azul añil en la mano. Cree profundamente en el mensaje de no dejar que las pantallas se interpongan entre las personas.',
    sched: [
      { acts: [2], h: [0, 24], map: 'cerro', at: [40, 12], act: 'stand' },
      { acts: [3, 4, 5], h: [9, 14], map: 'town', at: [126.5, 98.2], act: 'sit', dir: 0 },
      { acts: [3, 4, 5], h: [0, 24], map: 'casa_abuela', at: [9, 6], act: 'sit' },
    ],
    noCerro: true,
  },
  {
    id: 'tono', name: 'Don Toño', short: 'Don Toño', role: 'hermano de tu abuelo', acts: [2, 3, 4, 5],
    look: { age: 'elder', hair: 'bald', hairColor: '#9a948c', mustache: true, beard: 'stubble', hat: 'sombrero', top: 'shirt', topColor: '#d8cfa8', bottom: 'pants', bottomColor: '#5b4a36', shoes: 'boots', girth: 1.2, holds: 'rifle' },
    family: true,
    quirks: ['¡Quihubo, sobrino!', '¡Ey, tú! Ven pa’cá.', 'Ah, mira nomás quién viene.'],
    lines: ['Yo no le tengo miedo a nada. Bueno, a tu abuela Chayo sí.', 'El mezcal del Chamacuero cura todo menos la vergüenza.', 'Cuando era joven subía al cerro corriendo. Ahora el cerro sube conmigo.'],
    persona: 'Don Antonio "Toño", 77 años, hermano menor de Don Miguel. Bravo, bromista, mal hablado pero noble; siempre con su rifle viejo "para los coyotes" y su mezcal del Chamacuero. Le apuntó al ser gris y todavía le da vergüenza haberse quedado congelado.',
    sched: [
      { acts: [2], h: [0, 24], map: 'cerro', at: [43, 13], act: 'stand' },
      { acts: [3, 4, 5], h: [14, 22], map: 'town', at: [53.5, 72.4], act: 'sit', dir: 0 },
      { acts: [3, 4, 5], h: [9, 14], map: 'town', at: [18.5, 29.5], act: 'stand' },
    ],
    noCerro: true,
  },
  // --- the plaza ---------------------------------------------------------------
  {
    id: 'rosita', name: 'Rosita', role: 'vende café de olla en la plaza', shop: 'rosita', clue: 'rosita',
    look: { female: true, age: 'adult', hair: 'braids', hairColor: '#2b1f18', top: 'bordado', topColor: '#f7f3ea', bottom: 'longskirt', bottomColor: '#6b2a3a', rebozo: '#7a2f3a', apron: true, embroidery: '#2fb3a0', girth: 1.1 },
    persona: 'Rosita, 52 años, vende café de olla, atole y pan de nata en el Jardín Zaragoza desde hace veinte años, desde las 6:30 am. Platicadora, madrugadora, de risa fácil. Le duele que La Cochera le quite clientes con su café caro.',
    knows: { abuelo: 'Su abuelo pasó el lunes antes de que saliera el sol. Llenó un termo con dos cafés y me dijo: “Vamos al cerro, Rosita, a ver si ahora sí bajan.” Don Toño iba con su rifle. Yo pensé que hablaban de venados.' },
    lines: ['El café de olla se hace con piloncillo, canela y paciencia. Lo de La Cochera es otra cosa… más caro.', 'Desde que abrió La Cochera, ya no vendo como antes. Pero mis clientes de siempre no me dejan.'],
    sched: [{ h: [6.5, 11.5], map: 'town', at: [121.5, 104.8], act: 'vend', dir: 0, prop: { kind: 'cart', cartKind: 'cafe', color: '#c0392b', sign: 'CAFÉ DE OLLA', umbrella: '#c0392b', dx: 0, dy: -0.9 } }],
    stories: ['Mi esposo se fue al norte cuando mi hija tenía dos años. Nunca volvió. El café me sacó adelante: cada taza fue una colegiatura.'],
  },
  {
    id: 'juanita', name: 'Juanita', role: 'vende fruta picada', shop: 'fruta',
    look: { female: true, age: 'adult', hair: 'ponytail', top: 'tshirt', topColor: '#f39c12', bottom: 'jeans', apron: true, embroidery: '#e84a6a' },
    persona: 'Juanita, 35 años, vende fruta picada con Tajín en la plaza; mamá soltera de tres, trabajadora, directa, bromista.',
    sched: [{ h: [10, 18], map: 'town', at: [133.5, 104.6], act: 'vend', dir: 0, prop: { kind: 'cart', cartKind: 'fruta', color: '#2e86de', sign: 'FRUTA', umbrella: '#f39c12', dx: 0, dy: -0.9 } }],
  },
  {
    id: 'tacho', name: 'Don Tacho', role: 'vende garbanzos tostados y elotes', shop: 'garbanzos',
    look: { age: 'elder', hat: 'sombrero', top: 'shirt', topColor: '#f5f0e6', bottom: 'pants', bottomColor: '#6b5a45', mustache: true },
    persona: 'Don Tacho, 70 años, vende garbanzos tostados en comal y elotes en la plaza. Callado, observador, sabe todos los chismes pero los cuenta despacito.',
    sched: [{ h: [11, 19], map: 'town', at: [116.8, 103.6], act: 'vend', dir: 3, prop: { kind: 'cart', cartKind: 'garbanzo', color: '#8a6a48', sign: 'GARBANZOS', dx: 0.9, dy: 0 } }],
  },
  {
    id: 'pepe', name: 'Pepe', role: 'vende churros', shop: 'churros',
    look: { age: 'adult', hat: 'cap', top: 'tshirt', topColor: '#f5f5f5', bottom: 'jeans', apron: true },
    persona: 'Pepe, 28 años, churrero de la plaza por las tardes; fan del Atlas, optimista, siempre silbando.',
    sched: [{ h: [17, 22.5], map: 'town', at: [128.8, 111.4], act: 'vend', dir: 0, prop: { kind: 'cart', cartKind: 'churros', color: '#f2c230', sign: 'CHURROS', dx: 0, dy: -0.9 } }],
  },
  {
    id: 'lety', name: 'Doña Lety', role: 'vende gelatinas con rompope', shop: 'gelatinas',
    look: { female: true, age: 'elder', hair: 'short_f', top: 'blouse', topColor: '#f7c6d9', bottom: 'skirt', bottomColor: '#5b2c2c', apron: true, glasses: true },
    persona: 'Doña Lety, 66 años, vende gelatinas de rompope y mosaico en la plaza al atardecer. Dulce, religiosa, le encanta aconsejar a los jóvenes sobre el amor.',
    sched: [{ h: [17, 22], map: 'town', at: [121.6, 111.4], act: 'vend', dir: 0, prop: { kind: 'cart', cartKind: 'gelatinas', color: '#e0457b', sign: 'GELATINAS', dx: 0, dy: -0.9 } }],
  },
  {
    id: 'guero', name: 'El Güero', role: 'taquero (el bueno, junto a los tubos)', shop: 'taco_guero_bueno',
    look: { age: 'adult', skin: '#f1c8a6', hairColor: '#c9a15a', hair: 'short', top: 'tshirt', topColor: '#f5f5f5', bottom: 'jeans', apron: true, mustache: true, girth: 1.15 },
    persona: 'El Güero, 45 años, taquero de al pastor junto a los tubos de la Casa de la Cultura; güero de rancho, orgulloso de su trompo y de su salsa verde. Su primo y su tío también tienen puestos "El Güero", pero él insiste en que el bueno es él.',
    lines: ['Mi primo pone los tacos frente a Las Monjas, y mi tío en el Jardín de la Paz. Familia, pues… pero el bueno soy yo.', 'El secreto es la salsa verde y no tenerle miedo al trompo.'],
    sched: [{ h: [19, 24], map: 'town', at: [116.6, 111.3], act: 'vend', dir: 0, prop: { kind: 'cart', cartKind: 'tacos', color: '#d8d8d8', sign: 'TACOS EL GÜERO', dx: 0, dy: -0.9 } }],
  },
  {
    id: 'guero_primo', name: 'El Güero (el primo)', short: 'el primo del Güero', role: 'taquero frente a Las Monjas', shop: 'taco_guero_salado',
    look: { age: 'adult', skin: '#f1c8a6', hairColor: '#b8904a', hair: 'spiky', top: 'tshirt', topColor: '#c0392b', bottom: 'jeans', apron: true },
    persona: 'El primo del Güero, 38 años; sus tacos salen salados porque "así los pide la gente de rancho". Presumido y buena onda.',
    sched: [{ h: [19, 23.5], map: 'town', at: [86.5, 93.3], act: 'vend', dir: 0, prop: { kind: 'cart', cartKind: 'tacos', color: '#c9ccd0', sign: 'EL GÜERO', dx: 0, dy: -0.8 } }],
  },
  {
    id: 'guero_tio', name: 'El Güero (el tío)', short: 'el tío del Güero', role: 'taquero del Jardín de la Paz', shop: 'taco_guero_salsa',
    look: { age: 'elder', skin: '#f1c8a6', hairColor: '#d9d4cc', hair: 'slick', top: 'guayabera', topColor: '#f5f0e6', bottom: 'pants', apron: true, mustache: true, girth: 1.2 },
    persona: 'El tío del Güero, 67 años; fundó el primer puesto "El Güero" hace treinta años. Sus tacos son buenos pero su salsa roja es aguada y él lo sabe; le duele que sus sobrinos lo superaran.',
    sched: [{ h: [19, 23], map: 'town', at: [193.6, 127.3], act: 'vend', dir: 0, prop: { kind: 'cart', cartKind: 'tacos', color: '#c9ccd0', sign: 'EL GÜERO ORIG.', dx: 0, dy: -0.8 } }],
  },
  {
    id: 'mary', name: 'Doña Mary', role: 'taquera de la Fuente de los Pescados', shop: 'taco_pescados',
    look: { female: true, age: 'adult', hair: 'ponytail', top: 'blouse', topColor: '#16a085', bottom: 'jeans', apron: true, girth: 1.15 },
    persona: 'Doña Mary, 48 años, pone su puesto de tacos de asada y quesatacos junto a la Fuente de los Pescados en Las Palmas por las noches. Fuerte, generosa, le gusta la música de banda.',
    sched: [{ h: [19, 24], map: 'town', at: [97.5, 168.6], act: 'vend', dir: 2, prop: { kind: 'cart', cartKind: 'tacos', color: '#d8d8d8', sign: 'TACOS', dx: 0, dy: -0.8 } }],
  },
  {
    id: 'chon', name: 'Don Chon', role: 'vende carnitas en su camioneta roja', shop: 'carnitas',
    look: { age: 'elder', hat: 'texana', hatColor: '#6b4a2e', top: 'shirt', topColor: '#f5f0e6', bottom: 'jeans', apron: true, mustache: true, girth: 1.25 },
    persona: 'Don Chon, 64 años, vende carnitas desde su camioneta roja, solo, una cuadra abajo por Las Palmas los fines de semana. Su salsa de chile de árbol es famosa por enchilar a los valientes; le divierte advertir y que no le hagan caso.',
    lines: ['La salsa no es para turistas, joven. Luego no diga que no le avisé.', 'Yo me pongo aquí solito; el que sabe, sabe dónde encontrarme.'],
    sched: [{ d: WKND, h: [8, 15], map: 'town', at: [96.6, 178.2], act: 'vend', dir: 0, prop: { kind: 'carnitasTruck', dx: 0, dy: -0.5 } }],
  },
  {
    id: 'birria_gt', name: 'Doña Vilma', role: 'vende birria de Guatemala en el tianguis del sábado', shop: 'birria_guatemala',
    look: { female: true, age: 'adult', hair: 'long', top: 'bordado', topColor: '#ffffff', bottom: 'longskirt', bottomColor: '#1f4fa0', apron: true, embroidery: '#6a5acd' },
    persona: 'Doña Vilma, 44 años, vende birria en el tianguis del sábado cerca del estadio; todos le dicen "la birria de Guatemala" aunque ella es de Jiquilpan (el nombre viene de su puesto original en la colonia Guatemala). Alegre y muy trabajadora.',
    sched: [{ d: [6], h: [8, 15], map: 'town', at: [100, 191.8], act: 'vend', dir: 0 }],
  },
  // --- taxis ----------------------------------------------------------------
  {
    id: 'chuy', name: 'Chuy', role: 'taxista del sitio Gabino Ortiz', clue: 'chuy', taxi: true,
    look: { age: 'adult', hat: 'cap', top: 'polo', topColor: '#1b7a3e', bottom: 'jeans', uniform: 'taxi', mustache: true, girth: 1.15 },
    persona: 'Chuy, 50 años, taxista del sitio frente a la Biblioteca Gabino Ortiz; conoce cada bache del pueblo, escucha la radio, habla de fútbol y de política municipal.',
    knows: { abuelo: 'El lunes a las cinco de la mañana me tocó llevarlos al inicio de la brecha del cerro. Don Toño con su rifle y su botella, y su abuelo muy serio viendo para arriba. Me dijo: “Si no bajamos el miércoles, no te preocupes.” ¿Ya es jueves, verdad?' },
    sched: [{ h: [7, 21], map: 'town', at: [156.5, 113.3], act: 'stand', dir: 0 }],
  },
  {
    id: 'lalo', name: 'Lalo', role: 'taxista del sitio del Mercado', taxi: true,
    look: { age: 'adult', top: 'polo', topColor: '#1b7a3e', bottom: 'jeans', uniform: 'taxi', hair: 'slick', glasses: true },
    persona: 'Lalo, 33 años, taxista del sitio del mercado junto al Palacio Municipal; joven, platicador, siempre con el celular, sueña con irse a Guadalajara.',
    sched: [{ h: [8, 22], map: 'town', at: [139.5, 83.3], act: 'phone', dir: 0 }],
  },
  {
    id: 'memo', name: 'Memo', role: 'taxista del sitio de la Entrada (junto al OXXO)', taxi: true,
    look: { age: 'adult', top: 'polo', topColor: '#1b7a3e', bottom: 'pants', uniform: 'taxi', hat: 'cap', beard: 'goatee' },
    persona: 'Memo, 41 años, taxista del sitio de la entrada junto al OXXO; recibe a los que llegan de Zamora y de Sahuayo. Serio, práctico, ex-trailero.',
    sched: [{ h: [6, 23], map: 'town', at: [234.5, 86.9], act: 'stand', dir: 0 }],
  },
  // --- ranch / countryside --------------------------------------------------------
  {
    id: 'refugio', name: 'Don Refugio', role: 'ranchero, vende pajaretes', shop: 'pajarete', clue: 'refugio',
    look: { age: 'elder', hat: 'sombrero', top: 'shirt', topColor: '#e8e2d2', bottom: 'jeans', shoes: 'boots', mustache: true, beard: 'full', hairColor: '#bdb7ae', girth: 1.1 },
    persona: 'Don Refugio, 73 años, ranchero; ordeña al amanecer y vende pajaretes (leche recién ordeñada con alcohol y chocolate) en su corral. Fía la leche a quien le cae bien, pero no olvida una deuda. Compadre de Don Miguel.',
    knows: { abuelo: 'El lunes, bien temprano, se echaron un pajarete aquí conmigo. Tu abuelo nomás veía el cerro. Toño dijo que llevaba el rifle “por los coyotes”… y por otras cosas. Les presté una cobija.' },
    sched: [{ h: [6, 11], map: 'town', at: [204.5, 23.6], act: 'vend', dir: 0 }, { h: [17, 19.5], map: 'town', at: [206, 24], act: 'stand', dir: 0 }],
  },
  {
    id: 'nacho', name: 'Nacho', role: 'ordeñador del rancho',
    look: { age: 'teen', hat: 'texana', hatColor: '#f2ead8', top: 'plaid', topColor: '#2e86de', bottom: 'jeans', shoes: 'boots' },
    persona: 'Nacho, 19 años, trabaja con Don Refugio ordeñando; tímido, quiere comprarse una Italika, escucha corridos.',
    sched: [{ h: [6, 12], map: 'town', at: [215, 26.5], act: 'wander', r: 3 }],
  },
  {
    id: 'queta', name: 'Doña Queta', role: 'esposa de Don Refugio',
    look: { female: true, age: 'elder', hair: 'braids', hairColor: '#8f8a84', top: 'bordado', topColor: '#f7f3ea', bottom: 'longskirt', bottomColor: '#3b5b3a', rebozo: '#6b5a45', embroidery: '#f2a93b' },
    persona: 'Doña Queta, 70 años, esposa de Don Refugio; hace el chocolate para los pajaretes y quesos. Sabe de hierbas y de remedios.',
    sched: [{ h: [6, 10.5], map: 'town', at: [202.4, 22.8], act: 'stand', dir: 3 }],
  },
  {
    id: 'lupe', name: 'Don Lupe', role: 'mezcalero de El Chamacuero', shop: 'chamacuero', clue: 'lupe',
    look: { age: 'elder', hat: 'sombrero', top: 'shirt', topColor: '#f5f0e6', bottom: 'pants', bottomColor: '#6b5a45', mustache: true, beard: 'goatee', skin: '#a8744f' },
    persona: 'Don Lupe, 69 años, destila mezcal en El Chamacuero, el mejor de la región según él y según todos. Sabio, lento, filosófico, habla del agave como de una persona.',
    knows: { abuelo: 'Toño vino el domingo por una botella. Le pregunté pa’ qué tanta prisa y me dijo: “Pa’l frío… y pa’l valor, Lupe. Dicen que en el cerro andan luces.” Se llevó la de reserva.' },
    lines: ['El agave tarda ocho años en madurar. La gente de ahora no aguanta ni ocho segundos sin ver su teléfono.', 'Para todo mal, mezcal; para todo bien, también.'],
    sched: [{ h: [9, 19], map: 'town', at: [17.5, 28.3], act: 'stand', dir: 0 }],
  },
  // --- micheladas & bars ------------------------------------------------------
  {
    id: 'lupita', name: 'Lupita', role: 'dueña de Micheladas Lupita', shop: 'micheladas',
    look: { female: true, age: 'adult', hair: 'long', hairColor: '#4a3424', top: 'crop', topColor: '#d4302b', bottom: 'jeans', earrings: true },
    persona: 'Lupita, 39 años, dueña de Micheladas Lupita; carismática, ruidosa, rey de la barra, conoce a todos los borrachitos por su nombre.',
    sched: [{ h: [11, 24], map: 'micheladas_lupita', at: [8, 4.3], act: 'stand' }],
  },
  {
    id: 'norma', name: 'Norma', role: 'dueña de Micheladas Norma', shop: 'micheladas',
    look: { female: true, age: 'adult', hair: 'ponytail', top: 'blouse', topColor: '#1f4fa0', bottom: 'jeans', glasses: true },
    persona: 'Norma, 45 años, dueña de Micheladas Norma; seria, eficiente, orgullosa de sus clamatos; rivalidad amistosa con Lupita.',
    sched: [{ h: [12, 24], map: 'micheladas_norma', at: [8, 4.3], act: 'stand' }],
  },
  {
    id: 'nico', name: 'Nico', role: 'dueño de Micheladas de Nico', shop: 'micheladas',
    look: { age: 'adult', top: 'jersey', topColor: '#f2c230', bottom: 'shorts', bottomColor: '#1b1b1b', hat: 'cap', beard: 'full', hairColor: '#1b1512' },
    persona: 'Nico, 31 años, dueño de Micheladas de Nico junto al Jardín de la Paz; fan del reggaetón y del fútbol, inventa micheladas con gomitas; buena onda con todos.',
    sched: [{ h: [12, 24], map: 'micheladas_nico', at: [8, 4.3], act: 'stand' }],
  },
  {
    id: 'rosa', name: 'Rosa "La Pantera"', short: 'La Pantera', role: 'dueña de La Pantera Rosa', shop: 'micheladas',
    look: { female: true, age: 'adult', hair: 'short_f', hairColor: '#8b2a5a', top: 'blouse', topColor: '#f06aa8', bottom: 'jeans', earrings: true },
    persona: 'Rosa, apodada "La Pantera", 50 años, dueña de La Pantera Rosa en la avenida de la entrada; coqueta, rápida para las bromas, maneja a los clientes con mano firme.',
    sched: [{ h: [12, 24], map: 'pantera_rosa', at: [8, 4.3], act: 'stand' }],
  },
  {
    id: 'tavo', name: 'Tavo', role: 'Micheladas del Bosque', shop: 'micheladas',
    look: { age: 'teen', top: 'tshirt', topColor: '#2e8b57', bottom: 'shorts', hat: 'cap' },
    persona: 'Tavo, 22 años, atiende el puesto de Micheladas del Bosque en la entrada del Bosque Cuauhtémoc; relajado, fan de los carros, conoce a todos los que dan vueltas en el bosque de noche.',
    sched: [{ h: [12, 24], map: 'town', at: [107.5, 204.3], act: 'vend', dir: 0 }],
  },
  {
    id: 'chato', name: 'El Chato', role: 'cliente de las micheladas',
    look: { age: 'adult', top: 'tshirt', topColor: '#34495e', bottom: 'jeans', hat: 'cap', holds: 'michelada', girth: 1.3, mustache: true },
    persona: 'El Chato, 47 años, albañil, cliente fijo de Micheladas Lupita por las tardes; filósofo de banqueta, exagerado, simpático.',
    sched: [{ h: [14, 23], map: 'town', at: [52, 72.5], act: 'sit', dir: 0 }],
  },
  {
    id: 'pelon', name: 'El Pelón', role: 'cliente de La Pantera Rosa',
    look: { age: 'adult', hair: 'bald', top: 'guayabera', topColor: '#f5f0e6', bottom: 'pants', holds: 'michelada', beard: 'goatee' },
    persona: 'El Pelón, 55 años, maestro jubilado que toma micheladas en La Pantera Rosa y opina de historia de México con autoridad total.',
    sched: [{ h: [15, 23], map: 'town', at: [210.4, 90.5], act: 'sit', dir: 0 }],
  },
  // --- shops & services -----------------------------------------------------------
  {
    id: 'irma', name: 'Doña Irma Mendoza', role: 'panadera de la Panadería Mendoza', shop: 'panaderia',
    look: { female: true, age: 'elder', hair: 'bun', top: 'blouse', topColor: '#f5f0e6', bottom: 'skirt', bottomColor: '#7a3e1d', apron: true },
    persona: 'Doña Irma Mendoza, 71 años, tercera generación de la Panadería Mendoza; madrugadora, exigente, dulce con los niños.',
    sched: [{ h: [7, 21], map: 'panaderia', at: [8, 5.2], act: 'stand' }],
  },
  {
    id: 'profe_billar', name: 'El Profe', role: 'encargado del billar de arriba de la Mendoza', shop: 'billar',
    look: { age: 'adult', top: 'shirt', topColor: '#1f5a3a', bottom: 'pants', glasses: true, mustache: true },
    persona: 'El Profe, 58 años, maestro de secundaria jubilado que atiende el billar arriba de la Panadería Mendoza; calcula tiros con geometría y cuenta chistes malos.',
    sched: [{ h: [12, 24], map: 'billar_mendoza', at: [4, 4], act: 'stand' }],
  },
  {
    id: 'rigo', name: 'Rigo', role: 'dueño del billar de la entrada', shop: 'billar',
    look: { age: 'adult', top: 'tshirt', topColor: '#1b1b1b', bottom: 'jeans', hat: 'cap', beard: 'stubble' },
    persona: 'Rigo, 36 años, dueño del billar de la entrada del pueblo; de pocas palabras, buen jugador, fan de los corridos.',
    sched: [{ h: [11, 24], map: 'billar_entrada', at: [4, 4], act: 'stand' }],
  },
  {
    id: 'frijoles', name: 'Don Frijoles', role: 'dueño de la tienda "Frijoles"', shop: 'frijoles',
    look: { age: 'elder', top: 'shirt', topColor: '#f3d36b', bottom: 'pants', apron: true, mustache: true, girth: 1.2 },
    persona: 'Don Frijoles (se llama Fidel, pero nadie lo sabe), 68 años, dueño de la tienda en Vicente Guerrero; vende cerveza, fruta, verdura y lo que se ofrezca; apunta fiados en una libreta que nunca pierde.',
    sched: [{ h: [8, 22], map: 'frijoles', at: [6, 4.3], act: 'stand' }],
  },
  {
    id: 'chava', name: 'Chava', role: 'carnicero de la esquina', shop: 'carniceria',
    look: { age: 'adult', top: 'tshirt', topColor: '#f5f5f5', bottom: 'jeans', apron: true, beard: 'full', hairColor: '#1b1512', girth: 1.2 },
    persona: 'Chava, 42 años, carnicero de la esquina de Vicente Guerrero; también vende cerveza, sodas, dulces y cacahuates; gritón y generoso.',
    sched: [{ h: [7, 20], map: 'carniceria', at: [6, 4.3], act: 'stand' }],
  },
  {
    id: 'brenda', name: 'Brenda', role: 'cajera del OXXO', shop: 'oxxo',
    look: { female: true, age: 'teen', hair: 'ponytail', top: 'polo', topColor: '#e11b22', bottom: 'jeans', uniform: null },
    persona: 'Brenda, 19 años, cajera del OXXO de la entrada; estudia enfermería en línea, siempre cansada, sarcástica pero amable.',
    sched: [{ h: [0, 24], map: 'oxxo', at: [6, 4.3], act: 'stand' }],
  },
  {
    id: 'sofi_kevin', name: 'Sofi', role: 'dueña de La Cochera (café)', shop: 'cochera',
    look: { female: true, age: 'adult', hair: 'bun', top: 'tshirt', topColor: '#2d3436', bottom: 'jeans', apron: true, glasses: true },
    persona: 'Sofi, 31 años, de Sahuayo; trabajó siete años en un Starbucks en California con su esposo Kevin, regresaron, pusieron La Cochera en Sahuayo y abrieron sucursal en los portales de Jiquilpan. Habla con palabras en inglés ("latte", "cold brew"), es amable y un poco presumida; defiende a Sahuayo con humor.',
    lines: ['En Sahuayo nos va súper bien, pero aquí en Jiquilpan la gente aprecia más el… vibe, ¿sabes?', 'Kevin y yo trabajamos siete años en Starbucks allá en California. Aquí hacemos lo mismo pero con café de Uruapan.', 'Los de Sahuayo vendemos, los de Jiquilpan platican. Aquí vine a aprender a platicar, jaja.'],
    sched: [{ h: [8, 22], map: 'la_cochera', at: [8, 4.2], act: 'stand' }],
  },
  {
    id: 'kevin', name: 'Kevin', role: 'barista de La Cochera',
    look: { age: 'adult', top: 'tshirt', topColor: '#6b4a2e', bottom: 'jeans', apron: true, beard: 'full', hat: 'cap', capColor: '#1b1b1b' },
    persona: 'Kevin, 33 años, nacido en Sahuayo, criado entre Sahuayo y California; barista, esposo de Sofi. Presume sus "latte art" y extraña los burritos de allá.',
    sched: [{ h: [8, 22], map: 'la_cochera', at: [11, 4.2], act: 'stand' }],
  },
  {
    id: 'olga', name: 'Maestra Olga', role: 'bibliotecaria de la Gabino Ortiz',
    look: { female: true, age: 'elder', hair: 'short_f', top: 'blouse', topColor: '#6c5ce7', bottom: 'skirt', glasses: true, rebozo: '#5b3f7a' },
    persona: 'Maestra Olga, 67 años, bibliotecaria de la Biblioteca Pública Gabino Ortiz; ama los murales de Orozco y los explica con pasión; estricta con los libros vencidos.',
    sched: [{ h: [9, 19], map: 'biblioteca', at: [12, 10.8], act: 'stand' }],
  },
  {
    id: 'ramirez', name: 'Dr. Ramírez', role: 'investigador de la UNAM (Estudios Regionales)',
    look: { age: 'adult', top: 'shirt', topColor: '#dfe6e9', bottom: 'pants', glasses: true, beard: 'full', hairColor: '#6b6660' },
    persona: 'Dr. Ramírez, 56 años, historiador de la Unidad Académica de Estudios Regionales de la UNAM en Jiquilpan; experto en Lázaro Cárdenas y el archivo regional; curioso, escéptico pero honesto.',
    sched: [{ d: WEEK, h: [9, 18], map: 'unam', at: [14, 5], act: 'stand' }],
  },
  {
    id: 'fer', name: 'Fer', role: 'estudiante y guía del museo de la UNAM',
    look: { female: true, age: 'teen', hair: 'long', top: 'hoodie', topColor: '#003d79', bottom: 'jeans', glasses: false },
    persona: 'Fer, 21 años, estudiante de historia que da recorridos en el museo de la UNAM; entusiasta, habla rápido, le encanta el jeep del General.',
    sched: [{ h: [10, 18], map: 'unam', at: [6, 9], act: 'stand' }],
  },
  {
    id: 'padre', name: 'Padre Tomás', role: 'párroco de San Francisco',
    look: { age: 'adult', uniform: 'padre', glasses: true, hair: 'short', hairColor: '#6b6660' },
    persona: 'El Padre Tomás, 60 años, párroco de San Francisco de Asís; bonachón pero cauteloso; no cree en marcianos, pero sí en la soledad de la gente.',
    sched: [{ h: [7, 20], map: 'templo_sf', at: [10, 6], act: 'stand' }],
  },
  {
    id: 'paty', name: 'Paty', role: 'secretaria en el Palacio Municipal',
    look: { female: true, age: 'adult', hair: 'long', uniform: 'office', topColor: '#f7c6d9', earrings: true, phone: true },
    persona: 'Paty, 37 años, secretaria del Ayuntamiento; sabe todos los trámites, todos los chismes y todas las fechas de las fiestas patronales.',
    sched: [{ d: WEEK, h: [8, 15], map: 'palacio', at: [9, 4.5], act: 'stand' }],
  },
  {
    id: 'comandante', name: 'Comandante Barajas', role: 'comandante de la policía municipal',
    look: { age: 'adult', uniform: 'police', mustache: true, girth: 1.25 },
    persona: 'El Comandante Barajas, 52 años, jefe de la policía municipal; hombre de trámites, llevó el caso de la desaparición de los tres del cerro y no le gusta quedar en ridículo.',
    sched: [{ d: WEEK, h: [8, 15], map: 'palacio', at: [14, 7], act: 'stand' }, { h: [18, 21], map: 'town', at: [124.5, 94.8], act: 'stand', dir: 0 }],
  },
  {
    id: 'estela', name: 'Dra. Estela', role: 'médica del Hospital General',
    look: { female: true, age: 'adult', uniform: 'nurse', topColor: '#f5f5f5', hair: 'bun', glasses: true },
    persona: 'La Dra. Estela, 44 años, médica del Hospital General; revisó a los tres del cerro al volver y no encontró explicación a la mancha azul de la mano de Don Miguel. Práctica, compasiva.',
    sched: [{ h: [7, 22], map: 'hospital', at: [8, 5], act: 'stand' }],
  },
  {
    id: 'arturo', name: 'Don Arturo', role: 'recepcionista del Hotel Palmira', shop: 'hotel',
    look: { age: 'elder', top: 'shirt', topColor: '#f5f5f5', bottom: 'pants', tie: true, glasses: true, hair: 'slick', hairColor: '#b9b3ac' },
    persona: 'Don Arturo, 72 años, recepcionista del Hotel Palmira desde los ochenta; elegante, memorioso, le encanta contar quién se hospedó en el hotel.',
    sched: [{ h: [0, 24], map: 'hotel_palmira', at: [8, 4.3], act: 'stand' }],
  },
  {
    id: 'chema', name: 'Don Chema', role: 'abuelito del portal',
    look: { age: 'elder', hat: 'sombrero', top: 'guayabera', topColor: '#f5f0e6', bottom: 'pants', bottomColor: '#6b5a45', mustache: true, glasses: true, girth: 0.95 },
    persona: 'Don Chema, 88 años, el más viejo del portal; conoció al General Cárdenas de niño; necesita un bastón nuevo porque el suyo se rompió.',
    lines: ['Yo vi al General Cárdenas aquí mismo, en la plaza, cuando yo tenía seis años. Me regaló un peso de plata.', 'Antes de que hubiera luz eléctrica, en esta plaza nos contábamos historias hasta la madrugada.'],
    sched: [{ h: [9, 13], map: 'town', at: [120.5, 117.4], act: 'sit', dir: 1 }, { h: [17, 20], map: 'town', at: [120.5, 117.4], act: 'sit', dir: 1 }],
  },
  {
    id: 'beto', name: 'Beto', role: 'niño del Jardín de la Paz',
    look: { age: 'kid', hair: 'spiky', top: 'tshirt', topColor: '#27ae60', bottom: 'shorts', backpack: true },
    persona: 'Beto, 9 años, juega trompo en el Jardín de la Paz; perdió su trompo favorito que le hizo su abuelo.',
    sched: [{ d: WEEK, h: [16, 19.5], map: 'town', at: [194, 122.2], act: 'wander', r: 2 }, { d: WKND, h: [11, 19], map: 'town', at: [127, 101.2], act: 'wander', r: 3 }],
  },
  {
    id: 'karla', name: 'Karla', role: 'estudiante de prepa, tiktokera',
    look: { female: true, age: 'teen', hair: 'long', hairColor: '#6b4a2e', top: 'crop', topColor: '#f7c6d9', bottom: 'jeans', phone: true, earrings: true },
    persona: 'Karla, 17 años, estudiante de prepa con 12 mil seguidores en TikTok; subió el video "Los abuelos marcianos de Jiquilpan" que se hizo viral. En el fondo se siente culpable y sola.',
    sched: [{ h: [16, 21.5], map: 'town', at: [131.5, 101.5], act: 'phone', dir: 0 }],
  },
  {
    id: 'brandon', name: 'Brandon', role: 'estudiante de prepa',
    look: { age: 'teen', hair: 'spiky', top: 'hoodie', topColor: '#2d3436', bottom: 'jeans', phone: true },
    persona: 'Brandon, 17 años, amigo de Karla; gamer, bromista, quiere ser youtuber; se burla de todo para no hablar de lo que siente.',
    sched: [{ h: [16, 21.5], map: 'town', at: [132.6, 101.9], act: 'phone', dir: 2 }],
  },
  {
    id: 'poncho', name: 'Don Poncho', role: 'líder de los Rinos (ciclistas)',
    look: { age: 'adult', uniform: 'rino', beard: 'full', hairColor: '#9a948c', girth: 1.05 },
    persona: 'Don Poncho, 58 años, líder de "Los Rinos", el grupo de ciclistas de Jiquilpan; entusiasta del deporte y de las rutas al cerro; motiva a todos a pedalear.',
    sched: [{ h: [7, 10.5], map: 'town', at: [104.2, 204.4], act: 'stand', dir: 0 }],
  },
  {
    id: 'tona', name: 'Doña Toña', role: 'vecina del pueblito de San Francisco (en el cerro)',
    look: { female: true, age: 'elder', hair: 'braids', hairColor: '#b9b3ac', top: 'bordado', topColor: '#f7f3ea', bottom: 'longskirt', bottomColor: '#5b3f7a', rebozo: '#3b5b3a', embroidery: '#e84a6a' },
    persona: 'Doña Toña, 80 años, vive junto a la capilla del pueblito de San Francisco, en lo alto del cerro; ha visto las luces toda su vida y no le teme a nada.',
    knows: { abuelo: 'Pasaron por aquí el lunes, sí. Subieron a la cruz, a la mera punta, donde se ve toda la Ciénega. Les dije: “No suban de noche.” ¿Y qué cree? Nadie hace caso a las viejas.', luces: 'Las luces vienen cuando el pueblo se olvida de algo. Mi abuela las vio en tiempos del General.' },
    believer: true,
    sched: [{ h: [6, 21], map: 'cerro', at: [36, 52], act: 'stand', dir: 0 }],
  },
  {
    id: 'canelo_owner', name: 'Juanito', role: 'niño del pueblito de San Francisco',
    look: { age: 'kid', hair: 'buzz', top: 'tshirt', topColor: '#e74c3c', bottom: 'shorts' },
    persona: 'Juanito, 8 años, vive en el pueblito del cerro con su perro Canelo, que no quiere subir a la cruz desde hace meses.',
    sched: [{ h: [8, 19], map: 'cerro', at: [44, 55], act: 'wander', r: 3 }],
  },
  // --- villages ----------------------------------------------------------
  {
    id: 'totolan', name: 'Don Rafa', role: 'campesino de Totolán',
    look: { age: 'elder', hat: 'sombrero', top: 'shirt', topColor: '#e8e2d2', bottom: 'jeans', mustache: true },
    persona: 'Don Rafa, 74 años, campesino de Totolán; siembra maíz y garbanzo; habla de la presa, de la lluvia y de sus hijos en Estados Unidos.',
    sched: [{ h: [7, 20], map: 'totolan', at: [30, 26], act: 'stand', dir: 0 }],
  },
  {
    id: 'abadiano', name: 'Doña Cuca', role: 'vecina de Abadiano',
    look: { female: true, age: 'elder', hair: 'bun', top: 'blouse', topColor: '#16a085', bottom: 'longskirt', bottomColor: '#3b3350', rebozo: '#7a2f3a' },
    persona: 'Doña Cuca, 76 años, vecina de Abadiano; hace tortillas a mano, tiene gallinas y un loro que dice groserías.',
    sched: [{ h: [7, 20], map: 'abadiano', at: [24, 20], act: 'stand', dir: 0 }],
  },
  {
    id: 'sarabia', name: 'Profe Nacho', role: 'maestro rural de Francisco Sarabia',
    look: { age: 'adult', top: 'shirt', topColor: '#dfe6e9', bottom: 'pants', glasses: true, mustache: true },
    persona: 'El Profe Nacho, 50 años, maestro de la escuelita de Francisco Sarabia; idealista, lector, cree que la escuela rural es el corazón del país.',
    sched: [{ h: [8, 18], map: 'sarabia', at: [24, 20], act: 'stand', dir: 0 }],
  },
];

// Market stalls (interior) — each vendor is an NPC in the mercado map.
export const MERCADO_VENDORS = [
  { id: 'cano1', name: 'Don Cano', role: 'Birria El Cano “el original”', shop: 'mercado_birria1', at: [6, 6], look: { age: 'elder', apron: true, mustache: true, hat: 'cap', capColor: '#f5f5f5', girth: 1.2 }, persona: 'Don Cano, 70 años, jura que su birria es la original desde 1972.' },
  { id: 'cano2', name: 'El Cano', role: 'Birria El Cano “el verdadero original”', shop: 'mercado_birria2', at: [14, 6], look: { age: 'adult', apron: true, beard: 'full', girth: 1.25 }, persona: 'El Cano, 46 años, sobrino de Don Cano; dice que la receta verdadera se la dio su abuela, no su tío.' },
  { id: 'cano3', name: 'Cano Jr.', role: 'Birria El Cano Jr.', shop: 'mercado_birria3', at: [22, 6], look: { age: 'teen', apron: true, hat: 'cap', capColor: '#c0392b' }, persona: 'Cano Jr., 23 años, hijo de El Cano; inventó la quesabirria del mercado y la promueve en redes.' },
  { id: 'tortas', name: 'La Güera', role: 'Tortas y sándwiches', shop: 'mercado_tortas', at: [30, 6], look: { female: true, age: 'adult', skin: '#f1c8a6', hairColor: '#d9b36a', apron: true }, persona: 'La Güera, 40 años, hace tortas de pierna y milanesa; rápida y cariñosa.' },
  { id: 'jugos', name: 'Doña Chela', role: 'Jugos recién exprimidos', shop: 'mercado_jugos', at: [6, 16], look: { female: true, age: 'elder', apron: true, hair: 'bun' }, persona: 'Doña Chela, 65 años, jugos naturales; receta un jugo para cada mal.' },
  { id: 'tere', name: 'Doña Tere', role: 'Fonda: chiles rellenos', shop: 'mercado_chiles', at: [14, 16], look: { female: true, age: 'adult', apron: true, rebozo: '#7a2f3a', girth: 1.15 }, persona: 'Doña Tere, 58 años, fonda de chiles rellenos capeados; comadre de la abuela Chayo.' },
  { id: 'beto_cod', name: 'Don Beto', role: 'Huevos de codorniz con jerez', shop: 'mercado_codorniz', at: [22, 16], look: { age: 'elder', apron: true, glasses: true, hat: 'texana' }, persona: 'Don Beto, 72 años, vende huevos de codorniz con jerez, limón y chile; dice que son afrodisíacos y se ríe solo.' },
  { id: 'carnicero', name: 'Memo el carnicero', role: 'Carnicería del mercado', shop: 'mercado_carne', at: [30, 16], look: { age: 'adult', apron: true, beard: 'full', girth: 1.2 }, persona: 'Memo, 44 años, carnicero del centro del mercado; afila cuchillos mientras platica.' },
  { id: 'verdulera', name: 'Doña Pili', role: 'Frutas y verduras', shop: 'mercado_frutas', at: [36, 11], look: { female: true, age: 'adult', apron: true, hair: 'braids', rebozo: '#3b5b3a' }, persona: 'Doña Pili, 55 años, frutas y verduras del campo; regatea por deporte.' },
];
