# Xiquilpan: Las Luces del Cerro

Un RPG de acción y aventura ambientado en **Jiquilpan de Juárez, Michoacán**. Es una web app instalable (PWA) que funciona en el celular (Android y iPhone) y en la computadora.

> *Tu abuelo Miguel y su hermano Toño subieron a acampar al Cerro de San Francisco a “ver las luces”… y no han bajado.*

## Cómo jugar

- **Celular:** abre la página y agrégala a la pantalla de inicio. En iPhone: *Compartir → Agregar a inicio*. En Android: *menú ⋮ → Instalar app*. Luego se abre a pantalla completa y funciona sin conexión.
- **Controles táctiles:** el stick para caminar aparece donde pongas el dedo, en la mitad izquierda de la pantalla. **A** sirve para hablar, entrar y usar. **B** es para correr.
- **Teclado:** flechas o WASD para caminar, **Shift** para correr, **Espacio/E** para interactuar, **M** abre el mapa, **I** el morral y **J** el diario.

## Correrlo en tu computadora

No necesita compilarse. Basta con cualquier servidor estático:

```bash
npx http-server -p 8080 .
# abre http://localhost:8080
```

Para publicarlo, sube la carpeta a GitHub Pages, Netlify o cualquier hosting estático. El service worker (`sw.js`) guarda el juego para jugarlo sin conexión.

## La historia

1. **¿Han visto a mi abuelo?** Pregúntale al pueblo: a Rosita la del café, a Chuy el taxista, a Don Lupe del Chamacuero y a Don Refugio de los pajaretes. Consigue una linterna y sube al cerro.
2. **El Cerro de San Francisco.** Por el camino empedrado llegas al pueblito y su capilla, y de ahí a la cruz de la cima. Esa noche bajan las luces. Don Toño le apunta con su rifle al visitante y todo se congela. El ser gris los mira a los ojos, les da un mensaje y les deja una **mancha color añil** en la mano.
3. **Cinco meses.** Bajan convencidos de que pasaron cinco días, pero han pasado cinco meses: las jacarandas están en flor y hay carteles de “SE BUSCA”. En la plaza los reciben con burlas y los llaman “los marcianos del cerro”. Te toca juntar pruebas.
4. **Dos años después: La Noche del Añil.** La tecnología ha ido enfriando al pueblo. Tu tarea es tejer un **rebozo añil**: cada **hilo** es una conversación verdadera en la que escuchaste a alguien sin sacar el celular. Con suficientes hilos y aliados, un viernes en la noche el pueblo se reúne en el kiosco sin pantallas… y las luces vuelven, esta vez para todos.

**El giro:** *Xiquilpan* significa “lugar del jiquilite”, la planta del añil. El visitante también tiene la mano teñida de añil. Una carta de 1940 en el archivo de la UNAM habla de “un hombre de manos azules que dijo venir de lo que seremos”.

## Lo que hay en el pueblo

El norte está arriba. La **Av. Presidente Lázaro Cárdenas** cruza el pueblo de norte a sur. Hacia el norte sale a Sahuayo; hacia el sur pasa por la Biblioteca, la Casa de Cárdenas, “La Tipo” y el estadio, y termina en los bosques y el camino al cerro.

- **Plaza Principal:**
  - Al centro, el kiosco blanco con barandal de hierro negro y cúpula oscura, y la **Fuente de la Aguadora** (la mujer con el cántaro en la cabeza, bajo su cúpula de talavera).
  - Ficus podados en cubo con el tronco encalado, jardines con reja de hierro y bancas.
  - En la esquina **noroeste**, la casona de **Don Nacho Marín**. Luego el andador y la **Casa de la Cultura**; detrás de ella, al final del andador, se pone **Tacos El Güero** en la noche, junto a “los tubos”.
  - Al sur, los **portales** con La Cochera, la nevería y el Hotel Plaza Tarasca. En la esquina **sureste**, el **Portal Azul**; pasando los portales, la **Tortillería Marín** del hijo de Don Nacho.
  - Al oriente, el **Parque Ignacio Zaragoza**, con la estatua del general y los **dos galgos de Durenne** mirando al oriente.
