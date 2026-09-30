// Boot & main loop.
import { Game } from './game.js';

const loading = document.getElementById('loading');
function boot() {
  try {
    const game = new Game();
    window.__game = game; // handy for debugging & automated tests
    game.init();
    loading.classList.add('hidden');
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      try { game.frame(dt); } catch (e) { console.error(e); game.reportError?.(e); }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  } catch (e) {
    console.error(e);
    loading.textContent = 'Algo salió mal al cargar: ' + e.message;
  }
}
boot();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
