// Arte procedural: todos os desenhos do jogo são feitos com Canvas 2D,
// pré-renderizados em pequenos canvases (sprites) para desempenho.

import { roundRectPath, seeded, lerp } from './utils.js';
import { createSprite, drawSprite, blobPath, cloudCircles, paintCloud, cloudSprite } from './draw.js';
import { buildDecor } from './art-decor.js';
import { buildFoes } from './art-foes.js';

export { createSprite, drawSprite };

// ---------------------------------------------------------------- Árvores

export function roundTree(rng, palette) {
  const r = rng(26, 40);
  const trunkH = rng(38, 62);
  const lean = rng(-14, 14);
  const w = r * 3.6 + Math.abs(lean) * 2;
  const h = trunkH + r * 1.9;
  return createSprite(w, h, w / 2, h - 2, (g) => {
    const bx = w / 2;
    const by = h - 2;
    const tx = bx + lean;
    const ty = by - trunkH;
    g.fillStyle = palette.trunk;
    g.beginPath();
    g.moveTo(bx - 5, by + 2);
    g.lineTo(tx - 3, ty);
    g.lineTo(tx + 3, ty);
    g.lineTo(bx + 5, by + 2);
    g.closePath();
    g.fill();
    // galho
    g.strokeStyle = palette.trunk;
    g.lineWidth = 3.5;
    const side = lean > 0 ? -1 : 1;
    const mx = lerp(bx, tx, 0.55);
    const my = lerp(by, ty, 0.55);
    g.beginPath();
    g.moveTo(mx, my);
    g.lineTo(mx + side * r * 0.75, my - r * 0.35);
    g.stroke();

    const circles = [
      [tx, ty - r * 0.5, r],
      [tx - r * 0.72, ty - r * 0.05, r * 0.66],
      [tx + r * 0.7, ty, r * 0.7],
    ];
    if (rng() > 0.5) circles.push([tx + side * r * 0.95, ty + r * 0.35, r * 0.42]);
    blobPath(g, circles);
    g.fillStyle = palette.leaf;
    g.fill();
    g.save();
    blobPath(g, circles);
    g.clip();
    g.fillStyle = palette.leafDark;
    g.beginPath();
    g.arc(tx + r * 0.75, ty + r * 0.55, r * 1.1, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = palette.leafLight;
    g.beginPath();
    g.arc(tx - r * 0.55, ty - r * 0.95, r * 0.95, 0, Math.PI * 2);
    g.fill();
    g.restore();
  });
}

export function pineCluster(rng, palette) {
  const n = 1 + Math.floor(rng(0, 3));
  const trees = [];
  let maxH = 0;
  let x = 0;
  for (let i = 0; i < n; i++) {
    const th = rng(70, 150);
    const tw = th * rng(0.42, 0.55);
    trees.push({ x, h: th, w: tw, lean: rng(-10, 10) });
    x += tw * rng(0.45, 0.7);
    maxH = Math.max(maxH, th);
  }
  const totalW = x + trees[trees.length - 1].w + 30;
  const h = maxH + 6;
  return createSprite(totalW, h, totalW / 2, h - 2, (g) => {
    const off = 15 + trees[0].w / 2;
    // desenha do mais alto (fundo) para o mais baixo (frente)
    const order = [...trees].sort((a, b) => b.h - a.h);
    for (const t of order) {
      const cx = off + t.x;
      const base = h - 2;
      const tipX = cx + t.lean;
      const tipY = base - t.h;
      g.fillStyle = palette.pine;
      g.beginPath();
      g.moveTo(tipX, tipY);
      g.lineTo(cx + t.w / 2, base + 2);
      g.lineTo(cx - t.w / 2, base + 2);
      g.closePath();
      g.fill();
      g.fillStyle = palette.pineDark;
      g.beginPath();
      g.moveTo(tipX, tipY);
      g.lineTo(cx + t.w / 2, base + 2);
      g.lineTo(cx + t.w * 0.05, base + 2);
      g.closePath();
      g.fill();
    }
  });
}

// ---------------------------------------------------------------- Montanhas

export function mountainCloudy(rng) {
  const w = rng(280, 340);
  const h = rng(170, 210);
  return createSprite(w + 40, h + 40, (w + 40) / 2, h + 38, (g) => {
    const ox = 20;
    const oy = 40;
    const base = oy + h;
    // pico rosado atrás da nuvem
    g.fillStyle = '#e3b0a3';
    g.beginPath();
    g.ellipse(ox + w * 0.66, oy + h * 0.12, w * 0.15, h * 0.2, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#efc8bc';
    g.beginPath();
    g.ellipse(ox + w * 0.63, oy + h * 0.06, w * 0.08, h * 0.1, 0, 0, Math.PI * 2);
    g.fill();
    // corpo
    g.fillStyle = '#7a4423';
    g.beginPath();
    g.moveTo(ox, base + 2);
    g.lineTo(ox + w * 0.08, oy + h * 0.55);
    g.lineTo(ox + w * 0.2, oy + h * 0.22);
    g.lineTo(ox + w * 0.36, oy + h * 0.12);
    g.lineTo(ox + w * 0.55, oy + h * 0.18);
    g.lineTo(ox + w * 0.74, oy + h * 0.28);
    g.lineTo(ox + w * 0.86, oy + h * 0.55);
    g.lineTo(ox + w * 0.93, oy + h * 0.72);
    g.lineTo(ox + w * 0.88, oy + h * 0.8);
    g.lineTo(ox + w, base + 2);
    g.closePath();
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.beginPath();
    g.moveTo(ox + w * 0.55, oy);
    g.lineTo(ox + w * 1.1, oy);
    g.lineTo(ox + w * 1.1, base + 4);
    g.lineTo(ox + w * 0.75, base + 4);
    g.closePath();
    g.fill();
    g.restore();
    // nuvem no topo
    const circles = cloudCircles(ox + w * 0.6, oy + h * 0.22, w * 0.55, rng, 6);
    paintCloud(g, circles, '#f4fafc', 'rgba(170,210,228,0.9)');
  });
}

export function mountainSnowy(rng) {
  const w = rng(300, 380);
  const h = rng(200, 250);
  return createSprite(w + 20, h + 10, (w + 20) / 2, h + 8, (g) => {
    const ox = 10;
    const oy = 8;
    const base = oy + h;
    const pts = [
      [ox, base + 2],
      [ox + w * 0.1, oy + h * 0.5],
      [ox + w * 0.24, oy + h * 0.2],
      [ox + w * 0.38, oy + h * 0.04],
      [ox + w * 0.5, oy],
      [ox + w * 0.62, oy + h * 0.06],
      [ox + w * 0.78, oy + h * 0.24],
      [ox + w * 0.9, oy + h * 0.55],
      [ox + w, base + 2],
    ];
    g.fillStyle = '#6a3a1e';
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = 'rgba(0,0,0,0.14)';
    g.fillRect(ox + w * 0.5, oy - 5, w, h + 20);
    // neve com "escorridos"
    g.fillStyle = '#f2f7f9';
    g.beginPath();
    g.moveTo(ox, oy - 10);
    g.lineTo(ox + w + 10, oy - 10);
    const snowY = oy + h * 0.3;
    const drips = 7;
    g.lineTo(ox + w + 10, snowY);
    for (let i = drips; i >= 0; i--) {
      const x = ox + (i / drips) * w;
      const d = rng(8, 30);
      g.quadraticCurveTo(x + w / drips / 2, snowY + d * 1.6, x, snowY + rng(-4, 4));
    }
    g.closePath();
    g.fill();
    g.restore();
    // placa no topo
    g.strokeStyle = '#4a2a15';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(ox + w * 0.5, oy + 2);
    g.lineTo(ox + w * 0.5, oy - 4);
    g.stroke();
  });
}

export function hill(rng) {
  const w = rng(170, 230);
  const h = rng(90, 120);
  return createSprite(w + 10, h + 6, (w + 10) / 2, h + 4, (g) => {
    const ox = 5;
    const base = h + 4;
    g.fillStyle = '#7d4724';
    g.beginPath();
    g.moveTo(ox, base + 2);
    g.bezierCurveTo(ox + w * 0.1, base - h * 0.9, ox + w * 0.35, base - h * 1.05, ox + w * 0.55, base - h);
    g.bezierCurveTo(ox + w * 0.8, base - h * 0.95, ox + w * 0.95, base - h * 0.4, ox + w, base + 2);
    g.closePath();
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = 'rgba(0,0,0,0.13)';
    g.fillRect(ox + w * 0.55, 0, w, h + 10);
    g.restore();
  });
}

export function fence() {
  return createSprite(140, 56, 70, 54, (g) => {
    g.fillStyle = '#5b3216';
    for (const x of [22, 74, 118]) {
      g.beginPath();
      roundRectPath(g, x - 3.5, 18, 7, 36, 2);
      g.fill();
    }
    g.fillStyle = '#714019';
    g.save();
    g.translate(70, 30);
    g.rotate(0.1);
    g.beginPath();
    roundRectPath(g, -68, -4.5, 136, 9, 4.5);
    g.fill();
    g.restore();
  });
}

// ---------------------------------------------------------------- Nuvens

function skyCloud(rng) {
  return cloudSprite(rng, 'rgba(255,255,255,0.93)', 'rgba(185,220,236,0.95)');
}

// ---------------------------------------------------------------- Inimigos

export function rocket(c = {}) {
  const k = {
    body: '#f4f4f2',
    shade: '#d3d8db',
    red: '#d6322b',
    redDark: '#b52520',
    rim: '#8e979c',
    glass: '#5fb1c3',
    nozzle: '#6f7377',
    rust: null,
    ...c,
  };
  return createSprite(52, 128, 26, 124, (g) => {
    const cx = 26;
    // aletas
    g.fillStyle = k.red;
    g.beginPath();
    g.moveTo(14, 88);
    g.lineTo(2, 122);
    g.lineTo(16, 114);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(38, 88);
    g.lineTo(50, 122);
    g.lineTo(36, 114);
    g.closePath();
    g.fill();
    // corpo
    const body = new Path2D();
    body.moveTo(14, 116);
    body.lineTo(14, 44);
    body.quadraticCurveTo(14, 14, cx, 2);
    body.quadraticCurveTo(38, 14, 38, 44);
    body.lineTo(38, 116);
    body.closePath();
    g.fillStyle = k.body;
    g.fill(body);
    g.save();
    g.clip(body);
    g.fillStyle = k.shade;
    g.fillRect(cx + 3, 0, 20, 130);
    g.fillStyle = k.red;
    g.fillRect(0, 0, 60, 30);
    g.fillStyle = k.redDark;
    g.fillRect(cx + 3, 0, 20, 30);
    g.fillStyle = k.red;
    g.fillRect(0, 98, 60, 6);
    if (k.rust) {
      g.fillStyle = k.rust;
      for (const [x, y, r] of [[18, 70, 6], [32, 84, 5], [20, 104, 7], [30, 40, 4]]) {
        g.beginPath();
        g.ellipse(x, y, r * 1.2, r, 0.4, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
    // janela
    g.fillStyle = k.rim;
    g.beginPath();
    g.arc(cx, 56, 9.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = k.glass;
    g.beginPath();
    g.arc(cx, 56, 6.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.beginPath();
    g.arc(cx - 2.2, 53.6, 2.2, 0, Math.PI * 2);
    g.fill();
    // bocal
    g.fillStyle = k.nozzle;
    g.beginPath();
    roundRectPath(g, 17, 115, 18, 9, 2);
    g.fill();
  });
}

function balloon() {
  return createSprite(120, 184, 60, 180, (g) => {
    const cx = 60;
    // cordas
    g.strokeStyle = '#5b4630';
    g.lineWidth = 1.4;
    for (const [x0, y0, x1] of [
      [22, 84, 46],
      [42, 100, 52],
      [78, 100, 68],
      [98, 84, 74],
    ]) {
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, 144);
      g.stroke();
    }
    // envelope
    const env = new Path2D();
    env.arc(cx, 56, 52, Math.PI * 0.82, Math.PI * 2.18);
    env.quadraticCurveTo(cx + 26, 100, cx + 12, 112);
    env.lineTo(cx - 12, 112);
    env.quadraticCurveTo(cx - 26, 100, cx + Math.cos(Math.PI * 0.82) * 52, 56 + Math.sin(Math.PI * 0.82) * 52);
    env.closePath();
    const grd = g.createRadialGradient(cx - 18, 34, 6, cx, 56, 66);
    grd.addColorStop(0, '#f56a5c');
    grd.addColorStop(0.45, '#d72b27');
    grd.addColorStop(1, '#9e1717');
    g.fillStyle = grd;
    g.fill(env);
    g.save();
    g.clip(env);
    g.strokeStyle = 'rgba(120,10,10,0.35)';
    g.lineWidth = 2;
    for (const k of [-0.55, 0, 0.55]) {
      g.beginPath();
      g.ellipse(cx, 56, 52 * Math.abs(k) + 1, 60, 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
    // cesto
    g.fillStyle = '#8b5a2b';
    g.beginPath();
    roundRectPath(g, 44, 142, 32, 24, 4);
    g.fill();
    g.strokeStyle = '#6a4120';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(44, 151);
    g.lineTo(76, 151);
    g.moveTo(44, 159);
    g.lineTo(76, 159);
    g.stroke();
    // sacos de areia
    for (const [x, y] of [
      [40, 152],
      [80, 154],
      [48, 170],
      [72, 170],
    ]) {
      g.fillStyle = '#d58f3e';
      g.beginPath();
      g.ellipse(x, y, 7.5, 8.5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#b36d2a';
      g.beginPath();
      g.ellipse(x + 2, y + 3, 4.5, 4.5, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}

function plane() {
  return createSprite(150, 76, 75, 38, (g) => {
    const dark = '#5c5226';
    // asa inferior
    g.fillStyle = '#857437';
    g.beginPath();
    roundRectPath(g, 32, 44, 74, 9, 4);
    g.fill();
    // rodas
    g.strokeStyle = dark;
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(54, 50);
    g.lineTo(50, 64);
    g.moveTo(74, 50);
    g.lineTo(78, 64);
    g.stroke();
    g.fillStyle = '#2b2b2b';
    for (const x of [50, 78]) {
      g.beginPath();
      g.arc(x, 66, 6, 0, Math.PI * 2);
      g.fill();
    }
    // cauda
    g.fillStyle = '#8f7d3d';
    g.beginPath();
    g.moveTo(116, 30);
    g.lineTo(128, 6);
    g.lineTo(140, 8);
    g.lineTo(138, 32);
    g.closePath();
    g.fill();
    // fuselagem
    const body = new Path2D();
    body.moveTo(16, 28);
    body.quadraticCurveTo(20, 18, 46, 18);
    body.lineTo(110, 22);
    body.lineTo(142, 26);
    body.lineTo(142, 34);
    body.lineTo(110, 40);
    body.lineTo(46, 44);
    body.quadraticCurveTo(20, 44, 16, 34);
    body.closePath();
    g.fillStyle = '#a6934d';
    g.fill(body);
    g.save();
    g.clip(body);
    g.fillStyle = '#7f7035';
    g.fillRect(0, 34, 160, 20);
    g.restore();
    // estabilizador
    g.fillStyle = '#7f7035';
    g.beginPath();
    roundRectPath(g, 118, 30, 28, 6, 3);
    g.fill();
    // cabine e piloto
    g.fillStyle = '#3a3a3a';
    g.beginPath();
    g.ellipse(64, 18, 9, 5, 0, Math.PI, Math.PI * 2);
    g.fill();
    g.fillStyle = '#d9a35b';
    g.beginPath();
    g.arc(64, 13, 4.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#5a3d1c';
    g.beginPath();
    g.arc(64, 12, 4.8, Math.PI, Math.PI * 2);
    g.fill();
    // asa superior e montantes
    g.strokeStyle = dark;
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(42, 12);
    g.lineTo(46, 46);
    g.moveTo(92, 12);
    g.lineTo(90, 46);
    g.stroke();
    g.fillStyle = '#b5a25c';
    g.beginPath();
    roundRectPath(g, 28, 6, 82, 9, 4.5);
    g.fill();
    // insígnia
    g.fillStyle = '#f1e7c7';
    g.beginPath();
    g.arc(96, 31, 5.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#c4302b';
    g.beginPath();
    g.arc(96, 31, 3, 0, Math.PI * 2);
    g.fill();
    // cubo da hélice
    g.fillStyle = '#3b3b3b';
    g.beginPath();
    g.arc(15, 31, 4.5, 0, Math.PI * 2);
    g.fill();
  });
}

export function missile(c = {}) {
  const k = { fin: '#4b5156', body: '#979ea4', light: '#c6ccd1', band: '#5b6166', nose: '#ecebe6', tip: '#c4302b', glow: null, ...c };
  return createSprite(60, 28, 30, 14, (g) => {
    g.translate(3, 3);
    if (k.glow) {
      g.shadowColor = k.glow;
      g.shadowBlur = 6;
    }
    // aletas (traseira à direita)
    g.fillStyle = k.fin;
    g.beginPath();
    g.moveTo(40, 6);
    g.lineTo(52, 0);
    g.lineTo(52, 7);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(40, 16);
    g.lineTo(52, 22);
    g.lineTo(52, 15);
    g.closePath();
    g.fill();
    g.fillStyle = k.body;
    g.beginPath();
    roundRectPath(g, 12, 5, 38, 12, 3);
    g.fill();
    g.fillStyle = k.light;
    g.fillRect(14, 6.5, 34, 3);
    g.fillStyle = k.band;
    g.fillRect(44, 5, 3, 12);
    // ogiva
    g.fillStyle = k.nose;
    g.beginPath();
    g.moveTo(14, 5);
    g.quadraticCurveTo(0, 6, 1, 11);
    g.quadraticCurveTo(0, 16, 14, 17);
    g.closePath();
    g.fill();
    g.fillStyle = k.tip;
    g.beginPath();
    g.arc(3.5, 11, 2.5, 0, Math.PI * 2);
    g.fill();
  });
}

function bomb() {
  return createSprite(26, 30, 13, 17, (g) => {
    g.fillStyle = '#2a2a2c';
    g.beginPath();
    g.arc(13, 17, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#4a4a4e';
    g.beginPath();
    roundRectPath(g, 9, 4, 8, 5, 1.5);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.beginPath();
    g.arc(9.5, 13.5, 3, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#8a6b3c';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(13, 4);
    g.quadraticCurveTo(15, 0, 19, 1);
    g.stroke();
  });
}

// ---------------------------------------------------------------- Banco de sprites

export function buildSprites(seed = 1234) {
  const rng = seeded(seed);
  const palette = {
    trunk: '#7a4520',
    leaf: '#5daf2e',
    leafLight: '#78c740',
    leafDark: '#4b9727',
    pine: '#77c63d',
    pineDark: '#5fae2f',
  };
  const S = {
    trees: [],
    pines: [],
    mountains: [],
    hills: [],
    clouds: [],
    fence: fence(),
    rocket: rocket(),
    balloon: balloon(),
    plane: plane(),
    missile: missile(),
    bomb: bomb(),
  };
  for (let i = 0; i < 6; i++) S.trees.push(roundTree(rng, palette));
  for (let i = 0; i < 6; i++) S.pines.push(pineCluster(rng, palette));
  for (let i = 0; i < 2; i++) S.mountains.push(mountainCloudy(rng));
  S.mountains.push(mountainSnowy(rng));
  for (let i = 0; i < 2; i++) S.hills.push(hill(rng));
  for (let i = 0; i < 6; i++) S.clouds.push(skyCloud(rng));
  S.decor = buildDecor(rng, S);
  S.foes = buildFoes(rng, S);
  return S;
}

// ---------------------------------------------------------------- Personagem

const OUT = '#1d1d1f';

/** Variações de roupa do personagem conforme a época. */
const LOOKS = {
  default: {
    pants: '#2f63b9',
    shirt: '#f4f4f4',
    shirtShade: '#d7d9dc',
    belt: '#26467f',
    out: OUT,
    cap: '#1b1b1d',
    gun: '#202022',
    capDot: '#e6e6e6',
    shoe: '#262628',
    glow: null,
  },
  tron: {
    pants: '#0b1724',
    shirt: '#0e1c2c',
    shirtShade: '#0a1420',
    belt: '#00e5ff',
    out: '#00e5ff',
    cap: '#0b1724',
    gun: '#0a1420',
    capDot: '#00e5ff',
    shoe: '#05090f',
    glow: '#00e5ff',
  },
  apoc: {
    pants: '#4a5560',
    shirt: '#c9bb9c',
    shirtShade: '#a5977a',
    belt: '#5a3a20',
    out: OUT,
    cap: '#3a2a20',
    gun: '#2a2622',
    capDot: '#9a8a70',
    shoe: '#2a2420',
    glow: null,
  },
};

function leg(ctx, x, y, ang, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = c.pants;
  ctx.strokeStyle = c.out;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  roundRectPath(ctx, -3.2, -1, 6.4, 13, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = c.shoe;
  ctx.beginPath();
  ctx.ellipse(1.8, 13.2, 4.6, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Desenha o personagem com os pés em (0,0), olhando para +x.
 * st: { phase, air, stopped, blink, look }
 */
export function drawPlayer(ctx, st) {
  const c = LOOKS[st.look] || LOOKS.default;
  const OUT = c.out;
  const run = !st.air && !st.stopped;
  const bob = run ? Math.abs(Math.sin(st.phase)) * 1.8 : 0;
  let a1;
  let a2;
  if (st.air) {
    a1 = -0.75;
    a2 = 0.55;
  } else if (st.stopped) {
    a1 = 0.08;
    a2 = -0.08;
  } else {
    a1 = Math.sin(st.phase) * 0.8;
    a2 = -Math.sin(st.phase) * 0.8;
  }
  ctx.save();
  ctx.translate(0, -bob);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (c.glow) {
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = 6;
  }

  // perna de trás
  leg(ctx, -1.5, -14.5, a2, c);

  // braço de trás
  ctx.fillStyle = '#e9c35c';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(14.5, -23.5, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // tronco (camiseta)
  ctx.fillStyle = c.shirt;
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  roundRectPath(ctx, -7.5, -30, 15, 17, 4.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = c.shirtShade;
  ctx.beginPath();
  roundRectPath(ctx, -6.6, -29, 5, 15, 3);
  ctx.fill();
  ctx.fillStyle = c.belt;
  ctx.fillRect(-6.6, -16.5, 13.2, 3);

  // perna da frente
  leg(ctx, 1.8, -14.5, a1, c);

  // arma
  ctx.fillStyle = c.gun;
  ctx.beginPath();
  roundRectPath(ctx, 2, -27.5, 16, 5.6, 1.6);
  ctx.fill();
  ctx.fillRect(17, -26.4, 8, 2.6);
  ctx.fillRect(8, -23, 3.2, 5);
  ctx.fillRect(-1, -27, 4, 4.4);

  // braço da frente e mãos
  ctx.fillStyle = c.shirt;
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  roundRectPath(ctx, 0.5, -28.5, 8, 5.5, 2.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2cf63';
  ctx.beginPath();
  ctx.arc(9.5, -22.6, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // cabeça
  ctx.fillStyle = '#f7d56b';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(1, -40, 11.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(214,160,60,0.35)';
  ctx.beginPath();
  ctx.arc(-3, -37, 6.5, 0, Math.PI * 2);
  ctx.fill();
  // olhos
  ctx.fillStyle = OUT;
  if (st.blink) {
    ctx.fillRect(3.6, -40.5, 2.6, 1.1);
    ctx.fillRect(8, -40.5, 2.6, 1.1);
  } else {
    ctx.beginPath();
    ctx.ellipse(4.9, -40.4, 1.25, 2.1, 0, 0, Math.PI * 2);
    ctx.ellipse(9.2, -40.4, 1.25, 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // boca
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(7.2, -35.6, 1.8, 0.2, Math.PI - 0.4);
  ctx.stroke();

  // boné virado para trás
  ctx.fillStyle = c.cap;
  ctx.beginPath();
  ctx.arc(1, -40.5, 12.6, Math.PI * 1.03, Math.PI * 1.97);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  roundRectPath(ctx, -15.5, -44.2, 9.5, 3.8, 1.8);
  ctx.fill();
  ctx.fillStyle = c.capDot;
  ctx.beginPath();
  ctx.arc(3.5, -48.4, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
