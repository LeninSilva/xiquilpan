// Tiny WebAudio synth: UI blips, jingles and ambience (birds, crickets, rain, a marimba-like son).
export class Audio {
  constructor() { this.ctx = null; this.on = true; this.nextNote = 0; this.amb = {}; }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
      // noise buffer for rain / wind / crowd
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      this.amb.rain = this.loopNoise(1200, 0.0); this.amb.crowd = this.loopNoise(500, 0.0, 'bandpass');
    } catch (e) { this.ctx = null; }
  }
  loopNoise(freq, gain, type = 'lowpass') {
    const src = this.ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = type === 'bandpass' ? 0.8 : 0.5;
    const g = this.ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(this.master); src.start();
    return g;
  }
  tone(freq, dur = 0.12, type = 'sine', vol = 0.15, when = 0, attack = 0.005) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  sfx(name) {
    if (!this.ctx || !this.on) return;
    switch (name) {
      case 'blip': this.tone(620 + Math.random() * 80, 0.04, 'triangle', 0.035); break;
      case 'select': this.tone(880, 0.06, 'triangle', 0.08); break;
      case 'menu': this.tone(520, 0.08, 'sine', 0.08); this.tone(780, 0.1, 'sine', 0.06, 0.05); break;
      case 'quest': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.09, i * 0.09)); break;
      case 'clue': [659, 784].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.1, i * 0.08)); break;
      case 'hilo': [392, 587, 784, 1175].forEach((f, i) => this.tone(f, 0.9, 'sine', 0.07, i * 0.14, 0.05)); break;
      case 'coin': this.tone(988, 0.08, 'square', 0.05); this.tone(1319, 0.2, 'square', 0.05, 0.07); break;
      case 'pickup': [784, 988, 1175].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.08, i * 0.06)); break;
      case 'door': this.tone(180, 0.15, 'triangle', 0.1); this.tone(140, 0.2, 'triangle', 0.08, 0.1); break;
      case 'honk': this.tone(415, 0.25, 'sawtooth', 0.05); this.tone(440, 0.25, 'sawtooth', 0.05); break;
      case 'bark': this.tone(300, 0.08, 'sawtooth', 0.06); this.tone(220, 0.1, 'sawtooth', 0.05, 0.12); break;
      case 'flap': for (let i = 0; i < 4; i++) this.tone(200 + Math.random() * 100, 0.05, 'triangle', 0.03, i * 0.05); break;
      case 'bell': [392, 392 * 2.01, 392 * 3.02].forEach((f, i) => this.tone(f, 2.5, 'sine', 0.12 / (i + 1), 0, 0.002)); break;
      case 'ufo': { const t = this.ctx.currentTime; const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(880, t + 3); o.frequency.exponentialRampToValueAtTime(110, t + 6); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 1); g.gain.linearRampToValueAtTime(0, t + 6); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 6.1); break; }
      case 'freeze': this.tone(55, 3, 'sine', 0.15, 0, 0.5); break;
      case 'enchilado': [880, 660, 440].forEach((f, i) => this.tone(f, 0.12, 'square', 0.04, i * 0.08)); break;
    }
  }
  // called every frame with the environment
  ambience(game, dt) {
    if (!this.ctx || !this.on) { if (this.ctx && this.amb.rain) { this.amb.rain.gain.value = 0; this.amb.crowd.gain.value = 0; } return; }
    const env = game.env, h = game.clock.hour, outdoor = game.map.outdoor;
    const k = Math.min(1, dt * 2);
    this.amb.rain.gain.value += ((outdoor ? env.rainAmt * 0.35 : env.rainAmt * 0.08) - this.amb.rain.gain.value) * k;
    const crowd = game.map.id === 'town' ? (game.npcs.crowd.filter(c => Math.abs(c.x - game.player.x) < 200 && Math.abs(c.y - game.player.y) < 160).length / 40) : (game.map.id === 'mercado' ? 0.5 : 0);
    this.amb.crowd.gain.value += (Math.min(0.12, crowd * 0.12) - this.amb.crowd.gain.value) * k;
    if (game.frozen || game.cutsceneActive === 'ufo') return;
    this.nextNote -= dt;
    if (this.nextNote > 0) return;
    this.nextNote = 0.35 + Math.random() * 0.5;
    if (!outdoor) return;
    if (h > 20 || h < 5.5) { // crickets
      if (Math.random() < 0.7) for (let i = 0; i < 3; i++) this.tone(4200 + Math.random() * 300, 0.03, 'sine', 0.012, i * 0.06);
    } else if (h < 10 && Math.random() < 0.5 && env.rainAmt < 0.2) { // birds
      const f = 2000 + Math.random() * 1500; this.tone(f, 0.08, 'sine', 0.02); this.tone(f * 1.2, 0.06, 'sine', 0.018, 0.09);
    }
    // a gentle marimba melody in the plaza by day (pentatonic, like a son abajeño heard from afar)
    if (game.map.id === 'town' && h > 9 && h < 21 && env.rainAmt < 0.3 && game.placeKey() === 'plaza' && Math.random() < 0.55) {
      const scale = [392, 440, 494, 587, 659, 784, 880];
      const f = scale[Math.floor(Math.random() * scale.length)];
      this.tone(f, 0.5, 'triangle', 0.03); this.tone(f * 2, 0.25, 'sine', 0.012, 0.01);
      this.nextNote = 0.25 + Math.random() * 0.3;
    }
  }
}
