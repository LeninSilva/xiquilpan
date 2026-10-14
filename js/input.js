// Keyboard + on-screen touch controls (virtual stick, A/B buttons).
export class Input {
  constructor(root) {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered this frame
    this.stick = { x: 0, y: 0, active: false, id: null, ox: 0, oy: 0 };
    this.buttons = { a: false, b: false, item: false };
    this.enabled = true;
    const down = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this.buttons.a = this.buttons.b = false; this.stick.active = false; this.stick.x = this.stick.y = 0; });
    this.bindTouch(root);
  }
  bindTouch(root) {
    const zone = root.querySelector('#stickZone');
    const knob = root.querySelector('#stickKnob');
    const base = root.querySelector('#stickBase');
    this.knob = knob; this.base = base;
    const R = 46;
    const start = (e) => {
      for (const t of e.changedTouches || [e]) {
        if (this.stick.active) break;
        const id = t.identifier ?? 'mouse';
        this.stick.active = true; this.stick.id = id;
        this.stick.ox = t.clientX; this.stick.oy = t.clientY;
        base.style.left = (t.clientX - 60) + 'px'; base.style.top = (t.clientY - 60) + 'px';
        base.classList.add('on');
        move(e);
      }
      e.preventDefault();
    };
    const move = (e) => {
      if (!this.stick.active) return;
      for (const t of e.changedTouches || [e]) {
        const id = t.identifier ?? 'mouse';
        if (id !== this.stick.id) continue;
        let dx = t.clientX - this.stick.ox, dy = t.clientY - this.stick.oy;
        const d = Math.hypot(dx, dy);
        if (d > R) { dx *= R / d; dy *= R / d; }
        this.stick.x = dx / R; this.stick.y = dy / R;
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      e.preventDefault();
    };
    const end = (e) => {
      for (const t of e.changedTouches || [e]) {
        const id = t.identifier ?? 'mouse';
        if (id !== this.stick.id) continue;
        this.stick.active = false; this.stick.x = this.stick.y = 0; this.stick.id = null;
        knob.style.transform = 'translate(0,0)'; base.classList.remove('on');
      }
    };
    zone.addEventListener('touchstart', start, { passive: false });
    zone.addEventListener('touchmove', move, { passive: false });
    zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
    for (const [id, key] of [['btnA', 'a'], ['btnB', 'b'], ['btnItem', 'item']]) {
      const el = root.querySelector('#' + id);
      if (!el) continue;
      const on = (e) => { e.preventDefault(); if (!this.buttons[key]) this.pressed.add('btn' + key); this.buttons[key] = true; el.classList.add('on'); };
      const off = (e) => { e.preventDefault(); this.buttons[key] = false; el.classList.remove('on'); };
      el.addEventListener('touchstart', on, { passive: false }); el.addEventListener('touchend', off); el.addEventListener('touchcancel', off);
      el.addEventListener('mousedown', on); el.addEventListener('mouseup', off); el.addEventListener('mouseleave', off);
    }
  }
  axis() {
    let x = 0, y = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) x -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) x += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) y -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) y += 1;
    if (this.stick.active) { x += this.stick.x; y += this.stick.y; }
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    if (m < 0.18) return { x: 0, y: 0 };
    return { x, y };
  }
  get run() { return this.keys.has('shift') || this.buttons.b; }
  // action: Space / Enter / E / on-screen A
  action() { return this.pressed.has(' ') || this.pressed.has('enter') || this.pressed.has('e') || this.pressed.has('btna'); }
  // F / Q / the 🎯 button: use what is in your hand
  use() { return this.pressed.has('f') || this.pressed.has('q') || this.pressed.has('btnitem'); }
  cancel() { return this.pressed.has('escape') || this.pressed.has('btnb') || this.pressed.has('backspace'); }
  was(k) { return this.pressed.has(k); }
  endFrame() { this.pressed.clear(); }
}
