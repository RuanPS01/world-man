// O planeta-relógio: cenário de cada época, mostrador no núcleo, céu e partículas.
//
// Troca de época: uma "fronteira do tempo" nasce logo à frente do jogador,
// fora da tela. Tudo depois dela já pertence à nova época; o jogador corre
// até atravessá-la, e o céu, os efeitos e a música se misturam no caminho.

import { PLANET } from './config.js';
import { ERAS, mixColor } from './eras.js';
import { drawSprite } from './sprites.js';
import { TAU, wrapAngle, rand, chance, smoothstep, roundRectPath } from './utils.js';

const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const TAIL = -0.9; // ponto (fora da tela, atrás) onde o cenário antigo é trocado

export class World {
  constructor(sprites) {
    this.S = sprites;
    this.R = PLANET.R;
    this.time = 0;
    this.from = 3;
    this.to = 3;
    this.boundary = null;
    this.mix = 1;
    this.camA = 0;
    this.generate();
  }

  // ------------------------------------------------------------ Geração

  generate() {
    const R = this.R;
    const D = this.S.decor;
    const mk = (cls, a, r, k) => ({ a, r, k, cls, flip: chance(0.45), pick: Math.random(), pick2: Math.random(), present: Math.random(), spr: [] });
    const far = [];
    const near = [];
    for (let i = 0; i < 7; i++) far.push(mk('big', (i / 7) * TAU + rand(-0.25, 0.25), R + rand(36, 46), rand(0.85, 1.15)));
    for (let i = 0; i < 6; i++) far.push(mk('big', rand(0, TAU), R + rand(30, 40), rand(0.8, 1.15)));
    for (let i = 0; i < 95; i++) far.push(mk('mid', rand(0, TAU), R + rand(34, 46), rand(0.72, 1.02)));
    for (let i = 0; i < 62; i++) near.push(mk('mid', rand(0, TAU), R + rand(12, 28), rand(0.78, 1.08)));
    for (let i = 0; i < 24; i++) near.push(mk('small', rand(0, TAU), R + rand(6, 20), rand(0.82, 1.06)));
    for (const s of [...far, ...near]) {
      for (let e = 0; e < ERAS.length; e++) {
        const era = ERAS[e];
        if (s.present > era.density[s.cls]) {
          s.spr.push(null);
          continue;
        }
        const list = era.decor[s.cls];
        const arr = D[list[Math.floor(s.pick * list.length)]];
        s.spr.push(arr[Math.floor(s.pick2 * arr.length)]);
      }
    }
    far.sort((p, q) => q.r - p.r);
    near.sort((p, q) => q.r - p.r);
    this.far = far;
    this.near = near;

    this.stones = [];
    for (let i = 0; i < 260; i++) {
      this.stones.push({ a: rand(0, TAU), r: R + rand(4, PLANET.bandFar - 4), w: rand(7, 15), h: rand(4.5, 7.5), rot: rand(-0.6, 0.6), dark: chance(0.4) });
    }

    this.bumps = [];
    const top = R + PLANET.bandFar;
    const n = Math.floor((TAU * top) / 22);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.003, 0.003);
      const back = chance(0.5);
      const rr = top - 4 + (back ? 6 : 0);
      this.bumps.push({ a, r: rand(8, 19), back, x: Math.cos(a) * rr, y: Math.sin(a) * rr });
    }

    const cloudFor = (pick) => ERAS.map((era) => {
      const set = era.sky.clouds ? D.clouds[era.sky.clouds] : null;
      return set ? set[Math.floor(pick * set.length)] : null;
    });
    this.clouds = [];
    for (let i = 0; i < 18; i++) this.clouds.push({ a: rand(0, TAU), alt: rand(170, 430), k: rand(0.7, 1.25), wa: rand(-0.004, 0.004), spr: cloudFor(Math.random()) });
    this.skyClouds = [];
    for (let i = 0; i < 7; i++) this.skyClouds.push({ x: rand(0, 1), y: rand(-0.46, -0.12), k: rand(1.0, 1.7), sp: rand(4, 10), spr: cloudFor(Math.random()) });

    this.stars = [];
    for (let i = 0; i < 90; i++) this.stars.push({ x: rand(-0.5, 0.5), y: rand(-0.5, -0.02), r: rand(0.6, 1.8), tw: rand(0, TAU) });

    this.fx = {
      rain: Array.from({ length: 110 }, () => ({ x: rand(-0.6, 0.6), y: rand(-0.5, 0.5), s: rand(0.8, 1.3) })),
      ash: Array.from({ length: 80 }, () => ({ x: rand(-0.6, 0.6), y: rand(-0.5, 0.5), s: rand(0.5, 1.3), ph: rand(0, TAU), ember: chance(0.22) })),
      bits: Array.from({ length: 46 }, () => ({ x: rand(-0.6, 0.6), y: rand(-0.5, 0.5), s: rand(0.5, 1.2) })),
    };
  }

  // ------------------------------------------------------------ Épocas

  /** Troca de época instantânea (início de partida ou menu). */
  setEra(i) {
    this.from = i;
    this.to = i;
    this.boundary = null;
    this.mix = 1;
    this.pending = null;
  }

  /** Começa a transição para a época `i`, com a fronteira logo à frente. */
  beginTransition(i, camA) {
    if (this.boundary !== null) {
      this.pending = i;
      return;
    }
    if (i === this.to) return;
    this.from = this.to;
    this.to = i;
    this.boundary = camA + 0.82;
    this.mix = 0;
  }

  get inTransition() {
    return this.boundary !== null;
  }

  /** Época visível dominante (para HUD, música e legenda). */
  get dominant() {
    return this.mix < 0.5 ? this.from : this.to;
  }

  /** Peso de uma época na mistura atual (0 a 1). */
  weight(i) {
    let w = 0;
    if (this.from === i) w += 1 - this.mix;
    if (this.to === i) w += this.mix;
    return Math.min(1, w);
  }

  eraAt(a) {
    if (this.boundary === null) return this.to;
    const rel = wrapAngle(a - this.camA);
    const b = wrapAngle(this.boundary - this.camA);
    return rel >= TAIL && rel < b ? this.from : this.to;
  }

  update(dt, camA) {
    this.time += dt;
    this.camA = camA;
    for (const c of this.clouds) c.a += c.wa * dt;
    if (this.boundary !== null) {
      const b = wrapAngle(this.boundary - camA);
      this.mix = smoothstep(0.55, -0.35, b);
      if (b < TAIL) {
        this.from = this.to;
        this.boundary = null;
        this.mix = 1;
        if (this.pending !== null && this.pending !== undefined) {
          const p = this.pending;
          this.pending = null;
          this.beginTransition(p, camA);
        }
      }
    }
    // partículas de clima (espaço de tela)
    for (const d of this.fx.rain) {
      d.y += dt * 1.25 * d.s;
      d.x -= dt * 0.25 * d.s;
      if (d.y > 0.55) {
        d.y -= 1.1;
        d.x = rand(-0.6, 0.7);
      }
    }
    for (const d of this.fx.ash) {
      d.y += dt * 0.05 * d.s * (d.ember ? -1.4 : 1);
      d.ph += dt * 1.3;
      d.x += Math.sin(d.ph) * dt * 0.02 - dt * 0.03;
      if (d.y > 0.55) d.y -= 1.1;
      if (d.y < -0.55) d.y += 1.1;
      if (d.x < -0.62) d.x += 1.24;
    }
    for (const d of this.fx.bits) {
      d.y -= dt * 0.04 * d.s;
      if (d.y < -0.55) {
        d.y += 1.1;
        d.x = rand(-0.6, 0.6);
      }
    }
  }

  // ------------------------------------------------------------ Céu

  drawSky(ctx, w, h, camAngle) {
    const A = ERAS[this.from].sky;
    const B = ERAS[this.to].sky;
    const m = this.mix;
    const st = A.stops.map((c, i) => mixColor(c, B.stops[i], m));
    const g = ctx.createLinearGradient(0, -h / 2, 0, h * 0.12);
    g.addColorStop(0, st[0]);
    g.addColorStop(0.42, st[1]);
    g.addColorStop(0.8, st[2]);
    g.addColorStop(1, st[3]);
    ctx.fillStyle = g;
    ctx.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);

    const stars = A.stars * (1 - m) + B.stars * m;
    if (stars > 0.01) {
      ctx.fillStyle = '#ffffff';
      for (const s of this.stars) {
        ctx.globalAlpha = stars * (0.55 + 0.45 * Math.sin(this.time * 2 + s.tw));
        ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
      }
      ctx.globalAlpha = 1;
    }

    const sun = (A.sun ? 1 - m : 0) + (B.sun ? m : 0);
    if (sun > 0.01) {
      const sx = w * 0.3;
      const sy = -h * 0.36;
      const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 260);
      sg.addColorStop(0, `rgba(255,250,220,${0.9 * sun})`);
      sg.addColorStop(0.2, `rgba(255,240,190,${0.4 * sun})`);
      sg.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(sx - 260, sy - 260, 520, 520);
    }

    const grid = (A.grid ? 1 - m : 0) + (B.grid ? m : 0);
    if (grid > 0.01) {
      ctx.strokeStyle = `rgba(0,229,255,${0.22 * grid})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) {
        const y = -h * 0.08 - Math.pow(i / 9, 1.8) * h * 0.42;
        ctx.beginPath();
        ctx.moveTo(-w / 2, y);
        ctx.lineTo(w / 2, y);
        ctx.stroke();
      }
    }

    const span = w + 600;
    for (const c of this.skyClouds) {
      let x = c.x * span - camAngle * 380 - this.time * c.sp;
      x = ((x % span) + span) % span - span / 2;
      for (const [era, alpha] of [
        [this.from, 1 - m],
        [this.to, m],
      ]) {
        const spr = c.spr[era];
        if (!spr || alpha < 0.02) continue;
        ctx.globalAlpha = alpha;
        drawSprite(ctx, spr, x, c.y * h, c.k);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ Planeta

  inView(a, view) {
    return Math.abs(wrapAngle(a - view.angle)) < view.half;
  }

  drawSlot(ctx, s, view) {
    if (!this.inView(s.a, view)) return;
    const spr = s.spr[this.eraAt(s.a)];
    if (!spr) return;
    ctx.save();
    ctx.rotate(s.a + Math.PI / 2);
    ctx.translate(0, -s.r);
    drawSprite(ctx, spr, 0, 0, s.k, s.flip);
    ctx.restore();
  }

  /** Divide o arco visível em trechos de cada época (com uma faixa de mistura na fronteira). */
  segments(view) {
    const a0 = view.angle - view.half;
    const a1 = view.angle + view.half;
    if (this.boundary === null) return [{ a0, a1, p: ERAS[this.to].palette, era: this.to }];
    const b = view.angle + wrapAngle(this.boundary - view.angle);
    const tail = view.angle + TAIL;
    const from = ERAS[this.from].palette;
    const to = ERAS[this.to].palette;
    const out = [];
    const e = 0.035;
    const steps = 5;
    const lo = Math.max(a0, tail);
    if (a0 < tail) out.push({ a0, a1: Math.min(tail, a1), p: to, era: this.to });
    if (b - e > lo) out.push({ a0: lo, a1: Math.min(a1, b - e), p: from, era: this.from });
    for (let i = 0; i < steps; i++) {
      const s0 = b - e + (2 * e * i) / steps;
      const s1 = s0 + (2 * e) / steps;
      if (s1 < lo || s0 > a1) continue;
      const t = (i + 0.5) / steps;
      out.push({ a0: Math.max(lo, s0), a1: Math.min(a1, s1), p: mixPalette(from, to, t), era: t < 0.5 ? this.from : this.to });
    }
    if (b + e < a1) out.push({ a0: Math.max(lo, b + e), a1, p: to, era: this.to });
    return out.filter((s) => s.a1 > s.a0);
  }

  drawBack(ctx, view) {
    const R = this.R;
    for (const c of this.clouds) {
      if (!this.inView(c.a, view)) continue;
      const spr = c.spr[this.eraAt(c.a)];
      if (!spr) continue;
      ctx.save();
      ctx.rotate(c.a + Math.PI / 2);
      ctx.translate(0, -(R + c.alt));
      drawSprite(ctx, spr, 0, 0, c.k);
      ctx.restore();
    }

    for (const s of this.far) this.drawSlot(ctx, s, view);

    const top = R + PLANET.bandFar;
    const segs = this.segments(view);

    // arbustos da borda
    for (const pass of [true, false]) {
      const groups = new Map();
      for (const bmp of this.bumps) {
        if (bmp.back !== pass) continue;
        if (Math.abs(wrapAngle(bmp.a - view.angle)) > view.half + 0.02) continue;
        const pal = ERAS[this.eraAt(bmp.a)].palette;
        if (!pal.bumps) continue;
        const col = pass ? pal.farDark : pal.far;
        if (!groups.has(col)) groups.set(col, []);
        groups.get(col).push(bmp);
      }
      for (const [col, list] of groups) {
        ctx.fillStyle = col;
        ctx.beginPath();
        for (const bmp of list) {
          ctx.moveTo(bmp.x + bmp.r, bmp.y);
          ctx.arc(bmp.x, bmp.y, bmp.r, 0, TAU);
        }
        ctx.fill();
      }
    }

    // faixa de grama do fundo
    for (const sg of segs) {
      ctx.fillStyle = sg.p.far;
      ctx.beginPath();
      ctx.arc(0, 0, top, sg.a0 - 0.002, sg.a1 + 0.002);
      ctx.arc(0, 0, R - 2, sg.a1 + 0.002, sg.a0 - 0.002, true);
      ctx.closePath();
      ctx.fill();
    }

    // pedrinhas
    for (const s of this.stones) {
      if (!this.inView(s.a, view)) continue;
      const pal = ERAS[this.eraAt(s.a)].palette;
      if (!pal.stones) continue;
      ctx.save();
      ctx.rotate(s.a + Math.PI / 2);
      ctx.translate(0, -s.r);
      ctx.rotate(s.rot);
      ctx.fillStyle = s.dark ? pal.stoneDark : pal.stone;
      ctx.beginPath();
      roundRectPath(ctx, -s.w / 2, -s.h / 2, s.w, s.h, 2.2);
      ctx.fill();
      ctx.restore();
    }

    for (const s of this.near) this.drawSlot(ctx, s, view);
  }

  drawFront(ctx, view) {
    const R = this.R;
    const coreR = R - 70;
    const segs = this.segments(view);
    for (const sg of segs) {
      const p = sg.p;
      const g = ctx.createRadialGradient(0, 0, Math.max(10, coreR - 900), 0, 0, coreR);
      g.addColorStop(0, p.coreDeep);
      g.addColorStop(1, p.core);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, coreR, sg.a0 - 0.002, sg.a1 + 0.002);
      ctx.closePath();
      ctx.fill();
      const ring = (r, wdt, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = wdt;
        ctx.beginPath();
        ctx.arc(0, 0, r, sg.a0 - 0.002, sg.a1 + 0.002);
        ctx.stroke();
      };
      ring(R - 55, 31, p.band3);
      ring(R - 30, 21, p.band2);
      ring(R - 10, 21, p.band1);
      if (p.grid) this.drawGrid(ctx, sg, p.grid);
      if (p.edgeGlow) {
        ring(R - 1, 9, hexA(p.edge, 0.25));
        ring(R - 1, 3, p.edge);
      } else {
        ring(R - 0.8, 2.2, p.edge);
      }
    }
    this.drawDial(ctx, view);
  }

  drawGrid(ctx, sg, color) {
    const R = this.R;
    ctx.strokeStyle = hexA(color, 0.28);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const step = 0.03;
    const start = Math.ceil(sg.a0 / step) * step;
    for (let a = start; a < sg.a1; a += step) {
      const c = Math.cos(a);
      const s = Math.sin(a);
      ctx.moveTo(c * (R - 2), s * (R - 2));
      ctx.lineTo(c * (R - 700), s * (R - 700));
    }
    ctx.stroke();
    for (const r of [R - 40, R - 120, R - 230, R - 380]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, sg.a0, sg.a1);
      ctx.stroke();
    }
  }

  /** Mostrador de relógio gravado no núcleo do planeta. */
  drawDial(ctx, view) {
    const R = this.R;
    const rTick = R - 86;
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * TAU - Math.PI / 2;
      if (!this.inView(a, { angle: view.angle, half: view.half + 0.04 })) continue;
      const era = ERAS[this.eraAt(a)];
      const d = era.dial;
      const hour = k % 5 === 0;
      if (d.style === 'broken' && (k * 7) % 5 === 1) continue;
      const len = hour ? 30 : 13;
      const wdt = hour ? 7 : 3;
      ctx.save();
      ctx.rotate(a + Math.PI / 2);
      if (d.glow) {
        ctx.fillStyle = hexA(d.color, 0.28);
        ctx.fillRect(-wdt / 2 - 3, -rTick - 3, wdt + 6, len + 6);
      }
      ctx.fillStyle = d.color;
      ctx.fillRect(-wdt / 2, -rTick, wdt, len);
      if (hour) {
        const idx = k / 5;
        if (!(d.style === 'broken' && idx % 3 === 1)) {
          const txt = d.style === 'digital' ? String(idx === 0 ? 12 : idx).padStart(2, '0') : ROMAN[idx];
          ctx.translate(0, -(R - 168));
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = d.style === 'digital' ? '700 46px "Crimson Text", monospace' : '700 50px "Cinzel", Georgia, serif';
          if (d.glow) {
            ctx.fillStyle = hexA(d.color, 0.3);
            ctx.fillText(txt, 2, 2);
          }
          ctx.fillStyle = d.style === 'broken' ? hexA(d.color, 0.7) : d.color;
          ctx.fillText(txt, 0, 0);
          if (d.style === 'broken') {
            ctx.strokeStyle = '#1c120c';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-26, -18);
            ctx.lineTo(-4, 4);
            ctx.lineTo(10, -6);
            ctx.lineTo(26, 20);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
  }

  // ------------------------------------------------------------ Clima

  /** Chuva neon, cinzas do apocalipse e bits digitais (espaço de tela). */
  drawWeather(ctx, w, h, overlay) {
    const neon = this.weight(4);
    const tron = this.weight(5);
    const apoc = this.weight(6);
    if (!overlay && neon > 0.02) {
      ctx.strokeStyle = `rgba(190,170,255,${0.32 * neon})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const d of this.fx.rain) {
        const x = d.x * w;
        const y = d.y * h;
        ctx.moveTo(x, y);
        ctx.lineTo(x - 7 * d.s, y + 26 * d.s);
      }
      ctx.stroke();
    }
    if (apoc > 0.02) {
      for (const d of this.fx.ash) {
        if (overlay !== d.ember) continue;
        ctx.globalAlpha = apoc * (d.ember ? 0.9 : 0.6);
        ctx.fillStyle = d.ember ? '#ff8a3a' : '#bcb2a4';
        const s = d.ember ? 2.2 : 3 * d.s;
        ctx.fillRect(d.x * w, d.y * h, s, s);
      }
      ctx.globalAlpha = 1;
    }
    if (overlay && tron > 0.02) {
      ctx.fillStyle = '#00e5ff';
      for (const d of this.fx.bits) {
        ctx.globalAlpha = tron * 0.55;
        ctx.fillRect(d.x * w, d.y * h, 3 * d.s, 3 * d.s);
      }
      ctx.globalAlpha = 1;
    }
  }
}

function hexA(hex, a) {
  if (hex.startsWith('rgb(')) return hex.replace('rgb(', 'rgba(').replace(')', `,${a})`);
  if (hex.startsWith('rgba')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function mixPalette(a, b, t) {
  const out = { ...b };
  for (const k of ['far', 'farDark', 'band1', 'band2', 'band3', 'core', 'coreDeep', 'edge']) out[k] = mixColor(a[k], b[k], t);
  out.grid = t < 0.5 ? a.grid : b.grid;
  out.edgeGlow = t < 0.5 ? a.edgeGlow : b.edgeGlow;
  return out;
}