- **Frente al parque, cruzando la avenida:** el **Palacio Municipal** (frente de columnas y letrero PALACIO MUNICIPAL) con el **busto de Diego José Abad**, donado por Bolonia. Más allá, el mercado y la Panadería Mendoza con el billar arriba.
- **Templos:**
  - La **Parroquia de San Francisco** (Fajardo y Abasolo): fachada amarilla con sillares rojos en zigzag, torre de cantera oscura a la izquierda, curato y atrio.
  - El **Santuario del Sagrado Corazón**: torres de ladrillo rojo con reloj y pórtico rosa neoclásico.
  - Las Monjas y la capilla de **San Cayetano**, en cuyo barrio está el taller de rebozos de **Doña Amparo**.
- **Sobre la avenida, al sur:**
  - La **Biblioteca Gabino Ortiz**.
  - La **Casa de Lázaro Cárdenas**, frente a la escuela **“La Tipo”**.
  - La **Portada del Estadio 18 de Marzo** con su águila y las palabras de Cárdenas: *“Los recursos naturales del país deben servir para su propia prosperidad. Entregarlos a intereses extraños es traicionar la patria.”*
  - Adentro del estadio: el **palenque** (gallos y bailes de noviembre a Reyes), las canchas de básquet y el campo de béisbol.
  - Al oriente, la **UAER de la UNAM** (con el jeep del General) y el **Monumento a Lázaro Cárdenas**.
  - Al sur del estadio, **El Santo Remedio** (“el Santo Mugrero”) y **Ferretuberías**, cuyo dueño casi nunca está.
- **Norte:** el **Jardín de la Paz** está entre la avenida y la calle Fajardo, frente a la **Cremería La Paz**. Se inunda con los aguaceros, y los viernes se pone ahí el tianguis.
- **Oriente:** la casa de la abuela, el Hospital General y las micheladas de Nico y La Pantera Rosa. En la **entrada** están la glorieta “Pueblo Mágico”, los gallos, las letras blancas, el Hotel Palmira con su neón, el OXXO, la PEMEX, el panteón y el Río Jiquilpan.
- **Poniente:**
  - **Av. Las Palmas** en diagonal, con su camellón de palmeras, la **Fuente de los Pescados** y la tortillería (Maseca) en la curva.
  - El **cerrito de La Trasquila**, con la escalinata, el mirador de balaustrada blanca y roja y el **Monumento a Juárez**, y el obelisco (“la botella”).
- **Noroeste:** el **Santuario del Sagrado Corazón** y **Las Monjas**. Más allá están el **Panteón Municipal** y la colonia del panteón, de donde sale el camino de terracería al cerro.
- **Sur:**
  - Los **bosques Cuauhtémoc y Juárez**, de eucalipto, jacaranda, fresno y matorral; sin pinos.
  - La **Portada de Juárez**, de piedra volcánica con sus dos arcos.
  - **La Casita de Piedra**, donde se venden los rebozos.
- **El Cerro de San Francisco:**
  - Se sube por el noroeste, por un camino pedregoso donde casi no pasan carros (uno o dos al día). Primero está **la subida mágica**, donde los carros “suben solos”, con el **Rancho de Novoa**. Luego vienen **La Piedrita**, una caidita de agua donde se ven las luces, y el **Rancho de los Salazar** con sus caballos.
  - Hasta arriba están el pueblito de San Francisco, con su capilla y un par de tiendas, la cruz y la antena. Los pinos crecen sólo allá arriba.
  - En las laderas hay magueyes gigantes, nopales, vacas, caballos y piedras por todos lados. Algunas se pueden mover, y debajo a veces hay algo.
- **Calles y clima:**
  - En el centro, las calles son de **laja** (losas irregulares de cantera rosa y café), con faroles rojo y blanco. Afuera hay asfalto negro con baches, o empedrado; ninguna calle tiene raya a la mitad.
  - Las calles del centro son angostas y de un solo sentido, con un carril donde se estacionan carros e Italikas. Los carros ya no se atraviesan: respetan su carril, esperan su turno en las esquinas y se detienen si alguien está enfrente.
  - Las casas del centro son blancas, con guardapolvo rojo, marcos de cantera y balcones de herrería. Las de las colonias son de colores, y algunas tienen el segundo piso en obra negra.
  - Cuando llueve fuerte, el agua corre por las orillas de las calles cuesta abajo (por la Vicente Guerrero, desde el lado alto de Las Palmas) y el **Jardín de la Paz se inunda**.
- **Casas y negocios:**
  - Se puede entrar a casi todo. Cada casa es de una familia (Farías, Betancourt, Valencia, Moreno, Cárdenas, Silva, Martínez, Flores, Núñez, Grimaldo, Méndez, Mendoza, Ochoa, Coit…) y tiene roperos, baúles y macetas donde buscar dinero, recuerdos y pistas.
  - Algunas casas tienen barandal. En la noche hay quien prende **ocote** afuera de su casa.
  - Cada tiendita tiene su dueño.
