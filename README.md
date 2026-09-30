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

- **Centro:** el Jardín Zaragoza con su kiosco, la Fuente de la Aguadora (Canessi) y la fuente de la plaza. También el Palacio Municipal con portal de arcos, el Portal Azul, los portales con La Cochera y la nevería, y la Casa de la Cultura con “los tubos”.
- **Templos:** la Parroquia de San Francisco (con su atrio), el Santuario del Sagrado Corazón (rosa, neoclásico), el Templo de las Monjas con su claustro, la Capilla de San Cayetano y la capilla del cerro.
- **Monumentos y lugares:** la Biblioteca Gabino Ortiz (con los murales de Orozco y su puerta de bronce), la UNAM de Estudios Regionales con el jeep del General Cárdenas, y el obelisco (“la botella”). También Av. Las Palmas con su camellón de palmeras, la Fuente de los Pescados y la curva de la tortillería, y el Parque Juárez con su portada, la escalinata y el Monumento a Juárez. Además el Estadio 18 de Marzo con la portada del águila, el campo de béisbol y las canchas de básquet, el Monumento a Lázaro Cárdenas y el Bosque Cuauhtémoc.
- **Entrada:** la glorieta “Jiquilpan, Pueblo Mágico”, los gallos, las letras blancas, el Hotel Palmira con su neón, el OXXO, la PEMEX y el Panteón.
- **Comida y bebida:** el mercado tiene tres Birrias El Cano (los tres dicen ser el original), tortas, jugos, chiles rellenos, huevos de codorniz con jerez, carnicería y verduras. Afuera está la Panadería Mendoza, con billar arriba. Hay tres puestos de **Tacos El Güero** (el salado, el de la salsa aguada y el bueno, junto a los tubos), las carnitas de la camioneta roja (cuidado con la salsa, que enchila) y la birria de Guatemala. Para tomar: Micheladas Lupita, Norma, Nico, La Pantera Rosa y del Bosque. También Mezcal El Chamacuero, la tienda “Frijoles”, la carnicería de la esquina, fruta picada, garbanzos, churros, gelatinas de rompope y el café de Rosita.
- **Pajaretes:** Don Refugio y sus vacas negras, cafés y pintas. Un litro de leche cuesta $5, o te lo **fía**. Si no pagas, el pueblo se entera.
- **Tianguis:** los viernes en el Jardín de la Paz. Los sábados cierran la calle Morelos junto al mercado y ponen otro junto al estadio.
- **Alrededores (en taxi):** Totolán, Abadiano, Francisco Sarabia y el pueblito de San Francisco en la cima del cerro. Hay sitios de taxis frente a la Biblioteca, junto al Mercado y Palacio, y en la entrada junto al OXXO.
- **Vida diaria:** a primera hora corredores en el bosque y el café de Rosita. En la mañana, los empleados rumbo al Ayuntamiento. De día, estudiantes y compradores. Los domingos hay misa. En la tarde se llenan las micheladas, y los viernes en la noche la plaza y los portales se llenan de gente. De noche salen los taqueros y los carros dan vueltas en el bosque. Pasan taxis, Italikas, camionetas y el grupo ciclista de **Los Rinos**.

## Quién eres cambia (al estilo Fable)

Tu personaje tiene cuatro valores: **Corazón** (bondad), **Palabra** (honestidad y deudas), **Fama** (lo que el pueblo cree de ti) y **Panza** (lo bien que comes). Cambian tu aspecto: si eres muy bondadoso te rodea un aura, si eres grosero tu ropa se ve descuidada y los perros te ladran, y los tacos se te notan en la panza. Enchilarse y “andar alegre” también se ven. Los vecinos comentan todo eso cuando les hablas.

## Conversaciones que siempre son nuevas

- **Sin conexión:** un generador de diálogos arma lo que dice cada vecino a partir del clima, la hora, el día, el lugar, tu reputación, el capítulo, los chismes y la personalidad de cada quien. También entiende texto libre por palabras clave.
- **Con IA (opcional):** en *Ajustes → Conversación libre con IA* puedes poner una API key de Anthropic o la URL de tu propio proxy. Cada personaje responde en vivo con Claude (`claude-opus-5-5` por defecto), con su personalidad, lo que sabe y el contexto del momento. La key se guarda sólo en tu dispositivo. Para una versión pública conviene usar un proxy para no exponer la key.

## Clima y hora reales

Si hay internet, el juego usa el **clima actual de Jiquilpan** (Open-Meteo, sin key): si allá está lloviendo, en el juego también. En Ajustes puedes activar además la **hora real de Jiquilpan** (zona America/Mexico_City). Sin conexión, el clima se simula: en temporada de lluvias (junio a octubre) caen tormentas por la tarde. Las jacarandas florecen de febrero a abril.

## Estructura del código

```
index.html, css/style.css, manifest.webmanifest, sw.js, icons/
js/main.js          arranque y loop
js/game.js          estado, jugador, interacciones, tiendas, taxis, guardado
js/renderer.js      chunks del terreno, sprites ordenados por Y, luz, clima
js/render/*.js      arte vectorial: terreno, casas, monumentos, personajes
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

Todo el arte está dibujado por código, sin fotos. El trazo del pueblo es una **interpretación** basada en descripciones públicas de Jiquilpan: la ubicación relativa de la plaza, los templos, Las Palmas, el estadio, el bosque, el cerro y la entrada. Durante el desarrollo no hubo acceso a imágenes ni a mapas satelitales, así que las proporciones, las fachadas y algunos nombres de calles son aproximados. Los personajes y sus historias son ficticios. Si tienes fotos o correcciones (la orientación de un templo, el color de una fachada, el nombre real de una calle), el trazo está en `js/data/town.js` y cada edificio en `js/render/landmarks.js`, así que es fácil ajustarlo.
