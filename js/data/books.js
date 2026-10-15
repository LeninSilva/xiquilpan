// Books on the shelves of the Biblioteca Gabino Ortiz and the bookshop on the plaza. Real books (for
// recent ones only the title, the author and a line of our own; short quotations only from works in the
// public domain: Sor Juana, Darío, Nervo, López Velarde, Martí, Bernal Díaz), plus a few local
// publications invented for the game, marked `fic: true`.
export const SECTION_NOTES = {
  historia: 'HISTORIA. Lomos de piel que se deshacen, ediciones de la SEP de los setenta y un hueco donde debería estar un tomo de la Revolución que nadie ha devuelto desde 1994.',
  sociologia: 'SOCIOLOGÍA. Aquí leen los de la UNAM cuando se les va la luz en la Unidad. Muchos subrayados a lápiz, algunos con pluma (la Maestra Olga los odia).',
  filosofia: 'FILOSOFÍA. El estante más tranquilo. Un señor viene todos los martes, saca el mismo libro y no pasa de la página treinta.',
  michoacan: 'MICHOACÁN. La Ciénega, los purépechas, el añil, el General. Libros pequeños de imprentas de Morelia y Zamora, con fotos en blanco y negro de este mismo pueblo.',
  literatura: 'LITERATURA. Lo más pedido: los cuentos de Rulfo para la tarea, Darío para los enamorados y Sor Juana para los que tienen que aprenderse un soneto para el lunes.',
  enciclopedias: 'ENCICLOPEDIAS. Tomos pesados con letras doradas. Antes de internet, aquí se hacían todas las tareas del pueblo; todavía huelen a pegamento y a niño apurado.',
  arte: 'ARTE. Libros grandes, de los que no se prestan: los muralistas, la Academia de San Carlos, el arte popular de Michoacán, las lacas de Uruapan y los cobres de Santa Clara.',
  infantil: 'INFANTIL. Sillitas de colores, cuentos con las esquinas mordidas y un dibujo de un dinosaurio pegado con cinta en la madera.',
  novedades: 'NOVEDADES. Lo que llegó en la última caja de la distribuidora de Guadalajara, todavía con olor a imprenta.',
  usados: 'USADOS. Libros con dedicatorias de gente que no conoces: “Para Lupita, que nunca cambie. 1987”.',
};

