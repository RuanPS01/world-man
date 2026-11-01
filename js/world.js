// O planeta: geração das decorações e desenho do céu, faixas de grama e núcleo.

import { PLANET } from './config.js';
import { drawSprite } from './sprites.js';
import { TAU, wrapAngle, rand, pick, chance, roundRectPath } from './utils.js';

const C = PLANET.colors;

export class World {
  constructor(sprites) {
    this.S = sprites;
    this.R = PLANET.R;
    this.time = 0;
    this.generate();
  }

  generate() {
    const R = this.R;
    const S = this.S;
    const far = [];
    const near = [];

    // Montanhas grandes, espalhadas ao redor do planeta.
    const nM = 7;
    for (let i = 0; i < nM; i++) {
      const a = (i / nM) * TAU + rand(-0.25, 0.25);
      far.push({ a, r: R + rand(34, 44), s: pick(S.mountains), k: rand(0.85, 1.15), flip: chance(0.4) });
    }
    for (let i = 0; i < 6; i++) {
      far.push({ a: rand(0, TAU), r: R + rand(30, 40), s: pick(S.hills), k: rand(0.8, 1.2), flip: chance(0.5) });
    }
    // Vegetação ao fundo (base escondida pela faixa de grama).
    for (let i = 0; i < 95; i++) {
      const isPine = chance(0.45);
      far.push({
        a: rand(0, TAU),
        r: R + rand(34, 46),
        s: isPine ? pick(S.pines) : pick(S.trees),
        k: rand(0.75, 1.05),
        flip: chance(0.5),
      });
    }
    // Vegetação perto do caminho.
    for (let i = 0; i < 70; i++) {
      const isPine = chance(0.4);
      near.push({
        a: rand(0, TAU),
        r: R + rand(10, 28),
        s: isPine ? pick(S.pines) : pick(S.trees),
        k: rand(0.8, 1.1),
        flip: chance(0.5),
      });
    }
    for (let i = 0; i < 12; i++) {
      near.push({ a: rand(0, TAU), r: R + rand(6, 20), s: S.fence, k: rand(0.8, 1.05), flip: chance(0.5) });
    }
    far.sort((p, q) => q.r - p.r);
    near.sort((p, q) => q.r - p.r);
    this.far = far;
    this.near = near;

    // Pedrinhas marrons na grama.
    this.stones = [];
    for (let i = 0; i < 260; i++) {
      this.stones.push({
        a: rand(0, TAU),
        r: R + rand(4, PLANET.bandFar - 4),
        w: rand(7, 15),
        h: rand(4.5, 7.5),
        rot: rand(-0.6, 0.6),
        dark: chance(0.4),
      });
    }

    // Arbustos que formam a borda irregular da faixa de grama.
    this.bumps = [];
    const circ = TAU * (R + PLANET.bandFar);
    const n = Math.floor(circ / 22);
    const top = R + PLANET.bandFar;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.003, 0.003);
      const back = chance(0.5);
      const rr = top - 4 + (back ? 6 : 0);
      this.bumps.push({ a, r: rand(8, 19), back, x: Math.cos(a) * rr, y: Math.sin(a) * rr });
    }

    // Nuvens presas ao mundo (perto do horizonte).
    this.clouds = [];
    for (let i = 0; i < 18; i++) {
      this.clouds.push({
        a: rand(0, TAU),
        alt: rand(170, 430),
        s: pick(S.clouds),
        k: rand(0.7, 1.25),
        wa: rand(-0.004, 0.004),
      });
    }

    // Nuvens distantes (espaço de tela, com parallax).
    this.skyClouds = [];
    for (let i = 0; i < 7; i++) {
      this.skyClouds.push({ x: rand(0, 1), y: rand(-0.46, -0.12), s: pick(S.clouds), k: rand(1.0, 1.7), sp: rand(4, 10) });
    }
  }

  update(dt) {
    this.time += dt;
    for (const c of this.clouds) c.a += c.wa * dt;
  }

  // -------------------------------------------------------------- Desenho

  /** Céu em espaço de tela; origem no centro da cena. */
  drawSky(ctx, w, h, camAngle) {
    const g = ctx.createLinearGradient(0, -h / 2, 0, h * 0.12);
    g.addColorStop(0, C.sky0);
    g.addColorStop(0.42, C.sky1);
    g.addColorStop(0.8, C.sky2);
    g.addColorStop(1, C.sky3);
    ctx.fillStyle = g;
    ctx.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);

    const span = w + 600;
    for (const c of this.skyClouds) {
      let x = c.x * span - camAngle * 380 - this.time * c.sp;
      x = ((x % span) + span) % span - span / 2;
      drawSprite(ctx, c.s, x, c.y * h, c.k);
    }
  }

  inView(a, view) {
    return Math.abs(wrapAngle(a - view.angle)) < view.half;
  }

  drawPolar(ctx, item, view, extraAlt = 0) {
    if (!this.inView(item.a, view)) return;
    ctx.save();
    ctx.rotate(item.a + Math.PI / 2);
    ctx.translate(0, -(item.r + extraAlt));
    drawSprite(ctx, item.s, 0, 0, item.k, item.flip);
    ctx.restore();
  }

  /** Tudo que fica atrás do personagem: nuvens do mundo, montanhas, grama do fundo. */
  drawBack(ctx, view) {
    const R = this.R;
    for (const c of this.clouds) {
      if (!this.inView(c.a, view)) continue;
      ctx.save();
      ctx.rotate(c.a + Math.PI / 2);
      ctx.translate(0, -(R + c.alt));
      drawSprite(ctx, c.s, 0, 0, c.k);
      ctx.restore();
    }

    for (const it of this.far) this.drawPolar(ctx, it, view);

    const a0 = view.angle - view.half;
    const a1 = view.angle + view.half;
    const full = view.half >= Math.PI;
    const top = R + PLANET.bandFar;

    // arbustos da borda (duas tonalidades)
    for (const pass of [true, false]) {
      ctx.fillStyle = pass ? C.farDark : C.far;
      ctx.beginPath();
      for (const b of this.bumps) {
        if (b.back !== pass) continue;
        if (!full && Math.abs(wrapAngle(b.a - view.angle)) > view.half + 0.02) continue;
        ctx.moveTo(b.x + b.r, b.y);
        ctx.arc(b.x, b.y, b.r, 0, TAU);
      }
      ctx.fill();
    }

    // faixa de grama do fundo
    ctx.fillStyle = C.far;
    ctx.beginPath();
    if (full) {
      ctx.arc(0, 0, top, 0, TAU);
    } else {
      ctx.arc(0, 0, top, a0, a1);
      ctx.arc(0, 0, R - 2, a1, a0, true);
      ctx.closePath();
    }
    ctx.fill();

    // pedrinhas
    for (const s of this.stones) {
      if (!this.inView(s.a, view)) continue;
      ctx.save();
      ctx.rotate(s.a + Math.PI / 2);
      ctx.translate(0, -s.r);
      ctx.rotate(s.rot);
      ctx.fillStyle = s.dark ? C.stoneDark : C.stone;
      ctx.beginPath();
      roundRectPath(ctx, -s.w / 2, -s.h / 2, s.w, s.h, 2.2);
      ctx.fill();
      ctx.restore();
    }

    for (const it of this.near) this.drawPolar(ctx, it, view);
  }

  /** Faixas frontais e núcleo do planeta. */
  drawFront(ctx, view) {
    const R = this.R;
    const coreR = R - 70;
    const g = ctx.createRadialGradient(0, 0, Math.max(10, coreR - 900), 0, 0, coreR);
    g.addColorStop(0, C.coreDeep);
    g.addColorStop(0.55, '#62321a');
    g.addColorStop(1, C.core);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, TAU);
    ctx.fill();

    const full = view.half >= Math.PI;
    const a0 = full ? 0 : view.angle - view.half;
    const a1 = full ? TAU : view.angle + view.half;
    const ring = (r, wdt, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = wdt;
      ctx.beginPath();
      ctx.arc(0, 0, r, a0, a1);
      ctx.stroke();
    };
    ring(R - 55, 31, C.band3);
    ring(R - 30, 21, C.band2);
    ring(R - 10, 21, C.band1);
    ring(R - 0.8, 2.2, '#3c8220');
  }
}
