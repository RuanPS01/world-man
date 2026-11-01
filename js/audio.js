// Som: a trilha original "Mundo Pequeno" (arquivo MP3) com filtros que mudam
// a cada época, e efeitos sonoros sintetizados com Web Audio.

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.wantMusic = false;
    this.musicBuffer = null;
    this.musicSrc = null;
    this.raw = null;
    this.profile = { hp: 20, lp: 20000, peakF: 1000, peakG: 0, crackle: 0, rate: 1 };
  }

  /** Baixa o arquivo da música antes do primeiro toque (para começar rápido). */
  prefetch(url) {
    this.url = url;
    this.raw = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .catch((err) => {
        console.warn('[WorldMan] Música indisponível:', err.message);
        return null;
      });
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

      // cadeia da música: passa-altas, passa-baixas, equalizador, volume
      this.hp = ctx.createBiquadFilter();
      this.hp.type = 'highpass';
      this.lp = ctx.createBiquadFilter();
      this.lp.type = 'lowpass';
      this.peak = ctx.createBiquadFilter();
      this.peak.type = 'peaking';
      this.peak.Q.value = 0.9;
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0;
      this.hp.connect(this.lp);
      this.lp.connect(this.peak);
      this.peak.connect(this.musicGain);
      this.musicGain.connect(this.master);

      const len = ctx.sampleRate;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      // chiado de disco antigo (estalos esparsos), em loop
      const cl = ctx.sampleRate * 2;
      const crackle = ctx.createBuffer(1, cl, ctx.sampleRate);
      const cd = crackle.getChannelData(0);
      for (let i = 0; i < cl; i++) {
        cd[i] += (Math.random() - 0.5) * 0.02;
        if (Math.random() < 0.0007) {
          const amp = (Math.random() - 0.5) * 1.6;
          for (let k = 0; k < 6 && i + k < cl; k++) cd[i + k] += amp * Math.pow(0.55, k);
        }
      }
      this.crackleGain = ctx.createGain();
      this.crackleGain.gain.value = 0;
      const crSrc = ctx.createBufferSource();
      crSrc.buffer = crackle;
      crSrc.loop = true;
      const crFilter = ctx.createBiquadFilter();
      crFilter.type = 'bandpass';
      crFilter.frequency.value = 2200;
      crFilter.Q.value = 0.6;
      crSrc.connect(crFilter);
      crFilter.connect(this.crackleGain);
      this.crackleGain.connect(this.master);
      crSrc.start();

      this.applyProfile(this.profile, true);
      this.decodeMusic();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  decodeMusic() {
    if (!this.raw || this.decoding) return;
    this.decoding = true;
    this.raw
      .then((buf) => {
        if (!buf) return null;
        return new Promise((res, rej) => this.ctx.decodeAudioData(buf, res, rej));
      })
      .then((ab) => {
        if (!ab) return;
        this.musicBuffer = ab;
        this.loopEnd = findLoopEnd(ab);
        if (this.wantMusic) this.startMusic();
      })
      .catch((err) => console.warn('[WorldMan] Não foi possível decodificar a música:', err && err.message));
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

  // ------------------------------------------------------------ Música

  startMusic() {
    this.wantMusic = true;
    if (!this.ctx || !this.musicBuffer || this.musicSrc) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.musicBuffer;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = this.loopEnd;
    src.playbackRate.value = this.profile.rate;
    src.connect(this.hp);
    src.start();
    this.musicSrc = src;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(0, t);
    this.musicGain.gain.linearRampToValueAtTime(0.75, t + 1.2);
  }

  stopMusic() {
    this.wantMusic = false;
    if (!this.musicSrc) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(0, t, 0.2);
    const src = this.musicSrc;
    this.musicSrc = null;
    setTimeout(() => src.stop(), 900);
  }

  /** Aplica o perfil sonoro de uma época (ou a mistura de duas). */
  setProfile(p) {
    const q = this.profile;
    const changed =
      Math.abs(p.hp - q.hp) / (q.hp + 1) > 0.03 ||
      Math.abs(p.lp - q.lp) / (q.lp + 1) > 0.03 ||
      Math.abs(p.peakG - q.peakG) > 0.2 ||
      Math.abs(p.peakF - q.peakF) / (q.peakF + 1) > 0.03 ||
      Math.abs(p.crackle - q.crackle) > 0.01 ||
      Math.abs(p.rate - q.rate) > 0.004;
    if (!changed) return;
    this.profile = { ...p };
    this.applyProfile(p);
  }

  applyProfile(p, now = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const k = now ? 0.001 : 0.25;
    this.hp.frequency.setTargetAtTime(Math.max(10, p.hp), t, k);
    this.lp.frequency.setTargetAtTime(Math.min(20000, p.lp), t, k);
    this.peak.frequency.setTargetAtTime(p.peakF, t, k);
    this.peak.gain.setTargetAtTime(p.peakG, t, k);
    this.crackleGain.gain.setTargetAtTime(p.crackle, t, k);
    if (this.musicSrc) this.musicSrc.playbackRate.setTargetAtTime(p.rate, t, 0.6);
  }

  // ------------------------------------------------------------ Efeitos

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
        this.tone(320, t, 0.14, { type: 'square', gain: 0.06, slide: 760 });
        break;
      case 'shoot':
        this.tone(980, t, 0.07, { type: 'square', gain: 0.03, slide: 260 });
        this.noise(t, 0.05, { gain: 0.045, type: 'highpass', freq: 3000 });
        break;
      case 'hit':
        this.tone(640, t, 0.06, { type: 'triangle', gain: 0.08, slide: 380 });
        break;
      case 'explosion':
        this.noise(t, 0.55, { gain: 0.3, type: 'lowpass', freq: 1400, endFreq: 160 });
        this.tone(110, t, 0.35, { type: 'sine', gain: 0.28, slide: 38 });
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
      case 'tick':
        // tique de relógio: aviso de que um ponteiro está chegando
        this.noise(t, 0.035, { gain: 0.22, type: 'highpass', freq: 3500 });
        this.tone(2400, t, 0.04, { type: 'triangle', gain: 0.09, slide: 1600 });
        break;
      case 'tock':
        this.noise(t, 0.05, { gain: 0.2, type: 'bandpass', freq: 1400, q: 2 });
        this.tone(1100, t, 0.06, { type: 'triangle', gain: 0.1, slide: 700 });
        break;
      case 'era':
        // badalada de relógio ao entrar numa nova época
        for (const [f, g] of [
          [midi(64), 0.12],
          [midi(76), 0.06],
          [midi(83), 0.03],
        ]) {
          this.tone(f, t, 1.6, { type: 'sine', gain: g, attack: 0.005, release: 1.4 });
        }
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
}

/** Fim do trecho com som (ignora o silêncio no final do arquivo para o loop não ter pausa). */
function findLoopEnd(buf) {
  const ch = buf.getChannelData(0);
  const step = 64;
  for (let i = ch.length - 1; i > 0; i -= step) {
    if (Math.abs(ch[i]) > 0.003) return Math.min(buf.duration, i / buf.sampleRate + 0.02);
  }
  return buf.duration;
}
