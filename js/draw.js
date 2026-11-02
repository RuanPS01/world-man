// Utilitários de desenho compartilhados pela arte procedural.

import { makeCanvas, roundRectPath } from './utils.js';

export const SPR_SCALE = 2;

/** Cria um sprite: desenha em `w x h` unidades com âncora (ax, ay). */
export function createSprite(w, h, ax, ay, draw) {
  const canvas = makeCanvas(w * SPR_SCALE, h * SPR_SCALE);
  const g = canvas.getContext('2d');
  g.scale(SPR_SCALE, SPR_SCALE);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  draw(g, w, h);
  return { canvas, w, h, ax, ay };
}

/** Desenha um sprite com a âncora em (x, y). */
export function drawSprite(ctx, s, x = 0, y = 0, scale = 1, flip = false) {
  if (flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(s.canvas, -s.ax * scale, -s.ay * scale, s.w * scale, s.h * scale);
    ctx.restore();
    return;
  }
  ctx.drawImage(s.canvas, x - s.ax * scale, y - s.ay * scale, s.w * scale, s.h * scale);
}

export function blobPath(g, circles) {
  g.beginPath();
  for (const [x, y, r] of circles) {
    g.moveTo(x + r, y);
    g.arc(x, y, r, 0, Math.PI * 2);
  }
}

export function cloudCircles(cx, cy, wdt, rng, count = 6) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = cx - wdt / 2 + t * wdt;
    const rr = (1 - Math.abs(t - 0.5) * 1.1) * wdt * 0.22 + rng(2, 8);
    out.push([x, cy - rr * 0.35 + rng(-3, 3), rr]);
  }
  return out;
}

export function paintCloud(g, circles, light, shade) {
  blobPath(g, circles);
  g.fillStyle = light;
  g.fill();
  g.save();
  blobPath(g, circles);
  g.clip();
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y, r] of circles) {
    minY = Math.min(minY, y - r);
    maxY = Math.max(maxY, y + r);
  }
  const grd = g.createLinearGradient(0, minY, 0, maxY);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0)');
  grd.addColorStop(1, shade);
  g.fillStyle = grd;
  g.fillRect(-1000, minY, 3000, maxY - minY);
  g.restore();
}

/** Nuvem com limites calculados (nada é cortado). */
export function cloudSprite(rng, light, shade) {
  const w = rng(160, 280);
  const circles = cloudCircles(0, 0, w, rng, 5 + Math.floor(rng(0, 3)));
  circles.push([0, w * 0.06, w * 0.3]);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const [x, y, r] of circles) {
    x0 = Math.min(x0, x - r);
    x1 = Math.max(x1, x + r);
    y0 = Math.min(y0, y - r);
    y1 = Math.max(y1, y + r);
  }
  const pad = 4;
  const sw = x1 - x0 + pad * 2;
  const sh = y1 - y0 + pad * 2;
  const shifted = circles.map(([x, y, r]) => [x - x0 + pad, y - y0 + pad, r]);
  return createSprite(sw, sh, sw / 2, sh - pad, (g) => paintCloud(g, shifted, light, shade));
}

// ---------------------------------------------------------------- Primitivas

export function poly(g, pts, fill) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
}

export function circ(g, x, y, r, fill) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}

export function ell(g, x, y, rx, ry, fill, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}

export function rrect(g, x, y, w, h, r, fill) {
  g.beginPath();
  roundRectPath(g, x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
}

export function line(g, x1, y1, x2, y2, stroke, width = 2) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.strokeStyle = stroke;
  g.lineWidth = width;
  g.stroke();
}

/** Executa `fn` com brilho neon (sombra colorida). */
export function glow(g, color, blur, fn) {
  g.save();
  g.shadowColor = color;
  g.shadowBlur = blur;
  fn();
  g.restore();
}

/** Contorno de polígono com brilho neon. */
export function neonPoly(g, pts, color, width = 2, blur = 8, close = true) {
  glow(g, color, blur, () => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (close) g.closePath();
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  });
}

export function neonLine(g, x1, y1, x2, y2, color, width = 2, blur = 8) {
  glow(g, color, blur, () => line(g, x1, y1, x2, y2, color, width));
}