export const BOOKS = {
  historia: [
    { t: 'Historia verdadera de la conquista de la Nueva España', a: 'Bernal Díaz del Castillo', y: 's. XVI', note: 'Un soldado viejo, en Guatemala, se pone a escribir lo que vio cuando era joven, porque los cronistas de escritorio lo contaban mal.', quote: 'Y desde que vimos tantas ciudades y villas pobladas en el agua, y en tierra firme otras grandes poblazones… nos quedamos admirados, y decíamos que parecía a las cosas de encantamiento.', stat: 'palabra' },
    { t: 'Los de abajo', a: 'Mariano Azuela', y: '1915', note: 'La Revolución contada desde abajo, desde los que la pelearon sin saber bien contra quién. Un médico de Jalisco la escribió casi en el campo de batalla.' },
    { t: 'Visión de los vencidos', a: 'Miguel León-Portilla', y: '1959', note: 'La Conquista contada por los que la perdieron, en los cantos y crónicas en náhuatl. Alguien dejó entre las páginas una hoja de jacaranda prensada.' },
    { t: 'Relación de Michoacán', a: 'Fray Jerónimo de Alcalá (atribuida)', y: 'c. 1540', note: 'Lo que los viejos purépechas le contaron a un fraile sobre su pueblo, sus señores y sus dioses, con dibujos de colores. Esta es una edición facsimilar de bolsillo.', stat: 'corazon' },
  ],
  sociologia: [
    { t: 'Pueblo en vilo', a: 'Luis González y González', y: '1968', note: 'La historia de San José de Gracia, aquí cerquita, en la sierra: un pueblo chico contado con el mismo cuidado que un país. Le dicen “microhistoria”. Doña Olga dice que es lo más bonito que se ha escrito de la región.', stat: 'corazon' },
    { t: 'México profundo', a: 'Guillermo Bonfil Batalla', y: '1987', note: 'Sobre los dos Méxicos: el que se ve en los discursos y el que está debajo, vivo, en los pueblos. Muy subrayado.' },
    { t: 'El laberinto de la soledad', a: 'Octavio Paz', y: '1950', note: 'Ensayos sobre lo que somos los mexicanos: las máscaras, las fiestas, la muerte. Los de prepa lo leen a fuerza; los viejos, por gusto.' },
    { t: 'Los hijos de Sánchez', a: 'Oscar Lewis', y: '1961', note: 'Una familia de la Ciudad de México contándose a sí misma, grabada en cinta. Causó escándalo en su tiempo. Tiene la ficha de préstamo llena.' },
  ],
  filosofia: [
    { t: 'Apología de Sócrates', a: 'Platón', y: 's. IV a. C.', note: 'Un viejo acusado de corromper a los jóvenes se defiende sin pedir perdón. “Una vida sin examen no merece vivirse”, dice, y lo matan.', stat: 'palabra' },
    { t: 'La raza cósmica', a: 'José Vasconcelos', y: '1925', note: 'Un sueño enorme y discutible sobre la mezcla de los pueblos de América. Al margen, alguien escribió: “¿Y los negros de Jiquilpan, maestro?”.' },
    { t: 'El perfil del hombre y la cultura en México', a: 'Samuel Ramos', y: '1934', note: 'Un filósofo se pregunta por qué nos sentimos menos. El libro tiene una mancha de mole en el capítulo tres.' },
    { t: 'Meditaciones', a: 'Marco Aurelio', y: 's. II', note: 'Las notas que un emperador romano se escribía a sí mismo, de noche, en campaña, para no volverse un tirano. Corto, para leerlo de a poquito.', stat: 'palabra' },
  ],
  michoacan: [
    { fic: true, t: 'Jiquilpan: lugar del añil (monografía municipal)', a: 'Varios autores', y: '1985', note: 'Una monografía de las que hacía el gobierno: la fundación, el añil, los Cárdenas, los barrios. Fotos del jardín cuando el kiosco era de madera.', stat: 'corazon' },
    { fic: true, t: 'Afrodescendientes en la Ciénega de Chapala', a: 'Cuaderno de la Unidad Académica (UNAM)', y: '2010', note: 'Censos parroquiales del siglo XVIII: “mulatos libres”, “morenos”, arrieros, vaqueros, tintoreros de añil. Muchas familias de aquí están en esas listas sin saberlo.', stat: 'palabra' },
    { fic: true, t: 'El rebozo en Michoacán', a: 'Varios autores', y: '1998', note: 'Telares de cintura, el rapacejo anudado a mano, el bolita, el de seda. Tiene fotos de una tejedora de Jiquilpan con las manos azules.' },
    { fic: true, t: 'Cárdenas: cartas de campesinos', a: 'Compilación', y: '1978', note: 'Cartas escritas a mano al General: “le escribo porque usted sí escucha”. Una de un tal Nacho Marín, de 1939, pide una bomba para el pozo.' },
  ],
  literatura: [
    { t: 'Azul…', a: 'Rubén Darío', y: '1888', note: 'Cuentos y poemas de un nicaragüense de veintiún años que le cambió el idioma a medio continente. Del azul, decía, el color del sueño y del arte.', quote: '¡Amigo! El cielo está opaco; el aire, frío; el día, triste.', stat: 'corazon' },
    { t: 'Pedro Páramo', a: 'Juan Rulfo', y: '1955', note: 'Un hombre llega a un pueblo a buscar a su padre y lo encuentra lleno de murmullos. Es el préstamo vencido de tu abuela, o uno igualito.' },
    { t: 'Inundación castálida', a: 'Sor Juana Inés de la Cruz', y: '1689', note: 'Los versos de una monja que sabía más que todos los hombres que la rodeaban, y que se los dijo.', quote: 'Hombres necios que acusáis / a la mujer sin razón, / sin ver que sois la ocasión / de lo mismo que culpáis.', stat: 'palabra' },
    { t: 'La suave Patria', a: 'Ramón López Velarde', y: '1921', note: 'El poema de un jerezano que encontró la patria en las cosas chicas: la plaza, la novia, el santo de la iglesia.', quote: 'Patria: tu superficie es el maíz, / tus minas el palacio del Rey de Oros.', stat: 'corazon' },
    { t: 'Elevación', a: 'Amado Nervo', y: '1917', note: 'Los poemas de calma de un nayarita que viajó mucho y regresó a lo simple.', quote: 'Amé, fui amado, el sol acarició mi faz. / ¡Vida, nada me debes! ¡Vida, estamos en paz!', stat: 'corazon' },
  ],
  enciclopedias: [
    { t: 'Diccionario Porrúa de historia, biografía y geografía de México', a: 'Editorial Porrúa', y: '1964', note: 'Tres tomos que pesan como ladrillos. “JIQUILPAN DE JUÁREZ: municipio del estado de Michoacán…” Alguien subrayó “de Juárez” con pluma roja.' },
    { t: 'El Tesoro de la Juventud', a: 'Enciclopedia', y: 'años 50', note: 'Veinte tomos verdes: “El libro de los porqués”, “Cosas que debemos saber”, “Los países y sus costumbres”. Con láminas de colores que se despegan.' },
    { t: 'Enciclopedia de México', a: 'José Rogelio Álvarez (dir.)', y: '1977', note: 'Doce tomos. El de la J tiene una foto de la Aguadora en blanco y negro.' },
    { t: 'Atlas Nacional de México', a: 'Instituto de Geografía, UNAM', y: '1990', note: 'Mapas de lluvias, de suelos, de lenguas. La Ciénega de Chapala, en el mapa de humedales, aparece como una mancha azul enorme.' },
  ],
  arte: [
    { t: 'Autobiografía', a: 'José Clemente Orozco', y: '1945', note: 'El pintor cuenta su vida con mal genio y buen humor: los muros, los críticos, la pólvora que le quitó una mano de joven.' },
    { fic: true, t: 'El muralismo mexicano', a: 'Varios autores', y: '1980', note: 'Orozco, Rivera, Siqueiros. Hay una foto pequeña de esta misma biblioteca, con andamios.' },
    { fic: true, t: 'Arte popular de Michoacán', a: 'Varios autores', y: '1994', note: 'Las lacas de Uruapan, los cobres de Santa Clara, las guitarras de Paracho, los rebozos, los huaraches y las máscaras de los Negritos.' },
    { fic: true, t: 'Feliciano Béjar: los magiscopios', a: 'Catálogo de exposición', y: '1975', note: 'Esferas de cristal y acero de un pintor de aquí que jugaba con la luz. En la portada, la luz se parte en siete colores.' },
  ],
  infantil: [
    { t: 'Corazón: diario de un niño', a: 'Edmondo De Amicis', y: '1886', note: 'El diario de un niño de Turín durante un año escolar. Doña Olga dice que con este aprendió a llorar leyendo.', stat: 'corazon' },
    { t: 'El Principito', a: 'Antoine de Saint-Exupéry', y: '1943', note: 'Un aviador perdido en el desierto y un niño que viene de un asteroide. Tiene dibujado, con crayola, un borrego dentro de una caja.' },
    { t: 'Platero y yo', a: 'Juan Ramón Jiménez', y: '1914', note: 'Un poeta y su burro, que es blando y peludo. Lo leen en voz alta los viernes en el rincón infantil.' },
    { t: 'Versos sencillos', a: 'José Martí', y: '1891', note: 'Versos de un cubano que se aprenden de memoria sin querer.', quote: 'Cultivo una rosa blanca / en junio como en enero / para el amigo sincero / que me da su mano franca.', stat: 'corazon' },
  ],
};

// What the bookshop on the plaza sells (you can give them away, or read them in your bag).
export const SHOP_BOOKS = [
  ['libro_azul', 'Azul… — Rubén Darío', '📘', 120, 'Edición de bolsillo, con un prólogo nuevo.'],
  ['libro_paramo', 'Pedro Páramo — Juan Rulfo', '📗', 180, 'La edición de siempre, la de la tarea.'],
  ['libro_vilo', 'Pueblo en vilo — Luis González y González', '📙', 260, 'La microhistoria de San José de Gracia.'],
  ['libro_sorjuana', 'Poemas — Sor Juana Inés de la Cruz', '📕', 140, 'Antología escolar con notas.'],
  ['libro_principito', 'El Principito', '📒', 150, 'Para regalar. Siempre es para regalar.'],
  ['libro_laberinto', 'El laberinto de la soledad — Octavio Paz', '📓', 210, 'Ensayo. Muy subrayable.'],
];