- **Gente:**
  - El historiador **Álvaro Ochoa** viene de Zamora a dar pláticas: los jueves en la Casa de la Cultura y los viernes en la UAER.
  - Los fines de semana hay **carnitas y chicharrones** en las esquinas de Rioseco con Diego José Abad y de Fajardo con 5 de Mayo.
  - Muchos se burlan de tu abuelo y tienen su teoría sobre las luces: drones, Starlink, globos de Cantoya, cohetes de Sahuayo o Venus.
- **Alrededores:** Sahuayo, Totolán, La Lagunita, Abadiano, Paredones y Francisco Sarabia aparecen en el mapa y en los letreros, pero por ahora sus caminos están cerrados. La historia pasa en Jiquilpan.
- **Placas:** de Ramón Martínez Ocaranza, Federico Canessi, Feliciano Béjar, Gabino Ortiz, Diego José Abad y Lázaro Cárdenas.
- **Comida y bebida:**
  - En el mercado hay tres Birrias El Cano (los tres dicen ser el original), tortas, jugos, chiles rellenos, huevos de codorniz con jerez, carnicería y verduras.
  - Hay tres puestos de **Tacos El Güero** (el salado, el de la salsa aguada y el bueno), las carnitas de la camioneta roja (la salsa enchila) y la birria de Guatemala.
  - Para tomar: Micheladas Lupita, Norma, Nico, La Pantera Rosa y del Bosque, y Mezcal El Chamacuero.
  - Además: el café de Rosita, fruta, garbanzos, churros y gelatinas de rompope.
- **Pajaretes:** Don Refugio vende en sus corrales, al noreste. Un litro de leche cuesta $5, o te lo **fía**. Si no pagas, el pueblo se entera.
- **Tianguis:** los viernes en el Jardín de la Paz. Los sábados cierran la Fajardo junto al mercado y la calle del bosque, con birria de Guatemala.

## Vivir en Jiquilpan (al estilo Fable)

- **Conversaciones cerradas:** no se escribe texto libre. En cada plática escoges una respuesta: **amable**, **chistosa**, **honesta** o **grosera**. Eso cambia tus valores, tu título en el pueblo (“El Muchacho Amable”, “El Chistoso de los Portales”…) y lo que cada quien piensa de ti.
- **Relaciones:** en *Convivir…* puedes hacer cumplidos, echar carrilla, dar regalos (a cada quien le gustan cosas distintas) y pedir favores de amigos. Las relaciones van de *Mal visto* a *Compadre*. Con los amigos hay precio de amigo en sus tiendas. Con algunas personas puedes salir a dar la vuelta a la plaza y llegar a ser novios. La pestaña **Gente** muestra a todos los que conoces y cómo te ven.
- **Ropa y look:** en Ropa y Novedades (calle Abasolo), en el tianguis y en la Estética Lupita compras camisas, guayaberas, texanas, huaraches, cortes de pelo, bigote o barba. Te cambias desde la pestaña **Yo** o en el ropero de tu casa.
- **Tu casa:** junto al estadio y cerca del río hay terrenos con letrero de **SE VENDE**. Compras uno y contratas al maestro albañil. Escoges el estilo (colonial, adobe y teja, ladrillo o de colores) y pagas cada etapa: cimientos, muros, techo y acabados. Cada etapa tarda días, y ves cómo va subiendo la obra. Después le puedes agregar barandal, jardín con jacaranda, segundo piso o un local.
- **Negocios:** puedes comprar el puesto de elotes del Jardín de la Paz, hacerte socio de las Micheladas del Bosque o poner un taxi en el sitio de Abasolo. Si tu casa tiene local o segundo piso, puedes abrir una tiendita o una taquería, o rentar el cuarto. Cada mañana cobras lo que dejaron. La pestaña **Propiedades** lleva las cuentas.
- **Minijuegos:** la **lotería** de Doña Lety (viernes a domingo en la noche, con sus versos) y los turnos en la **Tortillería Marín**, donde volteas las tortillas cuando se inflan. También hay billar, peleas de gallos en el palenque (en temporada) y el trompo.
- **El Ayuntamiento:** el Presidente Municipal casi nunca está, y los regidores de Morena, PAN, PRI, PRD y Movimiento Ciudadano escuchan… y no hacen nada. El pueblo se ríe de ellos.
- **Misiones nuevas:**
  - *La foto de 1979*: Don Nacho Marín guarda una foto de las luces, y el historiador Álvaro Ochoa la autentifica.
  - *¿Dónde anda Güicho?*: hay que encontrar al dueño de Ferretuberías, que nunca está.
  - *Manos de tortillero*: un turno en la Tortillería Marín.
  - *El bache de la Vicente Guerrero*: juntas firmas, vas con los políticos y al final lo tapan los vecinos.
  - *¡Lotería!*: ganarle una partida a Doña Lety.
  - *Lucero, el caballo de los Salazar*: encontrar a la yegua y llevarla de vuelta.
  - *Una casa en Jiquilpan*: construir tu casa.
  - *La plática del historiador*.

