// Offline cache for the web app (network-first for code, so updates arrive quickly).
const CACHE = 'xiquilpan-v4';
const CORE = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/main.js', 'js/game.js', 'js/util.js', 'js/world.js', 'js/input.js', 'js/renderer.js', 'js/entities.js', 'js/npcs.js', 'js/dialogue.js',
  'js/quests.js', 'js/ui.js', 'js/audio.js', 'js/llm.js', 'js/time.js', 'js/cutscene.js', 'js/life.js', 'js/minigames.js', 'js/driving.js', 'js/dogs.js', 'js/dogquest.js',
  'js/render/ground.js', 'js/render/structures.js', 'js/render/landmarks.js', 'js/render/jiquilpan.js', 'js/render/art.js', 'js/render/people.js',
  'js/render/cars.js', 'js/render/props.js', 'js/render/sky.js',
  'js/data/town.js', 'js/data/build.js', 'js/data/regions.js', 'js/data/interiors.js', 'js/data/npcs.js', 'js/data/items.js', 'js/data/lines.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // APIs & CDNs go straight to the network
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
