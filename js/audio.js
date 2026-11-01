// Som sintetizado com Web Audio: efeitos e uma trilha em loop (sem arquivos externos).

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MINOR = { 4: 3, 9: 8, 11: 10 };
const toMinor = (m) => {
  const pc = ((m % 12) + 12) % 12;
  return MINOR[pc] !== undefined ? m - pc + MINOR[pc] : m;
};

// Melodia original simples, 8 compassos de 16 semicolcheias: [passo, nota, duração].
const MELODY = [
  [[0, 72, 2], [2, 76, 2], [4, 79, 2], [6, 76, 2], [8, 77, 2], [10, 76, 2], [12, 74, 2], [14, 72, 2]],
  [[0, 74, 2], [2, 71, 2], [4, 67, 3], [7, 71, 1], [8, 74, 2], [10, 79, 2], [12, 77, 2], [14, 74, 2]],
  [[0, 72, 2], [2, 76, 2], [4, 81, 3], [7, 79, 1], [8, 76, 2], [10, 72, 2], [12, 74, 2], [14, 76, 2]],
  [[0, 77, 3], [3, 76, 1], [4, 74, 2], [6, 72, 2], [8, 69, 4], [12, 71, 2], [14, 74, 2]],
  [[0, 76, 2], [2, 79, 2], [4, 84, 2], [6, 79, 2], [8, 81, 2], [10, 79, 2], [12, 76, 2], [14, 74, 2]],
  [[0, 74, 3], [3, 79, 1], [4, 83, 2], [6, 79, 2], [8, 74, 4], [12, 71, 2], [14, 74, 2]],
  [[0, 76, 2], [2, 72, 2], [4, 69, 2], [6, 72, 2], [8, 76, 2], [10, 81, 2], [12, 79, 2], [14, 76, 2]],
  [[0, 77, 2], [2, 74, 2], [4, 71, 2], [6, 74, 2], [8, 72, 6], [14, 67, 2]],
];
const CHORDS = [
  [36, 'M'],
  [43, 'M'],
  [45, 'm'],
  [41, 'M'],
  [36, 'M'],
  [43, 'M'],
  [45, 'm'],
  [43, 'M'],
];

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicOn = false;
    this.mood = { minor: false, cutoff: 5200 };
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(ctx.destination);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.8;
      this.sfxBus.connect(this.master);
      this.musicFilter = ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = this.mood.cutoff;
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.32;
      this.musicBus.connect(this.musicFilter);
      this.musicFilter.connect(this.master);
      const len = ctx.sampleRate;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  // ------------------------------------------------------------ Síntese

  tone(freq, t, dur, { type = 'square', gain = 0.1, dest, attack = 0.004, slide = null, release = 0.04 } = {}) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(t, dur, { gain = 0.2, type = 'lowpass', freq = 1200, endFreq = null, q = 0.8, dest } = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest || this.sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'jump':
        this.tone(320, t, 0.14, { type: 'square', gain: 0.07, slide: 760 });
        break;
      case 'shoot':
        this.tone(980, t, 0.07, { type: 'square', gain: 0.035, slide: 260 });
        this.noise(t, 0.05, { gain: 0.05, type: 'highpass', freq: 3000 });
        break;
      case 'hit':
        this.tone(640, t, 0.06, { type: 'triangle', gain: 0.08, slide: 380 });
        break;
      case 'explosion':
        this.noise(t, 0.55, { gain: 0.32, type: 'lowpass', freq: 1400, endFreq: 160 });
        this.tone(110, t, 0.35, { type: 'sine', gain: 0.3, slide: 38 });
        break;
      case 'death':
        this.tone(520, t, 0.75, { type: 'sawtooth', gain: 0.09, slide: 70, release: 0.3 });
        this.noise(t, 0.5, { gain: 0.25, type: 'lowpass', freq: 1800, endFreq: 200 });
        break;
      case 'stop':
        this.tone(240, t, 0.12, { type: 'sine', gain: 0.22, slide: 130 });
        this.noise(t, 0.05, { gain: 0.06, type: 'bandpass', freq: 900 });
        break;
      case 'deny':
        this.tone(150, t, 0.09, { type: 'square', gain: 0.06 });
        this.tone(120, t + 0.11, 0.12, { type: 'square', gain: 0.06 });
        break;
      case 'drop':
        this.tone(1300, t, 0.55, { type: 'sine', gain: 0.03, slide: 420, release: 0.1 });
        break;
      case 'rocket':
        this.noise(t, 1.1, { gain: 0.16, type: 'bandpass', freq: 300, endFreq: 2400, q: 1.2 });
        break;
      case 'phase':
        [72, 76, 79, 84].forEach((n, i) => this.tone(midi(n), t + i * 0.07, 0.22, { type: 'triangle', gain: 0.07 }));
        break;
      case 'save':
        this.tone(midi(79), t, 0.12, { type: 'triangle', gain: 0.08 });
        this.tone(midi(84), t + 0.1, 0.22, { type: 'triangle', gain: 0.08 });
        break;
      case 'click':
        this.tone(820, t, 0.045, { type: 'triangle', gain: 0.06 });
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------ Música

  setLook(look) {
    const moods = {
      color: { minor: false, cutoff: 5200 },
      gray: { minor: true, cutoff: 2600 },
      sepia: { minor: false, cutoff: 1500 },
      night: { minor: true, cutoff: 1100 },
    };
    this.mood = moods[look] || moods.color;
    if (this.musicFilter) this.musicFilter.frequency.setTargetAtTime(this.mood.cutoff, this.ctx.currentTime, 0.3);
  }

  startMusic() {
    if (!this.ctx) return;
    if (this.musicOn) return;
    this.musicOn = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stopMusic() {
    this.musicOn = false;
    clearInterval(this.timer);
    this.timer = null;
  }

  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const spb = 60 / 112 / 4; // duração de uma semicolcheia
    // se o navegador atrasou o timer (aba em segundo plano), pula as notas perdidas
    if (this.nextTime < this.ctx.currentTime - 0.05) this.nextTime = this.ctx.currentTime + 0.02;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime, spb);
      this.step = (this.step + 1) % (16 * MELODY.length);
      this.nextTime += spb;
    }
  }

  playStep(step, t, spb) {
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const minor = this.mood.minor;
    const n = (m) => (minor ? toMinor(m) : m);
    const bus = this.musicBus;
    const [root, q] = CHORDS[bar];

    // bateria
    if (s === 0 || s === 8 || s === 10) this.tone(120, t, 0.13, { type: 'sine', gain: 0.32, slide: 42, dest: bus });
    if (s === 4 || s === 12) this.noise(t, 0.12, { gain: 0.1, type: 'bandpass', freq: 1900, q: 0.7, dest: bus });
    if (s % 2 === 0) this.noise(t, 0.03, { gain: s % 4 === 2 ? 0.05 : 0.025, type: 'highpass', freq: 7000, dest: bus });

    // baixo
    const bassPat = { 0: 0, 3: 0, 6: 12, 8: 0, 11: 7, 14: 12 };
    if (bassPat[s] !== undefined) this.tone(midi(n(root + bassPat[s])), t, spb * 1.8, { type: 'triangle', gain: 0.2, dest: bus });

    // arpejo
    const third = q === 'm' ? 3 : 4;
    const arp = [0, third, 7, 12];
    if (s % 2 === 1) {
      const note = root + 24 + arp[((s - 1) / 2) % 4];
      this.tone(midi(n(note)), t, spb * 0.9, { type: 'triangle', gain: 0.035, dest: bus });
    }

    // melodia
    for (const [st, note, len] of MELODY[bar]) {
      if (st === s) this.tone(midi(n(note)), t, spb * len * 0.92, { type: 'square', gain: 0.045, dest: bus, release: 0.05 });
    }
  }
}