## Quién eres cambia (al estilo Fable)

Tu personaje tiene cuatro valores: **Corazón** (bondad), **Palabra** (honestidad y deudas), **Fama** (lo que el pueblo cree de ti) y **Panza** (lo bien que comes). Cambian tu aspecto: si eres muy bondadoso te rodea un aura, si eres grosero tu ropa se ve descuidada y los perros te ladran, y los tacos se te notan en la panza. Enchilarse y “andar alegre” también se ven. Los vecinos comentan todo eso cuando les hablas.

## Conversaciones que siempre son nuevas

- **Sin conexión:** un generador de diálogos arma lo que dice cada vecino a partir del clima, la hora, el día, el lugar, tu reputación, el capítulo, los chismes y la personalidad de cada quien. 
- **Con IA (opcional):** las respuestas del jugador siempre se eligen de una lista. En *Ajustes → Voces con IA* puedes poner una API key de Anthropic o la URL de tu propio proxy. Con eso, lo que cada personaje te dice al platicar se genera en vivo con Claude (`claude-opus-5-5` por defecto), según su personalidad y el momento. La key se guarda sólo en tu dispositivo. Para una versión pública conviene usar un proxy para no exponer la key.

## Clima y hora reales

Si hay internet, el juego usa el **clima actual de Jiquilpan** (Open-Meteo, sin key): si allá está lloviendo, en el juego también. En Ajustes puedes activar además la **hora real de Jiquilpan** (zona America/Mexico_City). Sin conexión, el clima se simula: en temporada de lluvias (junio a octubre) caen tormentas por la tarde. Las jacarandas florecen de febrero a abril.

## Estructura del código

```
index.html, css/style.css, manifest.webmanifest, sw.js, icons/
js/main.js          arranque y loop
js/game.js          estado, jugador, interacciones, tiendas, taxis, guardado
js/renderer.js      chunks del terreno, sprites ordenados por Y, luz, clima
js/render/*.js      arte vectorial: terreno, casas, monumentos, personajes
js/render/jiquilpan.js  edificios y monumentos propios de Jiquilpan (a partir de fotos)
js/life.js          relaciones, ropa, terrenos, construcción y negocios
js/minigames.js     lotería y tortillería
js/data/town.js     trazo del pueblo (calles, manzanas, monumentos, tianguis)
js/data/regions.js  Cerro de San Francisco y los pueblos cercanos
js/data/interiors.js interiores (mercado, templos, biblioteca, UNAM…)
js/data/npcs.js     personajes, personalidades y horarios
js/npcs.js          horarios, multitud, tráfico y animales
js/dialogue.js      conversación: guion + generador + IA
js/quests.js        historia y misiones secundarias
js/cutscene.js      escenas (el cerro, los saltos de tiempo, el final)
tests/              pruebas automatizadas con Playwright
```

## Sobre la fidelidad al pueblo

Todo el arte está dibujado por código, sin fotos. El trazo sigue lo que se sabe del pueblo real: nombres de calles, la ubicación de la plaza, los portales, el Palacio, San Francisco, la Biblioteca, la Casa de Cárdenas, la UAER, el estadio y los bosques. También sigue el relieve: el valle sube hacia el sur y hacia La Trasquila. Las fachadas de San Francisco, el Sagrado Corazón, la Portada de Juárez, la Aguadora y el kiosco están hechas a partir de fotos.

Aun así, las distancias están comprimidas y muchas cuadras son aproximadas. Los personajes son ficticios, salvo las figuras históricas de las placas y el historiador Álvaro Ochoa, que aparece como homenaje. El trazo está en `js/data/town.js`; los edificios propios de Jiquilpan están en `js/render/jiquilpan.js` y el resto en `js/render/landmarks.js`.
